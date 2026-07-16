import {
  DESCRIPTION_WARNING_LENGTH,
  TITLE_WARNING_LENGTH,
  escapeHtml,
  generateMetaTags,
  isValidAbsoluteUrl,
  isValidOgLocale,
  isValidSocialHandle,
  normalizeHandle,
  validateMetaTagInput,
} from "./meta";
import {
  DEFAULT_META_INPUT,
  DESCRIPTION_LIMIT,
  TEXT_LIMIT,
  TITLE_LIMIT,
  URL_LIMIT,
} from "./presets";
import type { MetaTagInput, OgType, TwitterCardType } from "./types";

export const META_PROJECT_TOOL = "darma-meta-tag-generator" as const;
export const META_PROJECT_VERSION = 1 as const;
export const META_IMPORT_MAX_BYTES = 1024 * 1024;

export type MetaAuditSeverity = "error" | "warning" | "info" | "pass";

export type MetaAuditCheck = {
  id: string;
  title: string;
  message: string;
  severity: MetaAuditSeverity;
};

export type MetaAuditCounts = Record<MetaAuditSeverity, number>;

export type MetaSummaryCard = {
  label: string;
  value: string;
  detail: string;
};

export type MetaProject = {
  schemaVersion: typeof META_PROJECT_VERSION;
  tool: typeof META_PROJECT_TOOL;
  exportedAt: string;
  input: MetaTagInput;
};

const OG_TYPES: OgType[] = ["website", "article", "product", "profile"];
const TWITTER_CARDS: TwitterCardType[] = ["summary", "summary_large_image"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown, fallback: string, limit: number): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/\0/g, "").slice(0, limit).trim();
}

function cleanEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizeMetaInput(value: unknown): MetaTagInput {
  if (!isRecord(value)) throw new Error("Project input must be an object.");

  return {
    title: cleanText(value.title, "", TITLE_LIMIT),
    description: cleanText(value.description, "", DESCRIPTION_LIMIT),
    canonicalUrl: cleanText(value.canonicalUrl, "", URL_LIMIT),
    siteName: cleanText(value.siteName, "", TEXT_LIMIT),
    ogType: cleanEnum(value.ogType, OG_TYPES, DEFAULT_META_INPUT.ogType),
    imageUrl: cleanText(value.imageUrl, "", URL_LIMIT),
    imageAlt: cleanText(value.imageAlt, "", TEXT_LIMIT),
    locale: cleanText(value.locale, DEFAULT_META_INPUT.locale, 20),
    twitterCard: cleanEnum(value.twitterCard, TWITTER_CARDS, DEFAULT_META_INPUT.twitterCard),
    twitterSite: cleanText(value.twitterSite, "", 40),
    twitterCreator: cleanText(value.twitterCreator, "", 40),
  };
}

export function createMetaProject(input: MetaTagInput, exportedAt = new Date().toISOString()): MetaProject {
  return {
    schemaVersion: META_PROJECT_VERSION,
    tool: META_PROJECT_TOOL,
    exportedAt,
    input: normalizeMetaInput(input),
  };
}

export function parseMetaProject(text: string): MetaProject {
  if (!text.trim()) throw new Error("The selected JSON file is empty.");

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!isRecord(value)) throw new Error("Project root must be an object.");
  if (value.tool !== META_PROJECT_TOOL) throw new Error("This JSON file was not created by the Darma meta tag generator.");
  if (value.schemaVersion !== META_PROJECT_VERSION) throw new Error(`Unsupported project version. Expected version ${META_PROJECT_VERSION}.`);

  return {
    schemaVersion: META_PROJECT_VERSION,
    tool: META_PROJECT_TOOL,
    exportedAt: cleanText(value.exportedAt, new Date().toISOString(), 80),
    input: normalizeMetaInput(value.input),
  };
}

export function summarizeMetaAudit(checks: MetaAuditCheck[]): MetaAuditCounts {
  return checks.reduce<MetaAuditCounts>(
    (counts, check) => {
      counts[check.severity] += 1;
      return counts;
    },
    { error: 0, warning: 0, info: 0, pass: 0 },
  );
}

function protocolOf(value: string): string {
  try {
    return new URL(value).protocol;
  } catch {
    return "";
  }
}

