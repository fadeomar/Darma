import { clamp } from "./beamFormatting";

// Shared canvas geometry for the beam preview. Kept here (not in the component)
// so drag math is testable and the same constants drive drawing + hit-testing.
export const CANVAS = {
  W: 760,
  H: 300,
  MARGIN: 70,
  BEAM_Y: 150,
} as const;

function plotStart() {
  return CANVAS.MARGIN;
}
function plotEnd() {
  return CANVAS.W - CANVAS.MARGIN;
}

/** Beam coordinate (0..length) → SVG user-space X. Pure linear (no clamping). */
export function beamXToSvgX(x: number, length: number): number {
  const L = length > 0 ? length : 1;
  return plotStart() + (x / L) * (plotEnd() - plotStart());
}

/** SVG user-space X → beam coordinate. Inverse of beamXToSvgX. */
export function svgXToBeamX(svgX: number, length: number): number {
  const L = length > 0 ? length : 1;
  const span = plotEnd() - plotStart();
  if (span <= 0) return 0;
  return ((svgX - plotStart()) / span) * L;
}

/**
 * Pointer clientX (+ the SVG's bounding rect) → beam coordinate.
 * The SVG renders at its viewBox aspect ratio (width:100%, height auto), so the
 * mapping from rendered pixels to viewBox units is a simple linear scale.
 */
export function clientXToBeamX(clientX: number, rect: { left: number; width: number }, length: number): number {
  if (!Number.isFinite(clientX) || rect.width <= 0) return 0;
  const svgX = ((clientX - rect.left) / rect.width) * CANVAS.W;
  return svgXToBeamX(svgX, length);
}

export function clampBeamX(x: number, length: number): number {
  if (!Number.isFinite(x)) return 0;
  return clamp(x, 0, length > 0 ? length : 0);
}

export type SnapResult = { x: number; label?: string };

/**
 * Snap a beam x to nearby canonical positions (0, L/4, L/2, 3L/4, L) and any
 * caller-supplied targets (e.g. other item positions). Returns the original x
 * when nothing is within threshold so precise placement stays possible.
 */
export function snapBeamX(
  x: number,
  length: number,
  extraTargets: number[] = [],
  thresholdFrac = 0.02,
): SnapResult {
  if (length <= 0) return { x: clampBeamX(x, length) };
  const named: SnapResult[] = [
    { x: 0, label: "Start" },
    { x: length / 4, label: "L/4" },
    { x: length / 2, label: "Center" },
    { x: (3 * length) / 4, label: "3L/4" },
    { x: length, label: "End" },
  ];
  const targets: SnapResult[] = [...named, ...extraTargets.map((t) => ({ x: t }))];
  const threshold = Math.max(length * thresholdFrac, 1e-9);

  let best: SnapResult | null = null;
  let bestDistance = threshold;
  for (const target of targets) {
    const distance = Math.abs(target.x - x);
    if (distance <= bestDistance) {
      bestDistance = distance;
      best = target;
    }
  }
  return best ? { x: best.x, label: best.label } : { x };
}

/** Quick-position presets for a single coordinate. */
export function quickPositions(length: number): { label: string; short: string; x: number }[] {
  return [
    { label: "Start", short: "0", x: 0 },
    { label: "L/4", short: "L/4", x: length / 4 },
    { label: "Center", short: "½", x: length / 2 },
    { label: "3L/4", short: "3L/4", x: (3 * length) / 4 },
    { label: "End", short: "L", x: length },
  ];
}
