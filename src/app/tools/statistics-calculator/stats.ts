// ─── Descriptive statistics logic ──────────────────────────────────────────
// Pure helpers to parse a list of numbers and compute common descriptive
// statistics. All browser-local, no dependencies.

export type Stats = {
  count: number;
  sum: number;
  mean: number;
  median: number;
  modes: number[];
  min: number;
  max: number;
  range: number;
  variancePopulation: number;
  varianceSample: number;
  stdDevPopulation: number;
  stdDevSample: number;
};

/** Parse numbers from free text separated by commas, spaces, tabs, or newlines. */
export function parseNumbers(text: string): number[] {
  return text
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .map((token) => Number(token))
    .filter((value) => Number.isFinite(value));
}

function median(sorted: number[]): number {
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Most frequent value(s). Returns [] when every value appears the same number of times. */
function modes(values: number[]): number[] {
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);

  let maxCount = 0;
  for (const count of counts.values()) maxCount = Math.max(maxCount, count);

  if (maxCount <= 1) return [];

  const result: number[] = [];
  for (const [value, count] of counts) {
    if (count === maxCount) result.push(value);
  }
  return result.sort((a, b) => a - b);
}

export function computeStats(values: number[]): Stats | null {
  const n = values.length;
  if (n === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, value) => acc + value, 0);
  const mean = sum / n;

  const squaredDiffs = values.reduce((acc, value) => acc + (value - mean) ** 2, 0);
  const variancePopulation = squaredDiffs / n;
  const varianceSample = n > 1 ? squaredDiffs / (n - 1) : 0;

  return {
    count: n,
    sum,
    mean,
    median: median(sorted),
    modes: modes(values),
    min: sorted[0],
    max: sorted[n - 1],
    range: sorted[n - 1] - sorted[0],
    variancePopulation,
    varianceSample,
    stdDevPopulation: Math.sqrt(variancePopulation),
    stdDevSample: Math.sqrt(varianceSample),
  };
}

/** Trim floating-point noise for display. */
export function formatStat(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round((value + Number.EPSILON) * 100000) / 100000;
  return rounded.toLocaleString("en-US", { maximumFractionDigits: 5 });
}
