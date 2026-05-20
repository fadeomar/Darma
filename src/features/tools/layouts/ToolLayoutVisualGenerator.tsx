import { type CSSProperties, type ReactNode } from "react";
import { ActionBar, Card, PreviewFrame } from "@/components/ui";

export function ToolLayoutVisualGenerator({
  previewSlot,
  controlsSlot,
  codeSlot,
  actionsSlot,
  presetsSlot,
  articleSlot,
  previewMinHeight = "420px",
  controlsWidth = "360px",
}: {
  previewSlot: ReactNode;
  controlsSlot?: ReactNode;
  codeSlot?: ReactNode;
  actionsSlot?: ReactNode;
  presetsSlot?: ReactNode;
  articleSlot?: ReactNode;
  /** CSS height value for the preview frame minimum height. Defaults to "420px". */
  previewMinHeight?: string;
  /** CSS width for the controls sidebar. Defaults to "360px". */
  controlsWidth?: string;
}) {
  return (
    <div className="space-y-6">
      <div
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_var(--tool-controls-width)]"
        style={{ "--tool-controls-width": controlsWidth } as CSSProperties}
      >
        <PreviewFrame style={{ "--tool-preview-min-height": previewMinHeight } as CSSProperties}>
          {previewSlot}
        </PreviewFrame>
        {controlsSlot ? <Card variant="default" padding="md">{controlsSlot}</Card> : null}
      </div>
      {actionsSlot ? <ActionBar>{actionsSlot}</ActionBar> : null}
      {presetsSlot ? <Card variant="default" padding="md">{presetsSlot}</Card> : null}
      {codeSlot ? <Card variant="default" padding="md">{codeSlot}</Card> : null}
      {articleSlot ? <div>{articleSlot}</div> : null}
    </div>
  );
}
