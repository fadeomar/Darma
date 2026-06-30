"use client";

/**
 * Sprint 19 accessibility helpers for Reaction Timer Pro.
 *
 * The game is visually rich and timing-sensitive, so this file keeps the honest
 * accessibility contract in one place: what is keyboard-friendly, what is
 * pointer/touch-first, what is announced to assistive tech, and what users can
 * do to make the game calmer or higher contrast.
 */

import type { ReactionPhase } from "./reactionTypes";
import type { PrecisionPhase } from "./precisionTypes";

export type AccessibilityModeId =
  | "classic"
  | "practice"
  | "precision"
  | "target-hunter"
  | "level-challenge"
  | "daily-challenge"
  | "local-battle";

export type AccessibilityStatusInput = {
  mode: AccessibilityModeId;
  reactionPhase?: ReactionPhase;
  precisionPhase?: PrecisionPhase;
  isFullscreen: boolean;
  soundEnabled: boolean;
  reducedEffects: boolean;
  highContrast: boolean;
};

export const ACCESSIBILITY_MODE_NOTES: Array<{
  id: AccessibilityModeId;
  title: string;
  summary: string;
  keyboard: string;
  pointer: string;
}> = [
  {
    id: "classic",
    title: "Classic Reaction",
    summary: "The signal, countdown, round result, and final summary are rendered as readable HTML text.",
    keyboard: "Space or Enter reacts. Escape pauses when a run is active.",
    pointer: "Click or tap anywhere in the arena after the GO signal.",
  },
  {
    id: "practice",
    title: "Practice",
    summary: "Practice uses the same accessible flow as Classic but does not pressure your official average.",
    keyboard: "Space or Enter reacts. Escape pauses.",
    pointer: "Click or tap anywhere in the arena after the signal.",
  },
  {
    id: "precision",
    title: "Precision Timer",
    summary: "The target time, running timer, result, and early/late difference are visible as text.",
    keyboard: "Space or Enter starts, stops, and retries from the result screen.",
    pointer: "Click or tap the arena to stop the timer.",
  },
  {
    id: "target-hunter",
    title: "Target Hunter",
    summary: "Target Hunter is pointer-first. HUD values and final results are provided as text outside Canvas.",
    keyboard: "Keyboard can navigate the UI; pointer/touch is recommended for active target play.",
    pointer: "Tap or click the visible target. Taps outside the target count as misses during active play.",
  },
  {
    id: "level-challenge",
    title: "Level Challenge",
    summary: "Each level has a text objective, HUD, pass/fail result, and coaching tip outside Canvas.",
    keyboard: "Keyboard can navigate level selection/results. Pointer/touch is recommended for target levels.",
    pointer: "Tap or click the correct target. Decoys use shape/icon cues, not color alone.",
  },
  {
    id: "daily-challenge",
    title: "Daily Challenge",
    summary: "Daily objectives, scores, streaks, and local leaderboard entries are readable as text.",
    keyboard: "Keyboard support follows the generated daily mechanic where practical.",
    pointer: "Pointer/touch behavior follows the generated daily mechanic.",
  },
  {
    id: "local-battle",
    title: "Local Battle",
    summary: "Turn gates, player names, comparison, and winner are announced with text — not color only.",
    keyboard: "Keyboard can move through lobby inputs, battle type choices, and result actions.",
    pointer: "Active turns follow the chosen battle mechanic.",
  },
];

export const ACCESSIBILITY_AUDIT_ITEMS = [
  "Important gameplay text is rendered in HTML, not only Canvas.",
  "Sound and vibration are optional and never required to understand a result.",
  "High Contrast is always available and never locked behind progression.",
  "Reduced effects respects both the system preference and the in-game setting.",
  "Target/decoy mechanics use shape, outline, or icon cues in addition to color.",
  "Fullscreen/settings/share controls are marked as controls so they never count as gameplay input.",
  "Pointer-heavy modes clearly say pointer or touch is recommended instead of claiming full keyboard parity.",
];

function phaseCopy(phase: ReactionPhase | undefined): string {
  switch (phase) {
    case "countdown":
      return "Countdown active.";
    case "waiting":
      return "Wait for the signal. Do not press yet.";
    case "signal":
      return "Signal shown. React now.";
    case "too-early":
      return "Too early. Wait for the real signal.";
    case "round-result":
      return "Round result displayed.";
    case "final-summary":
      return "Final summary displayed.";
    case "paused":
      return "Run paused.";
    case "idle":
    default:
      return "Mode selection ready.";
  }
}

function precisionCopy(phase: PrecisionPhase | undefined): string {
  switch (phase) {
    case "countdown":
      return "Precision countdown active.";
    case "running":
      return "Precision timer running. Stop as close as possible to the target.";
    case "result":
      return "Precision result displayed.";
    case "lobby":
    default:
      return "Precision timer lobby ready.";
  }
}

export function buildAccessibilityStatus(input: AccessibilityStatusInput): string {
  const mode = ACCESSIBILITY_MODE_NOTES.find((item) => item.id === input.mode)?.title ?? "Reaction Timer Pro";
  const phase = input.mode === "precision" ? precisionCopy(input.precisionPhase) : phaseCopy(input.reactionPhase);
  const fullscreen = input.isFullscreen ? "Fullscreen is active." : "Fullscreen is off.";
  const sound = input.soundEnabled ? "Sound is on." : "Sound is off.";
  const effects = input.reducedEffects ? "Reduced effects are on." : "Motion effects are allowed.";
  const contrast = input.highContrast ? "High contrast is on." : "Standard contrast is active.";
  return `${mode}. ${phase} ${fullscreen} ${sound} ${effects} ${contrast}`;
}

export function accessibilityCanvasDescription(mode: AccessibilityModeId): string {
  switch (mode) {
    case "target-hunter":
      return "Canvas draws the target, hit effects, miss ripples, and background motion. The HUD and result values are provided as text.";
    case "level-challenge":
      return "Canvas draws level targets, movement, fading, shrinking, decoys, and effects. Objectives and scores are provided as text.";
    case "precision":
      return "Canvas draws the precision atmosphere only. The timer and result values are readable as text.";
    default:
      return "Canvas draws decorative arena motion. The playable instruction, timing state, and results are readable as text.";
  }
}
