"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight, GripVertical, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { WEEKDAY_LABELS } from "../../domain/constants";
import { getWeekDays, getWeekStart, groupTasksByDay, isoDateKey } from "../../domain/viewHelpers";
import { isOverdue } from "../../domain/taskRules";
import type { Task } from "../../domain/types";
import { TaskPriorityBadge } from "../task/TaskPriorityBadge";
import { useActiveListId, useTodo } from "../../state/TodoProvider";

const UNSCHEDULED_ID = "week-unscheduled";

function WeekCard({ task, dayOptions }: { task: Task; dayOptions: { key: string; label: string }[] }) {
  const { setUi, toggleComplete, moveTaskToDay } = useTodo();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  const overdue = isOverdue(task);
  const currentDay = task.dueAt ? isoDateKey(task.dueAt) : "";

  return (
    <div className={cn("todo-week-card", task.completed && "todo-week-card--done", isDragging && "todo-week-card--dragging")}>
      <div className="todo-week-card__head">
        <button
          type="button"
          ref={setNodeRef}
          className="todo-drag-handle todo-btn todo-btn--icon todo-btn--ghost"
          aria-label={`Drag ${task.title} to another day`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => void toggleComplete(task.id)}
          aria-label={`Mark ${task.title} ${task.completed ? "incomplete" : "complete"}`}
        />
        <button
          type="button"
          className="todo-week-card__title"
          onClick={() => setUi({ selectedTaskId: task.id, inspectorOpen: true })}
        >
          {task.title}
        </button>
      </div>
      <div className="todo-week-card__meta">
        <TaskPriorityBadge priority={task.priority} />
        {overdue && !task.completed && <span className="todo-badge-overdue">Overdue</span>}
        {task.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="todo-chip todo-chip--xs">#{tag}</span>
        ))}
      </div>
      <label className="sr-only" htmlFor={`move-${task.id}`}>Move {task.title} to day</label>
      <select
        id={`move-${task.id}`}
        className="todo-input todo-input--inline todo-week-card__move"
        value={currentDay}
        onChange={(e) => void moveTaskToDay(task.id, e.target.value || null)}
      >
        <option value="">Unscheduled</option>
        {dayOptions.map((d) => (
          <option key={d.key} value={d.key}>{d.label}</option>
        ))}
      </select>
    </div>
  );
}

function DayQuickAdd({ dayKey }: { dayKey: string }) {
  const { addTask } = useTodo();
  const listId = useActiveListId();
  const [value, setValue] = useState("");
  return (
    <form
      className="todo-week-quickadd"
      onSubmit={(e) => {
        e.preventDefault();
        const v = value.trim();
        if (!v) return;
        void addTask(v, { dueAt: `${dayKey}T12:00:00.000Z`, listId, select: false });
        setValue("");
      }}
    >
      <input
        className="todo-input todo-input--inline"
        placeholder="Add task"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={`Add task on ${dayKey}`}
      />
      <button type="submit" className="todo-btn todo-btn--icon todo-btn--ghost" aria-label="Add task to day">
        <Plus size={14} />
      </button>
    </form>
  );
}

function DayColumn({
  dayKey,
  label,
  dateLabel,
  isToday,
  tasks,
  dayOptions,
}: {
  dayKey: string;
  label: string;
  dateLabel: string;
  isToday: boolean;
  tasks: Task[];
  dayOptions: { key: string; label: string }[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${dayKey}` });
  return (
    <div className={cn("todo-week-col", isToday && "todo-week-col--today")}>
      <div className="todo-week-col__header">
        <span className="todo-week-col__day">{label}</span>
        <span className="todo-week-col__date">{dateLabel}</span>
        <span className="todo-week-col__count">{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className={cn("todo-week-col__body", isOver && "todo-week-col__body--over")}>
        {tasks.length === 0 ? (
          <p className="todo-week-col__empty">No tasks</p>
        ) : (
          tasks.map((task) => <WeekCard key={task.id} task={task} dayOptions={dayOptions} />)
        )}
        <DayQuickAdd dayKey={dayKey} />
      </div>
    </div>
  );
}

export function WeekView() {
  const { tasks, ui, moveTaskToDay } = useTodo();
  const [weekOffset, setWeekOffset] = useState(0);

  const { days, weekStart } = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    const start = getWeekStart(base);
    return { days: getWeekDays(start), weekStart: start };
  }, [weekOffset]);

  const todayKey = isoDateKey(new Date());

  const filtered = useMemo(() => {
    const search = ui.searchQuery.trim().toLowerCase();
    return tasks.filter((t) => {
      if (t.parentTaskId) return false;
      if (ui.selectedTag && !t.tags.some((tag) => tag.toLowerCase() === ui.selectedTag?.toLowerCase())) return false;
      if (search) {
        const haystack = [t.title, ...t.tags].join(" ").toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }, [tasks, ui.searchQuery, ui.selectedTag]);

  const grouping = useMemo(() => groupTasksByDay(filtered, days), [filtered, days]);

  const dayOptions = useMemo(
    () => days.map((d) => ({ key: isoDateKey(d), label: `${WEEKDAY_LABELS[d.getDay()]} ${d.getDate()}` })),
    [days],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const taskId = String(active.id);
    const overId = String(over.id);
    if (overId === UNSCHEDULED_ID) {
      void moveTaskToDay(taskId, null);
    } else if (overId.startsWith("day:")) {
      void moveTaskToDay(taskId, overId.slice(4));
    }
  }

  const { setNodeRef: setUnscheduledRef, isOver: unscheduledOver } = useDroppable({ id: UNSCHEDULED_ID });

  const weekLabel = `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="todo-week">
        <div className="todo-week__toolbar">
          <div className="flex items-center gap-1">
            <button type="button" className="todo-btn todo-btn--icon" aria-label="Previous week" onClick={() => setWeekOffset((o) => o - 1)}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" className="todo-btn text-xs" onClick={() => setWeekOffset(0)}>This week</button>
            <button type="button" className="todo-btn todo-btn--icon" aria-label="Next week" onClick={() => setWeekOffset((o) => o + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
          <p className="text-sm font-semibold">{weekLabel}</p>
        </div>

        <div className="todo-week__grid">
          <div className={cn("todo-week-col todo-week-col--unscheduled", unscheduledOver && "todo-week-col--over")}>
            <div className="todo-week-col__header">
              <span className="todo-week-col__day">Unscheduled</span>
              <span className="todo-week-col__count">{grouping.unscheduled.length}</span>
            </div>
            <div ref={setUnscheduledRef} className={cn("todo-week-col__body", unscheduledOver && "todo-week-col__body--over")}>
              {grouping.unscheduled.length === 0 ? (
                <p className="todo-week-col__empty">Nothing here</p>
              ) : (
                grouping.unscheduled.map((task) => <WeekCard key={task.id} task={task} dayOptions={dayOptions} />)
              )}
            </div>
          </div>

          {days.map((d) => {
            const key = isoDateKey(d);
            return (
              <DayColumn
                key={key}
                dayKey={key}
                label={WEEKDAY_LABELS[d.getDay()]}
                dateLabel={d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                isToday={key === todayKey}
                tasks={grouping.byDay[key] ?? []}
                dayOptions={dayOptions}
              />
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}
