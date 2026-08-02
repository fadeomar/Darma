import { type ReactNode } from "react";
import { FileInput, FileOutput } from "lucide-react";
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
  const kind = readOnly ? "output" : "input";

  return (
    <section
      data-tool-region={kind}
      className={cn(
        "min-w-0 overflow-hidden rounded-[var(--radius-lg)] border shadow-[var(--shadow-tool-controls)]",
        readOnly
          ? "border-[var(--color-tool-output-border)] bg-[var(--color-tool-output-bg)] shadow-[var(--shadow-tool-result)]"
          : "border-[var(--color-tool-input-border)] bg-[var(--color-tool-input-bg)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3 border-b px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:px-5",
          readOnly
            ? "border-[var(--color-tool-output-border)] bg-[var(--color-tool-output-header)]"
            : "border-[var(--color-tool-input-border)] bg-[var(--color-tool-input-header)]",
        )}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {readOnly ? <FileOutput className="h-4 w-4 text-[var(--color-accent)]" aria-hidden /> : <FileInput className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />}
            <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{readOnly ? "Output" : "Input"}</span>
            {language ? (
              <span className="rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] px-2 py-0.5 font-mono text-xs font-bold uppercase leading-none tracking-[0.07em] text-[var(--color-text-secondary)]">
                {language}
              </span>
            ) : null}
          </div>
          {title ? <h2 className="mt-1 text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{title}</h2> : null}
          {description ? <p className="mt-1 text-[13px] leading-5 text-[var(--color-text-secondary)]">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="space-y-2.5 p-4 sm:p-5">
        <Textarea
          variant={readOnly ? "output" : "editor"}
          value={value}
          readOnly={readOnly}
          minRows={minRows}
          placeholder={placeholder}
          aria-invalid={Boolean(error) || undefined}
          onChange={(event) => onChange?.(event.target.value)}
          className={cn(
            readOnly && "border-[var(--color-tool-output-border)] bg-[var(--color-surface-inset)]",
          )}
        />
        {error ? <p className="text-sm font-semibold leading-5 text-[var(--color-danger-text)]">{error}</p> : null}
        {footer ? <div className="font-mono text-xs leading-5 text-[var(--color-text-secondary)]">{footer}</div> : null}
      </div>
    </section>
  );
}
