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
  getActiveRasterAdjustments,
  isNeutral,
  validateFilters,
} from "./filters";
import { FILTER_PRESETS, findMatchingPresetId, getFilterPreset } from "./presets";

describe("adjustment model", () => {
  it("creates neutral defaults", () => {
    expect(buildFilterString(createDefaultFilterState())).toBe("none");
    expect(isNeutral(createDefaultFilterState())).toBe(true);
  });

  it("includes only non-neutral CSS filters", () => {
    const state = { ...createDefaultFilterState(), grayscale: 1, brightness: 1.2 };
    expect(buildFilterString(state)).toBe("brightness(1.2) grayscale(1)");
  });

  it("excludes raster-only adjustments from CSS", () => {
    const state = { ...createDefaultFilterState(), exposure: 1, temperature: 30, highlights: -20, shadows: 15 };
    expect(buildFilterString(state)).toBe("none");
    expect(getActiveRasterAdjustments(state)).toEqual(["exposure", "temperature", "highlights", "shadows"]);
  });

  it("clamps invalid values to safe ranges and neutral fallback", () => {
    const clamped = clampFilterState({ ...createDefaultFilterState(), brightness: 9, blur: -5, contrast: Number.NaN });
    expect(clamped.brightness).toBe(2);
    expect(clamped.blur).toBe(0);
    expect(clamped.contrast).toBe(1);
  });
});

describe("CSS output", () => {
  it("formats hue and blur with units", () => {
    expect(buildFilterString({ ...createDefaultFilterState(), hueRotate: 90, blur: 3 })).toBe("hue-rotate(90deg) blur(3px)");
  });

  it("outputs final-axis flips before rotation", () => {
    expect(buildTransformString({ rotate: 90, flipH: true, flipV: false })).toBe("scaleX(-1) rotate(90deg)");
    expect(buildTransformString(createDefaultOrientation())).toBe("none");
  });

  it("sanitizes class names", () => {
    expect(generateFilterCss({ ...createDefaultFilterState(), sepia: 1 }, "My Photo!")).toContain(".My-Photo- {");
  });
});

describe("control formatting and validation", () => {
  it("formats percent, degree, pixel, and exposure controls", () => {
    const brightness = FILTER_CONTROLS.find((control) => control.key === "brightness")!;
    const hue = FILTER_CONTROLS.find((control) => control.key === "hueRotate")!;
    const blur = FILTER_CONTROLS.find((control) => control.key === "blur")!;
    const exposure = FILTER_CONTROLS.find((control) => control.key === "exposure")!;
    expect(formatControlValue(brightness, 1)).toBe("100%");
    expect(formatControlValue(hue, 90)).toBe("90°");
    expect(formatControlValue(blur, 3)).toBe("3px");
    expect(formatControlValue(exposure, 0.5)).toBe("+0.5 EV");
  });

  it("separates image guidance from warnings", () => {
    expect(validateFilters(createDefaultFilterState(), false)[0].message).toContain("Load");
    expect(validateFilters({ ...createDefaultFilterState(), blur: 18 }, true).some((message) => message.type === "warning")).toBe(true);
  });
});

describe("presets", () => {
  it("resolves every preset and detects matching settings", () => {
    FILTER_PRESETS.forEach((preset) => {
      expect(getFilterPreset(preset.id)).toBeDefined();
      expect(findMatchingPresetId(preset.filters)).toBe(preset.id);
    });
  });

  it("manual edits become custom", () => {
    expect(findMatchingPresetId({ ...getFilterPreset("original")!.filters, exposure: 0.01 })).toBeNull();
  });
});
