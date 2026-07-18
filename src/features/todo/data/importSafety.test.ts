import { beforeEach, describe, expect, it, vi } from "vitest";
import { TODO_EXPORT_TOOL, TODO_EXPORT_VERSION, TODO_IMPORT_MAX_BYTES } from "../domain/constants";

const mocks = vi.hoisted(() => ({
  replaceTodoDatabase: vi.fn(),
  mergeTodoDatabase: vi.fn(),
  seedDatabaseIfEmpty: vi.fn(),
  getAllStoredLists: vi.fn(),
  getAllTasks: vi.fn(),
  getAllColumns: vi.fn(),
}));

vi.mock("./todoDb", () => ({
  replaceTodoDatabase: mocks.replaceTodoDatabase,
  mergeTodoDatabase: mocks.mergeTodoDatabase,
  seedDatabaseIfEmpty: mocks.seedDatabaseIfEmpty,
}));
vi.mock("./repositories/listsRepository", () => ({
  getAllStoredLists: mocks.getAllStoredLists,
}));
vi.mock("./repositories/tasksRepository", () => ({
  getAllTasks: mocks.getAllTasks,
  getAllColumns: mocks.getAllColumns,
}));

import { exportTodoData, importTodoData, summarizeImportJson } from "./importExport";

const date = "2026-07-14T12:00:00.000Z";
const list = {
  id: "list-1",
  name: "Work",
  type: "work" as const,
  defaultView: "list" as const,
  isArchived: false,
  createdAt: date,
  updatedAt: date,
};
const valid = {
  tool: TODO_EXPORT_TOOL,
  version: TODO_EXPORT_VERSION,
  exportedAt: date,
  lists: [list],
  tasks: [],
  columns: [{ id: "col-1", listId: "list-1", name: "To Do", status: "todo" as const, order: 0 }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAllStoredLists.mockResolvedValue([]);
  mocks.getAllTasks.mockResolvedValue([]);
  mocks.getAllColumns.mockResolvedValue([]);
});

describe("atomic import and complete export", () => {
  it("uses one atomic replacement operation", async () => {
    const result = await importTodoData(valid, "replace");
    expect(result.ok).toBe(true);
    expect(mocks.replaceTodoDatabase).toHaveBeenCalledTimes(1);
    expect(mocks.mergeTodoDatabase).not.toHaveBeenCalled();
  });

  it("uses one atomic merge operation", async () => {
    const result = await importTodoData(valid, "merge");
    expect(result.ok).toBe(true);
    expect(mocks.mergeTodoDatabase).toHaveBeenCalledTimes(1);
    expect(mocks.replaceTodoDatabase).not.toHaveBeenCalled();
  });

  it("exports archived lists as part of a complete backup", async () => {
    mocks.getAllStoredLists.mockResolvedValue([{ ...list, isArchived: true }]);
    const exported = await exportTodoData();
    expect(exported.lists[0].isArchived).toBe(true);
    expect(mocks.getAllStoredLists).toHaveBeenCalledTimes(1);
  });

  it("rejects oversized JSON before parsing", () => {
    const oversized = " ".repeat(TODO_IMPORT_MAX_BYTES + 1);
    const summary = summarizeImportJson(oversized);
    expect(summary.ok).toBe(false);
    expect(summary.error).toMatch(/exceeds 2 MB/);
  });
});
