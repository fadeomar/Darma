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
