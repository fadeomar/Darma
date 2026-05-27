import { type ReactNode } from "react";
import { Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { CompactField } from "./CompactField";

export type ColorFieldProps = {
  label: ReactNode;
  value: string;
  hint?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
};

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const HEX_PICKER_PATTERN = /^#[0-9a-fA-F]{6}$/;

function normalizePickerValue(value: string) {
  if (HEX_PICKER_PATTERN.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#000000";
}

export function ColorField({ label, value, hint, error, disabled, onChange, className }: ColorFieldProps) {
  const isInvalid = Boolean(value) && !HEX_COLOR_PATTERN.test(value);
  const resolvedError = error ?? (isInvalid ? "Use #RGB or #RRGGBB." : undefined);
  const ariaLabel = typeof label === "string" ? label : "Color";

  return (
    <CompactField label={label} hint={hint} error={resolvedError} className={className}>
      <div className="flex min-w-0 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-1.5 shadow-[var(--shadow-xs)]">
        <input
          type="color"
          value={normalizePickerValue(value)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-8 w-10 shrink-0 cursor-pointer overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-0.5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]",
            "disabled:cursor-not-allowed disabled:opacity-45",
          )}
          aria-label={`${ariaLabel} color picker`}
        />
        <Input
          size="sm"
          width="full"
          value={value}
          disabled={disabled}
          aria-label={`${ariaLabel} hex value`}
          aria-invalid={isInvalid || Boolean(error) || undefined}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#ffffff"
          className="min-w-0 font-mono uppercase tracking-[0.02em]"
        />
      </div>
    </CompactField>
  );
}
