"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function TodoConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  busy,
  onConfirm,
  onClose,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => confirmRef.current?.focus(), 0);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="todo-modal" role="dialog" aria-modal="true" aria-labelledby="todo-confirm-title">
      <button type="button" className="todo-modal__backdrop" aria-label="Close confirmation dialog" onClick={onClose} />
      <div className="todo-modal__panel todo-confirm">
        <header className="todo-confirm__header">
          <span className={cn("todo-confirm__icon", variant === "danger" && "todo-confirm__icon--danger")} aria-hidden>
            <AlertTriangle size={18} />
          </span>
          <div className="min-w-0">
            <h2 id="todo-confirm-title" className="text-base font-bold">{title}</h2>
            <p className="mt-1 text-sm todo-muted">{description}</p>
          </div>
          <button type="button" className="todo-btn todo-btn--icon todo-btn--ghost ms-auto" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </header>
        <footer className="todo-confirm__actions">
          <button type="button" className="todo-btn" onClick={onClose} disabled={busy}>{cancelLabel}</button>
          <button
            ref={confirmRef}
            type="button"
            className={cn("todo-btn todo-btn--primary", variant === "danger" && "todo-btn--danger")}
            disabled={busy}
            onClick={() => void onConfirm()}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
