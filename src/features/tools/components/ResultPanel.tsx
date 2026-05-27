import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ResultPanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  value?: ReactNode;
  actions?: ReactNode;
  empty?: ReactNode;
  className?: string;
};

export function ResultPanel({ title, description, value, actions, empty = "No result yet.", className }: ResultPanelProps) {
  const hasHeader = title || description || actions;

  return (
    <section className={cn("overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]", className)}>
      {hasHeader ? (
        <div className="flex flex-col gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            {title ? <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--color-text-primary)]">{title}</h2> : null}
            {description ? <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="p-3.5 sm:p-4">
        <div className="min-h-24 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 text-sm leading-6 text-[var(--color-text-primary)] shadow-[inset_0_1px_0_var(--color-border-subtle)]">
          {value ?? <span className="text-[var(--color-text-tertiary)]">{empty}</span>}
        </div>
      </div>
    </section>
  );
}
