import { CHESS_FILES, cloneBoard, findSquare } from "./chessBoard";
import type {
  CapturedPiece,
  ChessBoard,
  ChessColor,
  ChessCoord,
  ChessFile,
  ChessGameStatus,
  ChessMoveRecord,
  ChessMoveTarget,
  ChessPiece,
  ChessPromotionRole,
  ChessRank,
  PendingPromotion,
} from "./chessTypes";

type Offset = { file: number; rank: number };

type MoveContext = {
  lastMove?: ChessMoveRecord | null;
};

const KNIGHT_OFFSETS: readonly Offset[] = [
  { file: 1, rank: 2 },
  { file: -1, rank: 2 },
  { file: 1, rank: -2 },
  { file: -1, rank: -2 },
  { file: 2, rank: 1 },
  { file: -2, rank: 1 },
  { file: 2, rank: -1 },
  { file: -2, rank: -1 },
];

const KING_OFFSETS: readonly Offset[] = [
  { file: 0, rank: 1 },
  { file: 0, rank: -1 },
  { file: 1, rank: 0 },
  { file: -1, rank: 0 },
  { file: 1, rank: 1 },
  { file: -1, rank: 1 },
  { file: 1, rank: -1 },
  { file: -1, rank: -1 },
];

const ROOK_DIRECTIONS: readonly Offset[] = [
  { file: 0, rank: 1 },
  { file: 0, rank: -1 },
  { file: 1, rank: 0 },
  { file: -1, rank: 0 },
];

const BISHOP_DIRECTIONS: readonly Offset[] = [
  { file: 1, rank: 1 },
  { file: -1, rank: 1 },
  { file: 1, rank: -1 },
  { file: -1, rank: -1 },
];

const QUEEN_DIRECTIONS: readonly Offset[] = [...ROOK_DIRECTIONS, ...BISHOP_DIRECTIONS];

const PIECE_NOTATION: Record<ChessPiece["role"], string> = {
  pawn: "",
  knight: "N",
  bishop: "B",
  rook: "R",
  queen: "Q",
  king: "K",
};

function opposite(color: ChessColor): ChessColor {
  return color === "white" ? "black" : "white";
}

export function getNextTurn(color: ChessColor): ChessColor {
  return opposite(color);
}

export function getTurnLabel(color: ChessColor): string {
  return color === "white" ? "White" : "Black";
}

function toFileIndex(file: ChessFile): number {
  return CHESS_FILES.indexOf(file);
}

function toCoord(fileIndex: number, rank: number): ChessCoord | null {
  const file = CHESS_FILES[fileIndex];
  if (!file || rank < 1 || rank > 8) return null;
  return `${file}${rank as ChessRank}`;
}

function offsetCoord(from: ChessCoord, offset: Offset): ChessCoord | null {
  const file = from[0] as ChessFile;
  const rank = Number(from[1]);
  return toCoord(toFileIndex(file) + offset.file, rank + offset.rank);
}

function maybeAddTarget(
  board: ChessBoard,
  coord: ChessCoord | null,
  piece: ChessPiece,
  moves: ChessMoveTarget[],
  options: { includeKingCapture?: boolean } = {},
): boolean {
  if (!coord) return false;

  const targetSquare = findSquare(board, coord);
  if (!targetSquare) return false;

  if (!targetSquare.piece) {
    moves.push({ coord, capture: false });
    return true;
  }

  if (targetSquare.piece.color !== piece.color && (options.includeKingCapture || targetSquare.piece.role !== "king")) {
    moves.push({ coord, capture: true });
  }

  return false;
}

function getSlidingMoves(
  board: ChessBoard,
  from: ChessCoord,
  piece: ChessPiece,
  directions: readonly Offset[],
  options: { includeKingCapture?: boolean } = {},
): ChessMoveTarget[] {
  const moves: ChessMoveTarget[] = [];
  const file = from[0] as ChessFile;
  const rank = Number(from[1]);

  for (const direction of directions) {
    let fileIndex = toFileIndex(file) + direction.file;
    let nextRank = rank + direction.rank;

    while (true) {
      const targetCoord = toCoord(fileIndex, nextRank);
      if (!targetCoord) break;

      const canContinue = maybeAddTarget(board, targetCoord, piece, moves, options);
      if (!canContinue) break;

      fileIndex += direction.file;
      nextRank += direction.rank;
    }
  }

  return moves;
}

