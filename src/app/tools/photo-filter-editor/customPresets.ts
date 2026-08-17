import { createDefaultAdvancedState, CURVE_CHANNELS, HSL_BANDS } from "./advanced";
import { createDefaultFilterState } from "./filters";
import type { AdvancedEditState, CustomPhotoPreset, FilterState, OverlayType } from "./types";

const OVERLAY_TYPES = new Set<OverlayType>(["none", "light-leak", "warm-glow", "cool-glow", "film-dust"]);
const MAX_LAYERS = 12;

const finite = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
/** Narrows an untrusted JSON value to a readable bag of unknown fields. */
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

function normalizeFilterValue(key: keyof FilterState, value: unknown, fallback: number) {
  const numeric = finite(value, fallback);
  switch (key) {
    case "brightness":
    case "contrast":
      return clamp(numeric, 0, 2);
    case "saturate":
      return clamp(numeric, 0, 3);
    case "grayscale":
    case "sepia":
    case "invert":
    case "opacity":
    case "fade":
    case "vignette":
    case "grain":
      return clamp(numeric, 0, 1);
    case "hueRotate":
      return ((numeric % 360) + 360) % 360;
    case "blur":
      return clamp(numeric, 0, 20);
    case "exposure":
      return clamp(numeric, -2, 2);
    default:
      return clamp(numeric, -100, 100);
  }
}

export function normalizeFilterState(value: unknown): FilterState {
  const defaults = createDefaultFilterState();
  const source = record(value);
  const next = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof FilterState)[]) {
    next[key] = normalizeFilterValue(key, source[key], defaults[key]);
  }
  return next;
}

export function normalizeAdvancedState(value: unknown): AdvancedEditState {
  const defaults = createDefaultAdvancedState();
  const source = record(value);
  const hslSource = record(source.hsl);
  const curveSource = record(source.curves);

  const hsl = { ...defaults.hsl };
  for (const { id } of HSL_BANDS) {
    const band = record(hslSource[id]);
    hsl[id] = {
      hue: clamp(finite(band.hue, 0), -60, 60),
      saturation: clamp(finite(band.saturation, 0), -100, 100),
      lightness: clamp(finite(band.lightness, 0), -100, 100),
    };
  }

  const curves = { ...defaults.curves };
  for (const { id } of CURVE_CHANNELS) {
    const points = Array.isArray(curveSource[id]) ? curveSource[id] : defaults.curves[id];
    curves[id] = [0, 1, 2, 3, 4].map((index) => clamp(finite(points[index], defaults.curves[id][index]), 0, 255)) as typeof curves[typeof id];
  }

  const rawLayers: unknown[] = Array.isArray(source.layers) ? source.layers.slice(0, MAX_LAYERS) : [];
  const layers = rawLayers.map((entry, index) => {
    const layer = record(entry);
    return {
      id: typeof layer.id === "string" && layer.id.trim() ? layer.id.slice(0, 120) : `imported-layer-${index + 1}`,
      name: typeof layer.name === "string" && layer.name.trim() ? layer.name.trim().slice(0, 80) : `Imported look ${index + 1}`,
      filters: normalizeFilterState(layer.filters),
      intensity: clamp(finite(layer.intensity, 1), 0, 1),
      enabled: typeof layer.enabled === "boolean" ? layer.enabled : true,
    };
  });

  const rawOverlay = record(source.overlay);
  const overlayType = typeof rawOverlay.type === "string" && OVERLAY_TYPES.has(rawOverlay.type as OverlayType)
    ? rawOverlay.type as OverlayType
    : "none";

  return {
    hsl,
    curves,
    layers,
    overlay: {
      type: overlayType,
      intensity: clamp(finite(rawOverlay.intensity, defaults.overlay.intensity), 0, 1),
    },
    lutIntensity: clamp(finite(source.lutIntensity, defaults.lutIntensity), 0, 1),
  };
}

export function normalizeCustomPhotoPreset(value: unknown, fallbackId = "imported-preset"): CustomPhotoPreset | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  if (source.version !== 1 || typeof source.name !== "string" || !source.name.trim()) return null;
  return {
    version: 1,
    id: typeof source.id === "string" && source.id.trim() ? source.id.slice(0, 120) : fallbackId,
    name: source.name.trim().slice(0, 80),
    createdAt: typeof source.createdAt === "string" && source.createdAt ? source.createdAt : new Date(0).toISOString(),
    filters: normalizeFilterState(source.filters),
    advanced: normalizeAdvancedState(source.advanced),
  };
}
