import type { ClickInputMethod, ClickSample, ClickStats, ClickTestMode } from "./types";

const BURST_WINDOW_MS = 1000;

function round(value: number, decimals = 0) {
  if (!Number.isFinite(value)) return 0;
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function gapsFromSamples(samples: ClickSample[]) {
  const gaps: number[] = [];

  for (let index = 1; index < samples.length; index += 1) {
    const gap = samples[index].time - samples[index - 1].time;
    if (gap > 0 && gap < 5000) gaps.push(gap);
  }

  return gaps;
}

function resolveInputMethod(samples: ClickSample[]): ClickInputMethod {
  const mouse = samples.some((sample) => sample.source === "mouse");
  const touch = samples.some((sample) => sample.source === "touch");
  const pen = samples.some((sample) => sample.source === "pen");
  const active = [mouse, touch, pen].filter(Boolean).length;

  if (active > 1) return "Mixed";
  if (mouse) return "Mouse";
  if (touch) return "Touch";
  if (pen) return "Pen";
  return "None";
}

function calculateBestBurst(samples: ClickSample[]) {
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

function calculateConsistency(samples: ClickSample[]) {
  const gaps = gapsFromSamples(samples);
  if (gaps.length < 4) return 0;

  const average = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  if (average <= 0) return 0;

  const variance = gaps.reduce((sum, gap) => sum + (gap - average) ** 2, 0) / gaps.length;
  const coefficientOfVariation = Math.sqrt(variance) / average;
  const score = 100 - Math.min(100, coefficientOfVariation * 80);

  return Math.max(0, Math.min(100, score));
}

export function pointerSource(pointerType: string): ClickSample["source"] {
  if (pointerType === "touch") return "touch";
  if (pointerType === "pen") return "pen";
  return "mouse";
}

export function createEmptyStats(): ClickStats {
  return {
    totalClicks: 0,
    elapsedSeconds: 0,
    clicksPerSecond: 0,
    bestBurst: 0,
    averageGapMs: 0,
    fastestGapMs: 0,
    consistencyScore: 0,
    inputMethod: "None",
  };
}

export function calculateClickStats(samples: ClickSample[], elapsedMs: number): ClickStats {
  const elapsedSeconds = Math.max(elapsedMs / 1000, 0.01);
  const gaps = gapsFromSamples(samples);
  const totalClicks = samples.length;
  const averageGapMs = gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0;
  const fastestGapMs = gaps.length ? Math.min(...gaps) : 0;

  return {
    totalClicks,
    elapsedSeconds: round(elapsedSeconds, 2),
    clicksPerSecond: round(totalClicks / elapsedSeconds, 2),
    bestBurst: calculateBestBurst(samples),
    averageGapMs: round(averageGapMs),
    fastestGapMs: round(fastestGapMs),
    consistencyScore: round(calculateConsistency(samples)),
    inputMethod: resolveInputMethod(samples),
  };
}

export function modeLabel(mode: ClickTestMode) {
  return mode === "manual" ? "Manual" : `${mode}s`;
}

export function scoreLabel(clicksPerSecond: number) {
  if (clicksPerSecond >= 12) return "Elite clicker";
  if (clicksPerSecond >= 9) return "Fast rhythm";
  if (clicksPerSecond >= 6) return "Solid pace";
  if (clicksPerSecond > 0) return "Warm-up";
  return "No clicks yet";
}

export function consistencyLabel(score: number) {
  if (score >= 82) return "Very steady";
  if (score >= 62) return "Stable";
  if (score >= 36) return "Uneven";
  if (score > 0) return "Bursty";
  return "No rhythm yet";
}

export function resultInsight(stats: ClickStats) {
  if (stats.totalClicks === 0) return "Start a sprint and click the target area to generate a score.";
  if (stats.clicksPerSecond >= 12 && stats.consistencyScore >= 70) return "Excellent sprint: high CPS with controlled rhythm.";
  if (stats.clicksPerSecond >= 9) return "Strong click speed. Try 10 seconds to see if you can keep the pace.";
  if (stats.consistencyScore < 35 && stats.totalClicks > 8) return "Your rhythm is bursty. Try lighter pressure and keep your wrist relaxed.";
  if (stats.inputMethod === "Touch") return "Touch input is working. Compare scores on the same device for the fairest result.";
  return "Nice run. For fair comparison, keep the same mouse, browser, and timer mode.";
}

export function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}
