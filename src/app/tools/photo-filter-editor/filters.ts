import type {
  ExportFormat,
  FilterControl,
  FilterState,
  FilterValidationMessage,
  Orientation,
} from "./types";

export const FILTER_CONTROLS: FilterControl[] = [
  { key: "exposure", label: "Exposure", min: -2, max: 2, step: 0.05, unit: "ev", display: "ev", group: "light", description: "Overall scene exposure in stops." },
  { key: "brightness", label: "Brightness", min: 0.5, max: 1.5, step: 0.01, unit: "", display: "percent", group: "light" },
  { key: "contrast", label: "Contrast", min: 0.5, max: 1.8, step: 0.01, unit: "", display: "percent", group: "light" },
  { key: "highlights", label: "Highlights", min: -100, max: 100, step: 1, unit: "%", display: "signedPercent", group: "light" },
  { key: "shadows", label: "Shadows", min: -100, max: 100, step: 1, unit: "%", display: "signedPercent", group: "light" },
  { key: "whites", label: "Whites", min: -100, max: 100, step: 1, unit: "%", display: "signedPercent", group: "light" },
  { key: "blacks", label: "Blacks", min: -100, max: 100, step: 1, unit: "%", display: "signedPercent", group: "light" },

  { key: "saturate", label: "Saturation", min: 0, max: 2.2, step: 0.01, unit: "", display: "percent", group: "color" },
  { key: "vibrance", label: "Vibrance", min: -100, max: 100, step: 1, unit: "%", display: "signedPercent", group: "color", description: "Boost muted colors while protecting already-saturated areas." },
  { key: "temperature", label: "Temperature", min: -100, max: 100, step: 1, unit: "%", display: "signedPercent", group: "color" },
  { key: "tint", label: "Tint", min: -100, max: 100, step: 1, unit: "%", display: "signedPercent", group: "color" },
  { key: "hueRotate", label: "Hue", min: 0, max: 360, step: 1, unit: "deg", display: "deg", group: "color" },

  { key: "grayscale", label: "Grayscale", min: 0, max: 1, step: 0.01, unit: "", display: "percent", group: "effects" },
  { key: "sepia", label: "Sepia", min: 0, max: 1, step: 0.01, unit: "", display: "percent", group: "effects" },
  { key: "fade", label: "Fade", min: 0, max: 1, step: 0.01, unit: "", display: "percent", group: "effects" },
  { key: "vignette", label: "Vignette", min: 0, max: 1, step: 0.01, unit: "", display: "percent", group: "effects" },
  { key: "grain", label: "Film grain", min: 0, max: 1, step: 0.01, unit: "", display: "percent", group: "effects" },
  { key: "blur", label: "Blur", min: 0, max: 20, step: 0.1, unit: "px", display: "px", group: "effects" },
  { key: "invert", label: "Invert", min: 0, max: 1, step: 0.01, unit: "", display: "percent", group: "effects" },
  { key: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01, unit: "", display: "percent", group: "effects" },
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
    exposure: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    vibrance: 0,
    temperature: 0,
    tint: 0,
    fade: 0,
    vignette: 0,
    grain: 0,
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

function short(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

/** CSS-only neutral test. Canvas-only adjustments are intentionally excluded. */
function isCssDefault(key: keyof FilterState, value: number): boolean {
  const defaults = createDefaultFilterState();
  return value === defaults[key];
}

/**
 * Build the CSS-compatible part of the editor state. Advanced tone/color
 * controls are baked through Canvas and are therefore intentionally omitted.
 */
export function buildFilterString(state: FilterState): string {
  const clamped = clampFilterState(state);
  const parts: string[] = [];
  if (!isCssDefault("brightness", clamped.brightness)) parts.push(`brightness(${short(clamped.brightness)})`);
  if (!isCssDefault("contrast", clamped.contrast)) parts.push(`contrast(${short(clamped.contrast)})`);
  if (!isCssDefault("saturate", clamped.saturate)) parts.push(`saturate(${short(clamped.saturate)})`);
  if (!isCssDefault("grayscale", clamped.grayscale)) parts.push(`grayscale(${short(clamped.grayscale)})`);
  if (!isCssDefault("sepia", clamped.sepia)) parts.push(`sepia(${short(clamped.sepia)})`);
  if (!isCssDefault("hueRotate", clamped.hueRotate)) parts.push(`hue-rotate(${short(clamped.hueRotate)}deg)`);
  if (!isCssDefault("invert", clamped.invert)) parts.push(`invert(${short(clamped.invert)})`);
  if (!isCssDefault("blur", clamped.blur)) parts.push(`blur(${short(clamped.blur)}px)`);
  if (!isCssDefault("opacity", clamped.opacity)) parts.push(`opacity(${short(clamped.opacity)})`);
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

export function formatControlValue(control: FilterControl, value: number): string {
  if (control.display === "percent") return `${Math.round(value * 100)}%`;
  if (control.display === "signedPercent") return `${value > 0 ? "+" : ""}${Math.round(value)}`;
  if (control.display === "deg") return `${Math.round(value)}°`;
  if (control.display === "px") return `${Math.round(value * 10) / 10}px`;
  if (control.display === "ev") return `${value > 0 ? "+" : ""}${Math.round(value * 100) / 100} EV`;
  return short(value);
}

export function hasAdvancedAdjustments(state: FilterState): boolean {
  const defaults = createDefaultFilterState();
  const keys: (keyof FilterState)[] = [
    "exposure",
    "highlights",
    "shadows",
    "whites",
    "blacks",
    "vibrance",
    "temperature",
    "tint",
    "fade",
    "vignette",
    "grain",
  ];
  return keys.some((key) => state[key] !== defaults[key]);
}

export function isNeutral(state: FilterState): boolean {
  const defaults = createDefaultFilterState();
  return (Object.keys(defaults) as (keyof FilterState)[]).every((key) => state[key] === defaults[key]);
}

export function validateFilters(state: FilterState, hasImage: boolean): FilterValidationMessage[] {
  const messages: FilterValidationMessage[] = [];
  if (!hasImage) {
    messages.push({ type: "info", message: "Upload, drop, or paste an image to start editing." });
    return messages;
  }
  if (state.blur > 12 || state.grain > 0.75) {
    messages.push({ type: "warning", message: "Heavy blur or grain can take longer to export on very large images." });
  }
  if (state.opacity < 1) {
    messages.push({ type: "info", message: "Opacity below 100% keeps transparency in PNG/WebP and is flattened on white for JPEG." });
  }
  messages.push({ type: "info", message: "Every edit is processed locally — your image never leaves the browser." });
  return messages;
}

export const EXPORT_MIME: Record<ExportFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};
