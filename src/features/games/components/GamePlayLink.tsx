"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import type { GameDefinition } from "../domain/game";
import { useGameActivity } from "../hooks/useGameActivity";
import { cn } from "@/lib/cn";

export function GamePlayLink({
  game,
  href,
  children = "Play now",
  className,
}: {
  game: GameDefinition;
  href?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { recordPlay } = useGameActivity([game]);

  return (
    <Link
      href={href ?? `${game.href}#player`}
      aria-label={`Play ${game.title}`}
      className={cn(
        "game-card-cta relative z-10 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-bold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)] focus:outline-none focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto",
        className,
      )}
      onClick={() => recordPlay(game.slug)}
    >
      <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
      {children}
    </Link>
  );
}
