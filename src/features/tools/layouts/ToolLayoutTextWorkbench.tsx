import { type ReactNode } from "react";
import { ActionBar } from "@/components/ui";
import { ToolMobileActions } from "@/features/tools/components/ToolMobileActions";
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
    <div data-tool-layout="text-workbench" className="space-y-5 sm:space-y-6">
      <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        <div className="min-w-0 [&>section]:h-full" data-tool-column="input" data-tool-region="input">{inputSlot}</div>
        <div id="tool-result" className="min-w-0 scroll-mt-28 [&>section]:h-full" data-tool-column="output" data-tool-region="output">{outputSlot}</div>
      </div>

      {actionsSlot ? (
        <>
          <ActionBar className="hidden md:flex" align="between">{actionsSlot}</ActionBar>
          <ToolMobileActions>{actionsSlot}</ToolMobileActions>
        </>
      ) : null}

      {(optionsSlot || statsSlot) ? (
        <div
          className={cn(
            "grid gap-5",
            optionsSlot && statsSlot && "lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start",
          )}
        >
          {optionsSlot ? <section className="min-w-0">{optionsSlot}</section> : null}
          {statsSlot ? (
            <aside className={cn("min-w-0", optionsSlot && "lg:sticky lg:top-[6.75rem]")}>{statsSlot}</aside>
          ) : null}
        </div>
      ) : null}

      {articleSlot ? <section className="min-w-0">{articleSlot}</section> : null}
    </div>
  );
}
