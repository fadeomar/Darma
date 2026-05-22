import type { ClampInput, ClampPropertyPreset, ClampToken, PresetOption } from "./types";

export const PROPERTY_PRESETS: PresetOption<ClampPropertyPreset>[] = [
  { value: "font-size", label: "font-size", description: "Fluid typography between two viewport widths." },
  { value: "spacing", label: "spacing", description: "Generate padding, margin, gap, or section spacing tokens." },
  { value: "width", label: "width", description: "Create a fluid width or max-width value." },
  { value: "custom", label: "custom", description: "Use your own CSS property name." },
];

export const DEFAULT_CLAMP_INPUT: ClampInput = {
  property: "font-size",
  minViewport: 320,
  maxViewport: 1280,
  minValue: 1,
  maxValue: 2.5,
  unit: "rem",
  rootFontSize: 16,
};

export const PRESET_INPUTS: Array<{ label: string; input: ClampInput }> = [
  { label: "Readable body text", input: { ...DEFAULT_CLAMP_INPUT, minValue: 1, maxValue: 1.125 } },
  { label: "Hero heading", input: { ...DEFAULT_CLAMP_INPUT, minValue: 2, maxValue: 5 } },
  { label: "Section spacing", input: { ...DEFAULT_CLAMP_INPUT, property: "padding-block", minValue: 2, maxValue: 6 } },
  { label: "Card gap", input: { ...DEFAULT_CLAMP_INPUT, property: "gap", minValue: 1, maxValue: 2 } },
];

export const DEFAULT_TOKENS: ClampToken[] = [
  { ...DEFAULT_CLAMP_INPUT, name: "text-xs", minValue: 0.75, maxValue: 0.875 },
  { ...DEFAULT_CLAMP_INPUT, name: "text-sm", minValue: 0.875, maxValue: 1 },
  { ...DEFAULT_CLAMP_INPUT, name: "text-md", minValue: 1, maxValue: 1.25 },
  { ...DEFAULT_CLAMP_INPUT, name: "text-lg", minValue: 1.25, maxValue: 1.75 },
  { ...DEFAULT_CLAMP_INPUT, name: "text-xl", minValue: 1.75, maxValue: 2.75 },
  { ...DEFAULT_CLAMP_INPUT, name: "text-2xl", minValue: 2.25, maxValue: 4 },
];
