import { DEFAULT_MOCKUP_INPUT, EXPORT_PACKS } from "./presets";
import type {
  GeneratedMockupAsset,
  MockupAlignment,
  MockupBackgroundMode,
  MockupDevice,
  MockupExportPackId,
  MockupFitMode,
  MockupInput,
  MockupOrientation,
  MockupShadowStyle,
} from "./types";

export const MOCKUP_PROJECT_TOOL = "darma-app-screenshot-mockup-generator";
export const MOCKUP_PROJECT_VERSION = 1;
export const MAX_MOCKUP_PROJECT_BYTES = 1024 * 1024;

export type MockupAuditSeverity = "error" | "warning" | "info" | "pass";

export type MockupAuditCheck = {
  id: string;
  severity: MockupAuditSeverity;
  title: string;
  message: string;
};

export type MockupProjectFile = {
  tool: typeof MOCKUP_PROJECT_TOOL;
  version: typeof MOCKUP_PROJECT_VERSION;
  exportedAt: string;
  input: MockupInput;
  sourceReferences: {
    screenshotName: string;
    screenshotWidth: number;
    screenshotHeight: number;
    screenshotEmbedded: false;
    backgroundEmbedded: false;
    note: string;
  };
};

const DEVICE_VALUES = new Set<MockupDevice>(["phone", "tablet", "laptop", "desktop", "browser", "card"]);
const ORIENTATION_VALUES = new Set<MockupOrientation>(["portrait", "landscape"]);
const EXPORT_PACK_VALUES = new Set<MockupExportPackId>(EXPORT_PACKS.map((pack) => pack.id));
const BACKGROUND_VALUES = new Set<MockupBackgroundMode>(["solid", "gradient", "mesh", "image"]);
const FIT_VALUES = new Set<MockupFitMode>(["cover", "contain"]);
const SHADOW_VALUES = new Set<MockupShadowStyle>(["none", "soft", "deep", "float"]);
const ALIGNMENT_VALUES = new Set<MockupAlignment>(["left", "center", "right"]);
const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function stringValue(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/\0/g, "").slice(0, maxLength);
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function numberValue(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function enumValue<T extends string>(value: unknown, allowed: Set<T>, fallback: T): T {
  return typeof value === "string" && allowed.has(value as T) ? value as T : fallback;
}

function colorValue(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX_RE.test(value) ? value.toLowerCase() : fallback;
}

export function createSettingsOnlyMockupInput(input: MockupInput): MockupInput {
  return {
    ...input,
    screenshotDataUrl: "",
    screenshotName: "",
    screenshotWidth: 0,
    screenshotHeight: 0,
    backgroundImageDataUrl: "",
  };
}

export function normalizeMockupInput(value: unknown): MockupInput {
  const source = asRecord(value) ?? {};
  return {
    screenshotDataUrl: "",
    screenshotName: "",
    screenshotWidth: 0,
    screenshotHeight: 0,
    backgroundImageDataUrl: "",
    device: enumValue(source.device, DEVICE_VALUES, DEFAULT_MOCKUP_INPUT.device),
    orientation: enumValue(source.orientation, ORIENTATION_VALUES, DEFAULT_MOCKUP_INPUT.orientation),
    exportPackId: enumValue(source.exportPackId, EXPORT_PACK_VALUES, DEFAULT_MOCKUP_INPUT.exportPackId),
    backgroundMode: enumValue(source.backgroundMode, BACKGROUND_VALUES, DEFAULT_MOCKUP_INPUT.backgroundMode),
    backgroundColor: colorValue(source.backgroundColor, DEFAULT_MOCKUP_INPUT.backgroundColor),
    gradientFrom: colorValue(source.gradientFrom, DEFAULT_MOCKUP_INPUT.gradientFrom),
    gradientTo: colorValue(source.gradientTo, DEFAULT_MOCKUP_INPUT.gradientTo),
    gradientAngle: numberValue(source.gradientAngle, DEFAULT_MOCKUP_INPUT.gradientAngle, 0, 360),
    foregroundColor: colorValue(source.foregroundColor, DEFAULT_MOCKUP_INPUT.foregroundColor),
    mutedColor: colorValue(source.mutedColor, DEFAULT_MOCKUP_INPUT.mutedColor),
    accentColor: colorValue(source.accentColor, DEFAULT_MOCKUP_INPUT.accentColor),
    title: stringValue(source.title, DEFAULT_MOCKUP_INPUT.title, 180),
    subtitle: stringValue(source.subtitle, DEFAULT_MOCKUP_INPUT.subtitle, 600),
    badge: stringValue(source.badge, DEFAULT_MOCKUP_INPUT.badge, 80),
    footer: stringValue(source.footer, DEFAULT_MOCKUP_INPUT.footer, 160),
    showText: booleanValue(source.showText, DEFAULT_MOCKUP_INPUT.showText),
    showBadge: booleanValue(source.showBadge, DEFAULT_MOCKUP_INPUT.showBadge),
    showFooter: booleanValue(source.showFooter, DEFAULT_MOCKUP_INPUT.showFooter),
    showDeviceChrome: booleanValue(source.showDeviceChrome, DEFAULT_MOCKUP_INPUT.showDeviceChrome),
    showReflection: booleanValue(source.showReflection, DEFAULT_MOCKUP_INPUT.showReflection),
    showSafeArea: booleanValue(source.showSafeArea, DEFAULT_MOCKUP_INPUT.showSafeArea),
    fitMode: enumValue(source.fitMode, FIT_VALUES, DEFAULT_MOCKUP_INPUT.fitMode),
    shadow: enumValue(source.shadow, SHADOW_VALUES, DEFAULT_MOCKUP_INPUT.shadow),
    alignment: enumValue(source.alignment, ALIGNMENT_VALUES, DEFAULT_MOCKUP_INPUT.alignment),
    canvasWidth: numberValue(source.canvasWidth, DEFAULT_MOCKUP_INPUT.canvasWidth, 480, 4096),
    canvasHeight: numberValue(source.canvasHeight, DEFAULT_MOCKUP_INPUT.canvasHeight, 480, 4096),
    padding: numberValue(source.padding, DEFAULT_MOCKUP_INPUT.padding, 0, 480),
    frameRadius: numberValue(source.frameRadius, DEFAULT_MOCKUP_INPUT.frameRadius, 0, 120),
    deviceScale: numberValue(source.deviceScale, DEFAULT_MOCKUP_INPUT.deviceScale, 20, 125),
    rotate: numberValue(source.rotate, DEFAULT_MOCKUP_INPUT.rotate, -20, 20),
    browserUrl: stringValue(source.browserUrl, DEFAULT_MOCKUP_INPUT.browserUrl, 500),
    filePrefix: stringValue(source.filePrefix, DEFAULT_MOCKUP_INPUT.filePrefix, 100),
  };
}

export function createMockupProject(input: MockupInput, exportedAt = new Date().toISOString()): MockupProjectFile {
  return {
    tool: MOCKUP_PROJECT_TOOL,
    version: MOCKUP_PROJECT_VERSION,
    exportedAt,
    input: createSettingsOnlyMockupInput(input),
    sourceReferences: {
      screenshotName: input.screenshotName.replace(/\0/g, "").slice(0, 240),
      screenshotWidth: Math.max(0, Math.round(input.screenshotWidth)),
      screenshotHeight: Math.max(0, Math.round(input.screenshotHeight)),
      screenshotEmbedded: false,
      backgroundEmbedded: false,
      note: "Uploaded screenshot and background image bytes are excluded. Reattach local source files after importing this settings project.",
    },
  };
}

export function createMockupProjectJson(input: MockupInput): string {
  return `${JSON.stringify(createMockupProject(input), null, 2)}\n`;
}

export function parseMockupProjectJson(source: string): MockupProjectFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }
  const root = asRecord(parsed);
  if (!root) throw new Error("The project file must contain a JSON object.");
  if (root.tool !== MOCKUP_PROJECT_TOOL) throw new Error("This JSON file was not exported by the Darma app screenshot mockup generator.");
  if (root.version !== MOCKUP_PROJECT_VERSION) throw new Error(`Unsupported project version. Expected version ${MOCKUP_PROJECT_VERSION}.`);
  const references = asRecord(root.sourceReferences) ?? {};
  return {
    tool: MOCKUP_PROJECT_TOOL,
    version: MOCKUP_PROJECT_VERSION,
    exportedAt: stringValue(root.exportedAt, new Date(0).toISOString(), 80),
    input: normalizeMockupInput(root.input),
    sourceReferences: {
      screenshotName: stringValue(references.screenshotName, "", 240),
      screenshotWidth: numberValue(references.screenshotWidth, 0, 0, 20000),
      screenshotHeight: numberValue(references.screenshotHeight, 0, 0, 20000),
      screenshotEmbedded: false,
      backgroundEmbedded: false,
      note: "Uploaded screenshot and background image bytes are excluded. Reattach local source files after importing this settings project.",
    },
  };
}

