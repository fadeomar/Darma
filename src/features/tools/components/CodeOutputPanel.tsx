"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Button, CopyButton, Tabs } from "@/components/ui";
import { cn } from "@/lib/cn";

export type CodeOutputTab = {
  id: string;
  label: ReactNode;
  code: string;
  language?: string;
  filename?: string;
};

export type CodeOutputPanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  tabs: CodeOutputTab[];
  defaultTab?: string;
  emptyMessage?: ReactNode;
  actions?: ReactNode;
  onDownload?: (tab: CodeOutputTab) => void;
  className?: string;
};

export function CodeOutputPanel({ title, description, tabs, defaultTab, emptyMessage = "Nothing generated yet.", actions, onDownload, className }: CodeOutputPanelProps) {
  const initialTab = defaultTab && tabs.some((tab) => tab.id === defaultTab) ? defaultTab : tabs[0]?.id ?? "";
  const [activeTab, setActiveTab] = useState(initialTab);
  const currentTab = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab, tabs]);
  const hasCode = Boolean(currentTab?.code);

  return (
    <section className={cn("overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm", className)}>
      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          {title ? <h2 className="text-sm font-bold text-[var(--color-text)]">{title}</h2> : null}
          {description ? <p className="text-xs leading-5 text-[var(--color-text-soft)]">{description}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
          {currentTab && hasCode ? <CopyButton text={currentTab.code} size="sm" variant="secondary">Copy</CopyButton> : null}
          {currentTab && onDownload ? <Button size="sm" variant="secondary" onClick={() => onDownload(currentTab)}>Download</Button> : null}
        </div>
      </div>

      {tabs.length > 1 ? (
        <div className="border-b border-[var(--color-border)] px-4 py-3">
          <Tabs
            ariaLabel="Generated code tabs"
            items={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
            value={currentTab?.id ?? activeTab}
            onChange={setActiveTab}
          />
        </div>
      ) : null}

      <div className="bg-[var(--color-bg-soft)] p-4">
        {currentTab && hasCode ? (
          <pre className="max-h-[32rem] overflow-auto rounded-[var(--radius-md)] bg-[var(--color-surface-strong)] p-4 text-xs leading-6 text-[var(--color-text)]">
            <code data-language={currentTab.language}>{currentTab.code}</code>
          </pre>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-strong)] p-6 text-center text-sm text-[var(--color-text-soft)]">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}
