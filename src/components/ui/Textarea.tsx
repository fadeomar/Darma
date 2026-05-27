import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type TextareaVariant = "default" | "editor" | "output";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  variant?: TextareaVariant;
  minRows?: number;
};

const variantClass: Record<TextareaVariant, string> = {
  default: "",
  editor: "font-mono leading-7 tabular-nums",
  output: "bg-[var(--color-surface-inset)] font-mono leading-7 tabular-nums",
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = "default", minRows, rows, style, "aria-invalid": ariaInvalid, ...props }, ref) => {
    const resolvedRows = rows ?? minRows;
    const minHeight = minRows ? `${minRows * 1.5 + 1.5}rem` : undefined;

    return (
      <textarea
        ref={ref}
        rows={resolvedRows}
        aria-invalid={ariaInvalid}
        style={{ minHeight, ...style }}
        className={cn(
          "min-h-32 w-full rounded-[var(--radius-md)] border bg-[var(--color-control-bg)] p-3 text-sm leading-6 text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] outline-none transition duration-[var(--duration-fast)]",
          "border-[var(--color-border-default)] placeholder:text-[var(--color-text-tertiary)]",
          "hover:border-[var(--color-border-strong)]",
          "focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-base)] focus:shadow-[var(--focus-ring)]",
          "aria-[invalid=true]:border-[var(--color-danger)] aria-[invalid=true]:shadow-[0_0_0_3px_var(--color-danger-bg)]",
          "disabled:cursor-not-allowed disabled:bg-[var(--color-surface-subtle)] disabled:opacity-50",
          variantClass[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
