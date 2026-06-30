import { findSquare } from "./chessBoard";
import { applySearchMove, getLegalMoves, getNextTurn, isKingInCheck } from "./chessEngine";
import type { ChessBoard, ChessColor, ChessCoord, ChessMoveRecord, ChessMoveTarget, ChessPiece, ChessPromotionRole } from "./chessTypes";

export type ChessAiDifficulty = "beginner" | "intermediate" | "pro";

export type ChessAiMeta = {
  /** Deepest fully or partially searched ply that produced the chosen move. */
  depth: number;
  /** Number of search nodes visited (bounded by the node budget). */
  nodes: number;
  /** True when the compute deadline or node budget cut the search short. */
  timedOut: boolean;
  /** True when the search never completed a single ply and a static move was used. */
  fallback: boolean;
  /** Evaluation (centipawns) of the chosen move from the AI's perspective. */
  evaluation: number;
  /** Wall-clock milliseconds spent inside the search. */
  computeMs: number;
};

export type ChessAiMove = {
  from: ChessCoord;
  to: ChessCoord;
  move: ChessMoveTarget;
  promotion?: ChessPromotionRole;
  score: number;
  meta: ChessAiMeta;
};

type SearchContext = {
  lastMove?: ChessMoveRecord | null;
};

type CandidateMove = {
  from: ChessCoord;
  move: ChessMoveTarget;
  piece: ChessPiece;
};

type SearchState = {
  deadline: number;
  maxNodes: number;
  nodes: number;
  timedOut: boolean;
};

type DifficultyConfig = {
  maxDepth: number;
  quiescenceDepth: number;
  /** Hard wall-clock budget for the *calculation* (kept small so the UI never blocks). */
  computeMs: number;
  maxNodes: number;
  /** Centipawn window for picking a random near-best move (0 = always best). */
  blunderWindow: number;
  /** Probability of choosing a random near-best move instead of the strict best. */
  blunderChance: number;
};

const PIECE_VALUES: Record<ChessPiece["role"], number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20_000,
};

const MATE_SCORE = 1_000_000;

/**
 * Practical *visible* thinking windows (ms). The calculation itself is bounded by
 * each difficulty's `computeMs`; the rest of the window is an intentional pause so
 * the opponent feels like it is thinking without ever blocking the main thread.
 */
export const VISIBLE_THINKING_RANGES: Record<ChessAiDifficulty, { min: number; max: number }> = {
  beginner: { min: 300, max: 600 },
  intermediate: { min: 700, max: 1400 },
  pro: { min: 1200, max: 2500 },
};

/** Absolute upper bound on visible thinking — past this we reveal a fallback move. */
export const MAX_THINKING_MS = 2800;

const DIFFICULTY_CONFIG: Record<ChessAiDifficulty, DifficultyConfig> = {
  beginner: { maxDepth: 1, quiescenceDepth: 0, computeMs: 45, maxNodes: 3_000, blunderWindow: 130, blunderChance: 0.55 },
  intermediate: { maxDepth: 3, quiescenceDepth: 2, computeMs: 80, maxNodes: 9_000, blunderWindow: 35, blunderChance: 0.25 },
  pro: { maxDepth: 4, quiescenceDepth: 3, computeMs: 120, maxNodes: 18_000, blunderWindow: 0, blunderChance: 0 },
};

// Piece-square tables (white perspective, index 0 = A8 … 63 = H1). They fold center
// control, development, pawn advancement, and castled-king safety into one cheap term.
const PAWN_PST = [
  0, 0, 0, 0, 0, 0, 0, 0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5, 5, 10, 25, 25, 10, 5, 5,
  0, 0, 0, 20, 20, 0, 0, 0,
  5, -5, -10, 0, 0, -10, -5, 5,
  5, 10, 10, -20, -20, 10, 10, 5,
  0, 0, 0, 0, 0, 0, 0, 0,
];

const KNIGHT_PST = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20, 0, 0, 0, 0, -20, -40,
  -30, 0, 10, 15, 15, 10, 0, -30,
  -30, 5, 15, 20, 20, 15, 5, -30,
  -30, 0, 15, 20, 20, 15, 0, -30,
  -30, 5, 10, 15, 15, 10, 5, -30,
  -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];

