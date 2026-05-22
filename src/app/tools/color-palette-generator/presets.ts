import type { HarmonyMode, PaletteSize } from "./types";

export const HARMONY_OPTIONS: Array<{ value: HarmonyMode; label: string; description: string }> = [
  { value: "monochromatic", label: "Monochromatic", description: "One hue with varied saturation and lightness." },
  { value: "analogous", label: "Analogous", description: "Neighboring hues for calm, cohesive UI palettes." },
  { value: "complementary", label: "Complementary", description: "Opposite hues for strong accent contrast." },
  { value: "split-complementary", label: "Split complementary", description: "A base hue plus two softer opposite accents." },
  { value: "triadic", label: "Triadic", description: "Three evenly spaced hues with balanced energy." },
  { value: "tetradic", label: "Tetradic", description: "Two complementary pairs for rich design systems." },
];

export const PALETTE_SIZE_OPTIONS: Array<{ value: PaletteSize; label: string }> = [
  { value: 3, label: "3 colors" },
  { value: 5, label: "5 colors" },
  { value: 7, label: "7 colors" },
  { value: 9, label: "9 colors" },
];

export const STARTER_COLORS = ["#2563EB", "#7C3AED", "#059669", "#EA580C", "#DB2777", "#0F172A", "#0891B2", "#CA8A04"];
