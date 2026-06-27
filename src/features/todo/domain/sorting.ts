import { PRIORITY_ORDER, STATUS_ORDER } from "./constants";
import type { SortMode, Task } from "./types";

export function sortTasks(tasks: Task[], mode: SortMode): Task[] {
  const copy = [...tasks];
  switch (mode) {
    case "manual":
      return copy.sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
    case "due":
      return copy.sort((a, b) => {
        if (!a.dueAt && !b.dueAt) return a.order - b.order;
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return a.dueAt.localeCompare(b.dueAt) || a.order - b.order;
      });
    case "priority":
      return copy.sort(
        (a, b) =>
          PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority] ||
          a.order - b.order ||
          a.createdAt.localeCompare(b.createdAt),
      );
    case "created":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "status":
      return copy.sort(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
          a.order - b.order ||
          a.createdAt.localeCompare(b.createdAt),
      );
    default:
      return copy;
  }
}

export function reorderTasks(tasks: Task[], orderedIds: string[]): Task[] {
  const map = new Map(tasks.map((t) => [t.id, t]));
  return orderedIds
    .map((id, index) => {
      const task = map.get(id);
      if (!task) return null;
      return { ...task, order: index };
    })
    .filter((t): t is Task => t !== null);
}

export function nextOrder(tasks: Task[], listId: string, status?: Task["status"]): number {
  const relevant = tasks.filter(
    (t) => t.listId === listId && !t.parentTaskId && (status ? t.status === status : true),
  );
  if (relevant.length === 0) return 0;
  return Math.max(...relevant.map((t) => t.order)) + 1;
}
