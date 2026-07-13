export type GenerationMode = "words" | "sentences" | "paragraphs" | "structured";

export type TextStyle =
  | "classic"
  | "readable"
  | "startup"
  | "ecommerce"
  | "blog"
  | "profile";

export type OutputFormat = "plain" | "html";
export type BlockLength = "short" | "medium" | "long";
export type PreviewViewport = "desktop" | "mobile";
export type LoremResultTab = "preview" | "plain" | "html" | "react" | "report";

export type StructuredBlock =
  | "hero"
  | "card"
  | "testimonial"
  | "faq"
  | "product"
  | "about"
  | "onboarding"
  | "pricing";

export type LoremConfig = {
  mode: GenerationMode;
  style: TextStyle;
  amount: number;
  blockLength: BlockLength;
  outputFormat: OutputFormat;
  startWithLorem: boolean;
  includeHeadings: boolean;
  includeLists: boolean;
  structuredBlock: StructuredBlock;
  seed: string;
};

export type GeneratedOutput = {
  plain: string;
  html: string;
};

export type LoremStats = {
  words: number;
  characters: number;
  sentences: number;
  paragraphs: number;
  readingTimeSeconds: number;
  bytes: number;
  blocks: number;
  uniqueWordRatio: number;
};

export type LoremCheckLevel = "success" | "info" | "warning" | "danger";

export type LoremCheck = {
  id: string;
  level: LoremCheckLevel;
  title: string;
  message: string;
};

export type LoremReport = {
  generatedAt: string;
  config: LoremConfig;
  stats: LoremStats;
  checks: LoremCheck[];
  outputs: {
    plainCharacters: number;
    htmlCharacters: number;
    hasPlaceholderLinks: boolean;
  };
};

export type Preset = {
  id: string;
  label: string;
  icon: string;
  description: string;
  config: Partial<LoremConfig>;
};
