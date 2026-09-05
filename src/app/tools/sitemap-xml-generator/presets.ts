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
  { id: "blog", label: "Blog / publication", description: "Homepage, category pages, and recent articles with weekly defaults.", input: ["https://blog.example.com/", "https://blog.example.com/articles", "https://blog.example.com/articles/design-systems", "https://blog.example.com/articles/browser-performance"].join("\n"), options: { ...DEFAULT_SITEMAP_OPTIONS, sitemapBaseUrl: "https://blog.example.com", defaultChangefreq: "weekly", defaultPriority: "0.8" } },
  { id: "saas", label: "SaaS marketing", description: "Core marketing, pricing, integrations, docs, and changelog URLs.", input: ["https://example.com/", "https://example.com/pricing", "https://example.com/integrations", "https://example.com/docs", "https://example.com/changelog"].join("\n"), options: { ...DEFAULT_SITEMAP_OPTIONS, sitemapBaseUrl: "https://example.com", defaultChangefreq: "weekly" } },
  { id: "local-business", label: "Local business", description: "Home, services, location, menu, booking, and contact pages.", input: ["https://local.example.com/", "https://local.example.com/services", "https://local.example.com/location", "https://local.example.com/menu", "https://local.example.com/contact"].join("\n"), options: { ...DEFAULT_SITEMAP_OPTIONS, sitemapBaseUrl: "https://local.example.com", defaultChangefreq: "monthly", defaultPriority: "0.8" } },
  { id: "knowledge-base", label: "Knowledge base", description: "Help center sections and support articles with stable weekly hints.", input: ["https://help.example.com/", "https://help.example.com/getting-started", "https://help.example.com/account", "https://help.example.com/billing", "https://help.example.com/troubleshooting"].join("\n"), options: { ...DEFAULT_SITEMAP_OPTIONS, sitemapBaseUrl: "https://help.example.com", defaultChangefreq: "weekly" } },
  { id: "portfolio", label: "Portfolio", description: "Small creative portfolio with project and about pages.", input: ["https://studio.example.com/", "https://studio.example.com/work", "https://studio.example.com/work/project-one", "https://studio.example.com/work/project-two", "https://studio.example.com/about"].join("\n"), options: { ...DEFAULT_SITEMAP_OPTIONS, sitemapBaseUrl: "https://studio.example.com", defaultChangefreq: "monthly" } },
  { id: "events", label: "Events calendar", description: "Event index and individual event pages with fresher crawl hints.", input: ["https://events.example.com/", "https://events.example.com/calendar", "https://events.example.com/events/frontend-day", "https://events.example.com/events/design-meetup"].join("\n"), options: { ...DEFAULT_SITEMAP_OPTIONS, sitemapBaseUrl: "https://events.example.com", defaultChangefreq: "daily", defaultPriority: "0.8" } },
  { id: "jobs", label: "Jobs / careers", description: "Careers index, teams, locations, and active role pages.", input: ["https://jobs.example.com/", "https://jobs.example.com/engineering", "https://jobs.example.com/design", "https://jobs.example.com/roles/frontend-engineer", "https://jobs.example.com/roles/product-designer"].join("\n"), options: { ...DEFAULT_SITEMAP_OPTIONS, sitemapBaseUrl: "https://jobs.example.com", defaultChangefreq: "daily", defaultPriority: "0.8" } },
  { id: "multilingual", label: "Multilingual site", description: "Language-prefixed canonical URLs prepared for a shared sitemap workflow.", input: ["https://example.com/en/", "https://example.com/en/about", "https://example.com/ar/", "https://example.com/ar/about", "https://example.com/fr/", "https://example.com/fr/about"].join("\n"), options: { ...DEFAULT_SITEMAP_OPTIONS, sitemapBaseUrl: "https://example.com", defaultChangefreq: "weekly" } },
  { id: "media", label: "Media gallery", description: "Gallery index, collections, and public media detail pages.", input: ["https://media.example.com/", "https://media.example.com/galleries", "https://media.example.com/galleries/summer", "https://media.example.com/photo/alpha", "https://media.example.com/photo/beta"].join("\n"), options: { ...DEFAULT_SITEMAP_OPTIONS, sitemapBaseUrl: "https://media.example.com", defaultChangefreq: "weekly" } },
  { id: "large-catalog", label: "Large catalog split", description: "Example product catalog configured to demonstrate multi-file sitemap output.", input: ["https://catalog.example.com/", "https://catalog.example.com/products/a", "https://catalog.example.com/products/b", "https://catalog.example.com/products/c", "https://catalog.example.com/products/d", "https://catalog.example.com/products/e"].join("\n"), options: { ...DEFAULT_SITEMAP_OPTIONS, sitemapBaseUrl: "https://catalog.example.com", defaultChangefreq: "daily", urlsPerFile: 3 } },
];
