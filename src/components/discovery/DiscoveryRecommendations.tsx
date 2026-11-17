import Link from "next/link";
import { Boxes, Route, Wrench } from "lucide-react";

import { Badge, Card } from "@/components/ui";
import type { CoreEntityKind, ResolvedCoreRelation } from "@/core";

const kindLabels: Partial<Record<CoreEntityKind, string>> = {
  tool: "Tool",
  project: "Project",
  workflow: "Workflow",
};

function KindIcon({ kind }: { kind: CoreEntityKind }) {
  if (kind === "workflow") return <Route className="h-4 w-4" aria-hidden />;
  if (kind === "project") return <Boxes className="h-4 w-4" aria-hidden />;
  return <Wrench className="h-4 w-4" aria-hidden />;
}

export function DiscoveryRecommendations({
  items,
  title = "Continue exploring",
  description = "Move from this page into a related tool, project, or complete workflow.",
}: {
  items: readonly ResolvedCoreRelation[];
  title?: string;
  description?: string;
}) {
  if (!items.length) return null;

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="border-b border-[var(--color-border-subtle)] pb-5">
        <Badge variant="soft">Discover next</Badge>
        <h2 className="mt-3 text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.entity.id}
            href={item.entity.href}
            className="block h-full rounded-[var(--radius-lg)] focus:outline-none focus:shadow-[var(--focus-ring)]"
          >
            <Card as="article" variant="interactive" padding="md" className="flex h-full flex-col">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  <span className="inline-flex items-center gap-1.5">
                    <KindIcon kind={item.entity.kind} />
                    {kindLabels[item.entity.kind] ?? item.entity.kind}
                  </span>
                </Badge>
                <Badge variant="soft">{item.reasonLabel}</Badge>
              </div>
              <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{item.entity.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">{item.entity.description}</p>
              <p className="mt-auto pt-5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                Open next →
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