const BISHOP_PST = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 10, 10, 5, 0, -10,
  -10, 5, 5, 10, 10, 5, 5, -10,
  -10, 0, 10, 10, 10, 10, 0, -10,
  -10, 10, 10, 10, 10, 10, 10, -10,
  -10, 5, 0, 0, 0, 0, 5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20,
];

const ROOK_PST = [
  0, 0, 0, 0, 0, 0, 0, 0,
  5, 10, 10, 10, 10, 10, 10, 5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  0, 0, 0, 5, 5, 0, 0, 0,
];

const QUEEN_PST = [
  -20, -10, -10, -5, -5, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 5, 5, 5, 0, -10,
  -5, 0, 5, 5, 5, 5, 0, -5,
  0, 0, 5, 5, 5, 5, 0, -5,
  -10, 5, 5, 5, 5, 5, 0, -10,
  -10, 0, 5, 0, 0, 0, 0, -10,
  -20, -10, -10, -5, -5, -10, -10, -20,
];

const KING_PST = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
  20, 20, 0, 0, 0, 0, 20, 20,
  20, 30, 10, 0, 0, 10, 30, 20,
];

const PST_BY_ROLE: Record<ChessPiece["role"], number[]> = {
  pawn: PAWN_PST,
  knight: KNIGHT_PST,
  bishop: BISHOP_PST,
  rook: ROOK_PST,
  queen: QUEEN_PST,
  king: KING_PST,
};

const FILE_INDEX: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7 };

function pstValue(role: ChessPiece["role"], color: ChessColor, coord: ChessCoord): number {
  const fileIndex = FILE_INDEX[coord[0]] ?? 0;
  const rank = Number(coord[1]);
  // White reads the table top-down (rank 8 → row 0). Black mirrors vertically.
  const row = color === "white" ? 8 - rank : rank - 1;
  return PST_BY_ROLE[role][row * 8 + fileIndex] ?? 0;
}

function opposite(color: ChessColor): ChessColor {
  return getNextTurn(color);
}

function nowMs(): number {
  return Date.now();
}

/** Static evaluation in centipawns from `side`'s perspective (positive = better for side). */
function evaluate(board: ChessBoard, side: ChessColor): number {
  let score = 0;
  for (const row of board) {
    for (const square of row) {
      const piece = square.piece;
      if (!piece) continue;
      const value = PIECE_VALUES[piece.role] + pstValue(piece.role, piece.color, square.coord);
      score += piece.color === side ? value : -value;
    }
  }
  return score;
}

/**
 * Apply a candidate during search. Promotions are resolved to a queen so the resulting
 * board reflects the real material gain (otherwise the engine leaves a pending pawn and
 * the search would value a promotion like a quiet pawn push).
 */
function applyCandidate(
  board: ChessBoard,
  side: ChessColor,
  candidate: CandidateMove,
  context: SearchContext,
): { board: ChessBoard; record: ChessMoveRecord } | null {
  // `context` is unused here because the candidate already encodes en-passant/castling.
  void context;
  return applySearchMove(board, candidate.from, candidate.move.coord, candidate.move, side);
}

function generateCandidates(board: ChessBoard, color: ChessColor, context: SearchContext): CandidateMove[] {
  const candidates: CandidateMove[] = [];
  for (const row of board) {
    for (const square of row) {
      if (square.piece?.color !== color) continue;
      const piece = square.piece;
      for (const move of getLegalMoves(board, square.coord, context)) {
        candidates.push({ from: square.coord, move, piece });
      }
    }
  }
  return candidates;
}

function victimValue(board: ChessBoard, candidate: CandidateMove): number {
  if (!candidate.move.capture) return 0;
  if (candidate.move.special === "en-passant") return PIECE_VALUES.pawn;
  const captured = findSquare(board, candidate.move.coord)?.piece;
  return captured ? PIECE_VALUES[captured.role] : 0;
}

