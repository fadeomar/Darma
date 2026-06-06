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
    <div className="space-y-5 sm:space-y-6">
      {categorySlot ? <section>{categorySlot}</section> : null}

      <PreviewFrame variant="studio" className="h-[clamp(420px,44vw,560px)] min-h-0 [&>*]:h-full">
        {previewSlot}
      </PreviewFrame>

      {actionBarSlot ? <ActionBar align="between">{actionBarSlot}</ActionBar> : null}

      {(examplesSlot || controlsSlot || sidebarSlot) ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:items-start">
          <div className="min-w-0 space-y-5">
            {examplesSlot ? <Card padding="md">{examplesSlot}</Card> : null}
            {sidebarSlot ? <Card padding="md">{sidebarSlot}</Card> : null}
          </div>
          {controlsSlot ? (
            <aside className="min-w-0 xl:sticky xl:top-24">
              <Card padding="md">{controlsSlot}</Card>
            </aside>
          ) : null}
        </div>
      ) : null}

      {articleSlot ? <section>{articleSlot}</section> : null}
    </div>
  );
}
