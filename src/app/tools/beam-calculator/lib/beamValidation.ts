import type { BeamLoad, BeamModel, Support } from "./beamTypes";
import { classifySupports } from "./beamAnalysis";

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  id: string;
  severity: ValidationSeverity;
  message: string;
  /** Optional pointer to the offending entity so the UI can tie the message to a field. */
  target?: { kind: "beam" | "support" | "load"; id?: string };
  /** Optional suggestion the UI can surface (e.g. a preset id to load). */
  suggestionPresetId?: string;
};

export type ValidationResult = {
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  ok: boolean;
};

const POSITION_TOLERANCE = 1e-6;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validateSupport(support: Support, length: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isFiniteNumber(support.x)) {
    issues.push({
      id: `support-${support.id}-x-nan`,
      severity: "error",
      message: `Support ${support.id} has an invalid position.`,
      target: { kind: "support", id: support.id },
    });
    return issues;
  }
  if (support.x < -POSITION_TOLERANCE || support.x > length + POSITION_TOLERANCE) {
    issues.push({
      id: `support-${support.id}-x-range`,
      severity: "error",
      message: `Support ${support.id} at ${support.x} is outside the beam (0 to ${length}).`,
      target: { kind: "support", id: support.id },
    });
  }
  return issues;
}

function validateLoad(load: BeamLoad, length: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (load.kind === "point" || load.kind === "moment") {
    if (!isFiniteNumber(load.x)) {
      issues.push({ id: `load-${load.id}-x-nan`, severity: "error", message: `Load ${load.id} has an invalid position.`, target: { kind: "load", id: load.id } });
    } else if (load.x < -POSITION_TOLERANCE || load.x > length + POSITION_TOLERANCE) {
      issues.push({ id: `load-${load.id}-x-range`, severity: "error", message: `Load ${load.id} at ${load.x} is outside the beam (0 to ${length}).`, target: { kind: "load", id: load.id } });
    }
    if (!isFiniteNumber(load.magnitude)) {
      issues.push({ id: `load-${load.id}-mag-nan`, severity: "error", message: `Load ${load.id} has an invalid magnitude.`, target: { kind: "load", id: load.id } });
    } else if (load.magnitude === 0) {
      issues.push({ id: `load-${load.id}-mag-zero`, severity: "warning", message: `Load ${load.id} has zero magnitude and will not affect results.`, target: { kind: "load", id: load.id } });
    }
    return issues;
  }

  // UDL
  if (!isFiniteNumber(load.start) || !isFiniteNumber(load.end)) {
    issues.push({ id: `load-${load.id}-range-nan`, severity: "error", message: `UDL ${load.id} has an invalid range.`, target: { kind: "load", id: load.id } });
    return issues;
  }
  if (load.start < -POSITION_TOLERANCE || load.end > length + POSITION_TOLERANCE || load.start < 0 || load.end < 0) {
    issues.push({ id: `load-${load.id}-range-bounds`, severity: "error", message: `UDL ${load.id} range must stay within the beam (0 to ${length}).`, target: { kind: "load", id: load.id } });
  }
  if (load.start >= load.end - POSITION_TOLERANCE) {
    issues.push({ id: `load-${load.id}-range-order`, severity: "error", message: `UDL ${load.id} start (${load.start}) must be less than end (${load.end}).`, target: { kind: "load", id: load.id } });
  }
  if (!isFiniteNumber(load.magnitude)) {
    issues.push({ id: `load-${load.id}-mag-nan`, severity: "error", message: `UDL ${load.id} has an invalid intensity.`, target: { kind: "load", id: load.id } });
  } else if (load.magnitude === 0) {
    issues.push({ id: `load-${load.id}-mag-zero`, severity: "warning", message: `UDL ${load.id} has zero intensity and will not affect results.`, target: { kind: "load", id: load.id } });
  }
  return issues;
}

export function validateBeam(model: BeamModel): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Beam length.
  if (!isFiniteNumber(model.length) || model.length <= 0) {
    issues.push({ id: "beam-length", severity: "error", message: "Beam length must be a positive number.", target: { kind: "beam" } });
  }

  const safeLength = isFiniteNumber(model.length) && model.length > 0 ? model.length : 0;

  for (const support of model.supports) issues.push(...validateSupport(support, safeLength));
  for (const load of model.loads) issues.push(...validateLoad(load, safeLength));

  // Duplicate support positions.
  const positions = new Map<number, number>();
  for (const support of model.supports) {
    if (!isFiniteNumber(support.x)) continue;
    const key = Math.round(support.x / POSITION_TOLERANCE);
    positions.set(key, (positions.get(key) ?? 0) + 1);
  }
  if ([...positions.values()].some((count) => count > 1)) {
    issues.push({ id: "support-duplicate", severity: "error", message: "Two supports cannot share the same position.", target: { kind: "beam" }, suggestionPresetId: "ss-center-point" });
  }

  // Support configuration must be one we can solve. Only flag this when the
  // individual supports are otherwise valid, so the user sees the precise issue.
  const hasSupportLevelError = issues.some((issue) => issue.severity === "error" && issue.target?.kind !== "load");
  if (!hasSupportLevelError) {
    const config = classifySupports(model.supports);
    if (!config) {
      issues.push({
        id: "support-config",
        severity: "error",
        message:
          "Unsupported configuration. Use either one fixed support (cantilever) or exactly two pin/roller supports (simply supported). Try a preset to start from a valid setup.",
        target: { kind: "beam" },
        suggestionPresetId: "ss-center-point",
      });
    }
  }

  // Empty loads is not an error, just a gentle nudge.
  if (model.loads.length === 0) {
    issues.push({ id: "loads-empty", severity: "warning", message: "No loads added yet. Add a point load, UDL, or applied moment to see results.", target: { kind: "beam" } });
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return { issues, errors, warnings, ok: errors.length === 0 };
}
