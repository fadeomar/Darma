export type SudokuSize = 4 | 6;
export type SudokuDifficulty = "easy" | "medium" | "hard" | "expert";
export type SudokuMode = "classic" | "zen" | "mistake-limit";
export type SudokuPhase = "playing" | "paused" | "won" | "lost";

export type SudokuConfig = {
  size: SudokuSize;
  boxRows: number;
  boxCols: number;
};

export type SudokuPuzzle = {
  id: string;
  size: SudokuSize;
  boxRows: number;
  boxCols: number;
  difficulty: SudokuDifficulty;
  givens: number[];
  solution: number[];
  createdAt: string;
};

export type SudokuMove = {
  cell: number;
  beforeValue: number;
  afterValue: number;
  beforeNotes: number[];
  afterNotes: number[];
};

export type SudokuGameState = {
  puzzle: SudokuPuzzle;
  values: number[];
  notes: number[][];
  selected: number;
  noteMode: boolean;
  mistakes: number;
  hintsUsed: number;
  elapsedSeconds: number;
  phase: SudokuPhase;
  mode: SudokuMode;
  undoStack: SudokuMove[];
  redoStack: SudokuMove[];
};

export type SudokuStats = {
  gamesStarted: number;
  gamesCompleted: number;
  totalMistakes: number;
  hintsUsed: number;
  bestTimes: Partial<Record<`${SudokuSize}-${SudokuDifficulty}`, number>>;
};
