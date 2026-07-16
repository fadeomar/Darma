import { isSafeSvgMarkup } from "./canvas";
import { EXPORT_PACKS, FONT_OPTIONS, PROJECT_PROFILES, DEFAULT_FAVICON_INPUT } from "./presets";
import type { FaviconInput, GeneratedAsset, IconShape, SourceFitMode } from "./types";
import {
  contrastRatio,
  createReadinessChecks,
  createSmartQualityIssues,
  scoreReadiness,
  validateFaviconInput,
  validateGeneratedAssets,
} from "./validation";

export const FAVICON_PROJECT_TOOL = "darma-favicon-app-icon-generator";
export const FAVICON_PROJECT_VERSION = 1;
export const MAX_FAVICON_PROJECT_BYTES = 1024 * 1024;
export const MAX_EMBEDDED_SVG_BYTES = 256 * 1024;

export type FaviconAuditSeverity = "error" | "warning" | "info" | "pass";

export type FaviconAuditCheck = {
  id: string;
  severity: FaviconAuditSeverity;
  title: string;
  message: string;
};

export type FaviconProjectFile = {
  tool: typeof FAVICON_PROJECT_TOOL;
  version: typeof FAVICON_PROJECT_VERSION;
  exportedAt: string;
  input: FaviconInput;
  sourcePolicy: {
    imageEmbedded: false;
    svgEmbedded: boolean;
    note: string;
  };
};

const SOURCE_MODES = new Set(["image", "svg", "text", "emoji"]);
const SHAPES = new Set(["square", "rounded", "circle", "squircle"]);
const FIT_MODES = new Set(["contain", "cover", "fill"]);
const EXPORT_PACK_IDS = new Set(EXPORT_PACKS.map((item) => item.id));
const PROJECT_PROFILE_IDS = new Set(PROJECT_PROFILES.map((item) => item.id));
const DISPLAY_MODES = new Set(["browser", "minimal-ui", "standalone", "fullscreen"]);
const ORIENTATIONS = new Set(["any", "natural", "portrait", "landscape"]);
const FONT_VALUES = new Set(FONT_OPTIONS.map((item) => item.value));
const HEX_RE = /^#[0-9a-f]{6}$/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function stringValue(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/\0/g, "").slice(0, maxLength);
}

function enumValue<T extends string>(value: unknown, allowed: Set<string>, fallback: T): T {
  return typeof value === "string" && allowed.has(value) ? value as T : fallback;
}

