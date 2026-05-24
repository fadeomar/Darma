export type TransformMode = "2d" | "3d" | "hover" | "entrance" | "card-tilt";
export type PreviewObject = "card" | "image" | "button" | "modal" | "badge" | "panel";
export type TransformOriginPreset =
  | "top left"
  | "top center"
  | "top right"
  | "center left"
  | "center center"
  | "center right"
  | "bottom left"
  | "bottom center"
  | "bottom right"
  | "custom";

export type Transform2DFunction = "translate" | "rotate" | "scale" | "skew";

export type Transform2DSettings = {
  translateX: number;
  translateY: number;
  translateUnit: "px" | "rem" | "%";
  rotate: number;
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
  order: Transform2DFunction[];
};

export type Transform3DSettings = {
  perspective: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  translateZ: number;
  transformStyle: "flat" | "preserve-3d";
  backfaceVisibility: "visible" | "hidden";
  perspectiveOriginX: number;
  perspectiveOriginY: number;
};

export type TransformOriginSettings = {
  preset: TransformOriginPreset;
  x: string;
  y: string;
  z: string;
};

export type TransformTransitionSettings = {
  enabled: boolean;
  duration: number;
  delay: number;
  timingFunction: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
  includeOpacity: boolean;
  includeBoxShadow: boolean;
};

export type TransformAnimationSettings = {
  enabled: boolean;
  name: string;
  duration: number;
  timingFunction: "ease" | "ease-out" | "ease-in-out" | "linear";
  fillMode: "none" | "both" | "forwards";
  includeReducedMotion: boolean;
};

export type TransformStyleSettings = {
  previewObject: PreviewObject;
  width: number;
  height: number;
  borderRadius: number;
  padding: number;
  background: string;
  textColor: string;
  shadow: "none" | "soft" | "medium" | "strong";
};

export type TransformExportOptions = {
  className: string;
  componentName: string;
  includeComments: boolean;
  includeDemoStyles: boolean;
  includeReducedMotion: boolean;
  useTransformGpuHint: boolean;
  quoteStyle: "single" | "double";
};

export type TransformGeneratorState = {
  presetId: string;
  mode: TransformMode;
  transform2d: Transform2DSettings;
  transform3d: Transform3DSettings;
  hover2d: Transform2DSettings;
  hover3d: Transform3DSettings;
  origin: TransformOriginSettings;
  transition: TransformTransitionSettings;
  animation: TransformAnimationSettings;
  style: TransformStyleSettings;
  exportOptions: TransformExportOptions;
  showOriginMarker: boolean;
  showBeforeOutline: boolean;
  showAxisOverlay: boolean;
  show3dGrid: boolean;
  previewState: "base" | "hover" | "active" | "animated";
};

export type TransformValidationMessage = {
  type: "info" | "warning" | "error";
  message: string;
  field?: string;
};

export type TransformPreset = {
  id: string;
  name: string;
  description: string;
  category: "2d" | "3d" | "hover" | "animation" | "utility";
  state: TransformGeneratorState;
};
