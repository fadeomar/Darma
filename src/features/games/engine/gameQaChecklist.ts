import type { DarmaGameQaItem } from "./gameEngineTypes";

/**
 * Shared QA checklist for any future Darma playable.
 *
 * Keep this list practical. It is meant to stop future games from shipping with
 * the same issues that were solved during Reaction Timer Pro production work:
 * controls triggering gameplay, localStorage crashes, unreadable canvas-only
 * text, fullscreen resize problems, and mobile touch friction.
 */
export const DARMA_GAME_QA_CHECKLIST: DarmaGameQaItem[] = [
  {
    id: "route-loads",
    area: "general",
    status: "needs-check",
    label: "Game route loads without console errors",
  },
  {
    id: "timing-performance-now",
    area: "timing",
    status: "needs-check",
    label: "Timing-sensitive scores use performance.now(), not CSS animation timing",
  },
  {
    id: "pointerdown-active-play",
    area: "timing",
    status: "needs-check",
    label: "Active gameplay uses pointerdown where low-latency input matters",
  },
  {
    id: "controls-stop-propagation",
    area: "general",
    status: "needs-check",
    label: "Settings, share, fullscreen, pause, and quit controls never count as gameplay input",
  },
  {
    id: "mobile-touch-safe",
    area: "mobile",
    status: "needs-check",
    label: "Mobile play prevents accidental scroll, text selection, and double-tap zoom during active gameplay",
  },
  {
    id: "fullscreen-resize",
    area: "fullscreen",
    status: "needs-check",
    label: "Fullscreen enter/exit and orientation changes keep canvas coordinates correct",
  },
  {
    id: "storage-safe",
    area: "storage",
    status: "needs-check",
    label: "localStorage unavailable/corrupted/quota errors fall back gracefully",
  },
  {
    id: "results-html",
    area: "accessibility",
    status: "needs-check",
    label: "Important instructions, HUD values, and results exist as HTML text, not canvas-only pixels",
  },
  {
    id: "keyboard-ui",
    area: "accessibility",
    status: "needs-check",
    label: "Mode selector, settings, result actions, reset confirmations, and share panel are keyboard accessible",
  },
  {
    id: "reduced-motion",
    area: "accessibility",
    status: "needs-check",
    label: "prefers-reduced-motion and in-game reduced effects simplify animation without breaking gameplay",
  },
  {
    id: "share-fallback",
    area: "share",
    status: "needs-check",
    label: "Copy/share/download failures show a friendly fallback instead of crashing",
  },
  {
    id: "raf-cleanup",
    area: "performance",
    status: "needs-check",
    label: "requestAnimationFrame loops and timers are cleaned up on unmount, pause, and mode switch",
  },
];

export function getQaItemsByArea(area: DarmaGameQaItem["area"]): DarmaGameQaItem[] {
  return DARMA_GAME_QA_CHECKLIST.filter((item) => item.area === area);
}
