import { type ReactNode } from "react";
import { ActionBar } from "@/components/ui";
import { cn } from "@/lib/cn";

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
    <div className="space-y-5 sm:space-y-6">
      <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        <div className="min-w-0 [&>section]:h-full">{inputSlot}</div>
        <div className="min-w-0 [&>section]:h-full">{outputSlot}</div>
      </div>

      {actionsSlot ? <ActionBar align="between">{actionsSlot}</ActionBar> : null}

      {(optionsSlot || statsSlot) ? (
        // Two columns only when both slots are filled. With one slot the grid
        // stays single-column instead of padding the row with an empty cell.
        <div
          className={cn(
            "grid gap-5",
            optionsSlot && statsSlot && "lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start",
          )}
        >
          {optionsSlot ? <section className="min-w-0">{optionsSlot}</section> : null}
          {statsSlot ? (
            // Sticky only helps when there is a taller sibling column to
            // scroll past.
            <aside className={cn("min-w-0", optionsSlot && "lg:sticky lg:top-24")}>{statsSlot}</aside>
          ) : null}
        </div>
      ) : null}

      {articleSlot ? <section className="min-w-0">{articleSlot}</section> : null}
    </div>
  );
}
