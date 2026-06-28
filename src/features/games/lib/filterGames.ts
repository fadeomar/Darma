import {
  DIFFICULTY_ORDER,
  PLAY_TIME_MINUTES,
  type GameDefinition,
} from "../domain/game";
import type { GameFilter } from "../components/GameCategoryChips";
import type { GameSort } from "../components/GameSortSelect";

export function searchableText(game: GameDefinition) {
  return [
    game.title,
    game.description,
    game.longDescription,
    ...game.tags,
    ...game.categories,
  ]
    .join(" ")
    .toLowerCase();
}

export function matchesFilter(game: GameDefinition, filter: GameFilter) {
  if (filter === "all") return true;
  if (filter === "featured") return Boolean(game.featured);
  if (filter === "popular") return Boolean(game.popular);
  if (filter === "new") return Boolean(game.isNew);
  return game.categories.includes(filter);
}

export function sortGames(games: GameDefinition[], sort: GameSort) {
  return [...games].sort((a, b) => {
    if (sort === "az") return a.title.localeCompare(b.title);
    if (sort === "newest") {
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "") || a.title.localeCompare(b.title);
    }
    if (sort === "short-play") {
      return (
        PLAY_TIME_MINUTES[a.playTime] - PLAY_TIME_MINUTES[b.playTime] ||
        a.title.localeCompare(b.title)
      );
    }
    if (sort === "easy-first") {
      return (
        DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] ||
        a.title.localeCompare(b.title)
      );
    }
    // featured first
    const featuredCompare = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    return featuredCompare || (a.pinned ?? 999) - (b.pinned ?? 999) || a.title.localeCompare(b.title);
  });
}

export function filterAndSortGames(
  games: GameDefinition[],
  query: string,
  filter: GameFilter,
  sort: GameSort,
) {
  const q = query.trim().toLowerCase();
  const matches = games.filter((game) => {
    const filterMatch = matchesFilter(game, filter);
    const queryMatch = !q || searchableText(game).includes(q);
    return filterMatch && queryMatch;
  });
  return sortGames(matches, sort);
}
