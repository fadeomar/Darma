import { findSquare } from "./chessBoard";
import { getLegalMoves, getNextTurn, getStatusForTurn, isKingInCheck, moveChessPiece } from "./chessEngine";
import type { ChessBoard, ChessColor, ChessCoord, ChessMoveRecord, ChessMoveTarget, ChessPiece, ChessPromotionRole } from "./chessTypes";

export type ChessAiDifficulty = "beginner" | "intermediate" | "pro";

export type ChessAiMove = {
  from: ChessCoord;
  to: ChessCoord;
  move: ChessMoveTarget;
  promotion?: ChessPromotionRole;
  score: number;
};

type CandidateMove = {
  from: ChessCoord;
  move: ChessMoveTarget;
  piece: ChessPiece;
};

type RankedCandidate = {
  candidate: CandidateMove;
  quickScore: number;
};

type SearchContext = {
  lastMove?: ChessMoveRecord | null;
};

type SearchBudget = {
  deadlineMs: number;
  remainingNodes: number;
};

const PIECE_VALUES: Record<ChessPiece["role"], number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 0,
};

const CENTER_BONUS: Partial<Record<ChessCoord, number>> = {
  D4: 24,
  E4: 24,
  D5: 24,
  E5: 24,
  C3: 10,
  D3: 12,
  E3: 12,
  F3: 10,
  C4: 14,
  F4: 14,
  C5: 14,
  F5: 14,
  C6: 10,
  D6: 12,
  E6: 12,
  F6: 10,
};

const DEVELOPMENT_FILES = new Set(["B", "C", "F", "G"]);

function nowMs(): number {
  return Date.now();
}

function getCandidates(board: ChessBoard, color: ChessColor, context: SearchContext = {}): CandidateMove[] {
  return board.flatMap((row) =>
    row.flatMap((square) => {
      if (square.piece?.color !== color) return [];
      return getLegalMoves(board, square.coord, context).map((move) => ({ from: square.coord, move, piece: square.piece! }));
    }),
  );
}

function getCaptureValue(board: ChessBoard, candidate: CandidateMove): number {
  if (!candidate.move.capture) return 0;

  if (candidate.move.special === "en-passant") return PIECE_VALUES.pawn;

  const captured = findSquare(board, candidate.move.coord)?.piece;
  return captured ? PIECE_VALUES[captured.role] : 0;
}

function getDevelopmentBonus(candidate: CandidateMove): number {
  if (candidate.piece.hasMoved) return 0;
  if (candidate.piece.role !== "knight" && candidate.piece.role !== "bishop") return 0;
  return DEVELOPMENT_FILES.has(candidate.from[0]) ? 18 : 0;
}

function evaluateMaterial(board: ChessBoard, color: ChessColor): number {
  let score = 0;

  for (const square of board.flat()) {
    const piece = square.piece;
    if (!piece) continue;
    const direction = piece.color === color ? 1 : -1;
    score += direction * PIECE_VALUES[piece.role];
    score += direction * (CENTER_BONUS[square.coord] ?? 0);

    if (piece.role === "pawn") {
      const rank = Number(square.coord[1]);
      const progress = piece.color === "white" ? rank - 2 : 7 - rank;
      score += direction * Math.max(0, progress) * 5;
    }
  }

  const enemy = getNextTurn(color);
  if (isKingInCheck(board, enemy)) score += 36;
  if (isKingInCheck(board, color)) score -= 48;

  return score;
}

function applyCandidate(board: ChessBoard, color: ChessColor, candidate: CandidateMove, context: SearchContext = {}) {
  return moveChessPiece(board, candidate.from, candidate.move.coord, color, context);
}

function scoreCandidate(board: ChessBoard, color: ChessColor, candidate: CandidateMove, context: SearchContext = {}): number {
  const result = applyCandidate(board, color, candidate, context);
  if (!result) return Number.NEGATIVE_INFINITY;
  if (result.status === "checkmate") return 100_000;

  const nextTurn = getNextTurn(color);
  const boardAfterMove = result.board;
  const statusForOpponent = getStatusForTurn(boardAfterMove, nextTurn, { lastMove: result.record });
  const promotionBonus = candidate.move.promotion ? PIECE_VALUES.queen - PIECE_VALUES.pawn : 0;
  const castlingBonus = candidate.move.special === "castle-kingside" || candidate.move.special === "castle-queenside" ? 44 : 0;
  const checkBonus = statusForOpponent === "check" ? 42 : 0;
  const centerBonus = CENTER_BONUS[candidate.move.coord] ?? 0;

  return (
    evaluateMaterial(boardAfterMove, color) +
    getCaptureValue(board, candidate) * 5 +
    promotionBonus +
    castlingBonus +
    checkBonus +
    centerBonus +
    getDevelopmentBonus(candidate)
  );
}

function deterministicNoise(candidate: CandidateMove, color: ChessColor): number {
  const seed = `${candidate.from}${candidate.move.coord}${candidate.piece.role}${color}`;
  return seed.split("").reduce((total, character) => total + character.charCodeAt(0), 0) % 17;
}

function getSearchDepth(difficulty: ChessAiDifficulty): number {
  if (difficulty === "pro") return 1;
  return 0;
}

function getSearchBudgetMs(difficulty: ChessAiDifficulty): number {
  if (difficulty === "pro") return 55;
  if (difficulty === "intermediate") return 24;
  return 0;
}

