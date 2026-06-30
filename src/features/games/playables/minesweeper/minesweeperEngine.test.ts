import { describe, expect, it } from "vitest";
import {
  computeMinesweeperScore,
  countRevealedSafeCells,
  createMinesweeperModel,
  revealMinesweeperCell,
  toggleMinesweeperFlag,
} from "./minesweeperEngine";
import type { MinesweeperConfig } from "./minesweeperTypes";

const TEST_CONFIG: MinesweeperConfig = {
  id: "easy",
  label: "Test",
  subtitle: "Test board",
  rows: 4,
  cols: 4,
  mines: 2,
  targetTime: 60,
};

describe("Minesweeper engine", () => {
  it("protects the first revealed cell and starts the timer state", () => {
    const model = createMinesweeperModel(TEST_CONFIG, "playing");
    const result = revealMinesweeperCell(model, TEST_CONFIG, 0, 0, 1000);

    expect(result.model.phase).toBe("playing");
    expect(result.model.minesPlanted).toBe(true);
    expect(result.model.startedAt).toBe(1000);
    expect(result.model.board[0][0].mine).toBe(false);
    expect(result.model.board[0][0].revealed).toBe(true);
  });

  it("toggles flags without revealing the cell", () => {
    const model = createMinesweeperModel(TEST_CONFIG, "playing");
    const flagged = toggleMinesweeperFlag(model, 2, 2);
    expect(flagged.flagsLeft).toBe(TEST_CONFIG.mines - 1);
    expect(flagged.board[2][2].flagged).toBe(true);
    expect(flagged.board[2][2].revealed).toBe(false);

    const unflagged = toggleMinesweeperFlag(flagged, 2, 2);
    expect(unflagged.flagsLeft).toBe(TEST_CONFIG.mines);
    expect(unflagged.board[2][2].flagged).toBe(false);
  });

  it("ends the round when a planted mine is revealed", () => {
    const model = createMinesweeperModel(TEST_CONFIG, "playing");
    model.minesPlanted = true;
    model.board[1][1].mine = true;
    model.board[1][1].adjacent = 0;

    const result = revealMinesweeperCell(model, TEST_CONFIG, 1, 1, 2000);
    expect(result.outcome).toBe("mine");
    expect(result.model.phase).toBe("lost");
    expect(result.model.board[1][1].exploded).toBe(true);
  });

  it("awards a win after the final safe cell is revealed", () => {
    const config: MinesweeperConfig = { ...TEST_CONFIG, rows: 2, cols: 2, mines: 1 };
    const model = createMinesweeperModel(config, "playing");
    model.minesPlanted = true;
    model.safeLeft = 1;
    model.board[0][0].mine = true;
    model.board[1][1].adjacent = 1;

    const result = revealMinesweeperCell(model, config, 1, 1, 3000);
    expect(result.outcome).toBe("win");
    expect(result.model.phase).toBe("won");
    expect(result.model.flagsLeft).toBe(0);
  });

  it("keeps score non-negative and rewards progress", () => {
    const model = createMinesweeperModel(TEST_CONFIG, "playing");
    const result = revealMinesweeperCell(model, TEST_CONFIG, 0, 0, 1000);
    expect(countRevealedSafeCells(result.model, TEST_CONFIG)).toBeGreaterThan(0);
    expect(computeMinesweeperScore(result.model, TEST_CONFIG, 10)).toBeGreaterThanOrEqual(0);
  });
});
