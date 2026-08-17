export type FilterState = {
  // CSS-compatible adjustments. Neutral values are intentionally preserved so
  // the tool can still generate a useful CSS filter string for developers.
  brightness: number; // 0–2 (1 = normal)
  contrast: number; // 0–2
  saturate: number; // 0–3
  grayscale: number; // 0–1
  sepia: number; // 0–1
  hueRotate: number; // 0–360 (deg)
  invert: number; // 0–1
  blur: number; // 0–20 (px)
  opacity: number; // 0–1

  // Canvas-only color grading. These are applied locally during preview/export.
  exposure: number; // -2–2 EV
  highlights: number; // -100–100
  shadows: number; // -100–100
  whites: number; // -100–100
  blacks: number; // -100–100
  vibrance: number; // -100–100
  temperature: number; // -100–100
  tint: number; // -100–100
  fade: number; // 0–1
  vignette: number; // 0–1
  grain: number; // 0–1
};

export type Orientation = {
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
};

export type CropRatioId = "original" | "free" | "1:1" | "4:3" | "3:2" | "5:4" | "16:9" | "9:16";

export type CropState = {
  ratioId: CropRatioId;
  /** Horizontal crop position from 0 (left) to 1 (right). */
  positionX: number;
  /** Vertical crop position from 0 (top) to 1 (bottom). */
  positionY: number;
  /** Normalized crop width. Used directly in Free mode. */
  width: number;
  /** Normalized crop height. Used directly in Free mode. */
  height: number;
};

export type ExportFormat = "png" | "jpeg" | "webp";

export type FilterControlGroup = "light" | "color" | "effects";

export type FilterControl = {
  key: keyof FilterState;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: "" | "%" | "deg" | "px" | "ev";
  display: "percent" | "signedPercent" | "raw" | "deg" | "px" | "ev";
  group: FilterControlGroup;
  description?: string;
};

export type FilterPresetCategory = "essentials" | "portrait" | "film" | "cinematic" | "vintage" | "bw" | "moody" | "warm" | "cool" | "creative";

export type FilterPreset = {
  id: string;
  name: string;
  description: string;
  category: FilterPresetCategory;
  filters: FilterState;
};

export type FilterValidationMessage = {
  type: "info" | "warning";
  message: string;
};

export type EditorPanelId = "filters" | "adjust" | "crop" | "effects" | "advanced" | "smart" | "batch" | "export";

export type PreviewCompareMode = "edited" | "original" | "split";

export type EditorSnapshot = {
  filters: FilterState;
  orientation: Orientation;
  crop: CropState;
  presetId: string;
  presetStrength: number;
  advanced: AdvancedEditState;
  smart: SmartEditState;
};


export type HslBandId = "red" | "orange" | "yellow" | "green" | "aqua" | "blue" | "purple" | "magenta";

export type HslBandState = {
  hue: number; // -60–60 degrees
  saturation: number; // -100–100
  lightness: number; // -100–100
};

export type HslState = Record<HslBandId, HslBandState>;

export type CurveChannel = "rgb" | "red" | "green" | "blue";
export type CurvePoints = [number, number, number, number, number];
export type CurveState = Record<CurveChannel, CurvePoints>;

export type FilterLayer = {
  id: string;
  name: string;
  filters: FilterState;
  intensity: number; // 0–1
  enabled: boolean;
};

export type OverlayType = "none" | "light-leak" | "warm-glow" | "cool-glow" | "film-dust";

export type AdvancedEditState = {
  hsl: HslState;
  curves: CurveState;
  layers: FilterLayer[];
  overlay: { type: OverlayType; intensity: number };
  lutIntensity: number;
};

export type LutDefinition = {
  title: string;
  size: number;
  domainMin: [number, number, number];
  domainMax: [number, number, number];
  data: Float32Array;
};

export type CustomPhotoPreset = {
  version: 1;
  id: string;
  name: string;
  createdAt: string;
  filters: FilterState;
  advanced: AdvancedEditState;
};

export type BatchItemStatus = "ready" | "processing" | "done" | "error";
export type BatchItem = {
  id: string;
  file: File;
  status: BatchItemStatus;
  error?: string;
};


export type BackgroundFillMode = "transparent" | "white" | "color";

export type HealStroke = {
  id: string;
  /** Position is normalized to the rendered output so it survives export resizing. */
  x: number;
  y: number;
  /** Radius relative to the shorter output edge. */
  radius: number;
};

export type SmartEditState = {
  backgroundEnabled: boolean;
  backgroundFill: BackgroundFillMode;
  backgroundColor: string;
  maskFeather: number; // 0–12 output pixels at preview scale
  healStrokes: HealStroke[];
};

export type BackgroundMask = {
  width: number;
  height: number;
  alpha: Uint8ClampedArray;
};

export type BackgroundRemovalProgress = {
  status: "idle" | "loading" | "processing" | "ready" | "error";
  percent: number;
  message: string;
  backend?: "webgpu" | "wasm";
};
