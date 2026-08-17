import { describe, expect, it } from "vitest";
import {
  buildFilterString,
  buildTransformString,
  clampFilterState,
  createDefaultFilterState,
  createDefaultOrientation,
  formatControlValue,
  FILTER_CONTROLS,
  generateFilterCss,
  hasAdvancedAdjustments,
  isNeutral,
  validateFilters,
} from "./filters";
import { FILTER_PRESETS, getFilterPreset, mixPresetFilters } from "./presets";
import { createDefaultCrop, getCropPixels, getNaturalOutputDimensions, resolveCrop } from "./render";

describe("buildFilterString", () => {
  it("returns none for the default state", () => {
    expect(buildFilterString(createDefaultFilterState())).toBe("none");
  });
  it("only includes non-default CSS-compatible filters", () => {
    const state = { ...createDefaultFilterState(), grayscale: 1, brightness: 1.2, exposure: 1 };
    expect(buildFilterString(state)).toBe("brightness(1.2) grayscale(1)");
  });
  it("formats hue-rotate and blur with units", () => {
    const state = { ...createDefaultFilterState(), hueRotate: 90, blur: 3 };
    expect(buildFilterString(state)).toBe("hue-rotate(90deg) blur(3px)");
  });
});

describe("clampFilterState", () => {
  it("clamps values into their control ranges", () => {
    const state = { ...createDefaultFilterState(), brightness: 9, blur: -5, saturate: 100, temperature: 900 };
    const clamped = clampFilterState(state);
    expect(clamped.brightness).toBe(1.5);
    expect(clamped.blur).toBe(0);
    expect(clamped.saturate).toBe(2.2);
    expect(clamped.temperature).toBe(100);
  });
  it("replaces non-finite values with the control minimum", () => {
    const clamped = clampFilterState({ ...createDefaultFilterState(), contrast: Number.NaN });
    expect(clamped.contrast).toBe(0.5);
  });
});

describe("buildTransformString", () => {
  it("returns none for default orientation", () => {
    expect(buildTransformString(createDefaultOrientation())).toBe("none");
  });
  it("combines rotate and flips", () => {
    expect(buildTransformString({ rotate: 90, flipH: true, flipV: false })).toBe("rotate(90deg) scaleX(-1)");
  });
});

describe("generateFilterCss", () => {
  it("sanitizes the class name", () => {
    const css = generateFilterCss({ ...createDefaultFilterState(), sepia: 1 }, "My Photo!");
    expect(css).toContain(".My-Photo- {");
    expect(css).toContain("filter: sepia(1);");
  });
});

describe("formatControlValue", () => {
  it("formats percent, signed percent, degree, px, and EV controls", () => {
    const brightness = FILTER_CONTROLS.find((c) => c.key === "brightness")!;
    const highlights = FILTER_CONTROLS.find((c) => c.key === "highlights")!;
    const hue = FILTER_CONTROLS.find((c) => c.key === "hueRotate")!;
    const blur = FILTER_CONTROLS.find((c) => c.key === "blur")!;
    const exposure = FILTER_CONTROLS.find((c) => c.key === "exposure")!;
    expect(formatControlValue(brightness, 1)).toBe("100%");
    expect(formatControlValue(highlights, 12)).toBe("+12");
    expect(formatControlValue(hue, 90)).toBe("90°");
    expect(formatControlValue(blur, 3)).toBe("3px");
    expect(formatControlValue(exposure, 0.5)).toBe("+0.5 EV");
  });
});

describe("advanced adjustments", () => {
  it("detects canvas-only adjustments", () => {
    expect(hasAdvancedAdjustments(createDefaultFilterState())).toBe(false);
    expect(hasAdvancedAdjustments({ ...createDefaultFilterState(), temperature: 20 })).toBe(true);
  });
});

describe("isNeutral", () => {
  it("detects the untouched state including advanced adjustments", () => {
    expect(isNeutral(createDefaultFilterState())).toBe(true);
    expect(isNeutral({ ...createDefaultFilterState(), invert: 1 })).toBe(false);
    expect(isNeutral({ ...createDefaultFilterState(), grain: 0.2 })).toBe(false);
  });
});

