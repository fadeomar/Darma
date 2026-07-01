import { describe, expect, it } from "vitest";
import {
  bmiCategory,
  bmiImperial,
  bmiMetric,
  cmToInches,
  feetInchesToInches,
  formatWeightDelta,
  healthyWeightKg,
  healthyWeightLb,
  historyToCsv,
  kgToLb,
  lbToKg,
  targetBmi,
  validateMeasurementRange,
  waistToHeightCategory,
  waistToHeightRatio,
  weightDeltaToHealthyRange,
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
    expect(bmiImperial(154, 69)).toBeCloseTo(22.74, 2);
  });
  it("agrees with the metric formula", () => {
    const metric = bmiMetric(70, 175);
    const imperial = bmiImperial(kgToLb(70), cmToInches(175));
    expect(imperial).toBeCloseTo(metric, 2);
  });
});

describe("bmiCategory", () => {
  it("maps the adult bands", () => {
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

describe("healthy ranges", () => {
  it("returns the 18.5–24.9 range in kg", () => {
    const range = healthyWeightKg(175)!;
    expect(range.min).toBeCloseTo(56.66, 1);
    expect(range.max).toBeCloseTo(76.26, 1);
  });
  it("returns the range in pounds", () => {
    const range = healthyWeightLb(69)!;
    expect(range.min).toBeGreaterThan(120);
    expect(range.max).toBeLessThan(170);
  });
  it("computes delta to healthy range", () => {
    expect(weightDeltaToHealthyRange(70, 175)?.direction).toBe("inside");
    expect(weightDeltaToHealthyRange(50, 175)?.direction).toBe("below");
    expect(weightDeltaToHealthyRange(90, 175)?.direction).toBe("above");
    expect(formatWeightDelta(weightDeltaToHealthyRange(90, 175), "metric")).toContain("above");
  });
});

describe("waist and target helpers", () => {
  it("calculates waist-to-height ratio", () => {
    expect(waistToHeightRatio(84, 175)).toBeCloseTo(0.48, 2);
    expect(waistToHeightCategory(0.48)).toBe("healthy");
    expect(waistToHeightCategory(0.53)).toBe("increased");
    expect(waistToHeightCategory(0.62)).toBe("high");
  });
  it("calculates target BMI", () => {
    expect(targetBmi(76, 175)).toBeCloseTo(24.82, 2);
  });
});

describe("validation and exports", () => {
  it("flags unusual ranges", () => {
    expect(validateMeasurementRange({ weightKg: 10, heightCm: 300, waistCm: 10, age: 16 })).toHaveLength(4);
  });
  it("exports CSV", () => {
    const csv = historyToCsv([
      {
        id: "1",
        createdAt: "2026-07-01T00:00:00.000Z",
        system: "metric",
        bmi: 22.8,
        category: "normal",
        weight: 70,
        weightUnit: "kg",
        heightCm: 175,
        waistToHeightRatio: 0.48,
        targetBmi: 23,
      },
    ]);
    expect(csv).toContain("date,unit_system,bmi");
    expect(csv).toContain("normal");
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
