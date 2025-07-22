# Task Management Domain Migration

## Overview

This document outlines the migration of core task management functionality from the legacy `packages/critical-claude/src/commands/unified-task.ts` file to the new DDD (Domain-Driven Design) structure.

## Migrated Use Cases

The following use cases have been extracted and created in `src/application/use-cases/`:

### Core Operations
1. **CreateTaskUseCase** - Create new tasks
2. **ListTasksUseCase** - List and filter tasks  
3. **ViewTaskUseCase** - View individual task details
4. **UpdateTaskUseCase** - Update existing tasks
5. **DeleteTaskUseCase** - Delete tasks permanently
6. **ArchiveTaskUseCase** - Archive tasks (soft delete)
7. **GetTaskStatsUseCase** - Get task statistics and metrics

### Application Service
- **TaskService** - High-level service orchestrating all task operations

## Key Simplifications

### Removed Complexity
- **Event Sourcing**: Removed complex event sourcing patterns
- **Complex Domain Events**: Simplified to basic operation responses
- **Heavy Abstractions**: Used simple, focused interfaces
- **AI Features**: Excluded AI-related functionality (moved to separate domain)
- **Template System**: Excluded template loading (moved to template-system domain)

### Simplified Patterns
- **Repository Pattern**: Uses simple `Repository<T>` interface from shared types
- **Result Pattern**: Consistent `{ success: boolean, data?, error? }` response format
- **Immutable Entities**: Task entity uses immutable pattern with factory methods
- **Local Types**: Domain uses local type definitions to avoid cross-domain dependencies

## Code Organization

```
src/
├── application/
│   ├── services/
│   │   ├── TaskService.ts          # High-level orchestration
│   │   └── index.ts
│   └── use-cases/
│       ├── CreateTaskUseCase.ts
│       ├── ListTasksUseCase.ts
│       ├── ViewTaskUseCase.ts
│       ├── UpdateTaskUseCase.ts
│       ├── DeleteTaskUseCase.ts
│       ├── ArchiveTaskUseCase.ts
│       ├── GetTaskStatsUseCase.ts
│       └── index.ts
├── domain/
│   ├── entities/
│   │   └── Task.ts                 # Core task entity
│   ├── repositories/
│   │   └── ITaskRepository.ts      # Repository interface
│   └── services/
│       └── TaskDomainService.ts    # Domain business logic
└── shared/
    └── types.ts                    # Local type definitions
```

## Legacy Functionality Mapping

| Legacy Method | New Use Case | Notes |
|---------------|--------------|-------|
| `createTask()` | CreateTaskUseCase | Natural language parsing removed |
| `listTasks()` | ListTasksUseCase | Simplified filtering logic |
| `viewTask()` | ViewTaskUseCase | Direct task retrieval |
| `editTask()` | UpdateTaskUseCase | Immutable update pattern |
| `deleteTask()` | DeleteTaskUseCase | Hard delete operation |
| `archiveTask()` | ArchiveTaskUseCase | Status update to 'archived' |
| `showStats()` | GetTaskStatsUseCase | Simplified metrics calculation |

## Business Logic Preserved

### Task Entity Features
- ✅ Status management (todo, in_progress, done, blocked, archived)
- ✅ Priority levels (critical, high, medium, low)
- ✅ Labels and assignee support
- ✅ Time tracking (estimated hours)
- ✅ Dependencies between tasks
- ✅ Draft mode support

### Repository Operations
- ✅ CRUD operations
- ✅ Filtering by status, priority, assignee, labels
- ✅ Sorting by various fields
- ✅ Archive/draft filtering
- ✅ Basic statistics

### Domain Services
- ✅ Dependency calculation
- ✅ Task completion validation
- ✅ Complexity estimation
- ✅ Related task suggestions

## Next Steps

1. **Infrastructure Layer**: Implement concrete repository using the legacy storage
2. **Integration**: Wire up use cases with existing CLI commands
3. **Migration Script**: Create script to migrate existing task data
4. **Testing**: Add comprehensive unit and integration tests
5. **Documentation**: Update API documentation for new structure

## Benefits of Migration

- **Clean Architecture**: Clear separation of concerns
- **Testability**: Each use case can be tested in isolation
- **Maintainability**: Simpler, focused classes
- **Extensibility**: Easy to add new operations
- **Type Safety**: Strong typing throughout
- **Domain Focus**: Business logic clearly separated from infrastructure