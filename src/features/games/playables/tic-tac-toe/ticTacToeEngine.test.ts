import { describe, expect, it } from "vitest";
import { applyMove, availableMoves, boardToText, createInitialTicState, detectWinner, getAiMove, getWinningLines } from "./ticTacToeEngine";

describe("ticTacToeEngine", () => {
  it("creates a classic board", () => {
    const state = createInitialTicState({ size: 3 });
    expect(state.board).toHaveLength(9);
    expect(state.current).toBe("X");
  });

  it("detects row wins", () => {
    const winner = detectWinner(["X", "X", "X", null, null, null, null, null, null], 3, 3);
    expect(winner?.mark).toBe("X");
    expect(winner?.line).toEqual([0, 1, 2]);
  });

  it("applies moves and alternates turns", () => {
    const state = createInitialTicState();
    const next = applyMove(state, 0);
    expect(next.board[0]).toBe("X");
    expect(next.current).toBe("O");
  });

  it("detects draws", () => {
    let state = createInitialTicState();
    [0, 1, 2, 4, 3, 5, 7, 6, 8].forEach((move) => {
      state = applyMove(state, move);
    });
    expect(state.status).toBe("draw");
  });

  it("produces 4x4 winning lines", () => {
    expect(getWinningLines(4, 4).some((line) => line.join(",") === "0,5,10,15")).toBe(true);
  });

  it("AI takes a winning move", () => {
    const state = createInitialTicState({ difficulty: "smart" });
    const board = ["O", "O", null, "X", "X", null, null, null, null] as const;
    expect(getAiMove([...board], state.settings, "O", "smart")).toBe(2);
  });

  it("AI blocks an immediate loss", () => {
    const state = createInitialTicState({ difficulty: "smart" });
    const board = ["X", "X", null, "O", null, null, null, null, null] as const;
    expect(getAiMove([...board], state.settings, "O", "smart")).toBe(2);
  });

  it("lists available moves and serializes board", () => {
    expect(availableMoves(["X", null, "O"])).toEqual([1]);
    expect(boardToText(["X", null, "O", null], 2)).toContain("X ·");
  });
});
