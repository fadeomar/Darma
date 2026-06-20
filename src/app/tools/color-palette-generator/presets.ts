import type { HarmonyMode, PalettePreset, PaletteSize } from "./types";

export const HARMONY_OPTIONS: Array<{ value: HarmonyMode; label: string; description: string }> = [
  { value: "monochromatic", label: "Monochromatic", description: "One hue with varied saturation and lightness." },
  { value: "analogous", label: "Analogous", description: "Neighboring hues for calm, cohesive UI palettes." },
  { value: "complementary", label: "Complementary", description: "Opposite hues for strong accent contrast." },
  { value: "split-complementary", label: "Split complementary", description: "A base hue plus two softer opposite accents." },
  { value: "triadic", label: "Triadic", description: "Three evenly spaced hues with balanced energy." },
  { value: "tetradic", label: "Tetradic", description: "Two complementary pairs for rich design systems." },
  { value: "shades", label: "Shades", description: "Same hue stepping down through progressively darker tones." },
  { value: "tints", label: "Tints", description: "Same hue stepping up through progressively lighter tones." },
];

export const PALETTE_SIZE_OPTIONS: Array<{ value: PaletteSize; label: string }> = [
  { value: 3, label: "3 colors" },
  { value: 5, label: "5 colors" },
  { value: 7, label: "7 colors" },
  { value: 9, label: "9 colors" },
];

export const STARTER_COLORS = ["#2563EB", "#7C3AED", "#059669", "#EA580C", "#DB2777", "#0F172A", "#0891B2", "#CA8A04"];

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: "website",
    title: "Website palette",
    description: "Balanced colors for landing pages, dashboards, and content sites.",
    baseColor: "#2563EB",
    harmony: "analogous",
    size: 7,
    uiMode: "light",
  },
  {
    id: "social-media",
    title: "Social media palette",
    description: "Energetic tones for posts, thumbnails, and creator graphics.",
    baseColor: "#DB2777",
    harmony: "triadic",
    size: 5,
    uiMode: "light",
  },
  {
    id: "brand",
    title: "Brand palette",
    description: "A flexible identity palette with primary, accent, and support colors.",
    baseColor: "#7C3AED",
    harmony: "split-complementary",
    size: 7,
    uiMode: "light",
  },
  {
    id: "dark-ui",
    title: "Dark UI palette",
    description: "Deep surfaces and readable accents for dark interfaces.",
    baseColor: "#0F172A",
    harmony: "tints",
    size: 7,
    uiMode: "dark",
  },
  {
    id: "light-ui",
    title: "Light UI palette",
    description: "Soft surfaces, borders, and action colors for clean light UIs.",
    baseColor: "#0891B2",
    harmony: "tints",
    size: 7,
    uiMode: "light",
  },
];
