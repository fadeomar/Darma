import type { TicCell, TicDifficulty, TicMark, TicSettings, TicState, TicWinner } from "./ticTacToeTypes";

export const DEFAULT_TIC_SETTINGS: TicSettings = {
  size: 3,
  winLength: 3,
  mode: "ai",
  difficulty: "smart",
};

export function createInitialTicState(settings: Partial<TicSettings> = {}): TicState {
  const merged = { ...DEFAULT_TIC_SETTINGS, ...settings };
  const winLength = merged.size === 4 ? 4 : 3;
  return {
    board: Array.from({ length: merged.size * merged.size }, () => null),
    current: "X",
    status: "playing",
    winner: null,
    settings: { ...merged, winLength },
    moves: 0,
  };
}

export function otherMark(mark: TicMark): TicMark {
  return mark === "X" ? "O" : "X";
}

export function indexToRowCol(index: number, size: number): { row: number; col: number } {
  return { row: Math.floor(index / size), col: index % size };
}

export function rowColToIndex(row: number, col: number, size: number): number {
  return row * size + col;
}

export function getWinningLines(size: number, winLength: number): number[][] {
  const lines: number[][] = [];
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 },
  ];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      directions.forEach(({ dr, dc }) => {
        const endRow = row + (winLength - 1) * dr;
        const endCol = col + (winLength - 1) * dc;
        if (endRow < 0 || endCol < 0 || endRow >= size || endCol >= size) return;
        lines.push(Array.from({ length: winLength }, (_, step) => rowColToIndex(row + step * dr, col + step * dc, size)));
      });
    }
  }

  return lines;
}

export function detectWinner(board: TicCell[], size: number, winLength: number): TicWinner | null {
  for (const line of getWinningLines(size, winLength)) {
    const first = board[line[0]];
    if (first && line.every((index) => board[index] === first)) return { mark: first, line };
  }
  return null;
}

export function availableMoves(board: TicCell[]): number[] {
  return board.map((cell, index) => (cell ? -1 : index)).filter((index) => index >= 0);
}

export function applyMove(state: TicState, index: number): TicState {
  if (state.status !== "playing" || state.board[index]) return state;
  const board = [...state.board];
  board[index] = state.current;
  const winner = detectWinner(board, state.settings.size, state.settings.winLength);
  const moves = state.moves + 1;
  const status = winner ? "won" : moves === board.length ? "draw" : "playing";
  return {
    ...state,
    board,
    winner,
    moves,
    status,
    current: status === "playing" ? otherMark(state.current) : state.current,
  };
}

function scoreBoard(board: TicCell[], settings: TicSettings, aiMark: TicMark): number {
  const winner = detectWinner(board, settings.size, settings.winLength);
  if (winner) return winner.mark === aiMark ? 100 : -100;
  return 0;
}

function minimax(board: TicCell[], settings: TicSettings, current: TicMark, aiMark: TicMark, depth: number, alpha: number, beta: number): number {
  const terminal = scoreBoard(board, settings, aiMark);
  if (terminal !== 0) return terminal - depth;
  const moves = availableMoves(board);
  if (!moves.length) return 0;

  if (current === aiMark) {
    let best = -Infinity;
    for (const move of moves) {
      board[move] = current;
      best = Math.max(best, minimax(board, settings, otherMark(current), aiMark, depth + 1, alpha, beta));
      board[move] = null;
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    board[move] = current;
    best = Math.min(best, minimax(board, settings, otherMark(current), aiMark, depth + 1, alpha, beta));
    board[move] = null;
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

function findWinningMove(board: TicCell[], settings: TicSettings, mark: TicMark): number | null {
  for (const move of availableMoves(board)) {
    const next = [...board];
    next[move] = mark;
    if (detectWinner(next, settings.size, settings.winLength)?.mark === mark) return move;
  }
  return null;
}

function linePotential(board: TicCell[], settings: TicSettings, index: number, mark: TicMark): number {
  const lines = getWinningLines(settings.size, settings.winLength).filter((line) => line.includes(index));
  return lines.reduce((score, line) => {
    const marks = line.filter((cell) => board[cell] === mark).length;
    const enemy = line.filter((cell) => board[cell] === otherMark(mark)).length;
    if (enemy > 0) return score;
    return score + marks * marks + 1;
  }, 0);
}

export function getAiMove(board: TicCell[], settings: TicSettings, aiMark: TicMark = "O", difficulty: TicDifficulty = settings.difficulty): number | null {
  const moves = availableMoves(board);
  if (!moves.length) return null;

  if (difficulty === "casual") {
    const center = Math.floor(board.length / 2);
    if (!board[center]) return center;
    return moves[0];
  }

  const win = findWinningMove(board, settings, aiMark);
  if (win !== null) return win;
  const block = findWinningMove(board, settings, otherMark(aiMark));
  if (block !== null) return block;

  if (settings.size === 3 && difficulty === "unbeatable") {
    let bestMove = moves[0];
    let bestScore = -Infinity;
    for (const move of moves) {
      const next = [...board];
      next[move] = aiMark;
      const score = minimax(next, settings, otherMark(aiMark), aiMark, 0, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  const preferred = moves
    .map((move) => ({ move, score: linePotential(board, settings, move, aiMark) + linePotential(board, settings, move, otherMark(aiMark)) * 0.8 }))
    .sort((a, b) => b.score - a.score);
  return preferred[0]?.move ?? moves[0];
}

export function boardToText(board: TicCell[], size: number): string {
  return Array.from({ length: size }, (_, row) => board.slice(row * size, row * size + size).map((cell) => cell ?? "·").join(" ")).join("\n");
}
