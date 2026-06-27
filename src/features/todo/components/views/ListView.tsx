"use client";

import { useMemo } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/cn";
import { countSubtasks } from "../../domain/taskRules";
import { TaskActionsMenu } from "../task/TaskActionsMenu";
import { TaskCheckbox } from "../task/TaskCheckbox";
import { TaskDueBadge } from "../task/TaskDueBadge";
import { TaskPriorityBadge } from "../task/TaskPriorityBadge";
import { useTodo } from "../../state/TodoProvider";
import type { Task } from "../../domain/types";

function SortableRow({ task, subtaskCount }: { task: Task; subtaskCount: { total: number; done: number } }) {
  const { ui, setUi, toggleComplete } = useTodo();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "todo-task-row",
        ui.selectedTaskId === task.id && "todo-task-row--selected",
      )}
      onClick={() => setUi({ selectedTaskId: task.id, inspectorOpen: true })}
    >
      <button
        type="button"
        className="todo-drag-handle todo-btn todo-btn--icon todo-btn--ghost"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <TaskCheckbox checked={task.completed} onChange={() => void toggleComplete(task.id)} label={task.title} />
      <span
        className={cn("todo-task-row__title", task.completed && "todo-task-row__title--done")}
        title={task.title}
      >
        {task.title}
      </span>
      <TaskDueBadge dueAt={task.dueAt} completed={task.completed} />
      <TaskPriorityBadge priority={task.priority} />
      {task.tags.slice(0, 2).map((tag) => (
        <span key={tag} className="todo-chip hidden sm:inline-flex">
          #{tag}
        </span>
      ))}
      {subtaskCount.total > 0 && (
        <span className="text-xs todo-muted hidden md:inline">
          {subtaskCount.done}/{subtaskCount.total}
        </span>
      )}
      <TaskActionsMenu task={task} />
    </div>
  );
}

export function ListView() {
  const { visibleTasks, reorderVisible, tasks } = useTodo();
  const ids = useMemo(() => visibleTasks.map((t) => t.id), [visibleTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    void reorderVisible(arrayMove(ids, oldIndex, newIndex));
  }

  if (visibleTasks.length === 0) {
    return (
      <div className="todo-empty">
        <p className="font-semibold">No tasks here</p>
        <p className="mt-1 text-sm">Add one with quick capture or pick a different filter.</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div role="list" aria-label="Task list">
          {visibleTasks.map((task) => (
            <SortableRow
              key={task.id}
              task={task}
              subtaskCount={countSubtasks(tasks, task.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
