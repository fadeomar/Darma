export type SpacebarTestMode = 5 | 10 | 30 | 60 | "manual";

export type SpacebarInputMethod = "Keyboard" | "Touch" | "Mouse" | "Mixed" | "None";

export type SpacebarSample = {
  time: number;
  source: "keyboard" | "touch" | "mouse";
};

export type SpacebarStats = {
  totalPresses: number;
  elapsedSeconds: number;
  pressesPerSecond: number;
  bestBurst: number;
  averageGapMs: number;
  fastestGapMs: number;
  consistencyScore: number;
  ignoredRepeats: number;
  inputMethod: SpacebarInputMethod;
};

export type SpacebarAttempt = {
  id: string;
  createdAt: string;
  mode: SpacebarTestMode;
  stats: SpacebarStats;
};
