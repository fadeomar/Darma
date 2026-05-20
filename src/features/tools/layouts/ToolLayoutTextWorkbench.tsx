"use client";

import { useState, type ReactNode } from "react";
import { ActionBar, Card } from "@/components/ui";

export function ToolLayoutTextWorkbench({
  inputSlot,
  outputSlot,
  actionsSlot,
  topActionsSlot,
  optionsSlot,
  statsSlot,
  articleSlot,
  inputLabel = "Input",
  outputLabel = "Output",
}: {
  inputSlot: ReactNode;
  outputSlot: ReactNode;
  actionsSlot?: ReactNode;
  /** Actions bar rendered ABOVE both panes — use for primary transform buttons */
  topActionsSlot?: ReactNode;
  optionsSlot?: ReactNode;
  statsSlot?: ReactNode;
  articleSlot?: ReactNode;
  inputLabel?: string;
  outputLabel?: string;
}) {
  const [mobileTab, setMobileTab] = useState<"input" | "output">("input");

  return (
    <div className="space-y-4">
      {topActionsSlot ? <ActionBar>{topActionsSlot}</ActionBar> : null}

      {/* Mobile tab bar */}
      <div className="flex overflow-hidden rounded-xl border border-black/10 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("input")}
          className={[
            "flex-1 py-2.5 text-sm font-semibold transition",
            mobileTab === "input"
              ? "bg-[var(--textColor,#0f172a)] text-[var(--baseColor,#ffffff)]"
              : "bg-white text-[var(--textColor,#0f172a)]/60 hover:bg-black/5",
          ].join(" ")}
        >
          {inputLabel}
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("output")}
          className={[
            "flex-1 py-2.5 text-sm font-semibold transition",
            mobileTab === "output"
              ? "bg-[var(--textColor,#0f172a)] text-[var(--baseColor,#ffffff)]"
              : "bg-white text-[var(--textColor,#0f172a)]/60 hover:bg-black/5",
          ].join(" ")}
        >
          {outputLabel}
        </button>
      </div>

      {/* Mobile: show only active tab */}
      <div className="lg:hidden">
        <Card variant="default" padding="md">
          {mobileTab === "input" ? inputSlot : outputSlot}
        </Card>
      </div>

      {/* Desktop: side by side */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-2">
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
