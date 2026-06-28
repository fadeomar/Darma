"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { PRIORITY_LABELS, STATUS_LABELS } from "../../domain/constants";
import { toDateInputValue, fromDateInputValue } from "../../domain/taskRules";
import type { TaskPriority, TaskStatus } from "../../domain/types";
import { TaskActionsMenu } from "../task/TaskActionsMenu";
import { useTodo } from "../../state/TodoProvider";

type Props = {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export function TodoInspector({ mobileOpen, onCloseMobile }: Props) {
  const { selectedTask, subtasks, saveTask, addTask, setUi, ui } = useTodo();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");

  useEffect(() => {
    if (!selectedTask) return;
    setTitle(selectedTask.title);
    setDescription(selectedTask.description ?? "");
    setTags(selectedTask.tags.join(", "));
  }, [selectedTask]);

  if (!selectedTask && !mobileOpen) {
    return (
      <aside className="todo-studio__inspector todo-panel hidden border-s lg:flex lg:flex-col">
        <div className="todo-empty flex-1">
          <p className="text-sm">Select a task to view details</p>
        </div>
      </aside>
    );
  }

  if (!selectedTask) return null;

  async function persist(field: Partial<typeof selectedTask>) {
    await saveTask(selectedTask!.id, field);
  }

  async function saveTitle() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(selectedTask!.title);
      return;
    }
    if (trimmed !== selectedTask!.title) await persist({ title: trimmed });
  }

  return (
    <aside
      className={cn(
        "todo-studio__inspector todo-panel flex h-full flex-col border-s",
        mobileOpen && "todo-studio__inspector--open",
        !ui.inspectorOpen && !mobileOpen && "hidden lg:flex",
      )}
    >
      <header className="todo-inspector__header">
        <h2 className="todo-inspector__title">Task details</h2>
        <button
          type="button"
          className="todo-btn todo-btn--icon todo-btn--ghost"
          aria-label="Close inspector"
          onClick={() => {
            onCloseMobile?.();
            setUi({ selectedTaskId: null, inspectorOpen: false });
          }}
        >
          <X size={16} />
        </button>
      </header>

      <div className="todo-inspector__body">
        <div className="todo-field">
          <label className="todo-field__label" htmlFor="inspector-title">
            Title
          </label>
          <input
            id="inspector-title"
            className="todo-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => void saveTitle()}
            maxLength={500}
          />
        </div>

        <div className="todo-field">
          <label className="todo-field__label" htmlFor="inspector-desc">
            Description
          </label>
          <textarea
            id="inspector-desc"
            className="todo-input min-h-[100px] resize-y py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => void persist({ description: description.trim() || undefined })}
          />
        </div>

        <div className="todo-field-grid">
          <div className="todo-field">
            <label className="todo-field__label" htmlFor="inspector-status">
              Status
            </label>
            <select
              id="inspector-status"
              className="todo-input text-sm"
              value={selectedTask.status}
              onChange={(e) => void persist({ status: e.target.value as TaskStatus, completed: e.target.value === "done" })}
            >
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="todo-field">
            <label className="todo-field__label" htmlFor="inspector-priority">
              Priority
            </label>
            <select
              id="inspector-priority"
              className="todo-input text-sm"
              value={selectedTask.priority}
              onChange={(e) => void persist({ priority: e.target.value as TaskPriority })}
            >
              {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="todo-field">
          <label className="todo-field__label" htmlFor="inspector-due">
            Due date
          </label>
          <input
            id="inspector-due"
            type="date"
            className="todo-input"
            value={toDateInputValue(selectedTask.dueAt)}
            onChange={(e) => void persist({ dueAt: fromDateInputValue(e.target.value) })}
          />
        </div>

        <div className="todo-field">
          <label className="todo-field__label" htmlFor="inspector-tags">
            Tags (comma separated)
          </label>
          <input
            id="inspector-tags"
            className="todo-input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            onBlur={() =>
              void persist({
                tags: tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>

        <div className="todo-field">
          <div className="flex items-center justify-between">
            <span className="todo-field__label">Subtasks</span>
            <span className="text-xs todo-muted">
              {subtasks.filter((s) => s.completed).length}/{subtasks.length}
            </span>
          </div>
          <ul className="space-y-1">
            {subtasks.map((sub) => (
              <li key={sub.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sub.completed}
                  onChange={() =>
                    void saveTask(sub.id, {
                      completed: !sub.completed,
                      status: !sub.completed ? "done" : "todo",
                    })
                  }
                  aria-label={`Subtask ${sub.title}`}
                />
                <span className={sub.completed ? "line-through todo-muted" : ""}>{sub.title}</span>
              </li>
            ))}
          </ul>
          <form
            className="mt-1 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = subtaskInput.trim();
              if (!v) return;
              void addTask(v, { parentTaskId: selectedTask.id, listId: selectedTask.listId, select: false });
              setSubtaskInput("");
            }}
          >
            <input
              className="todo-input flex-1 text-sm"
              placeholder="Add subtask"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              aria-label="New subtask"
            />
            <button type="submit" className="todo-btn todo-btn--icon" aria-label="Add subtask">
              <Plus size={16} />
            </button>
          </form>
        </div>
      </div>

      <footer className="todo-inspector__footer">
        <TaskActionsMenu task={selectedTask} />
        <button
          type="button"
          className="todo-btn flex-1 text-xs"
          onClick={() => {
            onCloseMobile?.();
            setUi({ selectedTaskId: null, inspectorOpen: false });
          }}
        >
          Close
        </button>
      </footer>
    </aside>
  );
}
