"use client";

import { useCallback, useMemo, useState } from "react";
import { normalizeGridState } from "./grid";
import type { GridGeneratorState } from "./types";

type GridHistory = {
  past: GridGeneratorState[];
  present: GridGeneratorState;
  future: GridGeneratorState[];
};

type StateUpdater =
  | GridGeneratorState
  | ((current: GridGeneratorState) => GridGeneratorState);

const HISTORY_LIMIT = 50;

function resolveState(
  updater: StateUpdater,
  current: GridGeneratorState,
): GridGeneratorState {
  const next = typeof updater === "function" ? updater(current) : updater;
  return normalizeGridState(next);
}

function stateEquals(first: GridGeneratorState, second: GridGeneratorState) {
  return JSON.stringify(first) === JSON.stringify(second);
}

export function useGridHistory(initialState: () => GridGeneratorState) {
  const [history, setHistory] = useState<GridHistory>(() => ({
    past: [],
    present: normalizeGridState(initialState()),
    future: [],
  }));

  const commit = useCallback((updater: StateUpdater) => {
    setHistory((current) => {
      const next = resolveState(updater, current.present);
      if (stateEquals(next, current.present)) return current;

      return {
        past: [...current.past.slice(-(HISTORY_LIMIT - 1)), current.present],
        present: next,
        future: [],
      };
    });
  }, []);

  const updateView = useCallback((updater: StateUpdater) => {
    setHistory((current) => {
      const next = resolveState(updater, current.present);
      if (stateEquals(next, current.present)) return current;
      return { ...current, present: next };
    });
  }, []);

  const replace = useCallback((next: GridGeneratorState) => {
    setHistory({ past: [], present: normalizeGridState(next), future: [] });
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      const previous = current.past.at(-1);
      if (!previous) return current;

      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      const next = current.future[0];
      if (!next) return current;

      return {
        past: [...current.past, current.present].slice(-HISTORY_LIMIT),
        present: next,
        future: current.future.slice(1),
      };
    });
  }, []);

  return useMemo(
    () => ({
      state: history.present,
      commit,
      updateView,
      replace,
      undo,
      redo,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
    }),
    [commit, history, redo, replace, undo, updateView],
  );
}
