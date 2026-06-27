import { describe, expect, it } from "vitest";
import { buildMarkdown, buildPlainText, detectImportDuplicates, summarizeImport } from "./importExport";
import type { Task } from "../domain/types";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? "t",
    listId: overrides.listId ?? "list-1",
    title: overrides.title ?? "Task",
    status: overrides.status ?? "todo",
    completed: overrides.completed ?? false,
    priority: overrides.priority ?? "none",
    order: overrides.order ?? 0,
    tags: overrides.tags ?? [],
    source: overrides.source ?? "manual",
    createdAt: overrides.createdAt ?? "2026-06-01T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

const proposal = makeTask({
  id: "p",
  title: "Submit proposal",
  tags: ["work"],
  priority: "high",
  dueAt: "2026-06-30T12:00:00.000Z",
  order: 0,
});
const reviewBudget = makeTask({ id: "s1", title: "Review budget", parentTaskId: "p", order: 0 });
const exportPdf = makeTask({ id: "s2", title: "Export PDF", parentTaskId: "p", order: 1 });
const notes = makeTask({ id: "n", title: "Send meeting notes", completed: true, order: 1 });

const top = [proposal, notes];
const all = [proposal, reviewBudget, exportPdf, notes];

describe("buildMarkdown", () => {
  it("renders checkboxes with tags, priority, due, and nested subtasks", () => {
    const md = buildMarkdown(top, all);
    expect(md).toBe(
      [
        "- [ ] Submit proposal #work @high due:2026-06-30",
        "  - [ ] Review budget",
        "  - [ ] Export PDF",
        "- [x] Send meeting notes",
      ].join("\n"),
    );
  });

  it("adds a title heading when provided", () => {
    expect(buildMarkdown(top, all, { title: "Work" }).startsWith("# Work\n\n")).toBe(true);
  });

  it("omits completed tasks and subtasks when options disable them", () => {
    const md = buildMarkdown(top, all, { includeCompleted: false, includeSubtasks: false });
    expect(md).toBe("- [ ] Submit proposal #work @high due:2026-06-30");
  });

  it("can omit metadata", () => {
    const md = buildMarkdown([proposal], [proposal], {
      includeTags: false,
      includePriority: false,
      includeDue: false,
    });
    expect(md).toBe("- [ ] Submit proposal");
  });
});

describe("buildPlainText", () => {
  it("renders indented plain text with subtasks", () => {
    const txt = buildPlainText(top, all);
    expect(txt).toBe(
      ["[ ] Submit proposal", "    - Review budget", "    - Export PDF", "[x] Send meeting notes"].join("\n"),
    );
  });
});

describe("summarizeImport", () => {
  const validBundle = {
    version: 1,
    exportedAt: "2026-06-27T00:00:00.000Z",
    lists: [
      {
        id: "list-1",
        name: "Work",
        type: "work",
        defaultView: "list",
        isArchived: false,
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
      },
    ],
    tasks: [proposal],
    columns: [{ id: "c1", listId: "list-1", name: "To Do", status: "todo", order: 0 }],
  };

  it("returns counts for a valid bundle", () => {
    const result = summarizeImport(validBundle);
    expect(result.ok).toBe(true);
    expect(result.counts).toEqual({ lists: 1, tasks: 1, columns: 1 });
  });

  it("detects likely duplicate lists and tasks", () => {
    const duplicates = detectImportDuplicates(
      { lists: validBundle.lists as never, tasks: validBundle.tasks as never },
      [validBundle.lists[0] as never],
      [proposal],
    );
    expect(duplicates.listNames).toEqual(["Work"]);
    expect(duplicates.taskTitles).toEqual(["Submit proposal"]);
  });

  it("reports an error for malformed data", () => {
    expect(summarizeImport({ nope: true }).ok).toBe(false);
    expect(summarizeImport(null).ok).toBe(false);
  });
});
