"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Sparkles, Trash2, X } from "lucide-react";
import { parseBrainDumpToTasks, type ParsedTaskDraft } from "../../domain/parsers";
import { useActiveListId, useTodo } from "../../state/TodoProvider";
import { TaskPriorityBadge } from "../task/TaskPriorityBadge";

type Props = {
  open: boolean;
  onClose: () => void;
};

type EditableDraft = ParsedTaskDraft & { tempId: string; selected: boolean };

function toEditable(drafts: ParsedTaskDraft[]): EditableDraft[] {
  return drafts.map((draft) => ({ ...draft, tempId: crypto.randomUUID(), selected: true }));
}

export function BrainDumpPanel({ open, onClose }: Props) {
  const { lists, addTask, setUi } = useTodo();
  const activeListId = useActiveListId();
  const [input, setInput] = useState("");
  const [drafts, setDrafts] = useState<EditableDraft[]>([]);
  const [targetListId, setTargetListId] = useState(activeListId);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setTargetListId(activeListId);
  }, [activeListId, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const selectedCount = useMemo(() => drafts.filter((d) => d.selected && d.title.trim()).length, [drafts]);

  function parse() {
    const parsed = parseBrainDumpToTasks(input);
    setDrafts(toEditable(parsed));
  }

  function updateDraft(id: string, patch: Partial<EditableDraft>) {
    setDrafts((prev) => prev.map((d) => (d.tempId === id ? { ...d, ...patch } : d)));
  }

  async function createDraft(draft: ParsedTaskDraft, parentTaskId?: string) {
    const created = await addTask(draft.title, {
      listId: targetListId,
      priority: draft.priority,
      status: draft.completed ? "done" : draft.status,
      completed: draft.completed,
      dueAt: draft.dueAt,
      tags: draft.tags,
      estimateMinutes: draft.estimateMinutes,
      parentTaskId,
      source: "ai",
      select: false,
    });
    if (!created) return null;
    for (const sub of draft.subtasks ?? []) {
      await createDraft(sub, created.id);
    }
    return created;
  }

  async function addSelected() {
    const selected = drafts.filter((d) => d.selected && d.title.trim());
    if (selected.length === 0) return;
    setBusy(true);
    try {
      for (const draft of selected) await createDraft(draft);
      setInput("");
      setDrafts([]);
      setUi({ activeListId: targetListId, activeFilter: "all", activeView: "list" });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="todo-modal" role="dialog" aria-modal="true" aria-labelledby="todo-brain-title">
      <button type="button" className="todo-modal__backdrop" aria-label="Close brain dump" onClick={onClose} />
      <div className="todo-modal__panel todo-brain">
        <header className="todo-gallery__header">
          <div>
            <h2 id="todo-brain-title" className="text-base font-bold">Brain Dump</h2>
            <p className="text-xs todo-muted">Paste messy thoughts and convert them into editable tasks locally. No AI API is required.</p>
          </div>
          <button type="button" className="todo-btn todo-btn--icon todo-btn--ghost" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        <div className="todo-brain__body">
          <div className="todo-brain__inputarea">
            <label className="text-xs font-semibold todo-muted" htmlFor="todo-brain-input">Messy notes</label>
            <textarea
              id="todo-brain-input"
              className="todo-input todo-brain__textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"Prepare client proposal, review budget, export PDF, send by Sunday #work !high\nStudy chapters 1-4 #study\n  - Make summary\n  - Solve questions"}
            />
            <div className="todo-brain__toolbar">
              <button type="button" className="todo-btn todo-btn--primary" disabled={!input.trim()} onClick={parse}>
                <Sparkles size={14} aria-hidden /> Parse
              </button>
              <button type="button" className="todo-btn" disabled={!input.trim() && drafts.length === 0} onClick={() => { setInput(""); setDrafts([]); }}>
                Clear
              </button>
              <label className="ms-auto text-xs todo-muted" htmlFor="todo-brain-list">Destination</label>
              <select id="todo-brain-list" className="todo-input todo-brain__select" value={targetListId} onChange={(e) => setTargetListId(e.target.value)}>
                {lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
              </select>
            </div>
          </div>

          <div className="todo-brain__preview">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold">Parsed preview</h3>
              <span className="text-xs todo-muted">{selectedCount} selected</span>
            </div>
            {drafts.length === 0 ? (
              <div className="todo-empty todo-brain__empty">
                <p className="font-semibold">Nothing parsed yet</p>
                <p className="mt-1 text-sm">Use tags like #work, priorities like !high, dates like today/tomorrow, or indented bullets for subtasks.</p>
              </div>
            ) : (
              <ul className="todo-brain__drafts">
                {drafts.map((draft) => (
                  <li key={draft.tempId} className="todo-brain__draft">
                    <label className="todo-brain__draftcheck">
                      <input type="checkbox" checked={draft.selected} onChange={(e) => updateDraft(draft.tempId, { selected: e.target.checked })} />
                      <span className="sr-only">Select {draft.title}</span>
                    </label>
                    <input
                      className="todo-input todo-brain__title"
                      value={draft.title}
                      onChange={(e) => updateDraft(draft.tempId, { title: e.target.value })}
                      aria-label="Parsed task title"
                    />
                    <TaskPriorityBadge priority={draft.priority} />
                    {draft.tags.length ? <span className="todo-chip">#{draft.tags.join(" #")}</span> : null}
                    {draft.dueAt ? <span className="todo-chip">due {draft.dueAt.slice(0, 10)}</span> : null}
                    {draft.subtasks?.length ? <span className="todo-chip">{draft.subtasks.length} subtasks</span> : null}
                    <button type="button" className="todo-btn todo-btn--icon todo-btn--ghost" aria-label="Remove draft" onClick={() => setDrafts((prev) => prev.filter((d) => d.tempId !== draft.tempId))}>
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <footer className="todo-plan__footer">
          <span className="text-sm todo-muted">Smart local parse — AI-ready architecture, no external request.</span>
          <button type="button" className="todo-btn todo-btn--primary" disabled={selectedCount === 0 || busy} onClick={() => void addSelected()}>
            <Plus size={14} aria-hidden /> {busy ? "Adding…" : "Add selected tasks"}
          </button>
        </footer>
      </div>
    </div>
  );
}
