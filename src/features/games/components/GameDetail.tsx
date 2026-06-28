import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import {
  CATEGORY_LABELS,
  DEVICE_LABELS,
  DIFFICULTY_LABELS,
  INPUT_LABELS,
  type GameDefinition,
} from "../domain/game";
import { GamePlayerShell } from "./GamePlayerShell";
import { RelatedGames } from "./RelatedGames";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] py-2.5 last:border-0">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        {label}
      </span>
      <span className="text-sm font-semibold text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}

export function GameDetail({ game, allGames }: { game: GameDefinition; allGames: GameDefinition[] }) {
  return (
    <div className="mx-auto max-w-[var(--container-page)] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          <li>
            <Link href="/games" className="rounded-[var(--radius-sm)] transition hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:shadow-[var(--focus-ring)]">
              Games
            </Link>
          </li>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <li aria-current="page" className="text-[var(--color-text-secondary)]">{game.title}</li>
        </ol>
      </nav>

      {/* Header */}
      <header className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] px-5 py-6 shadow-[var(--shadow-card)] sm:px-7 sm:py-7">
        <div className="flex flex-wrap items-center gap-2">
          {game.isNew ? <Badge variant="accent">New</Badge> : null}
          {game.popular ? <Badge variant="warning">Popular</Badge> : null}
          {game.featured ? <Badge variant="soft">Featured</Badge> : null}
          {game.categories.slice(0, 2).map((category) => (
            <Badge key={category} variant="outline">{CATEGORY_LABELS[category]}</Badge>
          ))}
        </div>
        <h1 className="mt-4 max-w-3xl text-3xl font-black leading-[var(--leading-tight)] tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-4xl">
          {game.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
          {game.description}
        </p>
        <div className="mt-5">
          <Link
            href="#player"
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-base font-bold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)] focus:outline-none focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none"
          >
            <Play className="h-4 w-4" aria-hidden />
            Play Now
          </Link>
        </div>
      </header>

      {/* Player + details */}
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div id="player" className="scroll-mt-24">
          <GamePlayerShell game={game} />
        </div>

        <Card as="aside" variant="default" padding="lg" className="lg:sticky lg:top-24">
          <h2 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Game details</h2>
          <div className="mt-3">
            <DetailRow label="Difficulty" value={DIFFICULTY_LABELS[game.difficulty]} />
            <DetailRow label="Avg. play time" value={game.playTime} />
            <DetailRow
              label="Best played on"
              value={game.devices.map((device) => DEVICE_LABELS[device]).join(", ")}
            />
            <DetailRow
              label="Controls"
              value={game.input.map((input) => INPUT_LABELS[input]).join(", ")}
            />
          </div>
        </Card>
      </div>

      {/* About + controls + privacy */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card variant="default" padding="lg">
          <h2 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">About this game</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{game.longDescription}</p>
        </Card>
        <Card variant="default" padding="lg">
          <h2 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Controls</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{game.controls}</p>
          <h3 className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Privacy
          </h3>
          <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">{game.privacyNote}</p>
        </Card>
      </div>

      {/* Related */}
      <div className="mt-10">
        <RelatedGames base={game} all={allGames} />
      </div>
    </div>
  );
}
