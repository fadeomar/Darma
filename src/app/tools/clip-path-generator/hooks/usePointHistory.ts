import { useCallback, useState } from "react";
import { clonePoints, pointsEqual } from "../clipPath";
import type { ClipPoint } from "../types";

export const POINT_HISTORY_LIMIT = 50;

export type PointHistoryState = {
  present: ClipPoint[];
  past: ClipPoint[][];
  future: ClipPoint[][];
  transactionStart: ClipPoint[] | null;
};

export function createPointHistoryState(points: ClipPoint[]): PointHistoryState {
  return { present: clonePoints(points), past: [], future: [], transactionStart: null };
}

function pushLimited(history: ClipPoint[][], points: ClipPoint[], limit = POINT_HISTORY_LIMIT): ClipPoint[][] {
  const next = [...history, clonePoints(points)];
  return next.length > limit ? next.slice(next.length - limit) : next;
}

export function commitPointEdit(
  state: PointHistoryState,
  nextPoints: ClipPoint[],
  limit = POINT_HISTORY_LIMIT,
): PointHistoryState {
  if (pointsEqual(state.present, nextPoints)) return state;
  return {
    present: clonePoints(nextPoints),
    past: pushLimited(state.past, state.present, limit),
    future: [],
    transactionStart: null,
  };
}

export function beginPointTransaction(state: PointHistoryState): PointHistoryState {
  if (state.transactionStart) return state;
  return { ...state, transactionStart: clonePoints(state.present) };
}

export function updatePointTransaction(state: PointHistoryState, nextPoints: ClipPoint[]): PointHistoryState {
  if (!state.transactionStart) return commitPointEdit(state, nextPoints);
  if (pointsEqual(state.present, nextPoints)) return state;
  return { ...state, present: clonePoints(nextPoints) };
}

export function endPointTransaction(
  state: PointHistoryState,
  limit = POINT_HISTORY_LIMIT,
): PointHistoryState {
  if (!state.transactionStart) return state;
  if (pointsEqual(state.transactionStart, state.present)) return { ...state, transactionStart: null };
  return {
    present: state.present,
    past: pushLimited(state.past, state.transactionStart, limit),
    future: [],
    transactionStart: null,
  };
}

export function undoPointEdit(state: PointHistoryState): PointHistoryState {
  if (state.past.length === 0) return state;
  const previous = state.past[state.past.length - 1];
  return {
    present: clonePoints(previous),
    past: state.past.slice(0, -1),
    future: [clonePoints(state.present), ...state.future],
    transactionStart: null,
  };
}

export function redoPointEdit(state: PointHistoryState): PointHistoryState {
  if (state.future.length === 0) return state;
  const next = state.future[0];
  return {
    present: clonePoints(next),
    past: pushLimited(state.past, state.present),
    future: state.future.slice(1),
    transactionStart: null,
  };
}

export function usePointHistory(initialPoints: ClipPoint[]) {
  const [history, setHistory] = useState(() => createPointHistoryState(initialPoints));

  const commit = useCallback((nextPoints: ClipPoint[]) => {
    setHistory((current) => commitPointEdit(current, nextPoints));
  }, []);

  const beginTransaction = useCallback(() => {
    setHistory(beginPointTransaction);
  }, []);

  const updateTransaction = useCallback((updater: (points: ClipPoint[]) => ClipPoint[]) => {
    setHistory((current) => updatePointTransaction(current, updater(current.present)));
  }, []);

  const endTransaction = useCallback(() => {
    setHistory(endPointTransaction);
  }, []);

  const undo = useCallback(() => {
    setHistory(undoPointEdit);
  }, []);

  const redo = useCallback(() => {
    setHistory(redoPointEdit);
  }, []);

  const resetHistory = useCallback((points: ClipPoint[]) => {
    setHistory(createPointHistoryState(points));
  }, []);

  return {
    points: history.present,
    commit,
    beginTransaction,
    updateTransaction,
    endTransaction,
    undo,
    redo,
    resetHistory,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
