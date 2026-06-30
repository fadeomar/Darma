"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { DEFAULT_BOARD_COLUMNS } from "../../domain/constants";
import { countSubtasks } from "../../domain/taskRules";
import type { BoardColumn, Task, TaskStatus } from "../../domain/types";
import { TaskActionsMenu } from "../task/TaskActionsMenu";
import { TaskDueBadge } from "../task/TaskDueBadge";
import { TaskPriorityBadge } from "../task/TaskPriorityBadge";
import { useActiveListId, useTodo } from "../../state/TodoProvider";

function BoardCard({ task, subCount }: { task: Task; subCount: { total: number; done: number } }) {
  const { setUi } = useTodo();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="todo-board-card"
      onClick={() => setUi({ selectedTaskId: task.id, inspectorOpen: true })}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="todo-board-card__title">{task.title}</p>
        <TaskActionsMenu task={task} compact />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <TaskDueBadge dueAt={task.dueAt} completed={task.completed} />
        <TaskPriorityBadge priority={task.priority} />
        {subCount.total > 0 && (
          <span className="text-[10px] todo-muted">
            {subCount.done}/{subCount.total} subtasks
          </span>
        )}
      </div>
      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="todo-chip text-[10px]">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ColumnDrop({
  column,
  tasks,
  allTasks,
  onAdd,
}: {
  column: BoardColumn;
  tasks: Task[];
  allTasks: Task[];
  onAdd: (status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const ids = tasks.map((t) => t.id);

  return (
    <div className="todo-board-column">
      <div className="todo-board-column__header">
        <span>{column.name}</span>
        <span className="text-xs todo-muted">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className="todo-board-column__body"
        style={{ outline: isOver ? "2px dashed var(--todo-primary)" : undefined }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <BoardCard key={task.id} task={task} subCount={countSubtasks(allTasks, task.id)} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="py-4 text-center text-xs todo-muted">Drop tasks here</p>
        )}
        <button
          type="button"
          className="todo-btn todo-btn--ghost mt-1 w-full text-xs"
          onClick={() => onAdd(column.status ?? "todo")}
        >
          <Plus size={14} aria-hidden />
          Add task
        </button>
      </div>
    </div>
  );
}

export function BoardView() {
  const { tasks, columns, moveToColumn, addTask, ui } = useTodo();
  const listId = useActiveListId();
  const [activeId, setActiveId] = useState<string | null>(null);

  const listColumns = useMemo(() => {
    const cols = columns.filter((c) => c.listId === listId);
    if (cols.length > 0) return cols.sort((a, b) => a.order - b.order);
    return DEFAULT_BOARD_COLUMNS.map((c, i) => ({
      id: `fallback-${listId}-${c.status}`,
      listId,
      ...c,
      order: i,
    }));
  }, [columns, listId]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], doing: [], done: [], blocked: [] };
    for (const t of tasks) {
      if (t.parentTaskId || t.listId !== listId) continue;
      if (ui.searchQuery && !t.title.toLowerCase().includes(ui.searchQuery.toLowerCase())) continue;
      if (ui.selectedTag && !t.tags.includes(ui.selectedTag)) continue;
      map[t.status].push(t);
    }
    for (const key of Object.keys(map) as TaskStatus[]) {
      map[key].sort((a, b) => a.order - b.order);
    }
    return map;
  }, [tasks, listId, ui.searchQuery, ui.selectedTag]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = String(active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const overId = String(over.id);
    const targetColumn = listColumns.find((c) => c.id === overId);
    let targetStatus = task.status;
    let columnTasks = tasksByStatus[task.status];

    if (targetColumn?.status) {
      targetStatus = targetColumn.status;
      columnTasks = tasksByStatus[targetStatus];
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
        columnTasks = tasksByStatus[targetStatus];
      }
    }

    const oldIndex = columnTasks.findIndex((t) => t.id === taskId);
    let newOrder: string[];

    if (targetColumn || !tasks.find((t) => t.id === overId)) {
      newOrder = [...columnTasks.filter((t) => t.id !== taskId).map((t) => t.id), taskId];
    } else {
      const overIndex = columnTasks.findIndex((t) => t.id === overId);
      const without = columnTasks.filter((t) => t.id !== taskId).map((t) => t.id);
      if (overIndex >= 0) {
        without.splice(overIndex, 0, taskId);
        newOrder = without;
      } else {
        newOrder = [...without, taskId];
      }
    }

    if (task.status !== targetStatus || oldIndex !== newOrder.indexOf(taskId)) {
      void moveToColumn(taskId, targetStatus, newOrder);
    } else if (overId !== taskId) {
      const overIndex = columnTasks.findIndex((t) => t.id === overId);
      if (overIndex >= 0 && oldIndex >= 0) {
        newOrder = arrayMove(
          columnTasks.map((t) => t.id),
          oldIndex,
          overIndex,
        );
        void moveToColumn(taskId, targetStatus, newOrder);
      }
    }
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto p-4">
        {listColumns.map((column) => (
          <ColumnDrop
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.status ?? "todo"]}
            allTasks={tasks}
            onAdd={(status) => {
              void addTask("New task", { listId, status });
            }}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="todo-board-card shadow-lg">
            <p className="todo-board-card__title">{activeTask.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
