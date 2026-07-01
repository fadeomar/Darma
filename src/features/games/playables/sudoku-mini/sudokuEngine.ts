import type { SudokuConfig, SudokuDifficulty, SudokuGameState, SudokuMove, SudokuPuzzle, SudokuSize } from "./sudokuTypes";

export const SUDOKU_CONFIGS: Record<SudokuSize, SudokuConfig> = {
  4: { size: 4, boxRows: 2, boxCols: 2 },
  6: { size: 6, boxRows: 2, boxCols: 3 },
};

const GIVEN_TARGETS: Record<SudokuSize, Record<SudokuDifficulty, number>> = {
  4: { easy: 10, medium: 8, hard: 7, expert: 6 },
  6: { easy: 24, medium: 20, hard: 17, expert: 14 },
};

export function createRng(seed: string): () => number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function pattern(row: number, col: number, config: SudokuConfig): number {
  return (config.boxCols * (row % config.boxRows) + Math.floor(row / config.boxRows) + col) % config.size;
}

function shuffledBands(size: number, group: number, rng: () => number): number[] {
  const bands = Array.from({ length: size / group }, (_, band) => band);
  return shuffle(bands, rng).flatMap((band) => shuffle(Array.from({ length: group }, (_, offset) => band * group + offset), rng));
}

export function generateSolvedGrid(size: SudokuSize = 6, seed = `${Date.now()}`): number[] {
  const config = SUDOKU_CONFIGS[size];
  const rng = createRng(seed);
  const rows = shuffledBands(size, config.boxRows, rng);
  const cols = shuffledBands(size, config.boxCols, rng);
  const nums = shuffle(Array.from({ length: size }, (_, index) => index + 1), rng);
  const grid: number[] = [];
  for (const row of rows) {
    for (const col of cols) {
      grid.push(nums[pattern(row, col, config)]);
    }
  }
  return grid;
}

export function isSolvedGridValid(grid: number[], size: SudokuSize): boolean {
  const config = SUDOKU_CONFIGS[size];
  if (grid.length !== size * size) return false;
  const target = Array.from({ length: size }, (_, index) => index + 1).join(",");
  const sorted = (values: number[]) => [...values].sort((a, b) => a - b).join(",");
  for (let row = 0; row < size; row += 1) {
    if (sorted(grid.slice(row * size, row * size + size)) !== target) return false;
  }
  for (let col = 0; col < size; col += 1) {
    const values = Array.from({ length: size }, (_, row) => grid[row * size + col]);
    if (sorted(values) !== target) return false;
  }
  for (let boxRow = 0; boxRow < size; boxRow += config.boxRows) {
    for (let boxCol = 0; boxCol < size; boxCol += config.boxCols) {
      const values: number[] = [];
      for (let row = 0; row < config.boxRows; row += 1) {
        for (let col = 0; col < config.boxCols; col += 1) values.push(grid[(boxRow + row) * size + boxCol + col]);
      }
      if (sorted(values) !== target) return false;
    }
  }
  return true;
}

function canPlace(grid: number[], index: number, value: number, size: SudokuSize): boolean {
  const config = SUDOKU_CONFIGS[size];
  const row = Math.floor(index / size);
  const col = index % size;
  for (let c = 0; c < size; c += 1) if (c !== col && grid[row * size + c] === value) return false;
  for (let r = 0; r < size; r += 1) if (r !== row && grid[r * size + col] === value) return false;
  const startRow = Math.floor(row / config.boxRows) * config.boxRows;
  const startCol = Math.floor(col / config.boxCols) * config.boxCols;
  for (let r = 0; r < config.boxRows; r += 1) {
    for (let c = 0; c < config.boxCols; c += 1) {
      const other = (startRow + r) * size + startCol + c;
      if (other !== index && grid[other] === value) return false;
    }
  }
  return true;
}

export function countSolutions(puzzle: number[], size: SudokuSize, limit = 2): number {
  const grid = [...puzzle];
  let count = 0;
  const solve = (): void => {
    if (count >= limit) return;
    let bestIndex = -1;
    let bestCandidates: number[] = [];
    for (let index = 0; index < grid.length; index += 1) {
      if (grid[index] !== 0) continue;
      const candidates = Array.from({ length: size }, (_, value) => value + 1).filter((value) => canPlace(grid, index, value, size));
      if (candidates.length === 0) return;
      if (bestIndex === -1 || candidates.length < bestCandidates.length) {
        bestIndex = index;
        bestCandidates = candidates;
        if (candidates.length === 1) break;
      }
    }
    if (bestIndex === -1) {
      count += 1;
      return;
    }
    for (const candidate of bestCandidates) {
      grid[bestIndex] = candidate;
      solve();
      grid[bestIndex] = 0;
      if (count >= limit) return;
    }
  };
  solve();
  return count;
}

export function generateSudokuPuzzle({ size = 6, difficulty = "medium", seed = `${Date.now()}` }: { size?: SudokuSize; difficulty?: SudokuDifficulty; seed?: string } = {}): SudokuPuzzle {
  const config = SUDOKU_CONFIGS[size];
  const solution = generateSolvedGrid(size, `${seed}:solution`);
  const givens = [...solution];
  const rng = createRng(`${seed}:remove`);
  const target = GIVEN_TARGETS[size][difficulty];
  const cells = shuffle(Array.from({ length: size * size }, (_, index) => index), rng);
  for (const cell of cells) {
    const existing = givens[cell];
    givens[cell] = 0;
    if (givens.filter(Boolean).length < target || countSolutions(givens, size, 2) !== 1) givens[cell] = existing;
  }
  return {
    id: `${size}-${difficulty}-${seed}`,
    size,
    boxRows: config.boxRows,
    boxCols: config.boxCols,
    difficulty,
    givens,
    solution,
    createdAt: new Date().toISOString(),
  };
}

