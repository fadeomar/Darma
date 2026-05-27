import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ControlSectionProps = {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  compact?: boolean;
};

export function ControlSection({ title, description, action, meta, children, className, compact = false }: ControlSectionProps) {
  const hasHeader = title || description || action || meta;

  return (
    <section
      className={cn(
        "space-y-3 border-t border-[var(--color-border-subtle)] first:border-t-0 first:pt-0",
        compact ? "pt-3" : "pt-4",
        className,
      )}
    >
      {hasHeader ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {title ? (
                <h3 className="font-mono text-[11px] font-bold uppercase leading-none tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  {title}
                </h3>
              ) : null}
              {meta ? <span className="text-[11px] font-medium leading-none text-[var(--color-text-tertiary)]">{meta}</span> : null}
            </div>
            {description ? <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">{description}</p> : null}
          </div>
          {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn("space-y-3", compact && "space-y-2.5")}>{children}</div>
    </section>
  );
}
