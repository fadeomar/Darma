// types/animatedBackgroundTypes.ts
export type BackgroundVariant =
  | "particles"
  | "bubbles"
  | "explosion"
  | "custom";

export interface State {
  variant: BackgroundVariant;
  backgroundColor: string;
  particleCount: number;
  particleSize: string;
  particleShape: string;
  colors: string[];
  animationType: string;
  animationDuration: string;
  animationTiming: string;
  opacity?: number; // New for custom variant
  speed?: number; // New for custom variant
  morphToCircle?: boolean; // For bubbles
  maxScale?: number; // For explosion
  fadeOut?: boolean;
}

export type BackgroundShape = "circle" | "soft-square" | "diamond";
export type BlendMode = "screen" | "plus-lighter" | "overlay" | "normal" | "multiply";
export type PreviewMode = "hero" | "cards" | "dashboard" | "empty";
export type GradientStyle = "mesh" | "linear" | "radial";
export type BackgroundPresetId = string;

export type BackgroundPreset = {
  id: BackgroundPresetId;
  name: string;
  description: string;
  tags: string[];
  bestFor: string[];
  searchIntent: string;
  seed: number;
  colors: string[];
  background: string;
  shape: BackgroundShape;
  particleCount: number;
  minSize: number;
  maxSize: number;
  blur: number;
  opacity: number;
  speed: number;
  intensity: number;
  glow: number;
  blendMode: BlendMode;
  borderRadius: number;
  gradientStyle: GradientStyle;
};

export type AnimatedBackgroundState = {
  presetId: BackgroundPresetId;
  seed: number;
  colors: string[];
  background: string;
  shape: BackgroundShape;
  particleCount: number;
  minSize: number;
  maxSize: number;
  blur: number;
  opacity: number;
  speed: number;
  intensity: number;
  glow: number;
  blendMode: BlendMode;
  borderRadius: number;
  gradientStyle: GradientStyle;
  isPaused: boolean;
  showContent: boolean;
  previewMode: PreviewMode;
};

export type ParticleData = {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  rotate: number;
  color: string;
  opacity: number;
};
