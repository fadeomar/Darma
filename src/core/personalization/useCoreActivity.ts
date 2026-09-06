"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { CoreEntityKind } from "../registry";
import {
  getCoreActivityServerSnapshot,
  getCoreActivitySnapshot,
  getRecentCoreEntities,
  subscribeCoreActivity,
} from "./activityStore";

/*
 * `hydrated` must stay false through the hydration render, otherwise a
 * consumer that gates on it renders different markup than the server did.
 * `useSyncExternalStore` returns the server snapshot for both passes and
 * re-renders once hydration completes, which is exactly that signal.
 */
const subscribeNoop = () => () => {};
const getHydratedSnapshot = () => true;
const getHydratedServerSnapshot = () => false;

export function useCoreActivity(kinds?: readonly CoreEntityKind[]) {
  const state = useSyncExternalStore(subscribeCoreActivity, getCoreActivitySnapshot, getCoreActivityServerSnapshot);
  const hydrated = useSyncExternalStore(subscribeNoop, getHydratedSnapshot, getHydratedServerSnapshot);
  const recent = useMemo(() => getRecentCoreEntities(state, 12, kinds), [kinds, state]);
  const favorites = useMemo(
    () => state.favorites.map((key) => state.entities[key]).filter(Boolean).filter((entity) => !kinds || kinds.includes(entity.kind)),
    [kinds, state],
  );
  return { state, recent, favorites, hydrated };
}
