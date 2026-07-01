export type MemoryTheme = "icons" | "animals" | "food" | "sports";
export type MemoryDifficulty = "easy" | "medium" | "hard" | "expert";
export type MemoryStatus = "ready" | "preview" | "playing" | "won";

export type MemoryCard = {
  id: string;
  pairId: string;
  symbol: string;
  matched: boolean;
  flipped: boolean;
};

export type MemorySettings = {
  difficulty: MemoryDifficulty;
  theme: MemoryTheme;
  previewSeconds: number;
};

export type MemoryState = {
  cards: MemoryCard[];
  openIds: string[];
  moves: number;
  matches: number;
  streak: number;
  bestStreak: number;
  mistakes: number;
  hintsUsed: number;
  status: MemoryStatus;
  startedAt: number | null;
  finishedAt: number | null;
  settings: MemorySettings;
  message: string;
};

export type MemoryStats = {
  gamesStarted: number;
  gamesCompleted: number;
  bestMoves: Partial<Record<MemoryDifficulty, number>>;
  bestSeconds: Partial<Record<MemoryDifficulty, number>>;
  perfectGames: number;
  totalMatches: number;
  hintsUsed: number;
};
