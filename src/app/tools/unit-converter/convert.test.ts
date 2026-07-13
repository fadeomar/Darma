import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  buildAllConversions,
  buildBatchCsv,
  buildChecks,
  buildConversionsCsv,
  buildJavaScriptSnippet,
  computeConversion,
  convertTemperature,
  convertValue,
  findUnit,
  formatResult,
  getCategory,
  parseBatchInput,
} from "./convert";

const autoFormat = { mode: "auto" as const, precision: 6, useGrouping: true };

describe("convertValue", () => {
  it("converts length, mass, speed, area, and time units", () => {
    expect(convertValue("length", 1, "mi", "km")).toBeCloseTo(1.609344, 9);
    expect(convertValue("mass", 1, "lb", "oz")).toBeCloseTo(16, 9);
    expect(convertValue("speed", 100, "kmh", "mph")).toBeCloseTo(62.137119, 5);
    expect(convertValue("area", 1, "ac", "m2")).toBeCloseTo(4046.8564224, 6);
    expect(convertValue("time", 1, "week", "h")).toBeCloseTo(168, 9);
  });

  it("keeps SI decimal and IEC binary storage distinct", () => {
    expect(convertValue("digital", 1, "MB", "B")).toBe(1_000_000);
    expect(convertValue("digital", 1, "MiB", "B")).toBe(1_048_576);
    expect(convertValue("digital", 1, "B", "bit")).toBe(8);
  });

  it("returns NaN for unknown categories, units, or non-finite input", () => {
    expect(convertValue("nope", 1, "m", "cm")).toBeNaN();
    expect(convertValue("length", 1, "m", "lightyear")).toBeNaN();
    expect(convertValue("length", Number.POSITIVE_INFINITY, "m", "cm")).toBeNaN();
    expect(convertTemperature(10, "nope", "c")).toBeNaN();
  });
});

describe("conversion consistency", () => {
  it("round-trips every supported unit pair", () => {
    for (const category of CATEGORIES) {
      for (const from of category.units) {
        for (const to of category.units) {
          const input = category.id === "temperature" ? 25 : 123.456;
          const converted = convertValue(category.id, input, from.id, to.id);
          const restored = convertValue(category.id, converted, to.id, from.id);
          expect(restored).toBeCloseTo(input, 7);
        }
      }
    }
  });
});

describe("temperature conversion", () => {
  it("converts all supported temperature pairs", () => {
    expect(convertTemperature(0, "c", "f")).toBeCloseTo(32, 9);
    expect(convertTemperature(100, "c", "k")).toBeCloseTo(373.15, 9);
    expect(convertTemperature(32, "f", "c")).toBeCloseTo(0, 9);
    expect(convertTemperature(212, "f", "k")).toBeCloseTo(373.15, 9);
    expect(convertTemperature(273.15, "k", "c")).toBeCloseTo(0, 9);
    expect(convertTemperature(273.15, "k", "f")).toBeCloseTo(32, 9);
  });

  it("uses direct formulas in the conversion outcome", () => {
    const result = computeConversion({ categoryId: "temperature", value: 180, fromId: "c", toId: "f" });
    expect(result.valid).toBe(true);
    expect(result.outputValue).toBeCloseTo(356, 9);
    expect(result.formula).toContain("9");
    expect(result.substitutedFormula).toContain("180");
  });
});

describe("unit metadata and lookup", () => {
  it("has unique category and unit ids", () => {
    expect(new Set(CATEGORIES.map((category) => category.id)).size).toBe(CATEGORIES.length);
    for (const category of CATEGORIES) {
      expect(new Set(category.units.map((unit) => unit.id)).size).toBe(category.units.length);
      expect(category.units.some((unit) => unit.id === category.baseUnitId)).toBe(true);
    }
  });

  it("finds units by id, symbol, name, and aliases", () => {
    const length = getCategory("length")!;
    expect(findUnit(length, "km")?.id).toBe("km");
    expect(findUnit(length, "kilometres")?.id).toBe("km");
    expect(findUnit(length, "feet")?.id).toBe("ft");
    expect(findUnit(length, "unknown")).toBeUndefined();
  });
});

