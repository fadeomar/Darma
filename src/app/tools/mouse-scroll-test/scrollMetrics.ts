import type { ScrollDirection, ScrollInputMethod, ScrollSample, ScrollStats, ScrollTestMode } from "./types";

const LINE_HEIGHT_IN_PIXELS = 16;
const BURST_WINDOW_MS = 500;

function round(value: number) {
  return Math.round(Number.isFinite(value) ? value : 0);
}

function sampleDistance(sample: ScrollSample) {
  return Math.hypot(sample.dx, sample.dy);
}

function resolveDirection(samples: ScrollSample[]): ScrollDirection {
  const totals = samples.reduce(
    (acc, sample) => {
      if (sample.dy > 0) acc.down += Math.abs(sample.dy);
      if (sample.dy < 0) acc.up += Math.abs(sample.dy);
      if (sample.dx > 0) acc.right += Math.abs(sample.dx);
      if (sample.dx < 0) acc.left += Math.abs(sample.dx);
      return acc;
    },
    { down: 0, up: 0, right: 0, left: 0 },
  );

  const ranked = [
    ["Down", totals.down],
    ["Up", totals.up],
    ["Right", totals.right],
    ["Left", totals.left],
  ] as const;
  const sorted = [...ranked].sort((a, b) => b[1] - a[1]);
  const [first, second] = sorted;

  if (!first || first[1] <= 0) return "None";
  if (second && second[1] > first[1] * 0.28) return "Mixed";
  return first[0];
}

function resolveInputMethod(samples: ScrollSample[]): ScrollInputMethod {
  const wheel = samples.filter((sample) => sample.source === "wheel").length;
  const touch = samples.filter((sample) => sample.source === "touch").length;

  if (wheel > 0 && touch > 0) return "Mixed";
  if (wheel > 0) return "Wheel";
  if (touch > 0) return "Touch";
  return "None";
}

function calculateBestBurst(samples: ScrollSample[]) {
  let best = 0;
  let left = 0;
  let distance = 0;

  for (let right = 0; right < samples.length; right += 1) {
    distance += sampleDistance(samples[right]);

    while (samples[right].time - samples[left].time > BURST_WINDOW_MS) {
      distance -= sampleDistance(samples[left]);
      left += 1;
    }

    best = Math.max(best, distance / (BURST_WINDOW_MS / 1000));
  }

  return best;
}

function calculateSmoothness(samples: ScrollSample[]) {
  if (samples.length < 4) return 0;

  const gaps: number[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const gap = samples[index].time - samples[index - 1].time;
    if (gap > 0 && gap < 1200) gaps.push(gap);
  }

  if (gaps.length < 3) return 0;

  const average = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  if (average <= 0) return 0;

  const variance = gaps.reduce((sum, gap) => sum + (gap - average) ** 2, 0) / gaps.length;
  const coefficientOfVariation = Math.sqrt(variance) / average;
  const score = 100 - Math.min(100, coefficientOfVariation * 75);

  return Math.max(0, Math.min(100, score));
}

export function normalizeWheelDelta(event: WheelEvent) {
  const unit =
    event.deltaMode === 1
      ? LINE_HEIGHT_IN_PIXELS
      : event.deltaMode === 2
        ? Math.max(window.innerHeight || 800, 1)
        : 1;

  return {
    dx: event.deltaX * unit,
    dy: event.deltaY * unit,
  };
}

export function createEmptyStats(): ScrollStats {
  return {
    totalDistance: 0,
    netVertical: 0,
    netHorizontal: 0,
    eventsCount: 0,
    elapsedSeconds: 0,
    pixelsPerSecond: 0,
    eventsPerSecond: 0,
    bestBurst: 0,
    smoothnessScore: 0,
    direction: "None",
    inputMethod: "None",
  };
}

export function calculateScrollStats(samples: ScrollSample[], elapsedMs: number): ScrollStats {
  const elapsedSeconds = Math.max(elapsedMs / 1000, 0.01);
  const totalDistance = samples.reduce((sum, sample) => sum + sampleDistance(sample), 0);
  const netVertical = samples.reduce((sum, sample) => sum + sample.dy, 0);
  const netHorizontal = samples.reduce((sum, sample) => sum + sample.dx, 0);
  const eventsCount = samples.length;

  return {
    totalDistance: round(totalDistance),
    netVertical: round(netVertical),
    netHorizontal: round(netHorizontal),
    eventsCount,
    elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
    pixelsPerSecond: round(totalDistance / elapsedSeconds),
    eventsPerSecond: Number((eventsCount / elapsedSeconds).toFixed(1)),
    bestBurst: round(calculateBestBurst(samples)),
    smoothnessScore: round(calculateSmoothness(samples)),
    direction: resolveDirection(samples),
    inputMethod: resolveInputMethod(samples),
  };
}

export function modeLabel(mode: ScrollTestMode) {
  return mode === "manual" ? "Manual" : `${mode}s`;
}

export function scoreLabel(pixelsPerSecond: number) {
  if (pixelsPerSecond >= 5200) return "Wheel sprinter";
  if (pixelsPerSecond >= 3200) return "Fast scroll";
  if (pixelsPerSecond >= 1600) return "Steady wheel";
  if (pixelsPerSecond > 0) return "Warm-up";
  return "No scroll yet";
}

export function smoothnessLabel(score: number) {
  if (score >= 82) return "Very smooth";
  if (score >= 62) return "Stable";
  if (score >= 36) return "Uneven";
  if (score > 0) return "Bursty";
  return "No rhythm yet";
}

export function resultInsight(stats: ScrollStats) {
  if (stats.eventsCount === 0) return "Start a sprint, keep the pointer inside the arena, and scroll to generate a score.";
  if (stats.pixelsPerSecond >= 5200 && stats.smoothnessScore >= 70) return "Strong sprint: high speed with a controlled rhythm.";
  if (stats.pixelsPerSecond >= 3200) return "Good pace. Try a longer mode to test endurance.";
  if (stats.smoothnessScore < 35 && stats.eventsCount > 6) return "The scroll pattern is bursty. That can happen with touchpads, mouse drivers, or aggressive wheel steps.";
  if (stats.inputMethod === "Touch") return "Touch mode is working. Compare results on the same device for the fairest score.";
  return "Nice run. For a fair comparison, keep the same browser, device, and scroll settings.";
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}
