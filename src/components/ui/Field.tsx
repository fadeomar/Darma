import { type ReactNode, useId } from "react";
import { cn } from "@/lib/cn";

export function Field({
  label,
  description,
  error,
  required,
  children,
  className,
}: {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const descriptionId = useId();
  const errorId = useId();

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="text-sm font-bold text-[var(--color-text)]">
          {label}
          {required ? <span className="ml-1 text-[var(--color-danger)]" aria-hidden>*</span> : null}
        </div>
      ) : null}
      {description ? (
        <p id={descriptionId} className="text-xs leading-5 text-[var(--color-text-soft)]">
          {description}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={errorId} className="text-xs font-semibold text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