function getSearchCandidateLimit(difficulty: ChessAiDifficulty): number {
  if (difficulty === "pro") return 10;
  if (difficulty === "intermediate") return 8;
  return 0;
}

function sortCandidatesForSearch(board: ChessBoard, candidates: CandidateMove[]): CandidateMove[] {
  return [...candidates].sort((a, b) => {
    const captureDelta = getCaptureValue(board, b) - getCaptureValue(board, a);
    if (captureDelta !== 0) return captureDelta;
    const centerDelta = (CENTER_BONUS[b.move.coord] ?? 0) - (CENTER_BONUS[a.move.coord] ?? 0);
    if (centerDelta !== 0) return centerDelta;
    return `${a.from}${a.move.coord}`.localeCompare(`${b.from}${b.move.coord}`);
  });
}

function minimax(
  board: ChessBoard,
  colorToMove: ChessColor,
  aiColor: ChessColor,
  depth: number,
  context: SearchContext,
  alpha: number,
  beta: number,
  budget: SearchBudget,
): number {
  if (nowMs() > budget.deadlineMs || budget.remainingNodes <= 0) return evaluateMaterial(board, aiColor);
  budget.remainingNodes -= 1;

  const status = getStatusForTurn(board, colorToMove, context);
  if (status === "checkmate") return colorToMove === aiColor ? -100_000 - depth : 100_000 + depth;
  if (status === "stalemate") return 0;
  if (depth === 0) return evaluateMaterial(board, aiColor);

  const candidates = sortCandidatesForSearch(board, getCandidates(board, colorToMove, context)).slice(0, 12);
  if (candidates.length === 0) return evaluateMaterial(board, aiColor);

  if (colorToMove === aiColor) {
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const candidate of candidates) {
      if (nowMs() > budget.deadlineMs || budget.remainingNodes <= 0) break;
      const result = applyCandidate(board, colorToMove, candidate, context);
      if (!result) continue;
      const score = minimax(result.board, getNextTurn(colorToMove), aiColor, depth - 1, { lastMove: result.record }, alpha, beta, budget);
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return bestScore === Number.NEGATIVE_INFINITY ? evaluateMaterial(board, aiColor) : bestScore;
  }

  let bestScore = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    if (nowMs() > budget.deadlineMs || budget.remainingNodes <= 0) break;
    const result = applyCandidate(board, colorToMove, candidate, context);
    if (!result) continue;
    const score = minimax(result.board, getNextTurn(colorToMove), aiColor, depth - 1, { lastMove: result.record }, alpha, beta, budget);
    bestScore = Math.min(bestScore, score);
    beta = Math.min(beta, score);
    if (beta <= alpha) break;
  }
  return bestScore === Number.POSITIVE_INFINITY ? evaluateMaterial(board, aiColor) : bestScore;
}

function toAiMove(candidate: CandidateMove, score: number): ChessAiMove {
  return {
    from: candidate.from,
    to: candidate.move.coord,
    move: candidate.move,
    promotion: candidate.move.promotion ? "queen" : undefined,
    score,
  };
}

export function chooseComputerMove(
  board: ChessBoard,
  color: ChessColor,
  difficulty: ChessAiDifficulty,
  context: SearchContext = {},
): ChessAiMove | null {
  const candidates = getCandidates(board, color, context);
  if (candidates.length === 0) return null;

  const ranked: RankedCandidate[] = candidates.map((candidate) => {
    const noise = difficulty === "beginner" ? deterministicNoise(candidate, color) * 10 : deterministicNoise(candidate, color) * 0.2;
    return { candidate, quickScore: scoreCandidate(board, color, candidate, context) + noise };
  });

  ranked.sort((a, b) => b.quickScore - a.quickScore || `${a.candidate.from}${a.candidate.move.coord}`.localeCompare(`${b.candidate.from}${b.candidate.move.coord}`));

  if (difficulty === "beginner") {
    const beginnerPool = ranked.slice(0, Math.min(6, ranked.length));
    const selected = beginnerPool[deterministicNoise(beginnerPool[0].candidate, color) % beginnerPool.length] ?? ranked[0];
    return toAiMove(selected.candidate, selected.quickScore);
  }

  const depth = getSearchDepth(difficulty);
  const contenders = ranked.slice(0, Math.min(getSearchCandidateLimit(difficulty), ranked.length));
  const budget: SearchBudget = {
    deadlineMs: nowMs() + getSearchBudgetMs(difficulty),
    remainingNodes: difficulty === "pro" ? 260 : 100,
  };

  let best = contenders[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const contender of contenders) {
    if (nowMs() > budget.deadlineMs || budget.remainingNodes <= 0) break;

    const result = applyCandidate(board, color, contender.candidate, context);
    if (!result) continue;

    const searchScore =
      depth > 0
        ? minimax(result.board, getNextTurn(color), color, depth, { lastMove: result.record }, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, budget)
        : 0;
    const finalScore = contender.quickScore + searchScore * (difficulty === "pro" ? 0.75 : 0.25);

    if (finalScore > bestScore) {
      best = contender;
      bestScore = finalScore;
    }
  }

  return toAiMove(best.candidate, bestScore === Number.NEGATIVE_INFINITY ? best.quickScore : bestScore);
}
