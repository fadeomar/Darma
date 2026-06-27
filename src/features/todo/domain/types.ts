export type TaskStatus = "todo" | "doing" | "done" | "blocked";

export type TaskPriority = "none" | "low" | "medium" | "high" | "urgent";

export type Task = {
  id: string;
  listId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  completed: boolean;
  priority: TaskPriority;
  parentTaskId?: string;
  order: number;
  dueAt?: string;
  startAt?: string;
  reminderAt?: string;
  repeatRule?: string;
  tags: string[];
  estimateMinutes?: number;
  actualMinutes?: number;
  assigneeName?: string;
  // Optional lightweight grouping used by the Checklist view (e.g. "Pre-flight",
  // "Review"). Plain string so it stays compatible with older exports.
  section?: string;
  source: "manual" | "template" | "ai" | "import";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type TodoListType =
  | "simple"
  | "student"
  | "work"
  | "life"
  | "team"
  | "checklist"
  | "design"
  | "developer";

export type TodoView = "list" | "table" | "board" | "week" | "calendar" | "checklist" | "print";

export type TodoList = {
  id: string;
  name: string;
  type: TodoListType;
  color?: string;
  icon?: string;
  defaultView: TodoView;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BoardColumn = {
  id: string;
  listId: string;
  name: string;
  status?: TaskStatus;
  order: number;
  color?: string;
};

export type TemplateCategory =
  | "Personal"
  | "Student"
  | "Work"
  | "Design"
  | "Developer"
  | "Teacher"
  | "NGO/Proposal"
  | "Content Creator"
  | "Travel"
  | "Home";

export type TodoTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  listType: TodoListType;
  defaultView: TodoView;
  color?: string;
  featured?: boolean;
  tasks: TodoTemplateTask[];
};

export type TodoTemplateTask = {
  title: string;
  description?: string;
  priority?: TaskPriority;
  tags?: string[];
  status?: TaskStatus;
  // Optional checklist grouping for the template.
  section?: string;
  // Optional due date expressed as a day offset from the moment the list is
  // created (0 = today, 1 = tomorrow). Kept optional for backward compatibility.
  dueOffsetDays?: number;
};

export type PrintLayout = "list" | "daily" | "weekly" | "checklist" | "compact";

export type PrintOptions = {
  layout: PrintLayout;
  includeCompleted: boolean;
  includeNotes: boolean;
  includeSubtasks: boolean;
  includeTags: boolean;
  includePriority: boolean;
  includeDue: boolean;
};

export type SidebarFilter =
  | "today"
  | "upcoming"
  | "overdue"
  | "completed"
  | "high-priority"
  | "no-date"
  | "all";

export type SortMode = "manual" | "due" | "priority" | "created" | "status";

export type TodoUiPrefs = {
  activeFilter: SidebarFilter;
  activeListId: string | null;
  activeView: TodoView;
  sortBy: SortMode;
  searchQuery: string;
  selectedTag: string | null;
  inspectorOpen: boolean;
  selectedTaskId: string | null;
  sidebarCollapsed: boolean;
  rolloverDismissedAt: string | null;
};

export type TodoExportBundle = {
  version: number;
  exportedAt: string;
  lists: TodoList[];
  tasks: Task[];
  columns: BoardColumn[];
};
