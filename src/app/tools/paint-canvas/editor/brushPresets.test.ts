import { describe, expect, it } from "vitest";
import { createDefaultSettings } from "../draw";
import { BRUSH_PRESETS, getBrushPreset, getBrushStrokeOptions } from "./brushPresets";

describe("paint brush presets", () => {
  it("ships distinct presets with safe defaults", () => {
    expect(BRUSH_PRESETS.map((preset) => preset.id)).toEqual(["pen", "fineliner", "marker", "brush"]);
    expect(getBrushPreset("fineliner").thinning).toBe(0);
    expect(getBrushPreset("brush").thinning).toBeGreaterThan(getBrushPreset("marker").thinning);
  });

  it("uses real pen pressure when available", () => {
    const settings = { ...createDefaultSettings(), brushPreset: "brush" as const, dynamicWidth: true };
    expect(getBrushStrokeOptions(settings, true).simulatePressure).toBe(false);
    expect(getBrushStrokeOptions(settings, false).simulatePressure).toBe(true);
  });

  it("turns pressure dynamics off without changing smoothing", () => {
    const settings = { ...createDefaultSettings(), dynamicWidth: false };
    const options = getBrushStrokeOptions(settings, true);
    expect(options.thinning).toBe(0);
    expect(options.simulatePressure).toBe(false);
    expect(options.smoothing).toBeGreaterThan(0);
  });
});
