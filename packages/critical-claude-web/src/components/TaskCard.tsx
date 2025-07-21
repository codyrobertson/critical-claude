import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, AlertCircle, Flag } from 'lucide-react';
import { Task } from '../types';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const PRIORITY_ICONS = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
};

export default function TaskCard({ task, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="task-header">
        <span className="priority-icon">{PRIORITY_ICONS[task.priority]}</span>
        <h4 className="task-title">{task.title}</h4>
      </div>
      
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      
      <div className="task-meta">
        {task.estimatedHours && (
          <div className="meta-item">
            <Clock size={12} />
            <span>{task.estimatedHours}h</span>
          </div>
        )}
        
        {task.labels.length > 0 && (
          <div className="task-labels">
            {task.labels.slice(0, 2).map(label => (
              <span key={label} className="label">{label}</span>
            ))}
            {task.labels.length > 2 && (
              <span className="label">+{task.labels.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}