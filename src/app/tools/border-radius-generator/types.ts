export type BorderRadiusMode = "simple" | "advanced" | "blob" | "image" | "animated";

export type RadiusUnit = "px" | "rem" | "%" | "em";

export type PreviewContext = "blob" | "card" | "avatar" | "button" | "image" | "hero-decoration";

export type BackgroundType = "solid" | "linear-gradient" | "radial-gradient" | "image";

export type RadiusCornerValues = {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
};

export type AdvancedRadiusValues = {
  horizontal: RadiusCornerValues;
  vertical: RadiusCornerValues;
};

export type CornerLocks = {
  topLeft: boolean;
  topRight: boolean;
  bottomRight: boolean;
  bottomLeft: boolean;
};

export type ShapeStyle = {
  width: number;
  height: number;
  sizeUnit: "px" | "rem";
  backgroundType: BackgroundType;
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  imageUrl: string;
  objectFit: "cover" | "contain" | "fill";
  borderWidth: number;
  borderColor: string;
  borderStyle: "solid" | "dashed" | "dotted" | "none";
  shadowPreset: "none" | "soft" | "medium" | "strong" | "custom";
  customShadow: string;
};

export type AnimationSettings = {
  enabled: boolean;
  duration: number;
  timingFunction: "ease" | "ease-in-out" | "linear";
  direction: "normal" | "alternate";
  infinite: boolean;
  includeReducedMotion: boolean;
  keyframes: AdvancedRadiusValues[];
};

export type BorderRadiusExportOptions = {
  className: string;
  includeComments: boolean;
  includeDemoStyles: boolean;
  includeReducedMotion: boolean;
  componentName: string;
};

export type BorderRadiusState = {
  mode: BorderRadiusMode;
  previewContext: PreviewContext;
  simpleUnit: RadiusUnit;
  simpleValues: RadiusCornerValues;
  advancedUnit: RadiusUnit;
  advancedValues: AdvancedRadiusValues;
  locks: CornerLocks;
  style: ShapeStyle;
  animation: AnimationSettings;
  showGrid: boolean;
  showCornerLabels: boolean;
  exportOptions: BorderRadiusExportOptions;
};

export type BorderRadiusValidationMessage = {
  type: "info" | "warning" | "error";
  message: string;
  field?: string;
};

export type BorderRadiusPreset = {
  id: string;
  name: string;
  category: "ui" | "blob" | "image" | "animated";
  description: string;
  state: BorderRadiusState;
};
