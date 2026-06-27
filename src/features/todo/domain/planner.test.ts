import { describe, expect, it } from "vitest";
import type { Task } from "./types";
import { calculateSelectedEstimate, getRecommendedNextTask, getTodayPlannerGroups, sortFocusTasks } from "./planner";

const today = new Date().toISOString();
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

function task(patch: Partial<Task>): Task {
  return {
    id: patch.id ?? crypto.randomUUID(),
    listId: "list-today",
    title: patch.title ?? "Task",
    status: patch.status ?? "todo",
    completed: patch.completed ?? false,
    priority: patch.priority ?? "none",
    order: patch.order ?? 0,
    tags: patch.tags ?? [],
    source: patch.source ?? "manual",
    createdAt: patch.createdAt ?? today,
    updatedAt: patch.updatedAt ?? today,
    ...patch,
  };
}

describe("today planner helpers", () => {
  const tasks = [
    task({ id: "overdue", title: "Overdue", dueAt: yesterday, priority: "medium", estimateMinutes: 60 }),
    task({ id: "today", title: "Today", dueAt: today, priority: "low", estimateMinutes: 30 }),
    task({ id: "urgent", title: "Urgent", priority: "urgent", estimateMinutes: 15 }),
    task({ id: "done", title: "Done", completed: true, dueAt: today }),
  ];

  it("groups planner tasks", () => {
    const groups = getTodayPlannerGroups(tasks);
    expect(groups.overdue.map((t) => t.id)).toEqual(["overdue"]);
    expect(groups.today.map((t) => t.id)).toEqual(["today"]);
    expect(groups.importantNoDate.map((t) => t.id)).toEqual(["urgent"]);
  });

  it("recommends the strongest next task", () => {
    expect(getRecommendedNextTask(tasks)?.id).toBe("urgent");
  });

  it("calculates selected estimate", () => {
    expect(calculateSelectedEstimate(tasks, ["overdue", "urgent"])).toBe(75);
  });

  it("sorts shortest-first", () => {
    expect(sortFocusTasks(tasks.filter((t) => !t.completed), "shortest-first").map((t) => t.id)[0]).toBe("urgent");
  });
});
