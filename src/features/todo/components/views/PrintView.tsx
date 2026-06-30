"use client";

import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { DEFAULT_PRINT_OPTIONS, PRIORITY_LABELS, WEEKDAY_LABELS } from "../../domain/constants";
import { isDueToday } from "../../domain/taskRules";
import { getWeekDays, getWeekStart, groupBySection, groupTasksByDay, isoDateKey } from "../../domain/viewHelpers";
import { buildMarkdown, buildPlainText } from "../../data/importExport";
import type { PrintLayout, PrintOptions, Task } from "../../domain/types";
import { useActiveListId, useTodo } from "../../state/TodoProvider";

const LAYOUTS: { value: PrintLayout; label: string }[] = [
  { value: "list", label: "Simple task list" },
  { value: "daily", label: "Daily planner" },
  { value: "weekly", label: "Weekly planner" },
  { value: "checklist", label: "Checklist" },
  { value: "compact", label: "Compact work list" },
];

const TOGGLES: { key: keyof PrintOptions; label: string }[] = [
  { key: "includeCompleted", label: "Completed tasks" },
  { key: "includeSubtasks", label: "Subtasks" },
  { key: "includeNotes", label: "Notes" },
  { key: "includeTags", label: "Tags" },
  { key: "includePriority", label: "Priorities" },
  { key: "includeDue", label: "Due dates" },
];

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function TaskLine({ task, allTasks, opts }: { task: Task; allTasks: Task[]; opts: PrintOptions }) {
  const subs = opts.includeSubtasks ? allTasks.filter((t) => t.parentTaskId === task.id) : [];
  return (
    <li className="todo-print-item">
      <span className="todo-print-box" aria-hidden>{task.completed ? "☑" : "☐"}</span>
      <span className="todo-print-text">
        <span className={task.completed ? "todo-print-done" : ""}>{task.title}</span>
        {opts.includePriority && task.priority !== "none" && <span className="todo-print-tag">[{PRIORITY_LABELS[task.priority]}]</span>}
        {opts.includeDue && task.dueAt && <span className="todo-print-tag">due {task.dueAt.slice(0, 10)}</span>}
        {opts.includeTags && task.tags.map((tag) => <span key={tag} className="todo-print-tag">#{tag}</span>)}
        {opts.includeNotes && task.description?.trim() && <span className="todo-print-note">{task.description.trim()}</span>}
        {subs.length > 0 && (
          <ul className="todo-print-subitems">
            {subs.map((s) => (
              <li key={s.id}><span aria-hidden>{s.completed ? "☑" : "☐"}</span> {s.title}</li>
            ))}
          </ul>
        )}
      </span>
    </li>
  );
}

export function PrintView() {
  const { tasks, tasksForList, lists } = useTodo();
  const listId = useActiveListId();
  const list = lists.find((l) => l.id === listId);
  const [opts, setOpts] = useState<PrintOptions>(DEFAULT_PRINT_OPTIONS);

  const allTop = useMemo(() => tasks.filter((t) => !t.parentTaskId), [tasks]);
  const listTop = useMemo(
    () => tasksForList(listId).filter((t) => !t.parentTaskId).sort((a, b) => a.order - b.order),
    [tasksForList, listId],
  );

  const visible = (arr: Task[]) => arr.filter((t) => opts.includeCompleted || !t.completed);

  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => getWeekDays(getWeekStart(today)), [today]);
  const weekGrouping = useMemo(
    () => groupTasksByDay(allTop.filter((t) => opts.includeCompleted || !t.completed), weekDays),
    [allTop, weekDays, opts.includeCompleted],
  );

  const copyText = (format: "md" | "txt") => {
    const source = opts.layout === "daily" ? visible(allTop).filter((t) => isDueToday(t)) : visible(listTop);
    const text =
      format === "md"
        ? buildMarkdown(source, tasks, { title: list?.name, ...opts })
        : buildPlainText(source, tasks, { title: list?.name, ...opts });
    void navigator.clipboard?.writeText(text).catch(() => {});
  };

  const download = (format: "md" | "txt") => {
    const source = opts.layout === "daily" ? visible(allTop).filter((t) => isDueToday(t)) : visible(listTop);
    const text =
      format === "md"
        ? buildMarkdown(source, tasks, { title: list?.name, ...opts })
        : buildPlainText(source, tasks, { title: list?.name, ...opts });
    const safe = (list?.name ?? "darma-tasks").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    downloadFile(`${safe}.${format}`, text, format === "md" ? "text/markdown" : "text/plain");
  };

  return (
    <div className="todo-print">
      <aside className="todo-print-controls">
        <div>
          <label className="mb-1 block text-xs font-semibold todo-muted" htmlFor="print-layout">Layout</label>
          <select
            id="print-layout"
            className="todo-input text-sm"
            value={opts.layout}
            onChange={(e) => setOpts((o) => ({ ...o, layout: e.target.value as PrintLayout }))}
          >
            {LAYOUTS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        <fieldset className="todo-print-toggles">
          <legend className="text-xs font-semibold todo-muted">Include</legend>
          {TOGGLES.map((t) => (
            <label key={t.key} className="todo-print-toggle">
              <input
                type="checkbox"
                checked={Boolean(opts[t.key])}
                onChange={(e) => setOpts((o) => ({ ...o, [t.key]: e.target.checked }))}
              />
              {t.label}
            </label>
          ))}
        </fieldset>

        <div className="todo-print-controls__actions">
          <button type="button" className="todo-btn todo-btn--primary text-xs" onClick={() => window.print()}>
            <Printer size={14} aria-hidden /> Print
          </button>
          <button type="button" className="todo-btn text-xs" onClick={() => copyText("md")}>Copy MD</button>
          <button type="button" className="todo-btn text-xs" onClick={() => copyText("txt")}>Copy text</button>
          <button type="button" className="todo-btn text-xs" onClick={() => download("txt")}>
            <Download size={14} aria-hidden /> .txt
          </button>
          <button type="button" className="todo-btn text-xs" onClick={() => download("md")}>
            <Download size={14} aria-hidden /> .md
          </button>
        </div>
        <p className="text-xs todo-muted">Daily and weekly layouts use due dates across all lists. List, checklist, and compact layouts use the active list ({list?.name ?? "—"}).</p>
      </aside>

      <div className="todo-print-area" dir="auto">
        {opts.layout === "weekly" ? (
          <div className="todo-print-sheet">
            <h1 className="todo-print-h1">Weekly planner</h1>
            <p className="todo-print-sub">{weekDays[0].toLocaleDateString()} – {weekDays[6].toLocaleDateString()}</p>
            <div className="todo-print-week">
              {weekDays.map((d) => {
                const key = isoDateKey(d);
                const dayTasks = weekGrouping.byDay[key] ?? [];
                return (
                  <div key={key} className="todo-print-day">
                    <h2 className="todo-print-h2">{WEEKDAY_LABELS[d.getDay()]} {d.getDate()}</h2>
                    {dayTasks.length === 0 ? <p className="todo-print-muted">—</p> : (
                      <ul className="todo-print-list">
                        {dayTasks.map((t) => <TaskLine key={t.id} task={t} allTasks={tasks} opts={opts} />)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : opts.layout === "daily" ? (
          <div className="todo-print-sheet">
            <h1 className="todo-print-h1">Daily planner</h1>
            <p className="todo-print-sub">{today.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            {(() => {
              const dayTasks = visible(allTop).filter((t) => isDueToday(t));
              return dayTasks.length === 0 ? (
                <p className="todo-print-muted">No tasks due today.</p>
              ) : (
                <ul className="todo-print-list">
                  {dayTasks.map((t) => <TaskLine key={t.id} task={t} allTasks={tasks} opts={opts} />)}
                </ul>
              );
            })()}
          </div>
        ) : opts.layout === "checklist" ? (
          <div className="todo-print-sheet">
            <h1 className="todo-print-h1">{list?.name ?? "Checklist"}</h1>
            {groupBySection(visible(listTop)).map(({ section, tasks: sectionTasks }) => (
              <div key={section || "__none"} className="todo-print-section">
                {section && <h2 className="todo-print-h2">{section}</h2>}
                <ul className="todo-print-list">
                  {sectionTasks.map((t) => <TaskLine key={t.id} task={t} allTasks={tasks} opts={opts} />)}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="todo-print-sheet">
            <h1 className="todo-print-h1">{list?.name ?? "Tasks"}</h1>
            <ul className={opts.layout === "compact" ? "todo-print-list todo-print-list--compact" : "todo-print-list"}>
              {visible(listTop).map((t) => <TaskLine key={t.id} task={t} allTasks={tasks} opts={opts} />)}
            </ul>
            {visible(listTop).length === 0 && <p className="todo-print-muted">No tasks to print.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
