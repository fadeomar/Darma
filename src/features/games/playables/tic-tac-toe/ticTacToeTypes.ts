export type TicMark = "X" | "O";
export type TicCell = TicMark | null;
export type TicMode = "ai" | "local";
export type TicDifficulty = "casual" | "smart" | "unbeatable";
export type TicStatus = "playing" | "won" | "draw";

export type TicSettings = {
  size: 3 | 4;
  winLength: 3 | 4;
  mode: TicMode;
  difficulty: TicDifficulty;
};

export type TicWinner = {
  mark: TicMark;
  line: number[];
};

export type TicState = {
  board: TicCell[];
  current: TicMark;
  status: TicStatus;
  winner: TicWinner | null;
  settings: TicSettings;
  moves: number;
};

export type TicStats = {
  xWins: number;
  oWins: number;
  draws: number;
  gamesPlayed: number;
  currentStreak: number;
  bestStreak: number;
};
