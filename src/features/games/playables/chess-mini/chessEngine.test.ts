import { describe, expect, it } from "vitest";
import { createInitialChessBoard, findSquare } from "./chessBoard";
import { getLegalMoves, getPositionKey, isDeadPosition, moveChessPiece, promotePawn } from "./chessEngine";
import type {
  ChessBoard,
  ChessColor,
  ChessCoord,
  ChessMoveRecord,
  ChessPiece,
  ChessPositionCounts,
} from "./chessTypes";

type TestState = {
  board: ChessBoard;
  turn: ChessColor;
  history: ChessMoveRecord[];
  halfmoveClock: number;
  positionCounts: ChessPositionCounts;
};

function createTestState(board = createInitialChessBoard(), turn: ChessColor = "white"): TestState {
  return {
    board,
    turn,
    history: [],
    halfmoveClock: 0,
    positionCounts: { [getPositionKey(board, turn)]: 1 },
  };
}

function clearBoard(board: ChessBoard) {
  for (const row of board) {
    for (const square of row) square.piece = undefined;
  }
}

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
  const result = moveChessPiece(state.board, from, to, state.turn, {
    lastMove: state.history[0] ?? null,
    halfmoveClock: state.halfmoveClock,
    positionCounts: state.positionCounts,
  });
  expect(result).not.toBeNull();
  if (!result) throw new Error(`Illegal test move ${from}-${to}`);

  state.board = result.board;
  state.history = [result.record, ...state.history];
  state.halfmoveClock = result.halfmoveClock;
  if (result.positionKey && result.positionCount !== undefined) {
    state.positionCounts = { ...state.positionCounts, [result.positionKey]: result.positionCount };
  }
  if (!result.pendingPromotion && !result.winner && result.status !== "draw" && result.status !== "stalemate") {
    state.turn = state.turn === "white" ? "black" : "white";
  }
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
    const state = createTestState();

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
    clearBoard(board);

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
    const state = createTestState();

    applyTestMove(state, "F2", "F3");
    applyTestMove(state, "E7", "E5");
    applyTestMove(state, "G2", "G4");
    const result = applyTestMove(state, "D8", "H4");

    expect(result.status).toBe("checkmate");
    expect(result.winner).toBe("black");
    expect(result.record.notation).toBe("QH4#");
  });
});

describe("Chess Mini illegal-move regression coverage", () => {
  it("does not let a queen jump over its own pawn", () => {
    const board = createInitialChessBoard();
    expect(getLegalMoves(board, "D1").map((move) => move.coord)).not.toContain("D3");
    expect(moveChessPiece(board, "D1", "D3", "white")).toBeNull();
  });

  it("only lets a knight move in an L shape", () => {
    const board = createInitialChessBoard();
    expect(moveChessPiece(board, "B1", "B3", "white")).toBeNull();
    expect(moveChessPiece(board, "B1", "C3", "white")).not.toBeNull();
  });
});

describe("Chess Mini draw rules", () => {
  it("automatically draws king versus king as a dead position", () => {
    const board = createInitialChessBoard();
    clearBoard(board);
    setPiece(board, "A1", { id: "white-king", role: "king", color: "white", hasMoved: true });
    setPiece(board, "H8", { id: "black-king", role: "king", color: "black", hasMoved: true });

    const result = moveChessPiece(board, "A1", "A2", "white", {
      positionCounts: { [getPositionKey(board, "white")]: 1 },
    });

    expect(result?.status).toBe("draw");
    expect(result?.drawReason).toBe("dead-position");
  });

  it("detects the common insufficient-material cases conservatively", () => {
    const board = createInitialChessBoard();
    clearBoard(board);
    setPiece(board, "A1", { id: "white-king", role: "king", color: "white", hasMoved: true });
    setPiece(board, "H8", { id: "black-king", role: "king", color: "black", hasMoved: true });
    setPiece(board, "C1", { id: "white-bishop", role: "bishop", color: "white", hasMoved: true });
    expect(isDeadPosition(board)).toBe(true);

    setPiece(board, "B1", { id: "white-knight", role: "knight", color: "white", hasMoved: true });
    expect(isDeadPosition(board)).toBe(false);
  });

  it("does not incorrectly draw king + rook + knight versus king", () => {
    const board = createInitialChessBoard();
    clearBoard(board);
    setPiece(board, "A1", { id: "white-king", role: "king", color: "white", hasMoved: true });
    setPiece(board, "H8", { id: "black-king", role: "king", color: "black", hasMoved: true });
    setPiece(board, "B1", { id: "white-rook", role: "rook", color: "white", hasMoved: true });
    setPiece(board, "C1", { id: "white-knight", role: "knight", color: "white", hasMoved: true });

    expect(isDeadPosition(board)).toBe(false);
    const result = moveChessPiece(board, "C1", "D3", "white", {
      positionCounts: { [getPositionKey(board, "white")]: 1 },
    });
    expect(result?.status).not.toBe("draw");
  });

  it("offers a claim on the third repetition and ends automatically on the fifth", () => {
    const state = createTestState();

    const playCycle = () => {
      applyTestMove(state, "G1", "F3");
      applyTestMove(state, "G8", "F6");
      applyTestMove(state, "F3", "G1");
      return applyTestMove(state, "F6", "G8");
    };

    expect(playCycle().claimableDrawReason).toBeNull(); // second occurrence
    const third = playCycle();
    expect(third.status).toBe("playing");
    expect(third.claimableDrawReason).toBe("threefold-repetition");
    expect(playCycle().claimableDrawReason).toBe("threefold-repetition"); // fourth occurrence
    const fifth = playCycle();
    expect(fifth.status).toBe("draw");
    expect(fifth.drawReason).toBe("fivefold-repetition");
  });

  it("offers the 50-move claim and enforces the automatic 75-move rule", () => {
    const makeBoard = () => {
      const board = createInitialChessBoard();
      clearBoard(board);
      setPiece(board, "A1", { id: "white-king", role: "king", color: "white", hasMoved: true });
      setPiece(board, "H8", { id: "black-king", role: "king", color: "black", hasMoved: true });
      setPiece(board, "B1", { id: "white-rook", role: "rook", color: "white", hasMoved: true });
      return board;
    };

    const fiftyBoard = makeBoard();
    const fifty = moveChessPiece(fiftyBoard, "B1", "B2", "white", {
      halfmoveClock: 99,
      positionCounts: { [getPositionKey(fiftyBoard, "white")]: 1 },
    });
    expect(fifty?.status).toBe("playing");
    expect(fifty?.claimableDrawReason).toBe("fifty-move-rule");

    const seventyFiveBoard = makeBoard();
    const seventyFive = moveChessPiece(seventyFiveBoard, "B1", "B2", "white", {
      halfmoveClock: 149,
      positionCounts: { [getPositionKey(seventyFiveBoard, "white")]: 1 },
    });
    expect(seventyFive?.status).toBe("draw");
    expect(seventyFive?.drawReason).toBe("seventy-five-move-rule");
  });
});
