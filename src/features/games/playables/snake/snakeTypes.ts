export type SnakeDirection = "up" | "down" | "left" | "right";
export type SnakeMode = "classic" | "wrap" | "maze";
export type SnakeDifficulty = "chill" | "normal" | "fast" | "insane";
export type SnakeStatus = "ready" | "running" | "paused" | "game-over";

export type SnakePoint = {
  x: number;
  y: number;
};

export type SnakeSettings = {
  size: number;
  mode: SnakeMode;
  difficulty: SnakeDifficulty;
  seed?: number;
};

export type SnakeState = {
  settings: SnakeSettings;
  snake: SnakePoint[];
  direction: SnakeDirection;
  queuedDirection: SnakeDirection;
  food: SnakePoint;
  goldenFood: SnakePoint | null;
  obstacles: SnakePoint[];
  score: number;
  apples: number;
  level: number;
  streak: number;
  ticks: number;
  status: SnakeStatus;
  message: string;
};

export type SnakeStats = {
  highScore: number;
  bestApples: number;
  gamesPlayed: number;
  totalApples: number;
};
