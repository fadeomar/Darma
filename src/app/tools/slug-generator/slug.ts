import type {
  SlugBatchConfig,
  SlugBatchResult,
  SlugCheck,
  SlugInputRow,
  SlugOptions,
  SlugReport,
  SlugResult,
  SlugRouteRow,
  SlugWarning,
} from "./types";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "of", "in", "on", "to", "for", "with", "from", "by", "at", "as", "is", "are",
]);

export const DEFAULT_RESERVED_WORDS = [
  "admin", "api", "app", "assets", "auth", "dashboard", "favicon.ico", "login", "logout", "register", "robots.txt", "settings", "sitemap.xml", "static",
];

export const DEFAULT_SLUG_OPTIONS: SlugOptions = {
  separator: "-",
  caseMode: "lower",
  keepNumbers: true,
  removeStopWords: false,
  maxLengthEnabled: true,
  maxLength: 72,
  preserveSlashes: false,
  asciiOnly: false,
  trimAtWordBoundary: true,
};

export const DEFAULT_SLUG_BATCH_CONFIG: SlugBatchConfig = {
  mode: "single",
  pathPrefix: "",
  collisionMode: "suffix",
  collisionStart: 2,
  reservedWords: DEFAULT_RESERVED_WORDS,
};

const SPACES_REGEX = /\s+/g;
const UNICODE_ALLOWED_WITH_SLASH = /[^\p{L}\p{N}\s/_-]+/gu;
const UNICODE_ALLOWED_NO_SLASH = /[^\p{L}\p{N}\s_-]+/gu;
const ASCII_ALLOWED_WITH_SLASH = /[^A-Za-z0-9\s/_-]+/g;
const ASCII_ALLOWED_NO_SLASH = /[^A-Za-z0-9\s_-]+/g;

function applyCase(text: string, mode: SlugOptions["caseMode"]): string {
  if (mode === "upper") return text.toUpperCase();
  if (mode === "keep") return text;
  return text.toLowerCase();
}

