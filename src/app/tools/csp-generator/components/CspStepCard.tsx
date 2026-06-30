import { type ReactNode } from "react";

export function CspStepCard({
  step,
  title,
  description,
  action,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-primary)] font-mono text-xs font-black text-[var(--color-primary-text)]">
            {step}
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black tracking-[-0.01em] text-[var(--color-text-primary)]">{title}</h3>
            {description ? <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{description}</p> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
