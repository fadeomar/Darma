import { type ReactNode } from "react";
import { ActionBar, Card, PreviewFrame } from "@/components/ui";

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
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PreviewFrame>{previewSlot}</PreviewFrame>
        {controlsSlot ? <Card variant="default" padding="md">{controlsSlot}</Card> : null}
      </div>
      {actionsSlot ? <ActionBar>{actionsSlot}</ActionBar> : null}
      {presetsSlot ? <Card variant="default" padding="md">{presetsSlot}</Card> : null}
      {codeSlot ? <Card variant="default" padding="md">{codeSlot}</Card> : null}
      {articleSlot ? <div>{articleSlot}</div> : null}
    </div>
  );
}
