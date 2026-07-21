import { describe, expect, it } from "vitest";
import {
  beginPointTransaction,
  commitPointEdit,
  createPointHistoryState,
  endPointTransaction,
  redoPointEdit,
  undoPointEdit,
  updatePointTransaction,
} from "./usePointHistory";
import type { ClipPoint } from "../types";

const INITIAL: ClipPoint[] = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 50, y: 100 },
];

function moved(x: number): ClipPoint[] {
  return [{ x, y: 0 }, INITIAL[1], INITIAL[2]];
}

describe("point history helpers", () => {
  it("supports undo and redo", () => {
    let state = createPointHistoryState(INITIAL);
    state = commitPointEdit(state, moved(10));
    state = undoPointEdit(state);
    expect(state.present).toEqual(INITIAL);
    state = redoPointEdit(state);
    expect(state.present).toEqual(moved(10));
  });

  it("clears redo after a new edit", () => {
    let state = commitPointEdit(createPointHistoryState(INITIAL), moved(10));
    state = undoPointEdit(state);
    expect(state.future).toHaveLength(1);
    state = commitPointEdit(state, moved(20));
    expect(state.future).toHaveLength(0);
  });

  it("does not create history for a no-op", () => {
    const state = createPointHistoryState(INITIAL);
    expect(commitPointEdit(state, INITIAL)).toBe(state);
    expect(state.past).toHaveLength(0);
  });

  it("honors the explicit history limit", () => {
    let state = createPointHistoryState(INITIAL);
    state = commitPointEdit(state, moved(10), 2);
    state = commitPointEdit(state, moved(20), 2);
    state = commitPointEdit(state, moved(30), 2);
    expect(state.past).toHaveLength(2);
    expect(state.past[0]).toEqual(moved(10));
  });

  it("records an entire pointer drag as one transaction", () => {
    let state = beginPointTransaction(createPointHistoryState(INITIAL));
    state = updatePointTransaction(state, moved(10));
    state = updatePointTransaction(state, moved(20));
    state = updatePointTransaction(state, moved(30));
    expect(state.past).toHaveLength(0);
    state = endPointTransaction(state);
    expect(state.past).toHaveLength(1);
    expect(undoPointEdit(state).present).toEqual(INITIAL);
  });

  it("does not record a transaction with no movement", () => {
    let state = beginPointTransaction(createPointHistoryState(INITIAL));
    state = endPointTransaction(state);
    expect(state.past).toHaveLength(0);
  });
});
