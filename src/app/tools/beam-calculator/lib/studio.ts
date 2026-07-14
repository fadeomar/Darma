import JSZip from "jszip";
import type { ValidationResult } from "./beamValidation";
import type {
  BeamModel,
  BeamResult,
  DiagramSample,
  UnitLabels,
} from "./beamTypes";
import { UNIT_SYSTEMS } from "./beamTypes";
import {
  buildReport,
  serializeConfig,
  serializeResultsJson,
} from "./beamExport";
import { formatNumber, formatSigned } from "./beamFormatting";

export const MAX_BEAM_PROJECT_BYTES = 1024 * 1024;
export const BEAM_PRODUCTION_PACK_FILES = [
  "beam-project.json",
  "beam-results.json",
  "beam-report.md",
  "beam-stations.csv",
  "beam-diagrams.svg",
  "README.md",
] as const;

export type BeamAuditSeverity = "error" | "warning" | "info" | "pass";

export type BeamAuditCheck = {
  id: string;
  severity: BeamAuditSeverity;
  title: string;
  message: string;
};

export type BeamReadiness = "blocked" | "review" | "ready";

export type BeamStudioSummary = {
  beamType: string;
  loadSummary: string;
  maxMoment: string;
  readiness: BeamReadiness;
};

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function countLoadKinds(model: BeamModel): string {
  const counts = { point: 0, udl: 0, moment: 0 };
  for (const load of model.loads) counts[load.kind] += 1;
  const parts = [
    counts.point ? `${counts.point} point` : "",
    counts.udl ? `${counts.udl} UDL` : "",
    counts.moment ? `${counts.moment} moment` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No loads";
}

export function getBeamReadiness(checks: BeamAuditCheck[]): BeamReadiness {
  if (checks.some((check) => check.severity === "error")) return "blocked";
  if (checks.some((check) => check.severity === "warning")) return "review";
  return "ready";
}

export function createBeamAudit(
  model: BeamModel,
  validation: ValidationResult,
  result: BeamResult | null,
): BeamAuditCheck[] {
  const checks: BeamAuditCheck[] = [];

  if (validation.errors.length > 0) {
    checks.push({
      id: "input-validity",
      severity: "error",
      title: "Configuration cannot be solved",
      message: `${validation.errors.length} blocking input issue${validation.errors.length === 1 ? "" : "s"} must be fixed before results or exports are reliable.`,
    });
  } else {
    checks.push({
      id: "input-validity",
      severity: "pass",
      title: "Configuration is valid",
      message:
        "The support arrangement, load positions, ranges, directions, and magnitudes pass the calculator guardrails.",
    });
  }

  if (model.loads.length === 0) {
    checks.push({
      id: "loads-present",
      severity: "warning",
      title: "No applied loads",
      message:
        "The beam can be solved, but reactions and diagrams remain zero until a point load, UDL, or applied moment is added.",
    });
  } else {
    checks.push({
      id: "loads-present",
      severity: "pass",
      title: "Loads are defined",
      message: `${model.loads.length} load${model.loads.length === 1 ? "" : "s"} will be included in the equilibrium and diagram calculations.`,
    });
  }

  if (!result) {
    checks.push({
      id: "equilibrium",
      severity: "info",
      title: "Equilibrium check pending",
      message:
        "A valid solved configuration is required before force and moment balance can be verified.",
    });
  } else if (!result.equilibrium.balanced) {
    checks.push({
      id: "equilibrium",
      severity: "error",
      title: "Equilibrium did not close",
      message: `The residuals are ΣFy = ${formatNumber(result.equilibrium.sumFy, 6)} and ΣM = ${formatNumber(result.equilibrium.sumMoment, 6)}. Do not use this result until the model or solver is reviewed.`,
    });
  } else {
    checks.push({
      id: "equilibrium",
      severity: "pass",
      title: "Equilibrium is balanced",
      message:
        "The calculated reactions balance the applied vertical forces and moments within the solver tolerance.",
    });
  }

  const zeroMagnitudeCount = model.loads.filter(
    (load) => load.magnitude === 0,
  ).length;
  if (zeroMagnitudeCount > 0) {
    checks.push({
      id: "zero-loads",
      severity: "warning",
      title: "Zero-magnitude loads are present",
      message: `${zeroMagnitudeCount} load${zeroMagnitudeCount === 1 ? "" : "s"} add visual complexity without affecting the result. Remove them before handoff.`,
    });
  }

  if (model.loads.length > 20) {
    checks.push({
      id: "diagram-complexity",
      severity: "warning",
      title: "Dense load model",
      message:
        "More than 20 loads can make the schematic and station table difficult to review. Consider splitting the study into documented load cases.",
    });
  } else if (model.loads.length > 0) {
    checks.push({
      id: "diagram-complexity",
      severity: "pass",
      title: "Diagram complexity is reviewable",
      message:
        "The current number of loads is suitable for visual checking and report handoff.",
    });
  }

  if (
    model.loads.some(
      (load) =>
        (load.kind === "point" || load.kind === "udl") &&
        load.direction === "up",
    )
  ) {
    checks.push({
      id: "upward-loads",
      severity: "info",
      title: "Upward applied load included",
      message:
        "Confirm that uplift or upward loading is intentional; the calculator uses an upward-positive force convention.",
    });
  }

  checks.push({
    id: "analysis-scope",
    severity: "info",
    title: "Preliminary statics scope",
    message:
      "The export does not include material strength, section capacity, deflection, stability, load combinations, dynamic effects, or safety factors.",
  });

  return checks;
}

export function createBeamStudioSummary(
  model: BeamModel,
  result: BeamResult | null,
  checks: BeamAuditCheck[],
): BeamStudioSummary {
  const units = UNIT_SYSTEMS[model.unitSystem];
  return {
    beamType:
      result?.beamType === "cantilever"
        ? "Cantilever"
        : result?.beamType === "simply-supported"
          ? "Simply supported"
          : "Unresolved",
    loadSummary: countLoadKinds(model),
    maxMoment: result
      ? `${formatNumber(Math.abs(result.maxAbsMoment.value))} ${units.moment}`
      : "—",
    readiness: getBeamReadiness(checks),
  };
}

export function buildStationsCsv(model: BeamModel, result: BeamResult): string {
  const units = UNIT_SYSTEMS[model.unitSystem];
  const rows = [
    [
      "station",
      `x (${units.length})`,
      `shear (${units.force})`,
      `moment (${units.moment})`,
      "note",
    ],
    ...result.keyStations.map((station, index) => [
      index + 1,
      station.x,
      station.shear,
      station.moment,
      station.note,
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function chartPath(
  samples: DiagramSample[],
  metric: "shear" | "moment",
  x: number,
  y: number,
  width: number,
  height: number,
  length: number,
): { path: string; zeroY: number; min: number; max: number } {
  const values = samples.map((sample) => sample[metric]);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = Math.max(max - min, 1e-9);
  const pad = span * 0.12;
  const low = min - pad;
  const high = max + pad;
  const scaleX = (value: number) =>
    x + (value / Math.max(length, 1e-9)) * width;
  const scaleY = (value: number) =>
    y + ((high - value) / Math.max(high - low, 1e-9)) * height;
  const path = samples
    .map(
      (sample, index) =>
        `${index === 0 ? "M" : "L"}${scaleX(sample.x).toFixed(2)},${scaleY(sample[metric]).toFixed(2)}`,
    )
    .join(" ");
  return { path, zeroY: scaleY(0), min, max };
}

export function buildBeamDiagramsSvg(
  model: BeamModel,
  result: BeamResult,
): string {
  const units = UNIT_SYSTEMS[model.unitSystem];
  const width = 1200;
  const height = 760;
  const chartX = 105;
  const chartWidth = 1025;
  const chartHeight = 235;
  const shearY = 145;
  const momentY = 455;
  const shear = chartPath(
    result.samples,
    "shear",
    chartX,
    shearY,
    chartWidth,
    chartHeight,
    model.length,
  );
  const moment = chartPath(
    result.samples,
    "moment",
    chartX,
    momentY,
    chartWidth,
    chartHeight,
    model.length,
  );
  const type =
    result.beamType === "cantilever" ? "Cantilever" : "Simply supported";

  const chart = (
    title: string,
    unit: string,
    y: number,
    data: ReturnType<typeof chartPath>,
    stroke: string,
  ) => `
    <g>
      <text x="${chartX}" y="${y - 34}" class="section">${xmlEscape(title)}</text>
      <text x="${chartX}" y="${y - 12}" class="meta">Range ${xmlEscape(formatSigned(data.min))} to ${xmlEscape(formatSigned(data.max))} ${xmlEscape(unit)}</text>
      <rect x="${chartX}" y="${y}" width="${chartWidth}" height="${chartHeight}" rx="14" fill="#ffffff" stroke="#d8dee9"/>
      <line x1="${chartX}" y1="${data.zeroY.toFixed(2)}" x2="${chartX + chartWidth}" y2="${data.zeroY.toFixed(2)}" stroke="#94a3b8" stroke-dasharray="8 7"/>
      <path d="${data.path}" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${chartX}" y="${y + chartHeight + 24}" class="axis">0 ${xmlEscape(units.length)}</text>
      <text x="${chartX + chartWidth}" y="${y + chartHeight + 24}" text-anchor="end" class="axis">${xmlEscape(formatNumber(model.length))} ${xmlEscape(units.length)}</text>
    </g>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">Beam shear force and bending moment diagrams</title>
  <desc id="desc">${xmlEscape(type)} beam, length ${xmlEscape(formatNumber(model.length))} ${xmlEscape(units.length)}, with ${model.loads.length} applied loads.</desc>
  <style>
    .title{font:700 30px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;fill:#0f172a}
    .section{font:700 20px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;fill:#0f172a}
    .meta,.axis{font:500 14px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;fill:#475569}
    .note{font:500 13px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;fill:#64748b}
  </style>
  <rect width="1200" height="760" fill="#f8fafc"/>
  <text x="60" y="58" class="title">Beam Calculator Studio — ${xmlEscape(type)}</text>
  <text x="60" y="88" class="meta">L = ${xmlEscape(formatNumber(model.length))} ${xmlEscape(units.length)} · ${model.loads.length} load${model.loads.length === 1 ? "" : "s"} · educational and preliminary analysis only</text>
  ${chart("Shear force diagram (SFD)", units.force, shearY, shear, "#f97316")}
  ${chart("Bending moment diagram (BMD)", units.moment, momentY, moment, "#7c3aed")}
  <text x="60" y="738" class="note">Sign convention: upward force positive; sagging bending moment positive. Verify real designs with a qualified structural engineer.</text>
</svg>`;
}

export function buildBeamAuditMarkdown(
  model: BeamModel,
  result: BeamResult,
  checks: BeamAuditCheck[],
): string {
  const readiness = getBeamReadiness(checks);
  const audit = checks
    .map(
      (check) =>
        `- **${check.severity.toUpperCase()} — ${check.title}:** ${check.message}`,
    )
    .join("\n");
  return `${buildReport(model, result)}\n\n## Production readiness\n\n- Status: **${readiness}**\n\n${audit}\n`;
}

export function buildProductionReadme(
  model: BeamModel,
  result: BeamResult,
  checks: BeamAuditCheck[],
): string {
  const units: UnitLabels = UNIT_SYSTEMS[model.unitSystem];
  return [
    "# Beam Calculator Production Pack",
    "",
    `Beam type: ${result.beamType === "cantilever" ? "Cantilever" : "Simply supported"}`,
    `Beam length: ${formatNumber(model.length)} ${units.length}`,
    `Readiness: ${getBeamReadiness(checks)}`,
    "",
    "## Files",
    "",
    "- `beam-project.json` — editable calculator configuration.",
    "- `beam-results.json` — solved reactions, samples, extrema, and equilibrium data.",
    "- `beam-report.md` — human-readable calculation and readiness report.",
    "- `beam-stations.csv` — key shear and moment stations for spreadsheets.",
    "- `beam-diagrams.svg` — standalone vector SFD and BMD handoff graphic.",
    "",
    "## Scope",
    "",
    "Educational and preliminary statics only. This pack does not establish member capacity, deflection, stability, code compliance, load combinations, or safety factors. A qualified structural engineer must review safety-critical work.",
    "",
  ].join("\n");
}

export async function createBeamProductionPack(
  model: BeamModel,
  result: BeamResult,
  checks: BeamAuditCheck[],
): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("beam-project.json", serializeConfig(model));
  zip.file("beam-results.json", serializeResultsJson(model, result));
  zip.file("beam-report.md", buildBeamAuditMarkdown(model, result, checks));
  zip.file("beam-stations.csv", buildStationsCsv(model, result));
  zip.file("beam-diagrams.svg", buildBeamDiagramsSvg(model, result));
  zip.file("README.md", buildProductionReadme(model, result, checks));
  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
