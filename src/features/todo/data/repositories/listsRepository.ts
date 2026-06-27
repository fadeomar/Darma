import { DEFAULT_BOARD_COLUMNS } from "../../domain/constants";
import type { TodoList, TodoListType, TodoView } from "../../domain/types";
import { ensureColumnsForList } from "./tasksRepository";
import { getTodoDb } from "../todoDb";

function newId(): string {
  return `list-${crypto.randomUUID()}`;
}

export async function getAllLists(): Promise<TodoList[]> {
  return getTodoDb()
    .lists.filter((l) => !l.isArchived)
    .sortBy("name");
}

export async function getListById(id: string): Promise<TodoList | undefined> {
  return getTodoDb().lists.get(id);
}

export async function createList(input: {
  name: string;
  type?: TodoListType;
  color?: string;
  defaultView?: TodoView;
}): Promise<TodoList> {
  const now = new Date().toISOString();
  const list: TodoList = {
    id: newId(),
    name: input.name.trim(),
    type: input.type ?? "simple",
    color: input.color,
    defaultView: input.defaultView ?? "list",
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  await getTodoDb().lists.add(list);

  const columns = DEFAULT_BOARD_COLUMNS.map((col, index) => ({
    id: `col-${list.id}-${col.status ?? index}`,
    listId: list.id,
    ...col,
  }));
  await getTodoDb().columns.bulkAdd(columns);

  return list;
}

export async function updateList(id: string, patch: Partial<TodoList>): Promise<TodoList | null> {
  const existing = await getTodoDb().lists.get(id);
  if (!existing) return null;

  const updated: TodoList = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  await getTodoDb().lists.put(updated);
  return updated;
}

export async function archiveList(id: string): Promise<void> {
  await getTodoDb().lists.update(id, { isArchived: true, updatedAt: new Date().toISOString() });
}

export async function bulkPutLists(lists: TodoList[]): Promise<void> {
  await getTodoDb().lists.bulkPut(lists);
}

export async function duplicateListWithTasks(listId: string): Promise<TodoList | null> {
  const db = getTodoDb();
  const source = await db.lists.get(listId);
  if (!source) return null;

  const now = new Date().toISOString();
  const newList: TodoList = {
    ...source,
    id: newId(),
    name: `${source.name} (copy)`,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  const tasks = await db.tasks.where("listId").equals(listId).toArray();
  const idMap = new Map<string, string>();
  for (const t of tasks) idMap.set(t.id, `task-${crypto.randomUUID()}`);

  // A duplicated list is meant to be reused, so completion is reset.
  const cloned = tasks.map((t) => ({
    ...t,
    id: idMap.get(t.id) as string,
    listId: newList.id,
    parentTaskId: t.parentTaskId ? idMap.get(t.parentTaskId) : undefined,
    completed: false,
    status: t.status === "done" ? "todo" : t.status,
    completedAt: undefined,
    createdAt: now,
    updatedAt: now,
    source: "manual" as const,
  }));

  await db.transaction("rw", db.lists, db.tasks, db.columns, async () => {
    await db.lists.add(newList);
    await db.tasks.bulkAdd(cloned);
  });
  await ensureColumnsForList(newList.id);

  return newList;
}

export async function createListFromTemplate(
  templateList: Omit<TodoList, "createdAt" | "updatedAt">,
  taskFactory: (listId: string) => Promise<void>,
): Promise<TodoList> {
  const now = new Date().toISOString();
  const list: TodoList = { ...templateList, createdAt: now, updatedAt: now };
  await getTodoDb().lists.add(list);
  await ensureColumnsForList(list.id);
  await taskFactory(list.id);
  return list;
}
