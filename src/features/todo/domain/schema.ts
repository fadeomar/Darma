import { z } from "zod";
import { TODO_EXPORT_VERSION } from "./constants";

const taskStatusSchema = z.enum(["todo", "doing", "done", "blocked"]);
const taskPrioritySchema = z.enum(["none", "low", "medium", "high", "urgent"]);
const todoListTypeSchema = z.enum(["simple", "student", "work", "life", "team", "checklist", "design", "developer"]);
const todoViewSchema = z.enum(["list", "table", "board", "week", "calendar", "checklist", "print"]);
const taskSourceSchema = z.enum(["manual", "template", "ai", "import"]);

export const taskSchema = z.object({
  id: z.string().min(1),
  listId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: taskStatusSchema,
  completed: z.boolean(),
  priority: taskPrioritySchema,
  parentTaskId: z.string().optional(),
  order: z.number(),
  dueAt: z.string().optional(),
  startAt: z.string().optional(),
  reminderAt: z.string().optional(),
  repeatRule: z.string().optional(),
  tags: z.array(z.string()),
  estimateMinutes: z.number().optional(),
  actualMinutes: z.number().optional(),
  assigneeName: z.string().optional(),
  section: z.string().optional(),
  source: taskSourceSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
});

export const todoListSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: todoListTypeSchema,
  color: z.string().optional(),
  icon: z.string().optional(),
  defaultView: todoViewSchema,
  isArchived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const boardColumnSchema = z.object({
  id: z.string().min(1),
  listId: z.string().min(1),
  name: z.string().min(1),
  status: taskStatusSchema.optional(),
  order: z.number(),
  color: z.string().optional(),
});

export const exportBundleSchema = z.object({
  version: z.number(),
  exportedAt: z.string(),
  lists: z.array(todoListSchema),
  tasks: z.array(taskSchema),
  columns: z.array(boardColumnSchema),
});

// Note: this project compiles with `strict: false`, where TypeScript does not
// narrow boolean-discriminated unions (`if (!result.ok)` won't reveal `error`).
// Use a flat shape with optional fields so callers can read `.error`/`.data`
// safely without relying on narrowing.
export type ExportValidationResult = {
  ok: boolean;
  data?: z.infer<typeof exportBundleSchema>;
  error?: string;
};

export function validateImportData(raw: unknown): ExportValidationResult {
  const parsed = exportBundleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  if (parsed.data.version > TODO_EXPORT_VERSION) {
    return { ok: false, error: `Unsupported export version ${parsed.data.version}` };
  }
  const listIds = new Set(parsed.data.lists.map((l) => l.id));
  for (const task of parsed.data.tasks) {
    if (!listIds.has(task.listId)) {
      return { ok: false, error: `Task ${task.id} references missing list ${task.listId}` };
    }
  }
  for (const col of parsed.data.columns) {
    if (!listIds.has(col.listId)) {
      return { ok: false, error: `Column ${col.id} references missing list ${col.listId}` };
    }
  }
  return { ok: true, data: parsed.data };
}
