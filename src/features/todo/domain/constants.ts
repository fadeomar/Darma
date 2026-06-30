import type { BoardColumn, PrintOptions, TaskPriority, TaskStatus, TemplateCategory, TodoList } from "./types";

export const TODO_DB_NAME = "darma-todo";
export const TODO_DB_VERSION = 1;
export const TODO_UI_STORAGE_KEY = "darma-todo-ui:v1";
export const TODO_EXPORT_VERSION = 1;

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

export const STATUS_ORDER: Record<TaskStatus, number> = {
  todo: 0,
  doing: 1,
  blocked: 2,
  done: 3,
};

export const DEFAULT_BOARD_COLUMNS: Omit<BoardColumn, "id" | "listId">[] = [
  { name: "To Do", status: "todo", order: 0, color: "#6B7280" },
  { name: "Doing", status: "doing", order: 1, color: "#2563EB" },
  { name: "Done", status: "done", order: 2, color: "#10B981" },
  { name: "Blocked", status: "blocked", order: 3, color: "#EF4444" },
];

export const SEED_LISTS: Omit<TodoList, "createdAt" | "updatedAt">[] = [
  { id: "list-today", name: "Today", type: "simple", color: "#2563EB", defaultView: "list", isArchived: false },
  { id: "list-personal", name: "Personal", type: "life", color: "#8B5CF6", defaultView: "list", isArchived: false },
  { id: "list-work", name: "Work", type: "work", color: "#F59E0B", defaultView: "board", isArchived: false },
  { id: "list-study", name: "Study", type: "student", color: "#10B981", defaultView: "list", isArchived: false },
];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  doing: "Doing",
  done: "Done",
  blocked: "Blocked",
};

export const VIEW_LABELS: Record<string, string> = {
  list: "List",
  table: "Table",
  board: "Board",
  week: "Week",
  calendar: "Calendar",
  checklist: "Checklist",
  print: "Print",
};

// All views below are now fully implemented; "calendar" remains the only view
// without a dedicated screen and falls back to the week planner.
export const COMING_SOON_VIEWS: string[] = [];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "Personal",
  "Student",
  "Work",
  "Design",
  "Developer",
  "Teacher",
  "NGO/Proposal",
  "Content Creator",
  "Travel",
  "Home",
];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  layout: "list",
  includeCompleted: true,
  includeNotes: false,
  includeSubtasks: true,
  includeTags: true,
  includePriority: true,
  includeDue: true,
};

export const RECENT_TEMPLATES_KEY = "darma-todo-recent-templates:v1";
