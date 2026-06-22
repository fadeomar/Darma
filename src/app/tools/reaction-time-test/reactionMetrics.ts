import type { ReactionInputMethod, ReactionSample, ReactionStats, ReactionTestMode } from "./types";

function round(value: number, decimals = 0) {
  if (!Number.isFinite(value)) return 0;
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function resolveInputMethod(samples: ReactionSample[]): ReactionInputMethod {
  const keyboard = samples.some((sample) => sample.source === "keyboard");
  const mouse = samples.some((sample) => sample.source === "mouse");
  const touch = samples.some((sample) => sample.source === "touch");
  const pen = samples.some((sample) => sample.source === "pen");
  const active = [keyboard, mouse, touch, pen].filter(Boolean).length;

  if (active > 1) return "Mixed";
  if (keyboard) return "Keyboard";
  if (mouse) return "Mouse";
  if (touch) return "Touch";
  if (pen) return "Pen";
  return "None";
}

function calculateConsistency(samples: ReactionSample[]) {
  if (samples.length < 3) return 0;

  const values = samples.map((sample) => sample.reactionMs);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (average <= 0) return 0;

  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  const coefficientOfVariation = Math.sqrt(variance) / average;
  const score = 100 - Math.min(100, coefficientOfVariation * 140);

  return Math.max(0, Math.min(100, score));
}

export function pointerSource(pointerType: string): ReactionSample["source"] {
  if (pointerType === "touch") return "touch";
  if (pointerType === "pen") return "pen";
  return "mouse";
}

export function isReactionKey(event: KeyboardEvent) {
  return event.code === "Space" || event.key === " " || event.key === "Enter" || event.code === "Enter";
}

export function randomWaitMs() {
  return 1400 + Math.floor(Math.random() * 3100);
}

export function createEmptyStats(totalRounds = 0): ReactionStats {
  return {
    roundsCompleted: 0,
    totalRounds,
    averageReactionMs: 0,
    bestReactionMs: 0,
    slowestReactionMs: 0,
    consistencyScore: 0,
    falseStarts: 0,
    inputMethod: "None",
  };
}

export function calculateReactionStats(samples: ReactionSample[], totalRounds: number, falseStarts: number): ReactionStats {
  const reactions = samples.map((sample) => sample.reactionMs);
  const averageReactionMs = reactions.length ? reactions.reduce((sum, value) => sum + value, 0) / reactions.length : 0;
  const bestReactionMs = reactions.length ? Math.min(...reactions) : 0;
  const slowestReactionMs = reactions.length ? Math.max(...reactions) : 0;

  return {
    roundsCompleted: samples.length,
    totalRounds,
    averageReactionMs: round(averageReactionMs),
    bestReactionMs: round(bestReactionMs),
    slowestReactionMs: round(slowestReactionMs),
    consistencyScore: round(calculateConsistency(samples)),
    falseStarts,
    inputMethod: resolveInputMethod(samples),
  };
}

export function modeLabel(mode: ReactionTestMode) {
  return mode === 1 ? "1 round" : `${mode} rounds`;
}

export function scoreLabel(averageReactionMs: number) {
  if (averageReactionMs > 0 && averageReactionMs <= 180) return "Elite reflex";
  if (averageReactionMs <= 230 && averageReactionMs > 0) return "Sharp reaction";
  if (averageReactionMs <= 300 && averageReactionMs > 0) return "Solid timing";
  if (averageReactionMs > 0) return "Warm-up";
  return "No signal yet";
}

export function consistencyLabel(score: number) {
  if (score >= 86) return "Very steady";
  if (score >= 68) return "Stable";
  if (score >= 42) return "Uneven";
  if (score > 0) return "Variable";
  return "Needs 3 rounds";
}

export function resultInsight(stats: ReactionStats) {
  if (stats.roundsCompleted === 0) return "Wait for the signal, then tap as soon as the arena turns green.";
  if (stats.falseStarts > 0 && stats.roundsCompleted < stats.totalRounds) return "Early tap detected. Wait for green before reacting.";
  if (stats.averageReactionMs <= 180) return "Excellent reflex speed. Try more rounds to confirm consistency.";
  if (stats.averageReactionMs <= 230 && stats.consistencyScore >= 65) return "Strong reaction time with a stable rhythm.";
  if (stats.consistencyScore < 45 && stats.roundsCompleted >= 3) return "Your reactions vary a lot. Relax your hand and keep your eyes on the signal.";
  if (stats.inputMethod === "Touch") return "Touch input is working. Compare results on the same device for fairness.";
  return "Nice run. Reaction results vary with device latency, browser timing, and focus.";
}

export function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}
