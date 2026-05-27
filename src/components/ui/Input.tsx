import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type InputSize = "sm" | "md" | "lg";
export type InputWidth = "full" | "auto" | "compact" | "numeric" | "short" | "medium";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: InputSize;
  width?: InputWidth;
};

const sizeClass: Record<InputSize, string> = {
  sm: "min-h-8 px-2 text-xs",
  md: "min-h-[38px] px-3 text-sm",
  lg: "min-h-11 px-4 text-base",
};

const widthClass: Record<InputWidth, string> = {
  full: "w-full",
  auto: "w-auto",
  compact: "w-24",
  numeric: "w-[5.25rem]",
  short: "w-32",
  medium: "w-52 max-w-full",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size = "md", width = "full", "aria-invalid": ariaInvalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={ariaInvalid}
      className={cn(
        "rounded-[var(--radius-sm)] border bg-[var(--color-control-bg)] text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] outline-none transition duration-[var(--duration-fast)]",
        "border-[var(--color-border-default)] placeholder:text-[var(--color-text-tertiary)]",
        "hover:border-[var(--color-border-strong)]",
        "focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-base)] focus:shadow-[var(--focus-ring)]",
        "aria-[invalid=true]:border-[var(--color-danger)] aria-[invalid=true]:shadow-[0_0_0_3px_var(--color-danger-bg)]",
        "disabled:cursor-not-allowed disabled:bg-[var(--color-surface-subtle)] disabled:opacity-50",
        sizeClass[size],
        widthClass[width],
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
