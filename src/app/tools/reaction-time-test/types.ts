export type ReactionTestMode = 1 | 3 | 5 | 10;

export type ReactionDelayProfile = "quick" | "standard" | "focus";

export type ReactionInputMethod =
  "Keyboard" | "Mouse" | "Touch" | "Pen" | "Mixed" | "None";

export type ReactionSampleSource = "keyboard" | "mouse" | "touch" | "pen";

export type ReactionSample = {
  round: number;
  reactionMs: number;
  source: ReactionSampleSource;
  waitMs: number;
};

export type ReactionStats = {
  roundsCompleted: number;
  totalRounds: number;
  averageReactionMs: number;
  medianReactionMs: number;
  bestReactionMs: number;
  slowestReactionMs: number;
  spreadReactionMs: number;
  consistencyScore: number;
  falseStarts: number;
  inputMethod: ReactionInputMethod;
};

export type ReactionAttempt = {
  id: string;
  createdAt: string;
  mode: ReactionTestMode;
  delayProfile: ReactionDelayProfile;
  stats: ReactionStats;
  samples: ReactionSample[];
};