describe("validateFilters", () => {
  it("prompts for an image when none is loaded", () => {
    expect(validateFilters(createDefaultFilterState(), false)[0].message).toContain("Upload");
  });
  it("warns on heavy blur or grain", () => {
    const messages = validateFilters({ ...createDefaultFilterState(), blur: 18 }, true);
    expect(messages.some((m) => m.type === "warning")).toBe(true);
  });
  it("always states processing is local", () => {
    const messages = validateFilters(createDefaultFilterState(), true);
    expect(messages.some((m) => m.message.includes("never leaves the browser"))).toBe(true);
  });
});

describe("presets", () => {
  it("every preset resolves and produces a filter string", () => {
    FILTER_PRESETS.forEach((preset) => {
      expect(getFilterPreset(preset.id)).toBeDefined();
      expect(typeof buildFilterString(preset.filters)).toBe("string");
      expect(preset.category).toBeTruthy();
    });
  });
  it("original preset is neutral", () => {
    expect(isNeutral(getFilterPreset("original")!.filters)).toBe(true);
  });
  it("mixes preset intensity from neutral to full strength", () => {
    const preset = getFilterPreset("noir")!;
    expect(isNeutral(mixPresetFilters(preset.filters, 0))).toBe(true);
    expect(mixPresetFilters(preset.filters, 1)).toEqual(preset.filters);
  });
});

describe("crop geometry", () => {
  it("keeps original crop at full size", () => {
    expect(getCropPixels(createDefaultCrop(), 1600, 900)).toEqual({ x: 0, y: 0, width: 1600, height: 900 });
  });
  it("creates a centered square crop", () => {
    const crop = resolveCrop({ ...createDefaultCrop(), ratioId: "1:1" }, 1600, 900);
    expect(crop.width).toBeCloseTo(900 / 1600, 5);
    expect(crop.height).toBe(1);
    expect(getCropPixels(crop, 1600, 900)).toEqual({ x: 350, y: 0, width: 900, height: 900 });
  });
  it("swaps output dimensions after a quarter rotation", () => {
    const crop = resolveCrop({ ...createDefaultCrop(), ratioId: "16:9" }, 1200, 1200);
    const dims = getNaturalOutputDimensions(1200, 1200, crop, { rotate: 90, flipH: false, flipV: false });
    expect(dims.width).toBeLessThan(dims.height);
  });
});

import { composeFilterLayers, createDefaultAdvancedState } from "./advanced";
import { parseCubeLut, sampleCubeLut } from "./lut";

describe("advanced look stack", () => {
  it("blends a stacked look relative to neutral values", () => {
    const base = createDefaultFilterState();
    const look = { ...base, contrast: 1.2, temperature: 20 };
    const result = composeFilterLayers(base, [{ id: "film", name: "Film", filters: look, intensity: 0.5, enabled: true }]);
    expect(result.contrast).toBeCloseTo(1.1, 5);
    expect(result.temperature).toBe(10);
  });

  it("creates neutral HSL, curves, layers, and overlay state", () => {
    const advanced = createDefaultAdvancedState();
    expect(advanced.layers).toEqual([]);
    expect(advanced.overlay.type).toBe("none");
    expect(advanced.curves.rgb).toEqual([0, 64, 128, 192, 255]);
    expect(advanced.hsl.blue.saturation).toBe(0);
  });
});

describe(".cube LUT support", () => {
  it("parses and samples an identity 2x2x2 3D LUT", () => {
    const lut = parseCubeLut(`TITLE "Identity 2"\nLUT_3D_SIZE 2\n0 0 0\n1 0 0\n0 1 0\n1 1 0\n0 0 1\n1 0 1\n0 1 1\n1 1 1\n`);
    expect(lut.title).toBe("Identity 2");
    expect(lut.size).toBe(2);
    const sampled = sampleCubeLut(lut, 0.25, 0.5, 0.75);
    expect(sampled[0]).toBeCloseTo(0.25, 5);
    expect(sampled[1]).toBeCloseTo(0.5, 5);
    expect(sampled[2]).toBeCloseTo(0.75, 5);
  });

  it("rejects incomplete LUT data", () => {
    expect(() => parseCubeLut("LUT_3D_SIZE 2\n0 0 0\n1 1 1\n")).toThrow(/Incomplete 3D LUT/);
  });
});
