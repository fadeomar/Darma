export type FilterState = {
  brightness: number; // 0–2 (1 = normal)
  contrast: number; // 0–2
  saturate: number; // 0–3
  grayscale: number; // 0–1
  sepia: number; // 0–1
  hueRotate: number; // 0–360 (deg)
  invert: number; // 0–1
  blur: number; // 0–20 (px)
  opacity: number; // 0–1
};

export type Orientation = {
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
};

export type ExportFormat = "png" | "jpeg" | "webp";

export type FilterControl = {
  key: keyof FilterState;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: "" | "%" | "deg" | "px";
  /** How the numeric value is shown to the user (e.g. 1 → 100%). */
  display: "percent" | "raw" | "deg" | "px";
};

export type FilterPreset = {
  id: string;
  name: string;
  description: string;
  filters: FilterState;
};

export type FilterValidationMessage = {
  type: "info" | "warning";
  message: string;
};
