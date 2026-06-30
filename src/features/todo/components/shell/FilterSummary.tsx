"use client";

import { useActiveListId, useTodo } from "../../state/TodoProvider";
import type { SidebarFilter } from "../../domain/types";

const FILTER_NAMES: Record<Exclude<SidebarFilter, "all">, string> = {
  today: "Today",
  upcoming: "Upcoming",
  overdue: "Overdue",
  completed: "Completed",
  "high-priority": "High Priority",
  "no-date": "No Date",
};

/**
 * Compact summary above List/Table views so the active filter — and the fact
 * that most filters hide completed tasks — is never a mystery.
 */
export function FilterSummary() {
  const { ui, setUi, visibleTasks, lists } = useTodo();
  const activeListId = useActiveListId();
  const selectedTag = ui.selectedTag;

  const count = visibleTasks.length;
  const filter = ui.activeFilter;
  const hidesCompleted = filter !== "all" && filter !== "completed";

  const name =
    filter === "all"
      ? lists.find((l) => l.id === activeListId)?.name ?? "All tasks"
      : FILTER_NAMES[filter];

  const descriptor =
    filter === "completed"
      ? "completed only"
      : hidesCompleted
        ? "incomplete only"
        : "all tasks";

  return (
    <div className="todo-filter-summary">
      <span className="todo-filter-summary__name">{name}</span>
      {selectedTag && (
        <>
          <span className="todo-filter-summary__sep" aria-hidden>·</span>
          <span>#{selectedTag}</span>
        </>
      )}
      <span className="todo-filter-summary__sep" aria-hidden>·</span>
      <span>
        {count} {count === 1 ? "task" : "tasks"}
      </span>
      <span className="todo-filter-summary__sep" aria-hidden>·</span>
      <span>{descriptor}</span>

      {hidesCompleted && (
        <button
          type="button"
          className="todo-btn todo-btn--ghost todo-filter-summary__action"
          onClick={() => setUi({ activeFilter: "completed", activeListId: null })}
        >
          Show completed
        </button>
      )}
      {filter === "completed" && (
        <button
          type="button"
          className="todo-btn todo-btn--ghost todo-filter-summary__action"
          onClick={() => setUi({ activeFilter: "today", activeListId: null })}
        >
          Back to active
        </button>
      )}
    </div>
  );
}
