export type TypingMode = "quick" | "practice" | "accuracy" | "challenge";
export type TypingDuration = 15 | 30 | 60 | 120;
export type TypingDifficulty = "beginner" | "normal" | "pro";

export type TypingPrompt = {
  id: string;
  text: string;
  difficulty: TypingDifficulty;
  topic: string;
};

export type TypingSettings = {
  mode: TypingMode;
  duration: TypingDuration;
  difficulty: TypingDifficulty;
};

export type TypingMetrics = {
  elapsedMs: number;
  elapsedSeconds: number;
  typedChars: number;
  correctChars: number;
  incorrectChars: number;
  accuracy: number;
  wpm: number;
  rawWpm: number;
  progress: number;
  completed: boolean;
  mostMissed: Array<{ expected: string; typed: string; count: number }>;
};

export type TypingHistoryEntry = TypingMetrics & {
  id: string;
  promptId: string;
  mode: TypingMode;
  duration: TypingDuration;
  difficulty: TypingDifficulty;
  createdAt: string;
};

export type TypingStats = {
  bestWpm: number;
  bestAccuracy: number;
  testsCompleted: number;
  history: TypingHistoryEntry[];
};
