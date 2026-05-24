import { type ReactNode } from "react";
import { Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { CompactField } from "./CompactField";

export type ColorFieldProps = {
  label: ReactNode;
  value: string;
  hint?: ReactNode;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
};

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function ColorField({ label, value, hint, disabled, onChange, className }: ColorFieldProps) {
  const pickerValue = HEX_COLOR_PATTERN.test(value) ? value : "#000000";

  return (
    <CompactField label={label} hint={hint} className={className}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={pickerValue}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-9 w-10 shrink-0 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-1 disabled:cursor-not-allowed disabled:opacity-45",
          )}
          aria-label={typeof label === "string" ? `${label} color picker` : "Color picker"}
        />
        <Input
          size="sm"
          width="medium"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#ffffff"
        />
      </div>
    </CompactField>
  );
}
