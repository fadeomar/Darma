"use client";

import { useEffect, useMemo, useState } from "react";
import { FileJson, X } from "lucide-react";
import type { ImportMode, ImportSummary } from "../../data/importExport";

type Props = {
  open: boolean;
  summary: ImportSummary | null;
  busy?: boolean;
  onClose: () => void;
  onImport: (mode: ImportMode) => void | Promise<void>;
};

export function TodoImportDialog({ open, summary, busy, onClose, onImport }: Props) {
  const [mode, setMode] = useState<ImportMode>("merge");
  const [replaceAck, setReplaceAck] = useState(false);

  useEffect(() => {
    if (open) {
      setMode("merge");
      setReplaceAck(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const duplicateCount = useMemo(() => {
    const d = summary?.duplicates;
    return (d?.listNames.length ?? 0) + (d?.taskTitles.length ?? 0);
  }, [summary]);

  if (!open || !summary?.ok || !summary.counts) return null;

  return (
    <div className="todo-modal" role="dialog" aria-modal="true" aria-labelledby="todo-import-title">
      <button type="button" className="todo-modal__backdrop" aria-label="Close import dialog" onClick={onClose} />
      <div className="todo-modal__panel todo-confirm todo-import-dialog">
        <header className="todo-confirm__header">
          <span className="todo-confirm__icon" aria-hidden><FileJson size={18} /></span>
          <div className="min-w-0">
            <h2 id="todo-import-title" className="text-base font-bold">Import Darma Tasks backup</h2>
            <p className="mt-1 text-sm todo-muted">
              This file contains {summary.counts.lists} list{summary.counts.lists === 1 ? "" : "s"}, {summary.counts.tasks} task{summary.counts.tasks === 1 ? "" : "s"}, and {summary.counts.columns} board column{summary.counts.columns === 1 ? "" : "s"}.
            </p>
          </div>
          <button type="button" className="todo-btn todo-btn--icon todo-btn--ghost ms-auto" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </header>

        {duplicateCount > 0 && (
          <div className="todo-import-warning">
            <p className="font-semibold">Possible duplicates detected</p>
            {summary.duplicates?.listNames.length ? (
              <p>Matching list names: {summary.duplicates.listNames.slice(0, 5).join(", ")}</p>
            ) : null}
            {summary.duplicates?.taskTitles.length ? (
              <p>Matching task titles: {summary.duplicates.taskTitles.slice(0, 5).join(", ")}{summary.duplicates.taskTitles.length > 5 ? "…" : ""}</p>
            ) : null}
          </div>
        )}

        <div className="todo-import-options" role="radiogroup" aria-label="Import mode">
          <label className="todo-import-option">
            <input type="radio" name="todo-import-mode" checked={mode === "merge"} onChange={() => setMode("merge")} />
            <span><strong>Merge as new copies</strong><small>Safest default. Keeps current data and imports this file with fresh IDs.</small></span>
          </label>
          <label className="todo-import-option">
            <input type="radio" name="todo-import-mode" checked={mode === "merge-skip-duplicates"} onChange={() => setMode("merge-skip-duplicates")} />
            <span><strong>Merge and skip matching list names</strong><small>Useful if you imported the same backup before. Existing lists are not overwritten.</small></span>
          </label>
          <label className="todo-import-option todo-import-option--danger">
            <input type="radio" name="todo-import-mode" checked={mode === "replace"} onChange={() => setMode("replace")} />
            <span><strong>Replace everything</strong><small>Deletes current Darma Tasks data, then imports this file.</small></span>
          </label>
        </div>

        {mode === "replace" && (
          <label className="todo-import-ack">
            <input type="checkbox" checked={replaceAck} onChange={(e) => setReplaceAck(e.target.checked)} />
            <span>I understand this replaces all current Darma Tasks data.</span>
          </label>
        )}

        <footer className="todo-confirm__actions">
          <button type="button" className="todo-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className={mode === "replace" ? "todo-btn todo-btn--danger" : "todo-btn todo-btn--primary"} disabled={busy || (mode === "replace" && !replaceAck)} onClick={() => void onImport(mode)}>
            {busy ? "Importing…" : mode === "replace" ? "Replace data" : "Import"}
          </button>
        </footer>
      </div>
    </div>
  );
}