/** Move ordering key — captures (MVV-LVA), promotions, checks, then positional gain. */
function orderingScore(board: ChessBoard, candidate: CandidateMove): number {
  let score = 0;
  const victim = victimValue(board, candidate);
  if (victim > 0) score += 10_000 + victim - PIECE_VALUES[candidate.piece.role] / 10;
  if (candidate.move.promotion) score += 9_000;
  if (candidate.move.checking) score += 60;
  score += pstValue(candidate.piece.role, candidate.piece.color, candidate.move.coord) -
    pstValue(candidate.piece.role, candidate.piece.color, candidate.from);
  return score;
}

function orderCandidates(board: ChessBoard, candidates: CandidateMove[]): CandidateMove[] {
  return candidates
    .map((candidate) => ({ candidate, key: orderingScore(board, candidate) }))
    .sort((a, b) => b.key - a.key || `${a.candidate.from}${a.candidate.move.coord}`.localeCompare(`${b.candidate.from}${b.candidate.move.coord}`))
    .map((entry) => entry.candidate);
}

function budgetExceeded(state: SearchState): boolean {
  if (state.nodes >= state.maxNodes || nowMs() >= state.deadline) {
    state.timedOut = true;
    return true;
  }
  return false;
}

/** Capture-only search to soften the horizon effect (avoids hanging after a trade). */
function quiesce(
  board: ChessBoard,
  side: ChessColor,
  alpha: number,
  beta: number,
  context: SearchContext,
  qdepth: number,
  state: SearchState,
): number {
  if (budgetExceeded(state)) return evaluate(board, side);
  state.nodes += 1;

  const standPat = evaluate(board, side);
  if (qdepth <= 0 || standPat >= beta) return standPat >= beta ? beta : standPat;
  if (standPat > alpha) alpha = standPat;

  const captures = orderCandidates(
    board,
    generateCandidates(board, side, context).filter((candidate) => candidate.move.capture || candidate.move.promotion),
  );

  for (const candidate of captures) {
    const result = applyCandidate(board, side, candidate, context);
    if (!result) continue;
    const score = -quiesce(result.board, opposite(side), -beta, -alpha, { lastMove: result.record }, qdepth - 1, state);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
    if (state.timedOut) break;
  }

  return alpha;
}

function negamax(
  board: ChessBoard,
  side: ChessColor,
  depth: number,
  alpha: number,
  beta: number,
  context: SearchContext,
  ply: number,
  config: DifficultyConfig,
  state: SearchState,
): number {
  if (budgetExceeded(state)) return evaluate(board, side);
  state.nodes += 1;

  const candidates = generateCandidates(board, side, context);
  if (candidates.length === 0) {
    // No legal move: checkmate (prefer faster mates) or stalemate.
    return isKingInCheck(board, side) ? -(MATE_SCORE - ply) : 0;
  }

  if (depth <= 0) return quiesce(board, side, alpha, beta, context, config.quiescenceDepth, state);

  const ordered = orderCandidates(board, candidates);
  let best = Number.NEGATIVE_INFINITY;

  for (const candidate of ordered) {
    const result = applyCandidate(board, side, candidate, context);
    if (!result) continue;
    const score = -negamax(result.board, opposite(side), depth - 1, -beta, -alpha, { lastMove: result.record }, ply + 1, config, state);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
    if (state.timedOut) break;
  }

  return best === Number.NEGATIVE_INFINITY ? evaluate(board, side) : best;
}

function toAiMove(candidate: CandidateMove, score: number, meta: ChessAiMeta): ChessAiMove {
  return {
    from: candidate.from,
    to: candidate.move.coord,
    move: candidate.move,
    promotion: candidate.move.promotion ? "queen" : undefined,
    score,
    meta,
  };
}

/**
 * Choose the computer's move. The search uses negamax with alpha-beta and iterative
 * deepening, but it is always bounded by a wall-clock deadline *and* a node budget so
 * it can never block for long or "think forever". If the deadline is hit mid-search,
 * the best move found so far is returned. As a last resort a statically-ranked move is
 * used (and flagged via `meta.fallback`) so a legal reply is guaranteed.
 */
