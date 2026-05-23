import type { ChangeFrequency, DefaultChangeFrequency, DefaultLastmodMode, DefaultPriority, SitemapOptions, SitemapPreset } from "./types";

export const MAX_SITEMAP_URLS = 1000;
export const MAX_MANUAL_INPUT_LENGTH = 100_000;
export const MAX_URL_LENGTH = 2048;

export const DEFAULT_SITEMAP_OPTIONS: SitemapOptions = {
  defaultLastmodMode: "today",
  customLastmod: new Date().toISOString().slice(0, 10),
  defaultChangefreq: "weekly",
  defaultPriority: "0.8",
};

export const LASTMOD_OPTIONS: { value: DefaultLastmodMode; label: string }[] = [
  { value: "none", label: "None" },
  { value: "today", label: "Today" },
  { value: "custom", label: "Custom date" },
];

export const CHANGEFREQ_OPTIONS: { value: DefaultChangeFrequency; label: string }[] = [
  { value: "none", label: "None" },
  { value: "always", label: "Always" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "never", label: "Never" },
];

export const ENTRY_CHANGEFREQ_OPTIONS: { value: ChangeFrequency | ""; label: string }[] = [
  { value: "", label: "Use default / none" },
  { value: "always", label: "Always" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "never", label: "Never" },
];

export const PRIORITY_OPTIONS: { value: DefaultPriority; label: string }[] = [
  { value: "none", label: "None" },
  { value: "1.0", label: "1.0 — highest" },
  { value: "0.8", label: "0.8 — important" },
  { value: "0.5", label: "0.5 — normal" },
  { value: "0.3", label: "0.3 — lower" },
];

export const SITEMAP_SAMPLE_INPUT = [
  "https://example.com/",
  "https://example.com/about",
  "https://example.com/blog/fluid-typography-guide",
  "https://example.com/tools/meta-tag-generator",
].join("\n");

export const SITEMAP_PRESETS: SitemapPreset[] = [
  {
    id: "small-site",
    label: "Small website",
    description: "Homepage, about page, blog post, and tool page with weekly defaults.",
    input: SITEMAP_SAMPLE_INPUT,
    options: DEFAULT_SITEMAP_OPTIONS,
  },
  {
    id: "fresh-content",
    label: "Fresh content",
    description: "Daily change frequency for news, docs, or frequently updated content.",
    input: SITEMAP_SAMPLE_INPUT,
    options: { ...DEFAULT_SITEMAP_OPTIONS, defaultChangefreq: "daily", defaultPriority: "1.0" },
  },
  {
    id: "static-pages",
    label: "Static pages",
    description: "Monthly change frequency with normal priority for stable pages.",
    input: SITEMAP_SAMPLE_INPUT,
    options: { ...DEFAULT_SITEMAP_OPTIONS, defaultChangefreq: "monthly", defaultPriority: "0.5" },
  },
];
