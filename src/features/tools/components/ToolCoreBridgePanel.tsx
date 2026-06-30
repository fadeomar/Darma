"use client";

import { Badge, Card } from "@/components/ui";
import { CoreDiscoveryRail, CoreEntityBrowser } from "@/core";
import type { ToolDefinition } from "../domain/tool";
import { getToolCoreBridgeStats, toToolCoreEntities } from "../lib/toolCoreAdapter";

type ToolCoreBridgePanelProps = {
  tools: readonly ToolDefinition[];
};

export function ToolCoreBridgePanel({ tools }: ToolCoreBridgePanelProps) {
  const entities = toToolCoreEntities(tools);
  const stats = getToolCoreBridgeStats(tools);
  const featured = entities.filter((entity) => entity.featured).slice(0, 8);
  const popular = entities.filter((entity) => entity.popular).slice(0, 8);
  const browserPreview = entities.slice(0, 18);

  if (!entities.length) return null;

  return (
    <section className="mt-8 space-y-6" aria-labelledby="tools-core-bridge-title">
      <Card
        className="relative overflow-hidden border-[var(--color-primary-border)] bg-[radial-gradient(circle_at_top_left,var(--color-primary-soft),transparent_34%),radial-gradient(circle_at_bottom_right,var(--color-accent-soft),transparent_30%),var(--color-surface-overlay)]"
        padding="lg"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-primary)]" aria-hidden />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="soft">Darma Core 2.0</Badge>
              <Badge variant="accent">Tools bridge</Badge>
              <Badge variant="outline">Non-breaking migration</Badge>
            </div>
            <h2 id="tools-core-bridge-title" className="mt-4 max-w-3xl text-3xl font-black leading-[var(--leading-tight)] tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-4xl">
              Tools are now available as shared Core entities.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
              This bridge keeps the current tools directory intact while exposing every public tool to the shared Core registry, search, discovery rails, metadata, and future collection templates.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-[var(--radius-xl)] border border-white/55 bg-white/65 p-3 shadow-[var(--shadow-card)] backdrop-blur dark:border-white/10 dark:bg-white/10">
            {stats.coverage.slice(0, 9).map((item) => (
              <div key={item.label} className="rounded-[var(--radius-md)] bg-[var(--color-surface-base)]/85 p-3 text-center">
                <p className="text-xl font-black text-[var(--color-text-primary)]">{item.value}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {stats.topCategories.length ? (
          <div className="relative mt-5 flex flex-wrap gap-2">
            {stats.topCategories.map((category) => (
              <Badge key={category} variant="outline">{category}</Badge>
            ))}
          </div>
        ) : null}
      </Card>

      <CoreDiscoveryRail
        title="Core-powered featured tools"
        description="A migration-safe rail rendered with shared Core UI primitives while the original tools directory stays untouched."
        entities={featured.length ? featured : entities.slice(0, 8)}
        href="/tools"
        ctaLabel="Open tools"
      />

      {popular.length ? (
        <CoreDiscoveryRail
          title="Popular through Core"
          description="Pinned and high daily-use tools can now be discovered by the same engine used for games and future collections."
          entities={popular}
          href="/tools"
          ctaLabel="Browse catalog"
        />
      ) : null}

      <Card padding="lg" className="space-y-5">
        <div>
          <Badge variant="outline">Migration preview</Badge>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">Shared Core browser for tools</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
            This preview uses the generic Core browser. It is intentionally limited to a sample of tools so we can validate the migration pattern before replacing any production UI.
          </p>
        </div>
        <CoreEntityBrowser
          entities={browserPreview}
          title="Browse tools via Core"
          description="Search and filter tool entities through the shared Core search/filter/card primitives."
          searchPlaceholder="Search core tools…"
        />
      </Card>
    </section>
  );
}
