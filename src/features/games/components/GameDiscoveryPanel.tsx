"use client";

import Link from "next/link";
import { Dices, Flame, Sparkles, Trophy } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameDefinition } from "../domain/game";

const statItems = [
  { label: "Free games", icon: Sparkles },
  { label: "No signup", icon: Trophy },
  { label: "Quick breaks", icon: Flame },
];

export function GameDiscoveryPanel({
  games,
  surpriseGame,
  trendingGame,
}: {
  games: GameDefinition[];
  surpriseGame: GameDefinition;
  trendingGame?: GameDefinition;
}) {
  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card
        variant="default"
        padding="none"
        className="overflow-hidden border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)]"
      >
        <div className="relative p-4 sm:p-5">
          <div className="game-soft-orb game-soft-orb-a" aria-hidden />
          <div className="relative grid gap-3 sm:grid-cols-3">
            {statItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 p-4 shadow-[var(--shadow-xs)]",
                    "transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                  )}
                >
                  <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
                    <Icon className="h-4 w-4" aria-hidden />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em]">
                      {item.label}
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
                    {index === 0 ? games.length : index === 1 ? "0 friction" : "1–5 min"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Card
        variant="default"
        padding="none"
        className="overflow-hidden border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)]"
      >
        <div className="relative flex h-full flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="game-soft-orb game-soft-orb-b" aria-hidden />
          <div className="relative min-w-0">
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              <Dices className="h-4 w-4" aria-hidden />
              Pick for me
            </div>
            <p className="mt-2 text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
              Not sure what to play?
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
              Try {trendingGame ? <span className="font-bold text-[var(--color-text-primary)]">{trendingGame.title}</span> : "a featured game"} or jump into a surprise.
            </p>
          </div>
          <Link
            href={`${surpriseGame.href}#player`}
            className="relative z-10 inline-flex min-h-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-transparent bg-[var(--color-primary)] px-3 text-xs font-semibold leading-none text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)] focus:outline-none focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none"
          >
            Surprise me
          </Link>
        </div>
      </Card>
    </section>
  );
}
