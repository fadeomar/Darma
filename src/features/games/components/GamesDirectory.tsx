"use client";

import { useMemo, useState } from "react";
import { Button, EmptyState } from "@/components/ui";
import type { GameDefinition } from "../domain/game";
import { filterAndSortGames } from "../lib/filterGames";
import { GameCard } from "./GameCard";
import { GameCategoryChips, type GameFilter } from "./GameCategoryChips";
import { GameHero } from "./GameHero";
import { GameMoodBoard } from "./GameMoodBoard";
import { GamePersonalizationPanel } from "./GamePersonalizationPanel";
import { GameSearchBar } from "./GameSearchBar";
import { GameSection } from "./GameSection";
import { GameSortSelect, type GameSort } from "./GameSortSelect";

const FLAGSHIP_SLUGS = ["neon-core-defense", "reaction-timer", "math-sprint"];

export function GamesDirectory({ games }: { games: GameDefinition[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<GameFilter>("all");
  const [sort, setSort] = useState<GameSort>("featured");

  const hasFilters = query.trim().length > 0 || filter !== "all";
  const showDashboard = !hasFilters && sort === "featured";

  const flagshipGames = useMemo(() => {
    const bySlug = new Map(games.map((game) => [game.slug, game]));
    const selected = FLAGSHIP_SLUGS
      .map((slug) => bySlug.get(slug))
      .filter((game): game is GameDefinition => Boolean(game));

    if (selected.length === FLAGSHIP_SLUGS.length) return selected;

    const fallback = filterAndSortGames(games, "", "featured", "featured");
    return [...selected, ...fallback.filter((game) => !selected.some((item) => item.id === game.id))].slice(0, 3);
  }, [games]);

  const results = useMemo(
    () => filterAndSortGames(games, query, filter, sort),
    [games, query, filter, sort],
  );

  const resetAll = () => {
    setQuery("");
    setFilter("all");
    setSort("featured");
  };

  const activeSummary = hasFilters
    ? `Showing ${results.length} matching game${results.length === 1 ? "" : "s"}.`
    : `Showing all ${games.length} games.`;

  return (
    <div className="game-page-shell mx-auto max-w-[var(--container-wide)] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <a href="#games-results" className="game-skip-link">
        Skip to games results
      </a>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]">
        <div className="p-5 sm:p-7 lg:p-8">
          <GameHero />
        </div>

        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 p-4 sm:p-5">
          <div className="space-y-4">
            <GameSearchBar value={query} onChange={setQuery} describedBy="games-result-summary" />
            <GameCategoryChips active={filter} onChange={setFilter} />
            <p id="games-result-summary" className="sr-only" aria-live="polite">
              {activeSummary}
            </p>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="w-full sm:w-48">
                <GameSortSelect value={sort} onChange={setSort} />
              </div>
              <Button variant="secondary" size="sm" onClick={resetAll} disabled={!hasFilters && sort === "featured"}>
                Clear filters
              </Button>
            </div>
          </div>
        </div>
      </section>

      {showDashboard ? (
        <>
          <GamePersonalizationPanel games={games} />
          <GameSection
            eyebrow="Darma picks"
            title="Flagship games"
            subtitle="Three distinctive Darma experiences chosen for replay value, learning, and product identity."
            games={flagshipGames}
            featured
          />
          <GameMoodBoard games={games} onSelectFilter={setFilter} />
        </>
      ) : null}

      <section id="games-results" className="mt-8 scroll-mt-24" aria-labelledby="games-results-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-primary)]">Catalog</p>
            <h2 id="games-results-title" className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
              {hasFilters ? "Matching games" : "All games"}
            </h2>
          </div>
          <p
            className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]"
            aria-live="polite"
          >
            {results.length} of {games.length} game{results.length === 1 ? "" : "s"}
          </p>
        </div>

        {results.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {results.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No games found"
            description="Try a different keyword or clear the filters."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => setQuery("")} disabled={!query}>
                  Clear search
                </Button>
                <Button variant="primary" size="sm" onClick={resetAll}>
                  View all games
                </Button>
              </div>
            }
          />
        )}
      </section>
    </div>
  );
}
