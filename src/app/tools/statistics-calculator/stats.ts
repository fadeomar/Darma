import type {
  DescriptiveStats,
  HistogramBin,
  HistogramBinSetting,
  ParsedDataset,
  PercentileMethod,
  StatsCheck,
  StatsOptions,
} from "./types";

export const STATS_MAX_VALUES = 20_000;
export const STATS_MAX_INPUT_CHARACTERS = 250_000;
export const STATS_INVALID_TOKEN_PREVIEW_LIMIT = 24;

function cleanToken(token: string): string {
  const trimmed = token.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1).trim();
    }
  }
  return trimmed.replaceAll("−", "-");
}

/**
 * Parse free-form numeric data separated by commas, semicolons, pipes, spaces,
 * tabs, or line breaks. Invalid values are retained as diagnostics instead of
 * being silently discarded.
 */
export function parseDataset(text: string, maxValues = STATS_MAX_VALUES): ParsedDataset {
  const rawTokens = text.split(/[\s,;|]+/).filter((token) => token.trim().length > 0);
  const values: number[] = [];
  const invalidTokens: ParsedDataset["invalidTokens"] = [];
  let invalidCount = 0;
  let truncatedCount = 0;

  rawTokens.forEach((rawToken, index) => {
    const token = cleanToken(rawToken);
    const value = Number(token);
    if (!token || !Number.isFinite(value)) {
      invalidCount += 1;
      if (invalidTokens.length < STATS_INVALID_TOKEN_PREVIEW_LIMIT) {
        invalidTokens.push({ token: rawToken, position: index + 1 });
      }
      return;
    }
    if (values.length >= maxValues) {
      truncatedCount += 1;
      return;
    }
    values.push(value);
  });

  return {
    values,
    tokenCount: rawTokens.length,
    invalidCount,
    invalidTokens,
    truncatedCount,
  };
}

/** Backward-compatible helper used by older callers and tests. */
export function parseNumbers(text: string): number[] {
  return parseDataset(text).values;
}

function kahanSum(values: number[]): number {
  let sum = 0;
  let correction = 0;
  for (const value of values) {
    const adjusted = value - correction;
    const next = sum + adjusted;
    correction = next - sum - adjusted;
    sum = next;
  }
  return sum;
}

export function percentile(sorted: number[], probability: number, method: PercentileMethod = "linear"): number {
  if (sorted.length === 0) return Number.NaN;
  const p = Math.min(1, Math.max(0, probability));
  if (sorted.length === 1 || p === 0) return sorted[0]!;
  if (p === 1) return sorted[sorted.length - 1]!;

  if (method === "nearest-rank") {
    const rank = Math.max(1, Math.ceil(p * sorted.length));
    return sorted[rank - 1]!;
  }

  const position = (sorted.length - 1) * p;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lower = sorted[lowerIndex]!;
  const upper = sorted[upperIndex]!;
  if (lowerIndex === upperIndex) return lower;
  return lower + (upper - lower) * (position - lowerIndex);
}

function getModes(values: number[]): { modes: number[]; frequency: number } {
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);

  let maxCount = 0;
  for (const count of counts.values()) maxCount = Math.max(maxCount, count);
  if (maxCount <= 1) return { modes: [], frequency: maxCount };

  const modes = [...counts.entries()]
    .filter(([, count]) => count === maxCount)
    .map(([value]) => value)
    .sort((a, b) => a - b);
  return { modes, frequency: maxCount };
}

