import type { SpacebarInputMethod, SpacebarSample, SpacebarStats, SpacebarTestMode } from "./types";

const BURST_WINDOW_MS = 1000;

function round(value: number, decimals = 0) {
  if (!Number.isFinite(value)) return 0;
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function gapsFromSamples(samples: SpacebarSample[]) {
  const gaps: number[] = [];

  for (let index = 1; index < samples.length; index += 1) {
    const gap = samples[index].time - samples[index - 1].time;
    if (gap > 0 && gap < 5000) gaps.push(gap);
  }

  return gaps;
}

function resolveInputMethod(samples: SpacebarSample[]): SpacebarInputMethod {
  const keyboard = samples.some((sample) => sample.source === "keyboard");
  const touch = samples.some((sample) => sample.source === "touch");
  const mouse = samples.some((sample) => sample.source === "mouse");
  const active = [keyboard, touch, mouse].filter(Boolean).length;

  if (active > 1) return "Mixed";
  if (keyboard) return "Keyboard";
  if (touch) return "Touch";
  if (mouse) return "Mouse";
  return "None";
}

function calculateBestBurst(samples: SpacebarSample[]) {
  let best = 0;
  let left = 0;

  for (let right = 0; right < samples.length; right += 1) {
    while (samples[right].time - samples[left].time > BURST_WINDOW_MS) {
      left += 1;
    }

    best = Math.max(best, right - left + 1);
  }

  return best;
}

function calculateConsistency(samples: SpacebarSample[]) {
  const gaps = gapsFromSamples(samples);
  if (gaps.length < 4) return 0;

  const average = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  if (average <= 0) return 0;

  const variance = gaps.reduce((sum, gap) => sum + (gap - average) ** 2, 0) / gaps.length;
  const coefficientOfVariation = Math.sqrt(variance) / average;
  const score = 100 - Math.min(100, coefficientOfVariation * 78);

  return Math.max(0, Math.min(100, score));
}

export function pointerSource(pointerType: string): SpacebarSample["source"] {
  return pointerType === "touch" ? "touch" : "mouse";
}

export function isSpacebarEvent(event: KeyboardEvent) {
  return event.code === "Space" || event.key === " " || event.key === "Spacebar";
}

export function createEmptyStats(): SpacebarStats {
  return {
    totalPresses: 0,
    elapsedSeconds: 0,
    pressesPerSecond: 0,
    bestBurst: 0,
    averageGapMs: 0,
    fastestGapMs: 0,
    consistencyScore: 0,
    ignoredRepeats: 0,
    inputMethod: "None",
  };
}

export function calculateSpacebarStats(samples: SpacebarSample[], elapsedMs: number, ignoredRepeats = 0): SpacebarStats {
  const elapsedSeconds = Math.max(elapsedMs / 1000, 0.01);
  const gaps = gapsFromSamples(samples);
  const totalPresses = samples.length;
  const averageGapMs = gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0;
  const fastestGapMs = gaps.length ? Math.min(...gaps) : 0;

  return {
    totalPresses,
    elapsedSeconds: round(elapsedSeconds, 2),
    pressesPerSecond: round(totalPresses / elapsedSeconds, 2),
    bestBurst: calculateBestBurst(samples),
    averageGapMs: round(averageGapMs),
    fastestGapMs: round(fastestGapMs),
    consistencyScore: round(calculateConsistency(samples)),
    ignoredRepeats,
    inputMethod: resolveInputMethod(samples),
  };
}

export function modeLabel(mode: SpacebarTestMode) {
  return mode === "manual" ? "Manual" : `${mode}s`;
}

export function scoreLabel(pressesPerSecond: number) {
  if (pressesPerSecond >= 11) return "Keyboard legend";
  if (pressesPerSecond >= 8) return "Fast tapper";
  if (pressesPerSecond >= 5) return "Steady rhythm";
  if (pressesPerSecond > 0) return "Warm-up";
  return "No presses yet";
}

export function consistencyLabel(score: number) {
  if (score >= 82) return "Very steady";
  if (score >= 62) return "Stable";
  if (score >= 36) return "Uneven";
  if (score > 0) return "Bursty";
  return "No rhythm yet";
}

export function resultInsight(stats: SpacebarStats) {
  if (stats.totalPresses === 0) return "Start a sprint and press the spacebar to generate a score.";
  if (stats.ignoredRepeats > stats.totalPresses) return "Holding space was detected and repeat events were ignored. Use separate taps for a fair score.";
  if (stats.pressesPerSecond >= 10 && stats.consistencyScore >= 70) return "Excellent sprint: high speed with a controlled spacebar rhythm.";
  if (stats.pressesPerSecond >= 8) return "Strong spacebar speed. Try the 10-second mode to test your consistency.";
  if (stats.consistencyScore < 35 && stats.totalPresses > 8) return "Your rhythm is bursty. Try lighter taps and keep your hand relaxed.";
  if (stats.inputMethod === "Touch") return "Touch fallback is working. For classic results, compare keyboard runs on the same device.";
  return "Nice run. For fair comparison, keep the same keyboard, browser, timer mode, and posture.";
}

export function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}
