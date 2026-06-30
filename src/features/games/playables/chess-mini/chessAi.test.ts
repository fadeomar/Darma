import { describe, expect, it } from "vitest";
import { createInitialChessBoard, findSquare } from "./chessBoard";
import { chooseComputerMove, type ChessAiDifficulty } from "./chessAi";
import { getLegalMoves, isKingInCheck, moveChessPiece } from "./chessEngine";
import type { ChessBoard, ChessCoord, ChessPiece } from "./chessTypes";

function clearBoard(board: ChessBoard) {
  for (const row of board) {
    for (const square of row) square.piece = undefined;
  }
}

function setPiece(board: ChessBoard, coord: ChessCoord, piece: ChessPiece) {
  const square = findSquare(board, coord);
  if (!square) throw new Error(`Missing square ${coord}`);
  square.piece = piece;
}

describe("Chess Mini computer opponent", () => {
  it("chooses a legal move for the opening side", () => {
    const board = createInitialChessBoard();
    const aiMove = chooseComputerMove(board, "white", "beginner");

    expect(aiMove).not.toBeNull();
    expect(aiMove?.from).toBeTruthy();
    expect(getLegalMoves(board, aiMove!.from).map((move) => move.coord)).toContain(aiMove!.to);
  });

  it("only ever returns legal moves that do not leave its own king in check", () => {
    const difficulties: ChessAiDifficulty[] = ["beginner", "intermediate", "pro"];

    for (const difficulty of difficulties) {
      // Run several times so the randomized lower difficulties are exercised too.
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const board = createInitialChessBoard();
        const aiMove = chooseComputerMove(board, "white", difficulty);
        expect(aiMove).not.toBeNull();

        const legal = getLegalMoves(board, aiMove!.from).map((move) => move.coord);
        expect(legal).toContain(aiMove!.to);

        const result = moveChessPiece(board, aiMove!.from, aiMove!.to, "white");
        expect(result).not.toBeNull();
        expect(isKingInCheck(result!.board, "white")).toBe(false);
      }
    }
  });

  it("escapes check with a strictly legal move", () => {
    const board = createInitialChessBoard();
    clearBoard(board);
    setPiece(board, "E1", { id: "white-king-E1", role: "king", color: "white", hasMoved: true });
    setPiece(board, "E8", { id: "black-king-E8", role: "king", color: "black", hasMoved: true });
    // Black rook gives check down the e-file.
    setPiece(board, "E5", { id: "black-rook-E5", role: "rook", color: "black", hasMoved: true });
    setPiece(board, "A2", { id: "white-pawn-A2", role: "pawn", color: "white", hasMoved: false });

    expect(isKingInCheck(board, "white")).toBe(true);

    const aiMove = chooseComputerMove(board, "white", "pro");
    expect(aiMove).not.toBeNull();
    const result = moveChessPiece(board, aiMove!.from, aiMove!.to, "white");
    expect(result).not.toBeNull();
    expect(isKingInCheck(result!.board, "white")).toBe(false);
  });

  it("prefers an immediate checkmate when available", () => {
    const board = createInitialChessBoard();
    const whiteFool = moveChessPiece(board, "F2", "F3", "white");
    const blackPrep = moveChessPiece(whiteFool!.board, "E7", "E5", "black", { lastMove: whiteFool!.record });
    const whiteWeak = moveChessPiece(blackPrep!.board, "G2", "G4", "white", { lastMove: blackPrep!.record });

    const aiMove = chooseComputerMove(whiteWeak!.board, "black", "pro", { lastMove: whiteWeak!.record });

    expect(aiMove).toMatchObject({ from: "D8", to: "H4" });
  });

  it("captures a high-value hanging piece when it is safe", () => {
    const board = createInitialChessBoard();
    clearBoard(board);
    setPiece(board, "E1", { id: "white-king-E1", role: "king", color: "white", hasMoved: true });
    setPiece(board, "E8", { id: "black-king-E8", role: "king", color: "black", hasMoved: true });
    // White rook can capture the undefended black queen down the open d-file.
    setPiece(board, "D1", { id: "white-rook-D1", role: "rook", color: "white", hasMoved: true });
    setPiece(board, "D5", { id: "black-queen-D5", role: "queen", color: "black", hasMoved: true });
    setPiece(board, "A7", { id: "black-pawn-A7", role: "pawn", color: "black", hasMoved: false });

    const aiMove = chooseComputerMove(board, "white", "pro");
    expect(aiMove).toMatchObject({ from: "D1", to: "D5" });
    expect(aiMove?.move.capture).toBe(true);
  });

  it("does not grab a king-defended pawn with its queen (avoids an obvious blunder)", () => {
    const board = createInitialChessBoard();
    clearBoard(board);
    setPiece(board, "E1", { id: "white-king-E1", role: "king", color: "white", hasMoved: true });
    setPiece(board, "C8", { id: "black-king-C8", role: "king", color: "black", hasMoved: true });
    setPiece(board, "B5", { id: "white-queen-B5", role: "queen", color: "white", hasMoved: true });
    // The pawn on B7 is defended by the black king on C8 — Qxb7+ would hang the queen to Kxb7.
    setPiece(board, "B7", { id: "black-pawn-B7", role: "pawn", color: "black", hasMoved: false });

    const aiMove = chooseComputerMove(board, "white", "pro");
    expect(aiMove).not.toBeNull();
    // It must not play the losing Qxb7.
    expect(aiMove?.to).not.toBe("B7");
  });

  it("auto-promotes computer pawns to queen", () => {
    const board = createInitialChessBoard();
    clearBoard(board);
    setPiece(board, "E1", { id: "white-king-E1", role: "king", color: "white", hasMoved: false });
    setPiece(board, "E8", { id: "black-king-E8", role: "king", color: "black", hasMoved: false });
    setPiece(board, "G2", { id: "black-pawn-G2", role: "pawn", color: "black", hasMoved: true });

    const aiMove = chooseComputerMove(board, "black", "intermediate");

    expect(aiMove).toMatchObject({ from: "G2", to: "G1", promotion: "queen" });
  });

  it("returns a move within the compute budget and respects the node cap", () => {
    const board = createInitialChessBoard();
    const opening = moveChessPiece(board, "E2", "E4", "white");

    const startedAt = Date.now();
    const aiMove = chooseComputerMove(opening!.board, "black", "pro", { lastMove: opening!.record });
    const elapsed = Date.now() - startedAt;

    expect(aiMove).not.toBeNull();
    expect(aiMove!.meta.fallback).toBe(false);
    expect(aiMove!.meta.nodes).toBeLessThanOrEqual(18_000);
    // The calculation is bounded; allow generous slack for slow CI machines.
    expect(elapsed).toBeLessThan(1_500);
  });
});
