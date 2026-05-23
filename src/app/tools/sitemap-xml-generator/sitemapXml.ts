import type { ChangeFrequency, SitemapOptions, SitemapUrlEntry, SitemapWarning } from "./types";

const CHANGE_FREQUENCIES = new Set<ChangeFrequency>(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function makeId(value: string, index: number) {
  return `url-${index}-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 28) || "entry"}`;
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeLoc(value: string) {
  return value.trim();
}

function normalizePriority(value?: string) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) return trimmed;
  return numeric.toFixed(1);
}

export function escapeXmlValue(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function parseUrlList(input: string): SitemapUrlEntry[] {
  const seen = new Set<string>();
  const entries: SitemapUrlEntry[] = [];

  input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const loc = normalizeLoc(line);
      const key = loc.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      entries.push({ id: makeId(loc, index), loc, lastmod: "", changefreq: "", priority: "" });
    });

  return entries;
}

export function applySitemapDefaults(entry: SitemapUrlEntry, options: SitemapOptions, today = new Date()): SitemapUrlEntry {
  const next = { ...entry };

  if (!next.lastmod) {
    if (options.defaultLastmodMode === "today") next.lastmod = today.toISOString().slice(0, 10);
    if (options.defaultLastmodMode === "custom" && options.customLastmod) next.lastmod = options.customLastmod;
  }

  if (!next.changefreq && options.defaultChangefreq !== "none") next.changefreq = options.defaultChangefreq;
  if (!next.priority && options.defaultPriority !== "none") next.priority = options.defaultPriority;

  return next;
}

export function validateSitemapEntry(entry: SitemapUrlEntry): SitemapWarning[] {
  const warnings: SitemapWarning[] = [];
  const loc = normalizeLoc(entry.loc);

  if (!loc) {
    warnings.push({ id: `${entry.id}-empty-url`, level: "danger", message: "URL is required for every sitemap row." });
  } else if (!isAbsoluteHttpUrl(loc)) {
    warnings.push({ id: `${entry.id}-invalid-url`, level: "danger", message: `URL "${loc}" must be an absolute http(s) URL.` });
  }

  if (entry.lastmod && !DATE_PATTERN.test(entry.lastmod.trim())) {
    warnings.push({ id: `${entry.id}-lastmod`, level: "warning", message: `Last modified date for "${loc || "this row"}" should use YYYY-MM-DD.` });
  }

  if (entry.changefreq && !CHANGE_FREQUENCIES.has(entry.changefreq)) {
    warnings.push({ id: `${entry.id}-changefreq`, level: "warning", message: `Change frequency for "${loc || "this row"}" is not a valid sitemap value.` });
  }

  if (entry.priority) {
    const priority = Number(entry.priority);
    if (!Number.isFinite(priority) || priority < 0 || priority > 1) {
      warnings.push({ id: `${entry.id}-priority`, level: "warning", message: `Priority for "${loc || "this row"}" must be between 0.0 and 1.0.` });
    }
  }

  return warnings;
}

export function validateSitemapEntries(entries: SitemapUrlEntry[], maxUrls = 1000): SitemapWarning[] {
  const warnings: SitemapWarning[] = [];
  const seen = new Map<string, number>();

  if (entries.length === 0) warnings.push({ id: "empty", level: "info", message: "Add at least one absolute URL to generate a useful sitemap." });
  if (entries.length > maxUrls) warnings.push({ id: "too-many", level: "danger", message: `This browser tool supports up to ${maxUrls} URLs in v1. Remove extra rows before exporting.` });

  entries.forEach((entry, index) => {
    warnings.push(...validateSitemapEntry(entry));
    const key = normalizeLoc(entry.loc).toLowerCase();
    if (!key) return;
    const firstIndex = seen.get(key);
    if (firstIndex !== undefined) {
      warnings.push({ id: `${entry.id}-duplicate`, level: "info", message: `Duplicate URL on row ${index + 1}; the first copy is row ${firstIndex + 1}.` });
    } else {
      seen.set(key, index);
    }
  });

  return warnings;
}

export function dedupeEntries(entries: SitemapUrlEntry[]): SitemapUrlEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = normalizeLoc(entry.loc).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function generateSitemapXml(entries: SitemapUrlEntry[], options: SitemapOptions): string {
  const cleanEntries = dedupeEntries(entries)
    .slice(0, 1000)
    .map((entry) => applySitemapDefaults(entry, options))
    .filter((entry) => normalizeLoc(entry.loc));

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  cleanEntries.forEach((entry) => {
    lines.push("  <url>");
    lines.push(`    <loc>${escapeXmlValue(normalizeLoc(entry.loc))}</loc>`);
    if (entry.lastmod?.trim()) lines.push(`    <lastmod>${escapeXmlValue(entry.lastmod.trim())}</lastmod>`);
    if (entry.changefreq) lines.push(`    <changefreq>${escapeXmlValue(entry.changefreq)}</changefreq>`);
    const priority = normalizePriority(entry.priority);
    if (priority) lines.push(`    <priority>${escapeXmlValue(priority)}</priority>`);
    lines.push("  </url>");
  });

  lines.push("</urlset>");
  return `${lines.join("\n")}\n`;
}
