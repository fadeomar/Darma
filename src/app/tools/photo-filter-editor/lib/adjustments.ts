import type {
  AdjustmentKey,
  FilterControl,
  FilterState,
  FilterValidationMessage,
  Orientation,
  PhotoAdjustments,
  RasterAdjustmentKey,
} from "../types";

export const FILTER_CONTROLS: FilterControl[] = [
  { key: "exposure", label: "Exposure", group: "Light", min: -2, max: 2, step: 0.05, neutral: 0, unit: "EV", display: "ev", cssCompatible: false },
  { key: "brightness", label: "Brightness", group: "Light", min: 0, max: 2, step: 0.01, neutral: 1, unit: "%", display: "percent", cssCompatible: true },
  { key: "contrast", label: "Contrast", group: "Light", min: 0, max: 2, step: 0.01, neutral: 1, unit: "%", display: "percent", cssCompatible: true },
  { key: "highlights", label: "Highlights", group: "Light", min: -100, max: 100, step: 1, neutral: 0, unit: "%", display: "signed-percent", cssCompatible: false },
  { key: "shadows", label: "Shadows", group: "Light", min: -100, max: 100, step: 1, neutral: 0, unit: "%", display: "signed-percent", cssCompatible: false },
  { key: "saturate", label: "Saturation", group: "Color", min: 0, max: 3, step: 0.01, neutral: 1, unit: "%", display: "percent", cssCompatible: true },
  { key: "temperature", label: "Temperature", group: "Color", min: -100, max: 100, step: 1, neutral: 0, unit: "%", display: "signed-percent", cssCompatible: false },
  { key: "hueRotate", label: "Hue", group: "Color", min: 0, max: 360, step: 1, neutral: 0, unit: "deg", display: "deg", cssCompatible: true },
  { key: "grayscale", label: "Grayscale", group: "Effects", min: 0, max: 1, step: 0.01, neutral: 0, unit: "%", display: "percent", cssCompatible: true },
  { key: "sepia", label: "Sepia", group: "Effects", min: 0, max: 1, step: 0.01, neutral: 0, unit: "%", display: "percent", cssCompatible: true },
  { key: "invert", label: "Invert", group: "Effects", min: 0, max: 1, step: 0.01, neutral: 0, unit: "%", display: "percent", cssCompatible: true },
  { key: "blur", label: "Blur", group: "Effects", min: 0, max: 20, step: 0.1, neutral: 0, unit: "px", display: "px", cssCompatible: true },
  { key: "opacity", label: "Opacity", group: "Effects", min: 0, max: 1, step: 0.01, neutral: 1, unit: "%", display: "percent", cssCompatible: true },
];

export const RASTER_ADJUSTMENT_KEYS: RasterAdjustmentKey[] = [
  "exposure",
  "temperature",
  "highlights",
  "shadows",
];

const CONTROL_BY_KEY = new Map(FILTER_CONTROLS.map((control) => [control.key, control]));

export function createDefaultFilterState(): PhotoAdjustments {
  return FILTER_CONTROLS.reduce((state, control) => {
    state[control.key] = control.neutral;
    return state;
  }, {} as PhotoAdjustments);
}

export function createDefaultOrientation(): Orientation {
  return { rotate: 0, flipH: false, flipV: false };
}

export function clampAdjustmentValue(key: AdjustmentKey, value: number): number {
  const control = CONTROL_BY_KEY.get(key);
  if (!control) return Number.isFinite(value) ? value : 0;
  if (!Number.isFinite(value)) return control.neutral;
  const clamped = Math.min(control.max, Math.max(control.min, value));
  const decimals = Math.max(0, String(control.step).split(".")[1]?.length ?? 0);
  return Number(clamped.toFixed(Math.min(decimals + 1, 4)));
}

export function clampFilterState(state: Partial<FilterState>): PhotoAdjustments {
  const defaults = createDefaultFilterState();
  for (const control of FILTER_CONTROLS) {
    defaults[control.key] = clampAdjustmentValue(control.key, state[control.key] ?? control.neutral);
  }
  return defaults;
}

