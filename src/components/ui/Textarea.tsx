import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type TextareaVariant = "default" | "editor" | "output";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  variant?: TextareaVariant;
  minRows?: number;
};

const variantClass: Record<TextareaVariant, string> = {
  default: "",
  editor: "font-mono leading-6 tabular-nums",
  output: "font-mono leading-6 tabular-nums bg-[var(--color-surface-inset)]",
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = "default", minRows, rows, style, ...props }, ref) => {
    const resolvedRows = rows ?? minRows;
    const minHeight = minRows ? `${minRows * 1.5 + 1.5}rem` : undefined;

    return (
      <textarea
        ref={ref}
        rows={resolvedRows}
        style={{ minHeight, ...style }}
        className={cn(
          "min-h-32 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-control-bg)] p-3 text-sm leading-6 text-[var(--color-text-primary)] outline-none transition",
          "placeholder:text-[var(--color-text-tertiary)]",
          "hover:border-[var(--color-border-strong)]",
          "focus:border-[var(--color-accent)] focus:bg-[var(--color-surface-base)]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-surface-subtle)]",
          variantClass[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
