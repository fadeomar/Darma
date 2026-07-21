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
  isNeutral,
  validateFilters,
} from "./filters";
import { FILTER_PRESETS, getFilterPreset } from "./presets";

describe("buildFilterString", () => {
  it("returns none for the default state", () => {
    expect(buildFilterString(createDefaultFilterState())).toBe("none");
  });
  it("only includes non-default filters", () => {
    const state = { ...createDefaultFilterState(), grayscale: 1, brightness: 1.2 };
    expect(buildFilterString(state)).toBe("brightness(1.2) grayscale(1)");
  });
  it("formats hue-rotate and blur with units", () => {
    const state = { ...createDefaultFilterState(), hueRotate: 90, blur: 3 };
    expect(buildFilterString(state)).toBe("hue-rotate(90deg) blur(3px)");
  });
});

describe("clampFilterState", () => {
  it("clamps values into their control ranges", () => {
    const state = { ...createDefaultFilterState(), brightness: 9, blur: -5, saturate: 100 };
    const clamped = clampFilterState(state);
    expect(clamped.brightness).toBe(2);
    expect(clamped.blur).toBe(0);
    expect(clamped.saturate).toBe(3);
  });
  it("replaces non-finite values with the control minimum", () => {
    const clamped = clampFilterState({ ...createDefaultFilterState(), contrast: Number.NaN });
    expect(clamped.contrast).toBe(0);
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
  it("formats percent, degree, and px controls", () => {
    const brightness = FILTER_CONTROLS.find((c) => c.key === "brightness")!;
    const hue = FILTER_CONTROLS.find((c) => c.key === "hueRotate")!;
    const blur = FILTER_CONTROLS.find((c) => c.key === "blur")!;
    expect(formatControlValue(brightness, 1)).toBe("100%");
    expect(formatControlValue(hue, 90)).toBe("90°");
    expect(formatControlValue(blur, 3)).toBe("3px");
  });
});

describe("isNeutral", () => {
  it("detects the untouched state", () => {
    expect(isNeutral(createDefaultFilterState())).toBe(true);
    expect(isNeutral({ ...createDefaultFilterState(), invert: 1 })).toBe(false);
  });
});

describe("validateFilters", () => {
  it("prompts for an image when none is loaded", () => {
    expect(validateFilters(createDefaultFilterState(), false)[0].message).toContain("Upload");
  });
  it("warns on heavy blur", () => {
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
    });
  });
  it("original preset is neutral", () => {
    expect(isNeutral(getFilterPreset("original")!.filters)).toBe(true);
  });
});
