import { type ReactNode } from "react";
import { CircleCheck, Gauge } from "lucide-react";
import { cn } from "@/lib/cn";

export type ResultPanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  value?: ReactNode;
  actions?: ReactNode;
  status?: ReactNode;
  empty?: ReactNode;
  className?: string;
  valueClassName?: string;
  emphasis?: "default" | "strong";
};

export function ResultPanel({
  title,
  description,
  value,
  actions,
  status,
  empty = "Enter values or run the tool to see a result.",
  className,
  valueClassName,
  emphasis = "default",
}: ResultPanelProps) {
  const hasHeader = title || description || actions || status;

  return (
    <section
      data-tool-region="result"
      className={cn(
        "relative min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-tool-result-border)] bg-[var(--color-tool-result-bg)] shadow-[var(--shadow-tool-result)]",
        "before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[var(--color-primary)]",
        className,
      )}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-3 border-b border-[var(--color-tool-result-border)] bg-[var(--color-tool-result-header)] px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Gauge className="h-4 w-4 shrink-0 text-[var(--color-tool-result-accent)]" aria-hidden />
              <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Result</span>
              {status ? <div>{status}</div> : null}
            </div>
            {title ? <h2 className="mt-1 text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-lg">{title}</h2> : null}
            {description ? <p className="mt-1 text-[13px] leading-5 text-[var(--color-text-secondary)] sm:text-sm sm:leading-6">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="p-4 sm:p-5">
        <div
          className={cn(
            "min-h-28 rounded-[var(--radius-md)] border border-[var(--color-tool-result-border)] bg-[var(--color-surface-raised)] p-4 text-sm leading-6 text-[var(--color-text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] sm:p-5",
            emphasis === "strong" && "min-h-36",
            valueClassName,
          )}
        >
          {value ?? (
            <div className="flex min-h-20 items-center gap-3 text-[var(--color-text-secondary)]">
              <CircleCheck className="h-5 w-5 shrink-0 text-[var(--color-tool-result-accent)] opacity-70" aria-hidden />
              <span>{empty}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
