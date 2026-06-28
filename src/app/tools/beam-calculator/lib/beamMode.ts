import type { BeamModel, Support } from "./beamTypes";

// Guided "beam type" modes that keep ordinary users from accidentally building
// unsupported configurations. "advanced" unlocks the raw support editor.
export type BeamMode = "simply-supported" | "cantilever-left" | "cantilever-right" | "advanced";

export const BEAM_MODE_OPTIONS: { value: BeamMode; label: string }[] = [
  { value: "simply-supported", label: "Simply supported" },
  { value: "cantilever-left", label: "Cantilever left" },
  { value: "cantilever-right", label: "Cantilever right" },
  { value: "advanced", label: "Advanced custom" },
];

function near(a: number, b: number, length: number): boolean {
  return Math.abs(a - b) <= Math.max(1e-6, length * 1e-4);
}

/** Infer which guided mode (if any) a model's supports correspond to. */
export function deriveBeamMode(model: BeamModel): BeamMode {
  const { length } = model;
  const fixed = model.supports.filter((s) => s.type === "fixed");
  const pinned = model.supports.filter((s) => s.type === "pin" || s.type === "roller");

  if (fixed.length === 1 && pinned.length === 0) {
    if (near(fixed[0].x, 0, length)) return "cantilever-left";
    if (near(fixed[0].x, length, length)) return "cantilever-right";
    return "advanced";
  }
  if (fixed.length === 0 && pinned.length === 2) {
    const xs = pinned.map((p) => p.x).sort((a, b) => a - b);
    if (near(xs[0], 0, length) && near(xs[1], length, length)) return "simply-supported";
    return "advanced";
  }
  return "advanced";
}

/** Supports a guided mode should produce for a given span. */
export function supportsForMode(mode: BeamMode, length: number, existing: Support[] = []): Support[] {
  switch (mode) {
    case "simply-supported":
      return [
        { id: "A", type: "pin", x: 0 },
        { id: "B", type: "roller", x: length },
      ];
    case "cantilever-left":
      return [{ id: "A", type: "fixed", x: 0 }];
    case "cantilever-right":
      return [{ id: "A", type: "fixed", x: length }];
    case "advanced":
      return existing;
  }
}

export function isGuidedMode(mode: BeamMode): boolean {
  return mode !== "advanced";
}
