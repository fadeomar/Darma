import { createDefaultFilterState } from "./filters";
import type { FilterPreset, FilterState } from "./types";

function withFilters(overrides: Partial<FilterState>): FilterState {
  return { ...createDefaultFilterState(), ...overrides };
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: "original", name: "Original", description: "No adjustments.", filters: createDefaultFilterState() },
  { id: "grayscale", name: "Grayscale", description: "Full black and white.", filters: withFilters({ grayscale: 1 }) },
  { id: "sepia", name: "Sepia", description: "Warm vintage tone.", filters: withFilters({ sepia: 0.8, contrast: 1.1, brightness: 1.05 }) },
  { id: "vintage", name: "Vintage", description: "Faded film look.", filters: withFilters({ sepia: 0.4, saturate: 1.3, contrast: 0.9, brightness: 1.1 }) },
  { id: "cool", name: "Cool", description: "Cool blue cast.", filters: withFilters({ hueRotate: 200, saturate: 1.2, brightness: 1.05 }) },
  { id: "warm", name: "Warm", description: "Warm golden cast.", filters: withFilters({ hueRotate: 20, saturate: 1.3, sepia: 0.2 }) },
  { id: "high-contrast", name: "High contrast", description: "Punchy contrast and saturation.", filters: withFilters({ contrast: 1.5, saturate: 1.4 }) },
  { id: "noir", name: "Noir", description: "High-contrast black and white.", filters: withFilters({ grayscale: 1, contrast: 1.4, brightness: 0.95 }) },
  { id: "invert", name: "Invert", description: "Negative colors.", filters: withFilters({ invert: 1 }) },
  { id: "dreamy", name: "Dreamy", description: "Soft, bright, and hazy.", filters: withFilters({ blur: 1.2, brightness: 1.15, saturate: 1.2, contrast: 0.95 }) },
];

export const DEFAULT_PRESET_ID = "original";

export function getFilterPreset(id: string): FilterPreset | undefined {
  return FILTER_PRESETS.find((preset) => preset.id === id);
}
