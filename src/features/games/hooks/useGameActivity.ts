"use client";

import { useCallback, useMemo } from "react";
import {
  clearCoreActivityKinds,
  isCoreFavorite,
  recordCoreActivity,
  toCoreActivityRef,
  toggleCoreFavorite,
  useCoreActivity,
} from "@/core";
import type { GameDefinition } from "../domain/game";
import { toGameCoreEntity } from "../lib/gameCoreAdapter";

const MAX_RECENT = 8;
const GAME_KINDS = ["game"] as const;

/**
 * Games activity is now one slice of the shared Core activity store, so a game
 * opened from global search and a game played from the games hub are the same
 * event. The stored shape below is derived for the existing games UI, which
 * still reads slug-keyed favorites, recents, play counts, and timestamps.
 */
type StoredGameActivity = {
  favorites: string[];
  recentlyPlayed: string[];
  playCounts: Record<string, number>;
  lastPlayedAt: Record<string, string>;
};

export function useGameActivity(games: GameDefinition[] = []) {
  const { state, hydrated } = useCoreActivity(GAME_KINDS);

  const bySlug = useMemo(() => new Map(games.map((game) => [game.slug, game])), [games]);
  const slugById = useMemo(() => new Map(games.map((game) => [game.id, game.slug])), [games]);

  const entityRefForSlug = useCallback(
    (slug: string) => {
      const game = bySlug.get(slug);
      return game ? toCoreActivityRef(toGameCoreEntity(game)) : null;
    },
    [bySlug],
  );

  const activity = useMemo<StoredGameActivity>(() => {
    const playEvents = state.events
      .filter((event) => event.entityKind === "game" && event.type === "play")
      .sort((a, b) => b.at - a.at);

    const recentlyPlayed: string[] = [];
    const playCounts: Record<string, number> = {};
    const lastPlayedAt: Record<string, string> = {};

    for (const event of playEvents) {
      const slug = slugById.get(event.entityId) ?? state.entities[`game:${event.entityId}`]?.href.split("/").pop();
      if (!slug) continue;
      playCounts[slug] = (playCounts[slug] ?? 0) + 1;
      if (!lastPlayedAt[slug]) lastPlayedAt[slug] = new Date(event.at).toISOString();
      if (!recentlyPlayed.includes(slug) && recentlyPlayed.length < MAX_RECENT) recentlyPlayed.push(slug);
    }

    const favorites = state.favorites
      .map((key) => state.entities[key])
      .filter((entity) => entity?.kind === "game")
      .map((entity) => slugById.get(entity.id) ?? entity.href.split("/").pop() ?? "")
      .filter(Boolean);

    return { favorites, recentlyPlayed, playCounts, lastPlayedAt };
  }, [slugById, state]);

  const isFavorite = useCallback((slug: string) => {
    const game = bySlug.get(slug);
    return game ? isCoreFavorite(state, { id: game.id, kind: "game" }) : false;
  }, [bySlug, state]);

  const toggleFavorite = useCallback(
    (slug: string) => {
      const ref = entityRefForSlug(slug);
      if (ref) toggleCoreFavorite(ref);
    },
    [entityRefForSlug],
  );

  const recordPlay = useCallback(
    (slug: string) => {
      const ref = entityRefForSlug(slug);
      if (ref) recordCoreActivity(ref, "play");
    },
    [entityRefForSlug],
  );

  /** Clears games only — never the rest of the visitor's Darma history. */
  const clearActivity = useCallback(() => clearCoreActivityKinds(GAME_KINDS), []);

  const favoriteGames = useMemo(
    () => activity.favorites.map((slug) => bySlug.get(slug)).filter((game): game is GameDefinition => Boolean(game)),
    [activity.favorites, bySlug],
  );

  const recentlyPlayedGames = useMemo(
    () => activity.recentlyPlayed.map((slug) => bySlug.get(slug)).filter((game): game is GameDefinition => Boolean(game)),
    [activity.recentlyPlayed, bySlug],
  );

  const mostPlayedGames = useMemo(
    () =>
      games
        .filter((game) => (activity.playCounts[game.slug] ?? 0) > 0)
        .sort((a, b) => {
          const countDiff = (activity.playCounts[b.slug] ?? 0) - (activity.playCounts[a.slug] ?? 0);
          if (countDiff !== 0) return countDiff;
          return (activity.lastPlayedAt[b.slug] ?? "").localeCompare(activity.lastPlayedAt[a.slug] ?? "");
        })
        .slice(0, 6),
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
