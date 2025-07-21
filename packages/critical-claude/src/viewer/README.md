# Terminal Task Viewer

A hyper-performant terminal-based task viewer with vim keybindings, following Domain-Driven Design and SOLID principles.

## Architecture Overview

The application follows a clean architecture pattern with four distinct layers:

### 1. Domain Layer (`/domain`)
- **Entities**: Core business objects (Task)
- **Value Objects**: Immutable domain concepts (TaskId, TaskStatus, TaskPriority, TaskMetadata)
- **Repositories**: Interfaces for data access
- **Events**: Domain events for state changes

### 2. Application Layer (`/application`)
- **Use Cases**: Business logic implementation (ViewTasks, SearchTasks, UpdateTask)
- **Services**: Application services (TaskSubscriptionService)
- **Ports**: Interfaces for external dependencies (IEventBus, ITerminalUI, ILogger)

### 3. Infrastructure Layer (`/infrastructure`)
- **Terminal UI**: Blessed-based terminal interface implementation
- **Data Access**: Repository implementations (InMemoryTaskRepository)
- **Event Bus**: Event handling infrastructure
- **Logging**: Logging implementation

### 4. Presentation Layer (`/presentation`)
- **Views**: UI components (TaskListView, TaskDetailView, SearchView)
- **Controllers**: View orchestration (TaskViewerController)
- **View Models**: Data transformation for presentation
- **Keybindings**: Vim-style keyboard navigation

## Features

### Core Features
- **LF-like Interface**: Terminal file manager inspired UI
- **Vim Keybindings**: Full vim-style navigation and commands
- **Split Pane Views**: Horizontal and vertical split layouts
- **Real-time Updates**: Event-driven architecture for instant updates
- **Fuzzy Search**: Advanced fuzzy search with highlighting
- **Hyper-performant**: Optimized rendering and data handling

### Task Management
- View tasks in a list format
- Detailed task view with metadata
- Search tasks with fuzzy matching
- Filter by status, priority, tags
- Sort by various fields
- Real-time task updates

### Keyboard Shortcuts

#### Navigation (Normal Mode)
- `j`, `↓`: Move down
- `k`, `↑`: Move up
- `h`, `←`: Move left
- `l`, `→`: Move right
- `g`: Go to first task
- `G`: Go to last task
- `Ctrl+f`: Page down
- `Ctrl+b`: Page up

#### Task Operations
- `Enter`: Open task details
- `Space`: Toggle task status
- `tc`: Complete task
- `tp`: Change priority
- `tt`: Add tag
- `td`: Delete task

#### View Management
- `/`: Enter search mode
- `Tab`: Switch focus between panes
- `1`: Single pane view
- `2`: Horizontal split view
- `3`: Vertical split view
- `q`: Close current view
- `Ctrl+q`: Quit application

#### Search Mode
- Type to search
- `Enter`: Select result
- `Escape`: Cancel search
- `↑`/`↓`: Navigate results

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)
- Each class has a single, well-defined responsibility
- Domain entities handle business logic
- Views handle presentation
- Use cases orchestrate business operations

### Open/Closed Principle (OCP)
- Extensible through interfaces
- New features can be added without modifying existing code
- Plugin-based architecture for views and repositories

### Liskov Substitution Principle (LSP)
- All implementations can be substituted for their interfaces
- Consistent behavior across different implementations

### Interface Segregation Principle (ISP)
- Small, focused interfaces
- Clients depend only on methods they use
- Separate interfaces for different concerns

### Dependency Inversion Principle (DIP)
- High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)
- Infrastructure details are injected

## Performance Optimizations

### Rendering
- Differential rendering (only redraw changed parts)
- Frame rate limiting (60 FPS)
- Double buffering for smooth updates
- Throttled scroll and resize events

### Data Handling
- Efficient in-memory indexing
- Lazy loading for large datasets
- Pagination support
- Optimized search algorithms

### Memory Management
- Event handler cleanup
- Proper disposal of resources
- Weak references where appropriate
- Memory pool for frequent allocations

## Usage

```typescript
import { TaskViewerApplication } from './viewer';

// Create and start the application
const app = new TaskViewerApplication();
await app.start();

// The application will run until the user quits (Ctrl+q)
```

## Extension Points

### Custom Views
Implement the `IView` interface to create custom views:

```typescript
class CustomView extends BaseView {
  async initialize(): Promise<void> {
    // Setup view
  }
  
  render(): void {
    // Render view
  }
  
  onKeyPress(key: string, modifiers: KeyModifiers): boolean {
    // Handle input
    return false;
  }
}
```

### Custom Repositories
Implement `ITaskRepository` for different data sources:

```typescript
class MongoTaskRepository implements ITaskRepository {
  // Implement all repository methods
}
```

### Custom Key Bindings
Extend the VimKeybindings class:

```typescript
class CustomKeybindings extends VimKeybindings {
  constructor() {
    super();
    this.addCommand({
      keys: ['g', 'c'],
      mode: ['normal'],
      action: 'custom-action',
      description: 'Custom action'
    });
  }
}
```

## Testing

The architecture supports comprehensive testing:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test layer interactions
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Measure rendering and data handling performance

## Future Enhancements

- [ ] Mouse support
- [ ] Custom color themes
- [ ] Task templates
- [ ] Batch operations
- [ ] Undo/redo system
- [ ] Plugin system
- [ ] Remote data sources
- [ ] Export functionality