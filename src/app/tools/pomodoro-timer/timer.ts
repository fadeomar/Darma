// ─── Pomodoro / countdown logic ────────────────────────────────────────────
// Pure, testable helpers. The ticking itself lives in the client component;
// these functions cover formatting and the Pomodoro phase cycle.

export type TimerPhase = "focus" | "shortBreak" | "longBreak";

export const PHASE_SECONDS: Record<TimerPhase, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const PHASE_LABEL: Record<TimerPhase, string> = {
  focus: "Focus",
  shortBreak: "Short break",
  longBreak: "Long break",
};

/** Number of focus sessions before a long break. */
export const SESSIONS_BEFORE_LONG_BREAK = 4;

/** Format seconds as MM:SS (or H:MM:SS past an hour). Negatives clamp to 0. */
export function formatTime(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export type PomodoroState = {
  phase: TimerPhase;
  /** Completed focus sessions so far (drives when the long break happens). */
  completedFocus: number;
};

/**
 * Advance the Pomodoro cycle when a phase finishes. Finishing a focus session
 * increments the focus count and leads to a long break every fourth session,
 * otherwise a short break. Finishing any break returns to focus.
 */
export function nextPomodoroPhase({ phase, completedFocus }: PomodoroState): PomodoroState {
  if (phase === "focus") {
    const nextCount = completedFocus + 1;
    const phaseAfter: TimerPhase = nextCount % SESSIONS_BEFORE_LONG_BREAK === 0 ? "longBreak" : "shortBreak";
    return { phase: phaseAfter, completedFocus: nextCount };
  }
  return { phase: "focus", completedFocus };
}

/** Whole minutes (rounded up) remaining, for compact summaries. */
export function minutesRemaining(totalSeconds: number): number {
  return Math.max(0, Math.ceil(totalSeconds / 60));
}
