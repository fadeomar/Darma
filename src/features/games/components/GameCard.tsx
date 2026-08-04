import Link from "next/link";
import { Gamepad2, Keyboard, MousePointer2, Smartphone } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type GameDefinition,
} from "../domain/game";
import { GameThumbnail } from "./GameThumbnail";
import { FavoriteGameButton } from "./FavoriteGameButton";
import { cn } from "@/lib/cn";

function StatusBadges({ game }: { game: GameDefinition }) {
  return (
    <>
      {game.isNew ? <Badge variant="accent">New</Badge> : null}
      {game.popular ? <Badge variant="warning">Popular</Badge> : null}
    </>
  );
}

/**
 * The one control fact on the card. "Touch ready" already implies mobile
 * support, so the separate Mobile/Desktop chip that used to sit beside it said
 * the same thing twice (F-09).
 */
function inputSummary(game: GameDefinition) {
  if (game.input.includes("touch")) return { label: "Touch ready", icon: Smartphone };
  if (game.input.includes("keyboard")) return { label: "Keyboard", icon: Keyboard };
  return { label: "Mouse", icon: MousePointer2 };
}

/**
 * Game catalog card.
 *
 * Interaction model B: the card itself is the navigation target via a stretched
 * link on the title, and Favourite is a sibling control raised above it. There
 * is deliberately no second "Play now" link — it duplicated the card's own
 * action and made three competing targets out of one card (F-09).
 *
 * Metadata budget is four facts, each appearing once: play time (on the
 * thumbnail), category, difficulty, and input method. New/Popular are status
 * flags rather than metadata.
 */
export function GameCard({ game, featured = false }: { game: GameDefinition; featured?: boolean }) {
  const primaryCategory = game.categories[0];
  const summary = inputSummary(game);
  const SummaryIcon = summary.icon;

  return (
    <Card
      as="article"
      variant="interactive"
      padding="none"
      className={cn(
        "game-card game-card-polished group relative flex h-full flex-col overflow-hidden focus-within:shadow-[var(--focus-ring)]",
        featured && "sm:col-span-1",
      )}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <GameThumbnail game={game} size={featured ? "lg" : "md"} priority={featured} />
        <div className="pointer-events-none absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5">
          <StatusBadges game={game} />
        </div>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          {/* The card's single play-time statement. bg-black/65 (was /35) is
              what the white label needs to clear 4.5:1 over a light thumbnail. */}
          <span className="rounded-[var(--radius-full)] border border-white/40 bg-black/65 px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white backdrop-blur transition duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
            {game.playTime}
          </span>
          <span className="game-card-play-pulse inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-full)] border border-white/40 bg-white/90 text-[var(--color-primary-text-strong)] shadow-[var(--shadow-card)] backdrop-blur transition duration-300 group-hover:scale-105 group-hover:bg-white motion-reduce:transition-none motion-reduce:group-hover:scale-100">
            <Gamepad2 className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-black leading-tight tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-lg">
            {/* Stretched link makes the whole card open the detail page */}
            <Link
              href={game.href}
              className="rounded-[var(--radius-sm)] outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
            >
              {game.title}
            </Link>
          </h3>
          <FavoriteGameButton game={game} label={false} className="h-9 min-h-9 w-9 shrink-0 rounded-[var(--radius-full)] px-0" />
        </div>

        <p className="mt-2 line-clamp-2 min-h-[3rem] text-sm leading-6 text-[var(--color-text-secondary)]">
          {game.description}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          {primaryCategory ? <Badge variant="soft">{CATEGORY_LABELS[primaryCategory]}</Badge> : null}
          <Badge variant="outline">{DIFFICULTY_LABELS[game.difficulty]}</Badge>
          <span className="game-card-stat">
            <SummaryIcon className="h-3.5 w-3.5" aria-hidden />
            <span>{summary.label}</span>
          </span>
        </div>
      </div>
    </Card>
  );
}
