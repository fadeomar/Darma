import { describe, expect, it } from "vitest";
import { TODO_EXPORT_TOOL, TODO_EXPORT_VERSION } from "./constants";
import type { Task, TodoExportBundle } from "./types";
import {
  analyzeTodoWorkspace,
  buildTodoAuditMarkdown,
  buildTodoTasksCsv,
  createTodoProductionPack,
} from "./workspaceAudit";

const now = "2026-07-14T12:00:00.000Z";

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? "task-1",
    listId: overrides.listId ?? "list-1",
    title: overrides.title ?? "Ship release",
    status: overrides.status ?? "todo",
    completed: overrides.completed ?? false,
    priority: overrides.priority ?? "high",
    order: overrides.order ?? 0,
    tags: overrides.tags ?? ["release"],
    source: overrides.source ?? "manual",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    ...overrides,
  };
}

function bundle(overrides: Partial<TodoExportBundle> = {}): TodoExportBundle {
  return {
    tool: TODO_EXPORT_TOOL,
    version: TODO_EXPORT_VERSION,
    exportedAt: now,
    lists: [
      {
        id: "list-1",
        name: "Work",
        type: "work",
        defaultView: "board",
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
    tasks: [task()],
    columns: [{ id: "col-1", listId: "list-1", name: "To Do", status: "todo", order: 0 }],
    ...overrides,
  };
}

function readStoredZip(bytes: Uint8Array): Map<string, string> {
  const files = new Map<string, string>();
  const decoder = new TextDecoder();
  let offset = 0;
  while (offset + 30 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, bytes.byteLength - offset);
    if (view.getUint32(0, true) !== 0x04034b50) break;
    const compressedSize = view.getUint32(18, true);
    const nameLength = view.getUint16(26, true);
    const extraLength = view.getUint16(28, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = decoder.decode(bytes.slice(nameStart, nameStart + nameLength));
    files.set(name, decoder.decode(bytes.slice(dataStart, dataStart + compressedSize)));
    offset = dataStart + compressedSize;
  }
  return files;
}

describe("analyzeTodoWorkspace", () => {
  it("marks a consistent small workspace ready", () => {
    const audit = analyzeTodoWorkspace(bundle(), new Date(now));
    expect(audit.summary.readinessLabel).toBe("Ready");
    expect(audit.summary.readinessScore).toBe(100);
    expect(audit.checks.some((check) => check.id === "schema" && check.severity === "pass")).toBe(true);
  });

  it("reports overdue incomplete work", () => {
    const audit = analyzeTodoWorkspace(
      bundle({ tasks: [task({ dueAt: "2026-07-01T00:00:00.000Z" })] }),
      new Date(now),
    );
    expect(audit.summary.overdueTasks).toBe(1);
    expect(audit.checks.find((check) => check.id === "overdue")?.severity).toBe("warning");
  });

  it("reports inconsistent completion fields", () => {
    const audit = analyzeTodoWorkspace(bundle({ tasks: [task({ status: "done", completed: false })] }));
    expect(audit.checks.find((check) => check.id === "state-mismatch")?.severity).toBe("warning");
  });

  it("preserves archived-list visibility in the summary", () => {
    const archived = { ...bundle().lists[0], id: "list-2", name: "Archive", isArchived: true };
    const audit = analyzeTodoWorkspace(bundle({ lists: [...bundle().lists, archived] }));
    expect(audit.summary.archivedLists).toBe(1);
    expect(audit.checks.find((check) => check.id === "archived-lists")?.severity).toBe("info");
  });

  it("blocks duplicate IDs", () => {
    const duplicated = bundle({ tasks: [task(), task({ title: "Second" })] });
    const audit = analyzeTodoWorkspace(duplicated);
    expect(audit.summary.readinessLabel).toBe("Blocked");
    expect(audit.checks.some((check) => check.severity === "error")).toBe(true);
  });
});

describe("production exports", () => {
  it("escapes formula-like CSV cells", () => {
    const csv = buildTodoTasksCsv(bundle({ tasks: [task({ title: "=HYPERLINK(\"bad\")" })] }));
    expect(csv).toContain("'=HYPERLINK");
  });

  it("includes counts and checks in Markdown", () => {
    const markdown = buildTodoAuditMarkdown(bundle());
    expect(markdown).toContain("# Darma Tasks workspace audit");
    expect(markdown).toContain("- Tasks: 1");
    expect(markdown).toContain("Production checks");
  });

  it("creates a restorable four-file ZIP", async () => {
    const files = readStoredZip(await createTodoProductionPack(bundle()));
    expect([...files.keys()]).toEqual([
      "darma-tasks-backup.json",
      "workspace-audit.md",
      "tasks.csv",
      "README.md",
    ]);
    const backup = JSON.parse(files.get("darma-tasks-backup.json") ?? "null") as TodoExportBundle;
    expect(backup.tool).toBe(TODO_EXPORT_TOOL);
    expect(backup.tasks).toHaveLength(1);
    expect(files.get("tasks.csv")).toContain("task_id");
  });
});
