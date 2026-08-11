export type ButtonStyle =
  | "solid"
  | "outline"
  | "ghost"
  | "gradient"
  | "glass"
  | "neumorphic"
  | "three-d";

export type ButtonShape = "square" | "rounded" | "pill";
export type ButtonContentMode = "text" | "text-icon" | "icon-only";
export type ButtonHoverEffect =
  | "lift"
  | "glow"
  | "darken"
  | "scale"
  | "slide"
  | "shine"
  | "fill"
  | "pulse"
  | "bounce"
  | "icon-shift"
  | "none";
export type ButtonMotionEasing = "ease" | "ease-out" | "ease-in-out" | "linear";
export type IconPosition = "left" | "right";
export type ButtonBorderStyle = "solid" | "dashed" | "dotted" | "double";
export type ButtonPresetCategory =
  | "popular"
  | "minimal"
  | "cta"
  | "gradient"
  | "glass"
  | "animated"
  | "3d"
  | "icon"
  | "loading";
export type PreviewBackground = "light" | "dark" | "gradient" | "custom";
export type PreviewContext = "canvas" | "landing" | "form" | "pricing" | "checkout";

export type ButtonGeneratorConfig = {
  style: ButtonStyle;
  shape: ButtonShape;
  contentMode: ButtonContentMode;
  loading: boolean;
  className: string;
  text: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  radius: number;
  paddingX: number;
  paddingY: number;
  minWidth: number;
  background: string;
  background2: string;
  gradientAngle: number;
  textColor: string;
  borderEnabled: boolean;
  borderWidth: number;
  borderStyle: ButtonBorderStyle;
  borderColor: string;
  shadowEnabled: boolean;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowSpread: number;
  shadowColor: string;
  shadowOpacity: number;
  shadowInset: boolean;
  hoverEffect: ButtonHoverEffect;
  motionDuration: number;
  motionEasing: ButtonMotionEasing;
  customizeHoverState: boolean;
  hoverBackground: string;
  hoverTextColor: string;
  hoverBorderColor: string;
  hoverTranslateY: number;
  hoverScale: number;
  hoverShadowY: number;
  hoverShadowBlur: number;
  customizeActiveState: boolean;
  activeBackground: string;
  activeTextColor: string;
  activeBorderColor: string;
  activeTranslateY: number;
  activeScale: number;
  activeEffect: boolean;
  disabled: boolean;
  disabledOpacity: number;
  iconPosition: IconPosition;
  iconSymbol: string;
  uppercase: boolean;
  fullWidth: boolean;
  mobileFullWidth: boolean;
  includeFocusRing: boolean;
  focusRingColor: string;
  focusRingWidth: number;
  focusRingOffset: number;
  includeReducedMotion: boolean;
  customCss: string;
};

export type ButtonPreset = {
  id: string;
  name: string;
  description: string;
  category: ButtonPresetCategory;
  tags: string[];
  featured?: boolean;
  cssOnly?: boolean;
  recommendedBackground?: PreviewBackground;
  config: ButtonGeneratorConfig;
};
