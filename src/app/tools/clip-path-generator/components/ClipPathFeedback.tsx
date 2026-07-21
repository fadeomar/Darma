import type { ClipPathValidationMessage } from "../types";

export type StatusTone = "info" | "success" | "warning" | "error";

export type ToolStatus = {
  tone: StatusTone;
  message: string;
};

const STATUS_STYLES: Record<StatusTone, string> = {
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  error: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

const VALIDATION_STYLES: Record<ClipPathValidationMessage["type"], string> = {
  info: STATUS_STYLES.info,
  warning: STATUS_STYLES.warning,
  error: STATUS_STYLES.error,
};

export function ClipPathFeedback({
  status,
  messages,
}: {
  status: ToolStatus;
  messages: ClipPathValidationMessage[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        role="status"
        aria-live="polite"
        className={`min-h-10 rounded-[var(--radius-sm)] border px-3 py-2 text-xs leading-5 ${STATUS_STYLES[status.tone]}`}
      >
        {status.message}
      </div>
      {messages.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-label="Polygon validation issues">
          {messages.map((message, index) => (
            <li
              key={`${message.field ?? "general"}-${index}-${message.message}`}
              className={`rounded-[var(--radius-sm)] border px-3 py-2 text-xs leading-5 ${VALIDATION_STYLES[message.type]}`}
            >
              {message.message}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
        CSS <code>clip-path</code> hides pixels visually; it does not crop or resize the source image file.
      </p>
    </div>
  );
}
