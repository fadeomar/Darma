import { describe, expect, it } from "vitest";
import { formatNumber, Point, SvgPath } from "./svg";

// ─── formatNumber ─────────────────────────────────────────────────────────────

describe("formatNumber", () => {
  it("rounds to the requested decimal places", () => {
    expect(formatNumber(1.23456, 2)).toBe("1.23");
    expect(formatNumber(1.23456, 4)).toBe("1.2346");
  });

  it("strips trailing zeros after the decimal point", () => {
    expect(formatNumber(1.5000, 4)).toBe("1.5");
    expect(formatNumber(2.0, 3)).toBe("2");
  });

  it("removes leading zero in minify mode", () => {
    expect(formatNumber(0.5, 2, true)).toBe(".5");
    expect(formatNumber(-0.5, 2, true)).toBe("-.5");
  });

  it("preserves sign for negative numbers", () => {
    expect(formatNumber(-1.5, 1)).toBe("-1.5");
  });

  it("handles integers without decimal point", () => {
    expect(formatNumber(42, 2)).toBe("42");
  });
});

// ─── SvgPath ──────────────────────────────────────────────────────────────────

describe("SvgPath", () => {
  it("parses a simple moveto + lineto path", () => {
    const svg = new SvgPath("M 10 20 L 30 40");
    expect(svg.path.length).toBe(2);
    expect(svg.path[0].getType(true)).toBe("M");
    expect(svg.path[1].getType(true)).toBe("L");
  });

  it("round-trips: parse then asString reproduces the same shape", () => {
    const input = "M10 20L30 40Z";
    const svg = new SvgPath(input);
    const output = svg.asString(0, true);
    const svg2 = new SvgPath(output);
    expect(svg2.path.length).toBe(svg.path.length);
  });

  it("parses a closed path with Z command", () => {
    const svg = new SvgPath("M0 0 L10 0 L10 10 Z");
    expect(svg.path[svg.path.length - 1].getType(true)).toBe("Z");
  });

  it("handles relative commands", () => {
    const svg = new SvgPath("m 10 20 l 5 5");
    expect(svg.path[0].getType(true)).toBe("M");
    expect(svg.path[1].getType(true)).toBe("L");
    expect(svg.path[1].relative).toBe(true);
  });

  it("target location of M command matches input coordinates", () => {
    const svg = new SvgPath("M 50 75");
    const target = svg.path[0].targetLocation();
    expect(target.x).toBe(50);
    expect(target.y).toBe(75);
  });

  it("asString respects the decimal precision argument", () => {
    const svg = new SvgPath("M 1.23456 7.89012");
    const out2 = svg.asString(2, false);
    const out4 = svg.asString(4, false);
    expect(out2).toContain("1.23");
    expect(out4).toContain("1.2346");
  });
});

// ─── Point ────────────────────────────────────────────────────────────────────

describe("Point", () => {
  it("stores x and y", () => {
    const p = new Point(3, 7);
    expect(p.x).toBe(3);
    expect(p.y).toBe(7);
  });
});
