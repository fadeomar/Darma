"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useTodo } from "../../state/TodoProvider";

const AUTO_DISMISS_MS = 5000;

/**
 * Lightweight snackbar for reversible actions (task completed / deleted).
 * Renders nothing when there is no active toast. Auto-dismisses after a few
 * seconds; the optional action (e.g. Undo) stays available until then.
 */
export function TodoToast() {
  const { toast, dismissToast } = useTodo();

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(dismissToast, AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
    // Re-arm the timer whenever a new toast appears (toast.id changes).
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <div className="todo-toast-region" aria-live="polite" aria-atomic="true">
      <div className="todo-toast" role="status">
        <span className="todo-toast__msg">{toast.message}</span>
        {toast.actionLabel && toast.onAction && (
          <button type="button" className="todo-toast__action" onClick={toast.onAction}>
            {toast.actionLabel}
          </button>
        )}
        <button
          type="button"
          className="todo-toast__close"
          aria-label="Dismiss notification"
          onClick={dismissToast}
        >
          <X size={15} aria-hidden />
        </button>
      </div>
    </div>
  );
}