describe("computeConversion", () => {
  it("returns factor, formula, and steps for linear conversions", () => {
    const result = computeConversion({ categoryId: "length", value: 3.5, fromId: "m", toId: "ft" });
    expect(result.valid).toBe(true);
    expect(result.outputValue).toBeCloseTo(11.4829396, 6);
    expect(result.factor).toBeCloseTo(3.280839895, 8);
    expect(result.steps).toHaveLength(2);
    expect(result.substitutedFormula).toContain("3.5");
  });

  it("returns a useful error for invalid requests", () => {
    expect(computeConversion({ categoryId: "none", value: 1, fromId: "m", toId: "ft" }).error).toMatch(/category/i);
    expect(computeConversion({ categoryId: "length", value: Number.NaN, fromId: "m", toId: "ft" }).error).toMatch(/finite/i);
  });
});

describe("formatResult", () => {
  it("supports auto, fixed, significant, and scientific output", () => {
    expect(formatResult(1234.56789, autoFormat)).toBe("1,234.56789");
    expect(formatResult(1.5, { mode: "fixed", precision: 2, useGrouping: false })).toBe("1.50");
    expect(formatResult(1234.567, { mode: "significant", precision: 4, useGrouping: false })).toBe("1235");
    expect(formatResult(0.00123, { mode: "scientific", precision: 2, useGrouping: false })).toBe("1.23e-3");
  });

  it("handles zero and non-finite values", () => {
    expect(formatResult(-0, autoFormat)).toBe("0");
    expect(formatResult(Number.NaN, autoFormat)).toBe("—");
  });
});

describe("batch parsing", () => {
  it("uses the selected source unit when a row contains only a number", () => {
    const rows = parseBatchInput("1\n2.5", "length", "m", "ft");
    expect(rows).toHaveLength(2);
    expect(rows[0].fromUnitId).toBe("m");
    expect(rows[0].outputValue).toBeCloseTo(3.280839895, 8);
  });

  it("accepts explicit unit aliases per row", () => {
    const rows = parseBatchInput("1 km\n5280 feet\n12 in", "length", "m", "mi");
    expect(rows.every((row) => row.error === null)).toBe(true);
    expect(rows[0].outputValue).toBeCloseTo(0.621371192, 8);
    expect(rows[1].outputValue).toBeCloseTo(1, 8);
    expect(rows[2].outputValue).toBeCloseTo(0.000189394, 8);
  });

  it("keeps invalid rows with a clear error", () => {
    const rows = parseBatchInput("4 m\nhello\n5 parsecs", "length", "m", "ft");
    expect(rows).toHaveLength(3);
    expect(rows[0].error).toBeNull();
    expect(rows[1].error).toMatch(/number/i);
    expect(rows[2].error).toMatch(/unknown/i);
  });
});

describe("production checks", () => {
  it("flags temperatures below absolute zero", () => {
    const outcome = computeConversion({ categoryId: "temperature", value: -500, fromId: "c", toId: "f" });
    expect(buildChecks(outcome).some((check) => check.id === "absolute-zero" && check.level === "danger")).toBe(true);
  });

  it("warns when mixing decimal and binary storage units", () => {
    const outcome = computeConversion({ categoryId: "digital", value: 500, fromId: "MB", toId: "MiB" });
    expect(buildChecks(outcome).some((check) => check.id === "digital-system")).toBe(true);
  });

  it("reports invalid batch rows", () => {
    const outcome = computeConversion({ categoryId: "length", value: 1, fromId: "m", toId: "ft" });
    const batch = parseBatchInput("1\nbad", "length", "m", "ft");
    expect(buildChecks(outcome, batch).some((check) => check.id === "batch-errors")).toBe(true);
  });
});

describe("exports", () => {
  it("builds all-unit and batch CSV files", () => {
    const request = { categoryId: "length", value: 1, fromId: "m", toId: "ft" };
    const allCsv = buildConversionsCsv(request, autoFormat);
    expect(allCsv).toContain("Meter");
    expect(allCsv).toContain("Foot");

    const batch = parseBatchInput("1\n2", "length", "m", "ft");
    expect(buildBatchCsv(batch, autoFormat)).toContain("line,input,source_unit");
  });

  it("builds every-unit conversions", () => {
    const rows = buildAllConversions({ categoryId: "mass", value: 1, fromId: "kg", toId: "lb" });
    expect(rows).toHaveLength(getCategory("mass")!.units.length);
    expect(rows.find((row) => row.unit.id === "g")?.value).toBeCloseTo(1000, 9);
  });

  it("generates valid-looking JavaScript helpers", () => {
    const linear = buildJavaScriptSnippet({ categoryId: "length", value: 1, fromId: "m", toId: "ft" });
    const temperature = buildJavaScriptSnippet({ categoryId: "temperature", value: 1, fromId: "c", toId: "f" });
    expect(linear).toContain("FACTOR");
    expect(temperature).toContain("return (value * 9) / 5 + 32");
  });
});