function removeLatinDiacritics(text: string): string {
  return text
    .normalize("NFD")
    .replace(/(\p{Script=Latin})\p{M}+/gu, "$1")
    .normalize("NFC");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function trimEdgeDelimiters(value: string, separator: SlugOptions["separator"]): string {
  const delimiter = escapeRegex(separator);
  return value
    .replace(new RegExp(`${delimiter}{2,}`, "g"), separator)
    .replace(/\/{2,}/g, "/")
    .replace(new RegExp(`^[${delimiter}/]+|[${delimiter}/]+$`, "g"), "");
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countSegments(value: string): number {
  return value ? value.split("/").filter(Boolean).length : 0;
}

function slugifySegment(text: string, options: SlugOptions): { value: string; removedCharacters: number } {
  const separator = options.separator;
  const original = text.normalize("NFKC");
  let value = removeLatinDiacritics(original);
  value = applyCase(value, options.caseMode);
  value = value.replace(SPACES_REGEX, " ").trim();
  const allowedPattern = options.asciiOnly
    ? options.preserveSlashes ? ASCII_ALLOWED_WITH_SLASH : ASCII_ALLOWED_NO_SLASH
    : options.preserveSlashes ? UNICODE_ALLOWED_WITH_SLASH : UNICODE_ALLOWED_NO_SLASH;
  const beforeAllowed = value.length;
  value = value.replace(allowedPattern, " ");
  const removedCharacters = Math.max(0, beforeAllowed - value.length);
  value = value.replace(SPACES_REGEX, " ").trim();

  if (!options.keepNumbers) {
    value = value.replace(options.asciiOnly ? /\d+/g : /\p{N}+/gu, " ").replace(SPACES_REGEX, " ").trim();
  }

  if (options.removeStopWords && value) {
    value = value
      .split(" ")
      .filter((part) => part && !STOP_WORDS.has(part.toLowerCase()))
      .join(" ");
  }

  value = value.replace(/[_-]+/g, " ").replace(SPACES_REGEX, separator);
  return { value: trimEdgeDelimiters(value, separator), removedCharacters };
}

function safeTrimToLength(value: string, maxLength: number, options: SlugOptions): { value: string; trimmed: boolean } {
  if (value.length <= maxLength) return { value, trimmed: false };
  const safeMax = Math.max(1, Math.floor(maxLength));
  let sliced = value.slice(0, safeMax);
  if (options.trimAtWordBoundary) {
    const separatorIndex = Math.max(sliced.lastIndexOf(options.separator), options.preserveSlashes ? sliced.lastIndexOf("/") : -1);
    if (separatorIndex >= Math.floor(safeMax * 0.45)) sliced = sliced.slice(0, separatorIndex);
  }
  return { value: trimEdgeDelimiters(sliced, options.separator), trimmed: true };
}

export function generateSlug(input: string, options: SlugOptions = DEFAULT_SLUG_OPTIONS): SlugResult {
  const source = input ?? "";
  const trimmedSource = source.trim();
  const warnings: SlugWarning[] = [];

  if (!trimmedSource) {
    return {
      slug: "",
      warnings: ["empty-input"],
      stats: { originalChars: 0, slugChars: 0, wordCount: 0, segmentCount: 0, isUrlFriendly: false, removedCharacterCount: 0 },
    };
  }

  const normalizedSource = options.preserveSlashes ? trimmedSource.replace(/\s*\/+\s*/g, "/") : trimmedSource;
  const rawSegments = options.preserveSlashes ? normalizedSource.split("/").filter((segment) => segment.trim()) : [normalizedSource];
  let removedCharacterCount = 0;
  const segments = rawSegments.map((segment) => {
    const result = slugifySegment(segment, options);
    removedCharacterCount += result.removedCharacters;
    return result.value;
  }).filter(Boolean);

  let slug = options.preserveSlashes ? segments.join("/") : segments.join("");
  const containedNonAscii = /[^\x00-\x7F]/.test(removeLatinDiacritics(trimmedSource));
  if (options.asciiOnly && containedNonAscii) warnings.push("ascii-loss");

  if (options.maxLengthEnabled && options.maxLength > 0 && slug) {
    const trimmed = safeTrimToLength(slug, options.maxLength, options);
    slug = trimmed.value;
    if (trimmed.trimmed) warnings.push("trimmed");
  }

  if (!slug) warnings.push("empty-output");
  if (slug.length > 96) warnings.push("very-long");

  const safeSlugRegex = options.preserveSlashes
    ? options.asciiOnly ? /^[A-Za-z0-9_/-]+$/ : /^[\p{L}\p{N}_/-]+$/u
    : options.asciiOnly ? /^[A-Za-z0-9_-]+$/ : /^[\p{L}\p{N}_-]+$/u;

  return {
    slug,
    warnings,
    stats: {
      originalChars: source.length,
      slugChars: slug.length,
      wordCount: countWords(trimmedSource),
      segmentCount: countSegments(slug),
      isUrlFriendly: slug.length > 0 && safeSlugRegex.test(slug),
      removedCharacterCount,
    },
  };
}

export function normalizePathPrefix(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return "";
  return `/${trimmed.replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/")}`;
}

export function normalizePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const pathOnly = trimmed.replace(/^https?:\/\/[^/]+/i, "").split(/[?#]/)[0] ?? "";
  const normalized = `/${pathOnly.replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/")}`;
  return normalized === "/" ? "/" : normalized.replace(/\/$/, "");
}

export function parseSlugInput(input: string, mode: SlugBatchConfig["mode"]): SlugInputRow[] {
  if (mode === "single") {
    const [title = "", previousPath = ""] = input.split("\t", 2);
    const normalizedTitle = title.trim();
    return normalizedTitle ? [{ id: "row-1", title: normalizedTitle, previousPath: previousPath.trim(), sourceLine: 1 }] : [];
  }
  return input.split(/\r?\n/).map((line, index) => ({ line, index })).filter(({ line }) => line.trim()).map(({ line, index }) => {
    const [title = "", previousPath = ""] = line.split("\t", 2);
    return { id: `row-${index + 1}`, title: title.trim(), previousPath: previousPath.trim(), sourceLine: index + 1 };
  });
}

function withCollisionSuffix(baseSlug: string, index: number, options: SlugOptions): string {
  const suffix = `${options.separator}${index}`;
  if (!options.maxLengthEnabled || baseSlug.length + suffix.length <= options.maxLength) return `${baseSlug}${suffix}`;
  const available = Math.max(1, options.maxLength - suffix.length);
  const trimmed = safeTrimToLength(baseSlug, available, options).value;
  return `${trimmed}${suffix}`;
}

function isReservedSlug(slug: string, reservedWords: string[]): boolean {
  const lastSegment = slug.split("/").filter(Boolean).at(-1)?.toLowerCase() ?? "";
  return reservedWords.some((word) => word.trim().toLowerCase() === lastSegment);
}

function buildChecks(rows: SlugRouteRow[], config: SlugBatchConfig, options: SlugOptions): SlugCheck[] {
  const checks: SlugCheck[] = [];
  const invalidRows = rows.filter((row) => !row.valid);
  const collisions = rows.filter((row) => row.collisionIndex > 1);
  const reserved = rows.filter((row) => row.warnings.includes("reserved-route"));
  const longPaths = rows.filter((row) => row.path.length > 120);
  const unicode = rows.filter((row) => /[^\x00-\x7F]/.test(row.path));
  const duplicatePrevious = new Set<string>();
  const seenPrevious = new Set<string>();
  rows.forEach((row) => {
    if (!row.redirectFrom) return;
    if (seenPrevious.has(row.redirectFrom)) duplicatePrevious.add(row.redirectFrom);
    seenPrevious.add(row.redirectFrom);
  });

  checks.push(invalidRows.length
    ? { id: "invalid", level: "danger", title: `${invalidRows.length} blocked route${invalidRows.length === 1 ? "" : "s"}`, message: "Resolve empty outputs or collision errors before importing the route manifest." }
    : { id: "valid", level: "success", title: "All generated routes are usable", message: "Every input produced a non-empty route under the selected collision policy." });

  if (collisions.length) checks.push({ id: "collisions", level: config.collisionMode === "suffix" ? "info" : "danger", title: `${collisions.length} collision${collisions.length === 1 ? "" : "s"} detected`, message: config.collisionMode === "suffix" ? "Numeric suffixes were applied deterministically." : "Duplicate slugs remain and must be resolved before deployment." });
  if (reserved.length) checks.push({ id: "reserved", level: "warning", title: `${reserved.length} reserved route hit${reserved.length === 1 ? "" : "s"}`, message: "These slugs may conflict with application or infrastructure paths." });
  if (longPaths.length) checks.push({ id: "long", level: "warning", title: `${longPaths.length} path${longPaths.length === 1 ? "" : "s"} exceed 120 characters`, message: "Shorter routes are easier to share, audit, and maintain." });
  if (unicode.length) checks.push({ id: "unicode", level: "info", title: `${unicode.length} Unicode route${unicode.length === 1 ? "" : "s"}`, message: "Unicode slugs are valid, but confirm that downstream CMS, analytics, and redirect tooling preserve them correctly." });
  if (duplicatePrevious.size) checks.push({ id: "duplicate-redirect-source", level: "danger", title: "Duplicate redirect sources", message: `${duplicatePrevious.size} previous path${duplicatePrevious.size === 1 ? "" : "s"} map more than once.` });
  if (options.separator === "_") checks.push({ id: "underscore", level: "info", title: "Underscore separator selected", message: "Hyphens are the more common convention for public content URLs; underscores may still be appropriate for internal identifiers." });
  if (options.caseMode !== "lower") checks.push({ id: "case", level: "warning", title: "Non-lowercase routes enabled", message: "Case-sensitive hosts and caches can treat differently cased paths as separate resources." });
  if (rows.some((row) => row.redirectFrom)) checks.push({ id: "redirects", level: "success", title: "Redirect manifest available", message: "Previous paths were normalized and can be exported for a migration." });
  return checks;
}

export function buildSlugBatch(input: string, options: SlugOptions, config: SlugBatchConfig): SlugBatchResult {
  const inputRows = parseSlugInput(input, config.mode);
  const pathPrefix = normalizePathPrefix(config.pathPrefix);
  const baseOccurrences = new Map<string, number>();
  const usedFinalSlugs = new Set<string>();
  const rows: SlugRouteRow[] = inputRows.map((row) => {
    const generated = generateSlug(row.title, options);
    const baseSlug = generated.slug;
    const baseKey = baseSlug.toLocaleLowerCase();
    const occurrence = baseSlug ? (baseOccurrences.get(baseKey) ?? 0) + 1 : 1;
    if (baseSlug) baseOccurrences.set(baseKey, occurrence);
    let collisionIndex = occurrence;
    let slug = baseSlug;
    const warnings = generated.warnings.map(String);
    let valid = Boolean(baseSlug);
    const finalKeyAlreadyUsed = Boolean(baseSlug) && usedFinalSlugs.has(baseKey);
    const hasCollision = Boolean(baseSlug) && (occurrence > 1 || finalKeyAlreadyUsed);

    if (hasCollision) {
      warnings.push("collision");
      collisionIndex = Math.max(2, occurrence);
      if (config.collisionMode === "suffix") {
        let suffixNumber = config.collisionStart + Math.max(0, occurrence - 2);
        let candidate = withCollisionSuffix(baseSlug, suffixNumber, options);
        while (usedFinalSlugs.has(candidate.toLocaleLowerCase())) {
          suffixNumber += 1;
          candidate = withCollisionSuffix(baseSlug, suffixNumber, options);
        }
        slug = candidate;
      }
      if (config.collisionMode === "error") valid = false;
    }
    if (slug && config.collisionMode !== "allow") usedFinalSlugs.add(slug.toLocaleLowerCase());
    if (slug && config.collisionMode === "allow" && !usedFinalSlugs.has(slug.toLocaleLowerCase())) usedFinalSlugs.add(slug.toLocaleLowerCase());
    if (isReservedSlug(slug, config.reservedWords)) warnings.push("reserved-route");

    const path = slug ? `${pathPrefix}/${slug}`.replace(/\/{2,}/g, "/") : pathPrefix || "/";
    const previousPath = normalizePath(row.previousPath);
    const redirectFrom = previousPath && previousPath !== path ? previousPath : null;
    if (previousPath && previousPath === path) warnings.push("unchanged-path");

    return { ...row, baseSlug, slug, path, redirectFrom, warnings: [...new Set(warnings)], collisionIndex, valid };
  });

  const checks = buildChecks(rows, config, options);
  return {
    rows,
    checks,
    stats: {
      inputRows: rows.length,
      validRoutes: rows.filter((row) => row.valid).length,
      redirects: rows.filter((row) => row.redirectFrom).length,
      collisions: rows.filter((row) => row.collisionIndex > 1).length,
      reservedHits: rows.filter((row) => row.warnings.includes("reserved-route")).length,
      unicodeRoutes: rows.filter((row) => /[^\x00-\x7F]/.test(row.path)).length,
      longestPath: rows.reduce((max, row) => Math.max(max, row.path.length), 0),
    },
  };
}

function csvCell(value: string | number | boolean | null): string {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildRoutesCsv(rows: SlugRouteRow[]): string {
  const header = ["source_line", "title", "slug", "path", "previous_path", "redirect_required", "valid", "warnings"];
  return [header, ...rows.map((row) => [row.sourceLine, row.title, row.slug, row.path, row.redirectFrom ?? "", Boolean(row.redirectFrom), row.valid, row.warnings.join("|")])]
    .map((cells) => cells.map(csvCell).join(","))
    .join("\n");
}

export function buildRedirectsJson(rows: SlugRouteRow[]): string {
  const redirects = rows.filter((row) => row.valid && row.redirectFrom).map((row) => ({ source: row.redirectFrom, destination: row.path, permanent: true }));
  return JSON.stringify(redirects, null, 2);
}

export function buildNextRedirectsSnippet(rows: SlugRouteRow[]): string {
  const redirects = rows.filter((row) => row.valid && row.redirectFrom).map((row) => ({ source: row.redirectFrom, destination: row.path, permanent: true }));
  return `/** Generated by Darma Slug Route Studio. */\nconst redirects = ${JSON.stringify(redirects, null, 2)};\n\n/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  async redirects() {\n    return redirects;\n  },\n};\n\nexport default nextConfig;\n`;
}

export function buildSlugUtilitySnippet(options: SlugOptions): string {
  return `/** Lightweight starter matching the selected Darma slug settings. */\nexport function slugify(input: string): string {\n  const separator = ${JSON.stringify(options.separator)};\n  let value = input.normalize("NFKD").replace(/[\\u0300-\\u036f]/g, "");\n  ${options.caseMode === "lower" ? 'value = value.toLowerCase();' : options.caseMode === "upper" ? 'value = value.toUpperCase();' : ""}\n  ${options.asciiOnly ? 'value = value.replace(/[^A-Za-z0-9\\s/_-]+/g, " ");' : 'value = value.replace(/[^\\p{L}\\p{N}\\s/_-]+/gu, " ");'}\n  ${options.keepNumbers ? "" : 'value = value.replace(/\\p{N}+/gu, " ");'}\n  value = value.trim().replace(/[_-]+/g, " ").replace(/\\s+/g, separator);\n  ${options.maxLengthEnabled ? `if (value.length > ${Math.floor(options.maxLength)}) value = value.slice(0, ${Math.floor(options.maxLength)}).replace(new RegExp(separator + "+$"), "");` : ""}\n  return value;\n}\n`;
}

export function buildSlugReport(batch: SlugBatchResult, options: SlugOptions, config: SlugBatchConfig): SlugReport {
  return { generatedAt: new Date().toISOString(), configuration: { ...config, pathPrefix: normalizePathPrefix(config.pathPrefix), options }, stats: batch.stats, routes: batch.rows, checks: batch.checks };
}

export function buildSlugSummaryMarkdown(batch: SlugBatchResult, options: SlugOptions, config: SlugBatchConfig): string {
  const lines = [
    "# Slug route analysis",
    "",
    `- Routes: ${batch.stats.validRoutes}/${batch.stats.inputRows}`,
    `- Redirects: ${batch.stats.redirects}`,
    `- Collisions: ${batch.stats.collisions}`,
    `- Reserved route hits: ${batch.stats.reservedHits}`,
    `- Prefix: ${normalizePathPrefix(config.pathPrefix) || "/"}`,
    `- Separator: ${options.separator}`,
    `- Collision policy: ${config.collisionMode}`,
    "",
    "## Route manifest",
    "",
    "| Title | Route | Redirect from | Status |",
    "| --- | --- | --- | --- |",
    ...batch.rows.map((row) => `| ${row.title.replace(/\|/g, "\\|")} | \`${row.path}\` | ${row.redirectFrom ? `\`${row.redirectFrom}\`` : "—"} | ${row.valid ? "Ready" : "Blocked"} |`),
    "",
    "## Production checks",
    "",
    ...batch.checks.map((check) => `- **${check.title}:** ${check.message}`),
  ];
  return `${lines.join("\n")}\n`;
}
