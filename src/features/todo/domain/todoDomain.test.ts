import { describe, expect, it } from "vitest";
import { filterBySidebar, collectTags, getRolloverCandidates } from "./filters";
import { sortTasks, reorderTasks, nextOrder } from "./sorting";
import {
  applyStatusChange,
  countSubtasks,
  isDueToday,
  isOverdue,
  isUpcoming,
  isValidTitle,
  normalizeTitle,
  toggleCompleted,
} from "./taskRules";
import { validateImportData } from "./schema";
import type { Task } from "./types";

const NOW = new Date("2026-06-27T12:00:00.000Z");

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? "task-1",
    listId: overrides.listId ?? "list-personal",
    title: overrides.title ?? "Sample task",
    status: overrides.status ?? "todo",
    completed: overrides.completed ?? false,
    priority: overrides.priority ?? "none",
    order: overrides.order ?? 0,
    tags: overrides.tags ?? [],
    source: overrides.source ?? "manual",
    createdAt: overrides.createdAt ?? "2026-06-20T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-06-20T00:00:00.000Z",
    ...overrides,
  };
}

const isoDay = (offsetDays: number) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

describe("taskRules", () => {
  it("normalizes and validates titles", () => {
    expect(normalizeTitle("  hello  ")).toBe("hello");
    expect(isValidTitle("   ")).toBe(false);
    expect(isValidTitle(" x ")).toBe(true);
  });

  it("toggles completion and resets status from done", () => {
    const open = makeTask({ status: "todo", completed: false });
    const done = toggleCompleted(open);
    expect(done.completed).toBe(true);
    expect(done.status).toBe("done");
    expect(done.completedAt).toBeTruthy();

    const reopened = toggleCompleted(makeTask({ status: "done", completed: true }));
    expect(reopened.completed).toBe(false);
    expect(reopened.status).toBe("todo");
    expect(reopened.completedAt).toBeUndefined();
  });

  it("moves to a status and marks completion only for done", () => {
    expect(applyStatusChange("done")).toMatchObject({ status: "done", completed: true });
    expect(applyStatusChange("doing")).toMatchObject({ status: "doing", completed: false });
    expect(applyStatusChange("blocked").completedAt).toBeUndefined();
  });

  it("computes overdue / today / upcoming relative to now", () => {
    expect(isOverdue(makeTask({ dueAt: isoDay(-1) }), NOW)).toBe(true);
    expect(isOverdue(makeTask({ dueAt: isoDay(-1), completed: true }), NOW)).toBe(false);
    expect(isDueToday(makeTask({ dueAt: isoDay(0) }), NOW)).toBe(true);
    expect(isUpcoming(makeTask({ dueAt: isoDay(3) }), NOW)).toBe(true);
    expect(isUpcoming(makeTask({ dueAt: isoDay(-3) }), NOW)).toBe(false);
  });

  it("counts subtasks", () => {
    const tasks = [
      makeTask({ id: "a", parentTaskId: "p" }),
      makeTask({ id: "b", parentTaskId: "p", completed: true }),
      makeTask({ id: "c", parentTaskId: "other" }),
    ];
    expect(countSubtasks(tasks, "p")).toEqual({ total: 2, done: 1 });
  });
});

