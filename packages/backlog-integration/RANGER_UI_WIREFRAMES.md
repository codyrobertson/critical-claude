# Ranger-Style Task UI Wireframes

## Main View - True Ranger Style

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Critical Claude Task Manager                    Filter: All | Sort: Priority │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─ Tasks (73) ─────────────────────┐ ┌─ Task Details ─────────────────────┐ │
│ │ 📁 Critical Priority (4)         │ │ Title: implement real-time collab  │ │
│ │ 📁 High Priority (12)            │ │ Status: todo                       │ │
│ │ 📁 Medium Priority (45)          │ │ Priority: critical                 │ │
│ │ 📁 Low Priority (12)             │ │ Points: 21                         │ │
│ │                                  │ │ Assignee: unassigned               │ │
│ │ ► Critical Priority/             │ │ Created: 2025-07-11                │ │
│ │   📄 implement real-time collab  │ │                                    │ │
│ │   📄 write comprehensive unit    │ │ Description:                       │ │
│ │   📄 add websocket server        │ │ Complex feature requiring WebSocket│ │
│ │   📄 create authentication       │ │ connections, real-time data sync,  │ │
│ │                                  │ │ and collaborative editing features.│ │
│ │ High Priority/                   │ │                                    │ │
│ │   📄 add accessibility features  │ │ Acceptance Criteria:               │ │
│ │   📄 implement error boundaries  │ │ ☐ WebSocket connection established │ │
│ │   📄 add integration tests       │ │ ☐ Multiple users can edit         │ │
│ │   📄 create data persistence     │ │ ☐ Changes sync in real-time       │ │
│ │   ...                            │ │ ☐ Conflict resolution works       │ │
│ │                                  │ │                                    │ │
│ │ [17/73]                          │ │ Labels: #realtime #collaboration   │ │
│ └──────────────────────────────────┘ └────────────────────────────────────┘ │
│                                                                             │
│ h/l:panels  j/k:nav  /:search  f:filter  s:sort  enter:open  space:toggle  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Collapsed Folders View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Critical Claude Task Manager                    Filter: All | Sort: Priority │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─ Tasks (73) ─────────────────────┐ ┌─ Folder Preview ──────────────────┐ │
│ │ ► 📁 Critical Priority (4)       │ │ Critical Priority Tasks            │ │
│ │   📁 High Priority (12)          │ │                                    │ │
│ │   📁 Medium Priority (45)        │ │ 4 tasks total                      │ │
│ │   📁 Low Priority (12)           │ │ 0 completed, 4 pending            │ │
│ │                                  │ │                                    │ │
│ │ Recent Tasks/                    │ │ Tasks:                             │ │
│ │   📄 implement user auth         │ │ • implement real-time collab (21p)│ │
│ │   📄 add dark mode toggle        │ │ • write comprehensive unit (8p)   │ │
│ │   📄 create mobile layout        │ │ • add websocket server (13p)      │ │
│ │                                  │ │ • create authentication (5p)      │ │
│ │ Completed/                       │ │                                    │ │
│ │   📄 setup project structure     │ │ Total effort: 47 story points     │ │
│ │   📄 create initial wireframes   │ │ Est. completion: 2-3 sprints      │ │
│ │                                  │ │                                    │ │
│ │ Blocked/                         │ │ Press ENTER to expand folder       │ │
│ │   📄 deploy to production        │ │ Press SPACE to mark all complete   │ │
│ │                                  │ │                                    │ │
│ │ [2/8]                            │ │                                    │ │
│ └──────────────────────────────────┘ └────────────────────────────────────┘ │
│                                                                             │
│ h/l:panels  j/k:nav  enter:expand  space:toggle-all  f:filter  q:quit     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Expanded Folder View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Critical Claude Task Manager                    Filter: All | Sort: Priority │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─ Tasks (73) ─────────────────────┐ ┌─ Task Details ─────────────────────┐ │
│ │ 📂 Critical Priority (4)         │ │ Title: implement real-time collab  │ │
│ │ ├─ 📄 implement real-time collab │ │ ID: task-001                       │ │
│ │ ├─ 📄 write comprehensive unit   │ │ Status: todo                       │ │
│ │ ├─ 📄 add websocket server       │ │ Priority: critical                 │ │
│ │ └─ 📄 create authentication      │ │ Story Points: 21                   │ │
│ │                                  │ │ Assignee: unassigned               │ │
│ │ ► 📄 implement real-time collab  │ │ Sprint: Backlog                    │ │
│ │                                  │ │ Epic: Real-time Features           │ │
│ │ 📁 High Priority (12)            │ │                                    │ │
│ │ 📁 Medium Priority (45)          │ │ Dependencies:                      │ │
│ │ 📁 Low Priority (12)             │ │ • setup websocket infrastructure   │ │
│ │                                  │ │ • user authentication system      │ │
│ │ Recent Tasks/                    │ │                                    │ │
│ │   📄 implement user auth         │ │ Time Tracking:                     │ │
│ │   📄 add dark mode toggle        │ │ Estimated: 40h                     │ │
│ │                                  │ │ Actual: 0h                         │ │
│ │ Completed/                       │ │ Remaining: 40h                     │ │
│ │   📄 setup project structure     │ │                                    │ │
│ │                                  │ │ Last Updated: 2025-07-11 14:30    │ │
│ │ [6/73]                           │ │                                    │ │
│ └──────────────────────────────────┘ └────────────────────────────────────┘ │
│                                                                             │
│ h/l:panels  j/k:nav  enter:edit  space:toggle  d:delete  f:focus  q:quit   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Search/Filter Mode

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Critical Claude Task Manager                    Filter: All | Sort: Priority │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Search: /real-time________________                                          │
│                                                                             │
│ ┌─ Search Results (3) ─────────────┐ ┌─ Task Preview ────────────────────┐ │
│ │ 📄 implement real-time collab    │ │ implement real-time collaborative │ │
│ │ 📄 real-time data synchronizati  │ │                                    │ │
│ │ ► 📄 add real-time notifications │ │ Real-time collaborative editing    │ │
│ │                                  │ │ feature that allows multiple users│ │
│ │                                  │ │ to work on the same document      │ │
│ │                                  │ │ simultaneously with live cursor   │ │
│ │                                  │ │ tracking and change broadcasting. │ │
│ │                                  │ │                                    │ │
│ │                                  │ │ Status: todo                       │ │
│ │                                  │ │ Priority: critical                 │ │
│ │                                  │ │ Points: 21                         │ │
│ │                                  │ │                                    │ │
│ │                                  │ │ Similar tasks:                     │ │
│ │                                  │ │ • real-time data sync              │ │
│ │                                  │ │ • websocket implementation        │ │
│ │                                  │ │ • collaborative features           │ │
│ │                                  │ │                                    │ │
│ │ [3/3]                            │ │                                    │ │
│ └──────────────────────────────────┘ └────────────────────────────────────┘ │
│                                                                             │
│ esc:clear-search  enter:open  n/N:next/prev-match  j/k:nav  q:quit        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Task Edit Mode

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Edit Task: implement real-time collaborative editing                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Title: [implement real-time collaborative editing___________________]      │
│                                                                             │
│ Status:    [todo ▼]        Priority: [critical ▼]      Points: [21___]    │
│                                                                             │
│ Assignee: [unassigned_________________]  Sprint: [Backlog___________]      │
│                                                                             │
│ Epic: [Real-time Features_________________________]                        │
│                                                                             │
│ Labels: [#realtime #collaboration #websocket #editor_______________]      │
│                                                                             │
│ Description:                                                                │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Complex feature requiring WebSocket connections for real-time data     │ │
│ │ synchronization and collaborative editing capabilities. Users should   │ │
│ │ be able to see each other's cursors and edits in real-time.           │ │
│ │                                                                         │ │
│ │ Technical requirements:                                                 │ │
│ │ - WebSocket server implementation                                       │ │
│ │ - Operational transformation for conflict resolution                   │ │
│ │ - User presence indicators                                             │ │
│ │ - Cursor position broadcasting                                         │ │
│ │_______________________________________________________________________│ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ Acceptance Criteria:                                                        │
│ ☐ Multiple users can edit simultaneously                                   │
│ ☐ Real-time cursor tracking visible to all users                          │
│ ☐ Text changes broadcast instantly                                         │
│ ☐ Conflict resolution prevents data corruption                            │
│ ☐ User presence indicators show who's online                              │
│                                                                             │
│ [Tab]:next-field  [Shift+Tab]:prev-field  [Ctrl+S]:save  [Esc]:cancel    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Navigation Patterns

### File Manager Style:
- **Folders** - Group tasks by priority, status, or epic
- **Files** - Individual tasks within folders
- **Tree View** - Expandable/collapsible hierarchy
- **Breadcrumbs** - Show current location in hierarchy
- **Two-Panel** - Left for navigation, right for content

### Ranger-Specific Features:
- **h/j/k/l** - Vim navigation (left/down/up/right)
- **Space** - Toggle selection/completion
- **Enter** - Open/expand folder or edit task
- **/** - Search mode
- **g/G** - Go to top/bottom
- **f** - Filter tasks
- **s** - Sort options
- **d** - Delete task
- **y** - Yank (copy) task
- **p** - Paste task

### Visual Hierarchy:
- **📁/📂** - Folders (collapsed/expanded)
- **📄** - Individual tasks
- **►** - Current selection
- **├─└─** - Tree structure lines
- **[n/total]** - Position indicator

This creates a true ranger-like experience where tasks are organized in a hierarchical file-manager style interface!