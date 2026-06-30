import { Brain, Clock3, Gamepad2, Grid3X3, MousePointer2, Users } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { GameDefinition } from "../domain/game";
import type { GameFilter } from "./GameCategoryChips";
import { cn } from "@/lib/cn";

const moodTiles: Array<{
  title: string;
  description: string;
  filter: GameFilter;
  icon: typeof Brain;
  tone: string;
}> = [
  {
    title: "Think",
    description: "Logic, memory, words, and strategy.",
    filter: "brain",
    icon: Brain,
    tone: "gthumb-indigo",
  },
  {
    title: "Quick break",
    description: "Short rounds for a small reset.",
    filter: "quick-break",
    icon: Clock3,
    tone: "gthumb-lime",
  },
  {
    title: "Arcade energy",
    description: "Fast reactions and score chasing.",
    filter: "arcade",
    icon: Gamepad2,
    tone: "gthumb-fuchsia",
  },
  {
    title: "Classics",
    description: "Timeless games everyone recognizes.",
    filter: "classic",
    icon: Grid3X3,
    tone: "gthumb-amber",
  },
  {
    title: "With friends",
    description: "Same-device two-player ideas.",
    filter: "2-players",
    icon: Users,
    tone: "gthumb-orange",
  },
  {
    title: "Touch friendly",
    description: "Comfortable on phones and tablets.",
    filter: "mobile-friendly",
    icon: MousePointer2,
    tone: "gthumb-teal",
  },
];

function countForFilter(games: GameDefinition[], filter: GameFilter) {
  if (filter === "mobile-friendly") return games.filter((game) => game.devices.includes("mobile")).length;
  if (filter === "featured") return games.filter((game) => game.featured).length;
  if (filter === "popular") return games.filter((game) => game.popular).length;
  if (filter === "new") return games.filter((game) => game.isNew).length;
  if (filter === "all") return games.length;
  return games.filter((game) => game.categories.includes(filter)).length;
}

export function GameMoodBoard({
  games,
  onSelectFilter,
}: {
  games: GameDefinition[];
  onSelectFilter: (filter: GameFilter) => void;
}) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="soft">Discovery</Badge>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
            Choose your mood
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
            Help users decide by intent, not only by category names.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {moodTiles.map((tile) => {
          const Icon = tile.icon;
          const count = countForFilter(games, tile.filter);
          return (
            <Card
              key={tile.filter}
              as="button"
              type="button"
              variant="interactive"
              padding="none"
              onClick={() => onSelectFilter(tile.filter)}
              className="group w-full overflow-hidden text-left focus:outline-none focus-visible:shadow-[var(--focus-ring)]"
            >
              <div className="flex min-h-32 items-stretch">
                <div className={cn("gthumb relative flex w-24 shrink-0 items-center justify-center overflow-hidden", tile.tone)}>
                  <div className="gthumb-texture absolute inset-0 opacity-60" aria-hidden />
                  <Icon className="relative h-8 w-8 text-white drop-shadow-sm transition duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{tile.title}</h3>
                    <span className="rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[var(--color-text-tertiary)]">
                      {count}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{tile.description}</p>
                  <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                    Browse lane →
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
