# Critical Claude Web - Modern Kanban Board

A real-time collaborative Kanban board for Critical Claude task management with WebSocket live sync.

## Features

- 🎯 **Real-time Sync** - Changes appear instantly across all connected clients
- 🎨 **Modern UI** - Clean, dark theme with smooth animations
- 🖱️ **Drag & Drop** - Intuitive task management between columns
- 🏷️ **Rich Tasks** - Priority levels, labels, time estimates
- 🔄 **Live Updates** - WebSocket-based synchronization
- 📱 **Responsive** - Works on desktop and tablet

## Getting Started

### Quick Start (Recommended)

1. Install dependencies:
```bash
npm install
```

2. Start everything with the orchestrator:
```bash
npm start
```

The orchestrator will:
- 🔍 Automatically find available ports
- ⚙️ Update all config files dynamically
- 🚀 Start both backend and frontend servers
- 📱 Open your browser automatically
- 🔄 Handle graceful shutdown with Ctrl+C

### Manual Start (Alternative)

If you prefer manual control:

1. Start the server (in one terminal):
```bash
npm run server
```

2. Start the frontend (in another terminal):
```bash
npm run dev
```

### Health Check

Check which services are running:
```bash
npm run health
```

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express + Socket.IO
- **Storage**: Uses Critical Claude's UnifiedStorage
- **UI Libraries**: @dnd-kit for drag & drop, Lucide for icons

## Task States

- **To Do** - Tasks waiting to be started
- **In Progress** - Currently being worked on
- **Blocked** - Tasks with dependencies or blockers
- **Done** - Completed tasks

## Priority Levels

- 🔴 Critical
- 🟠 High
- 🟡 Medium
- 🟢 Low