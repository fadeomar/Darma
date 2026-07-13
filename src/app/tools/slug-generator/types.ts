export type SlugCaseMode = "lower" | "keep" | "upper";
export type SlugSeparator = "-" | "_";
export type SlugMode = "single" | "bulk";
export type SlugCollisionMode = "suffix" | "error" | "allow";
export type SlugTab = "routes" | "checks" | "exports";
export type SlugCheckLevel = "success" | "info" | "warning" | "danger";

export type SlugOptions = {
  separator: SlugSeparator;
  caseMode: SlugCaseMode;
  keepNumbers: boolean;
  removeStopWords: boolean;
  maxLengthEnabled: boolean;
  maxLength: number;
  preserveSlashes: boolean;
  asciiOnly: boolean;
  trimAtWordBoundary: boolean;
};

export type SlugWarning =
  | "empty-input"
  | "empty-output"
  | "very-long"
  | "trimmed"
  | "ascii-loss";

export type SlugStats = {
  originalChars: number;
  slugChars: number;
  wordCount: number;
  segmentCount: number;
  isUrlFriendly: boolean;
  removedCharacterCount: number;
};

export type SlugResult = {
  slug: string;
  warnings: SlugWarning[];
  stats: SlugStats;
};

export type SlugInputRow = {
  id: string;
  title: string;
  previousPath: string;
  sourceLine: number;
};

export type SlugRouteRow = SlugInputRow & {
  baseSlug: string;
  slug: string;
  path: string;
  redirectFrom: string | null;
  warnings: string[];
  collisionIndex: number;
  valid: boolean;
};

export type SlugBatchConfig = {
  mode: SlugMode;
  pathPrefix: string;
  collisionMode: SlugCollisionMode;
  collisionStart: number;
  reservedWords: string[];
};

export type SlugCheck = {
  id: string;
  level: SlugCheckLevel;
  title: string;
  message: string;
};

export type SlugBatchResult = {
  rows: SlugRouteRow[];
  checks: SlugCheck[];
  stats: {
    inputRows: number;
    validRoutes: number;
    redirects: number;
    collisions: number;
    reservedHits: number;
    unicodeRoutes: number;
    longestPath: number;
  };
};

export type SlugPreset = {
  id: string;
  name: string;
  description: string;
  mode: SlugMode;
  input: string;
  pathPrefix: string;
  collisionMode: SlugCollisionMode;
  options: Partial<SlugOptions>;
};

export type SlugReport = {
  generatedAt: string;
  configuration: SlugBatchConfig & { options: SlugOptions };
  stats: SlugBatchResult["stats"];
  routes: SlugRouteRow[];
  checks: SlugCheck[];
};
