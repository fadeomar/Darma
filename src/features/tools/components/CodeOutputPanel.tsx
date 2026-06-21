"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Download } from "lucide-react";
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

export function CodeOutputPanel({
  title,
  description,
  tabs,
  defaultTab,
  emptyMessage = "Nothing generated yet.",
  actions,
  onDownload,
  className,
}: CodeOutputPanelProps) {
  const initialTab = defaultTab && tabs.some((tab) => tab.id === defaultTab) ? defaultTab : tabs[0]?.id ?? "";
  const [activeTab, setActiveTab] = useState(initialTab);
  const currentTab = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab, tabs]);
  const hasCode = Boolean(currentTab?.code);

  return (
    <section className={cn("overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-code-border)] [border-top:2px_solid_var(--color-primary)] bg-[var(--color-code-bg)] shadow-[var(--shadow-md)]", className)}>
      <div className="flex flex-col gap-3 border-b border-[var(--color-code-border)] bg-[var(--color-code-surface)] px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {title ? <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--color-code-text)]">{title}</h2> : null}
            {currentTab?.language ? (
              <span className="rounded-[var(--radius-full)] border border-[var(--color-code-border)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-[var(--color-code-muted)]">
                {currentTab.language}
              </span>
            ) : null}
          </div>
          {description ? <p className="text-xs leading-5 text-[var(--color-code-muted)]">{description}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
          {currentTab && hasCode ? <CopyButton text={currentTab.code} size="sm" variant="soft">Copy</CopyButton> : null}
          {currentTab && onDownload ? <Button size="sm" variant="secondary" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={() => onDownload(currentTab)}>Download</Button> : null}
        </div>
      </div>

      {tabs.length > 1 ? (
        <div className="border-b border-[var(--color-code-border)] bg-[var(--color-code-surface)]/78 px-4 py-3">
          <Tabs
            ariaLabel="Generated code tabs"
            items={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
            value={currentTab?.id ?? activeTab}
            onChange={setActiveTab}
            className="border-[var(--color-code-border)] bg-[rgba(244,241,234,0.06)] [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-orange-500 [&_button]:focus-visible:ring-offset-2 [&_button]:focus-visible:ring-offset-slate-950 [&_button:not([aria-selected='true'])]:text-slate-300 [&_button:not([aria-selected='true'])]:hover:bg-white/10 [&_button:not([aria-selected='true'])]:hover:text-white [&_button[aria-selected='true']]:bg-white [&_button[aria-selected='true']]:text-slate-950"
          />
        </div>
      ) : null}

      <div className="p-3.5 sm:p-4">
        {currentTab && hasCode ? (
          <pre className="darma-code-output-pre favicon-code-pre min-h-[22rem] max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)] p-4 font-mono text-xs leading-6 text-[var(--color-code-text)] shadow-[inset_0_1px_0_rgba(244,241,234,0.04)]">
            <code data-language={currentTab.language}>{currentTab.code}</code>
          </pre>
        ) : (
          <div className="min-h-[22rem] rounded-[var(--radius-md)] border border-dashed border-[var(--color-code-border)] bg-[var(--color-code-surface)] p-6 text-center text-sm text-[var(--color-code-muted)]">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}
