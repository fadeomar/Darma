import type {
  ImageCandidate,
  ImageFormat,
  PictureSource,
  ResponsiveImageState,
  ResponsiveImageValidationMessage,
  SizesRule,
} from "./types";

const DEFAULT_WIDTHS = [400, 800, 1200, 1600];
let counter = 0;

function uid(prefix = "id") {
  counter += 1;
  return `${prefix}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function quote(value: string, quoteStyle: "double" | "single") {
  const mark = quoteStyle === "single" ? "'" : '"';
  return `${mark}${value.replaceAll(mark, `\\${mark}`)}${mark}`;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function jsxEscape(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', "\\\"");
}

function mimeToFormat(type: PictureSource["type"]): ImageFormat {
  if (type === "image/avif") return "avif";
  if (type === "image/webp") return "webp";
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  return "custom";
}

function formatAttr(name: string, value: string | number | undefined, quoteStyle: "double" | "single") {
  if (value === undefined || value === "") return "";
  return `${name}=${quote(String(value), quoteStyle)}`;
}

function compareCandidates(a: ImageCandidate, b: ImageCandidate) {
  return a.width - b.width;
}

function normalizeCandidate(candidate: ImageCandidate): ImageCandidate {
  return {
    ...candidate,
    width: Math.round(clamp(candidate.width, 16, 8000)),
    url: candidate.url.slice(0, 300),
  };
}

export function createImageCandidate(partial: Partial<ImageCandidate> = {}): ImageCandidate {
  const width = Math.round(clamp(partial.width ?? 800, 16, 8000));
  const format = partial.format ?? "jpg";
  return {
    id: partial.id ?? uid("candidate"),
    url: partial.url ?? `/images/card-${width}.${format === "jpeg" ? "jpg" : format}`,
    width,
    format,
  };
}

export function createSizesRule(partial: Partial<SizesRule> = {}): SizesRule {
  return {
    id: partial.id ?? uid("size"),
    mediaCondition: partial.mediaCondition ?? "(max-width: 640px)",
    slotSize: partial.slotSize ?? "100vw",
  };
}

export function createPictureSource(partial: Partial<PictureSource> = {}): PictureSource {
  const type = partial.type ?? "image/webp";
  const format = mimeToFormat(type);
  const urlPattern = partial.urlPattern ?? `/images/card-{width}.${format === "custom" ? "webp" : format}`;
  return {
    id: partial.id ?? uid("source"),
    type,
    media: partial.media ?? "",
    urlPattern,
    candidates: partial.candidates ?? generateCandidatesFromPattern(urlPattern, [400, 800, 1200], format),
    sizes: partial.sizes ?? [createSizesRule({ mediaCondition: "(max-width: 640px)", slotSize: "100vw" })],
  };
}

export function generateCandidatesFromPattern(pattern: string, widths: number[], format: ImageCandidate["format"]): ImageCandidate[] {
  const safePattern = pattern.slice(0, 300) || "/images/image-{width}.jpg";
  return widths
    .map((width) => Math.round(clamp(width, 16, 8000)))
    .filter((width, index, list) => list.indexOf(width) === index)
    .sort((a, b) => a - b)
    .slice(0, 12)
    .map((width) => createImageCandidate({ width, format, url: safePattern.replaceAll("{width}", String(width)) }));
}

export function createDefaultResponsiveImageState(): ResponsiveImageState {
  const candidates = generateCandidatesFromPattern("/images/card-{width}.jpg", DEFAULT_WIDTHS, "jpg");
  return {
    mode: "img",
    presetId: "card-grid",
    urlPattern: "/images/card-{width}.jpg",
    fallbackSrc: "/images/card-800.jpg",
    candidates,
    sizes: [
      createSizesRule({ mediaCondition: "(max-width: 640px)", slotSize: "100vw" }),
      createSizesRule({ mediaCondition: "(max-width: 1024px)", slotSize: "50vw" }),
    ],
    defaultSlotSize: "33vw",
    pictureSources: [
      createPictureSource({ type: "image/avif", urlPattern: "/images/card-{width}.avif", candidates: generateCandidatesFromPattern("/images/card-{width}.avif", [400, 800, 1200], "avif") }),
      createPictureSource({ type: "image/webp", urlPattern: "/images/card-{width}.webp", candidates: generateCandidatesFromPattern("/images/card-{width}.webp", [400, 800, 1200], "webp") }),
    ],
    attributes: {
      src: "/images/card-800.jpg",
      alt: "Responsive card image",
      width: 1200,
      height: 800,
      loading: "lazy",
      decoding: "async",
      fetchPriority: "auto",
      objectFit: "cover",
      className: "responsive-image",
    },
    previewViewportWidth: 900,
    previewDpr: 2,
    showSlotRuler: true,
    showCandidateAnalyzer: true,
    exportOptions: {
      includeComments: true,
      includeCssHelper: true,
      quoteStyle: "double",
      componentName: "ResponsiveImage",
    },
  };
}

export function normalizeResponsiveImageState(state: ResponsiveImageState): ResponsiveImageState {
  const candidates = state.candidates.map(normalizeCandidate).sort(compareCandidates).slice(0, 12);
  const sizes = state.sizes.slice(0, 8).map((rule) => ({ ...rule, mediaCondition: rule.mediaCondition.slice(0, 120), slotSize: rule.slotSize.slice(0, 80) }));
  const pictureSources = state.pictureSources.slice(0, 5).map((source) => ({
    ...source,
    media: source.media.slice(0, 140),
    urlPattern: source.urlPattern.slice(0, 300),
    candidates: source.candidates.map(normalizeCandidate).sort(compareCandidates).slice(0, 12),
    sizes: source.sizes.slice(0, 8),
  }));
  return {
    ...state,
    urlPattern: state.urlPattern.slice(0, 300),
    fallbackSrc: state.fallbackSrc.slice(0, 300),
    candidates: candidates.length ? candidates : [createImageCandidate()],
    sizes,
    defaultSlotSize: state.defaultSlotSize || "100vw",
    pictureSources,
    attributes: {
      ...state.attributes,
      src: state.attributes.src.slice(0, 300),
      alt: state.attributes.alt.slice(0, 200),
      width: Math.round(clamp(state.attributes.width, 1, 10000)),
      height: Math.round(clamp(state.attributes.height, 1, 10000)),
      className: state.attributes.className.slice(0, 120),
    },
    previewViewportWidth: Math.round(clamp(state.previewViewportWidth, 320, 1920)),
  };
}

export function generateSrcset(candidates: ImageCandidate[]): string {
  return candidates.map(normalizeCandidate).sort(compareCandidates).map((candidate) => `${candidate.url} ${candidate.width}w`).join(", ");
}

export function generateSizes(rules: SizesRule[], defaultSlotSize: string): string {
  const parts = rules.filter((rule) => rule.mediaCondition.trim() && rule.slotSize.trim()).map((rule) => `${rule.mediaCondition.trim()} ${rule.slotSize.trim()}`);
  parts.push(defaultSlotSize.trim() || "100vw");
  return parts.join(", ");
}

export function generateImgMarkup(state: ResponsiveImageState): string {
  const normalized = normalizeResponsiveImageState(state);
  const q = normalized.exportOptions.quoteStyle;
  const attrs = [
    formatAttr("class", normalized.attributes.className, q),
    formatAttr("src", normalized.attributes.src || normalized.fallbackSrc, q),
    formatAttr("srcset", generateSrcset(normalized.candidates), q),
    formatAttr("sizes", generateSizes(normalized.sizes, normalized.defaultSlotSize), q),
    formatAttr("width", normalized.attributes.width, q),
    formatAttr("height", normalized.attributes.height, q),
    formatAttr("alt", escapeHtml(normalized.attributes.alt), q),
    formatAttr("loading", normalized.attributes.loading, q),
    formatAttr("decoding", normalized.attributes.decoding, q),
    normalized.attributes.fetchPriority !== "auto" ? formatAttr("fetchpriority", normalized.attributes.fetchPriority, q) : "",
  ].filter(Boolean);
  return `<img\n  ${attrs.join("\n  ")}\n/>`;
}

export function generatePictureMarkup(state: ResponsiveImageState): string {
  const normalized = normalizeResponsiveImageState(state);
  const q = normalized.exportOptions.quoteStyle;
  const sources = normalized.pictureSources
    .map((source) => {
      const sourceAttrs = [
        source.type !== "custom" ? formatAttr("type", source.type, q) : "",
        source.media ? formatAttr("media", source.media, q) : "",
        formatAttr("srcset", generateSrcset(source.candidates), q),
        formatAttr("sizes", generateSizes(source.sizes.length ? source.sizes : normalized.sizes, normalized.defaultSlotSize), q),
      ].filter(Boolean);
      return `  <source\n    ${sourceAttrs.join("\n    ")}\n  />`;
    })
    .join("\n");
  return `<picture>\n${sources}\n  ${generateImgMarkup(normalized).replaceAll("\n", "\n  ")}\n</picture>`;
}

export function generateNextImageMarkup(state: ResponsiveImageState): string {
  const normalized = normalizeResponsiveImageState(state);
  const componentName = sanitizeComponentName(normalized.exportOptions.componentName || "ResponsiveImage");
  return `import Image from "next/image";\n\nexport function ${componentName}() {\n  return (\n    <Image\n      src="${jsxEscape(normalized.attributes.src || normalized.fallbackSrc)}"\n      alt="${jsxEscape(normalized.attributes.alt)}"\n      width={${normalized.attributes.width}}\n      height={${normalized.attributes.height}}\n      sizes="${jsxEscape(generateSizes(normalized.sizes, normalized.defaultSlotSize))}"\n      className="${jsxEscape(normalized.attributes.className || "h-auto w-full object-cover")}"\n      loading="${normalized.attributes.loading}"\n      decoding="${normalized.attributes.decoding}"\n    />\n  );\n}`;
}

export function generateCssHelper(state: ResponsiveImageState): string {
  const className = (state.attributes.className || "responsive-image").split(/\s+/)[0] || "responsive-image";
  return `.${className} {\n  display: block;\n  max-inline-size: 100%;\n  block-size: auto;\n  object-fit: ${state.attributes.objectFit};\n}\n\n.image-frame {\n  overflow: hidden;\n  border-radius: 1rem;\n}`;
}

function parseLengthToPx(value: string, viewportWidth: number) {
  const text = value.trim();
  if (text.endsWith("vw")) return (parseFloat(text) / 100) * viewportWidth;
  if (text.endsWith("px")) return parseFloat(text);
  if (text.endsWith("rem")) return parseFloat(text) * 16;
  if (text.endsWith("em")) return parseFloat(text) * 16;
  if (text.startsWith("calc(")) return viewportWidth;
  const numeric = parseFloat(text);
  return Number.isFinite(numeric) ? numeric : viewportWidth;
}

function matchesMediaCondition(condition: string, viewportWidth: number) {
  const max = condition.match(/max-width\s*:\s*(\d+(?:\.\d+)?)(px|rem|em)/i);
  const min = condition.match(/min-width\s*:\s*(\d+(?:\.\d+)?)(px|rem|em)/i);
  const toPx = (value: string, unit: string) => parseFloat(value) * (unit === "px" ? 1 : 16);
  const maxOk = max ? viewportWidth <= toPx(max[1], max[2]) : true;
  const minOk = min ? viewportWidth >= toPx(min[1], min[2]) : true;
  return maxOk && minOk;
}

export function getMatchedSizesRule(sizes: SizesRule[], viewportWidth: number): SizesRule | null {
  return sizes.find((rule) => matchesMediaCondition(rule.mediaCondition, viewportWidth)) ?? null;
}

export function estimateSlotWidth(sizes: SizesRule[], defaultSlotSize: string, viewportWidth: number): number {
  const matched = getMatchedSizesRule(sizes, viewportWidth);
  const size = matched?.slotSize ?? defaultSlotSize;
  return Math.round(clamp(parseLengthToPx(size, viewportWidth), 1, viewportWidth));
}

export function estimateSelectedCandidate(candidates: ImageCandidate[], slotWidth: number, dpr: number): ImageCandidate | null {
  const sorted = candidates.map(normalizeCandidate).sort(compareCandidates);
  if (!sorted.length) return null;
  const ideal = slotWidth * dpr;
  return sorted.find((candidate) => candidate.width >= ideal) ?? sorted[sorted.length - 1] ?? null;
}

export function generateResponsiveImageExplanation(state: ResponsiveImageState): string {
  const normalized = normalizeResponsiveImageState(state);
  const slot = estimateSlotWidth(normalized.sizes, normalized.defaultSlotSize, normalized.previewViewportWidth);
  const candidate = estimateSelectedCandidate(normalized.candidates, slot, normalized.previewDpr);
  const matched = getMatchedSizesRule(normalized.sizes, normalized.previewViewportWidth);
  return [
    "This responsive image uses width descriptors in srcset, so the browser can choose between multiple image files.",
    `At ${normalized.previewViewportWidth}px viewport width, the matched sizes rule is ${matched ? `\"${matched.mediaCondition} ${matched.slotSize}\"` : `the default \"${normalized.defaultSlotSize}\"`}.`,
    `That creates an estimated image slot of ${slot}px. At ${normalized.previewDpr}x DPR, the ideal resource width is about ${Math.round(slot * normalized.previewDpr)}w.`,
    candidate ? `The analyzer would choose approximately the ${candidate.width}w candidate: ${candidate.url}.` : "Add candidates to estimate which resource the browser may choose.",
    "Use <picture> when you need art direction or format fallback. Use Next.js <Image> with sizes for responsive layouts.",
  ].join("\n\n");
}

export function generateAllResponsiveImageCode(state: ResponsiveImageState): string {
  return [
    "<!-- HTML img -->",
    generateImgMarkup(state),
    "",
    "<!-- Picture -->",
    generatePictureMarkup(state),
    "",
    "/* CSS helper */",
    generateCssHelper(state),
  ].join("\n");
}

export function validateResponsiveImageState(state: ResponsiveImageState): ResponsiveImageValidationMessage[] {
  const normalized = normalizeResponsiveImageState(state);
  const messages: ResponsiveImageValidationMessage[] = [
    { type: "info", message: "The analyzer estimates browser choice. Real browsers also consider caching, network, and supported formats." },
  ];
  if (!normalized.attributes.alt.trim()) messages.push({ type: "warning", message: "Add descriptive alt text, unless the image is decorative.", field: "alt" });
  if (!normalized.attributes.width || !normalized.attributes.height) messages.push({ type: "warning", message: "Add width and height to reduce layout shift.", field: "dimensions" });
  if (!normalized.sizes.length || !normalized.defaultSlotSize.trim()) messages.push({ type: "warning", message: "Add a sizes value so browsers do not assume 100vw.", field: "sizes" });
  if (normalized.candidates.length > 8) messages.push({ type: "warning", message: "More than 8 candidates can make markup harder to maintain.", field: "candidates" });
  const slot = estimateSlotWidth(normalized.sizes, normalized.defaultSlotSize, normalized.previewViewportWidth);
  const ideal = slot * normalized.previewDpr;
  const largest = normalized.candidates[normalized.candidates.length - 1];
  const smallest = normalized.candidates[0];
  if (largest && largest.width < ideal) messages.push({ type: "warning", message: `Largest candidate is ${largest.width}w, below the estimated ${Math.round(ideal)}w need at this preview size.`, field: "candidates" });
  if (smallest && smallest.width > slot * 1.6) messages.push({ type: "info", message: "Your smallest candidate may still be larger than needed for small image slots.", field: "candidates" });
  if (normalized.attributes.loading === "eager" && normalized.attributes.fetchPriority !== "high") messages.push({ type: "info", message: "For an important above-the-fold image, eager loading is often paired with fetchpriority=high." });
  if (normalized.mode === "picture" && normalized.pictureSources.length === 0) messages.push({ type: "warning", message: "Picture mode is most useful with at least one source for format fallback or art direction." });
  return messages;
}

function sanitizeComponentName(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9_$]/g, "").replace(/^[0-9]+/, "") || "ResponsiveImage";
  return cleaned[0].toUpperCase() + cleaned.slice(1);
}
