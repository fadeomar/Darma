"use client";

import { useMemo, useState } from "react";
import { Button, EmptyState } from "@/components/ui";
import {
  PLAY_TIME_MINUTES,
  type GameDefinition,
} from "../domain/game";
import { filterAndSortGames } from "../lib/filterGames";
import { GameCard } from "./GameCard";
import { GameCategoryChips, type GameFilter } from "./GameCategoryChips";
import { GameHero } from "./GameHero";
import { GameSearchBar } from "./GameSearchBar";
import { GameSection } from "./GameSection";
import { GameSortSelect, type GameSort } from "./GameSortSelect";

export function GamesDirectory({ games }: { games: GameDefinition[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<GameFilter>("all");
  const [sort, setSort] = useState<GameSort>("featured");

  const hasFilters = query.trim().length > 0 || filter !== "all";
  const showDashboard = !hasFilters && sort === "featured";

  const featured = useMemo(
    () => filterAndSortGames(games, "", "featured", "featured").slice(0, 3),
    [games],
  );

  const quickBreaks = useMemo(
    () => filterAndSortGames(games, "", "all", "featured").filter((game) => PLAY_TIME_MINUTES[game.playTime] <= 5),
    [games],
  );

  const classics = useMemo(
    () => filterAndSortGames(games, "", "classic", "featured"),
    [games],
  );

  const results = useMemo(
    () => filterAndSortGames(games, query, filter, sort),
    [games, query, filter, sort],
  );

  const resetAll = () => {
    setQuery("");
    setFilter("all");
    setSort("featured");
  };

  return (
    <div className="mx-auto max-w-[var(--container-wide)] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      {/* Hero + controls */}
      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]">
        <div className="p-5 sm:p-7 lg:p-8">
          <GameHero />
        </div>

        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 p-4 sm:p-5">
          <div className="space-y-4">
            <GameSearchBar value={query} onChange={setQuery} />
            <GameCategoryChips active={filter} onChange={setFilter} />
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

      {/* Curated dashboard sections (only when nothing is filtered) */}
      {showDashboard ? (
        <>
          <GameSection
            eyebrow="Curated"
            title="Featured games"
            subtitle="Hand-picked games for a quick fun break."
            games={featured}
            featured
          />
          <GameSection
            eyebrow="Fast"
            title="Quick breaks"
            subtitle="Short games you can finish in five minutes or less."
            games={quickBreaks}
          />
          <GameSection
            eyebrow="Timeless"
            title="Classics"
            subtitle="The games everyone already knows how to play."
            games={classics}
          />
        </>
      ) : null}

      {/* All games / results */}
      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
            {hasFilters ? "Results" : "All games"}
          </h2>
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
