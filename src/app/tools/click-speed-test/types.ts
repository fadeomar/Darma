export type ClickTestMode = 5 | 10 | 30 | 60 | "manual";

export type ClickInputMethod = "Mouse" | "Touch" | "Pen" | "Mixed" | "None";

export type ClickSample = {
  time: number;
  source: "mouse" | "touch" | "pen";
};

export type ClickStats = {
  totalClicks: number;
  elapsedSeconds: number;
  clicksPerSecond: number;
  bestBurst: number;
  averageGapMs: number;
  fastestGapMs: number;
  consistencyScore: number;
  inputMethod: ClickInputMethod;
};

export type ClickAttempt = {
  id: string;
  createdAt: string;
  mode: ClickTestMode;
  stats: ClickStats;
};
