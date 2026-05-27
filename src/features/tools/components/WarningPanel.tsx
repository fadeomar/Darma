import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type WarningMessage = {
  id: string;
  severity?: "info" | "success" | "warning" | "danger";
  title?: ReactNode;
  message: ReactNode;
};

export type WarningPanelProps = {
  messages: WarningMessage[];
  title?: ReactNode;
  className?: string;
};

const severityClass: Record<NonNullable<WarningMessage["severity"]>, string> = {
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

const severityLabel: Record<NonNullable<WarningMessage["severity"]>, string> = {
  info: "Info",
  success: "Success",
  warning: "Warning",
  danger: "Danger",
};

export function WarningPanel({ messages, title, className }: WarningPanelProps) {
  if (!messages.length) return null;

  return (
    <section className={cn("space-y-2", className)} aria-live="polite">
      {title ? <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{title}</h2> : null}
      <div className="space-y-2">
        {messages.map((item) => {
          const severity = item.severity ?? "info";
          return (
            <div key={item.id} className={cn("rounded-[var(--radius-md)] border px-3 py-2.5 shadow-[var(--shadow-xs)]", severityClass[severity])}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-[var(--radius-full)] border border-current px-2 py-0.5 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.08em] opacity-75">
                  {severityLabel[severity]}
                </span>
                {item.title ? <h3 className="text-xs font-bold leading-5">{item.title}</h3> : null}
              </div>
              <div className="mt-1 text-xs leading-5 opacity-90">{item.message}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
