"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { PRIORITY_LABELS, STATUS_LABELS } from "../../domain/constants";
import { countSubtasks, toDateInputValue, fromDateInputValue } from "../../domain/taskRules";
import { sortTasksByColumn, type SortDir, type TableSortKey } from "../../domain/viewHelpers";
import type { TaskPriority, TaskStatus } from "../../domain/types";
import { TaskActionsMenu } from "../task/TaskActionsMenu";
import { TaskCheckbox } from "../task/TaskCheckbox";
import { useTodo } from "../../state/TodoProvider";

const COLUMNS: { key: TableSortKey; label: string; className?: string }[] = [
  { key: "title", label: "Task" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "due", label: "Due" },
  { key: "updated", label: "Updated", className: "todo-table__col--secondary" },
];

export function TableView() {
  const { visibleTasks, tasks, lists, saveTask, toggleComplete, setUi, ui } = useTodo();
  const [sortKey, setSortKey] = useState<TableSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const listName = useMemo(() => {
    const map = new Map(lists.map((l) => [l.id, l]));
    return (id: string) => map.get(id);
  }, [lists]);

  const rows = useMemo(() => {
    if (!sortKey) return visibleTasks;
    return sortTasksByColumn(visibleTasks, sortKey, sortDir);
  }, [visibleTasks, sortKey, sortDir]);

  function toggleSort(key: TableSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (visibleTasks.length === 0) {
    return (
      <div className="todo-empty">
        <p className="font-semibold">No tasks to show</p>
        <p className="mt-1 text-sm">Add a task or change the filter to populate the table.</p>
      </div>
    );
  }

  return (
    <div className="todo-table-wrap">
      <table className="todo-table">
        <caption className="sr-only">Tasks table with sortable columns and inline editing</caption>
        <thead>
          <tr>
            <th scope="col" className="todo-table__check" />
            {COLUMNS.map((col) => {
              const active = sortKey === col.key;
              return (
                <th key={col.key} scope="col" className={col.className} aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" className="todo-table__sortbtn" onClick={() => toggleSort(col.key)}>
                    {col.label}
                    {active ? (
                      sortDir === "asc" ? <ArrowUp size={12} aria-hidden /> : <ArrowDown size={12} aria-hidden />
                    ) : (
                      <ChevronsUpDown size={12} className="todo-muted" aria-hidden />
                    )}
                  </button>
                </th>
              );
            })}
            <th scope="col" className="todo-table__col--secondary">List</th>
            <th scope="col" className="todo-table__col--secondary">Subtasks</th>
            <th scope="col" className="todo-table__actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((task) => {
            const subs = countSubtasks(tasks, task.id);
            const list = listName(task.listId);
            return (
              <tr
                key={task.id}
                className={cn("todo-table__row", task.completed && "todo-table__row--done", ui.selectedTaskId === task.id && "todo-table__row--selected")}
                onClick={() => setUi({ selectedTaskId: task.id, inspectorOpen: true })}
              >
                <td className="todo-table__check" data-label="Done" onClick={(e) => e.stopPropagation()}>
                  <TaskCheckbox checked={task.completed} onChange={() => void toggleComplete(task.id)} label={task.title} />
                </td>
                <td data-label="Task">
                  <span className="todo-table__title" title={task.title}>{task.title}</span>
                  {task.tags.length > 0 && (
                    <span className="todo-table__tags">
                      {task.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="todo-chip todo-chip--xs">#{tag}</span>
                      ))}
                    </span>
                  )}
                </td>
                <td data-label="Status" onClick={(e) => e.stopPropagation()}>
                  <select
                    className="todo-input todo-input--inline"
                    value={task.status}
                    aria-label={`Status for ${task.title}`}
                    onChange={(e) => void saveTask(task.id, { status: e.target.value as TaskStatus, completed: e.target.value === "done" })}
                  >
                    {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
                <td data-label="Priority" onClick={(e) => e.stopPropagation()}>
                  <select
                    className="todo-input todo-input--inline"
                    value={task.priority}
                    aria-label={`Priority for ${task.title}`}
                    onChange={(e) => void saveTask(task.id, { priority: e.target.value as TaskPriority })}
                  >
                    {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                      <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                    ))}
                  </select>
                </td>
                <td data-label="Due" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="date"
                    className="todo-input todo-input--inline"
                    value={toDateInputValue(task.dueAt)}
                    aria-label={`Due date for ${task.title}`}
                    onChange={(e) => void saveTask(task.id, { dueAt: fromDateInputValue(e.target.value) })}
                  />
                </td>
                <td data-label="Updated" className="todo-table__col--secondary">
                  <span className="text-xs todo-muted">{new Date(task.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </td>
                <td data-label="List" className="todo-table__col--secondary">
                  {list ? (
                    <span className="todo-table__listname">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: list.color ?? "var(--todo-primary)" }} aria-hidden />
                      {list.name}
                    </span>
                  ) : (
                    <span className="todo-muted text-xs">—</span>
                  )}
                </td>
                <td data-label="Subtasks" className="todo-table__col--secondary">
                  {subs.total > 0 ? <span className="text-xs todo-muted">{subs.done}/{subs.total}</span> : <span className="todo-muted text-xs">—</span>}
                </td>
                <td className="todo-table__actions" onClick={(e) => e.stopPropagation()}>
                  <TaskActionsMenu task={task} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
