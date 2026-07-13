export type MarkdownTab = "preview" | "html" | "source";

export type MarkdownPreviewTheme = "github" | "document" | "compact";
export type MarkdownPreviewWidth = "full" | "reading" | "mobile";

export type MarkdownOptions = {
  livePreview: boolean;
  githubLineBreaks: boolean;
  openLinksInNewTab: boolean;
  previewTheme: MarkdownPreviewTheme;
};

export type MarkdownRenderResult = {
  html: string;
  sanitizedHtml: string;
  warnings: string[];
};

export type MarkdownStats = {
  words: number;
  characters: number;
  lines: number;
  readingTimeMinutes: number;
  headings: number;
  links: number;
  images: number;
  codeBlocks: number;
  tables: number;
  listItems: number;
};

export type MarkdownHeading = {
  level: number;
  text: string;
  slug: string;
  line: number;
};

export type MarkdownCheckSeverity = "success" | "info" | "warning" | "danger";

export type MarkdownProductionCheck = {
  id: string;
  severity: MarkdownCheckSeverity;
  title: string;
  message: string;
};

export type MarkdownAnalysis = {
  stats: MarkdownStats;
  headings: MarkdownHeading[];
  checks: MarkdownProductionCheck[];
  score: number;
  title: string;
};

export type MarkdownPreset = {
  id: string;
  label: string;
  category: string;
  description: string;
  content: string;
};

export type MarkdownExample = {
  label: string;
  syntax: string;
  description: string;
};
