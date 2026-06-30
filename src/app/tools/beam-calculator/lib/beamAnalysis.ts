import type {
  AppliedMoment,
  BeamLoad,
  BeamModel,
  BeamResult,
  BeamType,
  DiagramSample,
  DistributedLoad,
  EquilibriumCheck,
  Extreme,
  KeyStation,
  PointLoad,
  Reaction,
  Support,
} from "./beamTypes";
import { clamp, roundTo } from "./beamFormatting";

const EPS = 1e-9;
const SAMPLE_COUNT = 240;

export type SupportConfig =
  | { kind: "simply-supported"; left: Support; right: Support }
  | { kind: "cantilever"; support: Support };

// Normalised, internal representation of every effect acting on the beam,
// expressed on the UP-positive force axis and CCW-positive moment axis.
type PointForce = { x: number; fy: number };
type UdlSegment = { start: number; end: number; w: number }; // w: up-positive intensity
type MomentEffect = { x: number; m: number }; // m: CCW-positive

function loadSign(direction: "down" | "up"): number {
  return direction === "up" ? 1 : -1;
}

function momentSign(rotation: "cw" | "ccw"): number {
  return rotation === "ccw" ? 1 : -1;
}

function isPoint(load: BeamLoad): load is PointLoad {
  return load.kind === "point";
}
function isUdl(load: BeamLoad): load is DistributedLoad {
  return load.kind === "udl";
}
function isMoment(load: BeamLoad): load is AppliedMoment {
  return load.kind === "moment";
}

/**
 * Decide which determinate beam configuration the supports describe.
 * Returns null when the configuration is not supported by this pass
 * (the caller turns that into a friendly message).
 */
export function classifySupports(supports: Support[]): SupportConfig | null {
  const sorted = [...supports].sort((a, b) => a.x - b.x);
  const fixed = sorted.filter((s) => s.type === "fixed");
  const pinned = sorted.filter((s) => s.type === "pin" || s.type === "roller");

  // Cantilever: exactly one fixed support and nothing else.
  if (fixed.length === 1 && pinned.length === 0) {
    return { kind: "cantilever", support: fixed[0] };
  }

  // Simply supported: exactly two non-fixed supports at distinct positions.
  if (fixed.length === 0 && pinned.length === 2) {
    const [left, right] = pinned;
    if (Math.abs(right.x - left.x) < EPS) return null;
    return { kind: "simply-supported", left, right };
  }

  return null;
}

function collectEffects(loads: BeamLoad[]) {
  const pointForces: PointForce[] = [];
  const udlSegments: UdlSegment[] = [];
  const moments: MomentEffect[] = [];

  for (const load of loads) {
    if (isPoint(load)) {
      pointForces.push({ x: load.x, fy: loadSign(load.direction) * load.magnitude });
    } else if (isUdl(load)) {
      const start = Math.min(load.start, load.end);
      const end = Math.max(load.start, load.end);
      if (end - start > EPS) {
        udlSegments.push({ start, end, w: loadSign(load.direction) * load.magnitude });
      }
    } else if (isMoment(load)) {
      moments.push({ x: load.x, m: momentSign(load.rotation) * load.magnitude });
    }
  }

  return { pointForces, udlSegments, moments };
}

// Net up-positive applied force from all effects.
function sumVerticalForce(p: PointForce[], u: UdlSegment[]): number {
  const point = p.reduce((acc, f) => acc + f.fy, 0);
  const dist = u.reduce((acc, seg) => acc + seg.w * (seg.end - seg.start), 0);
  return point + dist;
}

// Applied moment about the origin (x = 0), CCW-positive.
// Moment of an up force at x about origin = +F * x.
function sumMomentAboutOrigin(p: PointForce[], u: UdlSegment[], m: MomentEffect[]): number {
  const point = p.reduce((acc, f) => acc + f.fy * f.x, 0);
  const dist = u.reduce((acc, seg) => {
    const total = seg.w * (seg.end - seg.start);
    const centroid = (seg.start + seg.end) / 2;
    return acc + total * centroid;
  }, 0);
  const mom = m.reduce((acc, item) => acc + item.m, 0);
  return point + dist + mom;
}

