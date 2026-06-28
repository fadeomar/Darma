import { Gauge, LockKeyhole, MonitorSmartphone, Sparkles } from "lucide-react";
import { Card } from "@/components/ui";

const ITEMS = [
  {
    icon: LockKeyhole,
    title: "Private by default",
    description: "No accounts, no backend tracking, and local-only activity signals.",
  },
  {
    icon: Gauge,
    title: "Fast catalog",
    description: "The directory loads metadata and thumbnails only, not game bundles.",
  },
  {
    icon: MonitorSmartphone,
    title: "Device friendly",
    description: "Filters surface keyboard, touch, mobile, and quick-break games clearly.",
  },
  {
    icon: Sparkles,
    title: "Darma polish",
    description: "Playful details stay inside the existing Darma visual system.",
  },
];

export function GameProductionChecklist() {
  return (
    <section className="mt-8" aria-labelledby="games-quality-title">
      <Card variant="default" padding="lg" className="game-production-checklist overflow-hidden">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-primary)]">Production ready</p>
            <h2 id="games-quality-title" className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
              Built for quick, safe browsing
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[var(--color-text-secondary)]">
            A lightweight games layer that keeps Darma fast, private, and easy to use before real playable bundles are added.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-overlay)] text-[var(--color-primary)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-3 text-sm font-black text-[var(--color-text-primary)]">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{item.description}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