function numberValue(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function colorValue(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX_RE.test(value) ? value.toLowerCase() : fallback;
}

function normalizeSvg(value: unknown): string {
  if (typeof value !== "string") return "";
  const sanitized = value.replace(/\0/g, "").slice(0, MAX_EMBEDDED_SVG_BYTES);
  return isSafeSvgMarkup(sanitized) ? sanitized : "";
}

function normalizeSourceTransform(value: unknown, fallback: FaviconInput["sourceTransform"]): FaviconInput["sourceTransform"] {
  const source = asRecord(value) ?? {};
  return {
    zoom: numberValue(source.zoom, fallback.zoom, 25, 250),
    offsetX: numberValue(source.offsetX, fallback.offsetX, -100, 100),
    offsetY: numberValue(source.offsetY, fallback.offsetY, -100, 100),
    rotation: numberValue(source.rotation, fallback.rotation, -180, 180),
    fitMode: enumValue(source.fitMode, FIT_MODES, fallback.fitMode) as SourceFitMode,
  };
}

export function createSettingsOnlyFaviconInput(input: FaviconInput): FaviconInput {
  const svgText = input.sourceMode === "svg" && new TextEncoder().encode(input.svgText).length <= MAX_EMBEDDED_SVG_BYTES && isSafeSvgMarkup(input.svgText)
    ? input.svgText
    : "";
  return {
    ...input,
    imageDataUrl: "",
    imageMeta: null,
    svgText,
  };
}

export function normalizeFaviconInput(value: unknown): FaviconInput {
  const source = asRecord(value) ?? {};
  const fallback = DEFAULT_FAVICON_INPUT;
  const cropMode = enumValue(source.cropMode, FIT_MODES, fallback.cropMode) as SourceFitMode;
  const sourceTransform = normalizeSourceTransform(source.sourceTransform, { ...fallback.sourceTransform, fitMode: cropMode });
  const sourceMode = enumValue(source.sourceMode, SOURCE_MODES, fallback.sourceMode);
  const svgText = normalizeSvg(source.svgText);

  return {
    sourceMode,
    imageDataUrl: "",
    imageMeta: null,
    svgText,
    text: stringValue(source.text, fallback.text, 16),
    emoji: stringValue(source.emoji, fallback.emoji, 16),
    backgroundColor: colorValue(source.backgroundColor, fallback.backgroundColor),
    foregroundColor: colorValue(source.foregroundColor, fallback.foregroundColor),
    transparentBackground: booleanValue(source.transparentBackground, fallback.transparentBackground),
    padding: numberValue(source.padding, fallback.padding, 0, 45),
    scale: numberValue(source.scale, fallback.scale, 25, 160),
    borderRadius: numberValue(source.borderRadius, fallback.borderRadius, 0, 50),
    shape: enumValue(source.shape, SHAPES, fallback.shape) as IconShape,
    cropMode,
    sourceTransform,
    fontFamily: enumValue(source.fontFamily, FONT_VALUES, fallback.fontFamily),
    fontWeight: numberValue(source.fontWeight, fallback.fontWeight, 100, 900),
    pathPrefix: stringValue(source.pathPrefix, fallback.pathPrefix, 240),
    siteName: stringValue(source.siteName, fallback.siteName, 120),
    shortName: stringValue(source.shortName, fallback.shortName, 40),
    themeColor: colorValue(source.themeColor, fallback.themeColor),
    manifestBackgroundColor: colorValue(source.manifestBackgroundColor, fallback.manifestBackgroundColor),
    display: enumValue(source.display, DISPLAY_MODES, fallback.display),
    orientation: enumValue(source.orientation, ORIENTATIONS, fallback.orientation),
    exportPack: enumValue(source.exportPack, EXPORT_PACK_IDS, fallback.exportPack),
    projectProfile: enumValue(source.projectProfile, PROJECT_PROFILE_IDS, fallback.projectProfile),
    includeMaskable: booleanValue(source.includeMaskable, fallback.includeMaskable),
    includeMonochrome: booleanValue(source.includeMonochrome, fallback.includeMonochrome),
  };
}

export function createFaviconProject(input: FaviconInput, exportedAt = new Date().toISOString()): FaviconProjectFile {
  const settingsInput = createSettingsOnlyFaviconInput(input);
  const svgEmbedded = input.sourceMode === "svg" && Boolean(settingsInput.svgText);
  return {
    tool: FAVICON_PROJECT_TOOL,
    version: FAVICON_PROJECT_VERSION,
    exportedAt,
    input: settingsInput,
    sourcePolicy: {
      imageEmbedded: false,
      svgEmbedded,
      note: input.sourceMode === "image"
        ? "Uploaded image data is excluded. Reattach the local image after importing this project."
        : input.sourceMode === "svg" && !svgEmbedded
          ? "The SVG source exceeded the safe project limit or failed safety validation and was excluded. Reattach it after importing."
          : "No uploaded binary image data is embedded in this project file.",
    },
  };
}

export function createFaviconProjectJson(input: FaviconInput): string {
  return `${JSON.stringify(createFaviconProject(input), null, 2)}\n`;
}

export function parseFaviconProjectJson(source: string): FaviconProjectFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }
  const root = asRecord(parsed);
  if (!root) throw new Error("The project file must contain a JSON object.");
  if (root.tool !== FAVICON_PROJECT_TOOL) throw new Error("This JSON file was not exported by the Darma favicon generator.");
  if (root.version !== FAVICON_PROJECT_VERSION) throw new Error(`Unsupported project version. Expected version ${FAVICON_PROJECT_VERSION}.`);
  const input = normalizeFaviconInput(root.input);
  return createFaviconProject(input, stringValue(root.exportedAt, new Date(0).toISOString(), 80));
}

function sourceSignature(input: FaviconInput): Record<string, unknown> {
  const image = input.imageDataUrl;
  const svg = input.svgText;
  return {
    image: image ? [image.length, image.slice(0, 96), image.slice(-96)] : null,
    svg: svg ? [svg.length, svg.slice(0, 128), svg.slice(-128)] : null,
    imageMeta: input.imageMeta,
  };
}

export function createFaviconInputFingerprint(input: FaviconInput): string {
  const serializable = {
    ...input,
    imageDataUrl: undefined,
    svgText: undefined,
    sourceSignature: sourceSignature(input),
  };
  const source = JSON.stringify(serializable);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `favicon-${(hash >>> 0).toString(16).padStart(8, "0")}-${source.length}`;
}

