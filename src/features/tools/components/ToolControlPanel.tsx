import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ToolControlPanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  sticky?: boolean;
};

export function ToolControlPanel({
  title,
  description,
  badge,
  footer,
  children,
  className,
  sticky = true,
}: ToolControlPanelProps) {
  const hasHeader = title || description || badge;

  return (
    <aside
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]",
        "supports-[backdrop-filter]:backdrop-blur-sm",
        sticky && "lg:sticky lg:top-24 lg:self-start",
        className,
      )}
    >
      {hasHeader ? (
        <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/72 px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              {title ? <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--color-text-primary)]">{title}</h2> : null}
              {description ? <p className="max-w-[34rem] text-xs leading-5 text-[var(--color-text-tertiary)]">{description}</p> : null}
            </div>
            {badge ? <div className="shrink-0 pt-0.5">{badge}</div> : null}
          </div>
        </div>
      ) : null}

      <div className="space-y-4 p-3.5 sm:p-4">{children}</div>

      {footer ? (
        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/55 px-4 py-3 text-xs leading-5 text-[var(--color-text-tertiary)]">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}
