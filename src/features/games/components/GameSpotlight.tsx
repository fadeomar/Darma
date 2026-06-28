import Link from "next/link";
import { ArrowRight, Gamepad2, Sparkles, Trophy } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { GameDefinition } from "../domain/game";
import { CATEGORY_LABELS, DIFFICULTY_LABELS, INPUT_LABELS } from "../domain/game";
import { GameThumbnail } from "./GameThumbnail";

function findBySlug(games: GameDefinition[], slug: string) {
  return games.find((game) => game.slug === slug);
}

export function GameSpotlight({ games }: { games: GameDefinition[] }) {
  const spotlight = findBySlug(games, "2048") ?? games.find((game) => game.featured) ?? games[0];
  const fastPick = games.find((game) => game.playTime === "1 min") ?? games[1];
  const friendPick = games.find((game) => game.categories.includes("2-players")) ?? games[2];
  const brainPick = games.find((game) => game.categories.includes("brain") && game.slug !== spotlight?.slug) ?? games[3];

  if (!spotlight) return null;

  const sidePicks = [fastPick, friendPick, brainPick].filter(
    (game): game is GameDefinition => Boolean(game) && game.slug !== spotlight.slug,
  ).slice(0, 3);

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="accent">Start here</Badge>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
            Today&apos;s spotlight
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
            A stronger entry point than a plain grid: one hero game, then three fast alternatives.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card
          as="article"
          variant="default"
          padding="none"
          className="group relative overflow-hidden border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)]"
        >
          <div className="game-soft-orb game-soft-orb-a" aria-hidden />
          <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
            <div className="relative min-h-full overflow-hidden">
              <GameThumbnail game={spotlight} aspect="4/3" size="lg" priority />
            </div>
            <div className="relative flex flex-col p-5 sm:p-6 lg:p-7">
              <div className="flex flex-wrap gap-2">
                {spotlight.popular ? <Badge variant="warning">Popular</Badge> : null}
                {spotlight.isNew ? <Badge variant="accent">New</Badge> : null}
                <Badge variant="soft">{CATEGORY_LABELS[spotlight.categories[0]]}</Badge>
              </div>

              <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-4xl">
                {spotlight.title}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
                {spotlight.longDescription}
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 p-3">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Time</p>
                  <p className="mt-1 font-bold text-[var(--color-text-primary)]">{spotlight.playTime}</p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 p-3">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Level</p>
                  <p className="mt-1 font-bold text-[var(--color-text-primary)]">{DIFFICULTY_LABELS[spotlight.difficulty]}</p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 p-3">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Input</p>
                  <p className="mt-1 truncate font-bold text-[var(--color-text-primary)]">
                    {INPUT_LABELS[spotlight.input[0]]}
                  </p>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap gap-3 pt-6">
                <Link
                  href={`${spotlight.href}#player`}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-bold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)] focus:outline-none focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <Gamepad2 className="h-4 w-4" aria-hidden />
                  Play spotlight
                </Link>
                <Link
                  href={spotlight.href}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-4 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-border-strong)] focus:outline-none focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none"
                >
                  Details
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-3">
          {sidePicks.map((game, index) => (
            <Link
              key={game.id}
              href={game.href}
              className="group rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-3 shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary-border)] hover:shadow-[var(--shadow-card)] focus:outline-none focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] sm:w-28">
                  <GameThumbnail game={game} size="md" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                    {index === 0 ? <Sparkles className="h-3.5 w-3.5" aria-hidden /> : <Trophy className="h-3.5 w-3.5" aria-hidden />}
                    {index === 0 ? "Fast pick" : index === 1 ? "With friends" : "Think mode"}
                  </div>
                  <p className="mt-1 truncate text-sm font-black text-[var(--color-text-primary)]">{game.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">{game.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
