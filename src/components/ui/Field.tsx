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
  valueMeta?: ReactNode;
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
  valueMeta,
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
      {label || description || valueMeta ? (
        <div className={cn(isInline && "pt-1")}>
          {label || valueMeta ? (
            <div className="flex items-center justify-between gap-3">
              {label ? (
                <div
                  className={cn(
                    "font-mono text-[10px] font-bold uppercase leading-4 tracking-[0.08em] text-[var(--color-text-tertiary)]",
                    !isCompact && "text-[11px]",
                  )}
                >
                  {label}
                  {required ? <span className="ml-1 text-[var(--color-danger)]" aria-hidden>*</span> : null}
                </div>
              ) : null}
              {valueMeta ? <div className="font-mono text-[10px] font-semibold text-[var(--color-text-tertiary)]">{valueMeta}</div> : null}
            </div>
          ) : null}
          {description ? (
            <p id={descriptionId} className={cn(isCompact ? "text-[11px] leading-4" : "text-xs leading-5", "text-[var(--color-text-tertiary)]")}>
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className={cn(isInline && "min-w-0")}>{children}</div>
      {error ? (
        <p id={errorId} className={cn(isInline && "sm:col-start-2", "text-xs font-semibold leading-5 text-[var(--color-danger-text)]")}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
