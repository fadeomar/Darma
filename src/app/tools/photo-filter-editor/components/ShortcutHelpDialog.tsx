"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button, Kbd } from "@/components/ui";

export function ShortcutHelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="photo-shortcuts-title" className="max-h-[min(640px,calc(100vh-2rem))] w-full max-w-md overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--shadow-lg)]">
        <div className="flex items-start justify-between gap-3">
          <div><h2 id="photo-shortcuts-title" className="text-base font-black text-[var(--color-text-primary)]">Keyboard shortcuts</h2><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Shortcuts never run while you type in a field.</p></div>
          <Button ref={closeRef} size="icon" variant="ghost" leftIcon={<X className="h-4 w-4" />} aria-label="Close shortcut help" onClick={onClose}>Close</Button>
        </div>
        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
          <dt><Kbd>Ctrl/⌘ Z</Kbd></dt><dd>Undo</dd>
          <dt><Kbd>Ctrl/⌘ Shift Z</Kbd></dt><dd>Redo</dd>
          <dt><Kbd>Ctrl/⌘ Y</Kbd></dt><dd>Redo</dd>
          <dt><Kbd>Esc</Kbd></dt><dd>Cancel crop or close a dialog</dd>
          <dt><Kbd>← →</Kbd></dt><dd>Move the comparison divider</dd>
        </dl>
      </div>
    </div>
  );
}
