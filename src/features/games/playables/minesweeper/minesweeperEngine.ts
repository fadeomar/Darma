import type { MinesweeperCell, MinesweeperConfig, MinesweeperModel, RevealResult } from "./minesweeperTypes";

export const MINESWEEPER_DIFFICULTIES: MinesweeperConfig[] = [
  {
    id: "easy",
    label: "Small",
    subtitle: "9 × 9 · 10 mines · quick classic board",
    rows: 9,
    cols: 9,
    mines: 10,
    targetTime: 90,
  },
  {
    id: "classic",
    label: "Medium",
    subtitle: "10 × 12 · 12 mines · original game balance",
    rows: 12,
    cols: 10,
    mines: 12,
    targetTime: 180,
  },
  {
    id: "expert",
    label: "Large",
    subtitle: "16 × 16 · 40 mines · bigger challenge",
    rows: 16,
    cols: 16,
    mines: 40,
    targetTime: 420,
  },
];

export const DEFAULT_MINESWEEPER_CONFIG = MINESWEEPER_DIFFICULTIES[1];

const DIRECTIONS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;

function createCell(row: number, col: number): MinesweeperCell {
  return {
    id: `${row}-${col}`,
    row,
    col,
    mine: false,
    adjacent: 0,
    revealed: false,
    flagged: false,
    exploded: false,
    wrongFlag: false,
  };
}

export function createMinesweeperModel(config: MinesweeperConfig, phase: MinesweeperModel["phase"] = "start"): MinesweeperModel {
  const board = Array.from({ length: config.rows }, (_, row) =>
    Array.from({ length: config.cols }, (_, col) => createCell(row, col)),
  );

  return {
    board,
    phase,
    minesPlanted: false,
    safeLeft: config.rows * config.cols - config.mines,
    flagsLeft: config.mines,
    moves: 0,
    startedAt: null,
    finishedAt: null,
  };
}

