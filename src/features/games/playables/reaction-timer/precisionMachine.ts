/**
 * Pure state machine for Precision Timer mode.
 *
 * Holds no timers and no side effects — `useReactionGame` drives transitions,
 * owns `performance.now()` timing, audio/haptics, and persistence.
 *
 * Phase flow:
 *   lobby → countdown → running → result
 *   result → countdown (try again) | lobby (back to modes / change target)
 */

import { DEFAULT_PRECISION_TARGET_MS } from "./precisionScoring";
import type { PrecisionPhase, PrecisionResult } from "./precisionTypes";

export type PrecisionState = {
  phase: PrecisionPhase;
  /** Active target time, in ms. */
  targetMs: number;
  /** 3 → 2 → 1 → 0 (0 renders as "Start"); null when not counting down. */
  countdownValue: number | null;
  /** Set when an attempt finishes. */
  result: PrecisionResult | null;
};

export type PrecisionAction =
  | { type: "SET_TARGET"; targetMs: number }
  | { type: "START" }
  | { type: "COUNTDOWN_TICK" }
  | { type: "BEGIN_RUNNING" }
  | { type: "STOP"; result: PrecisionResult }
  | { type: "RETRY" }
  | { type: "TO_LOBBY" };

export const INITIAL_PRECISION_STATE: PrecisionState = {
  phase: "lobby",
  targetMs: DEFAULT_PRECISION_TARGET_MS,
  countdownValue: null,
  result: null,
};

export function precisionReducer(state: PrecisionState, action: PrecisionAction): PrecisionState {
  switch (action.type) {
    case "SET_TARGET":
      // Only allowed from the lobby so a target can't change mid-attempt.
      if (state.phase !== "lobby") return state;
      return { ...state, targetMs: action.targetMs };

    case "START":
      if (state.phase !== "lobby" && state.phase !== "result") return state;
      return { ...state, phase: "countdown", countdownValue: 3, result: null };

    case "COUNTDOWN_TICK": {
      if (state.phase !== "countdown") return state;
      const next = (state.countdownValue ?? 3) - 1;
      return { ...state, countdownValue: Math.max(0, next) };
    }

    case "BEGIN_RUNNING":
      if (state.phase !== "countdown") return state;
      return { ...state, phase: "running", countdownValue: null };

    case "STOP":
      if (state.phase !== "running") return state;
      return { ...state, phase: "result", result: action.result };

    case "RETRY":
      if (state.phase !== "result") return state;
      return { ...state, phase: "countdown", countdownValue: 3, result: null };

    case "TO_LOBBY":
      return { ...state, phase: "lobby", countdownValue: null, result: null };

    default:
      return state;
  }
}
