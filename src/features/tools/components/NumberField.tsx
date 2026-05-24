import { type ReactNode } from "react";
import { Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { CompactField } from "./CompactField";

export type NumberFieldProps = {
  label: ReactNode;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  onChange: (value: number) => void;
  className?: string;
};

function clampValue(value: number, min?: number, max?: number) {
  let next = value;
  if (typeof min === "number") next = Math.max(min, next);
  if (typeof max === "number") next = Math.min(max, next);
  return next;
}

export function NumberField({ label, value, min, max, step = 1, unit, hint, disabled, onChange, className }: NumberFieldProps) {
  function handleChange(rawValue: string) {
    const next = Number(rawValue);
    if (Number.isNaN(next)) return;
    onChange(clampValue(next, min, max));
  }

  return (
    <CompactField label={label} hint={hint} className={className}>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          size="sm"
          width="numeric"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(event) => handleChange(event.target.value)}
        />
        {unit ? <span className="text-xs font-medium text-[var(--color-text-soft)]">{unit}</span> : null}
      </div>
    </CompactField>
  );
}

export { clampValue as clampNumberFieldValue };
