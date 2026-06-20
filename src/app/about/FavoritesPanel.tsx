"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Card } from "@/components/ui";
import { FavoriteToolButton } from "@/features/tools/components/FavoriteToolButton";
import { useFavoriteTools } from "@/features/tools/hooks/useFavoriteTools";

export type FavoritePanelTool = {
  id: string;
  title: string;
  href: string;
  description: string;
};

const sectionClass = "mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8";
const eyebrowClass = "font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]";

export function FavoritesPanel({ tools }: { tools: FavoritePanelTool[] }) {
  const { favoriteToolIds } = useFavoriteTools();

  const byId = new Map(tools.map((tool) => [tool.id, tool]));
  // Preserve the user's favorite order (most-recent first) and drop any ids
  // that no longer resolve to a public tool.
  const favorites = favoriteToolIds
    .map((id) => byId.get(id))
    .filter((tool): tool is FavoritePanelTool => Boolean(tool));

  // First-time visitors and people with no favorites see nothing — never a
  // dead section.
  if (favorites.length === 0) return null;

  return (
    <section className={sectionClass}>
      <div className="mb-6 max-w-3xl">
        <p className={eyebrowClass}>Your favorites</p>
        <h2 className="mt-2 flex items-center gap-2 text-3xl font-black tracking-[-0.035em] text-[var(--color-text-primary)]">
          <Star className="h-6 w-6 fill-current text-[var(--color-primary)]" aria-hidden />
          Your pinned tools.
        </h2>
        <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
          Star a tool from its page to keep it here — saved only on this browser.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map((tool) => (
          <Card key={tool.id} as="article" variant="interactive" padding="lg" className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{tool.title}</h3>
              <FavoriteToolButton toolId={tool.id} toolTitle={tool.title} showLabel={false} />
            </div>
            <p className="mt-2 flex-1 text-sm leading-6 text-[var(--color-text-secondary)]">{tool.description}</p>
            <Link
              href={tool.href}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]"
            >
              Open {tool.title}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
