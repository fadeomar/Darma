import { type ReactNode } from "react";
import { ActionBar, Card } from "@/components/ui";

export function ToolLayoutSingleUtility({
  resultSlot,
  controlsSlot,
  actionsSlot,
  infoSlot,
  articleSlot,
}: {
  resultSlot: ReactNode;
  controlsSlot?: ReactNode;
  actionsSlot?: ReactNode;
  infoSlot?: ReactNode;
  articleSlot?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card variant="elevated" padding="lg" className="text-center">{resultSlot}</Card>
      {actionsSlot ? <ActionBar className="justify-center">{actionsSlot}</ActionBar> : null}
      {controlsSlot ? <Card variant="default" padding="md">{controlsSlot}</Card> : null}
      {infoSlot ? <Card variant="default" padding="md">{infoSlot}</Card> : null}
      {articleSlot ? <div>{articleSlot}</div> : null}
    </div>
  );
}
