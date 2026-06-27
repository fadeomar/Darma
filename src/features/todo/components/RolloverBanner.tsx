"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Check, Trash2, X } from "lucide-react";
import { isoDateKey } from "../domain/viewHelpers";
import { useTodo } from "../state/TodoProvider";
import { TodoConfirmDialog } from "./dialogs/TodoConfirmDialog";

export function RolloverBanner() {
  const {
    rolloverCount,
    rolloverCandidates,
    rolloverMoveToToday,
    rolloverKeepOverdue,
    moveTaskToDay,
    toggleComplete,
    removeTask,
    setUi,
  } = useTodo();
  const [mode, setMode] = useState<"banner" | "review">("banner");
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queue = useMemo(
    () => rolloverCandidates.filter((t) => !skipped.has(t.id)),
    [rolloverCandidates, skipped],
  );
  const current = queue[0] ?? null;

  if (rolloverCount === 0) return null;

  if (mode === "review") {
    return (
      <div className="todo-rollover todo-rollover--review" role="region" aria-label="Review overdue tasks">
        {current ? (
          <>
            <div className="todo-rollover__current">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#7c2d12" }}>
                Reviewing {rolloverCandidates.length - queue.length + 1} of {rolloverCandidates.length}
              </p>
              <p className="todo-rollover__title">{current.title}</p>
              {current.dueAt && <p className="text-xs" style={{ color: "#7c2d12" }}>Was due {current.dueAt.slice(0, 10)}</p>}
            </div>
            <div className="todo-rollover__actions">
              <button type="button" className="todo-btn text-xs" onClick={() => void moveTaskToDay(current.id, isoDateKey(new Date()))}>
                Today
              </button>
              <button
                type="button"
                className="todo-btn text-xs"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  void moveTaskToDay(current.id, isoDateKey(d));
                }}
              >
                Tomorrow
              </button>
              <label className="todo-rollover__pick">
                <CalendarClock size={14} aria-hidden />
                <span className="sr-only">Pick a date for {current.title}</span>
                <input
                  type="date"
                  className="todo-input todo-input--inline"
                  onChange={(e) => e.target.value && void moveTaskToDay(current.id, e.target.value)}
                />
              </label>
              <button type="button" className="todo-btn text-xs" onClick={() => setSkipped((s) => new Set(s).add(current.id))}>
                Keep overdue
              </button>
              <button type="button" className="todo-btn text-xs" onClick={() => void toggleComplete(current.id)} aria-label="Mark done">
                <Check size={14} aria-hidden /> Done
              </button>
              <button type="button" className="todo-btn text-xs" onClick={() => setDeleteId(current.id)} aria-label="Delete task">
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm font-semibold">All caught up — every overdue task has been reviewed. 🎉</p>
        )}
        <button
          type="button"
          className="todo-btn todo-btn--icon todo-btn--ghost"
          aria-label="Close review"
          onClick={() => {
            setMode("banner");
            setSkipped(new Set());
            rolloverKeepOverdue();
          }}
        >
          <X size={16} />
        </button>
        <TodoConfirmDialog
          open={Boolean(deleteId)}
          title="Delete overdue task?"
          description="This removes the task from Darma Tasks. Use this only when the task is no longer needed."
          confirmLabel="Delete task"
          variant="danger"
          onClose={() => setDeleteId(null)}
          onConfirm={async () => {
            if (!deleteId) return;
            await removeTask(deleteId);
            setDeleteId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="todo-rollover" role="status">
      <p className="text-sm font-semibold">
        You have {rolloverCount} unfinished task{rolloverCount === 1 ? "" : "s"} from previous days.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="todo-btn text-xs" onClick={() => void rolloverMoveToToday()}>
          Move all to Today
        </button>
        <button type="button" className="todo-btn text-xs" onClick={rolloverKeepOverdue}>
          Keep overdue
        </button>
        <button type="button" className="todo-btn text-xs" onClick={() => setMode("review")}>
          Review one by one
        </button>
        <button type="button" className="todo-btn text-xs" onClick={() => setUi({ activeFilter: "overdue" })}>
          Open overdue
        </button>
      </div>
    </div>
  );
}
