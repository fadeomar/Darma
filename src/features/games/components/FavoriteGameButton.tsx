"use client";

import { Heart } from "lucide-react";
import type { GameDefinition } from "../domain/game";
import { useGameActivity } from "../hooks/useGameActivity";
import { cn } from "@/lib/cn";

export function FavoriteGameButton({
  game,
  className,
  label = true,
}: {
  game: GameDefinition;
  className?: string;
  label?: boolean;
}) {
  const { hydrated, isFavorite, toggleFavorite } = useGameActivity([game]);
  const active = hydrated && isFavorite(game.slug);

  return (
    <button
      type="button"
      className={cn(
        "game-favorite-button relative z-10 inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-primary)] focus:outline-none focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none",
        active && "border-[var(--color-primary)] text-[var(--color-primary)]",
        className,
      )}
      aria-pressed={active}
      aria-label={active ? `Remove ${game.title} from favorites` : `Add ${game.title} to favorites`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(game.slug);
      }}
    >
      <Heart className={cn("h-4 w-4", active && "fill-current")} aria-hidden />
      {label ? <span>{active ? "Saved" : "Save"}</span> : null}
    </button>
  );
}
