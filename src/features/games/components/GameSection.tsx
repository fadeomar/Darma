import { type ReactNode } from "react";
import { Badge } from "@/components/ui";
import type { GameDefinition } from "../domain/game";
import { GameCard } from "./GameCard";

export function GameSection({
  eyebrow,
  title,
  subtitle,
  games,
  featured = false,
  aside,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  games: GameDefinition[];
  featured?: boolean;
  aside?: ReactNode;
}) {
  if (games.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          {eyebrow ? <Badge variant="soft">{eyebrow}</Badge> : null}
          <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{subtitle}</p>
          ) : null}
        </div>
        {aside}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} featured={featured} />
        ))}
      </div>
    </section>
  );
}
