import { type ReactNode } from "react";
import { ActionBar } from "@/components/ui";
import { ToolMobileActions } from "@/features/tools/components/ToolMobileActions";
import { cn } from "@/lib/cn";

function RegionLabel({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="mb-2 flex flex-wrap items-end justify-between gap-2 px-1">
      <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-xs text-[var(--color-text-tertiary)]">{hint}</span>
    </div>
  );
}

export function ToolLayoutSingleUtility({
  resultSlot,
  controlsSlot,
  actionsSlot,
  presetsSlot,
  infoSlot,
  articleSlot,
}: {
  resultSlot: ReactNode;
  controlsSlot?: ReactNode;
  actionsSlot?: ReactNode;
  presetsSlot?: ReactNode;
  infoSlot?: ReactNode;
  articleSlot?: ReactNode;
}) {
  const hasControls = Boolean(controlsSlot || presetsSlot);

  return (
    <div data-tool-layout="single-utility" className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      <div
        className={cn(
          "grid gap-5 lg:items-start",
          hasControls && "lg:grid-cols-[minmax(300px,var(--tool-controls-width))_minmax(0,1fr)]",
        )}
      >
        {hasControls ? (
          <aside data-tool-region="controls" className="order-1 min-w-0 space-y-4 lg:sticky lg:top-[6.75rem] lg:max-h-[calc(100vh-7.75rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
            <RegionLabel label="Controls" hint="Enter values or choose a preset" />
            {controlsSlot ? <section className="min-w-0">{controlsSlot}</section> : null}
            {presetsSlot ? <section className="min-w-0">{presetsSlot}</section> : null}
          </aside>
        ) : null}

        <section id="tool-result" data-tool-region="result" className="order-2 min-w-0 scroll-mt-28">
          <RegionLabel label="Result" hint="Review the current output and next actions" />
          <div className="[&>section]:shadow-[var(--shadow-tool-result)]">{resultSlot}</div>
          {actionsSlot ? <ActionBar className="mt-4 hidden md:flex" align="between">{actionsSlot}</ActionBar> : null}
        </section>
      </div>

      {infoSlot ? <section className="min-w-0">{infoSlot}</section> : null}
      {articleSlot ? <section className="min-w-0">{articleSlot}</section> : null}
      {actionsSlot ? <ToolMobileActions>{actionsSlot}</ToolMobileActions> : null}
    </div>
  );
}
