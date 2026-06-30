import { describe, expect, it } from "vitest";
import {
  checklistProgress,
  getWeekDays,
  getWeekStart,
  groupBySection,
  groupTasksByDay,
  isoDateKey,
  sortTasksByColumn,
} from "./viewHelpers";
import type { Task } from "./types";

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

describe("sortTasksByColumn", () => {
  it("sorts by title ascending and descending", () => {
    const tasks = [makeTask({ id: "b", title: "Banana" }), makeTask({ id: "a", title: "Apple" })];
    expect(sortTasksByColumn(tasks, "title", "asc").map((t) => t.id)).toEqual(["a", "b"]);
    expect(sortTasksByColumn(tasks, "title", "desc").map((t) => t.id)).toEqual(["b", "a"]);
  });

  it("sorts by priority using priority rank", () => {
    const tasks = [
      makeTask({ id: "low", priority: "low" }),
      makeTask({ id: "urgent", priority: "urgent" }),
      makeTask({ id: "med", priority: "medium" }),
    ];
    expect(sortTasksByColumn(tasks, "priority", "desc").map((t) => t.id)).toEqual(["urgent", "med", "low"]);
  });

  it("always sorts undated tasks last regardless of direction", () => {
    const tasks = [
      makeTask({ id: "none" }),
      makeTask({ id: "early", dueAt: "2026-06-10T12:00:00.000Z" }),
      makeTask({ id: "late", dueAt: "2026-06-20T12:00:00.000Z" }),
    ];
    expect(sortTasksByColumn(tasks, "due", "asc").map((t) => t.id)).toEqual(["early", "late", "none"]);
    expect(sortTasksByColumn(tasks, "due", "desc").map((t) => t.id)).toEqual(["late", "early", "none"]);
  });

  it("does not mutate the input array", () => {
    const tasks = [makeTask({ id: "b", title: "B" }), makeTask({ id: "a", title: "A" })];
    sortTasksByColumn(tasks, "title", "asc");
    expect(tasks.map((t) => t.id)).toEqual(["b", "a"]);
  });
});

describe("week grouping", () => {
  it("getWeekStart returns the Sunday of the week", () => {
    // 2026-06-24 is a Wednesday.
    const start = getWeekStart(new Date(2026, 5, 24));
    expect(start.getDay()).toBe(0);
    expect(getWeekDays(start)).toHaveLength(7);
  });

  it("groups tasks into their day and collects unscheduled", () => {
    const start = getWeekStart(new Date(2026, 5, 24));
    const days = getWeekDays(start);
    const day2 = days[2];
    const tasks = [
      makeTask({ id: "scheduled", dueAt: day2.toISOString() }),
      makeTask({ id: "unscheduled" }),
      makeTask({ id: "sub", parentTaskId: "scheduled", dueAt: day2.toISOString() }),
    ];
    const { byDay, unscheduled } = groupTasksByDay(tasks, days);
    expect(byDay[isoDateKey(day2)].map((t) => t.id)).toEqual(["scheduled"]);
    expect(unscheduled.map((t) => t.id)).toEqual(["unscheduled"]);
  });

  it("excludes tasks due outside the visible week", () => {
    const start = getWeekStart(new Date(2026, 5, 24));
    const days = getWeekDays(start);
    const farAway = new Date(start);
    farAway.setDate(start.getDate() + 30);
    const tasks = [makeTask({ id: "far", dueAt: farAway.toISOString() })];
    const { byDay, unscheduled } = groupTasksByDay(tasks, days);
    expect(unscheduled).toHaveLength(0);
    expect(Object.values(byDay).flat()).toHaveLength(0);
  });
});

describe("checklistProgress", () => {
  it("computes done/total/percent over top-level tasks only", () => {
    const tasks = [
      makeTask({ id: "a", completed: true }),
      makeTask({ id: "b", completed: false }),
      makeTask({ id: "c", completed: true }),
      makeTask({ id: "sub", parentTaskId: "a", completed: false }),
    ];
    expect(checklistProgress(tasks)).toEqual({ total: 3, done: 2, percent: 67 });
  });

  it("returns zero percent for an empty list", () => {
    expect(checklistProgress([])).toEqual({ total: 0, done: 0, percent: 0 });
  });
});

describe("groupBySection", () => {
  it("groups by section preserving first-seen order, sectionless last", () => {
    const tasks = [
      makeTask({ id: "1", section: "A" }),
      makeTask({ id: "2", section: "B" }),
      makeTask({ id: "3", section: "A" }),
      makeTask({ id: "4" }),
    ];
    const groups = groupBySection(tasks);
    expect(groups.map((g) => g.section)).toEqual(["A", "B", ""]);
    expect(groups[0].tasks.map((t) => t.id)).toEqual(["1", "3"]);
  });
});
