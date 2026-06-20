import { describe, expect, it } from "vitest";
import {
  bmiCategory,
  bmiImperial,
  bmiMetric,
  feetInchesToInches,
  healthyWeightKg,
  kgToLb,
  lbToKg,
} from "./bmi";

describe("bmiMetric", () => {
  it("computes BMI from kg and cm", () => {
    expect(bmiMetric(70, 175)).toBeCloseTo(22.86, 2);
    expect(bmiMetric(90, 180)).toBeCloseTo(27.78, 2);
  });
  it("returns NaN for invalid input", () => {
    expect(bmiMetric(70, 0)).toBeNaN();
    expect(bmiMetric(0, 175)).toBeNaN();
  });
});

describe("bmiImperial", () => {
  it("computes BMI from pounds and inches", () => {
    // 154 lb, 69 in ≈ 22.7
    expect(bmiImperial(154, 69)).toBeCloseTo(22.74, 2);
  });
  it("agrees with the metric formula", () => {
    // The imperial formula uses the standard rounded 703 constant, so it
    // tracks the metric result to ~2 decimals rather than exactly.
    const metric = bmiMetric(70, 175);
    const imperial = bmiImperial(kgToLb(70), 175 / 2.54);
    expect(imperial).toBeCloseTo(metric, 2);
  });
});

describe("bmiCategory", () => {
  it("maps the WHO bands", () => {
    expect(bmiCategory(17)).toBe("underweight");
    expect(bmiCategory(22)).toBe("normal");
    expect(bmiCategory(27)).toBe("overweight");
    expect(bmiCategory(31)).toBe("obese");
  });
  it("uses correct boundaries", () => {
    expect(bmiCategory(18.5)).toBe("normal");
    expect(bmiCategory(25)).toBe("overweight");
    expect(bmiCategory(30)).toBe("obese");
  });
  it("returns null for invalid BMI", () => {
    expect(bmiCategory(0)).toBeNull();
    expect(bmiCategory(Number.NaN)).toBeNull();
  });
});

describe("healthyWeightKg", () => {
  it("returns the 18.5–24.9 range in kg", () => {
    const range = healthyWeightKg(175)!;
    expect(range.min).toBeCloseTo(56.66, 1);
    expect(range.max).toBeCloseTo(76.26, 1);
  });
  it("returns null for invalid height", () => {
    expect(healthyWeightKg(0)).toBeNull();
  });
});

describe("conversions", () => {
  it("converts feet and inches to inches", () => {
    expect(feetInchesToInches(5, 9)).toBe(69);
  });
  it("round-trips kg and lb", () => {
    expect(kgToLb(lbToKg(154))).toBeCloseTo(154, 6);
  });
});
