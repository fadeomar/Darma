import type { BeamModel, BeamResult, UnitLabels } from "./beamTypes";
import { formatNumber } from "./beamFormatting";

function near(a: number, b: number, length: number): boolean {
  return Math.abs(a - b) <= 1e-4 * Math.max(1, length);
}

/**
 * Describe where the maximum absolute moment occurs using the actual support
 * configuration (from the reactions), not a naive `x === 0` / `x === length`
 * check. A fixed support can be at either end, so x = L is only "the free end"
 * when the fixed support is at x = 0 (and vice versa).
 */
export function describeMomentLocation(model: BeamModel, result: BeamResult, units: UnitLabels): string {
  const x = result.maxAbsMoment.x;
  const length = model.length;

  const supportHere = result.reactions.find((r) => near(r.x, x, length));
  if (supportHere) {
    return supportHere.moment !== undefined ? "at the fixed support" : `at support ${supportHere.supportId}`;
  }

  if (result.beamType === "cantilever") {
    const fixed = result.reactions.find((r) => r.moment !== undefined);
    if (fixed) {
      const freeEndX = near(fixed.x, 0, length) ? length : 0;
      if (near(x, freeEndX, length)) return "at the free end";
    }
  }

  if (near(x, 0, length)) return "at the left end";
  if (near(x, length, length)) return "at the right end";
  return `at x = ${formatNumber(x)} ${units.length}`;
}

export function buildBeamExplanation(model: BeamModel, result: BeamResult, units: UnitLabels): string {
  const beamType = result.beamType === "cantilever" ? "cantilever" : "simply supported beam";

  if (Math.abs(result.maxAbsMoment.value) < 1e-9) {
    return `This ${beamType} currently carries no net bending. Add or adjust loads to see where the beam would bend most.`;
  }

  const momentMag = formatNumber(Math.abs(result.maxAbsMoment.value));
  const momentSign = result.maxAbsMoment.value < 0 ? "hogging (tension on top)" : "sagging (tension on the bottom)";
  const where = describeMomentLocation(model, result, units);

  return `This ${beamType} experiences its largest bending of ${momentMag} ${units.moment} ${where}, which is ${momentSign}. That location is where the beam works hardest and would typically need the most material or reinforcement. Positive moment means sagging; negative means hogging. The equilibrium check confirms the reactions balance the applied loads.`;
}
