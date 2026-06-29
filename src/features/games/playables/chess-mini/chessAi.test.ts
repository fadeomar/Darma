import { describe, expect, it } from "vitest";
import { createInitialChessBoard, findSquare } from "./chessBoard";
import { chooseComputerMove } from "./chessAi";
import { getLegalMoves, moveChessPiece } from "./chessEngine";
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

  it("prefers an immediate checkmate when available", () => {
    const board = createInitialChessBoard();
    const whiteFool = moveChessPiece(board, "F2", "F3", "white");
    const blackPrep = moveChessPiece(whiteFool!.board, "E7", "E5", "black", { lastMove: whiteFool!.record });
    const whiteWeak = moveChessPiece(blackPrep!.board, "G2", "G4", "white", { lastMove: blackPrep!.record });

    const aiMove = chooseComputerMove(whiteWeak!.board, "black", "pro", { lastMove: whiteWeak!.record });

    expect(aiMove).toMatchObject({ from: "D8", to: "H4" });
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
});
