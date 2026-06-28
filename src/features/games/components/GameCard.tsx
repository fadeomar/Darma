import Link from "next/link";
import { Play } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type GameDefinition,
} from "../domain/game";
import { GameThumbnail } from "./GameThumbnail";
import { cn } from "@/lib/cn";

function StatusBadges({ game }: { game: GameDefinition }) {
  return (
    <>
      {game.isNew ? <Badge variant="accent">New</Badge> : null}
      {game.popular ? <Badge variant="warning">Popular</Badge> : null}
    </>
  );
}

export function GameCard({ game, featured = false }: { game: GameDefinition; featured?: boolean }) {
  const primaryCategory = game.categories[0];

  return (
    <Card
      as="article"
      variant="interactive"
      padding="none"
      className={cn(
        "group relative flex h-full flex-col overflow-hidden focus-within:shadow-[var(--focus-ring)]",
        featured && "sm:col-span-1",
      )}
    >
      {/* Thumbnail */}
      <div className="relative">
        <GameThumbnail game={game} size={featured ? "lg" : "md"} priority={featured} />
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
          <StatusBadges game={game} />
        </div>
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-[var(--radius-full)] border border-white/40 bg-black/35 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur">
          {game.playTime}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-black leading-tight tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-lg">
            {/* Stretched link makes the whole card open the detail page */}
            <Link
              href={game.href}
              className="rounded-[var(--radius-sm)] outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
            >
              {game.title}
            </Link>
          </h3>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]">
          {game.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {primaryCategory ? <Badge variant="soft">{CATEGORY_LABELS[primaryCategory]}</Badge> : null}
          <Badge variant="outline">{DIFFICULTY_LABELS[game.difficulty]}</Badge>
          {game.input.includes("touch") ? <Badge variant="outline">Touch</Badge> : null}
          {game.input.includes("keyboard") ? <Badge variant="outline">Keyboard</Badge> : null}
        </div>

        <div className="mt-auto pt-4">
          {/* Raised above the stretched link so it is independently clickable */}
          <Link
            href={game.href}
            aria-label={`Play ${game.title}`}
            className="relative z-10 inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-bold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)] focus:outline-none focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none"
          >
            <Play className="h-3.5 w-3.5" aria-hidden />
            Play
          </Link>
        </div>
      </div>
    </Card>
  );
}