function getPawnAttackTargets(from: ChessCoord, piece: ChessPiece): ChessCoord[] {
  const file = from[0] as ChessFile;
  const rank = Number(from[1]);
  const direction = piece.color === "white" ? 1 : -1;
  const fileIndex = toFileIndex(file);

  return [-1, 1]
    .map((fileDelta) => toCoord(fileIndex + fileDelta, rank + direction))
    .filter((coord): coord is ChessCoord => Boolean(coord));
}

function isPromotionRank(piece: ChessPiece, target: ChessCoord): boolean {
  if (piece.role !== "pawn") return false;
  const rank = Number(target[1]);
  return (piece.color === "white" && rank === 8) || (piece.color === "black" && rank === 1);
}

function markPromotionIfNeeded(piece: ChessPiece, target: ChessMoveTarget): ChessMoveTarget {
  if (!isPromotionRank(piece, target.coord)) return target;
  return { ...target, promotion: true, special: "promotion" };
}

function getEnPassantMove(from: ChessCoord, piece: ChessPiece, context: MoveContext): ChessMoveTarget | null {
  const lastMove = context.lastMove;
  if (!lastMove?.isDoublePawnPush || lastMove.piece.role !== "pawn" || lastMove.piece.color === piece.color) return null;

  const file = from[0] as ChessFile;
  const rank = Number(from[1]);
  const lastFile = lastMove.to[0] as ChessFile;
  const lastRank = Number(lastMove.to[1]);
  const direction = piece.color === "white" ? 1 : -1;
  const target = toCoord(toFileIndex(lastFile), rank + direction);

  if (!target) return null;
  if (lastRank !== rank) return null;
  if (Math.abs(toFileIndex(lastFile) - toFileIndex(file)) !== 1) return null;

  return { coord: target, capture: true, special: "en-passant" };
}

function getPawnMoves(board: ChessBoard, from: ChessCoord, piece: ChessPiece, context: MoveContext): ChessMoveTarget[] {
  const moves: ChessMoveTarget[] = [];
  const file = from[0] as ChessFile;
  const rank = Number(from[1]);
  const direction = piece.color === "white" ? 1 : -1;
  const startRank = piece.color === "white" ? 2 : 7;
  const fileIndex = toFileIndex(file);
  const oneStep = toCoord(fileIndex, rank + direction);
  const oneStepSquare = oneStep ? findSquare(board, oneStep) : undefined;

  if (oneStep && oneStepSquare && !oneStepSquare.piece) {
    moves.push(markPromotionIfNeeded(piece, { coord: oneStep, capture: false }));

    const twoStep = toCoord(fileIndex, rank + direction * 2);
    const twoStepSquare = twoStep ? findSquare(board, twoStep) : undefined;
    if (rank === startRank && twoStep && twoStepSquare && !twoStepSquare.piece) {
      moves.push({ coord: twoStep, capture: false });
    }
  }

  for (const captureCoord of getPawnAttackTargets(from, piece)) {
    const targetSquare = findSquare(board, captureCoord);
    if (targetSquare?.piece && targetSquare.piece.color !== piece.color && targetSquare.piece.role !== "king") {
      moves.push(markPromotionIfNeeded(piece, { coord: captureCoord, capture: true }));
    }
  }

  const enPassantMove = getEnPassantMove(from, piece, context);
  if (enPassantMove) moves.push(enPassantMove);

  return moves;
}

function getCastlingTargets(board: ChessBoard, from: ChessCoord, piece: ChessPiece): ChessMoveTarget[] {
  if (piece.role !== "king" || piece.hasMoved) return [];

  const rank = piece.color === "white" ? 1 : 8;
  if (from !== `E${rank}`) return [];
  if (isKingInCheck(board, piece.color)) return [];

  const enemy = opposite(piece.color);
  const castlingTargets: ChessMoveTarget[] = [];

  const kingsideRook = findSquare(board, `H${rank}` as ChessCoord)?.piece;
  const kingsideSquares = [`F${rank}`, `G${rank}`] as ChessCoord[];
  if (
    kingsideRook?.role === "rook" &&
    kingsideRook.color === piece.color &&
    !kingsideRook.hasMoved &&
    kingsideSquares.every((coord) => !findSquare(board, coord)?.piece) &&
    kingsideSquares.every((coord) => !isSquareAttacked(board, coord, enemy))
  ) {
    castlingTargets.push({ coord: `G${rank}` as ChessCoord, capture: false, special: "castle-kingside" });
  }

  const queensideRook = findSquare(board, `A${rank}` as ChessCoord)?.piece;
  const queensideEmptySquares = [`B${rank}`, `C${rank}`, `D${rank}`] as ChessCoord[];
  const queensideSafeSquares = [`D${rank}`, `C${rank}`] as ChessCoord[];
  if (
    queensideRook?.role === "rook" &&
    queensideRook.color === piece.color &&
    !queensideRook.hasMoved &&
    queensideEmptySquares.every((coord) => !findSquare(board, coord)?.piece) &&
    queensideSafeSquares.every((coord) => !isSquareAttacked(board, coord, enemy))
  ) {
    castlingTargets.push({ coord: `C${rank}` as ChessCoord, capture: false, special: "castle-queenside" });
  }

  return castlingTargets;
}

