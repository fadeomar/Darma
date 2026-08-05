import { describe, expect, it } from "vitest";

import {
  advanceDotPath,
  chooseDotConnectAiPath,
  createDotBoard,
  hasAvailableDotMove,
  isValidDotPath,
  recolorDotPath,
} from "./dotConnectEngine";
import type { DotBoard } from "./dotConnectTypes";

const board: DotBoard = [
  ["coral", "coral", "coral", "blue"],
  ["blue", "gold", "coral", "blue"],
  ["blue", "gold", "mint", "mint"],
  ["gold", "gold", "mint", "blue"],
];

describe("dot connect path rules", () => {
  it("builds only adjacent same-color paths", () => {
    const start = advanceDotPath(board, [], { row: 0, column: 0 });
    const connected = advanceDotPath(board, start, { row: 0, column: 1 });
    const disconnected = advanceDotPath(board, connected, {
      row: 2,
      column: 2,
    });
    const wrongColor = advanceDotPath(board, connected, { row: 1, column: 1 });

    expect(connected).toEqual([
      { row: 0, column: 0 },
      { row: 0, column: 1 },
    ]);
    expect(disconnected).toEqual(connected);
    expect(wrongColor).toEqual(connected);
    expect(isValidDotPath(board, connected)).toBe(true);
  });

  it("only removes the tail when the player backtracks", () => {
    const path = [
      { row: 0, column: 0 },
      { row: 0, column: 1 },
      { row: 0, column: 2 },
      { row: 1, column: 2 },
    ];

    const undoTail = advanceDotPath(board, path, { row: 0, column: 2 });
    const rejectMiddle = advanceDotPath(board, path, { row: 0, column: 1 });

    expect(undoTail).toEqual(path.slice(0, -1));
    expect(rejectMiddle).toEqual(path);
  });

  it("rejects duplicate and disconnected paths during final validation", () => {
    expect(
      isValidDotPath(board, [
        { row: 0, column: 0 },
        { row: 0, column: 1 },
        { row: 0, column: 0 },
      ]),
    ).toBe(false);

    expect(
      isValidDotPath(board, [
        { row: 0, column: 0 },
        { row: 0, column: 2 },
      ]),
    ).toBe(false);
  });
});

describe("dot connect board and AI", () => {
  it("recolors selected cells and keeps at least one playable pair", () => {
    const randomValues = [0, 0.4, 0.8, 0.1, 0.6];
    let index = 0;
    const random = () => randomValues[index++ % randomValues.length];
    const path = [
      { row: 0, column: 0 },
      { row: 0, column: 1 },
    ];

    const next = recolorDotPath(board, path, random);

    expect(next[0][0]).not.toBe(board[0][0]);
    expect(next[0][1]).not.toBe(board[0][1]);
    expect(hasAvailableDotMove(next)).toBe(true);
  });

  it("creates playable boards even with a deterministic random source", () => {
    const generated = createDotBoard(10, () => 0.99);
    expect(generated).toHaveLength(10);
    expect(hasAvailableDotMove(generated)).toBe(true);
  });

  it("returns a valid path without exhaustive longest-path search", () => {
    const largeBoard: DotBoard = Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => "coral" as const),
    );

    const path = chooseDotConnectAiPath(largeBoard, {
      nodeBudget: 600,
      startBudget: 4,
    });

    expect(path.length).toBeGreaterThanOrEqual(2);
    expect(path.length).toBeLessThanOrEqual(100);
    expect(isValidDotPath(largeBoard, path)).toBe(true);
  });
});