export function createFaviconProductionChecks(
  input: FaviconInput,
  assets: GeneratedAsset[],
  generatedFingerprint?: string,
): FaviconAuditCheck[] {
  const checks: FaviconAuditCheck[] = [];
  const currentFingerprint = createFaviconInputFingerprint(input);
  const inputWarnings = validateFaviconInput(input);
  const generatedIssues = validateGeneratedAssets(input, assets);
  const readiness = createReadinessChecks(input, assets);
  const score = scoreReadiness(readiness);
  const smartIssues = createSmartQualityIssues(input, assets);
  const blocking = inputWarnings.filter((item) => item.level === "error");
  const warnings = inputWarnings.filter((item) => item.level === "warning");
  const generatedFailures = generatedIssues.filter((item) => item.level === "error" || item.level === "warning");

  if (blocking.length) {
    checks.push({ id: "input", severity: "error", title: "Generator input is blocked", message: blocking.map((item) => item.title).join("; ") });
  } else if (warnings.length) {
    checks.push({ id: "input", severity: "warning", title: "Input needs review", message: warnings.map((item) => item.title).join("; ") });
  } else {
    checks.push({ id: "input", severity: "pass", title: "Input validation passed", message: "The current source and configuration contain no blocking validation issues." });
  }

  if (!assets.length) {
    checks.push({ id: "assets", severity: "warning", title: "Assets are still generating", message: "Wait for the current icon package to finish before downloading or handing it off." });
  } else if (generatedFingerprint !== currentFingerprint) {
    checks.push({ id: "assets", severity: "warning", title: "Generated files are stale", message: "The settings changed after the current files were rendered. Regenerate before downloading." });
  } else if (generatedFailures.length) {
    checks.push({ id: "assets", severity: "warning", title: "Generated package needs review", message: generatedFailures.map((item) => item.title).join("; ") });
  } else {
    checks.push({ id: "assets", severity: "pass", title: "Generated package matches the design", message: `${assets.length} generated files passed the package self-check.` });
  }

  if (score < 70) checks.push({ id: "readiness", severity: "error", title: "Readiness score is low", message: `The current package scores ${score}/100. Resolve source, legibility, PWA, and install issues before release.` });
  else if (score < 90) checks.push({ id: "readiness", severity: "warning", title: "Readiness needs review", message: `The current package scores ${score}/100. Review remaining quality warnings before release.` });
  else checks.push({ id: "readiness", severity: "pass", title: "Readiness score is strong", message: `The current package scores ${score}/100 across source, platform, and install checks.` });

  const highPriority = smartIssues.filter((item) => item.severity === "danger" || item.severity === "warning");
  if (highPriority.length) checks.push({ id: "quality", severity: "warning", title: "Quality issues remain", message: `${highPriority.length} actionable visual or platform issue${highPriority.length === 1 ? "" : "s"} remain in the detailed quality panel.` });
  else checks.push({ id: "quality", severity: "pass", title: "No high-priority quality issues", message: "The detailed source, contrast, edge, Apple, PWA, and maskable checks are clear." });

  const contrast = !input.transparentBackground && (input.sourceMode === "text" || input.sourceMode === "emoji")
    ? contrastRatio(input.foregroundColor, input.backgroundColor)
    : null;
  if (contrast !== null && contrast < 3) checks.push({ id: "contrast", severity: "error", title: "Tiny-icon contrast is too low", message: `Estimated contrast is ${contrast.toFixed(2)}:1; small favicons need stronger separation.` });
  else if (contrast !== null && contrast < 4.5) checks.push({ id: "contrast", severity: "warning", title: "Tiny-icon contrast is marginal", message: `Estimated contrast is ${contrast.toFixed(2)}:1. Review the 16px and 32px previews.` });
  else if (contrast !== null) checks.push({ id: "contrast", severity: "pass", title: "Foreground contrast is strong", message: `Estimated contrast is ${contrast.toFixed(2)}:1.` });
  else checks.push({ id: "contrast", severity: "info", title: "Contrast needs visual review", message: "Image, SVG, or transparent sources require manual review in light and dark browser surfaces." });

  const project = createFaviconProject(input);
  if (input.sourceMode === "image") checks.push({ id: "project", severity: "info", title: "Project excludes the uploaded image", message: project.sourcePolicy.note });
  else if (input.sourceMode === "svg" && !project.sourcePolicy.svgEmbedded) checks.push({ id: "project", severity: "warning", title: "SVG source is not portable", message: project.sourcePolicy.note });
  else checks.push({ id: "project", severity: "pass", title: "Project settings are portable", message: "The versioned JSON project can safely recreate the current settings without embedded image data." });

  return checks;
}