export function computeStats(values: number[], method: PercentileMethod = "linear"): DescriptiveStats | null {
  const n = values.length;
  if (n === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const sum = kahanSum(values);
  const mean = sum / n;
  let squaredDiffs = 0;
  for (const value of values) squaredDiffs += (value - mean) ** 2;

  const variancePopulation = squaredDiffs / n;
  const varianceSample = n > 1 ? squaredDiffs / (n - 1) : 0;
  const stdDevPopulation = Math.sqrt(variancePopulation);
  const stdDevSample = Math.sqrt(varianceSample);
  const q1 = percentile(sorted, 0.25, method);
  const median = percentile(sorted, 0.5, method);
  const q3 = percentile(sorted, 0.75, method);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outliers = sorted.filter((value) => value < lowerFence || value > upperFence);
  const inliers = sorted.filter((value) => value >= lowerFence && value <= upperFence);
  const { modes, frequency } = getModes(values);

  let skewness: number | null = null;
  if (n >= 3 && stdDevSample > 0) {
    let standardizedCubeSum = 0;
    for (const value of values) standardizedCubeSum += ((value - mean) / stdDevSample) ** 3;
    skewness = (n / ((n - 1) * (n - 2))) * standardizedCubeSum;
  }

  return {
    count: n,
    uniqueCount: new Set(values).size,
    sum,
    mean,
    median,
    modes,
    modeFrequency: frequency,
    min: sorted[0]!,
    max: sorted[n - 1]!,
    range: sorted[n - 1]! - sorted[0]!,
    q1,
    q3,
    iqr,
    p10: percentile(sorted, 0.1, method),
    p90: percentile(sorted, 0.9, method),
    p95: percentile(sorted, 0.95, method),
    lowerFence,
    upperFence,
    lowerWhisker: inliers[0] ?? sorted[0]!,
    upperWhisker: inliers[inliers.length - 1] ?? sorted[n - 1]!,
    outliers,
    variancePopulation,
    varianceSample,
    stdDevPopulation,
    stdDevSample,
    coefficientOfVariation: mean === 0 ? null : Math.abs(stdDevPopulation / mean),
    skewness,
    sorted,
  };
}

function resolveBinCount(stats: DescriptiveStats, setting: HistogramBinSetting): number {
  if (typeof setting === "number") return Math.min(stats.count, Math.max(1, setting));
  if (stats.count <= 1 || stats.range === 0) return 1;

  const freedmanDiaconisWidth = stats.iqr > 0 ? (2 * stats.iqr) / Math.cbrt(stats.count) : 0;
  const estimated = freedmanDiaconisWidth > 0
    ? Math.ceil(stats.range / freedmanDiaconisWidth)
    : Math.ceil(Math.log2(stats.count) + 1);
  return Math.min(24, Math.max(1, Math.min(stats.count, estimated)));
}

export function buildHistogram(stats: DescriptiveStats, setting: HistogramBinSetting = "auto"): HistogramBin[] {
  const binCount = resolveBinCount(stats, setting);
  if (binCount === 1 || stats.range === 0) {
    return [{ index: 0, start: stats.min, end: stats.max, count: stats.count, percentage: 100 }];
  }

  const width = stats.range / binCount;
  const counts = Array.from({ length: binCount }, () => 0);
  for (const value of stats.sorted) {
    const index = value === stats.max
      ? binCount - 1
      : Math.min(binCount - 1, Math.max(0, Math.floor((value - stats.min) / width)));
    counts[index] += 1;
  }

  return counts.map((count, index) => ({
    index,
    start: stats.min + width * index,
    end: index === binCount - 1 ? stats.max : stats.min + width * (index + 1),
    count,
    percentage: (count / stats.count) * 100,
  }));
}

export function buildStatsChecks(parsed: ParsedDataset, stats: DescriptiveStats | null, inputLength: number): StatsCheck[] {
  const checks: StatsCheck[] = [];

  if (!stats) {
    checks.push({ id: "no-data", level: "danger", title: "No valid numeric data", message: "Enter at least one finite number before calculating statistics." });
    return checks;
  }

  if (parsed.invalidCount > 0) {
    const ratio = parsed.tokenCount ? parsed.invalidCount / parsed.tokenCount : 0;
    checks.push({
      id: "invalid-values",
      level: ratio >= 0.2 ? "danger" : "warning",
      title: `${parsed.invalidCount} invalid token${parsed.invalidCount === 1 ? "" : "s"}`,
      message: "Invalid values are excluded from calculations. Review the diagnostics before exporting results.",
    });
  } else {
    checks.push({ id: "valid-values", level: "success", title: "All tokens are numeric", message: `${stats.count.toLocaleString()} values were parsed without silently dropping data.` });
  }

  if (parsed.truncatedCount > 0) {
    checks.push({ id: "truncated", level: "danger", title: "Value limit reached", message: `${parsed.truncatedCount.toLocaleString()} additional values were not analyzed. Split the data set or use a dedicated statistics environment.` });
  }

  if (stats.count === 1) {
    checks.push({ id: "single-value", level: "info", title: "Single-value data set", message: "Sample variance and distribution shape are not meaningful with one observation." });
  }

  if (stats.range === 0) {
    checks.push({ id: "constant", level: "info", title: "Constant data set", message: "Every observation has the same value, so variance, standard deviation, and IQR are zero." });
  }

  if (stats.outliers.length > 0) {
    checks.push({ id: "outliers", level: "warning", title: `${stats.outliers.length} IQR outlier${stats.outliers.length === 1 ? "" : "s"}`, message: "Outliers are observations outside the 1.5×IQR fences. Verify them before removing or transforming data." });
  }

  const maxAbs = Math.max(...stats.sorted.map((value) => Math.abs(value)));
  const minNonZeroAbs = Math.min(...stats.sorted.filter((value) => value !== 0).map((value) => Math.abs(value)));
  if (Number.isFinite(minNonZeroAbs) && minNonZeroAbs > 0 && maxAbs / minNonZeroAbs >= 1e12) {
    checks.push({ id: "mixed-scale", level: "warning", title: "Extreme scale difference", message: "Values span at least 12 orders of magnitude. Floating-point precision may affect small observations." });
  }

  if (stats.sorted.some((value) => Number.isInteger(value) && !Number.isSafeInteger(value))) {
    checks.push({ id: "unsafe-integers", level: "danger", title: "Unsafe JavaScript integers", message: "At least one integer exceeds Number.MAX_SAFE_INTEGER and may already have lost precision." });
  }

  if (stats.skewness !== null && Math.abs(stats.skewness) >= 2) {
    checks.push({ id: "skewed", level: "info", title: "Strongly skewed distribution", message: "The mean may be less representative than the median and percentile range for this data set." });
  }

  if (inputLength > STATS_MAX_INPUT_CHARACTERS) {
    checks.push({ id: "large-input", level: "warning", title: "Large browser input", message: `The input exceeds ${STATS_MAX_INPUT_CHARACTERS.toLocaleString()} characters. Consider a dedicated data-analysis workflow for larger files.` });
  }

  if (!checks.some((check) => check.level === "danger" || check.level === "warning")) {
    checks.push({ id: "ready", level: "success", title: "Ready for descriptive review", message: "No blocking data-quality issue was detected by the local checks." });
  }

  return checks;
}

export function formatStat(value: number, precision = 5): string {
  if (!Number.isFinite(value)) return "—";
  const safePrecision = Math.min(10, Math.max(0, Math.floor(precision)));
  return value.toLocaleString("en-US", { maximumFractionDigits: safePrecision });
}

export function buildStatsReport(parsed: ParsedDataset, stats: DescriptiveStats | null, options: StatsOptions, checks: StatsCheck[]) {
  return {
    generatedAt: new Date().toISOString(),
    parser: {
      tokens: parsed.tokenCount,
      validValues: parsed.values.length,
      invalidValues: parsed.invalidCount,
      truncatedValues: parsed.truncatedCount,
      invalidTokenPreview: parsed.invalidTokens,
    },
    options,
    statistics: stats ? {
      count: stats.count,
      uniqueCount: stats.uniqueCount,
      sum: stats.sum,
      mean: stats.mean,
      median: stats.median,
      modes: stats.modes,
      modeFrequency: stats.modeFrequency,
      min: stats.min,
      q1: stats.q1,
      q3: stats.q3,
      max: stats.max,
      range: stats.range,
      iqr: stats.iqr,
      p10: stats.p10,
      p90: stats.p90,
      p95: stats.p95,
      variancePopulation: stats.variancePopulation,
      varianceSample: stats.varianceSample,
      stdDevPopulation: stats.stdDevPopulation,
      stdDevSample: stats.stdDevSample,
      coefficientOfVariation: stats.coefficientOfVariation,
      skewness: stats.skewness,
      lowerFence: stats.lowerFence,
      upperFence: stats.upperFence,
      outliers: stats.outliers,
    } : null,
    checks,
  };
}

export function buildSummaryMarkdown(stats: DescriptiveStats | null, options: StatsOptions, checks: StatsCheck[]): string {
  if (!stats) return "# Statistics report\n\nNo valid numeric data was available.\n";
  const f = (value: number) => formatStat(value, options.precision);
  const focusedVariance = options.varianceFocus === "sample" ? stats.varianceSample : stats.variancePopulation;
  const focusedStdDev = options.varianceFocus === "sample" ? stats.stdDevSample : stats.stdDevPopulation;
  return `# Descriptive statistics report

## Summary

| Metric | Value |
| --- | ---: |
| Count | ${stats.count} |
| Unique values | ${stats.uniqueCount} |
| Sum | ${f(stats.sum)} |
| Mean | ${f(stats.mean)} |
| Median | ${f(stats.median)} |
| Mode | ${stats.modes.length ? stats.modes.map(f).join(", ") : "No repeated mode"} |
| Minimum | ${f(stats.min)} |
| Q1 | ${f(stats.q1)} |
| Q3 | ${f(stats.q3)} |
| Maximum | ${f(stats.max)} |
| Range | ${f(stats.range)} |
| IQR | ${f(stats.iqr)} |
| ${options.varianceFocus === "sample" ? "Sample" : "Population"} variance | ${f(focusedVariance)} |
| ${options.varianceFocus === "sample" ? "Sample" : "Population"} standard deviation | ${f(focusedStdDev)} |
| Outliers (1.5×IQR) | ${stats.outliers.length} |

## Production review

${checks.map((check) => `- **${check.title}:** ${check.message}`).join("\n")}

Generated locally by Darma. Descriptive checks do not replace domain-specific statistical review.
`;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildMetricsCsv(stats: DescriptiveStats | null): string {
  if (!stats) return "metric,value\n";
  const rows: Array<[string, string | number]> = [
    ["count", stats.count], ["unique_count", stats.uniqueCount], ["sum", stats.sum], ["mean", stats.mean],
    ["median", stats.median], ["modes", stats.modes.join(" | ")], ["mode_frequency", stats.modeFrequency],
    ["minimum", stats.min], ["q1", stats.q1], ["q3", stats.q3], ["maximum", stats.max], ["range", stats.range],
    ["iqr", stats.iqr], ["p10", stats.p10], ["p90", stats.p90], ["p95", stats.p95],
    ["variance_population", stats.variancePopulation], ["variance_sample", stats.varianceSample],
    ["std_dev_population", stats.stdDevPopulation], ["std_dev_sample", stats.stdDevSample],
    ["coefficient_of_variation", stats.coefficientOfVariation ?? ""], ["skewness", stats.skewness ?? ""],
    ["lower_outlier_fence", stats.lowerFence], ["upper_outlier_fence", stats.upperFence], ["outlier_count", stats.outliers.length],
  ];
  return `metric,value\n${rows.map(([metric, value]) => `${csvCell(metric)},${csvCell(value)}`).join("\n")}\n`;
}

export function buildCleanDataCsv(parsed: ParsedDataset, stats: DescriptiveStats | null): string {
  if (!stats) return "index,value,is_outlier\n";
  const outlierCounts = new Map<number, number>();
  for (const value of stats.outliers) outlierCounts.set(value, (outlierCounts.get(value) ?? 0) + 1);
  const consumed = new Map<number, number>();
  const rows = parsed.values.map((value, index) => {
    const used = consumed.get(value) ?? 0;
    const outlier = used < (outlierCounts.get(value) ?? 0);
    consumed.set(value, used + 1);
    return `${index + 1},${csvCell(value)},${outlier ? "true" : "false"}`;
  });
  return `index,value,is_outlier\n${rows.join("\n")}\n`;
}
