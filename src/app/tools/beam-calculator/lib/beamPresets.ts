import type { BeamModel } from "./beamTypes";

export type BeamPreset = {
  id: string;
  name: string;
  description: string;
  model: BeamModel;
};

// Each preset is a complete, valid, ready-to-solve scenario.
export const BEAM_PRESETS: BeamPreset[] = [
  {
    id: "ss-center-point",
    name: "Simply supported + center point load",
    description: "Pin/roller span with a single downward load at midspan.",
    model: {
      length: 10,
      unitSystem: "metric",
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 10 },
      ],
      loads: [{ id: "P1", kind: "point", x: 5, magnitude: 10, direction: "down" }],
    },
  },
  {
    id: "ss-two-point",
    name: "Simply supported + two point loads",
    description: "Span with two downward point loads at the third points.",
    model: {
      length: 9,
      unitSystem: "metric",
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 9 },
      ],
      loads: [
        { id: "P1", kind: "point", x: 3, magnitude: 8, direction: "down" },
        { id: "P2", kind: "point", x: 6, magnitude: 8, direction: "down" },
      ],
    },
  },
  {
    id: "ss-full-udl",
    name: "Simply supported + full UDL",
    description: "Uniformly distributed load across the whole span.",
    model: {
      length: 10,
      unitSystem: "metric",
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 10 },
      ],
      loads: [{ id: "W1", kind: "udl", start: 0, end: 10, magnitude: 2, direction: "down" }],
    },
  },
  {
    id: "cantilever-tip",
    name: "Cantilever + tip load",
    description: "Fixed at the left end with a downward load at the free tip.",
    model: {
      length: 5,
      unitSystem: "metric",
      supports: [{ id: "A", type: "fixed", x: 0 }],
      loads: [{ id: "P1", kind: "point", x: 5, magnitude: 10, direction: "down" }],
    },
  },
  {
    id: "cantilever-udl",
    name: "Cantilever + UDL",
    description: "Fixed at the left end with a uniform load over the full length.",
    model: {
      length: 5,
      unitSystem: "metric",
      supports: [{ id: "A", type: "fixed", x: 0 }],
      loads: [{ id: "W1", kind: "udl", start: 0, end: 5, magnitude: 2, direction: "down" }],
    },
  },
  {
    id: "custom-blank",
    name: "Custom blank beam",
    description: "Start fresh with a clean simply supported span and no loads.",
    model: {
      length: 6,
      unitSystem: "metric",
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 6 },
      ],
      loads: [],
    },
  },
];

export const DEFAULT_PRESET_ID = "ss-center-point";

export function getPreset(id: string): BeamPreset | undefined {
  return BEAM_PRESETS.find((preset) => preset.id === id);
}

// Deep clone so consumers can mutate state without touching the preset source.
export function clonePresetModel(preset: BeamPreset): BeamModel {
  return {
    length: preset.model.length,
    unitSystem: preset.model.unitSystem,
    supports: preset.model.supports.map((s) => ({ ...s })),
    loads: preset.model.loads.map((l) => ({ ...l })),
  };
}
