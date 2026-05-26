import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type SelectSize = "sm" | "md" | "lg";
export type SelectWidth = "full" | "auto" | "compact" | "numeric" | "short" | "medium";

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  size?: SelectSize;
  width?: SelectWidth;
};

const sizeClass: Record<SelectSize, string> = {
  sm: "min-h-9 px-2 text-xs",
  md: "min-h-11 px-3 text-sm",
  lg: "min-h-12 px-4 text-base",
};

const widthClass: Record<SelectWidth, string> = {
  full: "w-full",
  auto: "w-auto",
  compact: "w-24",
  numeric: "w-20",
  short: "w-32",
  medium: "w-48 max-w-full",
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, size = "md", width = "full", ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-control-bg)] text-[var(--color-text-primary)] outline-none transition",
        "hover:border-[var(--color-border-strong)]",
        "focus:border-[var(--color-accent)]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-surface-subtle)]",
        sizeClass[size],
        widthClass[width],
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);

Select.displayName = "Select";
