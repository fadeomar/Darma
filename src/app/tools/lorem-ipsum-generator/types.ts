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
};

export type Preset = {
  id: string;
  label: string;
  icon: string;
  config: Partial<LoremConfig>;
};
