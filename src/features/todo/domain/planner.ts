import { PRIORITY_ORDER } from "./constants";
import { isDueToday, isOverdue } from "./taskRules";
import type { Task } from "./types";

export type FocusSortStrategy = "urgent-first" | "due-first" | "shortest-first" | "manual";

export type TodayPlannerGroups = {
  overdue: Task[];
  today: Task[];
  importantNoDate: Task[];
  recentlyAdded: Task[];
};

function topOpen(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.parentTaskId && !t.completed);
}

function byUpdatedDesc(a: Task, b: Task): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

export function getTodayPlannerGroups(tasks: Task[]): TodayPlannerGroups {
  const open = topOpen(tasks);
  const overdue = open.filter((t) => isOverdue(t));
  const overdueIds = new Set(overdue.map((t) => t.id));
  const today = open.filter((t) => isDueToday(t) && !overdueIds.has(t.id));
  const shown = new Set([...overdue.map((t) => t.id), ...today.map((t) => t.id)]);
  const importantNoDate = open.filter(
    (t) => !t.dueAt && (t.priority === "urgent" || t.priority === "high") && !shown.has(t.id),
  );
  importantNoDate.forEach((t) => shown.add(t.id));
  const recentlyAdded = open
    .filter((t) => !shown.has(t.id))
    .sort(byUpdatedDesc)
    .slice(0, 8);
  return { overdue, today, importantNoDate, recentlyAdded };
}

export function calculateSelectedEstimate(tasks: Task[], selectedIds: Iterable<string>): number {
  const selected = new Set(selectedIds);
  return tasks.reduce((sum, task) => sum + (selected.has(task.id) ? task.estimateMinutes ?? 30 : 0), 0);
}

export function sortFocusTasks(tasks: Task[], strategy: FocusSortStrategy): Task[] {
  const copy = [...tasks];
  if (strategy === "manual") return copy.sort((a, b) => a.order - b.order);
  if (strategy === "shortest-first") {
    return copy.sort((a, b) => (a.estimateMinutes ?? 30) - (b.estimateMinutes ?? 30));
  }
  if (strategy === "due-first") {
    return copy.sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"));
  }
  return copy.sort((a, b) => {
    const priority = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
    if (priority !== 0) return priority;
    return (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999");
  });
}

export function getRecommendedNextTask(tasks: Task[], strategy: FocusSortStrategy = "urgent-first"): Task | null {
  const groups = getTodayPlannerGroups(tasks);
  const candidates = [...groups.overdue, ...groups.today, ...groups.importantNoDate, ...groups.recentlyAdded];
  return sortFocusTasks(candidates, strategy)[0] ?? null;
}
