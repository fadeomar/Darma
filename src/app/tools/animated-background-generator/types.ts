export type AnimatedBackgroundType =
  | "gradient-mesh"
  | "floating-blobs"
  | "grid-animation"
  | "particles"
  | "aurora"
  | "noise-overlay"
  | "radial-glow"
  | "conic-gradient"
  | "css-waves"
  | "spotlight";

export type AnimationDirection = "normal" | "reverse" | "alternate";

export type AnimatedBackgroundConfig = {
  type: AnimatedBackgroundType;
  colors: string[];
  backgroundColor: string;
  speed: number;
  blur: number;
  opacity: number;
  colorCount: number;
  direction: AnimationDirection;
  size: number;
};

export type AnimatedBackgroundPreset = {
  id: string;
  name: string;
  description: string;
  config: AnimatedBackgroundConfig;
};
