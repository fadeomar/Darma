import { type ReactNode } from "react";
import { ActionBar, PreviewFrame } from "@/components/ui";

export function ToolLayoutVisualGenerator({
  previewSlot,
  controlsSlot,
  codeSlot,
  actionsSlot,
  presetsSlot,
  articleSlot,
}: {
  previewSlot: ReactNode;
  controlsSlot?: ReactNode;
  codeSlot?: ReactNode;
  actionsSlot?: ReactNode;
  presetsSlot?: ReactNode;
  articleSlot?: ReactNode;
}) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <PreviewFrame className="min-h-[360px] sm:min-h-[460px] xl:min-h-[540px]">
          {previewSlot}
        </PreviewFrame>
        {controlsSlot ? <aside className="min-w-0">{controlsSlot}</aside> : null}
      </div>

      {actionsSlot ? <ActionBar align="between">{actionsSlot}</ActionBar> : null}
      {codeSlot ? <section className="min-w-0">{codeSlot}</section> : null}
      {presetsSlot ? <section className="min-w-0">{presetsSlot}</section> : null}
      {articleSlot ? <section className="min-w-0">{articleSlot}</section> : null}
    </div>
  );
}
