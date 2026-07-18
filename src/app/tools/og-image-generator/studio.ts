import { DEFAULT_OG_INPUT, EXPORT_PACKS, TEMPLATE_OPTIONS } from "./presets";
import type { OgGeneratedAsset, OgImageInput } from "./types";

export const OG_PROJECT_TOOL = "darma-og-image-generator";
export const OG_PROJECT_VERSION = 1;
export const MAX_OG_PROJECT_BYTES = 1024 * 1024;

export type OgAuditSeverity = "error" | "warning" | "info" | "pass";

export type OgAuditCheck = {
  id: string;
  severity: OgAuditSeverity;
  title: string;
  message: string;
};

export type OgProjectFile = {
  tool: typeof OG_PROJECT_TOOL;
  version: typeof OG_PROJECT_VERSION;
  exportedAt: string;
  input: OgImageInput;
  assetPolicy: {
    embeddedAssets: false;
    note: string;
  };
};

const TEMPLATE_IDS = new Set(TEMPLATE_OPTIONS.map((item) => item.value));
const EXPORT_PACK_IDS = new Set(EXPORT_PACKS.map((item) => item.id));
const BACKGROUND_MODES = new Set(["solid", "gradient", "image", "pattern"]);
const ALIGNMENTS = new Set(["left", "center", "right"]);
const LOGO_POSITIONS = new Set(["none", "top-left", "top-right", "bottom-left", "bottom-right"]);
const TWITTER_CARDS = new Set(["summary", "summary_large_image"]);
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

export function createSettingsOnlyInput(input: OgImageInput): OgImageInput {
  return {
    ...input,
    backgroundImageDataUrl: "",
    logoDataUrl: "",
  };
}

export function normalizeOgInput(value: unknown): OgImageInput {
  const source = asRecord(value) ?? {};
  return {
    templateId: enumValue(source.templateId, TEMPLATE_IDS, DEFAULT_OG_INPUT.templateId),
    title: stringValue(source.title, DEFAULT_OG_INPUT.title, 180),
    subtitle: stringValue(source.subtitle, DEFAULT_OG_INPUT.subtitle, 400),
    badge: stringValue(source.badge, DEFAULT_OG_INPUT.badge, 80),
    domain: stringValue(source.domain, DEFAULT_OG_INPUT.domain, 120),
    author: stringValue(source.author, DEFAULT_OG_INPUT.author, 120),
    callToAction: stringValue(source.callToAction, DEFAULT_OG_INPUT.callToAction, 100),
    backgroundMode: enumValue(source.backgroundMode, BACKGROUND_MODES, DEFAULT_OG_INPUT.backgroundMode),
    backgroundColor: colorValue(source.backgroundColor, DEFAULT_OG_INPUT.backgroundColor),
    foregroundColor: colorValue(source.foregroundColor, DEFAULT_OG_INPUT.foregroundColor),
    mutedColor: colorValue(source.mutedColor, DEFAULT_OG_INPUT.mutedColor),
    accentColor: colorValue(source.accentColor, DEFAULT_OG_INPUT.accentColor),
    gradientFrom: colorValue(source.gradientFrom, DEFAULT_OG_INPUT.gradientFrom),
    gradientTo: colorValue(source.gradientTo, DEFAULT_OG_INPUT.gradientTo),
    gradientAngle: numberValue(source.gradientAngle, DEFAULT_OG_INPUT.gradientAngle, 0, 360),
    patternIntensity: numberValue(source.patternIntensity, DEFAULT_OG_INPUT.patternIntensity, 0, 100),
    imageOverlay: numberValue(source.imageOverlay, DEFAULT_OG_INPUT.imageOverlay, 0, 95),
    backgroundImageDataUrl: "",
    logoDataUrl: "",
    logoPosition: enumValue(source.logoPosition, LOGO_POSITIONS, DEFAULT_OG_INPUT.logoPosition),
    textAlign: enumValue(source.textAlign, ALIGNMENTS, DEFAULT_OG_INPUT.textAlign),
    titleSize: numberValue(source.titleSize, DEFAULT_OG_INPUT.titleSize, 42, 104),
    subtitleSize: numberValue(source.subtitleSize, DEFAULT_OG_INPUT.subtitleSize, 18, 42),
    badgeSize: numberValue(source.badgeSize, DEFAULT_OG_INPUT.badgeSize, 14, 30),
    frameRadius: numberValue(source.frameRadius, DEFAULT_OG_INPUT.frameRadius, 0, 72),
    safeArea: booleanValue(source.safeArea, DEFAULT_OG_INPUT.safeArea),
    siteUrl: stringValue(source.siteUrl, DEFAULT_OG_INPUT.siteUrl, 500),
    altText: stringValue(source.altText, DEFAULT_OG_INPUT.altText, 300),
    twitterCard: enumValue(source.twitterCard, TWITTER_CARDS, DEFAULT_OG_INPUT.twitterCard),
    exportPack: enumValue(source.exportPack, EXPORT_PACK_IDS, DEFAULT_OG_INPUT.exportPack),
  };
}

