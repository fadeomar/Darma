// Core data model for the Beam Calculator Studio engine.
//
// Sign conventions (kept consistent across the whole engine and surfaced in the UI):
//   - x runs from 0 (left end) to `length` (right end), in length units.
//   - Forces use an UP-positive internal axis. A "down" load of magnitude m
//     becomes an internal vertical force of -m; an "up" load becomes +m.
//   - Support reactions are reported on the same UP-positive axis, so an upward
//     reaction is positive.
//   - Bending moment uses the SAGGING-positive convention (concave up = positive,
//     hogging = negative).
//   - Applied moments are stored CCW-positive ("ccw") / CW-negative ("cw").
//
// Only point loads, uniformly distributed loads (UDL) and applied moments are
// active in this pass. The union below is intentionally open so a future
// triangular/linear load can be added without reshaping the data model.

export type SupportType = "pin" | "roller" | "fixed";
export type LoadDirection = "down" | "up";
export type MomentRotation = "cw" | "ccw";
export type BeamType = "simply-supported" | "cantilever";

export type UnitSystemId = "metric";

export type UnitLabels = {
  length: string; // m
  force: string; // kN
  distributed: string; // kN/m
  moment: string; // kN·m
};

export const UNIT_SYSTEMS: Record<UnitSystemId, UnitLabels> = {
  metric: { length: "m", force: "kN", distributed: "kN/m", moment: "kN·m" },
};

export type Support = {
  id: string;
  type: SupportType;
  x: number;
};

export type PointLoad = {
  id: string;
  kind: "point";
  x: number;
  magnitude: number; // always stored as a positive magnitude
  direction: LoadDirection;
};

export type DistributedLoad = {
  id: string;
  kind: "udl";
  start: number;
  end: number;
  magnitude: number; // intensity per unit length, positive magnitude
  direction: LoadDirection;
};

export type AppliedMoment = {
  id: string;
  kind: "moment";
  x: number;
  magnitude: number; // positive magnitude
  rotation: MomentRotation;
};

export type BeamLoad = PointLoad | DistributedLoad | AppliedMoment;

export type BeamModel = {
  length: number;
  unitSystem: UnitSystemId;
  supports: Support[];
  loads: BeamLoad[];
};

// A single selected/draggable item on the beam preview. udl-start/udl-end/udl-body
// all reference the same UDL load id but target different handles.
export type SelectedItem =
  | { kind: "support"; id: string }
  | { kind: "point"; id: string }
  | { kind: "moment"; id: string }
  | { kind: "udl-start"; id: string }
  | { kind: "udl-end"; id: string }
  | { kind: "udl-body"; id: string };

export function isSameSelection(a: SelectedItem | null, b: SelectedItem | null): boolean {
  if (!a || !b) return a === b;
  return a.kind === b.kind && a.id === b.id;
}

// Whether a selection refers to a given load id (any of its UDL handles).
export function selectionMatchesLoad(selection: SelectedItem | null, loadId: string): boolean {
  return Boolean(selection && selection.id === loadId && selection.kind !== "support");
}

// ---- Analysis result shapes ----

export type Reaction = {
  supportId: string;
  type: SupportType;
  x: number;
  fy: number; // vertical reaction, up-positive
  moment?: number; // reaction moment at a fixed support (sagging-equivalent bending at support)
};

export type DiagramSample = {
  x: number;
  shear: number;
  moment: number;
};

export type KeyStation = {
  x: number;
  shear: number;
  moment: number;
  note: string;
};

export type Extreme = {
  value: number;
  x: number;
};

export type EquilibriumCheck = {
  sumFy: number;
  sumMoment: number;
  balanced: boolean;
  tolerance: number;
};

export type BeamResult = {
  beamType: BeamType;
  reactions: Reaction[];
  samples: DiagramSample[];
  keyStations: KeyStation[];
  maxShear: Extreme; // signed value with largest magnitude
  maxPositiveMoment: Extreme;
  maxNegativeMoment: Extreme;
  maxAbsMoment: Extreme;
  totalAppliedForce: number; // net up-positive applied force
  equilibrium: EquilibriumCheck;
};
