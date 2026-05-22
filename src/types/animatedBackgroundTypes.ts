// Shared types for both the legacy animated background generator UI and the
// newer preset-based animated background generator components.

export type BackgroundVariant = "particles" | "bubbles" | "explosion" | "custom";

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
  opacity?: number;
  speed?: number;
  morphToCircle?: boolean;
  maxScale?: number;
  fadeOut?: boolean;
}

export type BackgroundPresetId =
  | "saas-hero-gradient"
  | "ai-neural-glow"
  | "portfolio-minimal-glow"
  | "dark-dashboard-ambient"
  | "startup-launch-mesh"
  | "neon-cyber-grid"
  | "galaxy-particle-field"
  | "liquid-blur-bubbles"
  | "designer-hero-section"
  | "fintech-data-grid"
  | "agency-sunset-ribbons"
  | "developer-terminal-matrix"
  | "glassmorphism-orbs"
  | "premium-noise-glow";

export type BackgroundShape = "circle" | "soft-square" | "diamond";
export type BlendMode = "screen" | "plus-lighter" | "overlay" | "normal" | "multiply";
export type GradientStyle = "mesh" | "linear" | "radial";
export type PreviewMode = "hero" | "cards" | "dashboard" | "empty";

export interface BackgroundPreset {
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
}

export interface AnimatedBackgroundState {
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
}

export interface ParticleData {
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
}
