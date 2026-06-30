import { DEFAULT_BOARD_COLUMNS } from "../../domain/constants";
import { isValidTitle, normalizeTitle } from "../../domain/taskRules";
import type { BoardColumn, Task, TaskPriority, TaskStatus } from "../../domain/types";
import { getTodoDb } from "../todoDb";

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export async function getAllTasks(): Promise<Task[]> {
  return getTodoDb().tasks.orderBy("order").toArray();
}

export async function getTasksByList(listId: string): Promise<Task[]> {
  return getTodoDb().tasks.where("listId").equals(listId).sortBy("order");
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  return getTodoDb().tasks.get(id);
}

export async function getSubtasks(parentTaskId: string): Promise<Task[]> {
  return getTodoDb().tasks.where("parentTaskId").equals(parentTaskId).sortBy("order");
}

export async function createTask(input: {
  listId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt?: string;
  tags?: string[];
  parentTaskId?: string;
  order?: number;
  section?: string;
  estimateMinutes?: number;
  source?: Task["source"];
}): Promise<Task | null> {
  const title = normalizeTitle(input.title);
  if (!isValidTitle(title)) return null;

  const now = new Date().toISOString();
  const siblings = await getTodoDb()
    .tasks.where("listId")
    .equals(input.listId)
    .filter((t) => !t.parentTaskId && (!input.status || t.status === input.status))
    .toArray();
  const order = input.order ?? (siblings.length ? Math.max(...siblings.map((t) => t.order)) + 1 : 0);

  const task: Task = {
    id: newId("task"),
    listId: input.listId,
    title,
    description: input.description,
    status: input.status ?? "todo",
    completed: input.status === "done",
    priority: input.priority ?? "none",
    parentTaskId: input.parentTaskId,
    order,
    dueAt: input.dueAt,
    tags: input.tags ?? [],
    section: input.section,
    estimateMinutes: input.estimateMinutes,
    source: input.source ?? "manual",
    createdAt: now,
    updatedAt: now,
    completedAt: input.status === "done" ? now : undefined,
  };

  await getTodoDb().tasks.add(task);
  return task;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task | null> {
  const existing = await getTodoDb().tasks.get(id);
  if (!existing) return null;

  if (patch.title !== undefined) {
    const title = normalizeTitle(patch.title);
    if (!isValidTitle(title)) return null;
    patch.title = title;
  }

  const updated: Task = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  await getTodoDb().tasks.put(updated);
  return updated;
}

export async function deleteTask(id: string): Promise<Task | null> {
  const existing = await getTodoDb().tasks.get(id);
  if (!existing) return null;

  const subs = await getSubtasks(id);
  await getTodoDb().transaction("rw", getTodoDb().tasks, async () => {
    for (const sub of subs) {
      await getTodoDb().tasks.delete(sub.id);
    }
    await getTodoDb().tasks.delete(id);
  });

  return existing;
}

export async function duplicateTask(id: string): Promise<Task | null> {
  const existing = await getTodoDb().tasks.get(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const siblings = await getTodoDb()
    .tasks.where("listId")
    .equals(existing.listId)
    .filter((t) => !t.parentTaskId)
    .toArray();
  const order = siblings.length ? Math.max(...siblings.map((t) => t.order)) + 1 : 0;

  const copy: Task = {
    ...existing,
    id: newId("task"),
    title: `${existing.title} (copy)`,
    completed: false,
    completedAt: undefined,
    status: existing.status === "done" ? "todo" : existing.status,
    order,
    createdAt: now,
    updatedAt: now,
    source: "manual",
  };

  await getTodoDb().tasks.add(copy);
  const subs = await getSubtasks(id);
  for (const sub of subs) {
    await getTodoDb().tasks.add({
      ...sub,
      id: newId("task"),
      parentTaskId: copy.id,
      completed: false,
      completedAt: undefined,
      status: "todo",
      createdAt: now,
      updatedAt: now,
      source: "manual",
    });
  }

  return copy;
}

export async function reorderTasksInList(orderedIds: string[]): Promise<void> {
  await getTodoDb().transaction("rw", getTodoDb().tasks, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      const task = await getTodoDb().tasks.get(orderedIds[i]);
      if (task) {
        await getTodoDb().tasks.update(orderedIds[i], { order: i, updatedAt: new Date().toISOString() });
      }
    }
  });
}

export async function moveTaskToColumn(
  taskId: string,
  status: TaskStatus,
  orderedIdsInColumn: string[],
): Promise<Task | null> {
  const task = await getTodoDb().tasks.get(taskId);
  if (!task) return null;

  const now = new Date().toISOString();
  const completed = status === "done";
  const updated: Task = {
    ...task,
    status,
    completed,
    completedAt: completed ? now : undefined,
    updatedAt: now,
  };

  await getTodoDb().tasks.put(updated);

  const finalOrder = orderedIdsInColumn.includes(taskId)
    ? orderedIdsInColumn
    : [...orderedIdsInColumn, taskId];

  await reorderTasksInList(finalOrder);
  return updated;
}

export async function getAllColumns(): Promise<BoardColumn[]> {
  return getTodoDb().columns.orderBy("order").toArray();
}

export async function getColumnsByList(listId: string): Promise<BoardColumn[]> {
  return getTodoDb().columns.where("listId").equals(listId).sortBy("order");
}

export async function ensureColumnsForList(listId: string): Promise<BoardColumn[]> {
  const existing = await getColumnsByList(listId);
  if (existing.length > 0) return existing;

  const columns: BoardColumn[] = DEFAULT_BOARD_COLUMNS.map((col) => ({
    id: newId(`col-${listId}`),
    listId,
    ...col,
  }));

  await getTodoDb().columns.bulkAdd(columns);
  return columns;
}

export async function bulkSetCompleted(ids: string[], completed: boolean): Promise<void> {
  const now = new Date().toISOString();
  await getTodoDb().transaction("rw", getTodoDb().tasks, async () => {
    for (const id of ids) {
      const task = await getTodoDb().tasks.get(id);
      if (!task) continue;
      await getTodoDb().tasks.update(id, {
        completed,
        status: completed ? "done" : task.status === "done" ? "todo" : task.status,
        completedAt: completed ? now : undefined,
        updatedAt: now,
      });
    }
  });
}

export async function deleteCompletedInList(listId: string): Promise<number> {
  const completed = await getTodoDb()
    .tasks.where("listId")
    .equals(listId)
    .filter((t) => t.completed)
    .toArray();
  if (completed.length === 0) return 0;
  await getTodoDb().transaction("rw", getTodoDb().tasks, async () => {
    for (const t of completed) {
      await getTodoDb().tasks.delete(t.id);
    }
  });
  return completed.length;
}

export async function bulkPutTasks(tasks: Task[]): Promise<void> {
  await getTodoDb().tasks.bulkPut(tasks);
}

export async function bulkPutColumns(columns: BoardColumn[]): Promise<void> {
  await getTodoDb().columns.bulkPut(columns);
}
