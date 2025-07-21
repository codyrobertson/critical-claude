import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { UnifiedStorageManager } from '../../critical-claude/dist/core/unified-storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Initialize storage
const storage = new UnifiedStorageManager({
  basePath: path.join(process.cwd(), '../..', '.critical-claude')
});

await storage.initialize();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial tasks
  socket.on('get-tasks', async () => {
    try {
      const tasks = await storage.listTasks();
      socket.emit('tasks-update', tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      socket.emit('error', { message: 'Failed to fetch tasks' });
    }
  });

  // Handle task updates
  socket.on('update-task', async (data) => {
    try {
      await storage.updateTask(data);
      const tasks = await storage.listTasks();
      // Broadcast to all connected clients
      io.emit('tasks-update', tasks);
    } catch (error) {
      console.error('Error updating task:', error);
      socket.emit('error', { message: 'Failed to update task' });
    }
  });

  // Handle task creation
  socket.on('create-task', async (data) => {
    try {
      await storage.createTask(data);
      const tasks = await storage.listTasks();
      io.emit('tasks-update', tasks);
    } catch (error) {
      console.error('Error creating task:', error);
      socket.emit('error', { message: 'Failed to create task' });
    }
  });

  // Handle task deletion
  socket.on('delete-task', async (taskId) => {
    try {
      await storage.deleteTask(taskId);
      const tasks = await storage.listTasks();
      io.emit('tasks-update', tasks);
    } catch (error) {
      console.error('Error deleting task:', error);
      socket.emit('error', { message: 'Failed to delete task' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// REST API endpoints (optional, for non-realtime operations)
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await storage.listTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

const PORT = process.env.PORT || 3003;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});