function getPseudoLegalMoves(
  board: ChessBoard,
  from: ChessCoord,
  context: MoveContext = {},
  options: { includeKingCapture?: boolean } = {},
): ChessMoveTarget[] {
  const fromSquare = findSquare(board, from);
  const piece = fromSquare?.piece;
  if (!piece) return [];

  switch (piece.role) {
    case "pawn":
      return getPawnMoves(board, from, piece, context);
    case "rook":
      return getSlidingMoves(board, from, piece, ROOK_DIRECTIONS, options);
    case "bishop":
      return getSlidingMoves(board, from, piece, BISHOP_DIRECTIONS, options);
    case "queen":
      return getSlidingMoves(board, from, piece, QUEEN_DIRECTIONS, options);
    case "knight":
      return KNIGHT_OFFSETS.reduce<ChessMoveTarget[]>((moves, offset) => {
        maybeAddTarget(board, offsetCoord(from, offset), piece, moves, options);
        return moves;
      }, []);
    case "king": {
      const kingMoves = KING_OFFSETS.reduce<ChessMoveTarget[]>((moves, offset) => {
        maybeAddTarget(board, offsetCoord(from, offset), piece, moves, options);
        return moves;
      }, []);

      return options.includeKingCapture ? kingMoves : [...kingMoves, ...getCastlingTargets(board, from, piece)];
    }
    default:
      return [];
  }
}

function captureForMove(board: ChessBoard, move: ChessMoveTarget): CapturedPiece | undefined {
  const targetSquare = findSquare(board, move.coord);
  if (!targetSquare?.piece) return undefined;
  return { ...targetSquare.piece, capturedAt: move.coord };
}

function applyMoveUnchecked(board: ChessBoard, from: ChessCoord, to: ChessCoord, move?: ChessMoveTarget): ChessBoard | null {
  const fromSquare = findSquare(board, from);
  const toSquare = findSquare(board, to);
  const piece = fromSquare?.piece;
  if (!fromSquare || !toSquare || !piece) return null;

  const nextBoard = cloneBoard(board);
  const nextFromSquare = findSquare(nextBoard, from);
  const nextToSquare = findSquare(nextBoard, to);
  if (!nextFromSquare || !nextToSquare) return null;

  nextFromSquare.piece = undefined;
  nextToSquare.piece = { ...piece, hasMoved: true };

  if (move?.special === "en-passant") {
    const capturedRank = Number(from[1]);
    const capturedCoord = `${to[0]}${capturedRank}` as ChessCoord;
    const capturedSquare = findSquare(nextBoard, capturedCoord);
    if (capturedSquare) capturedSquare.piece = undefined;
  }

  if (move?.special === "castle-kingside" || move?.special === "castle-queenside") {
    const rank = piece.color === "white" ? 1 : 8;
    const rookFrom = move.special === "castle-kingside" ? (`H${rank}` as ChessCoord) : (`A${rank}` as ChessCoord);
    const rookTo = move.special === "castle-kingside" ? (`F${rank}` as ChessCoord) : (`D${rank}` as ChessCoord);
    const rookFromSquare = findSquare(nextBoard, rookFrom);
    const rookToSquare = findSquare(nextBoard, rookTo);

    if (rookFromSquare?.piece && rookToSquare) {
      rookToSquare.piece = { ...rookFromSquare.piece, hasMoved: true };
      rookFromSquare.piece = undefined;
    }
  }

  return nextBoard;
}

function findKingCoord(board: ChessBoard, color: ChessColor): ChessCoord | null {
  for (const row of board) {
    for (const square of row) {
      if (square.piece?.role === "king" && square.piece.color === color) return square.coord;
    }
  }

  return null;
}

