import { useState } from 'react';
import { X } from 'lucide-react';
import { Task } from '../types';
import './NewTaskForm.css';

interface NewTaskFormProps {
  status: Task['status'];
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function NewTaskForm({ status, onSubmit, onCancel }: NewTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [labels, setLabels] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      labels: labels.split(',').map(l => l.trim()).filter(Boolean),
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Task</h2>
          <button className="close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter task title"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={e => setPriority(e.target.value as Task['priority'])}
              >
                <option value="low">Low 🟢</option>
                <option value="medium">Medium 🟡</option>
                <option value="high">High 🟠</option>
                <option value="critical">Critical 🔴</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="hours">Est. Hours</label>
              <input
                id="hours"
                type="number"
                value={estimatedHours}
                onChange={e => setEstimatedHours(e.target.value)}
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="labels">Labels</label>
            <input
              id="labels"
              type="text"
              value={labels}
              onChange={e => setLabels(e.target.value)}
              placeholder="feature, bug, enhancement (comma separated)"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}