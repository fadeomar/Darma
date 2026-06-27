"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRightCircle, X } from "lucide-react";
import {
  calculateSelectedEstimate,
  getRecommendedNextTask,
  getTodayPlannerGroups,
  sortFocusTasks,
  type FocusSortStrategy,
} from "../../domain/planner";
import type { Task } from "../../domain/types";
import { TaskPriorityBadge } from "../task/TaskPriorityBadge";
import { useTodo } from "../../state/TodoProvider";

type Props = { open: boolean; onClose: () => void };

export function PlanTodayPanel({ open, onClose }: Props) {
  const { tasks, moveTasksToToday, saveTask, setUi } = useTodo();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [strategy, setStrategy] = useState<FocusSortStrategy>("urgent-first");

  useEffect(() => {
    if (!open) setSelected(new Set());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const groups = useMemo(() => getTodayPlannerGroups(tasks), [tasks]);
  const recommended = useMemo(() => getRecommendedNextTask(tasks, strategy), [tasks, strategy]);
  const selectedEstimate = useMemo(() => calculateSelectedEstimate(tasks, selected), [tasks, selected]);
  const selectedHours = selectedEstimate / 60;
  const warning = selectedEstimate > 480 || selected.size > 12;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function moveSelected() {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      await moveTasksToToday([...selected]);
      setSelected(new Set());
      setUi({ activeFilter: "today", activeListId: null });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const totalCandidates = groups.overdue.length + groups.today.length + groups.importantNoDate.length + groups.recentlyAdded.length;
  const allCandidateTasks = sortFocusTasks(
    [...groups.overdue, ...groups.today, ...groups.importantNoDate, ...groups.recentlyAdded],
    strategy,
  );

  return (
    <div className="todo-modal" role="dialog" aria-modal="true" aria-label="Plan today">
      <button type="button" className="todo-modal__backdrop" aria-label="Close plan today" onClick={onClose} />
      <div className="todo-modal__panel todo-plan">
        <header className="todo-gallery__header">
          <div>
            <h2 className="text-base font-bold">Smart Day Planner</h2>
            <p className="text-xs todo-muted">Build a realistic today list from overdue, due-today, high-priority, and recent tasks.</p>
          </div>
          <button type="button" className="todo-btn todo-btn--icon todo-btn--ghost" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        <div className="todo-plan__summary">
          <div>
            <p className="text-xs font-semibold todo-muted">Selected estimate</p>
            <p className="text-lg font-bold">{selectedEstimate} min <span className="text-sm todo-muted">({selectedHours.toFixed(1)}h)</span></p>
            {warning && <p className="text-xs text-[var(--todo-warning)]">This plan may be heavy. Consider picking fewer tasks or shorter estimates.</p>}
          </div>
          <div>
            <label className="text-xs font-semibold todo-muted" htmlFor="todo-focus-order">Focus order</label>
            <select id="todo-focus-order" className="todo-input mt-1 text-sm" value={strategy} onChange={(e) => setStrategy(e.target.value as FocusSortStrategy)}>
              <option value="urgent-first">Urgent / high first</option>
              <option value="due-first">Due date first</option>
              <option value="shortest-first">Shortest first</option>
              <option value="manual">Manual order</option>
            </select>
          </div>
          <div className="todo-plan__next">
            <p className="text-xs font-semibold todo-muted">Next recommended</p>
            {recommended ? (
              <button type="button" className="todo-btn todo-btn--ghost justify-start text-start" onClick={() => { setUi({ selectedTaskId: recommended.id, inspectorOpen: true }); onClose(); }}>
                <ArrowRightCircle size={14} aria-hidden /> {recommended.title}
              </button>
            ) : (
              <p className="text-sm todo-muted">No recommendation yet.</p>
            )}
          </div>
        </div>

        <div className="todo-plan__body">
          {totalCandidates === 0 ? (
            <p className="todo-muted py-8 text-center text-sm">Nothing to plan — you have no overdue, due-today, high-priority, or recent open tasks.</p>
          ) : (
            <>
              <PlanGroup title="Overdue" tasks={groups.overdue} selected={selected} strategy={strategy} onToggle={toggle} onEstimate={(id, estimateMinutes) => void saveTask(id, { estimateMinutes })} onOpen={(id) => { setUi({ selectedTaskId: id, inspectorOpen: true }); onClose(); }} />
              <PlanGroup title="Due today" tasks={groups.today} selected={selected} strategy={strategy} onToggle={toggle} onEstimate={(id, estimateMinutes) => void saveTask(id, { estimateMinutes })} onOpen={(id) => { setUi({ selectedTaskId: id, inspectorOpen: true }); onClose(); }} />
              <PlanGroup title="Important, no date" tasks={groups.importantNoDate} selected={selected} strategy={strategy} onToggle={toggle} onEstimate={(id, estimateMinutes) => void saveTask(id, { estimateMinutes })} onOpen={(id) => { setUi({ selectedTaskId: id, inspectorOpen: true }); onClose(); }} />
              <PlanGroup title="Recently added" tasks={groups.recentlyAdded} selected={selected} strategy={strategy} onToggle={toggle} onEstimate={(id, estimateMinutes) => void saveTask(id, { estimateMinutes })} onOpen={(id) => { setUi({ selectedTaskId: id, inspectorOpen: true }); onClose(); }} />
            </>
          )}

          {allCandidateTasks.length > 0 && (
            <section className="todo-plan__group">
              <h3 className="todo-gallery__sectiontitle">Focus order preview</h3>
              <ol className="todo-plan__focuslist">
                {allCandidateTasks.slice(0, 8).map((task) => <li key={task.id}>{task.title}</li>)}
              </ol>
            </section>
          )}
        </div>

        <footer className="todo-plan__footer">
          <span className="text-sm todo-muted">{selected.size} selected · {selectedEstimate} minutes</span>
          <button type="button" className="todo-btn todo-btn--primary" disabled={selected.size === 0 || busy} onClick={() => void moveSelected()}>
            Move selected to Today
          </button>
        </footer>
      </div>
    </div>
  );
}

function PlanGroup({
  title,
  tasks,
  selected,
  strategy,
  onToggle,
  onOpen,
  onEstimate,
}: {
  title: string;
  tasks: Task[];
  selected: Set<string>;
  strategy: FocusSortStrategy;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  onEstimate: (id: string, estimateMinutes: number | undefined) => void;
}) {
  const ordered = useMemo(() => sortFocusTasks(tasks, strategy), [tasks, strategy]);
  if (ordered.length === 0) return null;
  return (
    <section className="todo-plan__group">
      <h3 className="todo-gallery__sectiontitle">{title} <span className="todo-muted">({ordered.length})</span></h3>
      <ul className="todo-plan__list">
        {ordered.map((task) => (
          <li key={task.id} className="todo-plan__item">
            <label className="todo-plan__label">
              <input type="checkbox" checked={selected.has(task.id)} onChange={() => onToggle(task.id)} aria-label={`Select ${task.title}`} />
              <span className="todo-plan__text">{task.title}</span>
            </label>
            <div className="todo-plan__itemmeta">
              <TaskPriorityBadge priority={task.priority} />
              {task.dueAt && <span className="text-xs todo-muted">{task.dueAt.slice(0, 10)}</span>}
              <label className="todo-plan__estimate">
                <span className="sr-only">Estimate minutes for {task.title}</span>
                <input
                  type="number"
                  min={0}
                  step={15}
                  className="todo-input"
                  value={task.estimateMinutes ?? 30}
                  onChange={(e) => onEstimate(task.id, e.target.value ? Number(e.target.value) : undefined)}
                />
                min
              </label>
              <button type="button" className="todo-btn todo-btn--ghost text-xs" onClick={() => onOpen(task.id)}>Open</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
