import { describe, expect, it } from "vitest";
import { createInitialChessBoard, findSquare } from "./chessBoard";
import { getLegalMoves, moveChessPiece, promotePawn } from "./chessEngine";
import type { ChessBoard, ChessColor, ChessCoord, ChessMoveRecord, ChessPiece } from "./chessTypes";

type TestState = {
  board: ChessBoard;
  turn: ChessColor;
  history: ChessMoveRecord[];
};

function clearSquare(board: ChessBoard, coord: ChessCoord) {
  const square = findSquare(board, coord);
  if (square) square.piece = undefined;
}

function setPiece(board: ChessBoard, coord: ChessCoord, piece: ChessPiece) {
  const square = findSquare(board, coord);
  if (!square) throw new Error(`Missing square ${coord}`);
  square.piece = piece;
}

function applyTestMove(state: TestState, from: ChessCoord, to: ChessCoord) {
  const result = moveChessPiece(state.board, from, to, state.turn, { lastMove: state.history[0] ?? null });
  expect(result).not.toBeNull();
  if (!result) throw new Error(`Illegal test move ${from}-${to}`);

  state.board = result.board;
  state.history = [result.record, ...state.history];
  if (!result.pendingPromotion && !result.winner) state.turn = state.turn === "white" ? "black" : "white";
  return result;
}

describe("Chess Mini phase 3 rules", () => {
  it("allows legal kingside castling and moves the rook", () => {
    const board = createInitialChessBoard();
    clearSquare(board, "F1");
    clearSquare(board, "G1");

    const legalMoves = getLegalMoves(board, "E1");
    expect(legalMoves).toContainEqual(expect.objectContaining({ coord: "G1", special: "castle-kingside" }));

    const result = moveChessPiece(board, "E1", "G1", "white");
    expect(result).not.toBeNull();
    expect(findSquare(result!.board, "G1")?.piece?.role).toBe("king");
    expect(findSquare(result!.board, "F1")?.piece?.role).toBe("rook");
    expect(findSquare(result!.board, "H1")?.piece).toBeUndefined();
  });

  it("supports en passant only immediately after a double pawn push", () => {
    const state: TestState = { board: createInitialChessBoard(), turn: "white", history: [] };

    applyTestMove(state, "E2", "E4");
    applyTestMove(state, "A7", "A6");
    applyTestMove(state, "E4", "E5");
    applyTestMove(state, "D7", "D5");

    const enPassantMove = getLegalMoves(state.board, "E5", { lastMove: state.history[0] }).find((move) => move.coord === "D6");
    expect(enPassantMove).toMatchObject({ special: "en-passant", capture: true });

    const result = applyTestMove(state, "E5", "D6");
    expect(findSquare(result.board, "D6")?.piece?.role).toBe("pawn");
    expect(findSquare(result.board, "D5")?.piece).toBeUndefined();
    expect(result.record.captured?.capturedAt).toBe("D5");
  });

  it("requires a promotion choice when a pawn reaches the final rank", () => {
    const board = createInitialChessBoard();
    for (const row of board) {
      for (const square of row) square.piece = undefined;
    }

    setPiece(board, "E1", { id: "white-king-E1", role: "king", color: "white", hasMoved: false });
    setPiece(board, "E8", { id: "black-king-E8", role: "king", color: "black", hasMoved: false });
    setPiece(board, "G7", { id: "white-pawn-G7", role: "pawn", color: "white", hasMoved: true });

    const result = moveChessPiece(board, "G7", "G8", "white");
    expect(result?.status).toBe("promotion");
    expect(result?.pendingPromotion?.coord).toBe("G8");

    const promotion = promotePawn(result!.board, result!.pendingPromotion!, "queen");
    expect(promotion).not.toBeNull();
    expect(findSquare(promotion!.board, "G8")?.piece?.role).toBe("queen");
    expect(promotion!.record.notation).toContain("=Q");
  });

  it("keeps phase 2 checkmate behavior while adding notation", () => {
    const state: TestState = { board: createInitialChessBoard(), turn: "white", history: [] };

    applyTestMove(state, "F2", "F3");
    applyTestMove(state, "E7", "E5");
    applyTestMove(state, "G2", "G4");
    const result = applyTestMove(state, "D8", "H4");

    expect(result.status).toBe("checkmate");
    expect(result.winner).toBe("black");
    expect(result.record.notation).toBe("QH4#");
  });
});
