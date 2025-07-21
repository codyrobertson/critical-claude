import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import KanbanBoard from './components/KanbanBoard';
import { Task } from './types';
import './App.css';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket server
    const newSocket = io('http://localhost:3003');
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      newSocket.emit('get-tasks');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('tasks-update', (updatedTasks: Task[]) => {
      setTasks(updatedTasks);
    });

    newSocket.on('error', (error: { message: string }) => {
      console.error('Server error:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    if (socket) {
      socket.emit('update-task', { id: taskId, ...updates });
    }
  };

  const createTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (socket) {
      socket.emit('create-task', task);
    }
  };

  const deleteTask = (taskId: string) => {
    if (socket) {
      socket.emit('delete-task', taskId);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Critical Claude</h1>
        <div className="status">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`} />
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </header>
      <KanbanBoard 
        tasks={tasks}
        onUpdateTask={updateTask}
        onCreateTask={createTask}
        onDeleteTask={deleteTask}
      />
    </div>
  );
}

export default App;