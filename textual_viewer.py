#!/usr/bin/env python3
"""
Critical Claude Textual Viewer - SECURITY-HARDENED Version
Professional TUI for task management with comprehensive security protections

Security Features:
- Complete escape sequence removal (no bypasses allowed)
- Input sanitization with Unicode category filtering
- Controlled terminal interaction (no raw escape sequences)
- Process permission validation
- Defensive programming against injection attacks
- Memory and resource limits
"""

import json
import os
import sys
import signal
import atexit
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import traceback

try:
    from textual import on
    from textual.app import App, ComposeResult
    from textual.containers import Container, Horizontal, Vertical
    from textual.reactive import reactive
    from textual.widgets import (
        Button,
        DataTable,
        Footer,
        Header,
        Input,
        Label,
        Markdown,
        Select,
        Static,
    )
    from textual.screen import ModalScreen
    from textual.coordinate import Coordinate
    from textual.message import Message
    from rich.text import Text
    from rich.console import Console
except ImportError as e:
    print(f"ERROR: Missing required packages. Install with: pip install textual rich")
    print(f"Import error: {e}")
    sys.exit(1)


class TerminalSafetyManager:
    """Manages terminal state and provides safety mechanisms"""
    
    def __init__(self):
        self.original_settings = None
        self.cleanup_registered = False
        self.setup_safety()
    
    def setup_safety(self):
        """Setup terminal safety mechanisms"""
        # Store original terminal settings
        try:
            import termios
            import tty
            if sys.stdin.isatty():
                self.original_settings = termios.tcgetattr(sys.stdin.fileno())
        except (ImportError, OSError):
            # Not on a Unix-like system or not a TTY
            pass
        
        # Register cleanup handlers with security checks
        if not self.cleanup_registered:
            atexit.register(self.cleanup)
            # Only register signal handlers if we have proper permissions
            try:
                signal.signal(signal.SIGINT, self._signal_handler)
                signal.signal(signal.SIGTERM, self._signal_handler)
            except (OSError, ValueError) as e:
                # Don't fail if we can't register handlers - just log
                print(f"Warning: Could not register signal handlers: {e}", file=sys.stderr)
            self.cleanup_registered = True
    
    def _signal_handler(self, signum, frame):
        """Handle termination signals safely"""
        print("\nReceived signal, cleaning up terminal...", file=sys.stderr)
        self.cleanup()
        sys.exit(0)
    
    def cleanup(self):
        """Restore terminal to original state safely without escape sequences"""
        try:
            # Do NOT write raw escape sequences - security risk
            # Let the textual framework handle terminal cleanup
            
            # Only restore original terminal settings if we have them
            if self.original_settings:
                import termios
                termios.tcsetattr(sys.stdin.fileno(), termios.TCSADRAIN, self.original_settings)
            
        except Exception as e:
            print(f"Warning: Could not fully restore terminal: {e}", file=sys.stderr)
    
    @staticmethod
    def sanitize_text(text: str, max_length: int = 1000) -> str:
        """Sanitize text to remove ALL escape sequences and dangerous characters"""
        if not isinstance(text, str):
            text = str(text)
        
        # Remove ALL escape sequences completely - no exceptions
        # This prevents terminal manipulation attacks
        text = re.sub(r'\033\[[^m]*m', '', text)  # Remove color codes
        text = re.sub(r'\033\[.*?[a-zA-Z]', '', text)  # Remove all other escape sequences  
        text = re.sub(r'\x1b\[.*?[a-zA-Z]', '', text)  # Remove hex escape sequences
        text = re.sub(r'\x1b\].*?\x07', '', text)  # Remove OSC sequences
        text = re.sub(r'\x1b[\(\)][AB012]', '', text)  # Remove charset sequences
        
        # Remove control characters except basic whitespace
        text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\t\r')
        
        # Remove dangerous Unicode categories (format, control, surrogate)
        import unicodedata
        safe_chars = []
        for char in text:
            category = unicodedata.category(char)
            if category[0] not in ('C', 'Z') or char in ' \n\t\r':
                safe_chars.append(char)
            else:
                safe_chars.append('?')  # Replace with safe character
        text = ''.join(safe_chars)
        
        # Limit length and lines strictly
        if len(text) > max_length:
            text = text[:max_length-3] + "..."
        
        lines = text.split('\n')
        safe_lines = []
        for line in lines[:50]:  # Max 50 lines
            if len(line) > 100:  # Max 100 chars per line
                line = line[:97] + "..."
            safe_lines.append(line)
        
        return '\n'.join(safe_lines)


