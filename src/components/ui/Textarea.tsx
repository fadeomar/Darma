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
  output: "font-mono leading-6 tabular-nums bg-[var(--color-bg-soft)]",
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
          "min-h-32 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3 text-sm leading-6 text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-accent)]",
          variantClass[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
