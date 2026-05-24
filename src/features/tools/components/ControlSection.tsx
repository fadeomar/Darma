import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ControlSectionProps = {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ControlSection({ title, description, action, children, className }: ControlSectionProps) {
  const hasHeader = title || description || action;

  return (
    <section className={cn("space-y-3 border-t border-[var(--color-border)] pt-4 first:border-t-0 first:pt-0", className)}>
      {hasHeader ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            {title ? <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3> : null}
            {description ? <p className="text-xs leading-5 text-[var(--color-text-soft)]">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className="space-y-3">{children}</div>
    </section>
  );
}
