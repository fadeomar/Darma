export type MarkdownTab = "write" | "preview" | "html";

export type MarkdownOptions = {
  livePreview: boolean;
  githubLineBreaks: boolean;
  openLinksInNewTab: boolean;
  sanitizeHtml: boolean;
};

export type MarkdownRenderResult = {
  html: string;
  sanitizedHtml: string;
  warnings: string[];
};

export type MarkdownStats = {
  words: number;
  characters: number;
  readingTimeMinutes: number;
};

export type MarkdownExample = {
  label: string;
  syntax: string;
  description: string;
};
