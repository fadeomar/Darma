import { describe, expect, it } from "vitest";
import {
  closestPreset,
  cropToRatio,
  cssAspectRatio,
  dimensionsFromRatioAndLongEdge,
  fitWithinBounds,
  formatDimensionPair,
  gcd,
  heightFromWidth,
  paddingTopPercent,
  roundDimension,
  scaledDimensions,
  simplifyRatio,
  widthFromHeight,
} from "./aspect";

describe("gcd", () => {
  it("finds the greatest common divisor", () => {
    expect(gcd(1920, 1080)).toBe(120);
    expect(gcd(16, 9)).toBe(1);
    expect(gcd(100, 0)).toBe(100);
  });
});

describe("heightFromWidth / widthFromHeight", () => {
  it("solves the missing dimension for 16:9", () => {
    expect(heightFromWidth(16, 9, 1920)).toBeCloseTo(1080, 6);
    expect(widthFromHeight(16, 9, 1080)).toBeCloseTo(1920, 6);
  });

  it("returns NaN when a ratio side is zero or invalid", () => {
    expect(heightFromWidth(0, 9, 1920)).toBeNaN();
    expect(widthFromHeight(16, 0, 1080)).toBeNaN();
    expect(heightFromWidth(16, 9, Number.NaN)).toBeNaN();
  });
});

describe("simplifyRatio", () => {
  it("reduces common resolutions", () => {
    expect(simplifyRatio(1920, 1080)).toMatchObject({ w: 16, h: 9, label: "16:9", orientation: "landscape" });
    expect(simplifyRatio(1080, 1920)).toMatchObject({ w: 9, h: 16, label: "9:16", orientation: "portrait" });
    expect(simplifyRatio(800, 600)).toMatchObject({ w: 4, h: 3, label: "4:3" });
    expect(simplifyRatio(500, 500)).toMatchObject({ w: 1, h: 1, label: "1:1", orientation: "square" });
  });

  it("exposes the decimal ratio", () => {
    expect(simplifyRatio(1920, 1080)?.decimal).toBeCloseTo(1.7778, 3);
  });

  it("falls back to a decimal label for non-integers", () => {
    const result = simplifyRatio(16.5, 9);
    expect(result?.h).toBe(1);
    expect(result?.label).toMatch(/:1$/);
  });

  it("returns null for non-positive sizes", () => {
    expect(simplifyRatio(0, 100)).toBeNull();
    expect(simplifyRatio(100, -1)).toBeNull();
  });
});

describe("professional helpers", () => {
  it("builds dimensions from the long edge", () => {
    expect(dimensionsFromRatioAndLongEdge(16, 9, 1920)).toEqual({ width: 1920, height: 1080 });
    expect(dimensionsFromRatioAndLongEdge(9, 16, 1920)).toEqual({ width: 1080, height: 1920 });
  });

  it("fits dimensions inside or over bounds", () => {
    expect(fitWithinBounds(1920, 1080, 1000, 1000, "contain")).toMatchObject({ width: 1000, height: 562.5 });
    expect(fitWithinBounds(1920, 1080, 1000, 1000, "cover")).toMatchObject({ width: 1777.78, height: 1000 });
  });

  it("finds a centered crop for a target ratio", () => {
    expect(cropToRatio(1920, 1080, 1, 1)).toMatchObject({ width: 1080, height: 1080, cropX: 420, cropY: 0 });
    expect(cropToRatio(1080, 1920, 16, 9)).toMatchObject({ width: 1080, height: 607.5, cropY: 656.25 });
  });

  it("scales dimensions by a percentage", () => {
    expect(scaledDimensions(1920, 1080, 50)).toEqual({ width: 960, height: 540 });
  });

  it("returns CSS helpers", () => {
    expect(cssAspectRatio(16, 9)).toBe("aspect-ratio: 16 / 9;");
    expect(paddingTopPercent(16, 9)).toBeCloseTo(56.25);
  });

  it("finds the nearest preset", () => {
    expect(closestPreset(1918, 1080)?.label).toBe("16:9");
  });

  it("formats a dimension pair", () => {
    expect(formatDimensionPair(1920, 1080)).toBe("1920 × 1080 px");
  });
});

describe("roundDimension", () => {
  it("rounds to two decimals", () => {
    expect(roundDimension(1080.005)).toBeCloseTo(1080.01, 2);
    expect(roundDimension(Number.NaN)).toBeNaN();
  });
});
