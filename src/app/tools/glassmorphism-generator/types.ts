export type GlassComponentType =
  | "card"
  | "navbar"
  | "modal"
  | "sidebar"
  | "button"
  | "pricing-card"
  | "login-panel"
  | "toast"
  | "hero-overlay"
  | "dashboard-widget";

export type GlassScenePreset =
  | "aurora"
  | "mesh"
  | "dark-dashboard"
  | "light-pastel"
  | "neon"
  | "abstract-blobs"
  | "grid"
  | "custom-gradient";

export type ShadowPreset = "none" | "soft" | "medium" | "strong" | "custom";

export type GlassEffectSettings = {
  tintColor: string;
  opacity: number;
  blur: number;
  saturation: number;
  brightness: number;
  contrast: number;
  borderColor: string;
  borderOpacity: number;
  borderWidth: number;
  shadowPreset: ShadowPreset;
  customShadow: string;
};

export type GlassShapeSettings = {
  componentType: GlassComponentType;
  width: number;
  minHeight: number;
  padding: number;
  borderRadius: number;
};

export type GlassSceneSettings = {
  preset: GlassScenePreset;
  colorA: string;
  colorB: string;
  colorC: string;
  animated: boolean;
  noiseEnabled: boolean;
  noiseOpacity: number;
};

export type GlassContentSettings = {
  title: string;
  description: string;
  eyebrow: string;
  actionLabel: string;
  textColor: string;
  accentColor: string;
};

export type GlassFallbackSettings = {
  includeWebkitPrefix: boolean;
  includeSupportsFallback: boolean;
  includeReducedTransparency: boolean;
  includeReducedMotion: boolean;
  includePerformanceComment: boolean;
};

export type GlassExportOptions = {
  className: string;
  componentName: string;
  includeComments: boolean;
  includeDemoScene: boolean;
  includeNoisePseudoElement: boolean;
  quoteStyle: "single" | "double";
};

export type GlassmorphismState = {
  presetId: string;
  effect: GlassEffectSettings;
  shape: GlassShapeSettings;
  scene: GlassSceneSettings;
  content: GlassContentSettings;
  fallback: GlassFallbackSettings;
  exportOptions: GlassExportOptions;
  showBeforeAfter: boolean;
  showReadabilityHints: boolean;
};

export type GlassValidationMessage = {
  type: "info" | "warning" | "error";
  message: string;
  field?: string;
};

export type GlassPreset = {
  id: string;
  name: string;
  description: string;
  componentType: GlassComponentType;
  state: GlassmorphismState;
};
