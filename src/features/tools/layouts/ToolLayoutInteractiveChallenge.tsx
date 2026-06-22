import { type ReactNode } from "react";

export function ToolLayoutInteractiveChallenge({
  arenaSlot,
  controlsSlot,
  statsSlot,
  historySlot,
  infoSlot,
}: {
  arenaSlot: ReactNode;
  controlsSlot?: ReactNode;
  statsSlot?: ReactNode;
  historySlot?: ReactNode;
  infoSlot?: ReactNode;
}) {
  return (
    <div className="relative mx-auto max-w-7xl space-y-5 sm:space-y-6">
      <div className="pointer-events-none absolute inset-x-4 top-8 -z-10 h-72 rounded-[999px] bg-[radial-gradient(circle,rgba(255,166,74,0.16),transparent_66%)] blur-3xl" />
      <section className="min-w-0">{arenaSlot}</section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:items-start">
        <div className="min-w-0 space-y-5 sm:space-y-6">
          {controlsSlot ? <section className="min-w-0">{controlsSlot}</section> : null}
          {statsSlot ? <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)]/55 p-3 shadow-[var(--shadow-xs)] backdrop-blur sm:p-4">{statsSlot}</section> : null}
        </div>

        {(historySlot || infoSlot) ? (
          <aside className="min-w-0 space-y-5 xl:sticky xl:top-24">
            {historySlot}
            {infoSlot}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