export function chooseComputerMove(
  board: ChessBoard,
  color: ChessColor,
  difficulty: ChessAiDifficulty,
  context: SearchContext = {},
): ChessAiMove | null {
  const startedAt = nowMs();
  const config = DIFFICULTY_CONFIG[difficulty];

  const rootCandidates = generateCandidates(board, color, context);
  if (rootCandidates.length === 0) return null;

  let ordered = orderCandidates(board, rootCandidates);
  const fallbackCandidate = ordered[0];

  const state: SearchState = {
    deadline: startedAt + config.computeMs,
    maxNodes: config.maxNodes,
    nodes: 0,
    timedOut: false,
  };

  let bestCandidate = fallbackCandidate;
  let bestScore = Number.NEGATIVE_INFINITY;
  let completedDepth = 0;
  // Scores for the final (deepest reached) ply — used for difficulty-tuned move selection.
  let scoredCandidates: Array<{ candidate: CandidateMove; score: number }> = [];

  for (let depth = 1; depth <= config.maxDepth; depth += 1) {
    // Depth 1 always runs to completion so a sound, fully-evaluated move is guaranteed;
    // deeper passes are abandoned the moment the deadline or node budget is hit.
    if (depth > 1 && budgetExceeded(state)) break;

    let alpha = Number.NEGATIVE_INFINITY;
    let depthBest: CandidateMove | null = null;
    let depthBestScore = Number.NEGATIVE_INFINITY;
    let brokeEarly = false;
    const depthScores: Array<{ candidate: CandidateMove; score: number }> = [];

    for (const candidate of ordered) {
      if (depth > 1 && budgetExceeded(state)) {
        brokeEarly = true;
        break;
      }
      const result = applyCandidate(board, color, candidate, context);
      if (!result) continue;
      const score = -negamax(result.board, opposite(color), depth - 1, Number.NEGATIVE_INFINITY, -alpha, { lastMove: result.record }, 1, config, state);
      depthScores.push({ candidate, score });
      if (score > depthBestScore) {
        depthBestScore = score;
        depthBest = candidate;
      }
      if (depthBestScore > alpha) alpha = depthBestScore;
    }

    // Always keep the best move we have searched so far (PV-first ordering keeps it sound).
    if (depthBest) {
      bestCandidate = depthBest;
      bestScore = depthBestScore;
      if (!brokeEarly) completedDepth = depth;
      // Keep scores from the deepest ply that saw every root move.
      if (depthScores.length === ordered.length) scoredCandidates = depthScores;
      // Search the current best first on the next, deeper pass.
      ordered = [depthBest, ...ordered.filter((candidate) => candidate !== depthBest)];
    }

    if (brokeEarly || state.timedOut) break;
    // A forced mate was found — no need to search deeper.
    if (Math.abs(bestScore) >= MATE_SCORE - 100) break;
  }

  const meta: ChessAiMeta = {
    depth: completedDepth,
    nodes: state.nodes,
    timedOut: state.timedOut,
    fallback: completedDepth === 0,
    evaluation: Number.isFinite(bestScore) ? bestScore : 0,
    computeMs: nowMs() - startedAt,
  };

  const selected = selectWithDifficulty(bestCandidate, bestScore, scoredCandidates, config);
  return toAiMove(selected.candidate, selected.score, meta);
}

/**
 * Lower difficulties intentionally pick a random *near-best* move some of the time so
 * the opponent is beatable — but it never throws away large material (the window is in
 * centipawns), so it still grabs a hanging queen and finds a mate-in-one.
 */
function selectWithDifficulty(
  bestCandidate: CandidateMove,
  bestScore: number,
  scoredCandidates: Array<{ candidate: CandidateMove; score: number }>,
  config: DifficultyConfig,
): { candidate: CandidateMove; score: number } {
  if (config.blunderChance <= 0 || config.blunderWindow <= 0 || scoredCandidates.length <= 1) {
    return { candidate: bestCandidate, score: bestScore };
  }

  if (Math.random() >= config.blunderChance) {
    return { candidate: bestCandidate, score: bestScore };
  }

  const topScore = Math.max(...scoredCandidates.map((entry) => entry.score));
  const pool = scoredCandidates.filter((entry) => topScore - entry.score <= config.blunderWindow);
  if (pool.length <= 1) return { candidate: bestCandidate, score: bestScore };

  const choice = pool[Math.floor(Math.random() * pool.length)];
  return { candidate: choice.candidate, score: choice.score };
}
