import { describe, expect, it } from "vitest";
import { createDefaultFilterState } from "./filters";
import { normalizeCustomPhotoPreset } from "./customPresets";

describe("custom photo preset normalization", () => {
  it("fills missing nested values and clamps hostile numeric values", () => {
    const preset = normalizeCustomPhotoPreset({
      version: 1,
      name: "  Imported look  ",
      filters: { brightness: 99, exposure: Number.NaN },
      advanced: {
        hsl: { red: { hue: 999, saturation: -999 } },
        curves: { rgb: [999, -10] },
        layers: [{ name: "Layer", intensity: 9, filters: { contrast: -2 } }],
        overlay: { type: "not-real", intensity: 5 },
      },
    });

    expect(preset).not.toBeNull();
    expect(preset?.name).toBe("Imported look");
    expect(preset?.filters.brightness).toBe(2);
    expect(preset?.filters.exposure).toBe(createDefaultFilterState().exposure);
    expect(preset?.advanced.hsl.red.hue).toBe(60);
    expect(preset?.advanced.hsl.red.saturation).toBe(-100);
    expect(preset?.advanced.curves.rgb).toEqual([255, 0, 128, 192, 255]);
    expect(preset?.advanced.layers[0].intensity).toBe(1);
    expect(preset?.advanced.layers[0].filters.contrast).toBe(0);
    expect(preset?.advanced.overlay.type).toBe("none");
    expect(preset?.advanced.overlay.intensity).toBe(1);
  });

  it("rejects unsupported files instead of creating a broken editor state", () => {
    expect(normalizeCustomPhotoPreset({ version: 2, name: "Future" })).toBeNull();
    expect(normalizeCustomPhotoPreset({ version: 1 })).toBeNull();
    expect(normalizeCustomPhotoPreset(null)).toBeNull();
  });
});
