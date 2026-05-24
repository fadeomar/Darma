import { type ReactNode } from "react";
import { Input, Slider } from "@/components/ui";
import { cn } from "@/lib/cn";
import { CompactField } from "./CompactField";
import { clampNumberFieldValue } from "./NumberField";

export type SliderNumberFieldProps = {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  onChange: (value: number) => void;
  className?: string;
};

export function SliderNumberField({ label, value, min, max, step = 1, unit, hint, disabled, onChange, className }: SliderNumberFieldProps) {
  function handleNumberChange(rawValue: string) {
    const next = Number(rawValue);
    if (Number.isNaN(next)) return;
    onChange(clampNumberFieldValue(next, min, max));
  }

  return (
    <CompactField label={label} hint={hint} className={cn("space-y-2", className)}>
      <div className="flex items-center gap-3">
        <Slider
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(clampNumberFieldValue(Number(event.target.value), min, max))}
          className="min-w-0 flex-1"
        />
        <div className="flex shrink-0 items-center gap-2">
          <Input
            type="number"
            size="sm"
            width="numeric"
            value={value}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={(event) => handleNumberChange(event.target.value)}
          />
          {unit ? <span className="text-xs font-medium text-[var(--color-text-soft)]">{unit}</span> : null}
        </div>
      </div>
    </CompactField>
  );
}
