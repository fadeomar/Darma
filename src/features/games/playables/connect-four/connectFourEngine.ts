import type {
  ConnectFourBoard,
  ConnectFourCell,
  ConnectFourDifficulty,
  ConnectFourMove,
  ConnectFourPlayer,
  ConnectFourSettings,
  ConnectFourState,
  ConnectFourWinner,
} from "./connectFourTypes";

export const DEFAULT_CONNECT_FOUR_SETTINGS: ConnectFourSettings = {
  rows: 6,
  cols: 7,
  mode: "computer",
  difficulty: "smart",
};

export const CONNECT_FOUR_DIRECTIONS = [
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: -1 },
] as const;

export function otherPlayer(player: ConnectFourPlayer): ConnectFourPlayer {
  return player === "red" ? "yellow" : "red";
}

export function createConnectFourBoard(rows = 6, cols = 7): ConnectFourBoard {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null as ConnectFourCell));
}

export function cloneConnectFourBoard(board: ConnectFourBoard): ConnectFourBoard {
  return board.map((row) => [...row]);
}

export function createInitialConnectFourState(settings: Partial<ConnectFourSettings> = {}): ConnectFourState {
  const nextSettings = { ...DEFAULT_CONNECT_FOUR_SETTINGS, ...settings };
  return {
    board: createConnectFourBoard(nextSettings.rows, nextSettings.cols),
    currentPlayer: "red",
    status: "ready",
    winner: null,
    winningLine: [],
    moves: [],
    settings: nextSettings,
    message: "Red opens. Drop a disc into any column.",
  };
}

export function canDropInColumn(board: ConnectFourBoard, column: number): boolean {
  return column >= 0 && column < (board[0]?.length ?? 0) && board[0]?.[column] === null;
}

export function getValidColumns(board: ConnectFourBoard): number[] {
  return board[0]?.map((_, index) => index).filter((column) => canDropInColumn(board, column)) ?? [];
}

export function dropDisc(board: ConnectFourBoard, column: number, player: ConnectFourPlayer): { board: ConnectFourBoard; row: number; column: number } | null {
  if (!canDropInColumn(board, column)) return null;
  const nextBoard = cloneConnectFourBoard(board);
  for (let row = nextBoard.length - 1; row >= 0; row -= 1) {
    if (nextBoard[row][column] === null) {
      nextBoard[row][column] = player;
      return { board: nextBoard, row, column };
    }
  }
  return null;
}

export function findConnectFourWinner(board: ConnectFourBoard): ConnectFourWinner {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const player = board[row][col];
      if (!player) continue;
      for (const direction of CONNECT_FOUR_DIRECTIONS) {
        const line = Array.from({ length: 4 }, (_, index) => ({ row: row + direction.row * index, col: col + direction.col * index }));
        if (line.every((point) => point.row >= 0 && point.row < rows && point.col >= 0 && point.col < cols && board[point.row][point.col] === player)) {
          return { winner: player, line, draw: false };
        }
      }
    }
  }

  return { winner: null, line: [], draw: getValidColumns(board).length === 0 };
}

export function playConnectFourMove(state: ConnectFourState, column: number): ConnectFourState {
  if (state.status === "won" || state.status === "draw") return state;
  const result = dropDisc(state.board, column, state.currentPlayer);
  if (!result) {
    return { ...state, message: "That column is full. Choose a column with space." };
  }

  const outcome = findConnectFourWinner(result.board);
  const move: ConnectFourMove = { player: state.currentPlayer, column, row: result.row };

  if (outcome.winner) {
    return {
      ...state,
      board: result.board,
      moves: [...state.moves, move],
      status: "won",
      winner: outcome.winner,
      winningLine: outcome.line,
      message: `${outcome.winner === "red" ? "Red" : "Yellow"} connects four!`,
    };
  }

  if (outcome.draw) {
    return {
      ...state,
      board: result.board,
      moves: [...state.moves, move],
      status: "draw",
      winner: null,
      winningLine: [],
      message: "Board full. Great defensive game — it is a draw.",
    };
  }

  const nextPlayer = otherPlayer(state.currentPlayer);
  return {
    ...state,
    board: result.board,
    moves: [...state.moves, move],
    currentPlayer: nextPlayer,
    status: "playing",
    winner: null,
    winningLine: [],
    message: `${nextPlayer === "red" ? "Red" : "Yellow"} to move.`,
  };
}

export function undoConnectFourMove(state: ConnectFourState): ConnectFourState {
  if (state.moves.length === 0) return state;
  const movesToKeep = state.settings.mode === "computer" && state.moves.length >= 2 ? state.moves.slice(0, -2) : state.moves.slice(0, -1);
  let nextState = createInitialConnectFourState(state.settings);
  for (const move of movesToKeep) {
    nextState = playConnectFourMove(nextState, move.column);
  }
  return {
    ...nextState,
    status: movesToKeep.length === 0 ? "ready" : "playing",
    message: "Move undone. Find a stronger column.",
  };
}

