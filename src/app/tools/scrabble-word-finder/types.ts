export type WordMatch = {
  word: string;
  score: number;
  /** Number of blank tiles consumed to play this word. */
  blanksUsed: number;
  length: number;
};

export type SortMode = "score" | "length" | "alpha";

export type FinderFilters = {
  /** Substring that must appear anywhere in the word. */
  contains: string;
  startsWith: string;
  endsWith: string;
  minLength: number;
  maxLength: number;
};

export type DictionarySource = "starter" | "custom";

export type FinderValidationMessage = {
  type: "info" | "warning" | "error";
  message: string;
};
