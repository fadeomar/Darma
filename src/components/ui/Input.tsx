import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-accent)]",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
