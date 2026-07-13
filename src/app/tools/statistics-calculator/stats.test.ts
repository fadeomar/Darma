import { describe, expect, it } from "vitest";
import {
  buildCleanDataCsv,
  buildHistogram,
  buildMetricsCsv,
  buildStatsChecks,
  buildSummaryMarkdown,
  computeStats,
  formatStat,
  parseDataset,
  parseNumbers,
  percentile,
} from "./stats";
import { DEFAULT_STATS_OPTIONS } from "./presets";

describe("parseDataset", () => {
  it("parses common separators, scientific notation, quotes, and Unicode minus", () => {
    const result = parseDataset("1, 2; 3|4\n1e2 \"5.5\" −6");
    expect(result.values).toEqual([1, 2, 3, 4, 100, 5.5, -6]);
    expect(result.invalidCount).toBe(0);
  });

  it("reports invalid tokens instead of silently hiding them", () => {
    const result = parseDataset("1, nope, 2, Infinity, 3");
    expect(result.values).toEqual([1, 2, 3]);
    expect(result.invalidCount).toBe(2);
    expect(result.invalidTokens).toEqual([
      { token: "nope", position: 2 },
      { token: "Infinity", position: 4 },
    ]);
  });

  it("caps the number of analyzed values and reports truncation", () => {
    const result = parseDataset("1 2 3 4 5", 3);
    expect(result.values).toEqual([1, 2, 3]);
    expect(result.truncatedCount).toBe(2);
  });

  it("keeps the backward-compatible parseNumbers helper", () => {
    expect(parseNumbers("-1.5, 2, abc, 3.25")).toEqual([-1.5, 2, 3.25]);
  });
});

describe("percentiles and descriptive statistics", () => {
  it("supports linear interpolation and nearest-rank percentiles", () => {
    const sorted = [1, 2, 3, 4];
    expect(percentile(sorted, 0.25, "linear")).toBe(1.75);
    expect(percentile(sorted, 0.25, "nearest-rank")).toBe(1);
    expect(percentile(sorted, 0.5, "nearest-rank")).toBe(2);
  });

  it("computes core metrics, quartiles, and stable variance", () => {
    const result = computeStats([2, 4, 4, 4, 5, 5, 7, 9])!;
    expect(result.count).toBe(8);
    expect(result.uniqueCount).toBe(5);
    expect(result.sum).toBe(40);
    expect(result.mean).toBe(5);
    expect(result.median).toBe(4.5);
    expect(result.modes).toEqual([4]);
    expect(result.q1).toBe(4);
    expect(result.q3).toBe(5.5);
    expect(result.iqr).toBe(1.5);
    expect(result.variancePopulation).toBeCloseTo(4, 10);
    expect(result.stdDevPopulation).toBeCloseTo(2, 10);
  });

  it("detects IQR outliers and whiskers", () => {
    const result = computeStats([117, 118, 119, 119, 120, 121, 121, 122, 123, 124, 125, 126, 128, 640])!;
    expect(result.outliers).toEqual([640]);
    expect(result.upperWhisker).toBe(128);
    expect(result.max).toBe(640);
  });

  it("reports multiple modes and handles a constant data set", () => {
    expect(computeStats([1, 1, 2, 2, 3])!.modes).toEqual([1, 2]);
    const constant = computeStats([7, 7, 7])!;
    expect(constant.range).toBe(0);
    expect(constant.stdDevPopulation).toBe(0);
    expect(constant.skewness).toBeNull();
  });

  it("returns null for an empty list", () => {
    expect(computeStats([])).toBeNull();
  });
});

describe("histogram, checks, and exports", () => {
  it("builds bins whose counts cover the complete data set", () => {
    const stats = computeStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])!;
    const bins = buildHistogram(stats, 5);
    expect(bins).toHaveLength(5);
    expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(10);
    expect(bins.reduce((sum, bin) => sum + bin.percentage, 0)).toBeCloseTo(100, 10);
  });

  it("creates production warnings for invalid values and outliers", () => {
    const parsed = parseDataset("1 2 3 4 5 100 bad");
    const stats = computeStats(parsed.values)!;
    const checks = buildStatsChecks(parsed, stats, 20);
    expect(checks.some((check) => check.id === "invalid-values")).toBe(true);
    expect(checks.some((check) => check.id === "outliers")).toBe(true);
  });

  it("exports readable Markdown and CSV artifacts", () => {
    const parsed = parseDataset("1 2 3 100");
    const stats = computeStats(parsed.values)!;
    const checks = buildStatsChecks(parsed, stats, 9);
    const markdown = buildSummaryMarkdown(stats, DEFAULT_STATS_OPTIONS, checks);
    const metricsCsv = buildMetricsCsv(stats);
    const cleanCsv = buildCleanDataCsv(parsed, stats);
    expect(markdown).toContain("# Descriptive statistics report");
    expect(markdown).toContain("| Mean |");
    expect(metricsCsv).toContain("std_dev_sample");
    expect(cleanCsv).toContain("is_outlier");
    expect(cleanCsv).toContain("100,true");
  });
});

describe("formatStat", () => {
  it("uses configurable display precision", () => {
    expect(formatStat(2)).toBe("2");
    expect(formatStat(2.123456789, 3)).toBe("2.123");
    expect(formatStat(Number.NaN)).toBe("—");
  });
});
