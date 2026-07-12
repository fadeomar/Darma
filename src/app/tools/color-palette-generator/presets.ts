import type { HarmonyMode, PalettePreset, PaletteSize } from "./types";

export const HARMONY_OPTIONS: Array<{ value: HarmonyMode; label: string; description: string }> = [
  { value: "monochromatic", label: "Monochromatic", description: "One hue with varied saturation and lightness. Best for calm UI systems." },
  { value: "analogous", label: "Analogous", description: "Neighboring hues for cohesive websites, dashboards, and brand visuals." },
  { value: "complementary", label: "Complementary", description: "Opposite hues for strong accent contrast and hero sections." },
  { value: "split-complementary", label: "Split complementary", description: "A base hue plus two softer opposite accents. Flexible for branding." },
  { value: "triadic", label: "Triadic", description: "Three evenly spaced hues with balanced visual energy." },
  { value: "tetradic", label: "Tetradic", description: "Two complementary pairs for rich campaigns and illustrations." },
  { value: "shades", label: "Shades", description: "Same hue stepping down through progressively darker tones." },
  { value: "tints", label: "Tints", description: "Same hue stepping up through progressively lighter tones." },
];

export const PALETTE_SIZE_OPTIONS: Array<{ value: PaletteSize; label: string }> = [
  { value: 3, label: "3 colors" },
  { value: 5, label: "5 colors" },
  { value: 7, label: "7 colors" },
  { value: 9, label: "9 colors" },
];

export const STARTER_COLORS = [
  "#2563EB",
  "#7C3AED",
  "#059669",
  "#EA580C",
  "#DB2777",
  "#0F172A",
  "#0891B2",
  "#CA8A04",
  "#DC2626",
  "#0D9488",
];

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: "website",
    title: "Website UI",
    description: "Balanced colors for landing pages, dashboards, and content sites.",
    baseColor: "#2563EB",
    harmony: "analogous",
    size: 7,
    uiMode: "light",
    tags: ["UI", "SaaS"],
  },
  {
    id: "social-media",
    title: "Social post",
    description: "Energetic tones for posts, thumbnails, and creator graphics.",
    baseColor: "#DB2777",
    harmony: "triadic",
    size: 5,
    uiMode: "light",
    tags: ["Creator", "Bold"],
  },
  {
    id: "brand",
    title: "Brand system",
    description: "A flexible identity palette with primary, accent, and support colors.",
    baseColor: "#7C3AED",
    harmony: "split-complementary",
    size: 7,
    uiMode: "light",
    tags: ["Identity", "Tokens"],
  },
  {
    id: "dark-ui",
    title: "Dark app",
    description: "Deep surfaces and readable accents for dark interfaces.",
    baseColor: "#0F172A",
    harmony: "tints",
    size: 7,
    uiMode: "dark",
    tags: ["Dark", "Product"],
  },
  {
    id: "luxury",
    title: "Luxury editorial",
    description: "Premium warm tones for fashion, packaging, and high-end visuals.",
    baseColor: "#7F1D1D",
    harmony: "analogous",
    size: 5,
    uiMode: "light",
    tags: ["Premium", "Warm"],
  },
  {
    id: "nature",
    title: "Nature brand",
    description: "Organic greens and support colors for wellness, food, and environment.",
    baseColor: "#15803D",
    harmony: "split-complementary",
    size: 7,
    uiMode: "light",
    tags: ["Natural", "Fresh"],
  },
];
