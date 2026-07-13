export type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
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
  urlsPerFile: number;
  sitemapBaseUrl: string;
}

export type SitemapCheckSeverity = "success" | "info" | "warning" | "danger";
export interface SitemapWarning { id: string; level: SitemapCheckSeverity; title?: string; message: string; }
export interface SitemapStats { total: number; valid: number; invalid: number; hosts: number; duplicates: number; xmlBytes: number; files: number; }
export interface SitemapBuildResult { files: Array<{ filename: string; xml: string; count: number; bytes: number }>; indexXml: string; stats: SitemapStats; checks: SitemapWarning[]; }
export interface SitemapPreset { id: string; label: string; description: string; input: string; options: SitemapOptions; }