function cloneBoard(board: MinesweeperCell[][]): MinesweeperCell[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function inBounds(config: MinesweeperConfig, row: number, col: number): boolean {
  return row >= 0 && row < config.rows && col >= 0 && col < config.cols;
}

function safeZoneKeys(config: MinesweeperConfig, row: number, col: number): Set<string> {
  const safe = new Set<string>([`${row}-${col}`]);
  for (const [dc, dr] of DIRECTIONS) {
    const nextRow = row + dr;
    const nextCol = col + dc;
    if (inBounds(config, nextRow, nextCol)) safe.add(`${nextRow}-${nextCol}`);
  }
  return safe;
}

function plantMines(board: MinesweeperCell[][], config: MinesweeperConfig, safeRow: number, safeCol: number): MinesweeperCell[][] {
  const next = cloneBoard(board).map((row) =>
    row.map((cell) => ({ ...cell, mine: false, adjacent: 0, exploded: false, wrongFlag: false })),
  );
  const forbidden = safeZoneKeys(config, safeRow, safeCol);
  const candidates: number[] = [];

  for (let row = 0; row < config.rows; row += 1) {
    for (let col = 0; col < config.cols; col += 1) {
      const index = row * config.cols + col;
      if (!forbidden.has(`${row}-${col}`)) candidates.push(index);
    }
  }

  // Fisher-Yates shuffle keeps mine placement O(n) and avoids repeated random retries.
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  for (const index of candidates.slice(0, config.mines)) {
    const row = Math.floor(index / config.cols);
    const col = index % config.cols;
    next[row][col].mine = true;
  }

  for (let row = 0; row < config.rows; row += 1) {
    for (let col = 0; col < config.cols; col += 1) {
      if (next[row][col].mine) continue;
      let adjacent = 0;
      for (const [dc, dr] of DIRECTIONS) {
        const nextRow = row + dr;
        const nextCol = col + dc;
        if (inBounds(config, nextRow, nextCol) && next[nextRow][nextCol].mine) adjacent += 1;
      }
      next[row][col].adjacent = adjacent;
    }
  }

  return next;
}

function revealAllMines(board: MinesweeperCell[][], explodedRow: number, explodedCol: number): MinesweeperCell[][] {
  return board.map((row) =>
    row.map((cell) => {
      if (cell.mine) {
        return { ...cell, revealed: true, flagged: false, exploded: cell.row === explodedRow && cell.col === explodedCol };
      }
      if (cell.flagged) return { ...cell, wrongFlag: true };
      return cell;
    }),
  );
}

function revealWinningMines(board: MinesweeperCell[][]): MinesweeperCell[][] {
  return board.map((row) =>
    row.map((cell) => (cell.mine ? { ...cell, flagged: true, revealed: false } : cell)),
  );
}

export function toggleMinesweeperFlag(model: MinesweeperModel, row: number, col: number): MinesweeperModel {
  if (model.phase !== "playing") return model;
  const cell = model.board[row]?.[col];
  if (!cell || cell.revealed) return model;
  if (!cell.flagged && model.flagsLeft <= 0) return model;

  const board = cloneBoard(model.board);
  board[row][col].flagged = !board[row][col].flagged;

  return {
    ...model,
    board,
    flagsLeft: model.flagsLeft + (board[row][col].flagged ? -1 : 1),
    moves: model.moves + 1,
  };
}

export function revealMinesweeperCell(model: MinesweeperModel, config: MinesweeperConfig, row: number, col: number, now: number): RevealResult {
  if (model.phase !== "playing") return { model, outcome: "ignored", revealedCount: 0 };
  const target = model.board[row]?.[col];
  if (!target || target.revealed || target.flagged) return { model, outcome: "ignored", revealedCount: 0 };

  let board = model.minesPlanted ? cloneBoard(model.board) : plantMines(model.board, config, row, col);
  let safeLeft = model.safeLeft;
  let revealedCount = 0;
  const startedAt = model.startedAt ?? now;

  const firstCell = board[row][col];
  if (firstCell.mine) {
    return {
      model: {
        ...model,
        board: revealAllMines(board, row, col),
        phase: "lost",
        minesPlanted: true,
        moves: model.moves + 1,
        startedAt,
        finishedAt: now,
      },
      outcome: "mine",
      revealedCount: 1,
    };
  }

  const queue: Array<[number, number]> = [[row, col]];
  const visited = new Set<string>();
  let touchedNumber = false;

  for (let pointer = 0; pointer < queue.length; pointer += 1) {
    const [currentRow, currentCol] = queue[pointer];
    if (!inBounds(config, currentRow, currentCol)) continue;
    const key = `${currentRow}-${currentCol}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = board[currentRow][currentCol];
    if (cell.revealed || cell.flagged || cell.mine) continue;

    cell.revealed = true;
    revealedCount += 1;
    safeLeft -= 1;
    if (cell.adjacent > 0) touchedNumber = true;

    if (cell.adjacent !== 0) continue;

    for (const [dc, dr] of DIRECTIONS) {
      const nextRow = currentRow + dr;
      const nextCol = currentCol + dc;
      if (inBounds(config, nextRow, nextCol)) queue.push([nextRow, nextCol]);
    }
  }

  if (safeLeft === 0) {
    board = revealWinningMines(board);
    return {
      model: {
        ...model,
        board,
        safeLeft,
        flagsLeft: 0,
        phase: "won",
        minesPlanted: true,
        moves: model.moves + 1,
        startedAt,
        finishedAt: now,
      },
      outcome: "win",
      revealedCount,
    };
  }

  return {
    model: {
      ...model,
      board,
      safeLeft,
      phase: "playing",
      minesPlanted: true,
      moves: model.moves + 1,
      startedAt,
    },
    outcome: touchedNumber ? "number" : "empty",
    revealedCount,
  };
}

export function countCorrectFlags(model: MinesweeperModel): number {
  return model.board.flat().filter((cell) => cell.flagged && cell.mine).length;
}

export function countRevealedSafeCells(model: MinesweeperModel, config: MinesweeperConfig): number {
  return config.rows * config.cols - config.mines - model.safeLeft;
}

export function computeMinesweeperScore(model: MinesweeperModel, config: MinesweeperConfig, elapsedSeconds: number): number {
  const revealedSafe = countRevealedSafeCells(model, config);
  const flagBonus = countCorrectFlags(model) * 7;
  const movePenalty = Math.max(0, model.moves - revealedSafe) * 2;
  const timePenalty = Math.floor(elapsedSeconds * 0.7);
  const winBonus = model.phase === "won" ? Math.max(100, config.mines * 30 + Math.max(0, config.targetTime - elapsedSeconds) * 3) : 0;

  return Math.max(0, Math.round(revealedSafe * 12 + flagBonus + winBonus - movePenalty - timePenalty));
}

export function formatMinesweeperTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
