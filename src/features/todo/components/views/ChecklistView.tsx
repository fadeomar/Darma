"use client";

import { useMemo, useState } from "react";
import { Copy, Printer, RotateCcw, CheckCheck, CopyPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { checklistProgress, groupBySection } from "../../domain/viewHelpers";
import { useActiveListId, useTodo } from "../../state/TodoProvider";
import { TodoConfirmDialog } from "../dialogs/TodoConfirmDialog";

type ChecklistAction = "complete-all" | "reset" | null;

export function ChecklistView() {
  const {
    lists,
    tasksForList,
    toggleComplete,
    setUi,
    resetChecklist,
    completeAllInList,
    duplicateList,
    copyListText,
  } = useTodo();
  const listId = useActiveListId();
  const list = lists.find((l) => l.id === listId);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ChecklistAction>(null);
  const [busy, setBusy] = useState(false);

  const listTasks = tasksForList(listId);
  const topLevel = useMemo(() => listTasks.filter((t) => !t.parentTaskId), [listTasks]);
  const progress = useMemo(() => checklistProgress(topLevel), [topLevel]);
  const sections = useMemo(() => groupBySection(topLevel), [topLevel]);

  async function handleCopy(format: "md" | "txt") {
    const ok = await copyListText(listId, format);
    setCopied(ok ? format : null);
    window.setTimeout(() => setCopied(null), 1500);
  }

  async function confirmChecklistAction() {
    if (!confirmAction) return;
    setBusy(true);
    try {
      if (confirmAction === "complete-all") await completeAllInList(listId);
      if (confirmAction === "reset") await resetChecklist(listId);
      setConfirmAction(null);
    } finally {
      setBusy(false);
    }
  }

  if (topLevel.length === 0) {
    return (
      <div className="todo-empty">
        <p className="font-semibold">This list is empty</p>
        <p className="mt-1 text-sm">Add steps to {list?.name ?? "this list"} or start from a template to build a checklist.</p>
      </div>
    );
  }

  return (
    <div className="todo-checklist">
      <header className="todo-checklist__header">
        <div className="min-w-0">
          <p className="todo-checklist__title">{list?.name ?? "Checklist"}</p>
          <p className="text-sm todo-muted">{progress.done} of {progress.total} complete</p>
        </div>
        <div className="todo-checklist__progresswrap" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Checklist progress">
          <div className="todo-checklist__progressbar">
            <div className="todo-checklist__progressfill" style={{ width: `${progress.percent}%` }} />
          </div>
          <span className="todo-checklist__percent">{progress.percent}%</span>
        </div>
      </header>

      <div className="todo-checklist__actions">
        <button type="button" className="todo-btn text-xs" onClick={() => setConfirmAction("complete-all")}>
          <CheckCheck size={14} aria-hidden /> Complete all
        </button>
        <button type="button" className="todo-btn text-xs" onClick={() => setConfirmAction("reset")}>
          <RotateCcw size={14} aria-hidden /> Reset
        </button>
        <button type="button" className="todo-btn text-xs" onClick={() => void duplicateList(listId)}>
          <CopyPlus size={14} aria-hidden /> Duplicate
        </button>
        <button type="button" className="todo-btn text-xs" onClick={() => setUi({ activeView: "print" })}>
          <Printer size={14} aria-hidden /> Print
        </button>
        <button type="button" className="todo-btn text-xs" onClick={() => void handleCopy("md")}>
          <Copy size={14} aria-hidden /> {copied === "md" ? "Copied!" : "Copy MD"}
        </button>
        <button type="button" className="todo-btn text-xs" onClick={() => void handleCopy("txt")}>
          <Copy size={14} aria-hidden /> {copied === "txt" ? "Copied!" : "Copy text"}
        </button>
      </div>

      <div className="todo-checklist__body">
        {sections.map(({ section, tasks }) => (
          <section key={section || "__none"} className="todo-checklist__section">
            {section && <h3 className="todo-checklist__sectiontitle">{section}</h3>}
            <ul className="todo-checklist__items">
              {tasks.map((task) => (
                <li key={task.id} className={cn("todo-checklist__item", task.completed && "todo-checklist__item--done")}>
                  <label className="todo-checklist__label">
                    <input
                      type="checkbox"
                      className="todo-checklist__check"
                      checked={task.completed}
                      onChange={() => void toggleComplete(task.id)}
                      aria-label={`${task.title} ${task.completed ? "done" : "not done"}`}
                    />
                    <span className="todo-checklist__text">{task.title}</span>
                  </label>
                  <button
                    type="button"
                    className="todo-btn todo-btn--ghost text-xs"
                    onClick={() => setUi({ selectedTaskId: task.id, inspectorOpen: true })}
                  >
                    Details
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <TodoConfirmDialog
        open={confirmAction !== null}
        title={confirmAction === "complete-all" ? "Complete every task?" : "Reset this checklist?"}
        description={
          confirmAction === "complete-all"
            ? `This will mark all tasks in "${list?.name ?? "this list"}" as complete.`
            : `This will mark all tasks in "${list?.name ?? "this list"}" as incomplete.`
        }
        confirmLabel={confirmAction === "complete-all" ? "Complete all" : "Reset checklist"}
        variant={confirmAction === "reset" ? "danger" : "default"}
        busy={busy}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmChecklistAction}
      />
    </div>
  );
}
