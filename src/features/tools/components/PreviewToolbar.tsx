import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PreviewToolbarProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function PreviewToolbar({ title, description, actions, children, className }: PreviewToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-[var(--color-preview-border)] bg-[var(--color-surface-base)]/88 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {title ? <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--color-text-primary)]">{title}</h2> : null}
        {description ? <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">{description}</p> : null}
        {children ? <div className="pt-1">{children}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
