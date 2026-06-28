import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui";
import type { GameDefinition } from "../domain/game";
import { GameThumbnail } from "./GameThumbnail";

export function GameCollectionRail({
  eyebrow,
  title,
  subtitle,
  games,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  games: GameDefinition[];
}) {
  if (games.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="outline">{eyebrow}</Badge>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{subtitle}</p>
        </div>
      </div>

      <div className="games-rail -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {games.map((game) => (
          <Link
            key={game.id}
            href={game.href}
            className="group relative min-w-[260px] snap-start overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary-border)] hover:shadow-[var(--shadow-card)] focus:outline-none focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-w-[300px]"
          >
            <GameThumbnail game={game} size="md" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-1 font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{game.title}</h3>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" aria-hidden />
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]">{game.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="soft">{game.playTime}</Badge>
                {game.popular ? <Badge variant="warning">Popular</Badge> : null}
                {game.isNew ? <Badge variant="accent">New</Badge> : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
