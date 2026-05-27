import { type ReactNode } from "react";
import { Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";

export type EditorPanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  language?: ReactNode;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minRows?: number;
  error?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function EditorPanel({
  title,
  description,
  language,
  value,
  onChange,
  placeholder,
  readOnly,
  minRows = 12,
  error,
  actions,
  footer,
  className,
}: EditorPanelProps) {
  return (
    <section className={cn("overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]", className)}>
      <div className="flex flex-col gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {title ? <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--color-text-primary)]">{title}</h2> : null}
            {language ? (
              <span className="rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-[var(--color-text-tertiary)]">
                {language}
              </span>
            ) : null}
          </div>
          {description ? <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="space-y-2.5 p-3.5 sm:p-4">
        <Textarea
          variant={readOnly ? "output" : "editor"}
          value={value}
          readOnly={readOnly}
          minRows={minRows}
          placeholder={placeholder}
          aria-invalid={Boolean(error) || undefined}
          onChange={(event) => onChange?.(event.target.value)}
          className={cn(readOnly && "bg-[var(--color-surface-inset)]")}
        />
        {error ? <p className="text-xs font-semibold leading-5 text-[var(--color-danger-text)]">{error}</p> : null}
        {footer ? <div className="font-mono text-[11px] leading-5 text-[var(--color-text-tertiary)]">{footer}</div> : null}
      </div>
    </section>
  );
}
