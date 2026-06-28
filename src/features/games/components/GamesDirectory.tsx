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
import { GameCoreBridgePanel } from "./GameCoreBridgePanel";
import { GameCollectionRail } from "./GameCollectionRail";
import { GameDiscoveryPanel } from "./GameDiscoveryPanel";
import { GameHero } from "./GameHero";
import { GameIdentityBand } from "./GameIdentityBand";
import { GameMoodBoard } from "./GameMoodBoard";
import { GamePersonalizationPanel } from "./GamePersonalizationPanel";
import { GameProductionChecklist } from "./GameProductionChecklist";
import { GameSpotlight } from "./GameSpotlight";
import { GameSearchBar } from "./GameSearchBar";
import { GameSection } from "./GameSection";
import { GameSortSelect, type GameSort } from "./GameSortSelect";
import { CollectionFrameworkBanner, CollectionHealthPanel, getCollectionById, getPlannedCollections, toCollectionItems } from "@/features/collections";

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

  const recentlyAdded = useMemo(
    () => [...games].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 4),
    [games],
  );

  const trending = useMemo(
    () => filterAndSortGames(games, "", "popular", "featured").slice(0, 4),
    [games],
  );

  const brainBoosters = useMemo(
    () => filterAndSortGames(games, "", "brain", "featured").slice(0, 6),
    [games],
  );

  const playTogether = useMemo(
    () => filterAndSortGames(games, "", "2-players", "featured").slice(0, 6),
    [games],
  );

  const touchFriendly = useMemo(
    () => filterAndSortGames(games, "", "mobile-friendly", "featured").slice(0, 6),
    [games],
  );

  const surpriseGame = useMemo(
    () => games.find((game) => game.slug === "reaction-timer") ?? games[0],
    [games],
  );

  const gamesCollection = getCollectionById("games");
  const plannedCollections = getPlannedCollections();
  const collectionItems = useMemo(() => toCollectionItems(games), [games]);

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
      {/* Hero + controls */}
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

      {/* Curated dashboard sections (only when nothing is filtered) */}
      {showDashboard ? (
        <>
          {gamesCollection ? (
            <CollectionFrameworkBanner collection={gamesCollection} siblingCollections={plannedCollections} />
          ) : null}
          <GameIdentityBand games={games} />
          <GamePersonalizationPanel games={games} />
          <GameDiscoveryPanel games={games} surpriseGame={surpriseGame} trendingGame={trending[0]} />
          <GameSpotlight games={games} />
          <GameMoodBoard games={games} onSelectFilter={setFilter} />
          <GameSection
            eyebrow="Curated"
            title="Featured games"
            subtitle="Hand-picked games for a quick fun break."
            games={featured}
            featured
          />
          <GameCollectionRail
            eyebrow="Trending"
            title="Trending today"
            subtitle="Popular picks with strong quick-play energy."
            games={trending}
          />
          <GameCollectionRail
            eyebrow="Brain"
            title="Brain boosters"
            subtitle="Logic, memory, word, and strategy games for focused play."
            games={brainBoosters}
          />
          <GameCollectionRail
            eyebrow="Together"
            title="Play together"
            subtitle="Same-device games that work well with a friend."
            games={playTogether}
          />
          <GameCollectionRail
            eyebrow="Mobile"
            title="Touch friendly"
            subtitle="Games that are comfortable on phones and tablets."
            games={touchFriendly}
          />
          <GameSection
            eyebrow="Fast"
            title="Quick breaks"
            subtitle="Short games you can finish in five minutes or less."
            games={quickBreaks}
          />
          <GameSection
            eyebrow="New"
            title="Recently added"
            subtitle="Fresh game ideas ready for the next playable phase."
            games={recentlyAdded}
          />
          <GameSection
            eyebrow="Timeless"
            title="Classics"
            subtitle="The games everyone already knows how to play."
            games={classics}
          />
          {gamesCollection ? <CollectionHealthPanel collection={gamesCollection} items={collectionItems} /> : null}
          <GameCoreBridgePanel games={games} />
          <GameProductionChecklist />
        </>
      ) : null}

      {/* All games / results */}
      <section id="games-results" className="mt-8 scroll-mt-24" aria-labelledby="games-results-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id="games-results-title" className="text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
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
