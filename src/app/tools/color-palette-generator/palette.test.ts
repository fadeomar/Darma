import { describe, expect, it } from "vitest";
import {
  createPaletteColor,
  exportGradientSuggestion,
  exportPaletteCssVariables,
  exportPaletteTailwindObject,
  getContrastRatio,
  getWcagRating,
  hexToHsl,
  hexToRgb,
  hslToHex,
  rgbToHex,
} from "./palette";

describe("color conversion helpers", () => {
  it("converts hex to rgb", () => {
    expect(hexToRgb("#2563EB")).toEqual({ r: 37, g: 99, b: 235 });
  });

  it("converts rgb to hex", () => {
    expect(rgbToHex(37, 99, 235)).toBe("#2563EB");
  });

  it("round-trips hsl and hex for a basic color", () => {
    const hsl = hexToHsl("#FF0000");
    expect(Math.round(hsl.h)).toBe(0);
    expect(Math.round(hsl.s)).toBe(100);
    expect(Math.round(hsl.l)).toBe(50);
    expect(hslToHex(hsl.h, hsl.s, hsl.l)).toBe("#FF0000");
  });
});

describe("contrast helpers", () => {
  it("calculates readable contrast ratios", () => {
    expect(getContrastRatio("#000000", "#FFFFFF")).toBe(21);
    expect(getWcagRating(21)).toBe("AAA");
    expect(getWcagRating(4.5)).toBe("AA");
    expect(getWcagRating(3)).toBe("Fail");
  });
});

describe("token export helpers", () => {
  const colors = ["#F8FAFC", "#DBEAFE", "#2563EB"].map((color, index) => createPaletteColor(color, index));

  it("exports CSS variables with numeric and semantic names", () => {
    const css = exportPaletteCssVariables(colors);
    expect(css).toContain(":root");
    expect(css).toContain("--color-palette-1: #F8FAFC;");
    expect(css).toContain("--color-primary: #2563EB;");
  });

  it("exports Tailwind-style tokens", () => {
    const tailwind = exportPaletteTailwindObject(colors);
    expect(tailwind).toContain("colors:");
    expect(tailwind).toContain('"primary": "#2563EB"');
  });

  it("exports a gradient suggestion", () => {
    expect(exportGradientSuggestion(colors)).toBe("linear-gradient(135deg, #2563EB 0%, #2563EB 100%)");
  });
});