function pawnAttacksCoord(from: ChessCoord, piece: ChessPiece, target: ChessCoord): boolean {
  return getPawnAttackTargets(from, piece).includes(target);
}

export function isSquareAttacked(board: ChessBoard, target: ChessCoord, byColor: ChessColor): boolean {
  for (const row of board) {
    for (const square of row) {
      const piece = square.piece;
      if (!piece || piece.color !== byColor) continue;

      if (piece.role === "pawn") {
        if (pawnAttacksCoord(square.coord, piece, target)) return true;
        continue;
      }

      if (getPseudoLegalMoves(board, square.coord, {}, { includeKingCapture: true }).some((move) => move.coord === target)) {
        return true;
      }
    }
  }

  return false;
}

export function isKingInCheck(board: ChessBoard, color: ChessColor): boolean {
  const kingCoord = findKingCoord(board, color);
  if (!kingCoord) return false;
  return isSquareAttacked(board, kingCoord, opposite(color));
}

export function getLegalMoves(board: ChessBoard, from: ChessCoord, context: MoveContext = {}): ChessMoveTarget[] {
  const fromSquare = findSquare(board, from);
  const piece = fromSquare?.piece;
  if (!piece) return [];

  return getPseudoLegalMoves(board, from, context).flatMap((move) => {
    const nextBoard = applyMoveUnchecked(board, from, move.coord, move);
    if (!nextBoard || isKingInCheck(nextBoard, piece.color)) return [];

    const checking = isKingInCheck(nextBoard, opposite(piece.color));
    return [{ ...move, checking }];
  });
}

export function getAllLegalMoves(board: ChessBoard, color: ChessColor, context: MoveContext = {}): ChessMoveTarget[] {
  return board.flatMap((row) =>
    row.flatMap((square) => (square.piece?.color === color ? getLegalMoves(board, square.coord, context) : [])),
  );
}

export function getStatusForTurn(board: ChessBoard, colorToMove: ChessColor, context: MoveContext = {}): ChessGameStatus {
  const inCheck = isKingInCheck(board, colorToMove);
  const legalMoves = getAllLegalMoves(board, colorToMove, context);

  if (legalMoves.length === 0 && inCheck) return "checkmate";
  if (legalMoves.length === 0) return "stalemate";
  if (inCheck) return "check";
  return "playing";
}

function isDoublePawnPush(piece: ChessPiece, from: ChessCoord, to: ChessCoord): boolean {
  return piece.role === "pawn" && Math.abs(Number(from[1]) - Number(to[1])) === 2;
}

/**
 * Lean move application for the AI search. The move is assumed to already be legal
 * (it comes from {@link getLegalMoves}), so this skips re-validation and — crucially —
 * skips the expensive {@link getStatusForTurn} legal-move generation that
 * {@link moveChessPiece} performs only to build notation. Promotions are resolved to a
 * queen. It returns just the board plus the minimal record needed for en-passant context.
 */
export function applySearchMove(
  board: ChessBoard,
  from: ChessCoord,
  to: ChessCoord,
  move: ChessMoveTarget,
  turn: ChessColor,
): { board: ChessBoard; record: ChessMoveRecord } | null {
  const piece = findSquare(board, from)?.piece;
  if (!piece) return null;

  const nextBoard = applyMoveUnchecked(board, from, to, move);
  if (!nextBoard) return null;

  if (move.promotion) {
    const promoted = findSquare(nextBoard, to);
    if (promoted?.piece) promoted.piece = { ...promoted.piece, role: "queen", hasMoved: true };
  }

  const record: ChessMoveRecord = {
    from,
    to,
    piece: { ...piece },
    turn,
    statusAfter: "playing",
    special: move.special,
    promotedTo: move.promotion ? "queen" : undefined,
    isDoublePawnPush: isDoublePawnPush(piece, from, to),
  };

  return { board: nextBoard, record };
}

function getCapturedPiece(board: ChessBoard, from: ChessCoord, to: ChessCoord, move: ChessMoveTarget): CapturedPiece | undefined {
  if (move.special === "en-passant") {
    const capturedCoord = `${to[0]}${from[1]}` as ChessCoord;
    const capturedPiece = findSquare(board, capturedCoord)?.piece;
    return capturedPiece ? { ...capturedPiece, capturedAt: capturedCoord } : undefined;
  }

  return captureForMove(board, move);
}

