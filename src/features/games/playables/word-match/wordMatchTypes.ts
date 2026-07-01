export type WordMatchCategory = "synonyms" | "opposites" | "categories" | "english-arabic" | "mixed";
export type WordMatchDifficulty = "easy" | "medium" | "hard" | "expert";
export type WordMatchStatus = "ready" | "playing" | "won";

export type WordPair = {
  id: string;
  category: Exclude<WordMatchCategory, "mixed">;
  left: string;
  right: string;
  hint: string;
};

export type WordMatchCard = {
  id: string;
  pairId: string;
  text: string;
  side: "left" | "right";
  matched: boolean;
};

export type WordMatchRound = {
  id: string;
  category: WordMatchCategory;
  difficulty: WordMatchDifficulty;
  leftCards: WordMatchCard[];
  rightCards: WordMatchCard[];
  startedAt: number | null;
  elapsedSeconds: number;
  score: number;
  streak: number;
  bestStreak: number;
  mistakes: number;
  hintsUsed: number;
  selectedLeftId: string | null;
  selectedRightId: string | null;
  status: WordMatchStatus;
  missedPairs: string[];
  lastFeedback: string;
};

export type WordMatchStats = {
  roundsCompleted: number;
  bestScore: number;
  bestStreak: number;
  perfectRounds: number;
  hintsUsed: number;
};
