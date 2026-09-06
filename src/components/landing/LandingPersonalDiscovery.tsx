"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui";
import { useCoreActivity } from "@/core";

export function LandingPersonalDiscovery() {
  const { recent } = useCoreActivity(["tool", "game", "project", "workflow"]);
  const items = recent.slice(0, 4);
  if (!items.length) return null;

  return (
    <section aria-labelledby="landing-continue-title" className="mt-10 rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
        <Clock3 className="h-4 w-4" aria-hidden />
        Continue where you left off
      </div>
      <h3 id="landing-continue-title" className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Pick up a recent Darma workspace.</h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Link key={`${item.kind}:${item.id}`} href={item.href} className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] focus-visible:shadow-[var(--focus-ring)] motion-reduce:hover:translate-y-0">
            <Badge variant="outline">{item.kind}</Badge>
            <p className="mt-3 font-black text-[var(--color-text-primary)]">{item.title}</p>
            {item.description ? <p className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--color-text-secondary)]">{item.description}</p> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
