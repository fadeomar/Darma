import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CompactFieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
};

export function CompactField({ label, hint, error, children, className, labelClassName }: CompactFieldProps) {
  return (
    <label className={cn("block min-w-0 space-y-1.5", className)}>
      {label ? (
        <span
          className={cn(
            "block font-mono text-xs font-bold uppercase leading-none tracking-[0.07em] text-[var(--color-text-tertiary)]",
            labelClassName,
          )}
        >
          {label}
        </span>
      ) : null}
      {children}
      {hint ? <span className="block text-xs leading-4 text-[var(--color-text-tertiary)]">{hint}</span> : null}
      {error ? <span className="block text-xs font-semibold leading-4 text-[var(--color-danger-text)]">{error}</span> : null}
    </label>
  );
}
