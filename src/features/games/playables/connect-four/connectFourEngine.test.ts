import { describe, expect, it } from "vitest";
import { chooseConnectFourAiMove, createConnectFourBoard, dropDisc, findConnectFourWinner, findImmediateWinningColumn } from "./connectFourEngine";

describe("connectFourEngine", () => {
  it("drops discs to the lowest available row", () => {
    const board = createConnectFourBoard();
    const first = dropDisc(board, 3, "red");
    expect(first?.row).toBe(5);
    const second = first && dropDisc(first.board, 3, "yellow");
    expect(second?.row).toBe(4);
  });

  it("detects a horizontal win", () => {
    let board = createConnectFourBoard();
    for (const column of [0, 1, 2, 3]) {
      const result = dropDisc(board, column, "red");
      board = result?.board ?? board;
    }
    expect(findConnectFourWinner(board).winner).toBe("red");
    expect(findConnectFourWinner(board).line).toHaveLength(4);
  });

  it("detects immediate winning columns", () => {
    let board = createConnectFourBoard();
    for (const column of [0, 1, 2]) {
      const result = dropDisc(board, column, "yellow");
      board = result?.board ?? board;
    }
    expect(findImmediateWinningColumn(board, "yellow")).toBe(3);
  });

  it("AI blocks an opponent immediate win", () => {
    let board = createConnectFourBoard();
    for (const column of [0, 1, 2]) {
      const result = dropDisc(board, column, "red");
      board = result?.board ?? board;
    }
    expect(chooseConnectFourAiMove(board, "yellow", "smart")).toBe(3);
  });
});
