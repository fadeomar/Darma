import { MAX_BROWSER_URLS, MAX_SITEMAP_BYTES, MAX_SITEMAP_URLS, MAX_URL_LENGTH } from "./presets";
import type { ChangeFrequency, SitemapBuildResult, SitemapOptions, SitemapStats, SitemapUrlEntry, SitemapWarning } from "./types";

const CHANGE_FREQUENCIES = new Set<ChangeFrequency>(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const encoder = new TextEncoder();

function makeId(value: string, index: number) { return `url-${index}-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24) || "entry"}`; }
export function isAbsoluteHttpUrl(value: string): boolean { try { const url = new URL(value.trim()); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } }
function csvCells(line: string): string[] { const out: string[] = []; let cell = ""; let quoted = false; for (let i = 0; i < line.length; i += 1) { const char = line[i]; if (char === '"') { if (quoted && line[i + 1] === '"') { cell += '"'; i += 1; } else quoted = !quoted; } else if (char === "," && !quoted) { out.push(cell.trim()); cell = ""; } else cell += char; } out.push(cell.trim()); return out; }
function normalizePriority(value?: string) { const text = String(value ?? "").trim(); if (!text) return ""; const number = Number(text); return Number.isFinite(number) && number >= 0 && number <= 1 ? number.toFixed(1) : ""; }
export function escapeXmlValue(value: string): string { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }

export function parseUrlList(input: string): SitemapUrlEntry[] {
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const hasHeader = lines[0]?.toLowerCase().replace(/\s/g, "").startsWith("loc,");
  return lines.slice(hasHeader ? 1 : 0).slice(0, MAX_BROWSER_URLS).map((line, index) => {
    const [loc = "", lastmod = "", changefreq = "", priority = ""] = line.includes(",") ? csvCells(line) : [line];
    return { id: makeId(loc, index), loc: loc.trim(), lastmod: lastmod.trim(), changefreq: CHANGE_FREQUENCIES.has(changefreq as ChangeFrequency) ? changefreq as ChangeFrequency : changefreq ? changefreq as ChangeFrequency : "", priority: priority.trim() };
  });
}

export function applySitemapDefaults(entry: SitemapUrlEntry, options: SitemapOptions, today = new Date()): SitemapUrlEntry {
  const next = { ...entry };
  if (!next.lastmod) { if (options.defaultLastmodMode === "today") next.lastmod = today.toISOString().slice(0, 10); if (options.defaultLastmodMode === "custom") next.lastmod = options.customLastmod; }
  if (!next.changefreq && options.defaultChangefreq !== "none") next.changefreq = options.defaultChangefreq;
  if (!next.priority && options.defaultPriority !== "none") next.priority = options.defaultPriority;
  return next;
}

export function validateSitemapEntry(entry: SitemapUrlEntry): SitemapWarning[] {
  const checks: SitemapWarning[] = []; const loc = entry.loc.trim();
  if (!loc) checks.push({ id: `${entry.id}-empty`, level: "danger", title: "Missing URL", message: "Every sitemap row requires a loc value." });
  else if (!isAbsoluteHttpUrl(loc)) checks.push({ id: `${entry.id}-url`, level: "danger", title: "Invalid URL", message: `${loc} must be an absolute HTTP(S) URL.` });
  else if (loc.length > MAX_URL_LENGTH) checks.push({ id: `${entry.id}-long`, level: "warning", title: "Long URL", message: `URL is longer than ${MAX_URL_LENGTH} characters.` });
  if (entry.lastmod && (!DATE_PATTERN.test(entry.lastmod) || Number.isNaN(Date.parse(`${entry.lastmod}T00:00:00Z`)))) checks.push({ id: `${entry.id}-date`, level: "warning", title: "Invalid lastmod", message: `${entry.lastmod} should be a real YYYY-MM-DD date.` });
  if (entry.changefreq && !CHANGE_FREQUENCIES.has(entry.changefreq)) checks.push({ id: `${entry.id}-freq`, level: "warning", title: "Invalid changefreq", message: `${entry.changefreq} is not a supported sitemap value.` });
  if (entry.priority) { const value = Number(entry.priority); if (!Number.isFinite(value) || value < 0 || value > 1) checks.push({ id: `${entry.id}-priority`, level: "warning", title: "Invalid priority", message: "Priority must be between 0.0 and 1.0." }); }
  return checks;
}

export function dedupeEntries(entries: SitemapUrlEntry[]): SitemapUrlEntry[] { const seen = new Set<string>(); return entries.filter((entry) => { const key = entry.loc.trim().toLowerCase(); if (!key || seen.has(key)) return false; seen.add(key); return true; }); }
function generateUrlset(entries: SitemapUrlEntry[]): string { const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']; for (const entry of entries) { lines.push("  <url>", `    <loc>${escapeXmlValue(entry.loc.trim())}</loc>`); if (entry.lastmod) lines.push(`    <lastmod>${escapeXmlValue(entry.lastmod)}</lastmod>`); if (entry.changefreq && CHANGE_FREQUENCIES.has(entry.changefreq)) lines.push(`    <changefreq>${escapeXmlValue(entry.changefreq)}</changefreq>`); const priority = normalizePriority(entry.priority); if (priority) lines.push(`    <priority>${priority}</priority>`); lines.push("  </url>"); } lines.push("</urlset>"); return `${lines.join("\n")}\n`; }
export function generateSitemapIndex(filenames: string[], baseUrl: string, lastmod = new Date().toISOString().slice(0, 10)): string { const root = baseUrl.replace(/\/$/, ""); const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']; filenames.forEach((filename) => lines.push("  <sitemap>", `    <loc>${escapeXmlValue(`${root}/${filename}`)}</loc>`, `    <lastmod>${lastmod}</lastmod>`, "  </sitemap>")); lines.push("</sitemapindex>"); return `${lines.join("\n")}\n`; }

export function buildSitemap(entries: SitemapUrlEntry[], options: SitemapOptions): SitemapBuildResult {
  const duplicateCount = Math.max(0, entries.filter((entry) => entry.loc.trim()).length - dedupeEntries(entries).length);
  const unique = dedupeEntries(entries).map((entry) => applySitemapDefaults(entry, options));
  const rowChecks = unique.flatMap(validateSitemapEntry);
  const valid = unique.filter((entry) => !validateSitemapEntry(entry).some((check) => check.level === "danger"));
  const perFile = Math.min(MAX_SITEMAP_URLS, Math.max(1, Math.round(options.urlsPerFile || MAX_SITEMAP_URLS)));
  const files: SitemapBuildResult["files"] = [];
  for (let i = 0; i < valid.length; i += perFile) { const chunk = valid.slice(i, i + perFile); const xml = generateUrlset(chunk); files.push({ filename: valid.length > perFile ? `sitemap-${files.length + 1}.xml` : "sitemap.xml", xml, count: chunk.length, bytes: encoder.encode(xml).length }); }
  if (!files.length) { const xml = generateUrlset([]); files.push({ filename: "sitemap.xml", xml, count: 0, bytes: encoder.encode(xml).length }); }
  const hosts = new Set(valid.map((entry) => new URL(entry.loc).host));
  const checks: SitemapWarning[] = [...rowChecks];
  if (duplicateCount) checks.push({ id: "duplicates", level: "info", title: "Duplicates removed", message: `${duplicateCount} duplicate URL${duplicateCount === 1 ? " was" : "s were"} removed from export.` });
  if (hosts.size > 1) checks.push({ id: "hosts", level: "danger", title: "Multiple hosts", message: "A sitemap should normally contain URLs from one host only. Split these URLs by host." });
  if (entries.length > MAX_BROWSER_URLS) checks.push({ id: "browser-limit", level: "danger", title: "Browser limit reached", message: `Only the first ${MAX_BROWSER_URLS.toLocaleString()} rows were parsed.` });
  if (files.some((file) => file.bytes > MAX_SITEMAP_BYTES)) checks.push({ id: "size", level: "danger", title: "File too large", message: "One output exceeds the 50 MB uncompressed sitemap limit." });
  if (!checks.some((check) => check.level === "danger" || check.level === "warning")) checks.push({ id: "ready", level: "success", title: "Production-ready structure", message: "URLs, metadata, host consistency and output limits look valid." });
  const stats: SitemapStats = { total: entries.length, valid: valid.length, invalid: unique.length - valid.length, hosts: hosts.size, duplicates: duplicateCount, xmlBytes: files.reduce((sum, file) => sum + file.bytes, 0), files: files.length };
  return { files, indexXml: files.length > 1 ? generateSitemapIndex(files.map((file) => file.filename), options.sitemapBaseUrl) : "", stats, checks };
}

export function generateSitemapXml(entries: SitemapUrlEntry[], options: SitemapOptions): string { return buildSitemap(entries, { ...options, urlsPerFile: MAX_SITEMAP_URLS }).files[0].xml; }
export function validateSitemapEntries(entries: SitemapUrlEntry[]): SitemapWarning[] { return entries.flatMap(validateSitemapEntry); }
export function buildSitemapReport(result: SitemapBuildResult, options: SitemapOptions) { return JSON.stringify({ generatedAt: new Date().toISOString(), options: { ...options }, stats: result.stats, files: result.files.map(({ filename, count, bytes }) => ({ filename, count, bytes })), checks: result.checks }, null, 2); }
