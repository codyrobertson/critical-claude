# Task UI Wireframes - Ranger-like Interface

## Main Task List View
```
╔══════════════════════════════════════════════════════════════╗
║                  🎯 Task Management UI                      ║
║            Beautiful Task List & Management                ║
╚══════════════════════════════════════════════════════════════╝

Filter: [All Tasks ▼]  Sort: [Created ▼]  View: [List ▼]  4 tasks

┌──────────────────────────────────────────────────────────────┐
│ > 1. ⏳ [HIGH] E2E Test: Integration test task          [5pts]│ <- SELECTED
│   2. ⏳ [MED ] create task                              [2pts]│
│   3. ⏳ [MED ] add feature                              [2pts]│
│   4. ⏳ [HIGH] test fast CLI performance                [3pts]│
│   5. 🔄 [CRIT] Fix critical bug in auth                [8pts]│
│   6. ✅ [LOW ] Update documentation                     [1pts]│
└──────────────────────────────────────────────────────────────┘

┌─ Details Panel ──────────────────────────────────────────────┐
│ 📋 E2E Test: Integration test task                          │
│ 🎯 Status: todo         ⚡ Priority: high                   │
│ 📊 Story Points: 5      🏷️  Labels: #e2e #integration       │
│ 👤 Assignee: unassigned 📅 Created: 7/13/2025              │
│ 📝 Description: Testing end-to-end workflow...              │
│                                                              │
│ 🔧 Actions: [E]dit [D]elete [F]ocus [C]omplete [B]lock     │
└──────────────────────────────────────────────────────────────┘

📊 Summary: 6 total | 4 todo | 1 active | 1 done
[F1]Help [F2]Create [F3]Filter [F4]Sort [F5]Sync [ESC]Quit
```

## Task Detail Edit View
```
╔══════════════════════════════════════════════════════════════╗
║                    📝 Edit Task                             ║
╚══════════════════════════════════════════════════════════════╝

┌─ Task Information ───────────────────────────────────────────┐
│ Title: [E2E Test: Integration test task________________]    │
│                                                              │
│ Status: [todo        ▼] Priority: [high      ▼]            │
│                                                              │
│ Story Points: [5__] Assignee: [unassigned_____________]     │
│                                                              │
│ Labels: [#e2e #integration #testing___________________]     │
│                                                              │
│ Description:                                                 │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │Testing end-to-end workflow functionality and ensuring   │ │
│ │all components work together seamlessly.                 │ │
│ │                                                          │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

[TAB]Next Field [SHIFT+TAB]Previous [ENTER]Save [ESC]Cancel
```

## Filter/Sort Selection View
```
╔══════════════════════════════════════════════════════════════╗
║                     🔍 Filter Tasks                        ║
╚══════════════════════════════════════════════════════════════╝

┌─ Filter Options ─────────────────────────────────────────────┐
│ > All Tasks                                             (4) │ <- SELECTED
│   Todo Only                                             (4) │
│   In Progress                                           (0) │
│   Completed                                             (0) │
│   ─────────────────────────────────────────────────────     │
│   High Priority                                         (2) │
│   Medium Priority                                       (2) │
│   Low Priority                                          (0) │
│   Critical Priority                                     (0) │
│   ─────────────────────────────────────────────────────     │
│   Recently Created                                          │
│   Recently Updated                                          │
│   Due Soon                                                  │
└──────────────────────────────────────────────────────────────┘

[↑↓]Navigate [ENTER]Select [ESC]Cancel
```

## Help View
```
╔══════════════════════════════════════════════════════════════╗
║                      📖 Help & Shortcuts                   ║
╚══════════════════════════════════════════════════════════════╝

┌─ Navigation ─────────────────────────────────────────────────┐
│ ↑/↓ or j/k      Navigate tasks up/down                      │
│ PgUp/PgDn       Navigate by pages                           │
│ Home/End        Go to first/last task                       │
│ Mouse Click     Select task                                 │
│ Mouse Scroll    Scroll through tasks                        │
└──────────────────────────────────────────────────────────────┘

┌─ Actions ────────────────────────────────────────────────────┐
│ ENTER           View/Edit selected task                     │
│ SPACE           Toggle task completion                      │
│ d               Delete selected task                        │
│ f               Focus on task (work mode)                   │
│ b               Block task                                  │
│ c               Create new task                             │
│ /               Search tasks                                │
│ r               Refresh view                                │
└──────────────────────────────────────────────────────────────┘

┌─ Function Keys ──────────────────────────────────────────────┐
│ F1              Show this help                              │
│ F2              Create new task                             │
│ F3              Filter tasks                                │
│ F4              Sort tasks                                  │
│ F5              Sync with Claude Code                       │
│ ESC             Quit application                            │
└──────────────────────────────────────────────────────────────┘

[ESC]Close Help
```

## Task Creation View
```
╔══════════════════════════════════════════════════════════════╗
║                     ✨ Create New Task                     ║
╚══════════════════════════════════════════════════════════════╝

┌─ Quick Create ───────────────────────────────────────────────┐
│ Natural Language Input:                                      │
│ [Implement user login @high #auth #security 5pts for:alice] │
│                                                              │
│ ✨ Parsed Preview:                                          │
│ Title:      "Implement user login"                          │
│ Priority:   high                                            │
│ Labels:     #auth #security                                 │
│ Points:     5                                               │
│ Assignee:   alice                                           │
└──────────────────────────────────────────────────────────────┘

┌─ Manual Entry ───────────────────────────────────────────────┐
│ Title: [____________________________________________________] │
│ Priority: [medium   ▼] Points: [2__] Assignee: [_________] │
│ Labels: [#______________________________________________] │
│ Description:                                                 │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │                                                          │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

[TAB]Switch Mode [ENTER]Create [ESC]Cancel
```

## Key Navigation Patterns

### Vim-like Navigation
- `j/k` - Move up/down (like vim)
- `h/l` - Navigate panels left/right  
- `gg/G` - Go to top/bottom
- `/` - Search mode
- `:` - Command mode

### Mouse Support
- Click to select tasks
- Scroll to navigate
- Click buttons/dropdowns
- Drag to resize panels

### Panel System
- Left: Task list (main focus)
- Right: Details panel (auto-updates)
- Bottom: Status bar with actions
- Modal overlays for edit/create/filter

This ranger-like interface provides:
1. **Keyboard-first navigation** with vim bindings
2. **Mouse support** for modern users  
3. **Panel-based layout** like file managers
4. **Context-sensitive actions** in bottom bar
5. **Modal dialogs** for complex operations
6. **Real-time preview** of selections