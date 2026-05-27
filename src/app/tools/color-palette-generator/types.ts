export type HarmonyMode =
  | "monochromatic"
  | "analogous"
  | "complementary"
  | "split-complementary"
  | "triadic"
  | "tetradic"
  | "shades"
  | "tints";

export type PaletteSize = 3 | 5 | 7 | 9;
export type PaletteUiMode = "light" | "dark";
export type WcagRating = "Fail" | "AA" | "AAA";

export type PaletteOptions = {
  harmony: HarmonyMode;
  size: PaletteSize;
  lockedColors?: Record<number, PaletteColor>;
};

export type PaletteColor = {
  id: string;
  name: string;
  hex: string;
  rgb: string;
  hsl: string;
  hue: number;
  saturation: number;
  lightness: number;
  locked?: boolean;
};

export type ContrastPair = {
  label: string;
  foreground: string;
  background: string;
  ratio: number;
  rating: WcagRating;
};
