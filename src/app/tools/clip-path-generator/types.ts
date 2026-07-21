export type ClipPoint = {
  /** Horizontal position as a percentage of the element width (0–100). */
  x: number;
  /** Vertical position as a percentage of the element height (0–100). */
  y: number;
};

export type PreviewShape = "solid" | "image";
export type PreviewObjectFit = "cover" | "contain" | "fill";
export type PreviewObjectPosition = "center" | "top" | "bottom" | "left" | "right";
export type CanvasAspectRatio = "square" | "4:3" | "16:9" | "9:16" | "free";
export type ClipOutputFormat = "css" | "value" | "tailwind" | "react";

export type ClipPathState = {
  points: ClipPoint[];
  previewShape: PreviewShape;
  /** Temporary local object URL for a decoded image, or null when none is loaded. */
  imageUrl: string | null;
  objectFit: PreviewObjectFit;
  /** Show the clipped-away area as a faded ghost so the crop is easier to judge. */
  showGhost: boolean;
  /** Emit a -webkit-clip-path fallback alongside the standard property. */
  webkitFallback: boolean;
  className: string;
};

export type ClipPathStudioSettings = {
  aspectRatio: CanvasAspectRatio;
  objectFit: PreviewObjectFit;
  objectPosition: PreviewObjectPosition;
  backgroundColor: string;
  checkerboard: boolean;
  showGhost: boolean;
  showOutline: boolean;
  showPointLabels: boolean;
  showHandles: boolean;
  showGrid: boolean;
  snapEnabled: boolean;
  snapSize: number;
  webkitFallback: boolean;
};

export type ClipPathValidationMessage = {
  type: "info" | "warning" | "error";
  message: string;
  field?: string;
};

export type ClipPathPresetCategory = "basic" | "polygon" | "arrow" | "decorative";

export type ClipPathPreset = {
  id: string;
  name: string;
  category: ClipPathPresetCategory;
  description: string;
  points: ClipPoint[];
};

export type ClipPathStats = {
  pointCount: number;
  /** Clipped area as a percentage of the 100 × 100 editor box (0–100). */
  areaPercent: number;
  isConvex: boolean;
  isValid: boolean;
};

/** Serialized shape config for JSON export/import. Never contains image bytes. */
export type ClipPathShapeFile = {
  kind: "darma.clip-path";
  version: 1;
  className: string;
  points: ClipPoint[];
};

export type ParseShapeFileResult =
  | {
      ok: true;
      className: string;
      points: ClipPoint[];
    }
  | {
      ok: false;
      error: string;
    };

export type SavedClipPathShape = {
  id: string;
  version: 1;
  name: string;
  className: string;
  points: ClipPoint[];
  settings: ClipPathStudioSettings;
  createdAt: string;
  updatedAt: string;
};
