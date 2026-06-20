import { describe, expect, it } from "vitest";
import {
  applyPercentChange,
  computePercent,
  percentChange,
  percentOf,
  whatPercent,
} from "./percent";

describe("percentOf", () => {
  it("computes a percentage of a value", () => {
    expect(percentOf(20, 150)).toBeCloseTo(30, 9);
    expect(percentOf(0, 150)).toBe(0);
  });
});

describe("whatPercent", () => {
  it("computes what percent part is of whole", () => {
    expect(whatPercent(30, 150)).toBeCloseTo(20, 9);
  });
  it("returns NaN when the whole is zero", () => {
    expect(whatPercent(5, 0)).toBeNaN();
  });
});

describe("percentChange", () => {
  it("computes increases and decreases", () => {
    expect(percentChange(100, 125)).toBeCloseTo(25, 9);
    expect(percentChange(200, 150)).toBeCloseTo(-25, 9);
  });
  it("returns NaN when the base is zero", () => {
    expect(percentChange(0, 50)).toBeNaN();
  });
});

describe("applyPercentChange", () => {
  it("applies an increase or decrease", () => {
    expect(applyPercentChange(80, 25)).toBeCloseTo(100, 9);
    expect(applyPercentChange(100, -10)).toBeCloseTo(90, 9);
  });
});

describe("computePercent", () => {
  it("produces a value and a sentence for each mode", () => {
    expect(computePercent("of", { a: 20, b: 150 }).value).toBeCloseTo(30, 9);
    expect(computePercent("isWhatPercent", { a: 30, b: 150 }).value).toBeCloseTo(20, 9);
    expect(computePercent("change", { a: 100, b: 125 }).sentence).toMatch(/25% increase/);
    expect(computePercent("applyChange", { a: 80, b: 25 }).value).toBeCloseTo(100, 9);
  });

  it("returns a blank outcome for invalid or incomplete input", () => {
    expect(computePercent("of", { a: NaN, b: 10 })).toEqual({ value: NaN, sentence: "" });
    expect(computePercent("isWhatPercent", { a: 5, b: 0 }).sentence).toBe("");
  });
});
