import { describe, expect, it } from "vitest";
import { gcd, heightFromWidth, roundDimension, simplifyRatio, widthFromHeight } from "./aspect";

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
    expect(simplifyRatio(1920, 1080)).toMatchObject({ w: 16, h: 9, label: "16:9" });
    expect(simplifyRatio(1080, 1920)).toMatchObject({ w: 9, h: 16, label: "9:16" });
    expect(simplifyRatio(800, 600)).toMatchObject({ w: 4, h: 3, label: "4:3" });
    expect(simplifyRatio(500, 500)).toMatchObject({ w: 1, h: 1, label: "1:1" });
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

describe("roundDimension", () => {
  it("rounds to two decimals", () => {
    expect(roundDimension(1080.005)).toBeCloseTo(1080.01, 2);
    expect(roundDimension(Number.NaN)).toBeNaN();
  });
});