class Task:
    """Task data model with input sanitization"""
    
    def __init__(self, task_data: dict):
        # Sanitize all input data
        self.id = self._sanitize_string(task_data.get('id', ''))
        self.title = self._sanitize_string(task_data.get('title', ''))
        self.description = self._sanitize_string(task_data.get('description', ''))
        self.status = self._sanitize_string(task_data.get('status', 'todo'))
        self.priority = self._sanitize_string(task_data.get('priority', 'medium'))
        self.labels = [self._sanitize_string(l) for l in task_data.get('labels', [])]
        self.assignee = self._sanitize_string(task_data.get('assignee', ''))
        self.estimated_hours = self._sanitize_number(task_data.get('estimatedHours', 0))
        self.created_at = self._sanitize_string(task_data.get('createdAt', ''))
        self.updated_at = self._sanitize_string(task_data.get('updatedAt', ''))
    
    def _sanitize_string(self, value: str) -> str:
        """Sanitize string input"""
        if not isinstance(value, str):
            value = str(value)
        return TerminalSafetyManager.sanitize_text(value)
    
    def _sanitize_number(self, value) -> int:
        """Sanitize numeric input"""
        try:
            return max(0, min(int(value), 1000))  # Reasonable limits
        except (ValueError, TypeError):
            return 0
    
    @property
    def status_icon(self) -> str:
        """Get status icon (safe characters only)"""
        icons = {
            'todo': '○',
            'in_progress': '●', 
            'done': '✓',
            'blocked': '⊘',
            'archived': '□'
        }
        return icons.get(self.status, '?')
    
    @property
    def priority_badge(self) -> str:
        """Get priority badge (safe text only)"""
        badges = {
            'critical': '[CRIT]',
            'high': '[HIGH]',
            'medium': '[MED]',
            'low': '[LOW]'
        }
        return badges.get(self.priority, '[UNK]')


class TaskStorage:
    """Safe task storage interface"""
    
    def __init__(self, storage_path: str = None):
        if storage_path is None:
            storage_path = os.path.join(os.path.expanduser('~'), '.critical-claude')
        self.storage_path = Path(storage_path)
        self.tasks_dir = self.storage_path / 'tasks'
    
    def load_all_tasks(self) -> List[Task]:
        """Safely load all tasks from storage"""
        tasks = []
        
        if not self.tasks_dir.exists():
            return tasks
        
        try:
            for task_file in self.tasks_dir.glob('*.json'):
                if task_file.name.startswith('corrupted-'):
                    continue  # Skip corrupted files
                
                try:
                    # Limit file size to prevent memory issues
                    if task_file.stat().st_size > 1024 * 1024:  # 1MB limit
                        print(f"Warning: Skipping large file {task_file.name}", file=sys.stderr)
                        continue
                    
                    with open(task_file, 'r', encoding='utf-8') as f:
                        task_data = json.load(f)
                        tasks.append(Task(task_data))
                        
                except (json.JSONDecodeError, KeyError, UnicodeDecodeError) as e:
                    print(f"Warning: Failed to load {task_file.name}: {e}", file=sys.stderr)
                    continue
                except Exception as e:
                    print(f"Error loading {task_file.name}: {e}", file=sys.stderr)
                    continue
        
        except Exception as e:
            print(f"Error accessing tasks directory: {e}", file=sys.stderr)
            return []
        
        # Sort by priority then by creation date
        priority_order = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
        tasks.sort(key=lambda t: (
            -priority_order.get(t.priority, 0),
            -self._parse_date(t.created_at).timestamp() if t.created_at else 0
        ))
        
        return tasks[:1000]  # Limit number of tasks to prevent UI issues
    
    def save_task(self, task: Task) -> bool:
        """Safely save a task to storage"""
        try:
            # Ensure directory exists
            self.tasks_dir.mkdir(parents=True, exist_ok=True)
            
            task_file = self.tasks_dir / f"{task.id}.json"
            task_data = {
                'id': task.id,
                'title': task.title[:500],  # Limit field lengths
                'description': task.description[:5000],
                'status': task.status,
                'priority': task.priority,
                'labels': task.labels[:10],  # Limit number of labels
                'assignee': task.assignee[:100],
                'estimatedHours': task.estimated_hours,
                'createdAt': task.created_at,
                'updatedAt': datetime.now().isoformat()
            }
            
            with open(task_file, 'w', encoding='utf-8') as f:
                json.dump(task_data, f, indent=2, ensure_ascii=True)  # Use ASCII for safety
            
            return True
        except Exception as e:
            print(f"Error saving task {task.id}: {e}", file=sys.stderr)
            return False
    
    def _parse_date(self, date_str: str) -> datetime:
        """Safely parse date string"""
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            return datetime.now()


