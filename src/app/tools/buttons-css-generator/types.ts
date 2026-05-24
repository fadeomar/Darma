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

export type ButtonHoverEffect = "lift" | "glow" | "darken" | "scale" | "none";
export type IconPosition = "left" | "right";

export type ButtonGeneratorConfig = {
  variant: ButtonVariant;
  text: string;
  fontSize: number;
  fontWeight: number;
  radius: number;
  paddingX: number;
  paddingY: number;
  shadow: number;
  background: string;
  background2: string;
  textColor: string;
  borderColor: string;
  hoverEffect: ButtonHoverEffect;
  activeEffect: boolean;
  disabled: boolean;
  iconPosition: IconPosition;
  fullWidth: boolean;
};

export type ButtonPreset = {
  id: string;
  name: string;
  description: string;
  config: ButtonGeneratorConfig;
};
