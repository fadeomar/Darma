import type { ClampInput, ClampPropertyPreset, ClampToken, PresetOption } from "./types";

export const PROPERTY_PRESETS: PresetOption<ClampPropertyPreset>[] = [
  { value: "font-size", label: "font-size", description: "Fluid typography between two viewport widths." },
  { value: "spacing", label: "spacing", description: "Padding, margin, gap, and section spacing tokens." },
  { value: "width", label: "width", description: "Fluid width, max-width, or component sizing." },
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

export const PRESET_INPUTS: Array<{ label: string; description: string; input: ClampInput }> = [
  { label: "Body text", description: "Readable fluid copy", input: { ...DEFAULT_CLAMP_INPUT, minValue: 1, maxValue: 1.125 } },
  { label: "Hero heading", description: "Large display title", input: { ...DEFAULT_CLAMP_INPUT, minValue: 2, maxValue: 5 } },
  { label: "Section heading", description: "Responsive H2 scale", input: { ...DEFAULT_CLAMP_INPUT, minValue: 1.5, maxValue: 3 } },
  { label: "Card title", description: "Compact component heading", input: { ...DEFAULT_CLAMP_INPUT, minValue: 1.125, maxValue: 1.5 } },
  { label: "Lead paragraph", description: "Larger intro copy", input: { ...DEFAULT_CLAMP_INPUT, minValue: 1.125, maxValue: 1.375 } },
  { label: "Section space", description: "Fluid vertical rhythm", input: { ...DEFAULT_CLAMP_INPUT, property: "padding-block", minValue: 2, maxValue: 6 } },
  { label: "Hero padding", description: "Large landing spacing", input: { ...DEFAULT_CLAMP_INPUT, property: "padding-block", minValue: 3, maxValue: 8 } },
  { label: "Card padding", description: "Responsive card inset", input: { ...DEFAULT_CLAMP_INPUT, property: "padding", minValue: 1, maxValue: 2 } },
  { label: "Card gap", description: "Responsive layout gap", input: { ...DEFAULT_CLAMP_INPUT, property: "gap", minValue: 0.75, maxValue: 2 } },
  { label: "Grid gap", description: "Gallery and dashboard gap", input: { ...DEFAULT_CLAMP_INPUT, property: "gap", minValue: 1, maxValue: 2.5 } },
  { label: "Container", description: "Fluid content width", input: { ...DEFAULT_CLAMP_INPUT, property: "width", minValue: 20, maxValue: 72, unit: "rem" } },
  { label: "Article measure", description: "Readable prose width", input: { ...DEFAULT_CLAMP_INPUT, property: "max-width", minValue: 20, maxValue: 44, unit: "rem" } },
  { label: "Sidebar width", description: "Adaptive sidebar sizing", input: { ...DEFAULT_CLAMP_INPUT, property: "inline-size", minValue: 14, maxValue: 22, unit: "rem" } },
  { label: "Button height", description: "Touch-friendly control size", input: { ...DEFAULT_CLAMP_INPUT, property: "min-block-size", minValue: 2.75, maxValue: 3.25, unit: "rem" } },
  { label: "Icon size", description: "Compact UI sizing", input: { ...DEFAULT_CLAMP_INPUT, property: "inline-size", minValue: 1.5, maxValue: 3 } },
  { label: "Avatar size", description: "Profile image scale", input: { ...DEFAULT_CLAMP_INPUT, property: "inline-size", minValue: 2.5, maxValue: 5 } },
  { label: "Border radius", description: "Fluid corner treatment", input: { ...DEFAULT_CLAMP_INPUT, property: "border-radius", minValue: 0.75, maxValue: 2 } },
  { label: "Logo width", description: "Responsive brand mark", input: { ...DEFAULT_CLAMP_INPUT, property: "inline-size", minValue: 7, maxValue: 12, unit: "rem" } },
];

export const TYPOGRAPHY_TOKENS: ClampToken[] = [
  { ...DEFAULT_CLAMP_INPUT, name: "text-xs", minValue: 0.75, maxValue: 0.875 },
  { ...DEFAULT_CLAMP_INPUT, name: "text-sm", minValue: 0.875, maxValue: 1 },
  { ...DEFAULT_CLAMP_INPUT, name: "text-base", minValue: 1, maxValue: 1.125 },
  { ...DEFAULT_CLAMP_INPUT, name: "text-lg", minValue: 1.125, maxValue: 1.375 },
  { ...DEFAULT_CLAMP_INPUT, name: "text-xl", minValue: 1.375, maxValue: 2 },
  { ...DEFAULT_CLAMP_INPUT, name: "text-2xl", minValue: 1.75, maxValue: 3 },
  { ...DEFAULT_CLAMP_INPUT, name: "text-hero", minValue: 2.25, maxValue: 5 },
];

export const SPACING_TOKENS: ClampToken[] = [
  { ...DEFAULT_CLAMP_INPUT, property: "gap", name: "space-xs", minValue: 0.5, maxValue: 0.75 },
  { ...DEFAULT_CLAMP_INPUT, property: "gap", name: "space-sm", minValue: 0.75, maxValue: 1 },
  { ...DEFAULT_CLAMP_INPUT, property: "gap", name: "space-md", minValue: 1, maxValue: 1.5 },
  { ...DEFAULT_CLAMP_INPUT, property: "gap", name: "space-lg", minValue: 1.5, maxValue: 2.5 },
  { ...DEFAULT_CLAMP_INPUT, property: "padding-block", name: "section-sm", minValue: 2, maxValue: 4 },
  { ...DEFAULT_CLAMP_INPUT, property: "padding-block", name: "section-md", minValue: 3, maxValue: 6 },
  { ...DEFAULT_CLAMP_INPUT, property: "padding-block", name: "section-lg", minValue: 4, maxValue: 9 },
];

export const DEFAULT_TOKENS: ClampToken[] = TYPOGRAPHY_TOKENS;
