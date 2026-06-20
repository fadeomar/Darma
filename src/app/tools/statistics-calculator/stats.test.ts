import { describe, expect, it } from "vitest";
import { computeStats, formatStat, parseNumbers } from "./stats";

describe("parseNumbers", () => {
  it("parses numbers separated by commas, spaces, and newlines", () => {
    expect(parseNumbers("1, 2 3\n4")).toEqual([1, 2, 3, 4]);
  });
  it("handles decimals and negatives, dropping junk", () => {
    expect(parseNumbers("-1.5, 2, abc, 3.25")).toEqual([-1.5, 2, 3.25]);
  });
  it("returns an empty array for blank input", () => {
    expect(parseNumbers("   \n  ")).toEqual([]);
  });
});

describe("computeStats", () => {
  it("computes core statistics", () => {
    const result = computeStats([2, 4, 4, 4, 5, 5, 7, 9])!;
    expect(result.count).toBe(8);
    expect(result.sum).toBe(40);
    expect(result.mean).toBe(5);
    expect(result.median).toBe(4.5);
    expect(result.modes).toEqual([4]);
    expect(result.min).toBe(2);
    expect(result.max).toBe(9);
    expect(result.range).toBe(7);
    // Population variance of this classic set is 4, population std dev 2.
    expect(result.variancePopulation).toBeCloseTo(4, 9);
    expect(result.stdDevPopulation).toBeCloseTo(2, 9);
  });

  it("computes the median for an odd count", () => {
    expect(computeStats([3, 1, 2])!.median).toBe(2);
  });

  it("reports multiple modes and sorts them", () => {
    expect(computeStats([1, 1, 2, 2, 3])!.modes).toEqual([1, 2]);
  });

  it("reports no mode when all values are unique", () => {
    expect(computeStats([1, 2, 3, 4])!.modes).toEqual([]);
  });

  it("distinguishes sample and population variance", () => {
    const result = computeStats([1, 2, 3, 4, 5])!;
    expect(result.variancePopulation).toBeCloseTo(2, 9);
    expect(result.varianceSample).toBeCloseTo(2.5, 9);
  });

  it("returns null for an empty list", () => {
    expect(computeStats([])).toBeNull();
  });
});

describe("formatStat", () => {
  it("trims floating noise", () => {
    expect(formatStat(2)).toBe("2");
    expect(formatStat(2.123456789)).toBe("2.12346");
  });
  it("renders a dash for non-finite values", () => {
    expect(formatStat(Number.NaN)).toBe("—");
  });
});
