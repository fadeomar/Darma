import {
  createDefaultResponsiveImageState,
  estimateSelectedCandidate,
  estimateSlotWidth,
  generateAllResponsiveImageCode,
  generateCssHelper,
  generateImgMarkup,
  generateNextImageMarkup,
  generatePictureMarkup,
  generateSizes,
  generateSrcset,
  normalizeResponsiveImageState,
} from "./responsiveImage";
import type {
  ImageCandidate,
  ImageFormat,
  PictureSource,
  ResponsiveImageState,
  SizesRule,
} from "./types";

export const RESPONSIVE_IMAGE_PROJECT_TOOL = "darma-responsive-image-srcset-generator" as const;
export const RESPONSIVE_IMAGE_PROJECT_VERSION = 1 as const;
export const RESPONSIVE_IMAGE_IMPORT_MAX_BYTES = 1_000_000;

export type ResponsiveImageAuditSeverity = "error" | "warning" | "info" | "pass";

export type ResponsiveImageAuditCheck = {
  id: string;
  title: string;
  message: string;
  severity: ResponsiveImageAuditSeverity;
};

export type ResponsiveImageAuditCounts = Record<ResponsiveImageAuditSeverity, number>;

export type ResponsiveImageProject = {
  tool: typeof RESPONSIVE_IMAGE_PROJECT_TOOL;
  schemaVersion: typeof RESPONSIVE_IMAGE_PROJECT_VERSION;
  exportedAt: string;
  state: ResponsiveImageState;
};

export type ResponsiveImageMetrics = {
  candidateCount: number;
  pictureSourceCount: number;
  currentSlotPx: number;
  currentIdealWidth: number;
  selectedCandidateWidth: number;
  largestCandidateWidth: number;
  htmlBytes: number;
  cssBytes: number;
  reactBytes: number;
  totalBytes: number;
  readinessScore: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  passCount: number;
};

export type ResponsiveImageSummaryCard = {
  label: string;
  value: string;
  detail: string;
};

const IMAGE_FORMATS = new Set<ImageFormat>(["jpg", "jpeg", "png", "webp", "avif", "custom"]);
const MODES = new Set<ResponsiveImageState["mode"]>(["img", "picture", "next-image"]);
const LOADING_VALUES = new Set<ResponsiveImageState["attributes"]["loading"]>(["lazy", "eager"]);
const DECODING_VALUES = new Set<ResponsiveImageState["attributes"]["decoding"]>(["async", "auto", "sync"]);
const FETCH_PRIORITIES = new Set<ResponsiveImageState["attributes"]["fetchPriority"]>(["auto", "high", "low"]);
const OBJECT_FITS = new Set<ResponsiveImageState["attributes"]["objectFit"]>(["cover", "contain", "fill", "none", "scale-down"]);
const QUOTE_STYLES = new Set<ResponsiveImageState["exportOptions"]["quoteStyle"]>(["double", "single"]);
const PICTURE_TYPES = new Set<PictureSource["type"]>(["image/avif", "image/webp", "image/jpeg", "image/png", "custom"]);
const URL_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const SAFE_IMAGE_SCHEMES = new Set(["http:", "https:", "data:", "blob:"]);
const CSS_LENGTH = /^(?:\d+(?:\.\d+)?(?:px|vw|vh|vmin|vmax|rem|em|ch|%)|(?:calc|min|max|clamp)\(.+\))$/i;
const MEDIA_CONDITION = /^\s*\([^()]+\)\s*(?:and\s*\([^()]+\)\s*)*$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, fallback: string, maxLength: number): string {
  return (typeof value === "string" ? value : fallback).replaceAll("\0", "").slice(0, maxLength);
}

function cleanBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function cleanNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function cleanEnum<T extends string>(value: unknown, allowed: Set<T>, fallback: T): T {
  return typeof value === "string" && allowed.has(value as T) ? (value as T) : fallback;
}

function cleanDpr(value: unknown, fallback: ResponsiveImageState["previewDpr"]): ResponsiveImageState["previewDpr"] {
  const parsed = Number(value);
  return parsed === 1 || parsed === 1.5 || parsed === 2 || parsed === 3 ? parsed : fallback;
}

