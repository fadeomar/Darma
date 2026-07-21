import type {
  ExportFormat,
  FilterControl,
  FilterState,
  FilterValidationMessage,
  Orientation,
} from "./types";

export const FILTER_CONTROLS: FilterControl[] = [
  { key: "brightness", label: "Brightness", min: 0, max: 2, step: 0.01, unit: "", display: "percent" },
  { key: "contrast", label: "Contrast", min: 0, max: 2, step: 0.01, unit: "", display: "percent" },
  { key: "saturate", label: "Saturation", min: 0, max: 3, step: 0.01, unit: "", display: "percent" },
  { key: "grayscale", label: "Grayscale", min: 0, max: 1, step: 0.01, unit: "", display: "percent" },
  { key: "sepia", label: "Sepia", min: 0, max: 1, step: 0.01, unit: "", display: "percent" },
  { key: "hueRotate", label: "Hue rotate", min: 0, max: 360, step: 1, unit: "deg", display: "deg" },
  { key: "invert", label: "Invert", min: 0, max: 1, step: 0.01, unit: "", display: "percent" },
  { key: "blur", label: "Blur", min: 0, max: 20, step: 0.1, unit: "px", display: "px" },
  { key: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01, unit: "", display: "percent" },
];

const CONTROL_BY_KEY = new Map(FILTER_CONTROLS.map((control) => [control.key, control]));

export function createDefaultFilterState(): FilterState {
  return {
    brightness: 1,
    contrast: 1,
    saturate: 1,
    grayscale: 0,
    sepia: 0,
    hueRotate: 0,
    invert: 0,
    blur: 0,
    opacity: 1,
  };
}

export function createDefaultOrientation(): Orientation {
  return { rotate: 0, flipH: false, flipV: false };
}

function clampValue(key: keyof FilterState, value: number): number {
  const control = CONTROL_BY_KEY.get(key);
  if (!control) return value;
  if (!Number.isFinite(value)) return control.min;
  return Math.min(control.max, Math.max(control.min, value));
}

export function clampFilterState(state: FilterState): FilterState {
  const next = {} as FilterState;
  (Object.keys(state) as (keyof FilterState)[]).forEach((key) => {
    next[key] = clampValue(key, state[key]);
  });
  return next;
}

/** Round to a short display string, dropping trailing zeros. */
function short(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

/** True when a filter is at its neutral (no-op) value. */
function isDefault(key: keyof FilterState, value: number): boolean {
  const defaults = createDefaultFilterState();
  return value === defaults[key];
}

/**
 * Build the CSS `filter` value. Only includes filters that differ from their
 * neutral value so the output stays clean; returns "none" when nothing is set.
 */
export function buildFilterString(state: FilterState): string {
  const clamped = clampFilterState(state);
  const parts: string[] = [];
  if (!isDefault("brightness", clamped.brightness)) parts.push(`brightness(${short(clamped.brightness)})`);
  if (!isDefault("contrast", clamped.contrast)) parts.push(`contrast(${short(clamped.contrast)})`);
  if (!isDefault("saturate", clamped.saturate)) parts.push(`saturate(${short(clamped.saturate)})`);
  if (!isDefault("grayscale", clamped.grayscale)) parts.push(`grayscale(${short(clamped.grayscale)})`);
  if (!isDefault("sepia", clamped.sepia)) parts.push(`sepia(${short(clamped.sepia)})`);
  if (!isDefault("hueRotate", clamped.hueRotate)) parts.push(`hue-rotate(${short(clamped.hueRotate)}deg)`);
  if (!isDefault("invert", clamped.invert)) parts.push(`invert(${short(clamped.invert)})`);
  if (!isDefault("blur", clamped.blur)) parts.push(`blur(${short(clamped.blur)}px)`);
  if (!isDefault("opacity", clamped.opacity)) parts.push(`opacity(${short(clamped.opacity)})`);
  return parts.length > 0 ? parts.join(" ") : "none";
}

export function buildTransformString(orientation: Orientation): string {
  const parts: string[] = [];
  if (orientation.rotate !== 0) parts.push(`rotate(${orientation.rotate}deg)`);
  if (orientation.flipH) parts.push("scaleX(-1)");
  if (orientation.flipV) parts.push("scaleY(-1)");
  return parts.length > 0 ? parts.join(" ") : "none";
}

export function generateFilterCss(state: FilterState, className = "filtered-image"): string {
  const safeClass = className.trim().replace(/[^a-zA-Z0-9_-]/g, "-").replace(/^-+/, "") || "filtered-image";
  return `.${safeClass} {\n  filter: ${buildFilterString(state)};\n}`;
}

/** Human-readable display value for a control (e.g. brightness 1 → "100%"). */
export function formatControlValue(control: FilterControl, value: number): string {
  if (control.display === "percent") return `${Math.round(value * 100)}%`;
  if (control.display === "deg") return `${Math.round(value)}°`;
  if (control.display === "px") return `${Math.round(value * 10) / 10}px`;
  return short(value);
}

export function isNeutral(state: FilterState): boolean {
  return buildFilterString(state) === "none";
}

export function validateFilters(state: FilterState, hasImage: boolean): FilterValidationMessage[] {
  const messages: FilterValidationMessage[] = [];
  if (!hasImage) {
    messages.push({ type: "info", message: "Upload, drop, or paste an image to start editing." });
    return messages;
  }
  if (state.blur > 12) {
    messages.push({ type: "warning", message: "Heavy blur can be slow to export on very large images." });
  }
  if (state.opacity < 1) {
    messages.push({ type: "info", message: "Opacity below 100% exports onto a transparent background for PNG/WebP, or white for JPEG." });
  }
  messages.push({ type: "info", message: "Editing is non-destructive and fully local — your image never leaves the browser." });
  return messages;
}

export const EXPORT_MIME: Record<ExportFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};
