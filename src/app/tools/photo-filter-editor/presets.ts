import { createDefaultFilterState } from "./filters";
import type { FilterPreset, FilterPresetCategory, FilterState } from "./types";

function withFilters(overrides: Partial<FilterState>): FilterState {
  return { ...createDefaultFilterState(), ...overrides };
}

export const PRESET_CATEGORIES: { id: "all" | FilterPresetCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "essentials", label: "Essentials" },
  { id: "portrait", label: "Portrait" },
  { id: "film", label: "Film" },
  { id: "cinematic", label: "Cinematic" },
  { id: "vintage", label: "Vintage" },
  { id: "bw", label: "B&W" },
  { id: "moody", label: "Moody" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
  { id: "creative", label: "Creative" },
];

export const FILTER_PRESETS: FilterPreset[] = [
  { id: "original", name: "Original", description: "No adjustments.", category: "essentials", filters: createDefaultFilterState() },
  { id: "clean", name: "Clean", description: "Small lift with natural color.", category: "essentials", filters: withFilters({ brightness: 1.04, contrast: 1.04, vibrance: 10 }) },
  { id: "bright", name: "Bright", description: "Airy and crisp for everyday photos.", category: "essentials", filters: withFilters({ exposure: 0.2, brightness: 1.05, shadows: 12, vibrance: 8 }) },
  { id: "punch", name: "Punch", description: "Stronger contrast and color.", category: "essentials", filters: withFilters({ contrast: 1.18, saturate: 1.12, vibrance: 16, blacks: -8 }) },

  { id: "soft-portrait", name: "Soft Portrait", description: "Soft contrast and gentle warmth.", category: "portrait", filters: withFilters({ contrast: 0.93, brightness: 1.05, temperature: 10, highlights: -8, shadows: 12, fade: 0.04 }) },
  { id: "studio-skin", name: "Studio Skin", description: "Balanced portrait tone with protected highlights.", category: "portrait", filters: withFilters({ exposure: 0.12, contrast: 1.03, highlights: -14, shadows: 8, vibrance: 7, temperature: 5 }) },
  { id: "warm-portrait", name: "Warm Portrait", description: "Warm flattering portrait grade.", category: "portrait", filters: withFilters({ brightness: 1.03, saturate: 1.04, temperature: 18, tint: 5, highlights: -10 }) },

  { id: "film-100", name: "Film 100", description: "Fine-grain daylight film feel.", category: "film", filters: withFilters({ contrast: 0.96, saturate: 1.06, temperature: 4, fade: 0.08, grain: 0.16 }) },
  { id: "film-400", name: "Film 400", description: "Warm grain with richer shadows.", category: "film", filters: withFilters({ contrast: 1.08, saturate: 0.96, temperature: 10, shadows: -5, grain: 0.28, fade: 0.05 }) },
  { id: "cross-process", name: "Cross Process", description: "Punchy shifted film color.", category: "film", filters: withFilters({ contrast: 1.16, saturate: 1.24, hueRotate: 10, tint: -10, highlights: 5, grain: 0.12 }) },

  { id: "teal-orange", name: "Teal & Orange", description: "Cinematic warm highlights and cool shadows.", category: "cinematic", filters: withFilters({ contrast: 1.14, saturate: 1.08, temperature: 8, tint: -8, shadows: -8, highlights: -8, hueRotate: 354, vignette: 0.12 }) },
  { id: "dark-cinema", name: "Dark Cinema", description: "Deep blacks and restrained color.", category: "cinematic", filters: withFilters({ exposure: -0.22, contrast: 1.18, saturate: 0.84, highlights: -20, shadows: -14, blacks: -15, vignette: 0.22 }) },
  { id: "blockbuster", name: "Blockbuster", description: "Bold contrast with dramatic color.", category: "cinematic", filters: withFilters({ contrast: 1.24, saturate: 1.12, vibrance: 12, temperature: 5, blacks: -12, vignette: 0.16 }) },

  { id: "sepia", name: "Sepia", description: "Classic warm vintage tone.", category: "vintage", filters: withFilters({ sepia: 0.8, contrast: 1.06, brightness: 1.03, fade: 0.06 }) },
  { id: "vintage", name: "Vintage", description: "Faded warm film look.", category: "vintage", filters: withFilters({ sepia: 0.34, saturate: 1.08, contrast: 0.9, brightness: 1.06, grain: 0.16, fade: 0.15 }) },
  { id: "polaroid", name: "Polaroid", description: "Soft instant-film color.", category: "vintage", filters: withFilters({ brightness: 1.06, contrast: 0.92, saturate: 0.94, temperature: 12, fade: 0.12, grain: 0.1 }) },
  { id: "retro-90s", name: "90s Retro", description: "Muted, warm and slightly hazy.", category: "vintage", filters: withFilters({ contrast: 0.94, saturate: 0.88, temperature: 9, tint: 5, fade: 0.18, grain: 0.2 }) },

  { id: "grayscale", name: "Classic B&W", description: "Clean black and white.", category: "bw", filters: withFilters({ grayscale: 1 }) },
  { id: "noir", name: "Noir", description: "High-contrast black and white.", category: "bw", filters: withFilters({ grayscale: 1, contrast: 1.36, brightness: 0.96, blacks: -10, vignette: 0.18 }) },
  { id: "matte-bw", name: "Matte B&W", description: "Soft lifted monochrome.", category: "bw", filters: withFilters({ grayscale: 1, contrast: 0.94, fade: 0.16, grain: 0.12 }) },

  { id: "forest", name: "Forest", description: "Muted natural greens and deep shadows.", category: "moody", filters: withFilters({ contrast: 1.12, saturate: 0.82, temperature: -4, tint: -8, shadows: -10, vignette: 0.14 }) },
  { id: "urban", name: "Urban", description: "Cool concrete tones and crisp contrast.", category: "moody", filters: withFilters({ contrast: 1.16, saturate: 0.78, temperature: -12, blacks: -10, grain: 0.1 }) },
  { id: "desert-dust", name: "Desert Dust", description: "Muted sand-colored matte look.", category: "moody", filters: withFilters({ saturate: 0.82, temperature: 15, tint: 3, fade: 0.13, grain: 0.12 }) },

  { id: "golden-hour", name: "Golden Hour", description: "Warm sunlit highlights.", category: "warm", filters: withFilters({ exposure: 0.1, temperature: 28, tint: 3, saturate: 1.08, highlights: -8 }) },
  { id: "summer", name: "Summer", description: "Bright warm color for travel and food.", category: "warm", filters: withFilters({ brightness: 1.06, saturate: 1.12, vibrance: 16, temperature: 16, shadows: 8 }) },
  { id: "sunset", name: "Sunset", description: "Rich warm color with deeper contrast.", category: "warm", filters: withFilters({ contrast: 1.1, saturate: 1.18, temperature: 24, tint: 8, highlights: -12, vignette: 0.08 }) },

  { id: "blue-hour", name: "Blue Hour", description: "Cool evening tone.", category: "cool", filters: withFilters({ temperature: -26, tint: 2, contrast: 1.06, saturate: 0.96, shadows: 6 }) },
  { id: "arctic", name: "Arctic", description: "Clean bright cool grade.", category: "cool", filters: withFilters({ exposure: 0.08, temperature: -20, saturate: 0.88, highlights: -8, whites: 6 }) },
  { id: "steel", name: "Steel", description: "Cool desaturated modern look.", category: "cool", filters: withFilters({ contrast: 1.14, saturate: 0.72, temperature: -16, blacks: -8 }) },

  { id: "dreamy", name: "Dreamy", description: "Soft, bright and hazy.", category: "creative", filters: withFilters({ blur: 0.7, brightness: 1.08, saturate: 1.08, contrast: 0.94, fade: 0.08 }) },
  { id: "duotone", name: "Duotone", description: "Graphic high-color treatment.", category: "creative", filters: withFilters({ grayscale: 0.35, contrast: 1.22, saturate: 1.7, hueRotate: 305, tint: 20 }) },
  { id: "negative", name: "Negative", description: "Classic color negative.", category: "creative", filters: withFilters({ invert: 1 }) },
  { id: "washed", name: "Washed", description: "Low-contrast faded editorial look.", category: "creative", filters: withFilters({ contrast: 0.82, saturate: 0.78, fade: 0.22, highlights: -8 }) },
];

export const DEFAULT_PRESET_ID = "original";

export function getFilterPreset(id: string): FilterPreset | undefined {
  return FILTER_PRESETS.find((preset) => preset.id === id);
}

export function mixPresetFilters(preset: FilterState, strength: number): FilterState {
  const neutral = createDefaultFilterState();
  const amount = Math.min(1, Math.max(0, strength));
  const next = {} as FilterState;
  (Object.keys(neutral) as (keyof FilterState)[]).forEach((key) => {
    const start = neutral[key];
    next[key] = start + (preset[key] - start) * amount;
  });
  return next;
}
