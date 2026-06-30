import Dexie, { type Table } from "dexie";
import { DEFAULT_BOARD_COLUMNS, SEED_LISTS, TODO_DB_NAME, TODO_DB_VERSION } from "../domain/constants";
import type { BoardColumn, Task, TodoList } from "../domain/types";

export class TodoDatabase extends Dexie {
  lists!: Table<TodoList>;
  tasks!: Table<Task>;
  columns!: Table<BoardColumn>;

  constructor() {
    super(TODO_DB_NAME);
    this.version(TODO_DB_VERSION).stores({
      lists: "id, name, isArchived, updatedAt",
      tasks: "id, listId, status, completed, dueAt, order, parentTaskId, updatedAt",
      columns: "id, listId, order",
    });
  }
}

let db: TodoDatabase | null = null;

export function getTodoDb(): TodoDatabase {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available");
  }
  if (!db) db = new TodoDatabase();
  return db;
}

let seedInFlight: Promise<void> | null = null;

export async function seedDatabaseIfEmpty(): Promise<void> {
  // Dedupe concurrent callers (e.g. React StrictMode double-mounts the provider
  // in dev, firing two refreshes at once). Without this, both would read an
  // empty store and race to seed, and the loser throws ConstraintError.
  if (seedInFlight) return seedInFlight;
  seedInFlight = doSeedDatabaseIfEmpty().finally(() => {
    seedInFlight = null;
  });
  return seedInFlight;
}

async function doSeedDatabaseIfEmpty(): Promise<void> {
  const database = getTodoDb();
  const now = new Date().toISOString();
  const lists: TodoList[] = SEED_LISTS.map((l) => ({
    ...l,
    createdAt: now,
    updatedAt: now,
  }));

  const columns: BoardColumn[] = [];
  for (const list of lists) {
    for (const col of DEFAULT_BOARD_COLUMNS) {
      columns.push({
        id: `col-${list.id}-${col.status}`,
        listId: list.id,
        ...col,
      });
    }
  }

  const sampleTasks: Task[] = [
    {
      id: "task-welcome",
      listId: "list-today",
      title: "Welcome to Darma Tasks — add your first task above",
      status: "todo",
      completed: false,
      priority: "none",
      order: 0,
      tags: ["getting-started"],
      source: "manual",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "task-work-1",
      listId: "list-work",
      title: "Review team priorities",
      status: "doing",
      completed: false,
      priority: "high",
      order: 0,
      dueAt: new Date().toISOString(),
      tags: ["work"],
      source: "manual",
      createdAt: now,
      updatedAt: now,
    },
  ];

  await database.transaction("rw", database.lists, database.columns, database.tasks, async () => {
    // Re-check inside the transaction so the guard is atomic with the writes.
    if ((await database.lists.count()) > 0) return;
    await database.lists.bulkAdd(lists);
    await database.columns.bulkAdd(columns);
    await database.tasks.bulkAdd(sampleTasks);
  });
}

export async function clearTodoDatabase(): Promise<void> {
  const database = getTodoDb();
  await database.transaction("rw", database.lists, database.tasks, database.columns, async () => {
    await database.tasks.clear();
    await database.columns.clear();
    await database.lists.clear();
  });
}
