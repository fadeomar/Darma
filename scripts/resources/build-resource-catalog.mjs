import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_PATH = path.join(ROOT, "src/sections/GoodLinks/resources.json");
const OVERRIDES_PATH = path.join(ROOT, "src/features/resources/resource-overrides.json");
const OUTPUT_PATH = path.join(ROOT, "src/features/resources/resources.catalog.json");
const REPORT_JSON_PATH = path.join(ROOT, "RESOURCE_LIBRARY_AUDIT.json");
const REPORT_MD_PATH = path.join(ROOT, "RESOURCE_LIBRARY_AUDIT.md");

const CATEGORY_ALIASES = { "placeholder image services": "Placeholder Image Services" };
const TYPE_VALUES = new Set([
  "documentation", "course", "tutorial", "tool", "generator", "community", "reference", "asset-library",
]);

function cleanText(value = "") {
  return value.replace(/\s+/g, " ").replace(/\.{2,}$/g, ".").trim();
}

function normalizeCategory(value) {
  return CATEGORY_ALIASES[value] ?? value;
}

function parseUrl(rawUrl) {
  const original = rawUrl.trim();
  const upgraded = original.replace(/^http:\/\//i, "https://");
  const parsed = new URL(upgraded);
  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  if ((parsed.protocol === "https:" && parsed.port === "443") || (parsed.protocol === "http:" && parsed.port === "80")) parsed.port = "";
  const normalizedPath = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");
  return {
    canonical: `${parsed.protocol}//${parsed.host}${normalizedPath}${parsed.search}`,
    original,
    domain: parsed.hostname.replace(/^www\./, ""),
    upgradedFromHttp: /^http:\/\//i.test(original),
  };
}

function slugify(value) {
  return value.toLowerCase().replace(/^www\./, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72);
}

function resourceTypeFor(name, url, categories) {
  const value = `${name} ${url} ${categories.join(" ")}`.toLowerCase();
  if (/docs?|documentation|reference|cheatsheet|cheat sheet|compatibility|can i use/.test(value)) return "documentation";
  if (/course|academy|school|learn|curriculum|freecodecamp|odin project|codecademy|scrimba/.test(value)) return "course";
  if (/community|forum|dev\.to|stackoverflow/.test(value)) return "community";
  if (/tutorial|guide|article|blog|css-tricks|codrops/.test(value)) return "tutorial";
  if (/placeholder|stock photo|icons?|fonts?|illustrations?|design resources|asset/.test(value)) return "asset-library";
  if (/generator|builder|maker|creator/.test(value) || categories.some((category) => /Generators/i.test(category))) return "generator";
  if (/reference/.test(value)) return "reference";
  return "tool";
}

function fallbackSummary(name, categories) {
  const area = categories[0]?.toLowerCase() ?? "technology";
  return `${name} is a curated ${area} resource. Use it as a starting point when you need focused tools, examples, or references in this area.`;
}

function deriveTags(name, categories, type) {
  const tags = new Set([type.replace(/-/g, " ")]);
  for (const category of categories) tags.add(category.replace(/\s*&\s*/g, " and "));
  for (const token of ["CSS", "HTML", "JavaScript", "SVG", "React", "Vue", "Angular", "Node", "Accessibility", "Animation", "Color", "Typography", "Design"]) {
    if (new RegExp(`\\b${token}\\b`, "i").test(name)) tags.add(token);
  }
  return [...tags].slice(0, 8);
}

const unique = (values) => [...new Set(values.filter(Boolean))];
const raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf8"));
const overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf8"));
const merged = new Map();
const invalidUrls = [];
let upgradedHttpCount = 0;
let missingDescriptionCount = 0;

for (const group of raw) {
  const category = normalizeCategory(group.category);
  for (const item of group.items) {
    let urlInfo;
    try {
      urlInfo = parseUrl(item.url);
    } catch (error) {
      invalidUrls.push({ name: item.name, url: item.url, category, error: error.message });
      continue;
    }
    if (urlInfo.upgradedFromHttp) upgradedHttpCount += 1;
    const suppliedSummary = cleanText(item.description ?? item.about ?? "");
    if (!suppliedSummary) missingDescriptionCount += 1;

    const existing = merged.get(urlInfo.canonical);
    if (existing) {
      existing.categories = unique([...existing.categories, category]);
      existing.sourceUrls = unique([...existing.sourceUrls, item.url]);
      existing.logoCandidates = unique([...existing.logoCandidates, item.logo?.replace(/^http:\/\//i, "https://")]);
      existing.faviconCandidates = unique([...existing.faviconCandidates, item.favIcon?.replace(/^http:\/\//i, "https://")]);
      existing.duplicateCount += 1;
      if (suppliedSummary.length > existing.summary.length) existing.summary = suppliedSummary;
      continue;
    }

    merged.set(urlInfo.canonical, {
      name: cleanText(item.name), url: urlInfo.canonical, domain: urlInfo.domain, summary: suppliedSummary,
      categories: [category], sourceUrls: [item.url],
      logoCandidates: unique([item.logo?.replace(/^http:\/\//i, "https://")]),
      faviconCandidates: unique([item.favIcon?.replace(/^http:\/\//i, "https://")]), duplicateCount: 1,
    });
  }
}

const usedIds = new Set();
const catalog = [...merged.values()].map((entry) => {
  let id = slugify(entry.domain || entry.name) || "resource";
  let suffix = 2;
  while (usedIds.has(id)) id = `${slugify(entry.domain || entry.name)}-${suffix++}`;
  usedIds.add(id);
  const override = overrides[entry.url] ?? {};
  const inferredType = resourceTypeFor(entry.name, entry.url, entry.categories);
  const resourceType = TYPE_VALUES.has(override.resourceType) ? override.resourceType : inferredType;
  const summary = entry.summary || fallbackSummary(entry.name, entry.categories);
  return {
    id, slug: id, name: entry.name, url: entry.url, domain: entry.domain, summary,
    categories: entry.categories.sort((a, b) => a.localeCompare(b)),
    tags: unique([...(override.tags ?? []), ...deriveTags(entry.name, entry.categories, resourceType)]),
    resourceType, levels: override.levels ?? [], pricing: override.pricing ?? "unknown",
    publisherType: override.publisherType ?? "unknown", featured: Boolean(override.featured),
    related: override.related,
    icon: {
      logoUrl: entry.logoCandidates[0], faviconUrl: entry.faviconCandidates[0],
      status: entry.logoCandidates.length || entry.faviconCandidates.length ? "remote-candidate" : "fallback-only",
    },
    review: {
      status: "review-needed", lastChecked: null,
      notes: entry.duplicateCount > 1 ? `Merged ${entry.duplicateCount} legacy entries.` : undefined,
    },
    source: { importedFrom: "src/sections/GoodLinks/resources.json", originalUrls: entry.sourceUrls },
  };
}).sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));

fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
const categories = [...new Set(catalog.flatMap((resource) => resource.categories))].sort((a, b) => a.localeCompare(b));
const duplicateGroups = [...merged.values()].filter((resource) => resource.duplicateCount > 1).map((resource) => ({
  name: resource.name, url: resource.url, originalUrls: resource.sourceUrls,
  categories: resource.categories, duplicateCount: resource.duplicateCount,
}));
const sourceEntries = raw.reduce((sum, category) => sum + category.items.length, 0);
const report = {
  generatedAt: new Date().toISOString(), sourceEntries, catalogEntries: catalog.length,
  duplicateEntriesMerged: sourceEntries - catalog.length, duplicateGroups, categories, upgradedHttpCount,
  missingDescriptionCount,
  generatedFallbackDescriptions: catalog.filter((resource) => resource.summary.includes("is a curated")).length,
  invalidUrls,
  iconCandidates: {
    withLogo: catalog.filter((resource) => resource.icon.logoUrl).length,
    withFavicon: catalog.filter((resource) => resource.icon.faviconUrl).length,
    fallbackOnly: catalog.filter((resource) => resource.icon.status === "fallback-only").length,
  },
  reviewStatus: {
    needsReview: catalog.filter((resource) => resource.review.status === "review-needed").length,
    verified: catalog.filter((resource) => resource.review.status === "verified").length,
  },
};
fs.writeFileSync(REPORT_JSON_PATH, `${JSON.stringify(report, null, 2)}\n`);
const markdown = `# Darma Resource Library Audit\n\nGenerated: ${report.generatedAt}\n\n## Summary\n\n- Legacy entries scanned: **${report.sourceEntries}**\n- Unique catalog records: **${report.catalogEntries}**\n- Duplicate entries merged: **${report.duplicateEntriesMerged}** across **${report.duplicateGroups.length}** URL groups\n- Legacy HTTP URLs upgraded in the generated catalog: **${report.upgradedHttpCount}**\n- Missing legacy descriptions detected: **${report.missingDescriptionCount}**\n- Safe fallback descriptions generated: **${report.generatedFallbackDescriptions}**\n- Records with logo candidates: **${report.iconCandidates.withLogo}**\n- Records with favicon candidates: **${report.iconCandidates.withFavicon}**\n- Invalid URLs excluded: **${report.invalidUrls.length}**\n\n## Trust policy\n\nThe build step does not guess pricing, ownership, or verification. Unknown values remain \`unknown\`, and every imported record starts as \`review-needed\` until the network audit or a manual review confirms it.\n\n## Categories\n\n${report.categories.map((category) => `- ${category}`).join("\n")}\n\n## Duplicate groups merged\n\n${report.duplicateGroups.map((group) => `- **${group.name}** — ${group.url} — ${group.duplicateCount} legacy entries — ${group.categories.join(", ")}`).join("\n") || "None"}\n`;
fs.writeFileSync(REPORT_MD_PATH, markdown);
console.log(`Built ${catalog.length} resource records from ${report.sourceEntries} legacy entries.`);
console.log(`Merged ${report.duplicateEntriesMerged} duplicates and upgraded ${upgradedHttpCount} HTTP URLs.`);
