"use client";

/** Small shared React hooks for the reaction player. */

import { useCallback, useEffect, useState, type RefObject } from "react";
import { emitEdgeCaseNotice } from "./reactionEdgeCases";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;
    setReduced(media.matches);
    const onChange = () => setReduced(media.matches);
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

/** Fullscreen handling bound to a specific element, with API + state sync. */
export function useFullscreen(elementRef: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onChange = () => setIsFullscreen(document.fullscreenElement === elementRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [elementRef]);

  const toggle = useCallback(async () => {
    const element = elementRef.current;
    if (!element || typeof document === "undefined") return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else {
        // Fallback: CSS-driven full-window mode is handled by the caller via state.
        setIsFullscreen((value) => !value);
        emitEdgeCaseNotice({
          severity: "info",
          title: "Fullscreen API unavailable",
          detail: "The browser does not expose Fullscreen API here, so the game falls back to the regular responsive player.",
        });
      }
    } catch {
      emitEdgeCaseNotice({
        severity: "warning",
        title: "Fullscreen request was blocked",
        detail: "The browser denied fullscreen. The game remains playable in the normal layout.",
      });
    }
  }, [elementRef]);

  /** True when the browser exposes the Fullscreen API at all. */
  const supported =
    typeof document !== "undefined" &&
    typeof (document.documentElement as HTMLElement).requestFullscreen === "function";

  return { isFullscreen, toggle, supported };
}