export function buildMetaAudit(input: MetaTagInput): MetaAuditCheck[] {
  const checks: MetaAuditCheck[] = validateMetaTagInput(input).map((validation, index) => ({
    id: `${validation.field}-${validation.level}-${index}`,
    title: String(validation.field),
    message: validation.message,
    severity: validation.level,
  }));

  const title = input.title.trim();
  const description = input.description.trim();
  const canonicalUrl = input.canonicalUrl.trim();
  const imageUrl = input.imageUrl.trim();
  const siteName = input.siteName.trim();
  const handlesValid = isValidSocialHandle(input.twitterSite) && isValidSocialHandle(input.twitterCreator);

  if (title && title.length <= TITLE_WARNING_LENGTH) {
    checks.push({ id: "title-ready", title: "Search title", message: `Title is ${title.length} characters and fits the configured preview target.`, severity: "pass" });
  }

  if (description && description.length <= DESCRIPTION_WARNING_LENGTH) {
    checks.push({ id: "description-ready", title: "Search description", message: `Description is ${description.length} characters and fits the configured preview target.`, severity: "pass" });
  }

  if (canonicalUrl && isValidAbsoluteUrl(canonicalUrl)) {
    checks.push({ id: "canonical-ready", title: "Canonical URL", message: "Canonical and og:url use a valid absolute URL.", severity: "pass" });
    if (protocolOf(canonicalUrl) !== "https:") {
      checks.push({ id: "canonical-http", title: "HTTPS deployment", message: "The canonical URL uses HTTP. Prefer HTTPS for a production page.", severity: "warning" });
    }
  }

  if (imageUrl && isValidAbsoluteUrl(imageUrl)) {
    checks.push({ id: "image-ready", title: "Social image", message: "A valid absolute social-image URL is configured.", severity: "pass" });
    if (protocolOf(imageUrl) !== "https:") {
      checks.push({ id: "image-http", title: "Image delivery", message: "The social image uses HTTP. Prefer an HTTPS asset URL.", severity: "warning" });
    }
    checks.push({ id: "image-dimensions", title: "Image dimensions", message: "Verify the deployed image dimensions, crop, file size, and cache behavior with real platform preview tools.", severity: "info" });
  }

  if (siteName) checks.push({ id: "site-name-ready", title: "Site identity", message: "Open Graph site_name is configured.", severity: "pass" });
  else checks.push({ id: "site-name-missing", title: "Site identity", message: "Add a site name so link previews consistently identify the publisher.", severity: "info" });

  if (input.locale.trim() && isValidOgLocale(input.locale)) {
    checks.push({ id: "locale-ready", title: "Open Graph locale", message: `Locale ${input.locale.trim()} uses the expected language_REGION format.`, severity: "pass" });
  }

  if (handlesValid && (input.twitterSite.trim() || input.twitterCreator.trim())) {
    checks.push({ id: "handles-ready", title: "Social handles", message: "Configured X/Twitter handles use a portable format.", severity: "pass" });
  }

  const generatedBytes = new TextEncoder().encode(generateMetaTags(input)).length;
  checks.push({
    id: "payload-size",
    title: "Generated payload",
    message: `${generatedBytes.toLocaleString()} bytes of head markup will be exported.`,
    severity: generatedBytes > 12_000 ? "warning" : "info",
  });

  return checks;
}

export function buildMetaSummary(input: MetaTagInput, checks: MetaAuditCheck[]): MetaSummaryCard[] {
  const counts = summarizeMetaAudit(checks);
  const readiness = counts.error ? "Blocked" : counts.warning ? "Review" : "Ready";

  return [
    {
      label: "Search title",
      value: `${input.title.trim().length}/${TITLE_WARNING_LENGTH}`,
      detail: input.title.trim() ? "Characters against the preview target" : "Required title is missing",
    },
    {
      label: "Description",
      value: `${input.description.trim().length}/${DESCRIPTION_WARNING_LENGTH}`,
      detail: input.description.trim() ? "Characters against the preview target" : "Description is not configured",
    },
    {
      label: "Social image",
      value: input.imageUrl.trim() ? "Configured" : "Missing",
      detail: input.imageAlt.trim() ? "Alt text included" : "Alt text still needs review",
    },
    {
      label: "Readiness",
      value: readiness,
      detail: counts.error ? `${counts.error} blocking error${counts.error === 1 ? "" : "s"}` : counts.warning ? `${counts.warning} warning${counts.warning === 1 ? "" : "s"}` : `${counts.pass} checks passed`,
    },
  ];
}

export function buildCompleteHeadDocument(input: MetaTagInput): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
${generateMetaTags(input).split("\n").map((line) => `  ${line}`).join("\n")}
</head>
<body>
  <main>
    <h1>${escapeHtml(input.title.trim() || "Page title")}</h1>
  </main>
