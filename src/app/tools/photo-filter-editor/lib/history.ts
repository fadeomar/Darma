import type { PhotoEditState } from "../types";

export const PHOTO_HISTORY_LIMIT = 60;

export function clonePhotoState(state: PhotoEditState): PhotoEditState {
  return {
    adjustments: { ...state.adjustments },
    crop: { ...state.crop },
    orientation: { ...state.orientation },
  };
}

export function photoStateEqual(a: PhotoEditState, b: PhotoEditState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function pushHistoryEntry(history: PhotoEditState[], state: PhotoEditState, limit = PHOTO_HISTORY_LIMIT): PhotoEditState[] {
  const next = [...history, clonePhotoState(state)];
  return next.length > limit ? next.slice(next.length - limit) : next;
}

export function commitPhotoHistory(
  past: PhotoEditState[],
  future: PhotoEditState[],
  start: PhotoEditState,
  current: PhotoEditState,
  limit = PHOTO_HISTORY_LIMIT,
): { past: PhotoEditState[]; future: PhotoEditState[]; changed: boolean } {
  if (photoStateEqual(start, current)) return { past, future, changed: false };
  return { past: pushHistoryEntry(past, start, limit), future: [], changed: true };
}
