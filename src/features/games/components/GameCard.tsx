import Link from "next/link";
import {
  Clock3,
  Gamepad2,
  Keyboard,
  MousePointer2,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  type GameDefinition,
} from "../domain/game";
import { GameThumbnail } from "./GameThumbnail";
import { FavoriteGameButton } from "./FavoriteGameButton";
import { GamePlayLink } from "./GamePlayLink";
import { cn } from "@/lib/cn";

function StatusBadges({ game }: { game: GameDefinition }) {
  return (
    <>
      {game.isNew ? <Badge variant="accent">New</Badge> : null}
      {game.popular ? <Badge variant="warning">Popular</Badge> : null}
    </>
  );
}

function inputSummary(game: GameDefinition) {
  if (game.input.includes("touch")) return { label: "Touch ready", icon: Smartphone };
  if (game.input.includes("keyboard")) return { label: "Keyboard", icon: Keyboard };
  return { label: "Mouse", icon: MousePointer2 };
}

function funLevel(game: GameDefinition) {
  if (game.popular && game.featured) return "High replay";
  if (game.categories.includes("brain")) return "Focus boost";
  if (game.categories.includes("quick-break")) return "Quick hit";
  if (game.categories.includes("2-players")) return "Duo fun";
  return "Easy start";
}

export function GameCard({ game, featured = false }: { game: GameDefinition; featured?: boolean }) {
  const primaryCategory = game.categories[0];
  const secondaryCategory = game.categories.find((category) => category !== primaryCategory);
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
          <span className="rounded-[var(--radius-full)] border border-white/40 bg-black/35 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur transition duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
            {game.playTime}
          </span>
          <span className="game-card-play-pulse inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-full)] border border-white/40 bg-white/90 text-[var(--color-primary)] shadow-[var(--shadow-card)] backdrop-blur transition duration-300 group-hover:scale-105 group-hover:bg-white motion-reduce:transition-none motion-reduce:group-hover:scale-100">
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

        <div className="mt-3 flex flex-wrap gap-1.5">
          {primaryCategory ? <Badge variant="soft">{CATEGORY_LABELS[primaryCategory]}</Badge> : null}
          {secondaryCategory ? <Badge variant="outline">{CATEGORY_LABELS[secondaryCategory]}</Badge> : null}
          <Badge variant="outline">{DIFFICULTY_LABELS[game.difficulty]}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)]">
          <div className="game-card-stat">
            <Clock3 className="h-3.5 w-3.5" aria-hidden />
            <span>{game.playTime}</span>
          </div>
          <div className="game-card-stat">
            <SummaryIcon className="h-3.5 w-3.5" aria-hidden />
            <span>{summary.label}</span>
          </div>
          <div className="game-card-stat">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            <span>{funLevel(game)}</span>
          </div>
          <div className="game-card-stat">
            <Gamepad2 className="h-3.5 w-3.5" aria-hidden />
            <span>{game.devices.includes("mobile") ? "Mobile" : "Desktop"}</span>
          </div>
        </div>

        <div className="mt-auto pt-4">
          {/* Raised above the stretched link so it is independently clickable */}
          <GamePlayLink game={game} />
        </div>
      </div>
    </Card>
  );
}