export function createOgProject(input: OgImageInput, exportedAt = new Date().toISOString()): OgProjectFile {
  return {
    tool: OG_PROJECT_TOOL,
    version: OG_PROJECT_VERSION,
    exportedAt,
    input: createSettingsOnlyInput(input),
    assetPolicy: {
      embeddedAssets: false,
      note: "Uploaded logos and background images are intentionally excluded. Reattach local source files after importing this settings project.",
    },
  };
}

export function createOgProjectJson(input: OgImageInput): string {
  return `${JSON.stringify(createOgProject(input), null, 2)}\n`;
}

export function parseOgProjectJson(source: string): OgProjectFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }
  const root = asRecord(parsed);
  if (!root) throw new Error("The project file must contain a JSON object.");
  if (root.tool !== OG_PROJECT_TOOL) throw new Error("This JSON file was not exported by the Darma OG image generator.");
  if (root.version !== OG_PROJECT_VERSION) throw new Error(`Unsupported project version. Expected version ${OG_PROJECT_VERSION}.`);
  return {
    tool: OG_PROJECT_TOOL,
    version: OG_PROJECT_VERSION,
    exportedAt: stringValue(root.exportedAt, new Date(0).toISOString(), 80),
    input: normalizeOgInput(root.input),
    assetPolicy: {
      embeddedAssets: false,
      note: "Uploaded logos and background images are intentionally excluded. Reattach local source files after importing this settings project.",
    },
  };
}

