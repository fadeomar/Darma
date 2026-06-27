import type { Task, TaskStatus } from "./types";

export function normalizeTitle(title: string): string {
  return title.trim();
}

export function isValidTitle(title: string): boolean {
  return normalizeTitle(title).length > 0;
}

export function statusFromCompleted(completed: boolean, current: TaskStatus): TaskStatus {
  if (completed) return "done";
  if (current === "done") return "todo";
  return current;
}

export function applyStatusChange(status: TaskStatus): Pick<Task, "status" | "completed" | "completedAt"> {
  const now = new Date().toISOString();
  if (status === "done") {
    return { status: "done", completed: true, completedAt: now };
  }
  return { status, completed: false, completedAt: undefined };
}

export function toggleCompleted(task: Task): Pick<Task, "status" | "completed" | "completedAt" | "updatedAt"> {
  const now = new Date().toISOString();
  if (task.completed) {
    return {
      status: task.status === "done" ? "todo" : task.status,
      completed: false,
      completedAt: undefined,
      updatedAt: now,
    };
  }
  return {
    status: "done",
    completed: true,
    completedAt: now,
    updatedAt: now,
  };
}

export function moveTaskToStatus(task: Task, status: TaskStatus): Pick<Task, "status" | "completed" | "completedAt" | "updatedAt"> {
  const now = new Date().toISOString();
  const patch = applyStatusChange(status);
  return { ...patch, updatedAt: now };
}

export function countSubtasks(tasks: Task[], parentId: string): { total: number; done: number } {
  const subs = tasks.filter((t) => t.parentTaskId === parentId);
  return {
    total: subs.length,
    done: subs.filter((t) => t.completed).length,
  };
}

export function isOverdue(task: Pick<Task, "dueAt" | "completed">, now = new Date()): boolean {
  if (task.completed || !task.dueAt) return false;
  const due = new Date(task.dueAt);
  due.setHours(23, 59, 59, 999);
  return due < now;
}

export function isDueToday(task: Task, now = new Date()): boolean {
  if (!task.dueAt) return false;
  const due = new Date(task.dueAt);
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

export function isUpcoming(task: Task, now = new Date()): boolean {
  if (task.completed || !task.dueAt) return false;
  const due = new Date(task.dueAt);
  due.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return due > today;
}

export function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function toDateInputValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function fromDateInputValue(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}
