"use client";

import { useState } from "react";
import { FolderOpen, Pencil, Save, Trash2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { MAX_SAVED_SHAPES } from "../storage";
import type { SavedClipPathShape } from "../types";

export function SavedShapesPanel({
  items,
  canSave,
  onSave,
  onLoad,
  onRename,
  onDelete,
  onClear,
}: {
  items: SavedClipPathShape[];
  canSave: boolean;
  onSave: (name: string) => void;
  onLoad: (item: SavedClipPathShape) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  const [name, setName] = useState("");

  return (
    <section aria-labelledby="saved-shapes-title" className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 id="saved-shapes-title" className="text-sm font-black text-[var(--color-text-primary)]">Saved shapes</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Browser-local · {items.length}/{MAX_SAVED_SHAPES}</p>
        </div>
        {items.length > 0 ? <Button size="sm" variant="ghost" onClick={onClear}>Clear all</Button> : null}
      </div>
      <div className="mt-3 flex gap-2">
        <Input value={name} maxLength={60} placeholder="Shape name" onChange={(event) => setName(event.target.value)} onKeyDown={(event) => {
          if (event.key === "Enter" && canSave && name.trim()) {
            onSave(name);
            setName("");
          }
        }} />
        <Button size="icon" variant="secondary" onClick={() => { onSave(name); setName(""); }} disabled={!canSave || !name.trim() || items.length >= MAX_SAVED_SHAPES} aria-label="Save current shape" title={!canSave ? "Fix validation errors before saving" : "Save current shape"}><Save className="h-4 w-4" /></Button>
      </div>
      {items.length > 0 ? (
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-2">
              <button type="button" onClick={() => onLoad(item)} className="min-w-0 flex-1 rounded-[var(--radius-sm)] text-left outline-none focus-visible:shadow-[var(--focus-ring)]">
                <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{item.name}</span>
                <span className="block truncate text-xs text-[var(--color-text-tertiary)]">{item.points.length} points · {new Date(item.updatedAt).toLocaleDateString()}</span>
              </button>
              <Button size="icon" variant="ghost" onClick={() => onLoad(item)} aria-label={`Load ${item.name}`} title="Load"><FolderOpen className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => {
                const next = window.prompt("Rename saved shape", item.name);
                if (next !== null) onRename(item.id, next);
              }} aria-label={`Rename ${item.name}`} title="Rename"><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`} title="Delete"><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] p-3 text-center text-xs text-[var(--color-text-tertiary)]">No saved shapes yet.</p>}
    </section>
  );
}
