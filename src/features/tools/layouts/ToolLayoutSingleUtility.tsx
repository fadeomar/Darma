import { type ReactNode } from "react";
import { ActionBar } from "@/components/ui";
import { cn } from "@/lib/cn";

export function ToolLayoutSingleUtility({
  resultSlot,
  controlsSlot,
  actionsSlot,
  presetsSlot,
  infoSlot,
  articleSlot,
}: {
  resultSlot: ReactNode;
  controlsSlot?: ReactNode;
  actionsSlot?: ReactNode;
  presetsSlot?: ReactNode;
  infoSlot?: ReactNode;
  articleSlot?: ReactNode;
}) {
  if (presetsSlot) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
        {controlsSlot && <section className="min-w-0">{controlsSlot}</section>}
        <div className="px-1">{presetsSlot}</div>
        <section className="min-w-0 [&>section]:shadow-[var(--shadow-md)]">{resultSlot}</section>
        {infoSlot && <section className="min-w-0">{infoSlot}</section>}
        {articleSlot && <section className="min-w-0">{articleSlot}</section>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      <section className="min-w-0 [&>section]:shadow-[var(--shadow-md)]">{resultSlot}</section>
      {actionsSlot ? <ActionBar align="center">{actionsSlot}</ActionBar> : null}

      {(controlsSlot || infoSlot) ? (
        // Two columns only when both slots are filled. With one slot the grid
        // stays single-column instead of padding the row with an empty cell.
        <div
          className={cn(
            "grid gap-5",
            controlsSlot && infoSlot && "lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start",
          )}
        >
          {controlsSlot ? <section className="min-w-0">{controlsSlot}</section> : null}
          {infoSlot ? (
            // Sticky only helps when there is a taller sibling column to
            // scroll past.
            <aside className={cn("min-w-0 space-y-5", controlsSlot && "lg:sticky lg:top-24")}>{infoSlot}</aside>
          ) : null}
        </div>
      ) : null}

      {articleSlot ? <section className="min-w-0">{articleSlot}</section> : null}
    </div>
  );
}
