import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  formatRgb,
  formatHsl,
  parseColorInput,
} from "./color";

// ─── hexToRgb ─────────────────────────────────────────────────────────────────

describe("hexToRgb", () => {
  it("parses a 6-digit hex color", () => {
    expect(hexToRgb("#3b82f6")).toEqual({ r: 59, g: 130, b: 246 });
  });

  it("parses without leading #", () => {
    expect(hexToRgb("3b82f6")).toEqual({ r: 59, g: 130, b: 246 });
  });

  it("parses a 3-digit shorthand hex", () => {
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("#f00")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("is case-insensitive", () => {
    expect(hexToRgb("#3B82F6")).toEqual({ r: 59, g: 130, b: 246 });
  });

  it("returns null for invalid hex", () => {
    expect(hexToRgb("#gg0000")).toBeNull();
    expect(hexToRgb("not-a-color")).toBeNull();
    expect(hexToRgb("#12345")).toBeNull();
  });
});

// ─── rgbToHex ─────────────────────────────────────────────────────────────────

describe("rgbToHex", () => {
  it("converts pure red to #ff0000", () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe("#ff0000");
  });

  it("converts white to #ffffff", () => {
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe("#ffffff");
  });

  it("converts black to #000000", () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000");
  });

  it("produces lowercase hex string", () => {
    expect(rgbToHex({ r: 59, g: 130, b: 246 })).toBe("#3b82f6");
  });

  it("round-trips with hexToRgb", () => {
    const rgb = hexToRgb("#3b82f6")!;
    expect(rgbToHex(rgb)).toBe("#3b82f6");
  });
});

// ─── rgbToHsl ─────────────────────────────────────────────────────────────────

describe("rgbToHsl", () => {
  it("converts pure red", () => {
    const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  it("converts white", () => {
    const hsl = rgbToHsl({ r: 255, g: 255, b: 255 });
    expect(hsl.l).toBe(100);
    expect(hsl.s).toBe(0);
  });

  it("converts black", () => {
    const hsl = rgbToHsl({ r: 0, g: 0, b: 0 });
    expect(hsl.l).toBe(0);
    expect(hsl.s).toBe(0);
  });

  it("converts pure green", () => {
    const hsl = rgbToHsl({ r: 0, g: 255, b: 0 });
    expect(hsl.h).toBe(120);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  it("converts pure blue", () => {
    const hsl = rgbToHsl({ r: 0, g: 0, b: 255 });
    expect(hsl.h).toBe(240);
  });
});

// ─── hslToRgb ─────────────────────────────────────────────────────────────────

describe("hslToRgb", () => {
  it("converts pure red", () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("converts pure green", () => {
    expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 });
  });

  it("converts white", () => {
    expect(hslToRgb({ h: 0, s: 0, l: 100 })).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("converts black", () => {
    expect(hslToRgb({ h: 0, s: 0, l: 0 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("handles hue wrapping (360 = 0)", () => {
    const at0 = hslToRgb({ h: 0, s: 100, l: 50 });
    const at360 = hslToRgb({ h: 360, s: 100, l: 50 });
    expect(at360).toEqual(at0);
  });

  it("round-trips with rgbToHsl", () => {
    const original = { r: 59, g: 130, b: 246 };
    const hsl = rgbToHsl(original);
    const back = hslToRgb(hsl);
    // Allow ±1 rounding error
    expect(Math.abs(back.r - original.r)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.g - original.g)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.b - original.b)).toBeLessThanOrEqual(1);
  });
});

// ─── formatRgb / formatHsl ────────────────────────────────────────────────────

describe("formatRgb", () => {
  it("formats as css rgb() string", () => {
    expect(formatRgb({ r: 59, g: 130, b: 246 })).toBe("rgb(59, 130, 246)");
  });
});

describe("formatHsl", () => {
  it("formats as css hsl() string", () => {
    expect(formatHsl({ h: 217, s: 91, l: 60 })).toBe("hsl(217, 91%, 60%)");
  });
});

// ─── parseColorInput ──────────────────────────────────────────────────────────

describe("parseColorInput", () => {
  it("returns error for empty string", () => {
    const result = parseColorInput("");
    expect(result.ok).toBe(false);
  });

  it("returns error for whitespace-only string", () => {
    const result = parseColorInput("   ");
    expect(result.ok).toBe(false);
  });

  it("returns error for unrecognised input", () => {
    const result = parseColorInput("not-a-color");
    expect(result.ok).toBe(false);
  });

  it("parses a 6-digit hex and detects format", () => {
    const result = parseColorInput("#3b82f6");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.detectedFormat).toBe("hex");
      expect(result.hex).toBe("#3b82f6");
      expect(result.rgb).toEqual({ r: 59, g: 130, b: 246 });
    }
  });

  it("parses a 3-digit shorthand hex", () => {
    const result = parseColorInput("#fff");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hex).toBe("#ffffff");
    }
  });

  it("parses an rgb() input", () => {
    const result = parseColorInput("rgb(59, 130, 246)");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.detectedFormat).toBe("rgb");
      expect(result.hex).toBe("#3b82f6");
    }
  });

  it("parses an hsl() input", () => {
    const result = parseColorInput("hsl(0, 100%, 50%)");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.detectedFormat).toBe("hsl");
      expect(result.rgb).toEqual({ r: 255, g: 0, b: 0 });
    }
  });

  it("includes cssRgb and cssHsl in result", () => {
    const result = parseColorInput("#ff0000");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.cssRgb).toBe("rgb(255, 0, 0)");
      expect(result.cssHsl).toBe("hsl(0, 100%, 50%)");
    }
  });

  it("bestTextColor is #ffffff for dark background", () => {
    const result = parseColorInput("#000000");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bestTextColor).toBe("#ffffff");
    }
  });

  it("bestTextColor is #000000 for light background", () => {
    const result = parseColorInput("#ffffff");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bestTextColor).toBe("#000000");
    }
  });

  it("returns contrast ratios with black and white", () => {
    const result = parseColorInput("#3b82f6");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contrastWithBlack).toBeGreaterThan(1);
      expect(result.contrastWithWhite).toBeGreaterThan(1);
    }
  });

  it("returns 7 shades", () => {
    const result = parseColorInput("#3b82f6");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.shades).toHaveLength(7);
      expect(result.shades[3].label).toBe("Base");
    }
  });
});
