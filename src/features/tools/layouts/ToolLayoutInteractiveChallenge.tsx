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
    <div data-tool-layout="interactive-challenge" className="relative mx-auto max-w-7xl space-y-5 sm:space-y-6">
      <div className="pointer-events-none absolute inset-x-4 top-8 -z-10 h-72 rounded-[999px] bg-[radial-gradient(circle,rgba(255,166,74,0.16),transparent_66%)] blur-3xl" />

      <div className={controlsSlot ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] xl:items-start" : ""}>
        <section className="min-w-0" data-tool-region="arena">{arenaSlot}</section>
        {controlsSlot ? (
          <aside className="min-w-0 xl:sticky xl:top-[6.75rem]" data-tool-region="controls">{controlsSlot}</aside>
        ) : null}
      </div>

      {statsSlot ? (
        <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-tool-result-border)] bg-[var(--color-tool-result-bg)] p-4 shadow-[var(--shadow-tool-result)]" data-tool-region="result">
          {statsSlot}
        </section>
      ) : null}

      {(historySlot || infoSlot) ? (
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          {historySlot ? <section className="min-w-0">{historySlot}</section> : null}
          {infoSlot ? <section className="min-w-0">{infoSlot}</section> : null}
        </div>
      ) : null}
    </div>
  );
}