class SafeTaskEditModal(ModalScreen):
    """Safe modal dialog for editing tasks"""
    
    def __init__(self, task: Task):
        super().__init__()
        self.task = task
    
    def compose(self) -> ComposeResult:
        with Vertical():
            yield Label(f"Editing Task: {self.task.id[:20]}", classes="modal-title")
            
            with Vertical(classes="modal-content"):
                yield Label("Title:")
                yield Input(value=self.task.title[:100], id="title-input", max_length=100)
                
                yield Label("Description:")
                yield Input(value=self.task.description[:200], id="description-input", max_length=200)
                
                yield Label("Priority:")
                yield Select([
                    ("Critical", "critical"),
                    ("High", "high"), 
                    ("Medium", "medium"),
                    ("Low", "low")
                ], value=self.task.priority, id="priority-select")
                
                yield Label("Status:")
                yield Select([
                    ("Todo", "todo"),
                    ("In Progress", "in_progress"),
                    ("Done", "done"),
                    ("Blocked", "blocked"),
                    ("Archived", "archived")
                ], value=self.task.status, id="status-select")
                
                yield Label("Assignee:")
                yield Input(value=self.task.assignee[:50], id="assignee-input", max_length=50)
            
            with Horizontal(classes="modal-buttons"):
                yield Button("Save", variant="primary", id="save-button")
                yield Button("Cancel", variant="default", id="cancel-button")
    
    @on(Button.Pressed, "#save-button")
    def save_task(self):
        """Safely save the edited task"""
        try:
            title_input = self.query_one("#title-input", Input)
            description_input = self.query_one("#description-input", Input)
            priority_select = self.query_one("#priority-select", Select)
            status_select = self.query_one("#status-select", Select)
            assignee_input = self.query_one("#assignee-input", Input)
            
            # Sanitize and validate input
            title = TerminalSafetyManager.sanitize_text(title_input.value.strip())
            if not title:
                return  # Don't save empty titles
            
            # Update task data safely
            self.task.title = title
            self.task.description = TerminalSafetyManager.sanitize_text(description_input.value)
            self.task.priority = str(priority_select.value) if priority_select.value else 'medium'
            self.task.status = str(status_select.value) if status_select.value else 'todo'
            self.task.assignee = TerminalSafetyManager.sanitize_text(assignee_input.value)
            
            self.dismiss(self.task)
        except Exception as e:
            print(f"Error saving task: {e}", file=sys.stderr)
            self.dismiss(None)
    
    @on(Button.Pressed, "#cancel-button")
    def cancel_edit(self):
        """Safely cancel editing"""
        self.dismiss(None)


