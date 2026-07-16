import { z } from "zod";
import { TODO_EXPORT_TOOL, TODO_EXPORT_VERSION } from "./constants";
import type { TodoExportBundle } from "./types";

const MAX_LISTS = 500;
const MAX_TASKS = 50_000;
const MAX_COLUMNS = 5_000;

const nonEmptyText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().max(max).optional();
const finiteNumber = z.number().finite();
const isoDate = z.string().max(64).refine((value) => Number.isFinite(Date.parse(value)), "Invalid date");
const optionalIsoDate = isoDate.optional();

const taskStatusSchema = z.enum(["todo", "doing", "done", "blocked"]);
const taskPrioritySchema = z.enum(["none", "low", "medium", "high", "urgent"]);
const todoListTypeSchema = z.enum(["simple", "student", "work", "life", "team", "checklist", "design", "developer"]);
const todoViewSchema = z.enum(["list", "table", "board", "week", "calendar", "checklist", "print"]);
const taskSourceSchema = z.enum(["manual", "template", "ai", "import"]);

export const taskSchema = z.object({
  id: nonEmptyText(200),
  listId: nonEmptyText(200),
  title: nonEmptyText(500),
  description: optionalText(20_000),
  status: taskStatusSchema,
  completed: z.boolean(),
  priority: taskPrioritySchema,
  parentTaskId: optionalText(200),
  order: finiteNumber,
  dueAt: optionalIsoDate,
  startAt: optionalIsoDate,
  reminderAt: optionalIsoDate,
  repeatRule: optionalText(500),
  tags: z.array(nonEmptyText(100)).max(100),
  estimateMinutes: finiteNumber.nonnegative().max(1_000_000).optional(),
  actualMinutes: finiteNumber.nonnegative().max(1_000_000).optional(),
  assigneeName: optionalText(300),
  section: optionalText(300),
  source: taskSourceSchema,
  createdAt: isoDate,
  updatedAt: isoDate,
  completedAt: optionalIsoDate,
});

export const todoListSchema = z.object({
  id: nonEmptyText(200),
  name: nonEmptyText(300),
  type: todoListTypeSchema,
  color: optionalText(100),
  icon: optionalText(200),
  defaultView: todoViewSchema,
  isArchived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const boardColumnSchema = z.object({
  id: nonEmptyText(200),
  listId: nonEmptyText(200),
  name: nonEmptyText(200),
  status: taskStatusSchema.optional(),
  order: finiteNumber,
  color: optionalText(100),
});

const exportBundleSchema = z.object({
  tool: z.literal(TODO_EXPORT_TOOL).optional(),
  version: z.number().int().min(1).max(TODO_EXPORT_VERSION),
  exportedAt: isoDate,
  lists: z.array(todoListSchema).max(MAX_LISTS),
  tasks: z.array(taskSchema).max(MAX_TASKS),
  columns: z.array(boardColumnSchema).max(MAX_COLUMNS),
});

export type ExportValidationResult = {
  ok: boolean;
  data?: TodoExportBundle;
  error?: string;
};

function duplicateId(values: { id: string }[]): string | null {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value.id)) return value.id;
    seen.add(value.id);
  }
  return null;
}

function hasParentCycle(taskId: string, parentById: Map<string, string | undefined>): boolean {
  const visited = new Set<string>();
  let current: string | undefined = taskId;
  while (current) {
    if (visited.has(current)) return true;
    visited.add(current);
    current = parentById.get(current);
  }
  return false;
}

export function validateImportData(raw: unknown): ExportValidationResult {
  const parsed = exportBundleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((issue) => issue.message).join("; ") };
  }

  const data = parsed.data;
  if (data.version >= 2 && data.tool !== TODO_EXPORT_TOOL) {
    return { ok: false, error: `Expected tool ${TODO_EXPORT_TOOL}` };
  }

  const duplicateListId = duplicateId(data.lists);
  if (duplicateListId) return { ok: false, error: `Duplicate list id ${duplicateListId}` };
  const duplicateTaskId = duplicateId(data.tasks);
  if (duplicateTaskId) return { ok: false, error: `Duplicate task id ${duplicateTaskId}` };
  const duplicateColumnId = duplicateId(data.columns);
  if (duplicateColumnId) return { ok: false, error: `Duplicate column id ${duplicateColumnId}` };

  const listIds = new Set(data.lists.map((list) => list.id));
  const taskById = new Map(data.tasks.map((task) => [task.id, task]));
  const parentById = new Map(data.tasks.map((task) => [task.id, task.parentTaskId]));

  for (const task of data.tasks) {
    if (!listIds.has(task.listId)) {
      return { ok: false, error: `Task ${task.id} references missing list ${task.listId}` };
    }
    if (task.parentTaskId) {
      const parent = taskById.get(task.parentTaskId);
      if (!parent) return { ok: false, error: `Task ${task.id} references missing parent ${task.parentTaskId}` };
      if (parent.listId !== task.listId) {
        return { ok: false, error: `Task ${task.id} and parent ${parent.id} belong to different lists` };
      }
      if (task.parentTaskId === task.id || hasParentCycle(task.id, parentById)) {
        return { ok: false, error: `Task ${task.id} has a cyclic parent relationship` };
      }
    }
  }

  for (const column of data.columns) {
    if (!listIds.has(column.listId)) {
      return { ok: false, error: `Column ${column.id} references missing list ${column.listId}` };
    }
  }

  return {
    ok: true,
    data: {
      tool: TODO_EXPORT_TOOL,
      version: data.version,
      exportedAt: data.exportedAt,
      lists: data.lists,
      tasks: data.tasks,
      columns: data.columns,
    },
  };
}
