export type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export type DefaultLastmodMode = "none" | "today" | "custom";
export type DefaultPriority = "none" | "1.0" | "0.8" | "0.5" | "0.3";
export type DefaultChangeFrequency = "none" | ChangeFrequency;

export interface SitemapUrlEntry {
  id: string;
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFrequency | "";
  priority?: string;
}

export interface SitemapOptions {
  defaultLastmodMode: DefaultLastmodMode;
  customLastmod: string;
  defaultChangefreq: DefaultChangeFrequency;
  defaultPriority: DefaultPriority;
}

export type SitemapWarningLevel = "info" | "warning" | "danger";

export interface SitemapWarning {
  id: string;
  level: SitemapWarningLevel;
  message: string;
}

export interface SitemapPreset {
  id: string;
  label: string;
  description: string;
  input: string;
  options: SitemapOptions;
}
