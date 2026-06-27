import { PRIORITY_ORDER, STATUS_ORDER } from "./constants";
import type { Task } from "./types";

/* ------------------------------------------------------------------ *
 * Table view sorting
 * ------------------------------------------------------------------ */

export type TableSortKey = "title" | "status" | "priority" | "due" | "created" | "updated";
export type SortDir = "asc" | "desc";

export function sortTasksByColumn(tasks: Task[], key: TableSortKey, dir: SortDir): Task[] {
  const factor = dir === "asc" ? 1 : -1;
  const copy = [...tasks];
  copy.sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "title":
        cmp = a.title.localeCompare(b.title);
        break;
      case "status":
        cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        break;
      case "priority":
        cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        break;
      case "due":
        // Tasks without a due date always sort to the end regardless of direction.
        if (!a.dueAt && !b.dueAt) cmp = 0;
        else if (!a.dueAt) return 1;
        else if (!b.dueAt) return -1;
        else cmp = a.dueAt.localeCompare(b.dueAt);
        break;
      case "created":
        cmp = a.createdAt.localeCompare(b.createdAt);
        break;
      case "updated":
        cmp = a.updatedAt.localeCompare(b.updatedAt);
        break;
    }
    if (cmp === 0) cmp = a.order - b.order;
    return cmp * factor;
  });
  return copy;
}

/* ------------------------------------------------------------------ *
 * Week view grouping
 * ------------------------------------------------------------------ */

/** Local YYYY-MM-DD key for a date or ISO string. */
export function isoDateKey(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Sunday-based start of the week for the given date. */
export function getWeekStart(date: Date, weekStartsOn = 0): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

export type WeekGrouping = {
  byDay: Record<string, Task[]>;
  unscheduled: Task[];
};

/** Group top-level tasks into the given days; tasks with no due date are unscheduled. */
export function groupTasksByDay(tasks: Task[], days: Date[]): WeekGrouping {
  const dayKeys = new Set(days.map((d) => isoDateKey(d)));
  const byDay: Record<string, Task[]> = {};
  for (const d of days) byDay[isoDateKey(d)] = [];
  const unscheduled: Task[] = [];

  for (const task of tasks) {
    if (task.parentTaskId) continue;
    if (!task.dueAt) {
      unscheduled.push(task);
      continue;
    }
    const key = isoDateKey(task.dueAt);
    if (dayKeys.has(key)) byDay[key].push(task);
    // Tasks due outside the visible week are intentionally not shown in the grid.
  }

  for (const key of Object.keys(byDay)) {
    byDay[key].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  }
  unscheduled.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  return { byDay, unscheduled };
}

/* ------------------------------------------------------------------ *
 * Checklist view
 * ------------------------------------------------------------------ */

export type ChecklistProgress = { total: number; done: number; percent: number };

export function checklistProgress(tasks: Task[]): ChecklistProgress {
  const relevant = tasks.filter((t) => !t.parentTaskId);
  const total = relevant.length;
  const done = relevant.filter((t) => t.completed).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent };
}

export type SectionGroup = { section: string; tasks: Task[] };

/**
 * Group top-level tasks by their `section`. Tasks without a section are placed
 * in a trailing group whose label is the empty string (callers decide how to
 * render it). Order of first appearance is preserved.
 */
export function groupBySection(tasks: Task[]): SectionGroup[] {
  const order: string[] = [];
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    if (task.parentTaskId) continue;
    const section = task.section?.trim() || "";
    if (!map.has(section)) {
      map.set(section, []);
      order.push(section);
    }
    map.get(section)?.push(task);
  }
  return order.map((section) => ({ section, tasks: map.get(section) ?? [] }));
}
