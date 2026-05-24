import { type ReactNode, useId } from "react";
import { cn } from "@/lib/cn";

export type FieldDensity = "comfortable" | "compact";
export type FieldLayout = "stacked" | "inline";

export type FieldProps = {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
  density?: FieldDensity;
  layout?: FieldLayout;
};

export function Field({
  label,
  description,
  error,
  required,
  children,
  className,
  density = "comfortable",
  layout = "stacked",
}: FieldProps) {
  const descriptionId = useId();
  const errorId = useId();
  const isCompact = density === "compact";
  const isInline = layout === "inline";

  return (
    <div
      className={cn(
        isInline ? "grid gap-2 sm:grid-cols-[minmax(8rem,12rem),1fr] sm:items-start" : isCompact ? "space-y-1.5" : "space-y-2",
        className,
      )}
    >
      {label || description ? (
        <div className={cn(isInline && "pt-1")}>
          {label ? (
            <div className={cn(isCompact ? "text-xs font-semibold" : "text-sm font-bold", "text-[var(--color-text)]")}>
              {label}
              {required ? <span className="ml-1 text-[var(--color-danger)]" aria-hidden>*</span> : null}
            </div>
          ) : null}
          {description ? (
            <p id={descriptionId} className={cn(isCompact ? "text-[11px] leading-4" : "text-xs leading-5", "text-[var(--color-text-soft)]")}>
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className={cn(isInline && "min-w-0")}>{children}</div>
      {error ? (
        <p id={errorId} className={cn(isInline && "sm:col-start-2", "text-xs font-semibold text-[var(--color-danger)]")}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