function assetSignature(value: string): string {
  if (!value) return "none";
  return `${value.length}:${value.slice(0, 48)}:${value.slice(-48)}`;
}

export function createMockupFingerprint(input: MockupInput): string {
  const source = JSON.stringify({
    ...input,
    screenshotDataUrl: assetSignature(input.screenshotDataUrl),
    backgroundImageDataUrl: assetSignature(input.backgroundImageDataUrl),
  });
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `mockup-${(hash >>> 0).toString(16).padStart(8, "0")}-${source.length}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function selectedPack(input: MockupInput) {
  return EXPORT_PACKS.find((pack) => pack.id === input.exportPackId) ?? EXPORT_PACKS[0];
}

export function createMockupProductionChecks(
  input: MockupInput,
  assets: GeneratedMockupAsset[],
  generatedFingerprint?: string,
): MockupAuditCheck[] {
  const checks: MockupAuditCheck[] = [];
  const currentFingerprint = createMockupFingerprint(input);
  const pack = selectedPack(input);
  const totalBytes = assets.reduce((sum, asset) => sum + asset.blob.size, 0);
  const duplicateNames = assets.filter((asset, index) => assets.findIndex((candidate) => candidate.filename === asset.filename) !== index);

  if (!input.screenshotDataUrl) {
    checks.push({ id: "source", severity: "error", title: "Screenshot source is missing", message: "Placeholder previews are useful for exploration, but attach a real screenshot before production export." });
  } else if (Math.min(input.screenshotWidth, input.screenshotHeight) < 720) {
    checks.push({ id: "source", severity: "warning", title: "Screenshot resolution is limited", message: `${input.screenshotWidth}×${input.screenshotHeight} may soften in large exports. Use a source with a short side of at least 720 px.` });
  } else {
    checks.push({ id: "source", severity: "pass", title: "Screenshot source is ready", message: `${input.screenshotName || "Local screenshot"} is ${input.screenshotWidth}×${input.screenshotHeight}.` });
  }

  if (input.backgroundMode === "image" && !input.backgroundImageDataUrl) {
    checks.push({ id: "background", severity: "error", title: "Image background is not attached", message: "Upload a background image or choose solid, gradient, or mesh mode." });
  } else {
    checks.push({ id: "background", severity: "pass", title: "Background configuration is usable", message: `${input.backgroundMode} background mode is configured for the current composition.` });
  }

  if (input.showText && !input.title.trim()) {
    checks.push({ id: "copy", severity: "warning", title: "Marketing title is empty", message: "Add a concise title or disable the text overlay." });
  } else if (input.title.length > 76) {
    checks.push({ id: "copy", severity: "warning", title: "Marketing title may wrap heavily", message: `${input.title.length} characters can crowd narrow and social exports.` });
  } else {
    checks.push({ id: "copy", severity: "pass", title: "Overlay copy is practical", message: input.showText ? `${input.title.trim().length} title characters.` : "Text overlay is disabled." });
  }

  if (!input.filePrefix.trim() || !/^[a-z0-9._-]+$/i.test(input.filePrefix.trim())) {
    checks.push({ id: "filename", severity: "warning", title: "Filename prefix needs cleanup", message: "Use a descriptive URL-safe prefix with letters, numbers, dots, underscores, or hyphens." });
  } else {
    checks.push({ id: "filename", severity: "pass", title: "Filename prefix is portable", message: `${input.filePrefix.trim()} will produce predictable asset names.` });
  }

  if (!assets.length) {
    checks.push({ id: "freshness", severity: "warning", title: "No generated package", message: `Generate the ${pack.title} before downloading PNGs or the production ZIP.` });
  } else if (generatedFingerprint !== currentFingerprint) {
    checks.push({ id: "freshness", severity: "error", title: "Generated package is stale", message: "The design changed after generation. Regenerate the pack before downloading assets." });
  } else if (assets.length !== pack.sizes.length) {
    checks.push({ id: "freshness", severity: "error", title: "Generated package is incomplete", message: `Expected ${pack.sizes.length} PNG files for this pack but found ${assets.length}.` });
  } else {
    checks.push({ id: "freshness", severity: "pass", title: "Generated package matches the design", message: `${assets.length} PNG files match the current project fingerprint.` });
  }

  if (duplicateNames.length) {
    checks.push({ id: "duplicates", severity: "error", title: "Duplicate output filenames", message: `${duplicateNames.length} generated file entries reuse an existing name.` });
  } else if (assets.length) {
    checks.push({ id: "duplicates", severity: "pass", title: "Output filenames are unique", message: "Generated PNG names can be copied into one public asset directory." });
  }

  if (totalBytes > 24 * 1024 * 1024) {
    checks.push({ id: "payload", severity: "warning", title: "Production payload is large", message: `${formatBytes(totalBytes)} across the generated PNGs may be expensive to transfer. Compress or selectively ship sizes.` });
  } else if (assets.length) {
    checks.push({ id: "payload", severity: "info", title: "Review image compression before publishing", message: `${formatBytes(totalBytes)} was generated locally. PNG is lossless; WebP or AVIF may reduce delivery cost.` });
  }

  if (input.exportPackId === "app-store") {
    checks.push({ id: "marketplace", severity: "info", title: "Marketplace dimensions need final verification", message: "Store specifications and device classes can change. Confirm current platform requirements before submission." });
  }

  checks.push({ id: "privacy", severity: "info", title: "Project JSON excludes uploaded images", message: "Screenshot and background bytes stay local and must be reattached after importing the project file." });
  return checks;
}

export function scoreMockupReadiness(checks: MockupAuditCheck[]): number {
  const penalty = checks.reduce((sum, check) => {
    if (check.severity === "error") return sum + 28;
    if (check.severity === "warning") return sum + 10;
    if (check.severity === "info") return sum + 1;
    return sum;
  }, 0);
  return Math.max(0, 100 - penalty);
}

export function summarizeMockupProduction(
  input: MockupInput,
  assets: GeneratedMockupAsset[],
  generatedFingerprint?: string,
) {
  const checks = createMockupProductionChecks(input, assets, generatedFingerprint);
  const score = scoreMockupReadiness(checks);
  const pack = selectedPack(input);
  const assetBytes = assets.reduce((sum, asset) => sum + asset.blob.size, 0);
  return {
    source: input.screenshotDataUrl ? `${input.screenshotWidth}×${input.screenshotHeight}` : "Not attached",
    pack: pack.title,
    assetCount: assets.length,
    assetBytes,
    score,
    statusLabel: checks.some((check) => check.severity === "error") ? "Blocked" : checks.some((check) => check.severity === "warning") ? "Review" : assets.length ? "Ready" : "Draft",
    isFresh: assets.length > 0 && generatedFingerprint === createMockupFingerprint(input),
    checks,
  };
}

function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function createMockupMetricsCsv(
  input: MockupInput,
  assets: GeneratedMockupAsset[],
  generatedFingerprint?: string,
): string {
  const summary = summarizeMockupProduction(input, assets, generatedFingerprint);
  const rows: Array<[string, string | number]> = [
    ["source", summary.source],
    ["device", input.device],
    ["orientation", input.orientation],
    ["export_pack", input.exportPackId],
    ["background_mode", input.backgroundMode],
    ["canvas_width", input.canvasWidth],
    ["canvas_height", input.canvasHeight],
    ["generated_files", summary.assetCount],
    ["generated_bytes", summary.assetBytes],
    ["readiness_score", summary.score],
    ["package_status", summary.statusLabel],
  ];
  return `metric,value\n${rows.map(([metric, value]) => `${csvCell(metric)},${csvCell(value)}`).join("\n")}\n`;
}

export function createMockupMarkdownReport(
  input: MockupInput,
  assets: GeneratedMockupAsset[],
  generatedFingerprint?: string,
): string {
  const summary = summarizeMockupProduction(input, assets, generatedFingerprint);
  const lines = [
    "# App Screenshot Mockup Production Report",
    "",
    `- Generated: ${new Date().toISOString()}`,
    `- Device: ${input.device} (${input.orientation})`,
    `- Export pack: ${summary.pack}`,
    `- Source: ${summary.source}`,
    `- Background: ${input.backgroundMode}`,
    `- Generated files: ${summary.assetCount}`,
    `- Generated payload: ${formatBytes(summary.assetBytes)}`,
    `- Readiness: ${summary.score}/100 (${summary.statusLabel})`,
    "",
    "## Production checks",
    "",
    ...summary.checks.map((check) => `- **${check.severity.toUpperCase()} — ${check.title}:** ${check.message}`),
    "",
    "## Generated assets",
    "",
    ...(assets.length ? assets.map((asset) => `- ${asset.filename} — ${asset.width}×${asset.height} — ${formatBytes(asset.blob.size)}`) : ["- No PNG assets generated yet."]),
    "",
    "## Privacy",
    "",
    "The editable project file excludes uploaded screenshot and background-image bytes. Reattach those local files after importing the project.",
    "",
  ];
  return lines.join("\n");
}