/**
 * Evaluate shear and bending moment at station x by summing every effect to the
 * left of the cut. `inclusive` controls whether effects located exactly at x are
 * counted — this lets us capture the jump on either side of point loads/supports.
 *
 *   shear(x)  = Σ F_up (left of x)                         [up-positive]
 *   moment(x) = Σ F_up·(x − p) − Σ m_ccw (left of x)       [sagging-positive]
 */
function evaluate(
  x: number,
  p: PointForce[],
  u: UdlSegment[],
  m: MomentEffect[],
  inclusive: boolean,
): { shear: number; moment: number } {
  const within = (pos: number) => (inclusive ? pos <= x + EPS : pos < x - EPS);

  let shear = 0;
  let moment = 0;

  for (const f of p) {
    if (within(f.x)) {
      shear += f.fy;
      moment += f.fy * (x - f.x);
    }
  }

  for (const seg of u) {
    const covered = clamp(x, seg.start, seg.end) - seg.start;
    if (covered > EPS) {
      const force = seg.w * covered;
      shear += force;
      // Resultant of the covered portion acts at its own centroid.
      const centroid = seg.start + covered / 2;
      moment += force * (x - centroid);
    }
  }

  for (const item of m) {
    if (within(item.x)) moment -= item.m;
  }

  return { shear, moment };
}

function solveReactions(
  config: SupportConfig,
  sumF: number,
  momentOrigin: number,
): { reactions: Reaction[]; reactionForces: PointForce[]; reactionMoments: MomentEffect[] } {
  if (config.kind === "cantilever") {
    const { support } = config;
    const fy = -sumF;
    // ΣM about support: Mr + (momentOrigin − sumF·xs) = 0
    const reactionMoment = -(momentOrigin - sumF * support.x);
    return {
      reactions: [{ supportId: support.id, type: support.type, x: support.x, fy, moment: reactionMoment }],
      reactionForces: [{ x: support.x, fy }],
      reactionMoments: [{ x: support.x, m: reactionMoment }],
    };
  }

  const { left, right } = config;
  const span = right.x - left.x;
  // ΣM about left support: Rr·span + (momentOrigin − sumF·xL) = 0
  const rRight = -(momentOrigin - sumF * left.x) / span;
  const rLeft = -sumF - rRight;
  return {
    reactions: [
      { supportId: left.id, type: left.type, x: left.x, fy: rLeft },
      { supportId: right.id, type: right.type, x: right.x, fy: rRight },
    ],
    reactionForces: [
      { x: left.x, fy: rLeft },
      { x: right.x, fy: rRight },
    ],
    reactionMoments: [],
  };
}

