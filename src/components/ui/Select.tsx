import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type SelectSize = "sm" | "md" | "lg";
export type SelectWidth = "full" | "auto" | "compact" | "numeric" | "short" | "medium";

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  size?: SelectSize;
  width?: SelectWidth;
};

const sizeClass: Record<SelectSize, string> = {
  sm: "min-h-8 pl-2 pr-8 text-xs",
  md: "min-h-[38px] pl-3 pr-9 text-sm",
  lg: "min-h-11 pl-4 pr-10 text-base",
};

const widthClass: Record<SelectWidth, string> = {
  full: "w-full",
  auto: "w-auto",
  compact: "w-24",
  numeric: "w-[5.25rem]",
  short: "w-32",
  medium: "w-52 max-w-full",
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, size = "md", width = "full", "aria-invalid": ariaInvalid, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={ariaInvalid}
      className={cn(
        "darma-select-control rounded-[var(--radius-sm)] border bg-[var(--color-control-bg)] text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] outline-none transition duration-[var(--duration-fast)]",
        "border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]",
        "focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-base)] focus:shadow-[var(--focus-ring)]",
        "aria-[invalid=true]:border-[var(--color-danger)] aria-[invalid=true]:shadow-[0_0_0_3px_var(--color-danger-bg)]",
        "disabled:cursor-not-allowed disabled:bg-[var(--color-surface-subtle)] disabled:opacity-50",
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
