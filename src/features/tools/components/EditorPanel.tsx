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

export function EditorPanel({ title, description, language, value, onChange, placeholder, readOnly, minRows = 12, error, actions, footer, className }: EditorPanelProps) {
  return (
    <section className={cn("overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm", className)}>
      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {title ? <h2 className="text-sm font-bold text-[var(--color-text)]">{title}</h2> : null}
            {language ? <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-soft)]">{language}</span> : null}
          </div>
          {description ? <p className="text-xs leading-5 text-[var(--color-text-soft)]">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="space-y-2 p-4">
        <Textarea
          variant={readOnly ? "output" : "editor"}
          value={value}
          readOnly={readOnly}
          minRows={minRows}
          placeholder={placeholder}
          onChange={(event) => onChange?.(event.target.value)}
        />
        {error ? <p className="text-xs font-semibold text-[var(--color-danger)]">{error}</p> : null}
        {footer ? <div className="text-xs leading-5 text-[var(--color-text-soft)]">{footer}</div> : null}
      </div>
    </section>
  );
}