describe("filterBySidebar", () => {
  const tasks = [
    makeTask({ id: "today", dueAt: isoDay(0) }),
    makeTask({ id: "soon", dueAt: isoDay(2) }),
    makeTask({ id: "late", dueAt: isoDay(-2) }),
    makeTask({ id: "done", completed: true, status: "done", dueAt: isoDay(-5) }),
    makeTask({ id: "urgent", priority: "urgent" }),
    makeTask({ id: "nodate" }),
    makeTask({ id: "sub", parentTaskId: "today" }),
  ];

  it("excludes subtasks from every sidebar filter", () => {
    const all = filterBySidebar(tasks, "all", { now: NOW });
    expect(all.some((t) => t.id === "sub")).toBe(false);
  });

  it("filters today / upcoming / overdue / completed", () => {
    expect(filterBySidebar(tasks, "today", { now: NOW }).map((t) => t.id)).toContain("today");
    expect(filterBySidebar(tasks, "upcoming", { now: NOW }).map((t) => t.id)).toEqual(["soon"]);
    expect(filterBySidebar(tasks, "overdue", { now: NOW }).map((t) => t.id)).toEqual(["late"]);
    expect(filterBySidebar(tasks, "completed", { now: NOW }).map((t) => t.id)).toEqual(["done"]);
  });

  it("filters high priority and no-date", () => {
    expect(filterBySidebar(tasks, "high-priority", { now: NOW }).map((t) => t.id)).toEqual(["urgent"]);
    expect(filterBySidebar(tasks, "no-date", { now: NOW }).map((t) => t.id).sort()).toEqual([
      "nodate",
      "urgent",
    ]);
  });

  it("applies search and tag context", () => {
    const tagged = [makeTask({ id: "x", tags: ["work"] }), makeTask({ id: "y", tags: ["home"] })];
    expect(filterBySidebar(tagged, "all", { tag: "work", now: NOW }).map((t) => t.id)).toEqual(["x"]);
    // Search matches title and tags, so "home" finds the home-tagged task.
    expect(filterBySidebar(tagged, "all", { search: "home", now: NOW }).map((t) => t.id)).toEqual(["y"]);
    expect(filterBySidebar(tagged, "all", { search: "zzz-no-match", now: NOW }).length).toBe(0);
  });

  it("collects unique sorted tags and rollover candidates", () => {
    expect(collectTags([makeTask({ tags: ["b", "a", "a"] })])).toEqual(["a", "b"]);
    const roll = getRolloverCandidates(tasks, NOW).map((t) => t.id);
    expect(roll).toContain("late");
    expect(roll).not.toContain("today");
  });
});

describe("sorting", () => {
  it("sorts by priority then due then manual order", () => {
    const tasks = [
      makeTask({ id: "low", priority: "low", order: 2 }),
      makeTask({ id: "urgent", priority: "urgent", order: 1 }),
      makeTask({ id: "high", priority: "high", order: 0 }),
    ];
    expect(sortTasks(tasks, "priority").map((t) => t.id)).toEqual(["urgent", "high", "low"]);
    expect(sortTasks(tasks, "manual").map((t) => t.id)).toEqual(["high", "urgent", "low"]);
  });

  it("sorts by due date with undated last", () => {
    const tasks = [
      makeTask({ id: "none" }),
      makeTask({ id: "later", dueAt: isoDay(5) }),
      makeTask({ id: "soon", dueAt: isoDay(1) }),
    ];
    expect(sortTasks(tasks, "due").map((t) => t.id)).toEqual(["soon", "later", "none"]);
  });

  it("reorders by id list and computes next order", () => {
    const tasks = [makeTask({ id: "a", order: 0 }), makeTask({ id: "b", order: 1 })];
    const reordered = reorderTasks(tasks, ["b", "a"]);
    expect(reordered.map((t) => `${t.id}:${t.order}`)).toEqual(["b:0", "a:1"]);
    expect(nextOrder(tasks, "list-personal")).toBe(2);
  });
});

describe("validateImportData", () => {
  const validBundle = {
    version: 1,
    exportedAt: NOW.toISOString(),
    lists: [
      {
        id: "list-personal",
        name: "Personal",
        type: "life",
        defaultView: "list",
        isArchived: false,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      },
    ],
    tasks: [makeTask({ listId: "list-personal" })],
    columns: [{ id: "c1", listId: "list-personal", name: "To Do", status: "todo", order: 0 }],
  };

  it("accepts a well-formed bundle", () => {
    const result = validateImportData(validBundle);
    expect(result.ok).toBe(true);
  });

  it("rejects non-object and malformed data without throwing", () => {
    expect(validateImportData(null).ok).toBe(false);
    expect(validateImportData({ version: 1 }).ok).toBe(false);
  });

  it("rejects tasks that reference a missing list", () => {
    const broken = { ...validBundle, tasks: [makeTask({ listId: "ghost" })] };
    const result = validateImportData(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/missing list/);
  });

  it("rejects unsupported future versions", () => {
    const result = validateImportData({ ...validBundle, version: 999 });
    expect(result.ok).toBe(false);
  });
});
