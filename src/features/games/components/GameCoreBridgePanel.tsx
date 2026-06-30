"use client";

import { DatabaseZap, GitBranch, Layers3, SearchCheck } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { CoreDiscoveryRail, CoreEntityBrowser, CoreSectionHeader } from "@/core";
import { toGameCoreEntities, getGameCoreBridgeStats } from "../lib/gameCoreAdapter";
import type { GameDefinition } from "../domain/game";

type GameCoreBridgePanelProps = {
  games: readonly GameDefinition[];
};

export function GameCoreBridgePanel({ games }: GameCoreBridgePanelProps) {
  const coreGames = toGameCoreEntities(games);
  const stats = getGameCoreBridgeStats(games);
  const featuredCoreGames = coreGames.filter((game) => game.featured || game.popular).slice(0, 6);

  return (
    <section className="game-core-bridge rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <CoreSectionHeader
            eyebrow="Core migration bridge"
            title="Games are now mapped into Darma Core"
            description="This bridge keeps the polished Games UI intact while exposing the same game data as CoreEntity records for future shared search, discovery, recommendations, and collection pages."
          />
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Non-breaking</Badge>
            <Badge variant="outline">Adapter layer</Badge>
            <Badge variant="soft">Core-ready</Badge>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.coverage.slice(0, 4).map((item, index) => {
          const Icon = [DatabaseZap, Layers3, SearchCheck, GitBranch][index] ?? DatabaseZap;
          return (
            <div key={item.label} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <p className="text-2xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">{item.value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="h-full bg-[var(--color-surface-base)]">
          <CoreDiscoveryRail
            title="Core-powered game rail"
            description="The same rail primitive can now display game entities without touching the existing GameCard experience."
            entities={featuredCoreGames}
            compactCards
          />
        </Card>

        <Card className="h-full bg-[var(--color-surface-base)]">
          <CoreEntityBrowser
            entities={coreGames}
            title="Game entity browser"
            description="Search and filter game data through the shared CoreEntity browser. This is a migration preview, not a replacement for the handcrafted Games page yet."
            searchPlaceholder="Search core games, tags, devices…"
            allLabel="All game types"
          />
        </Card>
      </div>
    </section>
  );
}
