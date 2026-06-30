import { Badge } from "@/components/ui";
import type { GameDefinition } from "../domain/game";
import { GameCard } from "./GameCard";

function relatedScore(base: GameDefinition, other: GameDefinition) {
  const sharedCategories = other.categories.filter((c) => base.categories.includes(c)).length;
  const sharedTags = other.tags.filter((t) => base.tags.includes(t)).length;
  return sharedCategories * 2 + sharedTags;
}

export function getRelatedGames(base: GameDefinition, all: GameDefinition[], limit = 4) {
  return all
    .filter((game) => game.id !== base.id)
    .map((game) => ({ game, score: relatedScore(base, game) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.game.title.localeCompare(b.game.title))
    .slice(0, limit)
    .map((entry) => entry.game);
}

export function RelatedGames({ base, all }: { base: GameDefinition; all: GameDefinition[] }) {
  const related = getRelatedGames(base, all);
  if (related.length === 0) return null;

  return (
    <section>
      <div className="mb-4">
        <Badge variant="soft">More to play</Badge>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Related games
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}
