import { type ReactNode } from "react";
import { ActionBar, Card, PreviewFrame } from "@/components/ui";
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

export function ToolLayoutFullscreenStudio({
  categorySlot,
  previewSlot,
  actionBarSlot,
  examplesSlot,
  controlsSlot,
  articleSlot,
  sidebarSlot,
}: {
  categorySlot?: ReactNode;
  previewSlot: ReactNode;
  actionBarSlot?: ReactNode;
  examplesSlot?: ReactNode;
  controlsSlot?: ReactNode;
  articleSlot?: ReactNode;
  sidebarSlot?: ReactNode;
}) {
  return (
    <div data-tool-layout="fullscreen-studio" className="space-y-5 sm:space-y-6">
      {categorySlot ? <section>{categorySlot}</section> : null}

      <div
        className={cn(
          "grid gap-5 lg:items-start",
          controlsSlot && "lg:grid-cols-[minmax(300px,var(--tool-controls-width))_minmax(0,1fr)]",
        )}
      >
        {controlsSlot ? (
          <aside data-tool-region="controls" className="order-1 min-w-0 lg:sticky lg:top-[6.75rem] lg:max-h-[calc(100vh-7.75rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
            <RegionLabel label="Controls" hint="Edit the scene while keeping the preview visible" />
            <Card padding="md" className="border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-bg)] shadow-[var(--shadow-tool-controls)]">{controlsSlot}</Card>
          </aside>
        ) : null}

        <section data-tool-region="preview" className="order-2 min-w-0">
          <RegionLabel label="Live preview" hint="Use the current settings, then export or copy" />
          <PreviewFrame variant="studio" className="min-h-[360px] sm:min-h-[480px] xl:min-h-[600px]">
            {previewSlot}
          </PreviewFrame>
          {actionBarSlot ? <ActionBar className="mt-4 hidden md:flex" align="between">{actionBarSlot}</ActionBar> : null}
        </section>
      </div>

      {(examplesSlot || sidebarSlot) ? (
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          {examplesSlot ? <Card padding="md">{examplesSlot}</Card> : null}
          {sidebarSlot ? <Card padding="md">{sidebarSlot}</Card> : null}
        </div>
      ) : null}

      {articleSlot ? <section>{articleSlot}</section> : null}
      {actionBarSlot ? <ToolMobileActions>{actionBarSlot}</ToolMobileActions> : null}
    </div>
  );
}
