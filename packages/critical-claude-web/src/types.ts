export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignee?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
  epicId?: string;
  sprintId?: string;
}

export interface Column {
  id: string;
  title: string;
  status: Task['status'];
  color: string;
}