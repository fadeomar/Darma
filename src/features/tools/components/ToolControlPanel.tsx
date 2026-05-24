import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ToolControlPanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ToolControlPanel({ title, description, badge, footer, children, className }: ToolControlPanelProps) {
  const hasHeader = title || description || badge;

  return (
    <aside className={cn("rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm", className)}>
      {hasHeader ? (
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <div className="min-w-0 space-y-1">
            {title ? <h2 className="text-sm font-bold text-[var(--color-text)]">{title}</h2> : null}
            {description ? <p className="text-xs leading-5 text-[var(--color-text-soft)]">{description}</p> : null}
          </div>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
      ) : null}
      <div className="space-y-4 p-4">{children}</div>
      {footer ? <div className="border-t border-[var(--color-border)] px-4 py-3">{footer}</div> : null}
    </aside>
  );
}
