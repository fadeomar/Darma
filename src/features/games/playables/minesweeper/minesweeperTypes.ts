export type MinesweeperPhase = "start" | "playing" | "won" | "lost";

export type MinesweeperDifficultyId = "easy" | "classic" | "expert";

export type MinesweeperConfig = {
  id: MinesweeperDifficultyId;
  label: string;
  subtitle: string;
  rows: number;
  cols: number;
  mines: number;
  targetTime: number;
};

export type MinesweeperCell = {
  id: string;
  row: number;
  col: number;
  mine: boolean;
  adjacent: number;
  revealed: boolean;
  flagged: boolean;
  exploded: boolean;
  wrongFlag: boolean;
};

export type MinesweeperModel = {
  board: MinesweeperCell[][];
  phase: MinesweeperPhase;
  minesPlanted: boolean;
  safeLeft: number;
  flagsLeft: number;
  moves: number;
  startedAt: number | null;
  finishedAt: number | null;
};

export type RevealOutcome = "ignored" | "empty" | "number" | "mine" | "win";

export type RevealResult = {
  model: MinesweeperModel;
  outcome: RevealOutcome;
  revealedCount: number;
};