function buildNotation(record: ChessMoveRecord, status: ChessGameStatus): string {
  const suffix = status === "checkmate" ? "#" : status === "check" ? "+" : "";

  if (record.special === "castle-kingside") return `O-O${suffix}`;
  if (record.special === "castle-queenside") return `O-O-O${suffix}`;

  const pieceSymbol = PIECE_NOTATION[record.piece.role];
  const capture = record.captured ? "x" : "";
  const pawnCaptureFile = record.piece.role === "pawn" && record.captured ? record.from[0].toLowerCase() : "";
  const promotion = record.promotedTo ? `=${PIECE_NOTATION[record.promotedTo]}` : "";
  const enPassant = record.special === "en-passant" ? " e.p." : "";

  return `${pieceSymbol}${pawnCaptureFile}${capture}${record.to}${promotion}${suffix}${enPassant}`;
}

export function moveChessPiece(
  board: ChessBoard,
  from: ChessCoord,
  to: ChessCoord,
  turn: ChessColor,
  context: MoveContext = {},
): { board: ChessBoard; record: ChessMoveRecord; status: ChessGameStatus; winner: ChessColor | null; pendingPromotion?: PendingPromotion } | null {
  const fromSquare = findSquare(board, from);
  const toSquare = findSquare(board, to);
  const piece = fromSquare?.piece;

  if (!fromSquare || !toSquare || !piece || piece.color !== turn || toSquare.piece?.role === "king") return null;

  const move = getLegalMoves(board, from, context).find((candidate) => candidate.coord === to);
  if (!move) return null;

  const captured = getCapturedPiece(board, from, to, move);
  const nextBoard = applyMoveUnchecked(board, from, to, move);
  if (!nextBoard) return null;

  const baseRecord: ChessMoveRecord = {
    from,
    to,
    piece: { ...piece },
    captured,
    turn,
    statusAfter: move.promotion ? "promotion" : "playing",
    special: move.special,
    isDoublePawnPush: isDoublePawnPush(piece, from, to),
  };

  if (move.promotion) {
    const pendingPromotion = { coord: to, color: turn, move: baseRecord };
    return {
      board: nextBoard,
      status: "promotion",
      winner: null,
      pendingPromotion,
      record: {
        ...baseRecord,
        notation: buildNotation(baseRecord, "promotion"),
      },
    };
  }

  const nextTurn = opposite(turn);
  const recordForContext = { ...baseRecord };
  const status = getStatusForTurn(nextBoard, nextTurn, { lastMove: recordForContext });
  const record: ChessMoveRecord = {
    ...baseRecord,
    statusAfter: status,
    notation: buildNotation(baseRecord, status),
  };

  return {
    board: nextBoard,
    status,
    winner: status === "checkmate" ? turn : null,
    record,
  };
}

export function promotePawn(
  board: ChessBoard,
  pendingPromotion: PendingPromotion,
  promotedTo: ChessPromotionRole,
): { board: ChessBoard; record: ChessMoveRecord; status: ChessGameStatus; winner: ChessColor | null; nextTurn: ChessColor } | null {
  const square = findSquare(board, pendingPromotion.coord);
  const pawn = square?.piece;
  if (!square || !pawn || pawn.role !== "pawn" || pawn.color !== pendingPromotion.color) return null;

  const nextBoard = cloneBoard(board);
  const nextSquare = findSquare(nextBoard, pendingPromotion.coord);
  if (!nextSquare?.piece) return null;

  nextSquare.piece = {
    ...nextSquare.piece,
    role: promotedTo,
    id: `${pendingPromotion.color}-${promotedTo}-${pendingPromotion.coord}-${Date.now()}`,
    hasMoved: true,
  };

  const nextTurn = opposite(pendingPromotion.color);
  const recordBase: ChessMoveRecord = {
    ...pendingPromotion.move,
    promotedTo,
    special: "promotion",
  };
  const status = getStatusForTurn(nextBoard, nextTurn, { lastMove: recordBase });
  const record: ChessMoveRecord = {
    ...recordBase,
    statusAfter: status,
    notation: buildNotation(recordBase, status),
  };

  return {
    board: nextBoard,
    record,
    status,
    winner: status === "checkmate" ? pendingPromotion.color : null,
    nextTurn,
  };
}

export function getMaterialScore(capturedPieces: ChessPiece[]): number {
  const valueByRole: Record<ChessPiece["role"], number> = {
    pawn: 1,
    knight: 3,
    bishop: 3,
    rook: 5,
    queen: 9,
    king: 0,
  };

  return capturedPieces.reduce((total, piece) => total + valueByRole[piece.role], 0);
}
