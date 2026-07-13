import { describe, expect, it } from "vitest";
import { buildSitemap, escapeXmlValue, generateSitemapIndex, parseUrlList } from "./sitemapXml";
import { DEFAULT_SITEMAP_OPTIONS } from "./presets";

describe("sitemap XML", () => {
  it("parses plain URL and CSV input", () => {
    expect(parseUrlList("https://example.com/\nhttps://example.com/about")).toHaveLength(2);
    const csv = parseUrlList("loc,lastmod,changefreq,priority\nhttps://example.com/,2026-07-12,daily,1.0");
    expect(csv[0]).toMatchObject({ lastmod: "2026-07-12", changefreq: "daily", priority: "1.0" });
  });

  it("escapes XML values", () => {
    expect(escapeXmlValue("https://example.com/?a=1&b=<x>")).toContain("&amp;");
  });

  it("removes duplicates and reports them", () => {
    const entries = parseUrlList("https://example.com/\nhttps://example.com/");
    const result = buildSitemap(entries, DEFAULT_SITEMAP_OPTIONS);
    expect(result.stats.valid).toBe(1);
    expect(result.stats.duplicates).toBe(1);
  });

  it("splits output and creates an index", () => {
    const entries = parseUrlList("https://example.com/a\nhttps://example.com/b\nhttps://example.com/c");
    const result = buildSitemap(entries, { ...DEFAULT_SITEMAP_OPTIONS, urlsPerFile: 2 });
    expect(result.files).toHaveLength(2);
    expect(result.indexXml).toContain("sitemap-1.xml");
  });

  it("warns about multiple hosts", () => {
    const entries = parseUrlList("https://example.com/\nhttps://other.example.com/");
    const result = buildSitemap(entries, DEFAULT_SITEMAP_OPTIONS);
    expect(result.checks.some((check) => check.id === "hosts" && check.level === "danger")).toBe(true);
  });

  it("builds a valid sitemap index", () => {
    expect(generateSitemapIndex(["sitemap-1.xml"], "https://example.com")).toContain("https://example.com/sitemap-1.xml");
  });
});
