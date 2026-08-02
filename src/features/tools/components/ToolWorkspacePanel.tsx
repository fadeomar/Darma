import { type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ToolWorkspacePanelKind =
  | "controls"
  | "preview"
  | "result"
  | "input"
  | "output"
  | "support";

export type ToolWorkspacePanelProps = {
  as?: ElementType;
  kind: ToolWorkspacePanelKind;
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  sticky?: boolean;
};

const panelClass: Record<ToolWorkspacePanelKind, string> = {
  controls:
    "border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-bg)] shadow-[var(--shadow-tool-controls)]",
  preview:
    "border-[var(--color-tool-preview-border)] bg-[var(--color-tool-preview-bg)] shadow-[var(--shadow-tool-preview)]",
  result:
    "border-[var(--color-tool-result-border)] bg-[var(--color-tool-result-bg)] shadow-[var(--shadow-tool-result)]",
  input:
    "border-[var(--color-tool-input-border)] bg-[var(--color-tool-input-bg)] shadow-[var(--shadow-tool-controls)]",
  output:
    "border-[var(--color-tool-output-border)] bg-[var(--color-tool-output-bg)] shadow-[var(--shadow-tool-result)]",
  support:
    "border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]",
};

const headerClass: Record<ToolWorkspacePanelKind, string> = {
  controls: "border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-header)]",
  preview: "border-[var(--color-tool-preview-border)] bg-[var(--color-tool-preview-header)]",
  result: "border-[var(--color-tool-result-border)] bg-[var(--color-tool-result-header)]",
  input: "border-[var(--color-tool-input-border)] bg-[var(--color-tool-input-header)]",
  output: "border-[var(--color-tool-output-border)] bg-[var(--color-tool-output-header)]",
  support: "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/78",
};

const eyebrowLabel: Record<ToolWorkspacePanelKind, string> = {
  controls: "Controls",
  preview: "Live preview",
  result: "Result",
  input: "Input",
  output: "Output",
  support: "Details",
};

export function ToolWorkspacePanel({
  as,
  kind,
  eyebrow,
  title,
  description,
  status,
  actions,
  children,
  footer,
  className,
  bodyClassName,
  sticky = false,
}: ToolWorkspacePanelProps) {
  const Component = as ?? (kind === "controls" ? "aside" : "section");
  const hasHeader = eyebrow || title || description || status || actions;

  return (
    <Component
      data-tool-region={kind}
      className={cn(
        "min-w-0 overflow-hidden rounded-[var(--radius-lg)] border",
        panelClass[kind],
        sticky && "lg:sticky lg:top-[6.75rem] lg:max-h-[calc(100vh-7.75rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain",
        className,
      )}
    >
      {hasHeader ? (
        <div className={cn("border-b px-4 py-3.5 sm:px-5", headerClass[kind])}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  {eyebrow ?? eyebrowLabel[kind]}
                </span>
                {status ? <div className="shrink-0">{status}</div> : null}
              </div>
              {title ? (
                <h2 className="mt-1 text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-lg">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-1 max-w-[46rem] text-[13px] leading-5 text-[var(--color-text-secondary)] sm:text-sm sm:leading-6">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        </div>
      ) : null}

      <div className={cn("min-w-0 p-4 sm:p-5", bodyClassName)}>{children}</div>

      {footer ? (
        <div className={cn("border-t px-4 py-3 text-xs leading-5 text-[var(--color-text-secondary)] sm:px-5", headerClass[kind])}>
          {footer}
        </div>
      ) : null}
    </Component>
  );
}
