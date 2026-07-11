export type ButtonVariant =
  | "solid"
  | "outline"
  | "ghost"
  | "gradient"
  | "glass"
  | "neumorphic"
  | "three-d"
  | "icon"
  | "loading"
  | "pill";

export type ButtonHoverEffect = "lift" | "glow" | "darken" | "scale" | "slide" | "none";
export type IconPosition = "left" | "right";

export type ButtonGeneratorConfig = {
  variant: ButtonVariant;
  className: string;
  text: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  radius: number;
  paddingX: number;
  paddingY: number;
  minWidth: number;
  shadow: number;
  background: string;
  background2: string;
  textColor: string;
  borderColor: string;
  hoverEffect: ButtonHoverEffect;
  activeEffect: boolean;
  disabled: boolean;
  iconPosition: IconPosition;
  iconSymbol: string;
  uppercase: boolean;
  fullWidth: boolean;
  includeFocusRing: boolean;
  includeReducedMotion: boolean;
};

export type ButtonPreset = {
  id: string;
  name: string;
  description: string;
  config: ButtonGeneratorConfig;
};
