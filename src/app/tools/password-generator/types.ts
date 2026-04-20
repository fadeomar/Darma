export type PasswordMode = "password" | "passphrase";

export type PasswordConfig = {
  mode: PasswordMode;
  // Password mode
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  // Passphrase mode
  wordCount: number;
  separator: string;
  capitalizeWords: boolean;
  includeNumber: boolean;
  includeSymbol: boolean;
  // Shared
  seedText: string;
};

export type StrengthLevel = "very-weak" | "weak" | "fair" | "strong" | "very-strong";

export type StrengthResult = {
  entropy: number;
  level: StrengthLevel;
  label: string;
  crackTime: string;
  score: number; // 0–100 for the bar width
  color: string; // tailwind bg class
};

export type CharType = "lower" | "upper" | "digit" | "symbol";
export type AnnotatedChar = { char: string; type: CharType };
