"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GameDefinition } from "../domain/game";

const STORAGE_KEY = "darma:games:activity:v1";
const MAX_RECENT = 8;
const MAX_FAVORITES = 50;

type StoredGameActivity = {
  favorites: string[];
  recentlyPlayed: string[];
  playCounts: Record<string, number>;
  lastPlayedAt: Record<string, string>;
};

const EMPTY_ACTIVITY: StoredGameActivity = {
  favorites: [],
  recentlyPlayed: [],
  playCounts: {},
  lastPlayedAt: {},
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function uniqueSlugs(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))).slice(0, limit);
}

function normalizeRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, item]) => key.length > 0 && typeof item === "number" && Number.isFinite(item) && item > 0)
      .map(([key, item]) => [key, item as number]),
  );
}

function normalizeDateRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, item]) => key.length > 0 && typeof item === "string" && item.length > 0)
      .map(([key, item]) => [key, item as string]),
  );
}

function normalizeActivity(value: Partial<StoredGameActivity> | null | undefined): StoredGameActivity {
  return {
    favorites: uniqueSlugs(value?.favorites, MAX_FAVORITES),
    recentlyPlayed: uniqueSlugs(value?.recentlyPlayed, MAX_RECENT),
    playCounts: normalizeRecord(value?.playCounts),
    lastPlayedAt: normalizeDateRecord(value?.lastPlayedAt),
  };
}

function readActivity(): StoredGameActivity {
  if (!canUseStorage()) return EMPTY_ACTIVITY;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ACTIVITY;
    return normalizeActivity(JSON.parse(raw) as Partial<StoredGameActivity>);
  } catch {
    return EMPTY_ACTIVITY;
  }
}

function writeActivity(activity: StoredGameActivity) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activity));
  } catch {
    // LocalStorage can be blocked or full. The games UI should keep working.
  }
}

function byLastPlayed(activity: StoredGameActivity) {
  return (a: GameDefinition, b: GameDefinition) => {
    const aTime = activity.lastPlayedAt[a.slug] ?? "";
    const bTime = activity.lastPlayedAt[b.slug] ?? "";
    return bTime.localeCompare(aTime);
  };
}

function byPlayCount(activity: StoredGameActivity) {
  return (a: GameDefinition, b: GameDefinition) => {
    const countDiff = (activity.playCounts[b.slug] ?? 0) - (activity.playCounts[a.slug] ?? 0);
    if (countDiff !== 0) return countDiff;
    return byLastPlayed(activity)(a, b);
  };
}

export function useGameActivity(games: GameDefinition[] = []) {
  const [activity, setActivity] = useState<StoredGameActivity>(EMPTY_ACTIVITY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setActivity(readActivity());
    setHydrated(true);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setActivity(readActivity());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updateActivity = useCallback((updater: (current: StoredGameActivity) => StoredGameActivity) => {
    setActivity((current) => {
      const next = normalizeActivity(updater(current));
      writeActivity(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (slug: string) => activity.favorites.includes(slug),
    [activity.favorites],
  );

  const toggleFavorite = useCallback(
    (slug: string) => {
      updateActivity((current) => {
        const favoriteSet = new Set(current.favorites);
        if (favoriteSet.has(slug)) favoriteSet.delete(slug);
        else favoriteSet.add(slug);

        return {
          ...current,
          favorites: Array.from(favoriteSet).slice(0, MAX_FAVORITES),
        };
      });
    },
    [updateActivity],
  );

  const recordPlay = useCallback(
    (slug: string) => {
      updateActivity((current) => {
        const recent = [slug, ...current.recentlyPlayed.filter((item) => item !== slug)].slice(0, MAX_RECENT);
        return {
          ...current,
          recentlyPlayed: recent,
          playCounts: {
            ...current.playCounts,
            [slug]: (current.playCounts[slug] ?? 0) + 1,
          },
          lastPlayedAt: {
            ...current.lastPlayedAt,
            [slug]: new Date().toISOString(),
          },
        };
      });
    },
    [updateActivity],
  );

  const clearActivity = useCallback(() => {
    updateActivity(() => EMPTY_ACTIVITY);
  }, [updateActivity]);

  const bySlug = useMemo(() => new Map(games.map((game) => [game.slug, game])), [games]);

  const favoriteGames = useMemo(
    () => activity.favorites.map((slug) => bySlug.get(slug)).filter((game): game is GameDefinition => Boolean(game)),
    [activity.favorites, bySlug],
  );

  const recentlyPlayedGames = useMemo(
    () => activity.recentlyPlayed.map((slug) => bySlug.get(slug)).filter((game): game is GameDefinition => Boolean(game)),
    [activity.recentlyPlayed, bySlug],
  );

  const mostPlayedGames = useMemo(
    () => games.filter((game) => (activity.playCounts[game.slug] ?? 0) > 0).sort(byPlayCount(activity)).slice(0, 6),
    [activity, games],
  );

  const continueGame = recentlyPlayedGames[0];

  return {
    hydrated,
    activity,
    favoriteGames,
    recentlyPlayedGames,
    mostPlayedGames,
    continueGame,
    isFavorite,
    toggleFavorite,
    recordPlay,
    clearActivity,
  };
}
