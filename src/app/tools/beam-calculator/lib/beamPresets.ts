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
    id: "ss-offcenter-point",
    name: "Simply supported + off-center point load",
    description: "A single point load away from midspan to compare unequal support reactions.",
    model: {
      length: 8,
      unitSystem: "metric",
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 8 },
      ],
      loads: [{ id: "P1", kind: "point", x: 2.5, magnitude: 12, direction: "down" }],
    },
  },
  {
    id: "ss-partial-udl",
    name: "Simply supported + partial UDL",
    description: "Uniform load over only part of the span for asymmetric diagrams.",
    model: {
      length: 10,
      unitSystem: "metric",
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 10 },
      ],
      loads: [{ id: "W1", kind: "udl", start: 2, end: 7, magnitude: 3, direction: "down" }],
    },
  },
  {
    id: "ss-point-plus-udl",
    name: "Simply supported + point load + UDL",
    description: "Combined concentrated and distributed loading on one span.",
    model: {
      length: 12,
      unitSystem: "metric",
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 12 },
      ],
      loads: [
        { id: "P1", kind: "point", x: 4, magnitude: 10, direction: "down" },
        { id: "W1", kind: "udl", start: 6, end: 12, magnitude: 2, direction: "down" },
      ],
    },
  },
  {
    id: "ss-applied-moment",
    name: "Simply supported + applied moment",
    description: "A concentrated clockwise moment to study reaction and BMD changes.",
    model: {
      length: 8,
      unitSystem: "metric",
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 8 },
      ],
      loads: [{ id: "M1", kind: "moment", x: 4, magnitude: 14, rotation: "cw" }],
    },
  },
  {
    id: "ss-upward-point",
    name: "Simply supported + upward point load",
    description: "An upward force example for checking sign conventions and reactions.",
    model: {
      length: 7,
      unitSystem: "metric",
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 7 },
      ],
      loads: [{ id: "P1", kind: "point", x: 3, magnitude: 6, direction: "up" }],
    },
  },
  {
    id: "short-span-service",
    name: "Short span service-load example",
    description: "A compact 3 m span with a modest full-width UDL for quick classroom checks.",
    model: {
      length: 3,
      unitSystem: "metric",
      supports: [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: 3 },
      ],
      loads: [{ id: "W1", kind: "udl", start: 0, end: 3, magnitude: 4, direction: "down" }],
    },
  },
  {
    id: "cantilever-mid-point",
    name: "Cantilever + interior point load",
    description: "Fixed-left beam with a point load before the free end.",
    model: {
      length: 6,
      unitSystem: "metric",
      supports: [{ id: "A", type: "fixed", x: 0 }],
      loads: [{ id: "P1", kind: "point", x: 3.5, magnitude: 9, direction: "down" }],
    },
  },
  {
    id: "cantilever-partial-udl",
    name: "Cantilever + partial UDL",
    description: "Distributed load applied only to the outer half of a cantilever.",
    model: {
      length: 6,
      unitSystem: "metric",
      supports: [{ id: "A", type: "fixed", x: 0 }],
      loads: [{ id: "W1", kind: "udl", start: 3, end: 6, magnitude: 2.5, direction: "down" }],
    },
  },
  {
    id: "cantilever-tip-moment",
    name: "Cantilever + tip moment",
    description: "Pure applied moment at the free end of a cantilever.",
    model: {
      length: 5,
      unitSystem: "metric",
      supports: [{ id: "A", type: "fixed", x: 0 }],
      loads: [{ id: "M1", kind: "moment", x: 5, magnitude: 12, rotation: "cw" }],
    },
  },
  {
    id: "cantilever-combined",
    name: "Cantilever + point load + UDL",
    description: "Combined loading for a richer shear and bending-moment example.",
    model: {
      length: 7,
      unitSystem: "metric",
      supports: [{ id: "A", type: "fixed", x: 0 }],
      loads: [
        { id: "P1", kind: "point", x: 7, magnitude: 8, direction: "down" },
        { id: "W1", kind: "udl", start: 0, end: 4, magnitude: 1.5, direction: "down" },
      ],
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
