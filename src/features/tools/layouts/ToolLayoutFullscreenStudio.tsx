import { type ReactNode } from "react";
import { ActionBar, Card, PreviewFrame } from "@/components/ui";

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
    <div className="space-y-6">
      {categorySlot ? <div>{categorySlot}</div> : null}
      <PreviewFrame className="min-h-[520px] bg-slate-950">{previewSlot}</PreviewFrame>
      {actionBarSlot ? <ActionBar>{actionBarSlot}</ActionBar> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        {examplesSlot ? <Card variant="default" padding="md">{examplesSlot}</Card> : null}
        {controlsSlot ? <Card variant="default" padding="md">{controlsSlot}</Card> : null}
      </div>
      {sidebarSlot ? <div>{sidebarSlot}</div> : null}
      {articleSlot ? <div>{articleSlot}</div> : null}
    </div>
  );
}
