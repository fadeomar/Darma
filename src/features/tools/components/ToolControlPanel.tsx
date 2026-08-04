import { type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
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
      data-tool-region="controls"
      className={cn(
        "min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-bg)] shadow-[var(--shadow-tool-controls)]",
        "supports-[backdrop-filter]:backdrop-blur-sm",
        sticky && "lg:sticky lg:top-[6.75rem] lg:max-h-[calc(100vh-7.75rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain",
        className,
      )}
    >
      {hasHeader ? (
        <div className="border-b border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-header)] px-4 py-3.5 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-[var(--color-primary-text-strong)]" aria-hidden />
                <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Controls</span>
              </div>
              {title ? <h2 className="mt-1 text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{title}</h2> : null}
              {description ? <p className="mt-1 max-w-[34rem] text-[13px] leading-5 text-[var(--color-text-secondary)]">{description}</p> : null}
            </div>
            {badge ? <div className="shrink-0 pt-0.5">{badge}</div> : null}
          </div>
        </div>
      ) : null}

      <div className="space-y-4 p-4 sm:p-5">{children}</div>

      {footer ? (
        <div className="border-t border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-header)] px-4 py-3 text-xs leading-5 text-[var(--color-text-secondary)] sm:px-5">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}
