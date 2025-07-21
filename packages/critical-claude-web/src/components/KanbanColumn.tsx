import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Task, Column } from '../types';
import TaskCard from './TaskCard';
import './KanbanColumn.css';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onAddTask: () => void;
}

export default function KanbanColumn({ column, tasks, onAddTask }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.status,
  });

  return (
    <div className="kanban-column" ref={setNodeRef}>
      <div className="column-header">
        <div className="column-title">
          <span className="column-dot" style={{ backgroundColor: column.color }} />
          <h3>{column.title}</h3>
          <span className="task-count">{tasks.length}</span>
        </div>
        <button className="add-task-btn" onClick={onAddTask}>
          <Plus size={16} />
        </button>
      </div>
      
      <div className="column-content">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}