export function createInitialSudokuState(puzzle: SudokuPuzzle, mode: SudokuGameState["mode"] = "classic"): SudokuGameState {
  return {
    puzzle,
    values: [...puzzle.givens],
    notes: Array.from({ length: puzzle.size * puzzle.size }, () => []),
    selected: puzzle.givens.findIndex((value) => value === 0) >= 0 ? puzzle.givens.findIndex((value) => value === 0) : 0,
    noteMode: false,
    mistakes: 0,
    hintsUsed: 0,
    elapsedSeconds: 0,
    phase: "playing",
    mode,
    undoStack: [],
    redoStack: [],
  };
}

export function isGiven(puzzle: SudokuPuzzle, cell: number): boolean {
  return puzzle.givens[cell] !== 0;
}

export function getPeerCells(cell: number, puzzle: SudokuPuzzle): Set<number> {
  const peers = new Set<number>();
  const size = puzzle.size;
  const row = Math.floor(cell / size);
  const col = cell % size;
  for (let c = 0; c < size; c += 1) peers.add(row * size + c);
  for (let r = 0; r < size; r += 1) peers.add(r * size + col);
  const startRow = Math.floor(row / puzzle.boxRows) * puzzle.boxRows;
  const startCol = Math.floor(col / puzzle.boxCols) * puzzle.boxCols;
  for (let r = 0; r < puzzle.boxRows; r += 1) {
    for (let c = 0; c < puzzle.boxCols; c += 1) peers.add((startRow + r) * size + startCol + c);
  }
  peers.delete(cell);
  return peers;
}

export function findConflicts(values: number[], puzzle: SudokuPuzzle, cell: number): number[] {
  const value = values[cell];
  if (!value) return [];
  return [...getPeerCells(cell, puzzle)].filter((peer) => values[peer] === value);
}

export function isPuzzleComplete(state: SudokuGameState): boolean {
  return state.values.every((value, index) => value === state.puzzle.solution[index]);
}

export function enterValue(state: SudokuGameState, cell: number, value: number): SudokuGameState {
  if (state.phase !== "playing" || isGiven(state.puzzle, cell) || value < 1 || value > state.puzzle.size) return state;
  const beforeValue = state.values[cell];
  const beforeNotes = state.notes[cell];
  const values = [...state.values];
  const notes = state.notes.map((item) => [...item]);
  let mistakes = state.mistakes;
  if (state.noteMode) {
    if (state.values[cell] !== 0) return state;
    notes[cell] = notes[cell].includes(value) ? notes[cell].filter((note) => note !== value) : [...notes[cell], value].sort((a, b) => a - b);
  } else {
    values[cell] = value;
    notes[cell] = [];
    if (value !== state.puzzle.solution[cell]) mistakes += 1;
    if (value === state.puzzle.solution[cell]) {
      getPeerCells(cell, state.puzzle).forEach((peer) => {
        notes[peer] = notes[peer].filter((note) => note !== value);
      });
    }
  }
  const move: SudokuMove = { cell, beforeValue, afterValue: values[cell], beforeNotes, afterNotes: notes[cell] };
  const next: SudokuGameState = { ...state, values, notes, mistakes, undoStack: [...state.undoStack, move], redoStack: [] };
  if (isPuzzleComplete(next)) return { ...next, phase: "won" };
  if (next.mode === "mistake-limit" && mistakes >= 3) return { ...next, phase: "lost" };
  return next;
}

export function eraseCell(state: SudokuGameState, cell: number): SudokuGameState {
  if (state.phase !== "playing" || isGiven(state.puzzle, cell)) return state;
  const beforeValue = state.values[cell];
  const beforeNotes = state.notes[cell];
  const values = [...state.values];
  const notes = state.notes.map((item) => [...item]);
  values[cell] = 0;
  notes[cell] = [];
  const move: SudokuMove = { cell, beforeValue, afterValue: 0, beforeNotes, afterNotes: [] };
  return { ...state, values, notes, undoStack: [...state.undoStack, move], redoStack: [] };
}

export function applyHint(state: SudokuGameState): SudokuGameState {
  if (state.phase !== "playing") return state;
  const cell = state.values.findIndex((value, index) => value !== state.puzzle.solution[index]);
  if (cell < 0 || isGiven(state.puzzle, cell)) return state;
  const next = enterValue({ ...state, noteMode: false }, cell, state.puzzle.solution[cell]);
  return { ...next, selected: cell, hintsUsed: state.hintsUsed + 1 };
}

export function undoSudokuMove(state: SudokuGameState): SudokuGameState {
  const move = state.undoStack.at(-1);
  if (!move) return state;
  const values = [...state.values];
  const notes = state.notes.map((item) => [...item]);
  values[move.cell] = move.beforeValue;
  notes[move.cell] = [...move.beforeNotes];
  return { ...state, values, notes, phase: "playing", undoStack: state.undoStack.slice(0, -1), redoStack: [...state.redoStack, move] };
}

export function redoSudokuMove(state: SudokuGameState): SudokuGameState {
  const move = state.redoStack.at(-1);
  if (!move) return state;
  const values = [...state.values];
  const notes = state.notes.map((item) => [...item]);
  values[move.cell] = move.afterValue;
  notes[move.cell] = [...move.afterNotes];
  const next = { ...state, values, notes, undoStack: [...state.undoStack, move], redoStack: state.redoStack.slice(0, -1) };
  return isPuzzleComplete(next) ? { ...next, phase: "won" } : next;
}

export function formatSudokuTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60).toString().padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}