// Geometry + uniform "drawing" stations: enough points for smooth diagrams plus
// every concentrated effect and UDL boundary.
function buildStationSet(model: BeamModel, config: SupportConfig): number[] {
  const set = new Set<number>([0, model.length]);
  for (let i = 0; i <= SAMPLE_COUNT; i += 1) set.add((model.length * i) / SAMPLE_COUNT);

  const add = (x: number) => {
    if (x >= -EPS && x <= model.length + EPS) set.add(clamp(x, 0, model.length));
  };

  if (config.kind === "cantilever") add(config.support.x);
  else {
    add(config.left.x);
    add(config.right.x);
  }
  for (const load of model.loads) {
    if (load.kind === "point" || load.kind === "moment") add(load.x);
    else {
      add(load.start);
      add(load.end);
    }
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * Analysis-critical stations: the exact x where bending moment can reach an
 * extremum inside a distributed-load region — i.e. where the (linear) shear
 * crosses zero between two breakpoints. These are added so the reported max
 * moment is exact, not just the closest 240-point drawing sample.
 */
function findZeroShearStations(
  length: number,
  forces: PointForce[],
  udls: UdlSegment[],
  moments: MomentEffect[],
): number[] {
  const breakpoints = new Set<number>([0, length]);
  const add = (x: number) => {
    if (x >= -EPS && x <= length + EPS) breakpoints.add(clamp(x, 0, length));
  };
  forces.forEach((f) => add(f.x));
  moments.forEach((m) => add(m.x));
  udls.forEach((seg) => {
    add(seg.start);
    add(seg.end);
  });

  const sorted = [...breakpoints].sort((a, b) => a - b);
  const result: number[] = [];

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (b - a < EPS) continue;
    const mid = (a + b) / 2;
    // Net distributed intensity active across this sub-interval = the shear slope.
    const slope = udls.reduce((acc, seg) => (seg.start <= mid + EPS && seg.end >= mid - EPS ? acc + seg.w : acc), 0);
    if (Math.abs(slope) < EPS) continue;
    // Shear just to the right of a, then V(x) = shearAtA + slope·(x − a).
    const shearAtA = evaluate(a, forces, udls, moments, true).shear;
    const xZero = a - shearAtA / slope;
    if (xZero > a + EPS && xZero < b - EPS) result.push(xZero);
  }

  return result;
}

/**
 * Physically meaningful (internal) value to report at a station, handling the
 * one-sided limits at beam boundaries and concentrated discontinuities:
 *   - left boundary  → right-hand limit (beam lies to the right)
 *   - right boundary → left-hand limit  (beam lies to the left)
 *   - interior       → the side with the larger |moment| (tie: larger |shear|)
 */
function reportedAt(
  x: number,
  length: number,
  forces: PointForce[],
  udls: UdlSegment[],
  moments: MomentEffect[],
): { shear: number; moment: number } {
  const right = evaluate(x, forces, udls, moments, true);
  if (x <= EPS) return right;
  const left = evaluate(x, forces, udls, moments, false);
  if (x >= length - EPS) return left;
  if (Math.abs(right.moment) > Math.abs(left.moment) + EPS) return right;
  if (Math.abs(left.moment) > Math.abs(right.moment) + EPS) return left;
  return Math.abs(right.shear) >= Math.abs(left.shear) ? right : left;
}

function bestExtreme(samples: DiagramSample[], pick: (s: DiagramSample) => number): Extreme {
  let best: Extreme = { value: 0, x: 0 };
  let found = false;
  for (const s of samples) {
    const v = pick(s);
    if (!found || Math.abs(v) > Math.abs(best.value)) {
      best = { value: v, x: s.x };
      found = true;
    }
  }
  return best;
}

function buildKeyStations(
  model: BeamModel,
  config: SupportConfig,
  p: PointForce[],
  u: UdlSegment[],
  m: MomentEffect[],
  maxAbsMoment: Extreme,
): KeyStation[] {
  const entries: { x: number; note: string }[] = [];
  const push = (x: number, note: string) => entries.push({ x: clamp(x, 0, model.length), note });

  push(0, config.kind === "cantilever" && config.support.x <= EPS ? "Fixed support" : "Left end");
  if (config.kind === "cantilever") push(config.support.x, "Fixed support");
  else {
    push(config.left.x, "Support A");
    push(config.right.x, "Support B");
  }
  for (const load of model.loads) {
    if (load.kind === "point") push(load.x, `Point load ${load.id}`);
    else if (load.kind === "moment") push(load.x, `Applied moment ${load.id}`);
    else {
      push(load.start, `UDL ${load.id} start`);
      push(load.end, `UDL ${load.id} end`);
    }
  }
  push(maxAbsMoment.x, "Max |moment|");
  push(model.length, config.kind === "cantilever" && config.support.x >= model.length - EPS ? "Fixed support" : "Right end");

  // De-duplicate by rounded x, keeping the most descriptive (first) note.
  const byX = new Map<number, { x: number; note: string }>();
  for (const entry of entries) {
    const key = roundTo(entry.x, 4);
    if (!byX.has(key)) byX.set(key, { ...entry, x: key });
  }

  return [...byX.values()]
    .sort((a, b) => a.x - b.x)
    .map((entry) => {
      const { shear, moment } = reportedAt(entry.x, model.length, p, u, m);
      return { x: entry.x, shear, moment, note: entry.note };
    });
}

/**
 * Full analysis. Assumes the model has already been validated; if the support
 * configuration is unsupported it returns null so the caller can show guidance.
 */
export function analyzeBeam(model: BeamModel): BeamResult | null {
  const config = classifySupports(model.supports);
  if (!config) return null;

  const { pointForces, udlSegments, moments } = collectEffects(model.loads);
  const sumF = sumVerticalForce(pointForces, udlSegments);
  const momentOrigin = sumMomentAboutOrigin(pointForces, udlSegments, moments);

  const { reactions, reactionForces, reactionMoments } = solveReactions(config, sumF, momentOrigin);
  if (reactions.some((r) => !Number.isFinite(r.fy) || (r.moment !== undefined && !Number.isFinite(r.moment)))) {
    return null;
  }

  const allForces = [...pointForces, ...reactionForces];
  const allMoments = [...moments, ...reactionMoments];

  // Drawing stations + exact zero-shear extrema inside UDL regions.
  const zeroShear = findZeroShearStations(model.length, allForces, udlSegments, allMoments);
  const stationSet = new Set<number>([...buildStationSet(model, config), ...zeroShear.map((x) => clamp(x, 0, model.length))]);
  const stationXs = [...stationSet].sort((a, b) => a - b);

  const samples: DiagramSample[] = [];
  for (const x of stationXs) {
    const rx = roundTo(x, 6);
    const right = evaluate(x, allForces, udlSegments, allMoments, true);
    if (x <= EPS) {
      // Left boundary: only the right-hand limit is on the beam.
      samples.push({ x: rx, shear: right.shear, moment: right.moment });
      continue;
    }
    const left = evaluate(x, allForces, udlSegments, allMoments, false);
    if (x >= model.length - EPS) {
      // Right boundary: only the left-hand limit is on the beam.
      samples.push({ x: rx, shear: left.shear, moment: left.moment });
      continue;
    }
    // Interior: left-hand limit first, then the right-hand limit if it jumps,
    // so diagrams draw vertical steps and extremes catch both sides.
    samples.push({ x: rx, shear: left.shear, moment: left.moment });
    if (Math.abs(right.shear - left.shear) > EPS || Math.abs(right.moment - left.moment) > EPS) {
      samples.push({ x: rx, shear: right.shear, moment: right.moment });
    }
  }

  const maxShear = bestExtreme(samples, (s) => s.shear);
  const maxAbsMoment = bestExtreme(samples, (s) => s.moment);

  const positiveMoments = samples.filter((s) => s.moment > EPS);
  const negativeMoments = samples.filter((s) => s.moment < -EPS);
  const maxPositiveMoment: Extreme = positiveMoments.length
    ? positiveMoments.reduce((best, s) => (s.moment > best.value ? { value: s.moment, x: s.x } : best), {
        value: -Infinity,
        x: 0,
      })
    : { value: 0, x: 0 };
  const maxNegativeMoment: Extreme = negativeMoments.length
    ? negativeMoments.reduce((best, s) => (s.moment < best.value ? { value: s.moment, x: s.x } : best), {
        value: Infinity,
        x: 0,
      })
    : { value: 0, x: 0 };

  const keyStations = buildKeyStations(model, config, allForces, udlSegments, allMoments, maxAbsMoment);

  // Equilibrium check on the up-positive axis. Both sums should be ~0:
  //   ΣFy   = applied force + reaction forces
  //   ΣM(0) = applied moment about origin + reaction-force moments + reaction moments
  const reactionFy = reactions.reduce((acc, r) => acc + r.fy, 0);
  const reactionMomentSum = reactions.reduce((acc, r) => acc + (r.moment ?? 0), 0);
  const reactionForceMoment = reactionForces.reduce((acc, f) => acc + f.fy * f.x, 0);
  const sumFy = roundTo(sumF + reactionFy, 6);
  const sumMoment = roundTo(momentOrigin + reactionForceMoment + reactionMomentSum, 6);
  const tolerance = roundTo(1e-6 * Math.max(1, Math.abs(sumF), Math.abs(momentOrigin)) + 1e-6, 8);
  const equilibrium: EquilibriumCheck = {
    sumFy,
    sumMoment,
    balanced: Math.abs(sumFy) <= tolerance && Math.abs(sumMoment) <= tolerance,
    tolerance,
  };

  return {
    beamType: config.kind as BeamType,
    reactions: reactions.map((r) => ({
      ...r,
      fy: roundTo(r.fy, 6),
      moment: r.moment === undefined ? undefined : roundTo(r.moment, 6),
    })),
    samples,
    keyStations,
    maxShear,
    maxPositiveMoment,
    maxNegativeMoment,
    maxAbsMoment,
    totalAppliedForce: roundTo(sumF, 6),
    equilibrium,
  };
}
