import type { ChangeFrequency, DefaultChangeFrequency, DefaultLastmodMode, DefaultPriority, SitemapOptions, SitemapPreset } from "./types";

export const MAX_SITEMAP_URLS = 50_000;
export const MAX_BROWSER_URLS = 10_000;
export const MAX_URL_LENGTH = 2048;
export const MAX_SITEMAP_BYTES = 50 * 1024 * 1024;

export const DEFAULT_SITEMAP_OPTIONS: SitemapOptions = {
  defaultLastmodMode: "today",
  customLastmod: new Date().toISOString().slice(0, 10),
  defaultChangefreq: "weekly",
  defaultPriority: "0.8",
  urlsPerFile: 5_000,
  sitemapBaseUrl: "https://example.com",
};

export const LASTMOD_OPTIONS: { value: DefaultLastmodMode; label: string }[] = [
  { value: "none", label: "None" }, { value: "today", label: "Today" }, { value: "custom", label: "Custom date" },
];
export const CHANGEFREQ_OPTIONS: { value: DefaultChangeFrequency; label: string }[] = [
  { value: "none", label: "None" }, { value: "always", label: "Always" }, { value: "hourly", label: "Hourly" }, { value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }, { value: "never", label: "Never" },
];
export const ENTRY_CHANGEFREQ_OPTIONS: { value: ChangeFrequency | ""; label: string }[] = [
  { value: "", label: "Default" }, ...CHANGEFREQ_OPTIONS.filter((item) => item.value !== "none") as { value: ChangeFrequency; label: string }[],
];
export const PRIORITY_OPTIONS: { value: DefaultPriority; label: string }[] = [
  { value: "none", label: "None" }, { value: "1.0", label: "1.0 — highest" }, { value: "0.8", label: "0.8 — important" }, { value: "0.5", label: "0.5 — normal" }, { value: "0.3", label: "0.3 — lower" },
];

export const SITEMAP_SAMPLE_INPUT = [
  "loc,lastmod,changefreq,priority",
  "https://example.com/,2026-07-12,daily,1.0",
  "https://example.com/about,2026-07-10,monthly,0.7",
  "https://example.com/blog/fluid-typography-guide,2026-07-11,weekly,0.8",
  "https://example.com/tools/meta-tag-generator,,weekly,0.8",
].join("\n");

export const SITEMAP_PRESETS: SitemapPreset[] = [
  { id: "small-site", label: "Small website", description: "Homepage, company pages, blog and tools with balanced SEO metadata.", input: SITEMAP_SAMPLE_INPUT, options: DEFAULT_SITEMAP_OPTIONS },
  { id: "news", label: "News / fresh content", description: "Daily updates and high priority for frequently published content.", input: ["https://example.com/", "https://example.com/news", "https://example.com/news/latest-story"].join("\n"), options: { ...DEFAULT_SITEMAP_OPTIONS, defaultChangefreq: "daily", defaultPriority: "1.0" } },
  { id: "docs", label: "Documentation", description: "Stable documentation with weekly crawl hints.", input: ["https://docs.example.com/", "https://docs.example.com/getting-started", "https://docs.example.com/api/authentication"].join("\n"), options: { ...DEFAULT_SITEMAP_OPTIONS, sitemapBaseUrl: "https://docs.example.com", defaultChangefreq: "weekly" } },
  { id: "commerce", label: "Product catalog", description: "Category and product URLs prepared for splitting into multiple files.", input: ["https://shop.example.com/", "https://shop.example.com/products", "https://shop.example.com/products/alpha", "https://shop.example.com/products/beta"].join("\n"), options: { ...DEFAULT_SITEMAP_OPTIONS, sitemapBaseUrl: "https://shop.example.com", defaultChangefreq: "daily", urlsPerFile: 2 } },
];
