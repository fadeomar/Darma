import { describe, expect, it } from "vitest";
import { CATEGORIES, convertTemperature, convertValue, formatResult, getCategory } from "./convert";

describe("convertValue (linear categories)", () => {
  it("converts length units", () => {
    expect(convertValue("length", 1, "m", "cm")).toBeCloseTo(100, 9);
    expect(convertValue("length", 1, "km", "m")).toBeCloseTo(1000, 9);
    expect(convertValue("length", 1, "mi", "km")).toBeCloseTo(1.609344, 6);
    expect(convertValue("length", 12, "in", "ft")).toBeCloseTo(1, 9);
  });

  it("converts mass units", () => {
    expect(convertValue("mass", 1, "kg", "g")).toBeCloseTo(1000, 9);
    expect(convertValue("mass", 1, "lb", "oz")).toBeCloseTo(16, 6);
  });

  it("converts digital storage (decimal vs binary)", () => {
    expect(convertValue("digital", 1, "MB", "KB")).toBeCloseTo(1000, 9);
    expect(convertValue("digital", 1, "KiB", "B")).toBeCloseTo(1024, 9);
    expect(convertValue("digital", 1, "B", "bit")).toBeCloseTo(8, 9);
  });

  it("converts time units", () => {
    expect(convertValue("time", 1, "h", "min")).toBeCloseTo(60, 9);
    expect(convertValue("time", 1, "day", "h")).toBeCloseTo(24, 9);
  });

  it("returns the same value for identical units", () => {
    expect(convertValue("speed", 42, "mph", "mph")).toBeCloseTo(42, 9);
  });

  it("returns NaN for unknown categories or units", () => {
    expect(convertValue("nope", 1, "m", "cm")).toBeNaN();
    expect(convertValue("length", 1, "m", "lightyear")).toBeNaN();
  });
});

describe("convertTemperature", () => {
  it("converts between Celsius, Fahrenheit, and Kelvin", () => {
    expect(convertTemperature(0, "c", "f")).toBeCloseTo(32, 9);
    expect(convertTemperature(100, "c", "f")).toBeCloseTo(212, 9);
    expect(convertTemperature(32, "f", "c")).toBeCloseTo(0, 9);
    expect(convertTemperature(0, "c", "k")).toBeCloseTo(273.15, 9);
    expect(convertTemperature(-40, "c", "f")).toBeCloseTo(-40, 9);
  });

  it("is reachable via convertValue", () => {
    expect(convertValue("temperature", 25, "c", "f")).toBeCloseTo(77, 9);
  });
});

describe("formatResult", () => {
  it("trims trailing noise and groups thousands", () => {
    expect(formatResult(1000)).toBe("1,000");
    expect(formatResult(0)).toBe("0");
    expect(formatResult(1.5)).toBe("1.5");
  });

  it("uses exponential form at extremes", () => {
    expect(formatResult(1e20)).toMatch(/e\+/);
    expect(formatResult(1e-9)).toMatch(/e-/);
  });

  it("renders a dash for non-finite values", () => {
    expect(formatResult(NaN)).toBe("—");
    expect(formatResult(Infinity)).toBe("—");
  });
});

describe("CATEGORIES integrity", () => {
  it("has unique unit ids within every category", () => {
    for (const category of CATEGORIES) {
      const ids = category.units.map((unit) => unit.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("exposes a base unit (factor 1) per linear category", () => {
    for (const category of CATEGORIES) {
      if (category.id === "temperature") continue;
      expect(category.units.some((unit) => unit.factor === 1)).toBe(true);
    }
  });

  it("resolves categories by id", () => {
    expect(getCategory("length")?.label).toBe("Length");
    expect(getCategory("missing")).toBeUndefined();
  });
});
