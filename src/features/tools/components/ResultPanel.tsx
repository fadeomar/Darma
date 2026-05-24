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
  return (
    <section className={cn("rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          {title ? <h2 className="text-sm font-bold text-[var(--color-text)]">{title}</h2> : null}
          {description ? <p className="text-xs leading-5 text-[var(--color-text-soft)]">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 text-sm text-[var(--color-text)]">
        {value ?? <span className="text-[var(--color-text-soft)]">{empty}</span>}
      </div>
    </section>
  );
}
