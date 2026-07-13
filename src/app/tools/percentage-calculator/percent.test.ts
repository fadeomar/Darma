import { describe, expect, it } from "vitest";
import {
  applyPercentChange,
  buildJavaScriptSnippet,
  buildPercentChecks,
  buildPercentScenarios,
  buildScenarioCsv,
  computePercent,
  marginPercent,
  markupPercent,
  percentageDifference,
  percentChange,
  percentOf,
  reversePercentChange,
  whatPercent,
} from "./percent";

describe("core percentage helpers", () => {
  it("computes a percentage of a value", () => {
    expect(percentOf(20, 150)).toBeCloseTo(30, 12);
  });

  it("computes part as a percentage of whole", () => {
    expect(whatPercent(30, 150)).toBeCloseTo(20, 12);
    expect(whatPercent(5, 0)).toBeNaN();
  });

  it("computes signed percentage change", () => {
    expect(percentChange(100, 125)).toBeCloseTo(25, 12);
    expect(percentChange(200, 150)).toBeCloseTo(-25, 12);
    expect(percentChange(0, 50)).toBeNaN();
  });

  it("applies and reverses a percentage change", () => {
    expect(applyPercentChange(80, 25)).toBeCloseTo(100, 12);
    expect(reversePercentChange(100, 25)).toBeCloseTo(80, 12);
    expect(reversePercentChange(0, -100)).toBeNaN();
  });

  it("computes magnitude-based percentage difference", () => {
    expect(percentageDifference(100, 120)).toBeCloseTo(18.1818181818, 8);
    expect(percentageDifference(0, 0)).toBe(0);
    expect(percentageDifference(-10, 10)).toBe(200);
  });

  it("computes markup and margin separately", () => {
    expect(markupPercent(45, 72)).toBeCloseTo(60, 12);
    expect(marginPercent(45, 72)).toBeCloseTo(37.5, 12);
  });
});

describe("computePercent", () => {
  it("returns breakdowns for percent-of mode", () => {
    const result = computePercent("of", { a: 20, b: 150 });
    expect(result.valid).toBe(true);
    expect(result.value).toBeCloseTo(30, 12);
    expect(result.metrics.map((item) => item.label)).toContain("Decimal factor");
  });

  it("blocks zero denominators with specific messages", () => {
    expect(computePercent("isWhatPercent", { a: 5, b: 0 }).error).toMatch(/whole value cannot be zero/i);
    expect(computePercent("change", { a: 0, b: 5 }).error).toMatch(/starting value is zero/i);
  });

  it("calculates increase, decrease, and unchanged directions", () => {
    expect(computePercent("change", { a: 100, b: 125 }).direction).toBe("increase");
    expect(computePercent("change", { a: 100, b: 75 }).direction).toBe("decrease");
    expect(computePercent("change", { a: 100, b: 100 }).direction).toBe("unchanged");
  });

  it("reverses an applied increase", () => {
    const result = computePercent("reverseChange", { a: 54000, b: 8 });
    expect(result.value).toBeCloseTo(50000, 8);
    expect(result.substitutedFormula).toContain("54,000");
  });

  it("blocks reversing a negative one hundred percent change", () => {
    const result = computePercent("reverseChange", { a: 10, b: -100 });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/cannot be reversed/i);
  });

  it("calculates discount savings and final price", () => {
    const result = computePercent("discount", { a: 120, b: 25 });
    expect(result.value).toBeCloseTo(90, 12);
    expect(result.metrics.find((item) => item.label === "Savings")?.value).toBeCloseTo(30, 12);
  });

  it("calculates markup, margin, and profit", () => {
    const result = computePercent("markupMargin", { a: 45, b: 72 });
    expect(result.value).toBeCloseTo(60, 12);
    expect(result.metrics.find((item) => item.label === "Gross margin")?.value).toBeCloseTo(37.5, 12);
    expect(result.absoluteDelta).toBeCloseTo(27, 12);
  });

  it("rejects non-positive business values", () => {
    expect(computePercent("markupMargin", { a: 0, b: 72 }).valid).toBe(false);
    expect(computePercent("markupMargin", { a: 45, b: -1 }).valid).toBe(false);
  });

  it("rejects non-finite input", () => {
    expect(computePercent("of", { a: Number.NaN, b: 10 }).valid).toBe(false);
    expect(computePercent("of", { a: Number.POSITIVE_INFINITY, b: 10 }).valid).toBe(false);
  });
});

describe("scenarios, checks, and exports", () => {
  it("builds five what-if scenarios around input B", () => {
    const rows = buildPercentScenarios("discount", { a: 100, b: 20 });
    expect(rows).toHaveLength(5);
    expect(rows[0].inputB).toBeCloseTo(16, 12);
    expect(rows[4].inputB).toBeCloseTo(24, 12);
    expect(rows[2].label).toBe("Current");
  });

  it("flags discount and precision risks", () => {
    const overDiscount = computePercent("discount", { a: 100, b: 125 });
    const checks = buildPercentChecks("discount", { a: 100, b: 125 }, overDiscount);
    expect(checks.some((check) => check.id === "over-discount" && check.level === "danger")).toBe(true);

    const huge = computePercent("of", { a: 10, b: Number.MAX_SAFE_INTEGER + 10 });
    const hugeChecks = buildPercentChecks("of", { a: 10, b: Number.MAX_SAFE_INTEGER + 10 }, huge);
    expect(hugeChecks.some((check) => check.id === "unsafe-number")).toBe(true);
  });

  it("includes a warning when selling below cost", () => {
    const result = computePercent("markupMargin", { a: 80, b: 60 });
    const checks = buildPercentChecks("markupMargin", { a: 80, b: 60 }, result);
    expect(checks.some((check) => check.id === "negative-profit")).toBe(true);
  });

  it("exports valid CSV and JavaScript starters", () => {
    const scenarios = buildPercentScenarios("change", { a: 100, b: 125 });
    const csv = buildScenarioCsv(scenarios);
    expect(csv).toContain('"scenario","modifier_percent"');
    expect(csv).toContain('"Current"');

    const snippet = buildJavaScriptSnippet("markupMargin");
    expect(snippet).toContain("markupPercent");
    expect(snippet).toContain("marginPercent");
  });
});
