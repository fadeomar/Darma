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
        <div className="todo-menu" role="menu">
          <p className="todo-menu__label">Status</p>
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              role="menuitem"
              className="todo-menu__item"
              onClick={() => {
                void setTaskStatus(task.id, s);
                setOpen(false);
              }}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
          <hr className="todo-menu__divider" />
          <button
            type="button"
            role="menuitem"
            className="todo-menu__item"
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
            role="menuitem"
            className="todo-menu__item todo-menu__item--danger"
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
              role="menuitem"
              className="todo-menu__item"
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
