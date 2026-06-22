export type ScrollTestMode = 5 | 10 | 30 | 60 | "manual";

export type ScrollDirection = "Down" | "Up" | "Right" | "Left" | "Mixed" | "None";

export type ScrollInputMethod = "Wheel" | "Touch" | "Mixed" | "None";

export type ScrollSample = {
  time: number;
  dx: number;
  dy: number;
  source: "wheel" | "touch";
};

export type ScrollStats = {
  totalDistance: number;
  netVertical: number;
  netHorizontal: number;
  eventsCount: number;
  elapsedSeconds: number;
  pixelsPerSecond: number;
  eventsPerSecond: number;
  bestBurst: number;
  smoothnessScore: number;
  direction: ScrollDirection;
  inputMethod: ScrollInputMethod;
};

export type ScrollAttempt = {
  id: string;
  createdAt: string;
  mode: ScrollTestMode;
  stats: ScrollStats;
};
