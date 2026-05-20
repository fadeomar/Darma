import { describe, it, expect } from "vitest";
import { generateShadowStyle } from "./generateShadowStyle";
import type { BoxShadowState } from "@/types";
import type { Shadow } from "@/types";

function shadow(overrides: Partial<Shadow> = {}): Shadow {
  return {
    id: "s1",
    offsetX: 0,
    offsetY: 0,
    blur: 10,
    spread: 0,
    opacity: 0.5,
    color: "#000000",
    inset: false,
    distance: 5,
    ...overrides,
  };
}

function state(overrides: Partial<BoxShadowState> = {}): BoxShadowState {
  return {
    shadows: [shadow()],
    boxSize: 200,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    activeLightSource: 1,
    ...overrides,
  };
}

// ─── CSS structure ────────────────────────────────────────────────────────────

describe("generateShadowStyle – CSS structure", () => {
  it("returns a string containing .box-shadow-preview selector", () => {
    const css = generateShadowStyle(state());
    expect(css).toContain(".box-shadow-preview");
  });

  it("includes width from boxSize", () => {
    const css = generateShadowStyle(state({ boxSize: 300 }));
    expect(css).toContain("width: 300px");
  });

  it("includes height from boxSize", () => {
    const css = generateShadowStyle(state({ boxSize: 300 }));
    expect(css).toContain("height: 300px");
  });

  it("includes border-radius", () => {
    const css = generateShadowStyle(state({ borderRadius: 16 }));
    expect(css).toContain("border-radius: 16px");
  });

  it("includes background-color", () => {
    const css = generateShadowStyle(state({ backgroundColor: "#f0f0f0" }));
    expect(css).toContain("background-color: #f0f0f0");
  });
});

// ─── Shadow values ────────────────────────────────────────────────────────────

describe("generateShadowStyle – shadow values", () => {
  it("applies light source 1 (top-left) negative X and Y multipliers", () => {
    // Light source 1: xMultiplier=-1, yMultiplier=-1
    // With offsetX=0, offsetY=0, distance=10 → positionX=-10, positionY=-10
    const css = generateShadowStyle(state({
      activeLightSource: 1,
      shadows: [shadow({ offsetX: 0, offsetY: 0, distance: 10, blur: 4, spread: 0 })],
    }));
    expect(css).toContain("-10px -10px 4px 0px");
  });

  it("applies light source 3 (bottom-right) positive X and Y multipliers", () => {
    // Light source 3: xMultiplier=1, yMultiplier=1
    const css = generateShadowStyle(state({
      activeLightSource: 3,
      shadows: [shadow({ offsetX: 0, offsetY: 0, distance: 10, blur: 4, spread: 0 })],
    }));
    expect(css).toContain("10px 10px 4px 0px");
  });

  it("converts hex color to rgba with correct opacity", () => {
    const css = generateShadowStyle(state({
      shadows: [shadow({ color: "#ff0000", opacity: 0.5 })],
    }));
    expect(css).toContain("rgba(255, 0, 0, 0.5)");
  });

  it("prefixes 'inset' for inset shadows", () => {
    const css = generateShadowStyle(state({
      shadows: [shadow({ inset: true })],
    }));
    expect(css).toContain("inset ");
  });

  it("does not prefix 'inset' for outset shadows", () => {
    const css = generateShadowStyle(state({
      shadows: [shadow({ inset: false })],
    }));
    const boxShadowLine = css.match(/box-shadow:[^;]+/)?.[0] ?? "";
    expect(boxShadowLine).not.toContain("inset");
  });
});

// ─── Multiple shadows ────────────────────────────────────────────────────────

describe("generateShadowStyle – multiple shadows", () => {
  it("joins multiple shadows with a comma", () => {
    const css = generateShadowStyle(state({
      shadows: [
        shadow({ id: "s1", color: "#000000" }),
        shadow({ id: "s2", color: "#0000ff" }),
      ],
    }));
    // Both rgba values should be in the box-shadow declaration
    expect(css).toContain("rgba(0, 0, 0");
    expect(css).toContain("rgba(0, 0, 255");
    // They should be comma-separated
    const match = css.match(/box-shadow:\s*([^;]+)/);
    expect(match?.[1]).toContain(",");
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe("generateShadowStyle – edge cases", () => {
  it("falls back to light source 1 for an unknown activeLightSource", () => {
    // activeLightSource 99 → falls back to lightSourceMap[1]
    const css = generateShadowStyle(state({
      activeLightSource: 99,
      shadows: [shadow({ offsetX: 0, offsetY: 0, distance: 5 })],
    }));
    // Light source 1 → x=-5, y=-5
    expect(css).toContain("-5px -5px");
  });

  it("handles zero distance (no offset from light source)", () => {
    const css = generateShadowStyle(state({
      shadows: [shadow({ offsetX: 0, offsetY: 0, distance: 0, blur: 8, spread: 0 })],
    }));
    expect(css).toContain("0px 0px 8px 0px");
  });
});