function evaluateWindow(cells: ConnectFourCell[], player: ConnectFourPlayer): number {
  const opponent = otherPlayer(player);
  const playerCount = cells.filter((cell) => cell === player).length;
  const opponentCount = cells.filter((cell) => cell === opponent).length;
  const emptyCount = cells.filter((cell) => cell === null).length;

  if (playerCount === 4) return 100000;
  if (playerCount === 3 && emptyCount === 1) return 120;
  if (playerCount === 2 && emptyCount === 2) return 18;
  if (playerCount === 1 && emptyCount === 3) return 3;
  if (opponentCount === 3 && emptyCount === 1) return -140;
  if (opponentCount === 2 && emptyCount === 2) return -14;
  return 0;
}

export function scoreConnectFourPosition(board: ConnectFourBoard, player: ConnectFourPlayer): number {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const centerCol = Math.floor(cols / 2);
  let score = board.map((row) => row[centerCol]).filter((cell) => cell === player).length * 8;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      for (const direction of CONNECT_FOUR_DIRECTIONS) {
        const points = Array.from({ length: 4 }, (_, index) => ({ row: row + direction.row * index, col: col + direction.col * index }));
        if (points.every((point) => point.row >= 0 && point.row < rows && point.col >= 0 && point.col < cols)) {
          score += evaluateWindow(points.map((point) => board[point.row][point.col]), player);
        }
      }
    }
  }

  return score;
}

export function findImmediateWinningColumn(board: ConnectFourBoard, player: ConnectFourPlayer): number | null {
  for (const column of getValidColumns(board)) {
    const result = dropDisc(board, column, player);
    if (result && findConnectFourWinner(result.board).winner === player) return column;
  }
  return null;
}

export function getConnectFourThreatColumns(board: ConnectFourBoard, player: ConnectFourPlayer): number[] {
  return getValidColumns(board).filter((column) => {
    const result = dropDisc(board, column, player);
    return Boolean(result && findConnectFourWinner(result.board).winner === player);
  });
}

function orderColumnsByCenter(columns: number[], totalCols: number): number[] {
  const center = (totalCols - 1) / 2;
  return [...columns].sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
}

function minimax(board: ConnectFourBoard, depth: number, player: ConnectFourPlayer, maximizingPlayer: ConnectFourPlayer, alpha: number, beta: number): number {
  const outcome = findConnectFourWinner(board);
  if (outcome.winner === maximizingPlayer) return 1000000 + depth;
  if (outcome.winner === otherPlayer(maximizingPlayer)) return -1000000 - depth;
  if (outcome.draw || depth === 0) return scoreConnectFourPosition(board, maximizingPlayer);

  const validColumns = orderColumnsByCenter(getValidColumns(board), board[0]?.length ?? 0);

  if (player === maximizingPlayer) {
    let value = Number.NEGATIVE_INFINITY;
    for (const column of validColumns) {
      const result = dropDisc(board, column, player);
      if (!result) continue;
      value = Math.max(value, minimax(result.board, depth - 1, otherPlayer(player), maximizingPlayer, alpha, beta));
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  }

  let value = Number.POSITIVE_INFINITY;
  for (const column of validColumns) {
    const result = dropDisc(board, column, player);
    if (!result) continue;
    value = Math.min(value, minimax(result.board, depth - 1, otherPlayer(player), maximizingPlayer, alpha, beta));
    beta = Math.min(beta, value);
    if (alpha >= beta) break;
  }
  return value;
}

export function chooseConnectFourAiMove(board: ConnectFourBoard, player: ConnectFourPlayer, difficulty: ConnectFourDifficulty): number | null {
  const validColumns = getValidColumns(board);
  if (validColumns.length === 0) return null;

  const winningMove = findImmediateWinningColumn(board, player);
  if (winningMove !== null) return winningMove;

  const blockingMove = findImmediateWinningColumn(board, otherPlayer(player));
  if (blockingMove !== null && difficulty !== "casual") return blockingMove;

  if (difficulty === "casual") {
    const ordered = orderColumnsByCenter(validColumns, board[0]?.length ?? 0);
    return ordered[Math.floor(Math.random() * Math.min(3, ordered.length))] ?? validColumns[0];
  }

  const depth = difficulty === "pro" ? 5 : 3;
  let bestColumn = orderColumnsByCenter(validColumns, board[0]?.length ?? 0)[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const column of orderColumnsByCenter(validColumns, board[0]?.length ?? 0)) {
    const result = dropDisc(board, column, player);
    if (!result) continue;
    const score = minimax(result.board, depth - 1, otherPlayer(player), player, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
    if (score > bestScore) {
      bestScore = score;
      bestColumn = column;
    }
  }

  return bestColumn;
}
