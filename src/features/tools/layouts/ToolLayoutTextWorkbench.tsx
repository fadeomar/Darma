import { type ReactNode } from "react";
import { ActionBar, Card } from "@/components/ui";

export function ToolLayoutTextWorkbench({
  inputSlot,
  outputSlot,
  actionsSlot,
  optionsSlot,
  statsSlot,
  articleSlot,
}: {
  inputSlot: ReactNode;
  outputSlot: ReactNode;
  actionsSlot?: ReactNode;
  optionsSlot?: ReactNode;
  statsSlot?: ReactNode;
  articleSlot?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="default" padding="md">{inputSlot}</Card>
        <Card variant="default" padding="md">{outputSlot}</Card>
      </div>
      {actionsSlot ? <ActionBar>{actionsSlot}</ActionBar> : null}
      {statsSlot ? <div>{statsSlot}</div> : null}
      {optionsSlot ? <Card variant="default" padding="md">{optionsSlot}</Card> : null}
      {articleSlot ? <div>{articleSlot}</div> : null}
    </div>
  );
}
