import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type InputSize = "sm" | "md" | "lg";
export type InputWidth = "full" | "auto" | "compact" | "numeric" | "short" | "medium";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: InputSize;
  width?: InputWidth;
};

const sizeClass: Record<InputSize, string> = {
  sm: "min-h-9 px-2 text-xs",
  md: "min-h-11 px-3 text-sm",
  lg: "min-h-12 px-4 text-base",
};

const widthClass: Record<InputWidth, string> = {
  full: "w-full",
  auto: "w-auto",
  compact: "w-24",
  numeric: "w-20",
  short: "w-32",
  medium: "w-48 max-w-full",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size = "md", width = "full", ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-accent)]",
        sizeClass[size],
        widthClass[width],
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
