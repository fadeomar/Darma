import { TODO_EXPORT_VERSION } from "../domain/constants";
import { validateImportData } from "../domain/schema";
import type { BoardColumn, Task, TodoExportBundle, TodoList } from "../domain/types";
import {
  bulkPutColumns,
  bulkPutTasks,
  getAllColumns,
  getAllTasks,
} from "./repositories/tasksRepository";
import { bulkPutLists, getAllLists } from "./repositories/listsRepository";
import { clearTodoDatabase, seedDatabaseIfEmpty } from "./todoDb";

export type ImportMode = "replace" | "merge" | "merge-skip-duplicates";

/* ------------------------------------------------------------------ *
 * Export (JSON)
 * ------------------------------------------------------------------ */

export async function exportTodoData(): Promise<TodoExportBundle> {
  const [lists, tasks, columns] = await Promise.all([getAllLists(), getAllTasks(), getAllColumns()]);
  return {
    version: TODO_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    lists,
    tasks,
    columns,
  };
}

export async function exportTodoJson(): Promise<string> {
  const data = await exportTodoData();
  return JSON.stringify(data, null, 2);
}

/** Export a single list (with its tasks and columns) as a valid import bundle. */
export async function exportListJson(listId: string): Promise<string> {
  const [lists, tasks, columns] = await Promise.all([getAllLists(), getAllTasks(), getAllColumns()]);
  const list = lists.find((l) => l.id === listId);
  const bundle: TodoExportBundle = {
    version: TODO_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    lists: list ? [list] : [],
    tasks: tasks.filter((t) => t.listId === listId),
    columns: columns.filter((c) => c.listId === listId),
  };
  return JSON.stringify(bundle, null, 2);
}

/* ------------------------------------------------------------------ *
 * Text / Markdown export (pure, testable)
 * ------------------------------------------------------------------ */

export type TextExportOptions = {
  title?: string;
  includeCompleted?: boolean;
  includeSubtasks?: boolean;
  includeTags?: boolean;
  includePriority?: boolean;
  includeDue?: boolean;
  includeNotes?: boolean;
};

const DEFAULT_TEXT_OPTIONS: Required<Omit<TextExportOptions, "title">> = {
  includeCompleted: true,
  includeSubtasks: true,
  includeTags: true,
  includePriority: true,
  includeDue: true,
  includeNotes: false,
};

function childrenOf(allTasks: Task[], parentId: string): Task[] {
  return allTasks
    .filter((t) => t.parentTaskId === parentId)
    .sort((a, b) => a.order - b.order);
}

function dueDay(iso?: string): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

/**
 * Render top-level `tasks` (and their subtasks, found in `allTasks`) as
 * GitHub-flavored Markdown checkboxes.
 */
export function buildMarkdown(tasks: Task[], allTasks: Task[], options: TextExportOptions = {}): string {
  const opts = { ...DEFAULT_TEXT_OPTIONS, ...options };
  const lines: string[] = [];
  if (opts.title) {
    lines.push(`# ${opts.title}`, "");
  }

  const top = tasks
    .filter((t) => !t.parentTaskId)
    .filter((t) => opts.includeCompleted || !t.completed)
    .sort((a, b) => a.order - b.order);

  for (const task of top) {
    lines.push(renderMarkdownTask(task, opts));
    if (opts.includeNotes && task.description?.trim()) {
      lines.push(`  > ${task.description.trim().replace(/\n+/g, " ")}`);
    }
    if (opts.includeSubtasks) {
      for (const sub of childrenOf(allTasks, task.id)) {
        if (!opts.includeCompleted && sub.completed) continue;
        lines.push(`  ${renderMarkdownTask(sub, { ...opts, includeTags: false, includePriority: false, includeDue: false })}`);
      }
    }
  }

  return lines.join("\n");
}

function renderMarkdownTask(task: Task, opts: Required<Omit<TextExportOptions, "title">>): string {
  const box = task.completed ? "[x]" : "[ ]";
  const parts = [`- ${box} ${task.title}`];
  if (opts.includeTags && task.tags.length) parts.push(task.tags.map((t) => `#${t}`).join(" "));
  if (opts.includePriority && task.priority !== "none") parts.push(`@${task.priority}`);
  const due = opts.includeDue ? dueDay(task.dueAt) : null;
  if (due) parts.push(`due:${due}`);
  return parts.join(" ");
}

/** Render top-level `tasks` (and subtasks) as indented plain text. */
export function buildPlainText(tasks: Task[], allTasks: Task[], options: TextExportOptions = {}): string {
  const opts = { ...DEFAULT_TEXT_OPTIONS, ...options };
  const lines: string[] = [];
  if (opts.title) {
    lines.push(opts.title, "");
  }

  const top = tasks
    .filter((t) => !t.parentTaskId)
    .filter((t) => opts.includeCompleted || !t.completed)
    .sort((a, b) => a.order - b.order);

  for (const task of top) {
    lines.push(`${task.completed ? "[x]" : "[ ]"} ${task.title}`);
    if (opts.includeNotes && task.description?.trim()) {
      lines.push(`    ${task.description.trim().replace(/\n+/g, " ")}`);
    }
    if (opts.includeSubtasks) {
      for (const sub of childrenOf(allTasks, task.id)) {
        if (!opts.includeCompleted && sub.completed) continue;
        lines.push(`    - ${sub.completed ? "(done) " : ""}${sub.title}`);
      }
    }
  }

  return lines.join("\n");
}

/* ------------------------------------------------------------------ *
 * Import (JSON)
 * ------------------------------------------------------------------ */

