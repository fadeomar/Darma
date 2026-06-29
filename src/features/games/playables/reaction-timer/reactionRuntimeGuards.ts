"use client";

import { useEffect } from "react";

/**
 * Runtime guards for active gameplay. These are intentionally small and shared
 * across modes so Sprint 12 polish does not duplicate mobile/fullscreen fixes in
 * every component.
 */

export function isGameplayControlTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      "button,a,input,select,textarea,summary,[contenteditable='true'],[role='button'],[role='dialog'],[data-rtp-control='true']",
    ),
  );
}

export function useActiveGameplayGuards(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;

    const root = document.documentElement;
    const body = document.body;
    const previousBody = {
      overscrollBehavior: body.style.overscrollBehavior,
      touchAction: body.style.touchAction,
      userSelect: body.style.userSelect,
      webkitUserSelect: body.style.webkitUserSelect,
    };

    root.classList.add("rtp-gameplay-active");
    body.style.overscrollBehavior = "contain";
    body.style.touchAction = "manipulation";
    body.style.userSelect = "none";
    body.style.webkitUserSelect = "none";

    const preventContextMenu = (event: Event) => event.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu, { capture: true });

    return () => {
      root.classList.remove("rtp-gameplay-active");
      body.style.overscrollBehavior = previousBody.overscrollBehavior;
      body.style.touchAction = previousBody.touchAction;
      body.style.userSelect = previousBody.userSelect;
      body.style.webkitUserSelect = previousBody.webkitUserSelect;
      document.removeEventListener("contextmenu", preventContextMenu, { capture: true });
    };
  }, [active]);
}

/**
 * Interrupt active runs when browser timing is no longer trustworthy. This keeps
 * tab switches, app switches, and pagehide from producing unfair results.
 */
export function useVisibilityInterruption(active: boolean, onInterrupt: () => void) {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;

    const interrupt = () => {
      if (document.visibilityState === "hidden") onInterrupt();
    };
    const pageHide = () => onInterrupt();

    document.addEventListener("visibilitychange", interrupt);
    window.addEventListener("pagehide", pageHide);

    return () => {
      document.removeEventListener("visibilitychange", interrupt);
      window.removeEventListener("pagehide", pageHide);
    };
  }, [active, onInterrupt]);
}
