"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button, Kbd } from "@/components/ui";

export function ShortcutHelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [onClose, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="clip-shortcuts-title" aria-describedby="clip-shortcuts-description" className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-xl)] sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="clip-shortcuts-title" className="text-lg font-black text-[var(--color-text-primary)]">Editor shortcuts</h2>
          <Button ref={closeButtonRef} size="icon" variant="ghost" onClick={onClose} aria-label="Close shortcut help"><X className="h-4 w-4" /></Button>
        </div>
        <p id="clip-shortcuts-description" className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">
          Zoom uses the stage toolbar. Pinch and mouse-wheel zoom are not available in this version.
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-y-3">
          <dt><Kbd>← ↑ → ↓</Kbd></dt><dd className="text-[var(--color-text-secondary)]">Move the selected point by 1%.</dd>
          <dt><Kbd>Shift</Kbd> + arrows</dt><dd className="text-[var(--color-text-secondary)]">Move by 5%.</dd>
          <dt><Kbd>Alt</Kbd> + arrows</dt><dd className="text-[var(--color-text-secondary)]">Move precisely by 0.5%.</dd>
          <dt><Kbd>Delete</Kbd></dt><dd className="text-[var(--color-text-secondary)]">Remove the selected point when the canvas owns focus.</dd>
          <dt><Kbd>Ctrl/Cmd Z</Kbd></dt><dd className="text-[var(--color-text-secondary)]">Undo the last shape edit.</dd>
          <dt><Kbd>Ctrl/Cmd Shift Z</Kbd></dt><dd className="text-[var(--color-text-secondary)]">Redo the last shape edit.</dd>
          <dt><Kbd>Esc</Kbd></dt><dd className="text-[var(--color-text-secondary)]">Clear selection or close this dialog.</dd>
        </dl>
      </div>
    </div>
  );
}