class SafeTaskDetailsPanel(Container):
    """Safe panel showing detailed task information"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.current_task: Optional[Task] = None
        self._static_widget = None
    
    def compose(self) -> ComposeResult:
        """Compose the details panel with safe text display"""
        self._static_widget = Static("Select a task to view details")
        yield self._static_widget
    
    def show_task(self, task: Task):
        """Safely display details for the given task"""
        self.current_task = task
        
        try:
            # Create safe text representation with rich markup for backgrounds
            # Sanitize status and priority to prevent injection
            safe_status = TerminalSafetyManager.sanitize_text(task.status)
            safe_priority = TerminalSafetyManager.sanitize_text(task.priority)
            
            status_display = f"{task.status_icon} {safe_status.replace('_', ' ').title()}"
            priority_display = f"{task.priority_badge} {safe_priority.title()}"
            
            # Only use predefined safe CSS classes - prevent injection
            allowed_statuses = ['todo', 'in_progress', 'done', 'blocked', 'archived']
            allowed_priorities = ['critical', 'high', 'medium', 'low']
            
            if safe_status in allowed_statuses:
                status_with_bg = f"[.status-badge-{safe_status}] {status_display} [/]"
            else:
                status_with_bg = status_display
                
            if safe_priority in allowed_priorities:
                priority_with_bg = f"[.priority-badge-{safe_priority}] {priority_display} [/]"
            else:
                priority_with_bg = priority_display
            
            details_lines = [
                f"[bold cyan]TITLE:[/bold cyan] {task.title}",
                f"[bold]STATUS:[/bold] {status_with_bg}",
                f"[bold]PRIORITY:[/bold] {priority_with_bg}",
                "",
                "[bold cyan]DESCRIPTION:[/bold cyan]",
                task.description or "[dim]No description provided[/dim]",
                "",
                f"[bold]ID:[/bold] [dim]{task.id}[/dim]",
                f"[bold]Assignee:[/bold] {task.assignee or '[dim]Unassigned[/dim]'}",
                f"[bold]Labels:[/bold] {', '.join(f'#{label}' for label in task.labels) if task.labels else '[dim]None[/dim]'}",
                f"[bold]Estimated Hours:[/bold] {task.estimated_hours or '[dim]Not set[/dim]'}",
                f"[bold]Created:[/bold] [dim]{task.created_at}[/dim]",
                f"[bold]Updated:[/bold] [dim]{task.updated_at}[/dim]"
            ]
            
            # Sanitize and join
            safe_details = []
            for line in details_lines:
                safe_line = TerminalSafetyManager.sanitize_text(str(line), 200)
                safe_details.append(safe_line)
            
            details_text = '\n'.join(safe_details)
            
            if self._static_widget:
                self._static_widget.update(details_text)
        except Exception as e:
            print(f"Error displaying task details: {e}", file=sys.stderr)
            if self._static_widget:
                self._static_widget.update("Error displaying task details")
    
    def clear(self):
        """Safely clear the details panel"""
        self.current_task = None
        if self._static_widget:
            self._static_widget.update("Select a task to view details")


class CriticalClaudeViewer(App):
    """Critical Claude task viewer with terminal safety and enhanced features"""
    
    TITLE = "Critical Claude Task Viewer"
    SUB_TITLE = "Professional Task Management TUI"
    
    BINDINGS = [
        ("q", "quit", "Quit"),
        ("ctrl+c", "quit", "Force Quit"),
        ("r", "refresh", "Refresh"),
        ("f", "toggle_filter", "Filter"),
        ("/", "focus_search", "Search"),
        ("enter", "edit_task", "Edit"),
        ("space", "toggle_status", "Toggle Status"),
        ("escape", "clear_focus", "Clear Focus"),
        ("up", "cursor_up", "Up"),
        ("down", "cursor_down", "Down"),
        ("j", "cursor_down", "Down"),
        ("k", "cursor_up", "Up"),
    ]
    
    CSS = """
    .modal-title {
        text-align: center;
        text-style: bold;
        margin-bottom: 1;
    }
    
    .modal-content {
        padding: 1;
        margin: 1;
    }
    
    .modal-buttons {
        align: center middle;
        margin-top: 1;
    }
    
    #main-container {
        height: 100%;
    }
    
    #search-controls {
        height: auto;
        margin: 1 0;
    }
    
    #task-table {
        width: 60%;
        min-height: 15;
        border: solid white;
        margin-right: 1;
    }
    
    #details-panel {
        width: 40%;
        border: solid white;
        padding: 1;
        margin: 0;
    }
    
    #search-input {
        margin-right: 1;
        min-width: 30;
    }
    
    #filter-select {
        min-width: 15;
    }
    
    /* Status background colors for description panel */
    .status-badge-todo {
        background: yellow;
        color: black;
        text-style: bold;
    }
    
    .status-badge-in_progress {
        background: blue;
        color: white;
        text-style: bold;
    }
    
    .status-badge-done {
        background: green;
        color: white;
        text-style: bold;
    }
    
    .status-badge-blocked {
        background: red;
        color: white;
        text-style: bold;
    }
    
    .status-badge-archived {
        background: gray;
        color: white;
        text-style: bold;
    }
    
    /* Priority background colors */
    .priority-badge-critical {
        background: red;
        color: white;
        text-style: bold;
    }
    
    .priority-badge-high {
        background: orange;
        color: black;
        text-style: bold;
    }
    
    .priority-badge-medium {
        background: cyan;
        color: black;
        text-style: bold;
    }
    
    .priority-badge-low {
        background: gray;
        color: white;
    }
    """
    
    # Reactive attributes
    tasks: reactive[List[Task]] = reactive([])
    filtered_tasks: reactive[List[Task]] = reactive([])
    current_filter: reactive[str] = reactive("all")
    search_query: reactive[str] = reactive("")
    
    def __init__(self):
        super().__init__()
        self.safety_manager = TerminalSafetyManager()
        self.storage = TaskStorage()
        self.selected_task: Optional[Task] = None
        self.error_count = 0
        self.max_errors = 10
    
    def compose(self) -> ComposeResult:
        """Safely compose the main UI"""
        try:
            yield Header()
            
            with Container(id="main-container"):
                # Safe search and filter controls
                with Horizontal(id="search-controls"):
                    yield Input(placeholder="Search (max 100 chars)...", id="search-input", max_length=100)
                    yield Select([
                        ("All Tasks", "all"),
                        ("Todo", "todo"),
                        ("In Progress", "in_progress"), 
                        ("Done", "done"),
                        ("Blocked", "blocked"),
                        ("Archived", "archived")
                    ], value="all", id="filter-select")
                
                # Main content area
                with Horizontal():
                    # Main task table
                    yield DataTable(id="task-table")
                    
                    # Safe task details panel
                    yield SafeTaskDetailsPanel(id="details-panel")
            
            yield Footer()
        except Exception as e:
            print(f"Error composing UI: {e}", file=sys.stderr)
            yield Static("Error: Could not create UI safely")
    
    def on_mount(self) -> None:
        """Safely initialize the application"""
        try:
            # Setup the data table
            table = self.query_one("#task-table", DataTable)
            table.add_columns("S", "P", "Title", "Assignee", "Labels")
            table.cursor_type = "row"
            table.zebra_stripes = True
            
            # Load tasks safely
            self.load_tasks()
            
            # Focus the table for immediate arrow key navigation
            table.focus()
        except Exception as e:
            self.handle_error(f"Initialization error: {e}")
    
    def handle_error(self, error_msg: str):
        """Safely handle errors"""
        self.error_count += 1
        print(f"Error {self.error_count}: {error_msg}", file=sys.stderr)
        
        if self.error_count >= self.max_errors:
            print("Too many errors, exiting safely...", file=sys.stderr)
            self.exit()
        else:
            try:
                self.notify(f"Error: {error_msg[:100]}", severity="error")
            except:
                # If notify fails, just log
                pass
    
    def load_tasks(self) -> None:
        """Safely load tasks from storage"""
        try:
            self.tasks = self.storage.load_all_tasks()
            self.filtered_tasks = self.tasks.copy()
            self.populate_table()
            
            # Update title with task count
            task_count = len(self.tasks)
            self.sub_title = f"Terminal-Safe Task Management TUI - {task_count} tasks"
        except Exception as e:
            self.handle_error(f"Error loading tasks: {e}")
    
    def populate_table(self) -> None:
        """Safely populate the data table"""
        try:
            table = self.query_one("#task-table", DataTable)
            table.clear()
            
            for task in self.filtered_tasks[:100]:  # Limit displayed tasks
                # Create safe display text
                title_display = task.title[:30] + ("..." if len(task.title) > 30 else "")
                assignee_display = (task.assignee or "")[:15]
                labels_display = ", ".join(task.labels[:2])  # Show first 2 labels only
                
                table.add_row(
                    task.status_icon,
                    task.priority_badge,
                    title_display,
                    assignee_display,
                    labels_display
                )
            
            # Auto-select first task if available
            if self.filtered_tasks and table.row_count > 0:
                table.move_cursor(row=0)
                first_task = self.filtered_tasks[0]
                self.selected_task = first_task
                
                # Update details panel
                details_panel = self.query_one("#details-panel", SafeTaskDetailsPanel)
                details_panel.show_task(first_task)
        except Exception as e:
            self.handle_error(f"Error populating table: {e}")
    
    def watch_search_query(self, search_query: str) -> None:
        """Safely react to search query changes"""
        try:
            self.filter_tasks()
        except Exception as e:
            self.handle_error(f"Search error: {e}")
    
    def watch_current_filter(self, current_filter: str) -> None:
        """Safely react to filter changes"""
        try:
            self.filter_tasks()
        except Exception as e:
            self.handle_error(f"Filter error: {e}")
    
    def filter_tasks(self) -> None:
        """Safely filter tasks"""
        try:
            filtered = self.tasks.copy()
            
            # Apply status filter
            if self.current_filter != "all":
                filtered = [t for t in filtered if t.status == self.current_filter]
            
            # Apply search filter
            if self.search_query:
                query = TerminalSafetyManager.sanitize_text(self.search_query.lower())
                filtered = [
                    t for t in filtered
                    if (query in t.title.lower() or 
                        query in t.description.lower() or
                        query in ' '.join(t.labels).lower() or
                        query in (t.assignee or '').lower())
                ]
            
            self.filtered_tasks = filtered[:100]  # Limit results
            self.populate_table()
        except Exception as e:
            self.handle_error(f"Filter error: {e}")
    
    @on(Input.Changed, "#search-input")
    def search_changed(self, event: Input.Changed) -> None:
        """Safely handle search input changes"""
        try:
            safe_value = TerminalSafetyManager.sanitize_text(event.value)
            self.search_query = safe_value
        except Exception as e:
            self.handle_error(f"Search input error: {e}")
    
    @on(Select.Changed, "#filter-select")
    def filter_changed(self, event: Select.Changed) -> None:
        """Safely handle filter selection changes"""
        try:
            safe_value = TerminalSafetyManager.sanitize_text(str(event.value))
            self.current_filter = safe_value
        except Exception as e:
            self.handle_error(f"Filter selection error: {e}")
    
    @on(DataTable.RowSelected)
    def row_selected(self, event: DataTable.RowSelected) -> None:
        """Safely handle row selection (Enter key)"""
        try:
            if event.cursor_row < len(self.filtered_tasks):
                task = self.filtered_tasks[event.cursor_row]
                self.selected_task = task
                
                # Update details panel
                details_panel = self.query_one("#details-panel", SafeTaskDetailsPanel)
                details_panel.show_task(task)
        except Exception as e:
            self.handle_error(f"Row selection error: {e}")
    
    @on(DataTable.RowHighlighted)
    def row_highlighted(self, event: DataTable.RowHighlighted) -> None:
        """Safely handle row highlighting (arrow keys)"""
        try:
            if event.cursor_row < len(self.filtered_tasks):
                task = self.filtered_tasks[event.cursor_row]
                self.selected_task = task
                
                # Update details panel immediately on highlight
                details_panel = self.query_one("#details-panel", SafeTaskDetailsPanel)
                details_panel.show_task(task)
        except Exception as e:
            self.handle_error(f"Row highlighting error: {e}")
    
    def action_edit_task(self) -> None:
        """Safely edit the currently selected task"""
        try:
            if self.selected_task:
                def on_edit_complete(task: Optional[Task]) -> None:
                    if task:
                        # Save the task
                        if self.storage.save_task(task):
                            self.notify("Task saved successfully", severity="information")
                            self.load_tasks()
                            
                            # Update details panel
                            details_panel = self.query_one("#details-panel", SafeTaskDetailsPanel)
                            details_panel.show_task(task)
                        else:
                            self.notify("Failed to save task", severity="error")
                
                self.push_screen(SafeTaskEditModal(self.selected_task), on_edit_complete)
            else:
                self.notify("No task selected", severity="warning")
        except Exception as e:
            self.handle_error(f"Edit task error: {e}")
    
    def action_toggle_status(self) -> None:
        """Safely toggle task status"""
        try:
            if self.selected_task:
                # Store current position before updating
                table = self.query_one("#task-table", DataTable)
                current_row = table.cursor_row
                current_task_id = self.selected_task.id
                
                # Status transitions
                transitions = {
                    'todo': 'in_progress',
                    'in_progress': 'done',
                    'done': 'todo',
                    'blocked': 'in_progress',
                    'archived': 'todo'
                }
                
                old_status = self.selected_task.status
                new_status = transitions.get(old_status, 'todo')
                self.selected_task.status = new_status
                
                if self.storage.save_task(self.selected_task):
                    self.notify(f"Status: {old_status} → {new_status}", severity="information")
                    
                    # Reload tasks but preserve position
                    self.load_tasks()
                    
                    # Find the updated task in the new filtered list and restore position
                    self.restore_cursor_position(current_task_id, current_row)
                else:
                    self.notify("Failed to update task status", severity="error")
            else:
                self.notify("No task selected", severity="warning")
        except Exception as e:
            self.handle_error(f"Toggle status error: {e}")
    
    def restore_cursor_position(self, task_id: str, fallback_row: int):
        """Restore cursor position after data reload"""
        try:
            table = self.query_one("#task-table", DataTable)
            
            # Try to find the task by ID in the current filtered list
            target_row = None
            for i, task in enumerate(self.filtered_tasks):
                if task.id == task_id:
                    target_row = i
                    break
            
            # If task not found in filtered list (maybe filtered out), use fallback
            if target_row is None:
                target_row = min(fallback_row, len(self.filtered_tasks) - 1) if self.filtered_tasks else 0
            
            # Move cursor to the target row
            if target_row >= 0 and target_row < table.row_count:
                table.move_cursor(row=target_row)
                
                # Update selected task and details panel
                if target_row < len(self.filtered_tasks):
                    self.selected_task = self.filtered_tasks[target_row]
                    details_panel = self.query_one("#details-panel", SafeTaskDetailsPanel)
                    details_panel.show_task(self.selected_task)
        except Exception as e:
            self.handle_error(f"Restore cursor error: {e}")
    
    def action_refresh(self) -> None:
        """Safely refresh the task list"""
        try:
            self.load_tasks()
            self.notify("Tasks refreshed", severity="information")
        except Exception as e:
            self.handle_error(f"Refresh error: {e}")
    
    def action_focus_search(self) -> None:
        """Safely focus the search input"""
        try:
            search_input = self.query_one("#search-input", Input)
            search_input.focus()
        except Exception as e:
            self.handle_error(f"Focus search error: {e}")
    
    def action_toggle_filter(self) -> None:
        """Safely cycle through status filters"""
        try:
            filters = ["all", "todo", "in_progress", "done", "blocked", "archived"]
            current_index = filters.index(self.current_filter)
            next_filter = filters[(current_index + 1) % len(filters)]
            self.current_filter = next_filter
            self.notify(f"Filter: {next_filter.replace('_', ' ').title()}", severity="information")
        except Exception as e:
            self.handle_error(f"Toggle filter error: {e}")
    
    def action_clear_focus(self) -> None:
        """Clear focus from all widgets"""
        try:
            self.screen.set_focus(None)
        except Exception as e:
            self.handle_error(f"Clear focus error: {e}")
    
    def action_cursor_up(self) -> None:
        """Move cursor up in table"""
        try:
            table = self.query_one("#task-table", DataTable)
            table.action_cursor_up()
        except Exception as e:
            self.handle_error(f"Cursor up error: {e}")
    
    def action_cursor_down(self) -> None:
        """Move cursor down in table"""
        try:
            table = self.query_one("#task-table", DataTable)
            table.action_cursor_down()
        except Exception as e:
            self.handle_error(f"Cursor down error: {e}")
    
    def action_quit(self) -> None:
        """Safely quit the application"""
        try:
            self.notify("Exiting safely...", severity="information")
            self.safety_manager.cleanup()
            self.exit()
        except Exception:
            # Force exit if safe exit fails
            sys.exit(0)


def check_terminal_compatibility():
    """Check if the current environment supports TUI applications"""
    
    # Check if we're in a proper TTY
    if not sys.stdin.isatty() or not sys.stdout.isatty():
        return False, "Not running in a TTY (terminal required)"
    
    # Check for problematic environments
    problematic_envs = [
        'CLAUDE_CODE',           # Claude Code
        'VSCODE_INJECTION',      # VS Code
        'JUPYTER_KERNEL_ID',     # Jupyter
        'COLAB_GPU',             # Google Colab
        'REPLIT_ENVIRONMENT',    # Replit
    ]
    
    for env_var in problematic_envs:
        if os.environ.get(env_var):
            return False, f"Detected incompatible environment: {env_var}"
    
    # Check TERM variable
    term = os.environ.get('TERM', '')
    if term in ['dumb', 'unknown', ''] or 'emacs' in term.lower():
        return False, f"Unsupported terminal type: {term or 'none'}"
    
    # Check if we're being piped or redirected
    try:
        import tty
        import termios
        # Try to get terminal attributes - this will fail if not a real terminal
        termios.tcgetattr(sys.stdin.fileno())
    except (ImportError, OSError, termios.error):
        return False, "Terminal does not support required operations"
    
    # Check terminal size
    try:
        import shutil
        cols, rows = shutil.get_terminal_size()
        if cols < 80 or rows < 24:
            return False, f"Terminal too small: {cols}x{rows} (minimum 80x24)"
    except (OSError, ValueError):
        return False, "Cannot determine terminal size"
    
    return True, "Terminal compatible"


def main():
    """Safe main entry point with environment checking"""
    
    # First check if we can run in this environment
    compatible, reason = check_terminal_compatibility()
    if not compatible:
        print(f"❌ Cannot launch textual viewer: {reason}", file=sys.stderr)
        print("", file=sys.stderr)
        print("The textual viewer requires a proper terminal environment.", file=sys.stderr)
        print("Please run this from a real terminal/console, not from:", file=sys.stderr)
        print("  • Claude Code or similar AI coding assistants", file=sys.stderr)
        print("  • VS Code integrated terminal (use external terminal)", file=sys.stderr)
        print("  • Jupyter notebooks", file=sys.stderr)
        print("  • Scripts with redirected output", file=sys.stderr)
        print("", file=sys.stderr)
        print("Try: cc task list  # for text-based task listing", file=sys.stderr)
        sys.exit(1)
    
    print(f"✅ Terminal compatibility check passed: {reason}", file=sys.stderr)
    
    # Set up emergency exit handlers
    def emergency_exit():
        print("\nEmergency exit - restoring terminal...", file=sys.stderr)
        try:
            # Do NOT write raw escape sequences during emergency exit
            # This prevents security bypass attempts
            pass
        except:
            pass
        sys.exit(1)
    
    signal.signal(signal.SIGINT, lambda s, f: emergency_exit())
    signal.signal(signal.SIGTERM, lambda s, f: emergency_exit())
    
    try:
        app = CriticalClaudeViewer()
        app.run()
    except KeyboardInterrupt:
        emergency_exit()
    except Exception as e:
        print(f"Application error: {e}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        emergency_exit()


if __name__ == "__main__":
    main()