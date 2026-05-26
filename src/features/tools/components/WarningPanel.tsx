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
      {title ? <h2 className="text-sm font-bold text-[var(--color-text-primary)]">{title}</h2> : null}
      <div className="space-y-2">
        {messages.map((item) => {
          const severity = item.severity ?? "info";
          return (
            <div key={item.id} className={cn("rounded-[var(--radius-md)] border p-3", severityClass[severity])}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-current px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide opacity-75">
                  {severityLabel[severity]}
                </span>
                {item.title ? <h3 className="text-xs font-bold">{item.title}</h3> : null}
              </div>
              <div className="mt-1 text-xs leading-5 opacity-90">{item.message}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