</body>
</html>
`;
}

export function buildNextMetadataModule(input: MetaTagInput): string {
  const title = input.title.trim();
  const description = input.description.trim();
  const canonical = input.canonicalUrl.trim();
  const imageUrl = input.imageUrl.trim();
  const imageAlt = input.imageAlt.trim();
  const siteName = input.siteName.trim();
  const locale = input.locale.trim();
  const nextOgType = input.ogType === "product" ? "website" : input.ogType;

  const metadata: Record<string, unknown> = {};
  if (title) metadata.title = title;
  if (description) metadata.description = description;
  if (canonical) metadata.alternates = { canonical };

  const openGraph: Record<string, unknown> = { type: nextOgType };
  if (title) openGraph.title = title;
  if (description) openGraph.description = description;
  if (canonical) openGraph.url = canonical;
  if (siteName) openGraph.siteName = siteName;
  if (locale) openGraph.locale = locale;
  if (imageUrl) openGraph.images = [{ url: imageUrl, ...(imageAlt ? { alt: imageAlt } : {}) }];
  metadata.openGraph = openGraph;

  const twitter: Record<string, unknown> = { card: input.twitterCard };
  if (title) twitter.title = title;
  if (description) twitter.description = description;
  if (imageUrl) twitter.images = [imageUrl];
  if (input.twitterSite.trim()) twitter.site = normalizeHandle(input.twitterSite);
  if (input.twitterCreator.trim()) twitter.creator = normalizeHandle(input.twitterCreator);
  metadata.twitter = twitter;

  const note = input.ogType === "product"
    ? "// Next.js Metadata does not expose an Open Graph product type, so this export uses website.\n"
    : "";

  return `import type { Metadata } from "next";\n\n${note}export const metadata: Metadata = ${JSON.stringify(metadata, null, 2)};\n`;
}

function markdownEscape(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function buildMetaMarkdownReport(input: MetaTagInput, checks: MetaAuditCheck[]): string {
  const counts = summarizeMetaAudit(checks);
  const rows = checks.map((check) => `| ${check.severity.toUpperCase()} | ${markdownEscape(check.title)} | ${markdownEscape(check.message)} |`).join("\n");

  return `# Meta tag production report

## Summary

- Title length: ${input.title.trim().length} characters
- Description length: ${input.description.trim().length} characters
- Canonical URL: ${input.canonicalUrl.trim() || "Not configured"}
- Open Graph type: ${input.ogType}
- Twitter/X card: ${input.twitterCard}
- Audit: ${counts.error} errors, ${counts.warning} warnings, ${counts.info} info, ${counts.pass} passes

## Production checks

| Severity | Check | Detail |
| --- | --- | --- |
${rows}

## Generated head tags

\`\`\`html
${generateMetaTags(input)}
\`\`\`

Generated locally with Darma Tools.
`;
}

function csvCell(value: string | number): string {
  let text = String(value).replace(/\r?\n/g, " ");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildMetaMetricsCsv(input: MetaTagInput, checks: MetaAuditCheck[]): string {
  const counts = summarizeMetaAudit(checks);
  const rows: Array<[string, string | number]> = [
    ["title_length", input.title.trim().length],
    ["description_length", input.description.trim().length],
    ["canonical_url", input.canonicalUrl.trim()],
    ["site_name", input.siteName.trim()],
    ["og_type", input.ogType],
    ["locale", input.locale.trim()],
    ["social_image", input.imageUrl.trim() ? "configured" : "missing"],
    ["twitter_card", input.twitterCard],
    ["errors", counts.error],
    ["warnings", counts.warning],
    ["info", counts.info],
    ["passes", counts.pass],
  ];

  return `metric,value\n${rows.map(([metric, value]) => `${csvCell(metric)},${csvCell(value)}`).join("\n")}\n`;
}

export function buildMetaPackReadme(): string {
  return `# Darma meta tag production pack

Files:

- meta-tags.html — complete generated head tags.
- head-example.html — standalone HTML integration example.
- metadata.ts — Next.js Metadata export.
- meta-project.json — editable Darma project backup.
- production-report.md — human-readable readiness review.
- production-metrics.csv — compact handoff metrics.

Review the deployed URL with real search and social preview tools because remote platforms may cache or crop content differently.
`;
}

export function buildMetaProductionFiles(input: MetaTagInput, checks: MetaAuditCheck[]): Record<string, string> {
  return {
    "meta-tags.html": generateMetaTags(input),
    "head-example.html": buildCompleteHeadDocument(input),
    "metadata.ts": buildNextMetadataModule(input),
    "meta-project.json": JSON.stringify(createMetaProject(input), null, 2),
    "production-report.md": buildMetaMarkdownReport(input, checks),
    "production-metrics.csv": buildMetaMetricsCsv(input, checks),
    "README.md": buildMetaPackReadme(),
  };
}
