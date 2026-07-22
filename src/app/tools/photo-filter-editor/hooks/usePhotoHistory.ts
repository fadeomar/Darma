"use client";

import { useCallback, useRef, useState } from "react";
import {
  PHOTO_HISTORY_LIMIT,
  clonePhotoState,
  commitPhotoHistory,
  photoStateEqual,
  pushHistoryEntry,
} from "../lib/history";
import type { PhotoEditState } from "../types";

export { PHOTO_HISTORY_LIMIT, commitPhotoHistory, photoStateEqual, pushHistoryEntry } from "../lib/history";

export function usePhotoHistory(initial: PhotoEditState) {
  const [state, setState] = useState(() => clonePhotoState(initial));
  const [past, setPast] = useState<PhotoEditState[]>([]);
  const [future, setFuture] = useState<PhotoEditState[]>([]);
  const stateRef = useRef(state);
  const pastRef = useRef<PhotoEditState[]>([]);
  const futureRef = useRef<PhotoEditState[]>([]);
  const transactionStartRef = useRef<PhotoEditState | null>(null);

  const setCurrent = useCallback((next: PhotoEditState) => {
    const cloned = clonePhotoState(next);
    stateRef.current = cloned;
    setState(cloned);
  }, []);

  const replacePast = useCallback((next: PhotoEditState[]) => {
    pastRef.current = next;
    setPast(next);
  }, []);

  const replaceFuture = useCallback((next: PhotoEditState[]) => {
    futureRef.current = next;
    setFuture(next);
  }, []);

  const apply = useCallback((nextOrUpdater: PhotoEditState | ((current: PhotoEditState) => PhotoEditState)) => {
    const current = stateRef.current;
    const next = typeof nextOrUpdater === "function" ? nextOrUpdater(clonePhotoState(current)) : nextOrUpdater;
    if (photoStateEqual(current, next)) return false;
    replacePast(pushHistoryEntry(pastRef.current, current));
    replaceFuture([]);
    transactionStartRef.current = null;
    setCurrent(next);
    return true;
  }, [replaceFuture, replacePast, setCurrent]);

  const beginTransaction = useCallback(() => {
    if (!transactionStartRef.current) transactionStartRef.current = clonePhotoState(stateRef.current);
  }, []);

  const updateTransaction = useCallback((nextOrUpdater: PhotoEditState | ((current: PhotoEditState) => PhotoEditState)) => {
    if (!transactionStartRef.current) transactionStartRef.current = clonePhotoState(stateRef.current);
    const current = stateRef.current;
    const next = typeof nextOrUpdater === "function" ? nextOrUpdater(clonePhotoState(current)) : nextOrUpdater;
    setCurrent(next);
  }, [setCurrent]);

  const commitTransaction = useCallback(() => {
    const start = transactionStartRef.current;
    transactionStartRef.current = null;
    if (!start) return false;
    const result = commitPhotoHistory(pastRef.current, futureRef.current, start, stateRef.current);
    if (!result.changed) return false;
    replacePast(result.past);
    replaceFuture(result.future);
    return true;
  }, [replaceFuture, replacePast]);

  const cancelTransaction = useCallback(() => {
    const start = transactionStartRef.current;
    transactionStartRef.current = null;
    if (start) setCurrent(start);
  }, [setCurrent]);

  const undo = useCallback(() => {
    transactionStartRef.current = null;
    const previous = pastRef.current.at(-1);
    if (!previous) return false;
    replacePast(pastRef.current.slice(0, -1));
    replaceFuture([clonePhotoState(stateRef.current), ...futureRef.current].slice(0, PHOTO_HISTORY_LIMIT));
    setCurrent(previous);
    return true;
  }, [replaceFuture, replacePast, setCurrent]);

  const redo = useCallback(() => {
    transactionStartRef.current = null;
    const next = futureRef.current[0];
    if (!next) return false;
    replacePast(pushHistoryEntry(pastRef.current, stateRef.current));
    replaceFuture(futureRef.current.slice(1));
    setCurrent(next);
    return true;
  }, [replaceFuture, replacePast, setCurrent]);

  const reset = useCallback((next: PhotoEditState) => {
    transactionStartRef.current = null;
    replacePast([]);
    replaceFuture([]);
    setCurrent(next);
  }, [replaceFuture, replacePast, setCurrent]);

  return {
    state,
    apply,
    beginTransaction,
    updateTransaction,
    commitTransaction,
    cancelTransaction,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
