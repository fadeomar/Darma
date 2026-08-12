import type { BrushPreset, PaintSettings } from "../types";

export type BrushPresetDefinition = {
  id: BrushPreset;
  label: string;
  hint: string;
  thinning: number;
  smoothing: number;
  streamline: number;
  defaultSize: number;
};

export const BRUSH_PRESETS: BrushPresetDefinition[] = [
  {
    id: "pen",
    label: "Pen",
    hint: "Balanced notes and annotation",
    thinning: 0.45,
    smoothing: 0.6,
    streamline: 0.55,
    defaultSize: 6,
  },
  {
    id: "fineliner",
    label: "Fineliner",
    hint: "Clean, consistent technical lines",
    thinning: 0,
    smoothing: 0.72,
    streamline: 0.72,
    defaultSize: 3,
  },
  {
    id: "marker",
    label: "Marker",
    hint: "Bold strokes with mild dynamics",
    thinning: 0.18,
    smoothing: 0.5,
    streamline: 0.45,
    defaultSize: 14,
  },
  {
    id: "brush",
    label: "Brush",
    hint: "Expressive pressure-sensitive strokes",
    thinning: 0.72,
    smoothing: 0.58,
    streamline: 0.48,
    defaultSize: 12,
  },
];

export function getBrushPreset(id: BrushPreset): BrushPresetDefinition {
  return BRUSH_PRESETS.find((preset) => preset.id === id) ?? BRUSH_PRESETS[0];
}

export function getBrushStrokeOptions(settings: PaintSettings, hasRealPressure: boolean) {
  const preset = getBrushPreset(settings.brushPreset);
  const stabilizer = Math.min(1, Math.max(0, settings.stabilizer));
  return {
    size: settings.size,
    thinning: settings.dynamicWidth ? preset.thinning : 0,
    smoothing: Math.min(1, preset.smoothing + stabilizer * 0.2),
    streamline: Math.min(1, preset.streamline + stabilizer * 0.3),
    simulatePressure: settings.dynamicWidth && !hasRealPressure,
    start: { cap: true, taper: 0 },
    end: { cap: true, taper: 0 },
    last: true,
  };
}
