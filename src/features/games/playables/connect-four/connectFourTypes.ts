export type ConnectFourPlayer = "red" | "yellow";
export type ConnectFourCell = ConnectFourPlayer | null;
export type ConnectFourBoard = ConnectFourCell[][];
export type ConnectFourMode = "local" | "computer";
export type ConnectFourDifficulty = "casual" | "smart" | "pro";
export type ConnectFourStatus = "ready" | "playing" | "won" | "draw";

export type ConnectFourMove = {
  player: ConnectFourPlayer;
  column: number;
  row: number;
};

export type ConnectFourWinner = {
  winner: ConnectFourPlayer | null;
  line: Array<{ row: number; col: number }>;
  draw: boolean;
};

export type ConnectFourSettings = {
  rows: number;
  cols: number;
  mode: ConnectFourMode;
  difficulty: ConnectFourDifficulty;
};

export type ConnectFourState = {
  board: ConnectFourBoard;
  currentPlayer: ConnectFourPlayer;
  status: ConnectFourStatus;
  winner: ConnectFourPlayer | null;
  winningLine: Array<{ row: number; col: number }>;
  moves: ConnectFourMove[];
  settings: ConnectFourSettings;
  message: string;
};

export type ConnectFourStats = {
  gamesStarted: number;
  gamesCompleted: number;
  redWins: number;
  yellowWins: number;
  computerWins: number;
  draws: number;
  bestWinMoves: number | null;
  hintsUsed: number;
};
