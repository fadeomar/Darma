import type { SidebarFilter, Task } from "./types";
import { isDueToday, isOverdue, isUpcoming, startOfDay } from "./taskRules";

export type FilterContext = {
  now?: Date;
  listId?: string | null;
  tag?: string | null;
  search?: string;
};

function matchesSearch(task: Task, search: string | undefined): boolean {
  const q = (search ?? "").trim().toLowerCase();
  if (!q) return true;
  const haystack = [task.title, task.description ?? "", ...task.tags].join(" ").toLowerCase();
  return haystack.includes(q);
}

function matchesList(task: Task, listId: string | null | undefined): boolean {
  if (!listId) return true;
  return task.listId === listId;
}

function matchesTag(task: Task, tag: string | null | undefined): boolean {
  if (!tag) return true;
  return task.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
}

export function filterBySidebar(tasks: Task[], filter: SidebarFilter, ctx: FilterContext = {}): Task[] {
  const now = ctx.now ?? new Date();
  const topLevel = tasks.filter((t) => !t.parentTaskId);

  return topLevel.filter((task) => {
    if (!matchesList(task, ctx.listId)) return false;
    if (!matchesTag(task, ctx.tag)) return false;
    if (!matchesSearch(task, ctx.search)) return false;

    switch (filter) {
      case "today":
        return !task.completed && (isDueToday(task, now) || (!task.dueAt && task.listId === "list-today"));
      case "upcoming":
        return !task.completed && isUpcoming(task, now);
      case "overdue":
        return !task.completed && isOverdue(task, now);
      case "completed":
        return task.completed;
      case "high-priority":
        return !task.completed && (task.priority === "high" || task.priority === "urgent");
      case "no-date":
        return !task.completed && !task.dueAt;
      case "all":
      default:
        return true;
    }
  });
}

export function getOverdueTasks(tasks: Task[], now = new Date()): Task[] {
  return tasks.filter((t) => !t.parentTaskId && !t.completed && isOverdue(t, now));
}

export function getRolloverCandidates(tasks: Task[], now = new Date()): Task[] {
  const todayStart = startOfDay(now);
  return tasks.filter((t) => {
    if (t.parentTaskId || t.completed || !t.dueAt) return false;
    const due = new Date(t.dueAt);
    return due < todayStart;
  });
}

export function collectTags(tasks: Task[]): string[] {
  const set = new Set<string>();
  for (const task of tasks) {
    for (const tag of task.tags) {
      const trimmed = tag.trim();
      if (trimmed) set.add(trimmed);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