export type ImportDuplicateSummary = {
  listNames: string[];
  taskTitles: string[];
};

export type ImportSummary = {
  ok: boolean;
  counts?: { lists: number; tasks: number; columns: number };
  duplicates?: ImportDuplicateSummary;
  error?: string;
};

function normalizeComparable(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function detectImportDuplicates(
  incoming: Pick<TodoExportBundle, "lists" | "tasks">,
  existingLists: TodoList[] = [],
  existingTasks: Task[] = [],
): ImportDuplicateSummary {
  const existingListNames = new Set(existingLists.map((l) => normalizeComparable(l.name)));
  const existingTaskTitles = new Set(existingTasks.map((t) => normalizeComparable(t.title)));
  const listNames = [...new Set(incoming.lists.map((l) => l.name).filter((n) => existingListNames.has(normalizeComparable(n))))];
  const taskTitles = [...new Set(incoming.tasks.map((t) => t.title).filter((n) => existingTaskTitles.has(normalizeComparable(n))))].slice(0, 20);
  return { listNames, taskTitles };
}

/** Validate a raw value and report counts without mutating storage. */
export function summarizeImport(raw: unknown, existingLists: TodoList[] = [], existingTasks: Task[] = []): ImportSummary {
  const validation = validateImportData(raw);
  if (!validation.ok || !validation.data) return { ok: false, error: validation.error };
  const { lists, tasks, columns } = validation.data;
  return {
    ok: true,
    counts: { lists: lists.length, tasks: tasks.length, columns: columns.length },
    duplicates: detectImportDuplicates({ lists, tasks }, existingLists, existingTasks),
  };
}

export function summarizeImportJson(json: string, existingLists: TodoList[] = [], existingTasks: Task[] = []): ImportSummary {
  try {
    return summarizeImport(JSON.parse(json) as unknown, existingLists, existingTasks);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
}

/** Remap every id in a bundle to a fresh one so a merge never collides. */
function remapBundle(lists: TodoList[], tasks: Task[], columns: BoardColumn[]) {
  const listIdMap = new Map<string, string>();
  const taskIdMap = new Map<string, string>();
  for (const l of lists) listIdMap.set(l.id, `list-${crypto.randomUUID()}`);
  for (const t of tasks) taskIdMap.set(t.id, `task-${crypto.randomUUID()}`);

  const newLists = lists.map((l) => ({ ...l, id: listIdMap.get(l.id) as string }));
  const newTasks = tasks.map((t) => ({
    ...t,
    id: taskIdMap.get(t.id) as string,
    listId: listIdMap.get(t.listId) ?? t.listId,
    parentTaskId: t.parentTaskId ? taskIdMap.get(t.parentTaskId) ?? undefined : undefined,
    source: "import" as const,
  }));
  const newColumns = columns.map((c) => ({
    ...c,
    id: `col-${crypto.randomUUID()}`,
    listId: listIdMap.get(c.listId) ?? c.listId,
  }));
  return { lists: newLists, tasks: newTasks, columns: newColumns };
}

function removeLikelyDuplicateLists(
  lists: TodoList[],
  tasks: Task[],
  columns: BoardColumn[],
  existingLists: TodoList[],
) {
  const existingNames = new Set(existingLists.map((l) => normalizeComparable(l.name)));
  const keptLists = lists.filter((l) => !existingNames.has(normalizeComparable(l.name)));
  const keptListIds = new Set(keptLists.map((l) => l.id));
  return {
    lists: keptLists,
    tasks: tasks.filter((t) => keptListIds.has(t.listId)),
    columns: columns.filter((c) => keptListIds.has(c.listId)),
  };
}

export type ImportResult = {
  ok: boolean;
  counts?: { lists: number; tasks: number; columns: number };
  skipped?: { lists: number; tasks: number; columns: number };
  error?: string;
};

export async function importTodoData(raw: unknown, mode: ImportMode = "replace"): Promise<ImportResult> {
  const validation = validateImportData(raw);
  if (!validation.ok || !validation.data) return { ok: false, error: validation.error };

  let { lists, tasks, columns } = validation.data;
  const originalCounts = { lists: lists.length, tasks: tasks.length, columns: columns.length };

  if (mode === "merge" || mode === "merge-skip-duplicates") {
    if (mode === "merge-skip-duplicates") {
      const existingLists = await getAllLists();
      const filtered = removeLikelyDuplicateLists(lists, tasks, columns, existingLists);
      lists = filtered.lists;
      tasks = filtered.tasks;
      columns = filtered.columns;
    }
    // Generate fresh ids so merging never overwrites existing data.
    const remapped = remapBundle(lists, tasks, columns);
    lists = remapped.lists;
    tasks = remapped.tasks;
    columns = remapped.columns;
    await bulkPutLists(lists);
    await bulkPutColumns(columns);
    await bulkPutTasks(tasks);
  } else {
    await clearTodoDatabase();
    await bulkPutLists(lists);
    await bulkPutColumns(columns);
    await bulkPutTasks(tasks);
    if (lists.length === 0) await seedDatabaseIfEmpty();
  }

  return {
    ok: true,
    counts: { lists: lists.length, tasks: tasks.length, columns: columns.length },
    skipped: {
      lists: originalCounts.lists - lists.length,
      tasks: originalCounts.tasks - tasks.length,
      columns: originalCounts.columns - columns.length,
    },
  };
}

export async function importTodoJson(json: string, mode: ImportMode = "replace"): Promise<ImportResult> {
  try {
    const parsed = JSON.parse(json) as unknown;
    return importTodoData(parsed, mode);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
}
