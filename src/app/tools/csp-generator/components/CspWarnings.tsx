import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CspValidationMessage } from "../types";

const SEVERITY_STYLE = {
  error: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
} as const;

function rank(message: CspValidationMessage) {
  if (message.type === "error") return 0;
  if (message.type === "warning") return message.severity === "high" ? 1 : 2;
  return 3;
}

export function CspWarnings({ messages }: { messages: CspValidationMessage[] }) {
  const sorted = [...messages].sort((a, b) => rank(a) - rank(b));
  const visible = sorted.slice(0, 6);
  const hidden = sorted.length - visible.length;

  const problems = sorted.filter((message) => message.type !== "info").length;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        {problems === 0 ? (
          <ShieldCheck className="h-4 w-4 text-[var(--color-success-text)]" aria-hidden />
        ) : (
          <AlertTriangle className="h-4 w-4 text-[var(--color-warning-text)]" aria-hidden />
        )}
        <p className="text-sm font-bold text-[var(--color-text-primary)]">
          {problems === 0 ? "No blocking warnings detected" : `${problems} thing${problems === 1 ? "" : "s"} to review`}
        </p>
      </div>

      <ul className="space-y-2" aria-live="polite">
        {visible.map((message, index) => {
          const Icon = message.type === "info" ? Info : AlertTriangle;
          return (
            <li
              key={`${message.type}-${index}-${message.directiveName ?? ""}`}
              className={cn("flex gap-2.5 rounded-[var(--radius-md)] border px-3 py-2.5 shadow-[var(--shadow-xs)]", SEVERITY_STYLE[message.type])}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
              <div className="min-w-0">
                {message.directiveName ? (
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] opacity-75">{message.directiveName}</span>
                ) : null}
                <p className="text-xs leading-5">{message.message}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {hidden > 0 ? (
        <p className="text-[11px] text-[var(--color-text-tertiary)]">+{hidden} more minor note{hidden === 1 ? "" : "s"} hidden to keep things readable.</p>
      ) : null}
    </div>
  );
}
