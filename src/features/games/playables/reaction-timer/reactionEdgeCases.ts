"use client";

/**
 * Sprint 20 — browser/runtime edge-case helpers.
 *
 * These helpers keep the game playable when common browser features are blocked
 * or interrupted: localStorage, clipboard, native share, fullscreen, audio, and
 * page lifecycle events. They deliberately avoid throwing. UI can subscribe to
 * notices for a small, non-blocking warning panel.
 */

export type EdgeCaseSeverity = "info" | "warning" | "error";

export type EdgeCaseNotice = {
  id: string;
  severity: EdgeCaseSeverity;
  title: string;
  detail: string;
  at: string;
};

export type BrowserCapabilitySnapshot = {
  checkedAt: string;
  storage: "available" | "unavailable";
  fullscreen: "available" | "unavailable";
  clipboard: "available" | "unavailable";
  nativeShare: "available" | "unavailable";
  webAudio: "available" | "unavailable";
  haptics: "available" | "unavailable";
};

export const EDGE_CASE_EVENT = "darma:reaction-timer:edge-case";
const NOTICE_LIMIT = 8;
let notices: EdgeCaseNotice[] = [];

function nowIso(): string {
  return new Date().toISOString();
}

function createNotice(input: Omit<EdgeCaseNotice, "id" | "at">): EdgeCaseNotice {
  return {
    ...input,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    at: nowIso(),
  };
}

export function emitEdgeCaseNotice(input: Omit<EdgeCaseNotice, "id" | "at">): EdgeCaseNotice {
  const notice = createNotice(input);
  notices = [notice, ...notices].slice(0, NOTICE_LIMIT);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<EdgeCaseNotice>(EDGE_CASE_EVENT, { detail: notice }));
  }
  return notice;
}

export function getEdgeCaseNotices(): EdgeCaseNotice[] {
  return notices;
}

export function subscribeEdgeCaseNotices(callback: (notice: EdgeCaseNotice) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onNotice = (event: Event) => {
    const custom = event as CustomEvent<EdgeCaseNotice>;
    if (custom.detail) callback(custom.detail);
  };
  window.addEventListener(EDGE_CASE_EVENT, onNotice);
  return () => window.removeEventListener(EDGE_CASE_EVENT, onNotice);
}

export function canUseLocalStorage(): boolean {
  if (typeof window === "undefined" || !("localStorage" in window)) return false;
  try {
    const probe = "__darma_reaction_timer_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function safeReadLocalStorage(key: string): string | null {
  if (!canUseLocalStorage()) {
    emitEdgeCaseNotice({
      severity: "warning",
      title: "Local progress is in memory only",
      detail: "localStorage is blocked or unavailable. You can still play, but this browser may not keep stats after refresh.",
    });
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    emitEdgeCaseNotice({
      severity: "warning",
      title: "Could not read local progress",
      detail: "The saved progress area was not readable. The game will fall back to a safe empty state.",
    });
    return null;
  }
}

export function safeWriteLocalStorage(key: string, value: string): boolean {
  if (!canUseLocalStorage()) {
    emitEdgeCaseNotice({
      severity: "warning",
      title: "Progress could not be saved",
      detail: "localStorage is unavailable. The game remains playable, but this run may not persist after refresh.",
    });
    return false;
  }
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    emitEdgeCaseNotice({
      severity: "warning",
      title: "Progress save failed",
      detail:
        error instanceof DOMException && error.name === "QuotaExceededError"
          ? "Browser storage is full. Try clearing old site data if you want local stats to persist."
          : "The browser refused the save request. Gameplay continues with the current in-memory state.",
    });
    return false;
  }
}

export function backupCorruptedLocalStorage(key: string, raw: string): void {
  if (!canUseLocalStorage()) return;
  try {
    const backupKey = `${key}.corrupt.${Date.now()}`;
    window.localStorage.setItem(backupKey, raw.slice(0, 100_000));
    window.localStorage.removeItem(key);
    emitEdgeCaseNotice({
      severity: "warning",
      title: "Recovered from corrupted progress",
      detail: "The saved stats JSON was invalid, so the game backed it up and started from a safe empty state.",
    });
  } catch {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore: the game still returns a safe default state.
    }
    emitEdgeCaseNotice({
      severity: "warning",
      title: "Recovered from unreadable progress",
      detail: "Saved stats could not be parsed. The game will continue with a safe empty state.",
    });
  }
}

export function getBrowserCapabilitySnapshot(): BrowserCapabilitySnapshot {
  const nav = typeof navigator === "undefined" ? null : navigator;
  const doc = typeof document === "undefined" ? null : document;
  const win = typeof window === "undefined" ? null : window;
  const audioCtor = win ? (win.AudioContext || (win as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined;

  return {
    checkedAt: nowIso(),
    storage: canUseLocalStorage() ? "available" : "unavailable",
    fullscreen: Boolean(doc?.documentElement.requestFullscreen) ? "available" : "unavailable",
    clipboard: Boolean(nav?.clipboard?.writeText) ? "available" : "unavailable",
    nativeShare: Boolean(nav && "share" in nav && typeof nav.share === "function") ? "available" : "unavailable",
    webAudio: audioCtor ? "available" : "unavailable",
    haptics: Boolean(nav && "vibrate" in nav && typeof nav.vibrate === "function") ? "available" : "unavailable",
  };
}

export function formatEdgeCaseTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
