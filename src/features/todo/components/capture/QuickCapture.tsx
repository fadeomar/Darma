"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { parseQuickCaptureInput } from "../../domain/parsers";
import { useActiveListId, useTodo } from "../../state/TodoProvider";

export function QuickCapture() {
  const { addTask, ui } = useTodo();
  const listId = useActiveListId();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const value = title.trim();
    if (!value || busy) return;
    const parsed = parseQuickCaptureInput(value);
    if (!parsed) return;
    setBusy(true);
    try {
      // Give the new task a due date of today when the user is capturing from
      // the Today list or the Today smart filter, unless the smart input already
      // found a date such as tomorrow / غدًا.
      const dueToday = listId === "list-today" || ui.activeFilter === "today";
      const dueAt = parsed.dueAt ?? (dueToday ? new Date().toISOString() : undefined);
      await addTask(parsed.title, {
        listId,
        dueAt,
        tags: parsed.tags,
        priority: parsed.priority,
        status: parsed.completed ? "done" : parsed.status,
      });
      setTitle("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="todo-quick-capture">
      <form
        className="todo-quick-capture__row"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <input
          type="text"
          className="todo-input"
          placeholder="Quick capture — press Enter to add"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Quick capture task title"
          maxLength={500}
        />
        <button
          type="submit"
          className="todo-btn todo-btn--primary todo-quick-capture__add"
          disabled={!title.trim() || busy}
          aria-label="Add task"
        >
          <Plus size={16} aria-hidden />
          <span className="todo-quick-capture__add-label">Add</span>
        </button>
      </form>
      <p className="todo-quick-capture__hint">Try: Submit proposal tomorrow #work !high</p>
    </div>
  );
}
