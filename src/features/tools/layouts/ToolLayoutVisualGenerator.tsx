import { type ReactNode } from "react";
import { ActionBar, PreviewFrame } from "@/components/ui";
import { cn } from "@/lib/cn";

export function ToolLayoutVisualGenerator({
  previewSlot,
  controlsSlot,
  codeSlot,
  actionsSlot,
  presetsSlot,
  articleSlot,
  actionsPlacement = "after-grid",
}: {
  previewSlot: ReactNode;
  controlsSlot?: ReactNode;
  codeSlot?: ReactNode;
  actionsSlot?: ReactNode;
  presetsSlot?: ReactNode;
  articleSlot?: ReactNode;
  actionsPlacement?: "after-grid" | "under-preview";
}) {
  const actions = actionsSlot ? <ActionBar align="between">{actionsSlot}</ActionBar> : null;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="min-w-0 space-y-4">
          <PreviewFrame className="min-h-[360px] sm:min-h-[460px] xl:min-h-[540px]">
            {previewSlot}
          </PreviewFrame>
          {actionsPlacement === "under-preview" ? actions : null}
          {actionsPlacement === "under-preview" && codeSlot ? (
            <section className="min-w-0">{codeSlot}</section>
          ) : null}
        </div>
        {controlsSlot ? (
          <aside
            className={cn(
              "min-w-0",
              actionsPlacement === "under-preview" && "xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:overscroll-contain xl:pr-1",
            )}
          >
            {controlsSlot}
          </aside>
        ) : null}
      </div>

      {actionsPlacement === "after-grid" ? actions : null}
      {actionsPlacement !== "under-preview" && codeSlot ? <section className="min-w-0">{codeSlot}</section> : null}
      {presetsSlot ? <section className="min-w-0">{presetsSlot}</section> : null}
      {articleSlot ? <section className="min-w-0">{articleSlot}</section> : null}
    </div>
  );
}
