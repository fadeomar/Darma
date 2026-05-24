import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CompactFieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function CompactField({ label, hint, error, children, className }: CompactFieldProps) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      {label ? <span className="block text-xs font-semibold text-[var(--color-text)]">{label}</span> : null}
      {children}
      {hint ? <span className="block text-[11px] leading-4 text-[var(--color-text-soft)]">{hint}</span> : null}
      {error ? <span className="block text-[11px] font-semibold leading-4 text-[var(--color-danger)]">{error}</span> : null}
    </label>
  );
}
