"use client";

import Link from "next/link";
import { Clock3, Heart, RotateCcw, Trophy } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { GameDefinition } from "../domain/game";
import { useGameActivity } from "../hooks/useGameActivity";
import { GameCard } from "./GameCard";
import { GamePlayLink } from "./GamePlayLink";
import { GameThumbnail } from "./GameThumbnail";

function MiniGameRow({ game, meta }: { game: GameDefinition; meta: string }) {
  return (
    <Link
      href={game.href}
      className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-2.5 transition hover:border-[var(--color-border-strong)] focus:outline-none focus-visible:shadow-[var(--focus-ring)]"
    >
      <div className="w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)]">
        <GameThumbnail game={game} aspect="16/9" size="sm" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-[var(--color-text-primary)]">{game.title}</p>
        <p className="mt-0.5 truncate font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{meta}</p>
      </div>
    </Link>
  );
}

export function GamePersonalizationPanel({ games }: { games: GameDefinition[] }) {
  const {
    hydrated,
    favoriteGames,
    recentlyPlayedGames,
    mostPlayedGames,
    continueGame,
    clearActivity,
  } = useGameActivity(games);

  if (!hydrated) {
    return null;
  }

  const hasActivity = favoriteGames.length > 0 || recentlyPlayedGames.length > 0 || mostPlayedGames.length > 0;

  if (!hasActivity) {
    return (
      <section className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-primary)]">Personal play space</p>
            <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Save games and build your quick list.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
              Favorites and recently played games stay in this browser only. No account, no backend, and no personal tracking.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 text-xs font-bold text-[var(--color-text-secondary)]">
            <Heart className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            Local only
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="game-personal-panel mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-primary)]">Your games</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Pick up where you left off</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
            Stored locally in your browser so Darma Games stays private and account-free.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={clearActivity}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset local activity
        </Button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_0.85fr]">
        {continueGame ? (
          <Card variant="default" padding="none" className="overflow-hidden">
            <div className="grid gap-4 p-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:p-5">
              <div className="overflow-hidden rounded-[var(--radius-md)]">
                <GameThumbnail game={continueGame} aspect="4/3" size="lg" />
              </div>
              <div className="flex min-w-0 flex-col justify-center">
                <div className="inline-flex w-fit items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-surface-base)] px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-primary)]">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden />
                  Continue playing
                </div>
                <h3 className="mt-3 text-2xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">{continueGame.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]">{continueGame.description}</p>
                <div className="mt-4">
                  <GamePlayLink game={continueGame}>Continue</GamePlayLink>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        <div className="grid gap-3">
          {favoriteGames.slice(0, 3).map((game) => (
            <MiniGameRow key={game.id} game={game} meta="Favorite" />
          ))}
          {recentlyPlayedGames.slice(0, Math.max(0, 3 - favoriteGames.slice(0, 3).length)).map((game) => (
            <MiniGameRow key={game.id} game={game} meta="Recently played" />
          ))}
        </div>
      </div>

      {mostPlayedGames.length > 0 ? (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            <h3 className="text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Most played locally</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mostPlayedGames.slice(0, 3).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
