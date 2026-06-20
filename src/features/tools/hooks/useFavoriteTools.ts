"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ToolId } from "@/features/tools/domain/tool";

const STORAGE_KEY = "darma:favorite-tools";
const FAVORITES_EVENT = "darma:favorite-tools-change";

function readFavoriteIds(): ToolId[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.filter((id): id is ToolId => typeof id === "string" && id.trim().length > 0)));
  } catch {
    return [];
  }
}

function writeFavoriteIds(ids: ToolId[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
    window.dispatchEvent(new Event(FAVORITES_EVENT));
  } catch {
    // Favorites are optional personalization; ignore unavailable storage.
  }
}

export function useFavoriteTools() {
  const [favoriteIds, setFavoriteIds] = useState<ToolId[]>([]);

  useEffect(() => {
    const syncFavorites = () => setFavoriteIds(readFavoriteIds());

    syncFavorites();
    window.addEventListener(FAVORITES_EVENT, syncFavorites);
    window.addEventListener("storage", syncFavorites);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, syncFavorites);
      window.removeEventListener("storage", syncFavorites);
    };
  }, []);

  const addFavorite = useCallback((toolId: ToolId) => {
    writeFavoriteIds([toolId, ...readFavoriteIds().filter((id) => id !== toolId)]);
  }, []);

  const removeFavorite = useCallback((toolId: ToolId) => {
    writeFavoriteIds(readFavoriteIds().filter((id) => id !== toolId));
  }, []);

  const toggleFavorite = useCallback((toolId: ToolId) => {
    const current = readFavoriteIds();
    writeFavoriteIds(current.includes(toolId) ? current.filter((id) => id !== toolId) : [toolId, ...current]);
  }, []);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const isFavorite = useCallback((toolId: ToolId) => favoriteSet.has(toolId), [favoriteSet]);

  return {
    favoriteToolIds: favoriteIds,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}
