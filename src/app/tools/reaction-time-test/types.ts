export type ReactionTestMode = 1 | 3 | 5 | 10;

export type ReactionInputMethod = "Keyboard" | "Mouse" | "Touch" | "Pen" | "Mixed" | "None";

export type ReactionSample = {
  round: number;
  reactionMs: number;
  source: "keyboard" | "mouse" | "touch" | "pen";
};

export type ReactionStats = {
  roundsCompleted: number;
  totalRounds: number;
  averageReactionMs: number;
  bestReactionMs: number;
  slowestReactionMs: number;
  consistencyScore: number;
  falseStarts: number;
  inputMethod: ReactionInputMethod;
};

export type ReactionAttempt = {
  id: string;
  createdAt: string;
  mode: ReactionTestMode;
  stats: ReactionStats;
};
