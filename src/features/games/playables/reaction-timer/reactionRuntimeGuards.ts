"use client";

import { useEffect, useRef } from "react";
import { emitEdgeCaseNotice } from "./reactionEdgeCases";

/**
 * Runtime guards for active gameplay. These are intentionally small and shared
 * across modes so mobile/fullscreen/edge-case fixes do not duplicate logic in
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

    const preventContextMenu = (event: Event) => {
      if (isGameplayControlTarget(event.target)) return;
      event.preventDefault();
    };
    const preventDrag = (event: Event) => {
      if (isGameplayControlTarget(event.target)) return;
      event.preventDefault();
    };

    document.addEventListener("contextmenu", preventContextMenu, { capture: true });
    document.addEventListener("dragstart", preventDrag, { capture: true });

    return () => {
      root.classList.remove("rtp-gameplay-active");
      body.style.overscrollBehavior = previousBody.overscrollBehavior;
      body.style.touchAction = previousBody.touchAction;
      body.style.userSelect = previousBody.userSelect;
      body.style.webkitUserSelect = previousBody.webkitUserSelect;
      document.removeEventListener("contextmenu", preventContextMenu, { capture: true });
      document.removeEventListener("dragstart", preventDrag, { capture: true });
    };
  }, [active]);
}

/**
 * Interrupt active runs when browser timing is no longer trustworthy. This keeps
 * tab switches, app switches, pagehide, freeze, and some mobile backgrounding
 * cases from producing unfair results.
 */
export function useVisibilityInterruption(active: boolean, onInterrupt: () => void) {
  const interruptedRef = useRef(false);

  useEffect(() => {
    interruptedRef.current = false;
  }, [active]);

  useEffect(() => {
    if (!active || typeof document === "undefined" || typeof window === "undefined") return;

    const interrupt = (reason: string) => {
      if (interruptedRef.current) return;
      interruptedRef.current = true;
      emitEdgeCaseNotice({
        severity: "info",
        title: "Run interrupted safely",
        detail: `${reason}. Timing-sensitive runs are paused or stopped instead of saving an unfair result.`,
      });
      onInterrupt();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") interrupt("The tab or app became hidden");
    };
    const onPageHide = () => interrupt("The page was hidden or unloaded");
    const onFreeze = () => interrupt("The browser froze the page");
    const onBlur = () => {
      // Desktop blur can happen from devtools or window focus changes. It is a
      // soft interruption because a high-resolution wait/signal timer is no
      // longer a fair measurement.
      interrupt("The browser window lost focus");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("freeze", onFreeze as EventListener);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("freeze", onFreeze as EventListener);
      window.removeEventListener("blur", onBlur);
    };
  }, [active, onInterrupt]);
}
