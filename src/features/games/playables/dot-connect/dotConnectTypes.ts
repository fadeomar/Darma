export type DotColor = "coral" | "blue" | "gold" | "mint";

export type DotCoordinate = {
  row: number;
  column: number;
};

export type DotBoard = DotColor[][];

export type DotConnectMode = "computer" | "local";
export type DotConnectDifficulty = "relaxed" | "balanced" | "sharp";
export type DotConnectPlayer = "one" | "two";
export type DotConnectPhase =
  | "idle"
  | "selecting"
  | "resolving"
  | "ai-turn"
  | "game-over";

export type DotConnectScores = Record<DotConnectPlayer, number>;