export function summarizeFaviconProduction(input: FaviconInput, assets: GeneratedAsset[], generatedFingerprint?: string) {
  const checks = createFaviconProductionChecks(input, assets, generatedFingerprint);
  const counts = checks.reduce<Record<FaviconAuditSeverity, number>>((result, check) => {
    result[check.severity] += 1;
    return result;
  }, { error: 0, warning: 0, info: 0, pass: 0 });
  const readinessScore = scoreReadiness(createReadinessChecks(input, assets));
  const assetBytes = assets.reduce((sum, asset) => sum + (asset.size ?? asset.blob.size), 0);
  const fresh = Boolean(assets.length) && generatedFingerprint === createFaviconInputFingerprint(input);
  const ready = counts.error === 0 && counts.warning === 0 && fresh;
  return {
    sourceLabel: input.sourceMode === "text" ? `Text · ${input.text || "empty"}` : input.sourceMode === "emoji" ? `Emoji · ${input.emoji || "empty"}` : input.sourceMode.toUpperCase(),
    targetLabel: PROJECT_PROFILES.find((item) => item.id === input.projectProfile)?.shortLabel ?? input.projectProfile,
    packLabel: EXPORT_PACKS.find((item) => item.id === input.exportPack)?.title ?? input.exportPack,
    assetCount: assets.length,
    assetBytes,
    readinessScore,
    counts,
    fresh,
    ready,
    statusLabel: counts.error ? "Blocked" : counts.warning ? "Review" : ready ? "Ready" : "Rendering",
  };
}

export function createFaviconAuditMarkdown(input: FaviconInput, assets: GeneratedAsset[], generatedFingerprint?: string): string {
  const summary = summarizeFaviconProduction(input, assets, generatedFingerprint);
  const checks = createFaviconProductionChecks(input, assets, generatedFingerprint);
  return [
    "# Favicon and app icon production audit",
    "",
    `- Source: ${summary.sourceLabel}`,
    `- Project target: ${summary.targetLabel}`,
    `- Export pack: ${summary.packLabel}`,
    `- Generated files: ${summary.assetCount}`,
    `- Package size: ${formatBytes(summary.assetBytes)}`,
    `- Readiness score: ${summary.readinessScore}/100`,
    `- Status: ${summary.statusLabel}`,
    "",
    "## Checks",
    "",
    ...checks.map((check) => `- **${check.severity.toUpperCase()} — ${check.title}:** ${check.message}`),
    "",
    "## Privacy and portability",
    "",
    "This report is generated locally. Versioned project files exclude uploaded image data and only embed SVG markup when it is safe and below the project-size limit.",
    "",
  ].join("\n");
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function createFaviconMetricsCsv(input: FaviconInput, assets: GeneratedAsset[], generatedFingerprint?: string): string {
  const summary = summarizeFaviconProduction(input, assets, generatedFingerprint);
  return [
    "source,project_target,export_pack,generated_files,package_bytes,readiness_score,errors,warnings,info,passes,fresh,status",
    [
      csvCell(summary.sourceLabel),
      csvCell(summary.targetLabel),
      csvCell(input.exportPack),
      summary.assetCount,
      summary.assetBytes,
      summary.readinessScore,
      summary.counts.error,
      summary.counts.warning,
      summary.counts.info,
      summary.counts.pass,
      summary.fresh,
      csvCell(summary.statusLabel),
    ].join(","),
  ].join("\n") + "\n";
}

function textAsset(filename: string, text: string, mimeType: string, kind: GeneratedAsset["kind"]): GeneratedAsset {
  const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
  return { filename, mimeType, blob, kind, size: blob.size, text };
}

export function createFaviconHandoffAssets(input: FaviconInput, assets: GeneratedAsset[], generatedFingerprint?: string): GeneratedAsset[] {
  return [
    textAsset("favicon-project.json", createFaviconProjectJson(input), "application/json", "config"),
    textAsset("production-audit.md", createFaviconAuditMarkdown(input, assets, generatedFingerprint), "text/markdown", "readme"),
    textAsset("production-metrics.csv", createFaviconMetricsCsv(input, assets, generatedFingerprint), "text/csv", "config"),
  ];
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
