import type { BeamModel, BeamResult, UnitLabels } from "./beamTypes";
import { UNIT_SYSTEMS } from "./beamTypes";
import { formatNumber, formatSigned } from "./beamFormatting";

export const BEAM_CONFIG_VERSION = 1;

export type BeamConfigFile = {
  tool: "beam-calculator-studio";
  version: number;
  model: BeamModel;
};

export function serializeConfig(model: BeamModel): string {
  const payload: BeamConfigFile = { tool: "beam-calculator-studio", version: BEAM_CONFIG_VERSION, model };
  return JSON.stringify(payload, null, 2);
}

// Defensive parser: accepts either a wrapped config file or a bare model object,
// and returns null on anything that does not look like a beam model.
export function parseConfig(raw: string): BeamModel | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;

  const candidate = "model" in data ? (data as { model: unknown }).model : data;
  if (typeof candidate !== "object" || candidate === null) return null;

  const model = candidate as Partial<BeamModel>;
  if (typeof model.length !== "number" || !Number.isFinite(model.length) || model.length <= 0) return null;
  if (!Array.isArray(model.supports) || !Array.isArray(model.loads)) return null;

  const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

  const supportsValid = model.supports.every(
    (s) => s && typeof s.id === "string" && finite((s as { x: unknown }).x) && ["pin", "roller", "fixed"].includes((s as { type: string }).type),
  );
  if (!supportsValid) return null;

  const loadsValid = model.loads.every((l) => {
    if (!l || typeof (l as { id?: unknown }).id !== "string") return false;
    const load = l as Record<string, unknown>;
    const kind = load.kind;
    if (kind === "point") {
      return finite(load.x) && finite(load.magnitude) && (load.direction === "up" || load.direction === "down");
    }
    if (kind === "udl") {
      return finite(load.start) && finite(load.end) && finite(load.magnitude) && (load.direction === "up" || load.direction === "down");
    }
    if (kind === "moment") {
      return finite(load.x) && finite(load.magnitude) && (load.rotation === "cw" || load.rotation === "ccw");
    }
    return false;
  });
  if (!loadsValid) return null;

  return {
    length: model.length,
    unitSystem: model.unitSystem === "metric" ? "metric" : "metric",
    supports: model.supports.map((s) => ({ ...s })),
    loads: model.loads.map((l) => ({ ...l })),
  };
}

export function serializeResultsJson(model: BeamModel, result: BeamResult): string {
  return JSON.stringify({ tool: "beam-calculator-studio", version: BEAM_CONFIG_VERSION, model, result }, null, 2);
}

function describeLoad(load: BeamModel["loads"][number], u: UnitLabels): string {
  if (load.kind === "point") return `Point load ${load.id}: ${formatNumber(load.magnitude)} ${u.force} ${load.direction} at x = ${formatNumber(load.x)} ${u.length}`;
  if (load.kind === "udl") return `UDL ${load.id}: ${formatNumber(load.magnitude)} ${u.distributed} ${load.direction} over ${formatNumber(load.start)}–${formatNumber(load.end)} ${u.length}`;
  return `Applied moment ${load.id}: ${formatNumber(load.magnitude)} ${u.moment} ${load.rotation} at x = ${formatNumber(load.x)} ${u.length}`;
}

// Human-readable Markdown report suitable for copy or download.
export function buildReport(model: BeamModel, result: BeamResult): string {
  const u = UNIT_SYSTEMS[model.unitSystem];
  const beamTypeLabel = result.beamType === "cantilever" ? "Cantilever" : "Simply supported";

  const lines: string[] = [];
  lines.push("# Beam Calculator Studio — Report");
  lines.push("");
  lines.push("_Educational and preliminary analysis only. Always consult a qualified structural engineer for real-world design._");
  lines.push("");
  lines.push("## Beam");
  lines.push(`- Type: ${beamTypeLabel}`);
  lines.push(`- Length: ${formatNumber(model.length)} ${u.length}`);
  lines.push("");
  lines.push("## Supports");
  for (const s of model.supports) lines.push(`- ${s.id}: ${s.type} at x = ${formatNumber(s.x)} ${u.length}`);
  lines.push("");
  lines.push("## Loads");
  if (model.loads.length === 0) lines.push("- None");
  else for (const l of model.loads) lines.push(`- ${describeLoad(l, u)}`);
  lines.push("");
  lines.push("## Reactions");
  for (const r of result.reactions) {
    const moment = r.moment === undefined ? "" : `, fixed-end moment = ${formatSigned(r.moment)} ${u.moment}`;
    lines.push(`- ${r.supportId} (${r.type}) at x = ${formatNumber(r.x)} ${u.length}: vertical = ${formatSigned(r.fy)} ${u.force}${moment}`);
  }
  lines.push("");
  lines.push("## Key results");
  lines.push(`- Max shear: ${formatSigned(result.maxShear.value)} ${u.force} at x = ${formatNumber(result.maxShear.x)} ${u.length}`);
  lines.push(`- Max positive (sagging) moment: ${formatSigned(result.maxPositiveMoment.value)} ${u.moment} at x = ${formatNumber(result.maxPositiveMoment.x)} ${u.length}`);
  lines.push(`- Max negative (hogging) moment: ${formatSigned(result.maxNegativeMoment.value)} ${u.moment} at x = ${formatNumber(result.maxNegativeMoment.x)} ${u.length}`);
  lines.push(`- Max |moment|: ${formatNumber(Math.abs(result.maxAbsMoment.value))} ${u.moment} at x = ${formatNumber(result.maxAbsMoment.x)} ${u.length}`);
  lines.push(`- Equilibrium: ${result.equilibrium.balanced ? "balanced" : "not balanced"} (ΣFy = ${formatNumber(result.equilibrium.sumFy, 4)} ${u.force}, ΣM = ${formatNumber(result.equilibrium.sumMoment, 4)} ${u.moment})`);
  lines.push("");
  lines.push("## Stations");
  lines.push(`| x (${u.length}) | Shear (${u.force}) | Moment (${u.moment}) | Note |`);
  lines.push("| ---: | ---: | ---: | :--- |");
  for (const s of result.keyStations) {
    lines.push(`| ${formatNumber(s.x)} | ${formatSigned(s.shear)} | ${formatSigned(s.moment)} | ${s.note} |`);
  }
  lines.push("");
  lines.push("Sign convention: downward loads negative, upward reactions positive, sagging moment positive, hogging moment negative.");
  return lines.join("\n");
}

// Plain-text clipboard summary.
export function buildClipboardSummary(model: BeamModel, result: BeamResult): string {
  const u = UNIT_SYSTEMS[model.unitSystem];
  const parts = [
    `Beam Calculator Studio — ${result.beamType === "cantilever" ? "Cantilever" : "Simply supported"} (L = ${formatNumber(model.length)} ${u.length})`,
    ...result.reactions.map((r) => {
      const moment = r.moment === undefined ? "" : `, M = ${formatSigned(r.moment)} ${u.moment}`;
      return `Reaction ${r.supportId}: ${formatSigned(r.fy)} ${u.force}${moment}`;
    }),
    `Max shear: ${formatSigned(result.maxShear.value)} ${u.force} @ x = ${formatNumber(result.maxShear.x)} ${u.length}`,
    `Max |moment|: ${formatNumber(Math.abs(result.maxAbsMoment.value))} ${u.moment} @ x = ${formatNumber(result.maxAbsMoment.x)} ${u.length}`,
    `Equilibrium: ${result.equilibrium.balanced ? "balanced" : "check inputs"}`,
  ];
  return parts.join("\n");
}
