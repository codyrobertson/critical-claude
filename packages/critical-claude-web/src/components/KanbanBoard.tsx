import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, Column } from '../types';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import NewTaskForm from './NewTaskForm';
import './KanbanBoard.css';

const COLUMNS: Column[] = [
  { id: 'todo', title: 'To Do', status: 'todo', color: '#6b7280' },
  { id: 'in_progress', title: 'In Progress', status: 'in_progress', color: '#3b82f6' },
  { id: 'blocked', title: 'Blocked', status: 'blocked', color: '#ef4444' },
  { id: 'done', title: 'Done', status: 'done', color: '#10b981' },
];

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onCreateTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function KanbanBoard({ tasks, onUpdateTask, onCreateTask, onDeleteTask }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState<Task['status']>('todo');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      todo: [],
      in_progress: [],
      blocked: [],
      done: [],
    };
    
    tasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    // Sort tasks within each column by priority then by date
    Object.keys(grouped).forEach(status => {
      grouped[status].sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    });

    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];
    
    // Check if it's a valid column
    if (COLUMNS.find(col => col.status === newStatus)) {
      onUpdateTask(taskId, { status: newStatus });
    }

    setActiveId(null);
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <div className="kanban-board">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-columns">
          {COLUMNS.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByStatus[column.status]}
              onAddTask={() => {
                setNewTaskColumn(column.status);
                setShowNewTask(true);
              }}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {showNewTask && (
        <NewTaskForm
          status={newTaskColumn}
          onSubmit={(task) => {
            onCreateTask(task);
            setShowNewTask(false);
          }}
          onCancel={() => setShowNewTask(false)}
        />
      )}
    </div>
  );
}