import { type RefObject, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type UseModalFocusTrapOptions<T extends HTMLElement> = {
  open: boolean;
  panelRef: RefObject<T | null>;
  onClose: () => void;
};

function isVisibleFocusable(node: HTMLElement) {
  return !node.hasAttribute("disabled") && node.getAttribute("aria-hidden") !== "true" && (node.offsetParent !== null || node === document.activeElement);
}

export function useModalFocusTrap<T extends HTMLElement>({ open, panelRef, onClose }: UseModalFocusTrapOptions<T>) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const panel = panelRef.current;
    const focusable = panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisibleFocusable) : [];
    const closeButton = panel?.querySelector<HTMLElement>("[data-modal-close]");
    const firstFocusable = focusable[0];

    window.requestAnimationFrame(() => {
      (firstFocusable ?? closeButton ?? panel)?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisibleFocusable);

      if (!nodes.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const previousFocus = previousFocusRef.current;
      if (previousFocus && document.contains(previousFocus)) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [open, panelRef, onClose]);
}
