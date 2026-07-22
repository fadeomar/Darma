export type CssFilterKey =
  | "brightness"
  | "contrast"
  | "saturate"
  | "grayscale"
  | "sepia"
  | "hueRotate"
  | "invert"
  | "blur"
  | "opacity";

export type RasterAdjustmentKey =
  | "exposure"
  | "temperature"
  | "highlights"
  | "shadows";

export type AdjustmentKey = CssFilterKey | RasterAdjustmentKey;

export type FilterState = Record<AdjustmentKey, number>;
export type PhotoAdjustments = FilterState;

export type Orientation = {
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
};

export type NormalizedCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PhotoEditState = {
  adjustments: PhotoAdjustments;
  crop: NormalizedCrop;
  orientation: Orientation;
};

export type ExportFormat = "png" | "jpeg" | "webp";
export type ResizeMode = "original" | "custom" | "scale";

export type ExportSettings = {
  format: ExportFormat;
  quality: number;
  backgroundColor: string;
  filename: string;
  resizeMode: ResizeMode;
  width: number;
  height: number;
  lockAspect: boolean;
  scalePercent: number;
  allowUpscale: boolean;
};

export type PreviewBackground = "checkerboard" | "light" | "dark";

export type PreviewSettings = {
  background: PreviewBackground;
  showOverlays: boolean;
  comparisonEnabled: boolean;
  comparisonPosition: number;
};

export type FilterControl = {
  key: AdjustmentKey;
  label: string;
  group: "Light" | "Color" | "Effects";
  min: number;
  max: number;
  step: number;
  neutral: number;
  unit: "" | "%" | "deg" | "px" | "EV";
  display: "percent" | "signed-percent" | "raw" | "deg" | "px" | "ev";
  cssCompatible: boolean;
};

export type FilterPreset = {
  id: string;
  name: string;
  description: string;
  category: "Essentials" | "Portrait" | "Cinematic" | "Vintage" | "Black & White" | "Creative";
  filters: PhotoAdjustments;
};

export type CropAspectId = "free" | "original" | "1:1" | "4:5" | "3:4" | "4:3" | "16:9" | "9:16";
export type CropHandle = "move" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

export type FilterValidationMessage = {
  type: "info" | "warning" | "error";
  message: string;
};

export type ImageSourceInfo = {
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  bytes: number;
};

export type LoadedPhoto = {
  original: HTMLImageElement;
  preview: CanvasImageSource;
  previewWidth: number;
  previewHeight: number;
  objectUrl: string;
  info: ImageSourceInfo;
};

export type ToolStatus = {
  tone: "info" | "success" | "warning" | "error";
  message: string;
};

export type CustomPreset = {
  id: string;
  name: string;
  adjustments: PhotoAdjustments;
  createdAt: string;
  updatedAt: string;
};

export type PhotoProjectV1 = {
  kind: "darma.photo-filter-project";
  version: 1;
  name: string;
  edit: PhotoEditState;
  export: ExportSettings;
  preview: PreviewSettings;
};
