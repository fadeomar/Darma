/**
 * Math Sprint — shared types.
 *
 * Ported from the original Vite "math-game" (MIT, paulgreg/math-game). The 19
 * difficulty kinds and their operation grouping are preserved; only the spelling
 * was tidied (`SUBTRACT` instead of `SUBSTRACT`) and everything is typed.
 */

export const DIFFICULTIES = [
  "ADD_INT_SIMPLE_NUMBER",
  "ADD_INT_1_NUMBER",
  "ADD_INT_10_NUMBER",
  "ADD_INT_20_NUMBER",
  "ADD_INT_2_NUMBER",
  "ADD_INT_3_NUMBER",
  "SUBTRACT_INT_1_NUMBER",
  "SUBTRACT_INT_FROM_TEN_NUMBER",
  "SUBTRACT_INT_2_NUMBER",
  "SUBTRACT_INT_3_NUMBER",
  "SUBTRACT_NEGATIVE_INT_1_NUMBER",
  "SUBTRACT_NEGATIVE_INT_2_NUMBER",
  "MULTIPLY_INT_1_NUMBER",
  "MULTIPLY_INT_2_NUMBER",
  "MULTIPLY_INT_TENS_NUMBER",
  "MULTIPLY_SIMPLE_FLOAT_NUMBER",
  "DIVIDE_INT_2_NUMBER",
  "DIVIDE_INT_TENS_NUMBER",
  "DIVIDE_SIMPLE_FLOAT_NUMBER",
] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export type DifficultyMap = Record<Difficulty, boolean>;

/** Visible operator symbol returned by `getOperation`. */
export type Operator = "+" | "-" | "×" | "÷";

/** UI grouping for the operation toggles. */
export type OperationGroup = "addition" | "subtraction" | "multiplication" | "division" | "advanced";

export type GameMode = "practice" | "sprint" | "kids";

export type Question = {
  difficulty: Difficulty;
  x: number;
  y: number;
  operator: Operator;
  /** The exact computed answer (used for "reveal after repeated wrong tries"). */
  answer: number;
  points: number;
};

/** Aggregated, display-ready stats for a session. */
export type SessionStats = {
  score: number;
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  /** Seconds spent on correct answers, used to derive the average. */
  totalCorrectTime: number;
  lastTime: number | null;
  averageTime: number | null;
};
