import { type ReactNode } from "react";
import { ActionBar, PreviewFrame } from "@/components/ui";
import { ToolMobileActions } from "@/features/tools/components/ToolMobileActions";
import { cn } from "@/lib/cn";

type PresetsPlacement = "before-grid" | "after-code";
type ControlsPosition = "left" | "right";

function RegionLabel({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="mb-2 flex flex-wrap items-end justify-between gap-2 px-1">
      <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-xs text-[var(--color-text-tertiary)]">{hint}</span>
    </div>
  );
}

export function ToolLayoutVisualGenerator({
  previewSlot,
  controlsSlot,
  codeSlot,
  actionsSlot,
  presetsSlot,
  articleSlot,
  actionsPlacement = "after-grid",
  presetsPlacement = "after-code",
  controlsPosition = "left",
  stickyPreview = false,
  stickyControls = true,
  controlsWidth = "default",
  wrapPreview = true,
  actionsClassName,
  mobileCodeAfterControls = false,
}: {
  previewSlot: ReactNode;
  controlsSlot?: ReactNode;
  codeSlot?: ReactNode;
  actionsSlot?: ReactNode;
  presetsSlot?: ReactNode;
  articleSlot?: ReactNode;
  actionsPlacement?: "after-grid" | "under-preview";
  presetsPlacement?: PresetsPlacement;
  controlsPosition?: ControlsPosition;
  stickyPreview?: boolean;
  stickyControls?: boolean;
  controlsWidth?: "default" | "wide";
  wrapPreview?: boolean;
  actionsClassName?: string;
  /**
   * Stacked layouts read better when the generated code sits after the controls
   * instead of directly under the preview. Above the grid breakpoint the code
   * stays in the preview column where there is room for it.
   */
  mobileCodeAfterControls?: boolean;
}) {
  const desktopActions = actionsSlot ? <ActionBar className={cn("hidden md:flex", actionsClassName)} align="between">{actionsSlot}</ActionBar> : null;
  const mobileActions = actionsSlot ? <ToolMobileActions>{actionsSlot}</ToolMobileActions> : null;

  // When the caller opts out of the frame it owns the whole preview column, so
  // the region label would sit above content that is no longer just a preview.
  const preview = wrapPreview ? (
    <div>
      <RegionLabel label="Live preview" hint="The result updates from the current controls" />
      <PreviewFrame className="min-h-[360px] sm:min-h-[460px] lg:min-h-[540px]">
        {previewSlot}
      </PreviewFrame>
    </div>
  ) : (
    previewSlot
  );

  const previewColumn = (
    <section
      data-tool-region="preview"
      className={cn(
        "min-w-0 space-y-4",
        controlsPosition === "left" ? "order-2" : "order-1",
        stickyPreview && "lg:sticky lg:top-[6.75rem] lg:self-start",
      )}
    >
      {preview}
      {actionsPlacement === "under-preview" ? desktopActions : null}
      {actionsPlacement === "under-preview" && codeSlot ? (
        <section className={cn("min-w-0", mobileCodeAfterControls && "hidden lg:block")}>{codeSlot}</section>
      ) : null}
    </section>
  );

  const controlsColumn = controlsSlot ? (
    <aside
      data-tool-region="controls"
      className={cn(
        "min-w-0",
        stickyControls && "lg:sticky lg:top-[6.75rem] lg:max-h-[calc(100vh-7.75rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-2",
        controlsPosition === "left" ? "order-1" : "order-2",
      )}
    >
      <RegionLabel label="Controls" hint="Change a setting to update the preview" />
      {controlsSlot}
    </aside>
  ) : null;

  return (
    <div data-tool-layout="visual-generator" className="space-y-5 sm:space-y-6">
      {presetsPlacement === "before-grid" && presetsSlot ? <section className="min-w-0">{presetsSlot}</section> : null}

      <div
        className={cn(
          "grid gap-5 lg:items-start",
          controlsSlot &&
            (controlsPosition === "left"
              ? controlsWidth === "wide"
                ? "lg:grid-cols-[minmax(360px,430px)_minmax(0,1fr)]"
                : "lg:grid-cols-[minmax(300px,var(--tool-controls-width))_minmax(0,1fr)]"
              : controlsWidth === "wide"
                ? "lg:grid-cols-[minmax(0,1fr)_minmax(360px,430px)]"
                : "lg:grid-cols-[minmax(0,1fr)_minmax(300px,var(--tool-controls-width))]"),
        )}
      >
        {controlsPosition === "left" ? controlsColumn : null}
        {previewColumn}
        {controlsPosition === "right" ? controlsColumn : null}
      </div>

      {actionsPlacement === "after-grid" ? desktopActions : null}
      {actionsPlacement === "under-preview" && mobileCodeAfterControls && codeSlot ? (
        <section className="min-w-0 lg:hidden">{codeSlot}</section>
      ) : null}
      {actionsPlacement !== "under-preview" && codeSlot ? <section className="min-w-0">{codeSlot}</section> : null}
      {presetsPlacement === "after-code" && presetsSlot ? <section className="min-w-0">{presetsSlot}</section> : null}
      {articleSlot ? <section className="min-w-0">{articleSlot}</section> : null}
      {mobileActions}
    </div>
  );
}