function short(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

export function buildFilterString(state: PhotoAdjustments): string {
  const value = clampFilterState(state);
  const parts: string[] = [];
  if (value.brightness !== 1) parts.push(`brightness(${short(value.brightness)})`);
  if (value.contrast !== 1) parts.push(`contrast(${short(value.contrast)})`);
  if (value.saturate !== 1) parts.push(`saturate(${short(value.saturate)})`);
  if (value.grayscale !== 0) parts.push(`grayscale(${short(value.grayscale)})`);
  if (value.sepia !== 0) parts.push(`sepia(${short(value.sepia)})`);
  if (value.hueRotate !== 0) parts.push(`hue-rotate(${short(value.hueRotate)}deg)`);
  if (value.invert !== 0) parts.push(`invert(${short(value.invert)})`);
  if (value.blur !== 0) parts.push(`blur(${short(value.blur)}px)`);
  if (value.opacity !== 1) parts.push(`opacity(${short(value.opacity)})`);
  return parts.length > 0 ? parts.join(" ") : "none";
}

export function buildTransformString(orientation: Orientation): string {
  const parts: string[] = [];
  // Flips are listed first so CSS applies them in the final, rotated canvas axes.
  if (orientation.flipH) parts.push("scaleX(-1)");
  if (orientation.flipV) parts.push("scaleY(-1)");
  if (orientation.rotate !== 0) parts.push(`rotate(${orientation.rotate}deg)`);
  return parts.length > 0 ? parts.join(" ") : "none";
}

export function getActiveRasterAdjustments(state: PhotoAdjustments): RasterAdjustmentKey[] {
  const defaults = createDefaultFilterState();
  return RASTER_ADJUSTMENT_KEYS.filter((key) => state[key] !== defaults[key]);
}

export function sanitizeCssClassName(className: string): string {
  return className.trim().replace(/[^a-zA-Z0-9_-]/g, "-").replace(/^-+/, "") || "filtered-image";
}

export function generateFilterCss(state: PhotoAdjustments, className = "filtered-image", orientation?: Orientation): string {
  const safeClass = sanitizeCssClassName(className);
  const lines = [`  filter: ${buildFilterString(state)};`];
  if (orientation && buildTransformString(orientation) !== "none") {
    lines.push(`  transform: ${buildTransformString(orientation)};`);
  }
  return `.${safeClass} {\n${lines.join("\n")}\n}`;
}

export function generateReactStyle(state: PhotoAdjustments, orientation: Orientation): string {
  const filter = buildFilterString(state);
  const transform = buildTransformString(orientation);
  const rows = [`filter: ${JSON.stringify(filter)}`];
  if (transform !== "none") rows.push(`transform: ${JSON.stringify(transform)}`);
  return `{ ${rows.join(", ")} }`;
}

export function formatControlValue(control: FilterControl, value: number): string {
  if (control.display === "percent") return `${Math.round(value * 100)}%`;
  if (control.display === "signed-percent") return `${value > 0 ? "+" : ""}${Math.round(value)}%`;
  if (control.display === "deg") return `${Math.round(value)}°`;
  if (control.display === "px") return `${Math.round(value * 10) / 10}px`;
  if (control.display === "ev") return `${value > 0 ? "+" : ""}${short(value)} EV`;
  return short(value);
}

export function formatEditableValue(control: FilterControl, value: number): number {
  if (control.display === "percent" && control.max <= 3) return Math.round(value * 1000) / 10;
  return Math.round(value * 100) / 100;
}

export function parseEditableValue(control: FilterControl, value: number): number {
  const normalized = control.display === "percent" && control.max <= 3 ? value / 100 : value;
  return clampAdjustmentValue(control.key, normalized);
}

export function isNeutral(state: PhotoAdjustments): boolean {
  const defaults = createDefaultFilterState();
  return FILTER_CONTROLS.every((control) => state[control.key] === defaults[control.key]);
}

export function adjustmentsEqual(a: PhotoAdjustments, b: PhotoAdjustments, tolerance = 0.0001): boolean {
  return FILTER_CONTROLS.every((control) => Math.abs(a[control.key] - b[control.key]) <= tolerance);
}

export function validateFilters(state: PhotoAdjustments, hasImage: boolean): FilterValidationMessage[] {
  const messages: FilterValidationMessage[] = [];
  if (!hasImage) {
    messages.push({ type: "info", message: "Load an image to preview and export adjustments." });
    return messages;
  }
  if (state.blur > 12) {
    messages.push({ type: "warning", message: "Strong blur can take longer on large exports." });
  }
  if (state.opacity < 1) {
    messages.push({ type: "info", message: "PNG and WebP preserve transparency; JPEG uses the chosen background color." });
  }
  return messages;
}
