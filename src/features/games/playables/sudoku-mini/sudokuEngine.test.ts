import { describe, expect, it } from "vitest";
import {
  applyHint,
  countSolutions,
  createInitialSudokuState,
  enterValue,
  eraseCell,
  findConflicts,
  generateSolvedGrid,
  generateSudokuPuzzle,
  isPuzzleComplete,
  isSolvedGridValid,
  redoSudokuMove,
  undoSudokuMove,
} from "./sudokuEngine";

describe("Sudoku Mini engine", () => {
  it("generates valid solved 6x6 and 4x4 grids", () => {
    expect(isSolvedGridValid(generateSolvedGrid(6, "a"), 6)).toBe(true);
    expect(isSolvedGridValid(generateSolvedGrid(4, "b"), 4)).toBe(true);
  });

  it("generates a puzzle with a unique solution", () => {
    const puzzle = generateSudokuPuzzle({ size: 6, difficulty: "medium", seed: "unique-test" });
    expect(isSolvedGridValid(puzzle.solution, 6)).toBe(true);
    expect(countSolutions(puzzle.givens, 6, 2)).toBe(1);
    expect(puzzle.givens.filter(Boolean).length).toBeGreaterThanOrEqual(14);
  });

  it("detects conflicts", () => {
    const puzzle = generateSudokuPuzzle({ size: 4, difficulty: "easy", seed: "conflict" });
    const state = createInitialSudokuState(puzzle);
    const firstEmpty = puzzle.givens.findIndex((value) => value === 0);
    const sameRowPeer = Math.floor(firstEmpty / puzzle.size) * puzzle.size;
    const values = [...state.values];
    values[firstEmpty] = 1;
    values[sameRowPeer === firstEmpty ? sameRowPeer + 1 : sameRowPeer] = 1;
    expect(findConflicts(values, puzzle, firstEmpty).length).toBeGreaterThan(0);
  });

  it("supports notes, erase, undo, redo", () => {
    const puzzle = generateSudokuPuzzle({ size: 4, difficulty: "medium", seed: "moves" });
    const cell = puzzle.givens.findIndex((value) => value === 0);
    let state = { ...createInitialSudokuState(puzzle), selected: cell, noteMode: true };
    state = enterValue(state, cell, 1);
    expect(state.notes[cell]).toContain(1);
    state = { ...state, noteMode: false };
    state = enterValue(state, cell, puzzle.solution[cell]);
    expect(state.values[cell]).toBe(puzzle.solution[cell]);
    state = undoSudokuMove(state);
    expect(state.values[cell]).toBe(0);
    state = redoSudokuMove(state);
    expect(state.values[cell]).toBe(puzzle.solution[cell]);
    state = eraseCell(state, cell);
    expect(state.values[cell]).toBe(0);
  });

  it("applies hints and detects win", () => {
    const puzzle = generateSudokuPuzzle({ size: 4, difficulty: "easy", seed: "hint" });
    let state = createInitialSudokuState(puzzle);
    state = applyHint(state);
    expect(state.hintsUsed).toBe(1);
    state = { ...state, values: [...puzzle.solution] };
    expect(isPuzzleComplete(state)).toBe(true);
  });
});
