/**
 * Pure state machine for Reaction Timer Pro.
 *
 * Holds no timers and no side effects — `useReactionGame` drives transitions and
 * owns timing/storage/audio. Keeping this pure makes the game loop predictable
 * and unit-testable.
 *
 * Phase flow (classic):
 *   idle → countdown → waiting → signal → round-result → waiting → … → final-summary
 *   waiting → too-early → waiting (early press: retry same round, counts vs accuracy)
 */

import { CLASSIC_ROUNDS, summarizeRun } from "./reactionScoring";
import type { GameMode, ReactionAttempt, ReactionPhase, RunSummary } from "./reactionTypes";

export type ReactionState = {
  phase: ReactionPhase;
  mode: GameMode;
  /** 3 → 2 → 1 → 0 (0 renders as "Focus"); null when not counting down. */
  countdownValue: number | null;
  attempts: ReactionAttempt[];
  validCount: number;
  lastAttempt: ReactionAttempt | null;
  /** Set when a classic run finishes. */
  run: RunSummary | null;
  /** Phase to return to when resuming from pause. */
  resumePhase: ReactionPhase | null;
};

export type ReactionAction =
  | { type: "START"; mode: GameMode }
  | { type: "COUNTDOWN_TICK" }
  | { type: "BEGIN_WAITING" }
  | { type: "SHOW_SIGNAL" }
  | { type: "VALID_PRESS"; reactionMs: number; at: string }
  | { type: "EARLY_PRESS"; at: string }
  | { type: "ADVANCE" }
  | { type: "RETRY" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESET" };

export const INITIAL_STATE: ReactionState = {
  phase: "idle",
  mode: "classic",
  countdownValue: null,
  attempts: [],
  validCount: 0,
  lastAttempt: null,
  run: null,
  resumePhase: null,
};

const PAUSABLE: ReactionPhase[] = ["countdown", "waiting", "signal", "round-result", "too-early"];

export function reactionReducer(state: ReactionState, action: ReactionAction): ReactionState {
  switch (action.type) {
    case "START":
      return {
        ...INITIAL_STATE,
        phase: "countdown",
        mode: action.mode,
        countdownValue: 3,
      };

    case "COUNTDOWN_TICK": {
      if (state.phase !== "countdown") return state;
      const next = (state.countdownValue ?? 3) - 1;
      return { ...state, countdownValue: Math.max(0, next) };
    }

    case "BEGIN_WAITING":
      return { ...state, phase: "waiting", countdownValue: null };

    case "SHOW_SIGNAL":
      if (state.phase !== "waiting") return state;
      return { ...state, phase: "signal" };

    case "VALID_PRESS": {
      if (state.phase !== "signal") return state;
      const attempt: ReactionAttempt = {
        round: state.validCount + 1,
        reactionMs: action.reactionMs,
        tooEarly: false,
        at: action.at,
      };
      const attempts = [...state.attempts, attempt];
      const validCount = state.validCount + 1;
      const finished = state.mode === "classic" && validCount >= CLASSIC_ROUNDS;
      return {
        ...state,
        attempts,
        validCount,
        lastAttempt: attempt,
        phase: finished ? "final-summary" : "round-result",
        run: finished ? summarizeRun(attempts, state.mode) : null,
      };
    }

    case "EARLY_PRESS": {
      if (state.phase !== "waiting") return state;
      const attempt: ReactionAttempt = {
        round: state.validCount + 1,
        reactionMs: null,
        tooEarly: true,
        at: action.at,
      };
      return {
        ...state,
        attempts: [...state.attempts, attempt],
        lastAttempt: attempt,
        phase: "too-early",
      };
    }

    case "ADVANCE":
      if (state.phase !== "round-result") return state;
      return { ...state, phase: "waiting" };

    case "RETRY":
      if (state.phase !== "too-early") return state;
      return { ...state, phase: "waiting" };

    case "PAUSE":
      if (!PAUSABLE.includes(state.phase)) return state;
      return { ...state, phase: "paused", resumePhase: state.phase };

    case "RESUME": {
      if (state.phase !== "paused") return state;
      // Resuming a half-finished round restarts that round's waiting cleanly.
      const target = state.resumePhase === "signal" || state.resumePhase === "too-early" ? "waiting" : state.resumePhase ?? "waiting";
      return { ...state, phase: target, resumePhase: null, countdownValue: target === "countdown" ? 3 : null };
    }

    case "RESET":
      return { ...INITIAL_STATE, mode: state.mode };

    default:
      return state;
  }
}

export function getInstruction(state: ReactionState): string {
  switch (state.phase) {
    case "idle":
      return "Ready when you are";
    case "countdown":
      return state.countdownValue && state.countdownValue > 0 ? String(state.countdownValue) : "Focus";
    case "waiting":
      return "Wait…";
    case "signal":
      return "GO!";
    case "too-early":
      return "Too soon";
    case "round-result":
      return state.lastAttempt?.reactionMs != null ? `${state.lastAttempt.reactionMs} ms` : "Round complete";
    case "final-summary":
      return "Complete";
    case "paused":
      return "Paused";
    default:
      return "";
  }
}
