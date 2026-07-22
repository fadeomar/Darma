import type { ToolStatus } from "../types";

const toneClass = {
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  error: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
} as const;

export function StatusMessage({ status }: { status: ToolStatus }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`min-h-10 rounded-[var(--radius-sm)] border px-3 py-2 text-xs leading-5 ${toneClass[status.tone]}`}
    >
      {status.message}
    </div>
  );
}
