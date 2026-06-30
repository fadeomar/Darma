import Link from "next/link";
import { ArrowRight, Dice5, Gamepad2, Sparkles, Trophy } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { GameDefinition } from "../domain/game";

const PRINCIPLES = [
  {
    icon: Gamepad2,
    title: "Instant play",
    description: "Designed around fast, low-friction browser games that do not need signup or downloads.",
  },
  {
    icon: Sparkles,
    title: "Playful, not noisy",
    description: "A colorful layer on top of Darma’s calm interface, without heavy neon or visual clutter.",
  },
  {
    icon: Trophy,
    title: "Quick wins",
    description: "Every section helps users find the right game for a short break, focus round, or classic challenge.",
  },
];

function getDailyPick(games: GameDefinition[]) {
  const featured = games.filter((game) => game.featured || game.popular || game.isNew);
  return featured[0] ?? games[0];
}

export function GameIdentityBand({ games }: { games: GameDefinition[] }) {
  const dailyPick = getDailyPick(games);

  return (
    <section className="game-identity-band relative isolate mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-6 lg:p-7">
      <div className="game-identity-grid" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="game-soft-orb game-soft-orb-b" aria-hidden />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="soft">Darma Games identity</Badge>
            <Badge variant="outline">Fast</Badge>
            <Badge variant="outline">Friendly</Badge>
          </div>
          <h2 className="mt-3 max-w-2xl text-2xl font-black tracking-[-0.035em] text-[var(--color-text-primary)] sm:text-3xl">
            A calmer game hub built for quick breaks.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
            The Games section keeps Darma’s clean product feel, then adds motion, soft gradients, and discovery moments exactly where they help browsing feel more fun.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {PRINCIPLES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/78 p-4"
                >
                  <Icon className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                  <h3 className="mt-3 text-sm font-black text-[var(--color-text-primary)]">{item.title}</h3>
                  <p className="mt-1 text-xs leading-6 text-[var(--color-text-tertiary)]">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {dailyPick ? (
          <Card variant="default" padding="lg" className="game-daily-card relative overflow-hidden">
            <div className="game-daily-card-glow" aria-hidden />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="accent">Daily pick</Badge>
                <Dice5 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              </div>
              <h3 className="mt-4 text-xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">{dailyPick.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">{dailyPick.description}</p>
              <Link
                href={`/games/${dailyPick.slug}`}
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-bold text-[var(--color-primary-text)] transition hover:bg-[var(--color-primary-hover)] focus:outline-none focus-visible:shadow-[var(--focus-ring)] motion-reduce:transition-none"
              >
                Try today’s pick
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
