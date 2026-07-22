import { adjustmentsEqual, createDefaultFilterState } from "./lib/adjustments";
import type { FilterPreset, PhotoAdjustments } from "./types";

function withAdjustments(overrides: Partial<PhotoAdjustments>): PhotoAdjustments {
  return { ...createDefaultFilterState(), ...overrides };
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: "original", name: "Original", description: "Neutral starting point.", category: "Essentials", filters: createDefaultFilterState() },
  { id: "auto-pop", name: "Clean Pop", description: "A crisp everyday lift.", category: "Essentials", filters: withAdjustments({ exposure: 0.15, contrast: 1.08, saturate: 1.08, shadows: 12, highlights: -8 }) },
  { id: "soft-light", name: "Soft Light", description: "Open shadows and gentle contrast.", category: "Essentials", filters: withAdjustments({ exposure: 0.1, contrast: 0.94, shadows: 24, highlights: -18, brightness: 1.03 }) },
  { id: "portrait-warm", name: "Warm Portrait", description: "Warm skin-friendly color.", category: "Portrait", filters: withAdjustments({ exposure: 0.12, temperature: 18, contrast: 0.96, shadows: 14, highlights: -12 }) },
  { id: "portrait-airy", name: "Airy Portrait", description: "Bright and low contrast.", category: "Portrait", filters: withAdjustments({ exposure: 0.3, contrast: 0.88, highlights: -10, shadows: 28, saturate: 0.94, temperature: 6 }) },
  { id: "cinematic-teal", name: "Teal Cinema", description: "Cool shadows and punchy contrast.", category: "Cinematic", filters: withAdjustments({ contrast: 1.2, saturate: 0.92, temperature: -12, hueRotate: 188, highlights: -20, shadows: -8 }) },
  { id: "cinematic-fade", name: "Film Fade", description: "Muted cinematic roll-off.", category: "Cinematic", filters: withAdjustments({ contrast: 0.9, saturate: 0.86, highlights: -28, shadows: 22, sepia: 0.08, temperature: 8 }) },
  { id: "vintage", name: "Vintage", description: "Warm faded film character.", category: "Vintage", filters: withAdjustments({ sepia: 0.34, contrast: 0.9, brightness: 1.06, saturate: 0.84, temperature: 12, highlights: -18, shadows: 18 }) },
  { id: "instant", name: "Instant Film", description: "Soft contrast and warm highlights.", category: "Vintage", filters: withAdjustments({ exposure: 0.12, contrast: 0.84, saturate: 0.9, temperature: 14, highlights: -24, shadows: 20 }) },
  { id: "mono", name: "Monochrome", description: "Balanced black and white.", category: "Black & White", filters: withAdjustments({ grayscale: 1, contrast: 1.08, highlights: -12, shadows: 10 }) },
  { id: "noir", name: "Noir", description: "Dark high-contrast monochrome.", category: "Black & White", filters: withAdjustments({ grayscale: 1, contrast: 1.42, exposure: -0.18, highlights: -22, shadows: -18 }) },
  { id: "dreamy", name: "Dreamy", description: "Soft, bright, and hazy.", category: "Creative", filters: withAdjustments({ blur: 0.8, brightness: 1.1, contrast: 0.92, saturate: 1.08, exposure: 0.12, highlights: -12 }) },
  { id: "negative", name: "Negative", description: "Creative inverted color.", category: "Creative", filters: withAdjustments({ invert: 1, hueRotate: 180 }) },
];

export const DEFAULT_PRESET_ID = "original";

export function getFilterPreset(id: string): FilterPreset | undefined {
  return FILTER_PRESETS.find((preset) => preset.id === id);
}

export function findMatchingPresetId(adjustments: PhotoAdjustments): string | null {
  return FILTER_PRESETS.find((preset) => adjustmentsEqual(preset.filters, adjustments, 0.0005))?.id ?? null;
}

export function getPresetCategories(): FilterPreset["category"][] {
  return ["Essentials", "Portrait", "Cinematic", "Vintage", "Black & White", "Creative"];
}
