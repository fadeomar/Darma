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
  | "premium-noise-glow"
  | "aurora"
  | "floating-orbs"
  | "mesh-glow"
  | "animated-blobs"
  | "neon-waves"
  | "cyber-grid"
  | "liquid-bubbles"
  | "starlight-drift"
  | "sunset-ribbons"
  | "glass-cells"
  | "matrix-rain"
  | "soft-noise-glow";

export type BackgroundShape = "circle" | "soft-square" | "diamond";
export type BlendMode = "screen" | "multiply" | "overlay" | "normal" | "plus-lighter";
export type PreviewMode = "hero" | "cards" | "dashboard" | "empty";

export interface BackgroundPreset {
  id: BackgroundPresetId;
  name: string;
  description: string;
  tags: string[];
  bestFor?: string[];
  searchIntent?: string;
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
  gradientStyle: "radial" | "linear" | "mesh";
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
  gradientStyle: "radial" | "linear" | "mesh";
  isPaused: boolean;
  showContent: boolean;
  previewMode: PreviewMode;
}
