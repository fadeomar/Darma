"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { STATUS_LABELS } from "../../domain/constants";
import type { Task, TaskStatus } from "../../domain/types";
import { useTodo } from "../../state/TodoProvider";

export function TaskActionsMenu({ task, compact }: { task: Task; compact?: boolean }) {
  const { removeTask, duplicateTaskById, setTaskStatus, canUndo, undoDelete } = useTodo();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const statuses: TaskStatus[] = ["todo", "doing", "done", "blocked"];

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={cn("todo-btn todo-btn--icon todo-btn--ghost", compact && "min-h-8 min-w-8")}
        aria-label="Task actions"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          className="absolute end-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border bg-[var(--todo-surface)] p-1 shadow-lg"
          style={{ borderColor: "var(--todo-border)" }}
        >
          <p className="px-2 py-1 text-[10px] font-bold uppercase todo-muted">Status</p>
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              className="todo-btn todo-btn--ghost w-full justify-start px-2 text-xs"
              onClick={() => {
                void setTaskStatus(task.id, s);
                setOpen(false);
              }}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
          <hr className="my-1 border-[var(--todo-border)]" />
          <button
            type="button"
            className="todo-btn todo-btn--ghost w-full justify-start gap-2 px-2 text-xs"
            onClick={() => {
              void duplicateTaskById(task.id);
              setOpen(false);
            }}
          >
            <Copy size={14} aria-hidden />
            Duplicate
          </button>
          <button
            type="button"
            className="todo-btn todo-btn--ghost w-full justify-start gap-2 px-2 text-xs text-[var(--todo-danger)]"
            onClick={() => {
              void removeTask(task.id);
              setOpen(false);
            }}
          >
            <Trash2 size={14} aria-hidden />
            Delete
          </button>
          {canUndo && (
            <button
              type="button"
              className="todo-btn todo-btn--ghost w-full justify-start px-2 text-xs"
              onClick={() => {
                void undoDelete();
                setOpen(false);
              }}
            >
              Undo delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