function hexToRgb(hex: string): [number, number, number] | null {
  if (!HEX_RE.test(hex)) return null;
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function channelLuminance(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function contrastRatio(foreground: string, background: string): number {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  if (!fg || !bg) return 0;
  const fgLum = 0.2126 * channelLuminance(fg[0]) + 0.7152 * channelLuminance(fg[1]) + 0.0722 * channelLuminance(fg[2]);
  const bgLum = 0.2126 * channelLuminance(bg[0]) + 0.7152 * channelLuminance(bg[1]) + 0.0722 * channelLuminance(bg[2]);
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  return (lighter + 0.05) / (darker + 0.05);
}

export function createInputFingerprint(input: OgImageInput): string {
  const source = JSON.stringify(input);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `og-${(hash >>> 0).toString(16).padStart(8, "0")}-${source.length}`;
}

function hasAsset(assets: OgGeneratedAsset[], predicate: (asset: OgGeneratedAsset) => boolean): boolean {
  return assets.some(predicate);
}

export function createOgProductionChecks(
  input: OgImageInput,
  assets: OgGeneratedAsset[],
  generatedFingerprint?: string,
): OgAuditCheck[] {
  const checks: OgAuditCheck[] = [];
  const currentFingerprint = createInputFingerprint(input);
  const contrastBackground = input.backgroundMode === "gradient" ? input.gradientFrom : input.backgroundColor;
  const ratio = contrastRatio(input.foregroundColor, contrastBackground);
  const hasPrimary = hasAsset(assets, (asset) => asset.width === 1200 && asset.height === 630);
  const hasMetadata = hasAsset(assets, (asset) => asset.filename.endsWith("html-meta-tags.txt"));
  const assetBytes = assets.reduce((sum, asset) => sum + asset.size, 0);

  if (!input.title.trim()) checks.push({ id: "title", severity: "error", title: "Title is required", message: "Add a meaningful title before generating public preview assets." });
  else if (input.title.length > 90) checks.push({ id: "title", severity: "warning", title: "Title may wrap heavily", message: `${input.title.length} characters can create crowded mobile previews; aim for 60–90 characters.` });
  else checks.push({ id: "title", severity: "pass", title: "Title length is practical", message: `${input.title.length} characters should fit common social preview layouts.` });

  if (!input.altText.trim()) checks.push({ id: "alt", severity: "warning", title: "Alt text is missing", message: "Add a concise description for metadata completeness and accessible handoff." });
  else checks.push({ id: "alt", severity: "pass", title: "Alt text is present", message: "The project includes a reusable image description." });

  if (input.backgroundMode === "image") {
    checks.push({ id: "contrast", severity: "info", title: "Image contrast needs visual review", message: "Automated contrast cannot reliably inspect every uploaded background area; confirm title readability in all platform previews." });
  } else if (ratio < 3) {
    checks.push({ id: "contrast", severity: "error", title: "Foreground contrast is too low", message: `The main text/background ratio is approximately ${ratio.toFixed(2)}:1. Increase contrast before publishing.` });
  } else if (ratio < 4.5) {
    checks.push({ id: "contrast", severity: "warning", title: "Foreground contrast is marginal", message: `The main text/background ratio is approximately ${ratio.toFixed(2)}:1; small labels may be difficult to read.` });
  } else {
    checks.push({ id: "contrast", severity: "pass", title: "Foreground contrast is strong", message: `The main text/background ratio is approximately ${ratio.toFixed(2)}:1.` });
  }

  if (!assets.length) checks.push({ id: "assets", severity: "info", title: "Package generation is pending", message: "Wait for the preview and export files to finish rendering." });
  else if (!generatedFingerprint) checks.push({ id: "assets", severity: "info", title: "Package regeneration is in progress", message: "The previous preview remains visible while the updated files render; downloads stay disabled until completion." });
  else if (generatedFingerprint !== currentFingerprint) checks.push({ id: "assets", severity: "warning", title: "Generated files are stale", message: "The visible settings changed after the current package was rendered. Wait for regeneration before downloading." });
  else if (!hasPrimary || !hasMetadata) checks.push({ id: "assets", severity: "error", title: "Required package files are missing", message: "The package must include a 1200×630 image and copy-ready metadata." });
  else checks.push({ id: "assets", severity: "pass", title: "Generated package matches the design", message: `${assets.length} files (${formatBytes(assetBytes)}) correspond to the current settings.` });

  if (input.backgroundImageDataUrl || input.logoDataUrl) checks.push({ id: "project-assets", severity: "info", title: "Project JSON excludes uploaded images", message: "Settings backups stay compact and private; reattach the local logo or background after importing." });
  else checks.push({ id: "project-assets", severity: "pass", title: "Settings project is fully portable", message: "The design does not depend on uploaded binary assets." });

  if (!input.safeArea) checks.push({ id: "safe-area", severity: "info", title: "Safe-area guide is disabled", message: "Enable it temporarily when checking edge spacing for platform crops." });
  else checks.push({ id: "safe-area", severity: "pass", title: "Safe-area review is enabled", message: "The preview exposes the recommended crop-safe region." });

  return checks;
}

export function summarizeOgProduction(input: OgImageInput, assets: OgGeneratedAsset[], generatedFingerprint?: string) {
  const checks = createOgProductionChecks(input, assets, generatedFingerprint);
  const counts = checks.reduce<Record<OgAuditSeverity, number>>((result, check) => {
    result[check.severity] += 1;
    return result;
  }, { error: 0, warning: 0, info: 0, pass: 0 });
  const ready = counts.error === 0 && counts.warning === 0 && assets.length > 0 && generatedFingerprint === createInputFingerprint(input);
  const background = input.backgroundMode === "gradient" ? input.gradientFrom : input.backgroundColor;
  return {
    template: TEMPLATE_OPTIONS.find((item) => item.value === input.templateId)?.label ?? input.templateId,
    titleLength: input.title.length,
    contrast: input.backgroundMode === "image" ? null : contrastRatio(input.foregroundColor, background),
    assetCount: assets.length,
    assetBytes: assets.reduce((sum, asset) => sum + asset.size, 0),
    counts,
    ready,
    statusLabel: counts.error ? "Blocked" : counts.warning ? "Review" : ready ? "Ready" : "Rendering",
  };
}

export function createOgAuditMarkdown(input: OgImageInput, assets: OgGeneratedAsset[], generatedFingerprint?: string): string {
  const summary = summarizeOgProduction(input, assets, generatedFingerprint);
  const checks = createOgProductionChecks(input, assets, generatedFingerprint);
  const lines = [
    "# Open Graph production audit",
    "",
    `- Template: ${summary.template}`,
    `- Export pack: ${input.exportPack}`,
    `- Title length: ${summary.titleLength} characters`,
    `- Contrast: ${summary.contrast === null ? "Manual image review" : `${summary.contrast.toFixed(2)}:1`}`,
    `- Generated files: ${summary.assetCount}`,
    `- Package size: ${formatBytes(summary.assetBytes)}`,
    `- Readiness: ${summary.statusLabel}`,
    "",
    "## Checks",
    "",
    ...checks.map((check) => `- **${check.severity.toUpperCase()} — ${check.title}:** ${check.message}`),
    "",
    "## Privacy and handoff",
    "",
    "This report is generated locally. The settings project excludes uploaded logo and background image data.",
    "",
  ];
  return lines.join("\n");
}

export function createOgMetricsCsv(input: OgImageInput, assets: OgGeneratedAsset[], generatedFingerprint?: string): string {
  const summary = summarizeOgProduction(input, assets, generatedFingerprint);
  const cells = [
    "template,export_pack,title_characters,contrast_ratio,generated_files,package_bytes,errors,warnings,info,passes,status",
    [
      csvCell(summary.template),
      csvCell(input.exportPack),
      summary.titleLength,
      summary.contrast === null ? "manual" : summary.contrast.toFixed(2),
      summary.assetCount,
      summary.assetBytes,
      summary.counts.error,
      summary.counts.warning,
      summary.counts.info,
      summary.counts.pass,
      csvCell(summary.statusLabel),
    ].join(","),
  ];
  return `${cells.join("\n")}\n`;
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
