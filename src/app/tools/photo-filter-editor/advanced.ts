import { createDefaultFilterState } from "./filters";
import type {
  AdvancedEditState,
  CurveChannel,
  CurveState,
  FilterLayer,
  FilterState,
  HslBandId,
  HslBandState,
  HslState,
} from "./types";

export const HSL_BANDS: { id: HslBandId; label: string; center: number }[] = [
  { id: "red", label: "Red", center: 0 },
  { id: "orange", label: "Orange", center: 30 },
  { id: "yellow", label: "Yellow", center: 60 },
  { id: "green", label: "Green", center: 120 },
  { id: "aqua", label: "Aqua", center: 180 },
  { id: "blue", label: "Blue", center: 240 },
  { id: "purple", label: "Purple", center: 280 },
  { id: "magenta", label: "Magenta", center: 330 },
];

export const CURVE_CHANNELS: { id: CurveChannel; label: string }[] = [
  { id: "rgb", label: "RGB" },
  { id: "red", label: "R" },
  { id: "green", label: "G" },
  { id: "blue", label: "B" },
];

export function createDefaultHslBand(): HslBandState {
  return { hue: 0, saturation: 0, lightness: 0 };
}

export function createDefaultHslState(): HslState {
  return {
    red: createDefaultHslBand(),
    orange: createDefaultHslBand(),
    yellow: createDefaultHslBand(),
    green: createDefaultHslBand(),
    aqua: createDefaultHslBand(),
    blue: createDefaultHslBand(),
    purple: createDefaultHslBand(),
    magenta: createDefaultHslBand(),
  };
}

const DEFAULT_CURVE: [number, number, number, number, number] = [0, 64, 128, 192, 255];

export function createDefaultCurveState(): CurveState {
  return {
    rgb: [...DEFAULT_CURVE],
    red: [...DEFAULT_CURVE],
    green: [...DEFAULT_CURVE],
    blue: [...DEFAULT_CURVE],
  };
}

export function createDefaultAdvancedState(): AdvancedEditState {
  return {
    hsl: createDefaultHslState(),
    curves: createDefaultCurveState(),
    layers: [],
    overlay: { type: "none", intensity: 0.5 },
    lutIntensity: 1,
  };
}

const neutralByKey: Record<keyof FilterState, number> = createDefaultFilterState();

function clampForKey(key: keyof FilterState, value: number) {
  switch (key) {
    case "brightness":
    case "contrast":
      return Math.max(0, Math.min(2, value));
    case "saturate":
      return Math.max(0, Math.min(3, value));
    case "grayscale":
    case "sepia":
    case "invert":
    case "opacity":
    case "fade":
    case "vignette":
    case "grain":
      return Math.max(0, Math.min(1, value));
    case "hueRotate":
      return ((value % 360) + 360) % 360;
    case "blur":
      return Math.max(0, Math.min(20, value));
    case "exposure":
      return Math.max(-2, Math.min(2, value));
    default:
      return Math.max(-100, Math.min(100, value));
  }
}

/**
 * Layers represent non-destructive "looks" applied above the current base edit.
 * Every value is blended relative to that field's neutral value, then clamped.
 */
export function composeFilterLayers(base: FilterState, layers: FilterLayer[]) {
  const result = { ...base };
  for (const layer of layers) {
    if (!layer.enabled || layer.intensity <= 0) continue;
    const strength = Math.max(0, Math.min(1, layer.intensity));
    const keys = Object.keys(layer.filters) as (keyof FilterState)[];
    for (const key of keys) {
      const neutral = neutralByKey[key];
      const delta = layer.filters[key] - neutral;
      result[key] = clampForKey(key, result[key] + delta * strength);
    }
  }
  return result;
}

export function curveIsNeutral(curves: CurveState) {
  return CURVE_CHANNELS.every(({ id }) => curves[id].every((value, index) => value === DEFAULT_CURVE[index]));
}

export function hslIsNeutral(hsl: HslState) {
  return HSL_BANDS.every(({ id }) => {
    const band = hsl[id];
    return band.hue === 0 && band.saturation === 0 && band.lightness === 0;
  });
}

export function advancedIsNeutral(advanced: AdvancedEditState) {
  return (
    hslIsNeutral(advanced.hsl) &&
    curveIsNeutral(advanced.curves) &&
    advanced.layers.length === 0 &&
    advanced.overlay.type === "none"
  );
}