function safeId(value: unknown, fallback: string): string {
  const cleaned = cleanText(value, fallback, 100).trim().replace(/[^a-zA-Z0-9_-]/g, "-");
  return cleaned || fallback;
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function assertUniqueIds(value: unknown, label: string): void {
  const seen = new Set<string>();
  for (const item of readArray(value)) {
    if (!isRecord(item)) continue;
    const id = typeof item.id === "string" ? item.id.trim() : "";
    if (!id) continue;
    if (seen.has(id)) throw new Error(`${label} contains a duplicate id: ${id}.`);
    seen.add(id);
  }
}

function normalizeCandidate(value: unknown, index: number, prefix: string): ImageCandidate {
  const base: ImageCandidate = {
    id: `${prefix}-${index + 1}`,
    url: `/images/image-${(index + 1) * 400}.jpg`,
    width: (index + 1) * 400,
    format: "jpg",
  };
  if (!isRecord(value)) return base;
  return {
    id: safeId(value.id, base.id),
    url: cleanText(value.url, base.url, 500).trim(),
    width: Math.round(cleanNumber(value.width, base.width, 16, 8000)),
    format: cleanEnum(value.format, IMAGE_FORMATS, base.format),
  };
}

function normalizeSizesRule(value: unknown, index: number, prefix: string): SizesRule {
  const base: SizesRule = {
    id: `${prefix}-${index + 1}`,
    mediaCondition: "(max-width: 640px)",
    slotSize: "100vw",
  };
  if (!isRecord(value)) return base;
  return {
    id: safeId(value.id, base.id),
    mediaCondition: cleanText(value.mediaCondition, base.mediaCondition, 160).trim(),
    slotSize: cleanText(value.slotSize, base.slotSize, 100).trim(),
  };
}

function normalizePictureSource(value: unknown, index: number): PictureSource {
  const base: PictureSource = {
    id: `source-${index + 1}`,
    type: "image/webp",
    media: "",
    urlPattern: "/images/image-{width}.webp",
    candidates: [400, 800, 1200].map((width, candidateIndex) => ({
      id: `source-${index + 1}-candidate-${candidateIndex + 1}`,
      url: `/images/image-${width}.webp`,
      width,
      format: "webp" as const,
    })),
    sizes: [],
  };
  if (!isRecord(value)) return base;
  assertUniqueIds(value.candidates, `Picture source ${index + 1} candidates`);
  assertUniqueIds(value.sizes, `Picture source ${index + 1} sizes rules`);
  const candidates = readArray(value.candidates).slice(0, 12).map((candidate, candidateIndex) => normalizeCandidate(candidate, candidateIndex, `source-${index + 1}-candidate`));
  const sizes = readArray(value.sizes).slice(0, 8).map((rule, ruleIndex) => normalizeSizesRule(rule, ruleIndex, `source-${index + 1}-size`));
  return {
    id: safeId(value.id, base.id),
    type: cleanEnum(value.type, PICTURE_TYPES, base.type),
    media: cleanText(value.media, "", 180).trim(),
    urlPattern: cleanText(value.urlPattern, base.urlPattern, 500).trim(),
    candidates: candidates.length ? candidates : base.candidates,
    sizes,
  };
}

export function normalizeResponsiveImageProjectState(value: unknown): ResponsiveImageState {
  const base = createDefaultResponsiveImageState();
  if (!isRecord(value)) return base;

  assertUniqueIds(value.candidates, "Candidates");
  assertUniqueIds(value.sizes, "Sizes rules");
  assertUniqueIds(value.pictureSources, "Picture sources");

  const rawAttributes = isRecord(value.attributes) ? value.attributes : {};
  const rawExportOptions = isRecord(value.exportOptions) ? value.exportOptions : {};
  const candidates = readArray(value.candidates).slice(0, 12).map((candidate, index) => normalizeCandidate(candidate, index, "candidate"));
  const sizes = readArray(value.sizes).slice(0, 8).map((rule, index) => normalizeSizesRule(rule, index, "size"));
  const pictureSources = readArray(value.pictureSources).slice(0, 5).map(normalizePictureSource);

  return normalizeResponsiveImageState({
    mode: cleanEnum(value.mode, MODES, base.mode),
    presetId: cleanText(value.presetId, "custom", 80),
    urlPattern: cleanText(value.urlPattern, base.urlPattern, 500),
    fallbackSrc: cleanText(value.fallbackSrc, base.fallbackSrc, 500),
    candidates: candidates.length ? candidates : base.candidates,
    sizes,
    defaultSlotSize: cleanText(value.defaultSlotSize, base.defaultSlotSize, 100),
    pictureSources,
    attributes: {
      src: cleanText(rawAttributes.src, base.attributes.src, 500),
      alt: cleanText(rawAttributes.alt, base.attributes.alt, 300),
      width: Math.round(cleanNumber(rawAttributes.width, base.attributes.width, 1, 10000)),
      height: Math.round(cleanNumber(rawAttributes.height, base.attributes.height, 1, 10000)),
      loading: cleanEnum(rawAttributes.loading, LOADING_VALUES, base.attributes.loading),
      decoding: cleanEnum(rawAttributes.decoding, DECODING_VALUES, base.attributes.decoding),
      fetchPriority: cleanEnum(rawAttributes.fetchPriority, FETCH_PRIORITIES, base.attributes.fetchPriority),
      objectFit: cleanEnum(rawAttributes.objectFit, OBJECT_FITS, base.attributes.objectFit),
      className: cleanText(rawAttributes.className, base.attributes.className, 160),
    },
    previewViewportWidth: Math.round(cleanNumber(value.previewViewportWidth, base.previewViewportWidth, 320, 1920)),
    previewDpr: cleanDpr(value.previewDpr, base.previewDpr),
    showSlotRuler: cleanBoolean(value.showSlotRuler, base.showSlotRuler),
    showCandidateAnalyzer: cleanBoolean(value.showCandidateAnalyzer, base.showCandidateAnalyzer),
    exportOptions: {
      includeComments: cleanBoolean(rawExportOptions.includeComments, base.exportOptions.includeComments),
      includeCssHelper: cleanBoolean(rawExportOptions.includeCssHelper, base.exportOptions.includeCssHelper),
      quoteStyle: cleanEnum(rawExportOptions.quoteStyle, QUOTE_STYLES, base.exportOptions.quoteStyle),
      componentName: cleanText(rawExportOptions.componentName, base.exportOptions.componentName, 100),
    },
  });
}

export function createResponsiveImageProject(state: ResponsiveImageState): ResponsiveImageProject {
  return {
    tool: RESPONSIVE_IMAGE_PROJECT_TOOL,
    schemaVersion: RESPONSIVE_IMAGE_PROJECT_VERSION,
    exportedAt: new Date().toISOString(),
    state: normalizeResponsiveImageProjectState(state),
  };
}

export function parseResponsiveImageProject(text: string): ResponsiveImageProject {
  if (!text.trim()) throw new Error("The selected project file is empty.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }
  if (!isRecord(value)) throw new Error("Project root must be an object.");
  if (value.tool !== RESPONSIVE_IMAGE_PROJECT_TOOL) throw new Error("This JSON file was not created by the Darma responsive image generator.");
  if (value.schemaVersion !== RESPONSIVE_IMAGE_PROJECT_VERSION) throw new Error(`Unsupported project version. Expected version ${RESPONSIVE_IMAGE_PROJECT_VERSION}.`);
  return {
    tool: RESPONSIVE_IMAGE_PROJECT_TOOL,
    schemaVersion: RESPONSIVE_IMAGE_PROJECT_VERSION,
    exportedAt: cleanText(value.exportedAt, new Date().toISOString(), 80),
    state: normalizeResponsiveImageProjectState(value.state),
  };
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isUnsafeImageUrl(value: string): boolean {
  const text = value.trim();
  if (!text || !URL_SCHEME.test(text)) return false;
  try {
    return !SAFE_IMAGE_SCHEMES.has(new URL(text).protocol);
  } catch {
    return true;
  }
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values)];
}

function candidateCoverage(state: ResponsiveImageState): { required: number; largest: number; selected: number } {
  const slot = estimateSlotWidth(state.sizes, state.defaultSlotSize, state.previewViewportWidth);
  const required = Math.round(slot * state.previewDpr);
  const selected = estimateSelectedCandidate(state.candidates, slot, state.previewDpr)?.width ?? 0;
  const largest = Math.max(0, ...state.candidates.map((candidate) => candidate.width));
  return { required, largest, selected };
}

export function summarizeResponsiveImageAudit(checks: ResponsiveImageAuditCheck[]): ResponsiveImageAuditCounts {
  return checks.reduce<ResponsiveImageAuditCounts>((counts, check) => {
    counts[check.severity] += 1;
    return counts;
  }, { error: 0, warning: 0, info: 0, pass: 0 });
}

export function buildResponsiveImageAudit(state: ResponsiveImageState): ResponsiveImageAuditCheck[] {
  const normalized = normalizeResponsiveImageProjectState(state);
  const checks: ResponsiveImageAuditCheck[] = [];
  const allCandidateUrls = [
    normalized.attributes.src,
    normalized.fallbackSrc,
    ...normalized.candidates.map((candidate) => candidate.url),
    ...normalized.pictureSources.flatMap((source) => source.candidates.map((candidate) => candidate.url)),
  ];
  const duplicateWidths = normalized.candidates.length - uniqueNumbers(normalized.candidates.map((candidate) => candidate.width)).length;
  const coverage = candidateCoverage(normalized);
  const currentSlot = estimateSlotWidth(normalized.sizes, normalized.defaultSlotSize, normalized.previewViewportWidth);

  if (!normalized.attributes.src.trim() && !normalized.fallbackSrc.trim()) {
    checks.push({ id: "fallback-missing", title: "Fallback source", message: "Add a fallback image URL before exporting markup.", severity: "error" });
  } else {
    checks.push({ id: "fallback-present", title: "Fallback source", message: "A fallback image URL is available for the final img element.", severity: "pass" });
  }

  if (normalized.candidates.some((candidate) => !candidate.url.trim())) {
    checks.push({ id: "candidate-url-missing", title: "Candidate URLs", message: "Every srcset candidate needs a non-empty URL.", severity: "error" });
  }

  if (allCandidateUrls.some(isUnsafeImageUrl)) {
    checks.push({ id: "unsafe-url-scheme", title: "Image URL schemes", message: "One or more image URLs use a scheme that should not be emitted into HTML.", severity: "error" });
  } else {
    checks.push({ id: "safe-url-scheme", title: "Image URL schemes", message: "Image URLs use relative paths or browser-safe image schemes.", severity: "pass" });
  }

  if (duplicateWidths) {
    checks.push({ id: "duplicate-widths", title: "Candidate widths", message: `${duplicateWidths} duplicate width descriptor${duplicateWidths === 1 ? "" : "s"} can make srcset selection ambiguous.`, severity: "error" });
  } else {
    checks.push({ id: "unique-widths", title: "Candidate widths", message: `${normalized.candidates.length} unique width descriptor${normalized.candidates.length === 1 ? "" : "s"} are available.`, severity: "pass" });
  }

  if (coverage.largest < coverage.required) {
    checks.push({ id: "coverage-insufficient", title: "Current candidate coverage", message: `The preview needs about ${coverage.required}w, but the largest candidate is ${coverage.largest}w.`, severity: "warning" });
  } else {
    checks.push({ id: "coverage-sufficient", title: "Current candidate coverage", message: `The ${coverage.largest}w maximum covers the current ${coverage.required}w estimate.`, severity: "pass" });
  }

  const smallest = Math.min(...normalized.candidates.map((candidate) => candidate.width));
  const mobileSlot = estimateSlotWidth(normalized.sizes, normalized.defaultSlotSize, 375);
  if (Number.isFinite(smallest) && smallest > mobileSlot * 2) {
    checks.push({ id: "smallest-too-large", title: "Small-screen candidate", message: `The smallest candidate is ${smallest}w while the 375px viewport slot is about ${mobileSlot}px. Add a smaller asset if mobile payload matters.`, severity: "warning" });
  }

  const invalidSizes = [...normalized.sizes.map((rule) => rule.slotSize), normalized.defaultSlotSize].filter((value) => value.trim() && !CSS_LENGTH.test(value.trim()));
  if (invalidSizes.length) {
    checks.push({ id: "invalid-sizes", title: "Sizes syntax", message: `Review ${invalidSizes.length} slot-size value${invalidSizes.length === 1 ? "" : "s"}; only common CSS length functions and units are validated here.`, severity: "warning" });
  } else {
    checks.push({ id: "valid-sizes", title: "Sizes syntax", message: `The current sizes string resolves to an estimated ${currentSlot}px slot at ${normalized.previewViewportWidth}px.`, severity: "pass" });
  }

  const invalidMedia = normalized.sizes.filter((rule) => rule.mediaCondition.trim() && !MEDIA_CONDITION.test(rule.mediaCondition));
  if (invalidMedia.length) {
    checks.push({ id: "invalid-media", title: "Media conditions", message: `${invalidMedia.length} sizes media condition${invalidMedia.length === 1 ? "" : "s"} need manual syntax review.`, severity: "warning" });
  }

  if (!normalized.attributes.alt.trim()) {
    checks.push({ id: "alt-empty", title: "Alternative text", message: "Empty alt text is correct only for a decorative image. Add a useful description for meaningful content.", severity: "warning" });
  } else {
    checks.push({ id: "alt-present", title: "Alternative text", message: "The fallback image includes alternative text.", severity: "pass" });
  }

  checks.push({ id: "dimensions", title: "Intrinsic dimensions", message: `${normalized.attributes.width}×${normalized.attributes.height} reserves an aspect ratio and reduces layout shift.`, severity: "pass" });

  if (normalized.attributes.loading === "eager" && normalized.attributes.fetchPriority !== "high") {
    checks.push({ id: "eager-priority", title: "Loading priority", message: "An eager above-the-fold image normally benefits from high fetch priority.", severity: "warning" });
  } else if (normalized.attributes.loading === "lazy" && normalized.attributes.fetchPriority === "high") {
    checks.push({ id: "lazy-high", title: "Loading priority", message: "Lazy loading and high fetch priority send conflicting scheduling signals.", severity: "warning" });
  } else {
    checks.push({ id: "loading-aligned", title: "Loading priority", message: `${normalized.attributes.loading} loading and ${normalized.attributes.fetchPriority} fetch priority are aligned.`, severity: "pass" });
  }

  if (normalized.mode === "picture") {
    if (!normalized.pictureSources.length) {
      checks.push({ id: "picture-sources-missing", title: "Picture sources", message: "Picture mode needs at least one source for format fallback or art direction.", severity: "error" });
    } else if (normalized.pictureSources.some((source) => !source.candidates.length || source.candidates.some((candidate) => !candidate.url.trim()))) {
      checks.push({ id: "picture-source-invalid", title: "Picture sources", message: "Every picture source needs at least one valid candidate URL.", severity: "error" });
    } else {
      checks.push({ id: "picture-sources-ready", title: "Picture sources", message: `${normalized.pictureSources.length} source element${normalized.pictureSources.length === 1 ? "" : "s"} will be emitted before the fallback image.`, severity: "pass" });
    }
  }

  if (normalized.mode === "next-image") {
    checks.push({ id: "next-srcset-managed", title: "Next.js candidate handling", message: "Next.js Image manages its own srcset. The candidate list remains useful for planning source assets, not for direct Next.js markup.", severity: "info" });
    if (/^https?:\/\//i.test(normalized.attributes.src || normalized.fallbackSrc)) {
      checks.push({ id: "next-remote-config", title: "Remote image configuration", message: "Remote Next.js images require an allowed remotePatterns or domains configuration in next.config.", severity: "info" });
    }
  }

  if (normalized.candidates.length > 8) {
    checks.push({ id: "candidate-count", title: "Candidate maintenance", message: `${normalized.candidates.length} candidates are valid but may be harder to generate and maintain.`, severity: "info" });
  }

  const outputBytes = byteLength(generateAllResponsiveImageCode(normalized) + generateNextImageMarkup(normalized));
  checks.push({ id: "payload", title: "Markup payload", message: `${formatBytes(outputBytes)} of generated snippets will be included in the handoff.`, severity: outputBytes > 20_000 ? "warning" : "info" });
  checks.push({ id: "browser-test", title: "Browser verification", message: "Test the final markup with real image files, responsive DevTools, cache disabled, and at least one high-DPR device.", severity: "info" });

  return checks;
}

export function getResponsiveImageReadinessScore(checks: ResponsiveImageAuditCheck[]): number {
  const counts = summarizeResponsiveImageAudit(checks);
  return Math.max(0, Math.min(100, 100 - counts.error * 34 - counts.warning * 10 - counts.info * 2));
}

export function buildResponsiveImageMetrics(state: ResponsiveImageState, checks: ResponsiveImageAuditCheck[]): ResponsiveImageMetrics {
  const normalized = normalizeResponsiveImageProjectState(state);
  const counts = summarizeResponsiveImageAudit(checks);
  const slot = estimateSlotWidth(normalized.sizes, normalized.defaultSlotSize, normalized.previewViewportWidth);
  const selected = estimateSelectedCandidate(normalized.candidates, slot, normalized.previewDpr);
  const html = normalized.mode === "picture" ? generatePictureMarkup(normalized) : generateImgMarkup(normalized);
  const css = generateCssHelper(normalized);
  const react = generateNextImageMarkup(normalized);
  const htmlBytes = byteLength(html);
  const cssBytes = byteLength(css);
  const reactBytes = byteLength(react);
  return {
    candidateCount: normalized.candidates.length,
    pictureSourceCount: normalized.pictureSources.length,
    currentSlotPx: slot,
    currentIdealWidth: Math.round(slot * normalized.previewDpr),
    selectedCandidateWidth: selected?.width ?? 0,
    largestCandidateWidth: Math.max(0, ...normalized.candidates.map((candidate) => candidate.width)),
    htmlBytes,
    cssBytes,
    reactBytes,
    totalBytes: htmlBytes + cssBytes + reactBytes,
    readinessScore: getResponsiveImageReadinessScore(checks),
    errorCount: counts.error,
    warningCount: counts.warning,
    infoCount: counts.info,
    passCount: counts.pass,
  };
}

export function buildResponsiveImageSummary(state: ResponsiveImageState, checks: ResponsiveImageAuditCheck[]): ResponsiveImageSummaryCard[] {
  const normalized = normalizeResponsiveImageProjectState(state);
  const metrics = buildResponsiveImageMetrics(normalized, checks);
  const readiness = metrics.errorCount ? "Blocked" : metrics.warningCount ? "Review" : "Ready";
  return [
    { label: "Candidates", value: `${metrics.candidateCount}`, detail: `${metrics.largestCandidateWidth}w maximum source` },
    { label: "Current slot", value: `${metrics.currentSlotPx}px`, detail: `${metrics.currentIdealWidth}w ideal at ${normalized.previewDpr}× DPR` },
    { label: "Snippet payload", value: formatBytes(metrics.totalBytes), detail: `${formatBytes(metrics.htmlBytes)} HTML · ${formatBytes(metrics.reactBytes)} TSX` },
    { label: "Readiness", value: readiness, detail: metrics.errorCount ? `${metrics.errorCount} blocking error${metrics.errorCount === 1 ? "" : "s"}` : metrics.warningCount ? `${metrics.warningCount} warning${metrics.warningCount === 1 ? "" : "s"}` : `${metrics.passCount} checks passed` },
  ];
}

export function buildResponsiveImageMarkdownReport(state: ResponsiveImageState, checks: ResponsiveImageAuditCheck[]): string {
  const normalized = normalizeResponsiveImageProjectState(state);
  const metrics = buildResponsiveImageMetrics(normalized, checks);
  const lines = [
    "# Responsive image production report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${normalized.mode}`,
    `Fallback source: ${normalized.attributes.src || normalized.fallbackSrc || "Not set"}`,
    `Candidates: ${metrics.candidateCount}`,
    `Current slot: ${metrics.currentSlotPx}px at ${normalized.previewViewportWidth}px viewport`,
    `Ideal resource: ${metrics.currentIdealWidth}w at ${normalized.previewDpr}× DPR`,
    `Estimated selected candidate: ${metrics.selectedCandidateWidth || "None"}w`,
    `Readiness score: ${metrics.readinessScore}/100`,
    "",
    "## Sizes",
    "",
    `\`${generateSizes(normalized.sizes, normalized.defaultSlotSize)}\``,
    "",
    "## Candidate set",
    "",
    ...normalized.candidates.map((candidate) => `- ${candidate.width}w — ${candidate.url}`),
    "",
    "## Production checks",
    "",
    ...checks.map((check) => `- **${check.severity.toUpperCase()} — ${check.title}:** ${check.message}`),
    "",
    "## Deployment note",
    "",
    "Verify the generated markup against real files and inspect the selected request in browser network tools. Browser choice can differ because of caching, supported formats, and network heuristics.",
    "",
  ];
  return lines.join("\n");
}

function csvCell(value: string | number): string {
  const text = String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function buildResponsiveImageMetricsCsv(state: ResponsiveImageState, checks: ResponsiveImageAuditCheck[]): string {
  const metrics = buildResponsiveImageMetrics(state, checks);
  const headers = Object.keys(metrics);
  const values = Object.values(metrics);
  return `${headers.map(csvCell).join(",")}\n${values.map((value) => csvCell(value)).join(",")}\n`;
}

export function buildStandaloneResponsiveImageHtml(state: ResponsiveImageState): string {
  const normalized = normalizeResponsiveImageProjectState(state);
  const markup = normalized.mode === "picture" ? generatePictureMarkup(normalized) : generateImgMarkup(normalized);
  const css = generateCssHelper(normalized);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Responsive image preview</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 2rem; background: #f8fafc; font-family: system-ui, sans-serif; }
    .image-frame { width: min(100%, 1100px); }
${css.split("\n").map((line) => `    ${line}`).join("\n")}
  </style>
</head>
<body>
  <main class="image-frame">
${markup.split("\n").map((line) => `    ${line}`).join("\n")}
  </main>
</body>
</html>
`;
}

export function buildResponsiveImageProductionFiles(state: ResponsiveImageState, checks: ResponsiveImageAuditCheck[]): Record<string, string> {
  const normalized = normalizeResponsiveImageProjectState(state);
  const project = createResponsiveImageProject(normalized);
  const snippets = [
    generateAllResponsiveImageCode(normalized),
    "",
    normalized.exportOptions.includeComments ? "// Next.js Image component" : "",
    generateNextImageMarkup(normalized),
  ].filter(Boolean).join("\n");
  const readme = `# Responsive image production pack

This package was generated locally by Darma.

## Files

- \`responsive-image.html\`: standalone browser preview using img or picture markup.
- \`responsive-image.css\`: reusable responsive-image helper styles.
- \`ResponsiveImage.tsx\`: typed Next.js Image component.
- \`responsive-image-snippets.txt\`: img, picture, and Next.js snippets together.
- \`responsive-image-project.json\`: reopenable editor settings.
- \`production-report.md\`: production checks and candidate plan.
- \`production-metrics.csv\`: compact metrics for QA records.

Next.js manages its own srcset. Use the candidate plan to prepare source assets, and keep the generated sizes value aligned with the actual CSS layout.
`;
  return {
    "responsive-image.html": buildStandaloneResponsiveImageHtml(normalized),
    "responsive-image.css": normalized.exportOptions.includeCssHelper ? `${generateCssHelper(normalized)}\n` : "/* CSS helper disabled in project export options. */\n",
    "ResponsiveImage.tsx": `${generateNextImageMarkup(normalized)}\n`,
    "responsive-image-snippets.txt": `${snippets}\n`,
    "responsive-image-project.json": `${JSON.stringify(project, null, 2)}\n`,
    "production-report.md": buildResponsiveImageMarkdownReport(normalized, checks),
    "production-metrics.csv": buildResponsiveImageMetricsCsv(normalized, checks),
    "README.md": readme,
  };
}

export function buildResponsiveImageSrcsetManifest(state: ResponsiveImageState): string {
  const normalized = normalizeResponsiveImageProjectState(state);
  return JSON.stringify({
    fallbackSrc: normalized.attributes.src || normalized.fallbackSrc,
    srcset: generateSrcset(normalized.candidates),
    sizes: generateSizes(normalized.sizes, normalized.defaultSlotSize),
    candidates: normalized.candidates.map(({ url, width, format }) => ({ url, width, format })),
  }, null, 2);
}
