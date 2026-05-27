import { type ReactNode } from "react";
import { Input, type InputSize, type InputWidth } from "@/components/ui";
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
  error?: ReactNode;
  disabled?: boolean;
  onChange: (value: number) => void;
  className?: string;
  inputClassName?: string;
  size?: InputSize;
  width?: InputWidth;
};

function clampValue(value: number, min?: number, max?: number) {
  let next = value;
  if (typeof min === "number") next = Math.max(min, next);
  if (typeof max === "number") next = Math.min(max, next);
  return next;
}

export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  hint,
  error,
  disabled,
  onChange,
  className,
  inputClassName,
  size = "sm",
  width = "numeric",
}: NumberFieldProps) {
  const ariaLabel = typeof label === "string" ? label : "Numeric value";

  function handleChange(rawValue: string) {
    if (rawValue === "") return;
    const next = Number(rawValue);
    if (Number.isNaN(next)) return;
    onChange(clampValue(next, min, max));
  }

  return (
    <CompactField label={label} hint={hint} error={error} className={className}>
      <div className="flex min-w-0 items-center gap-2">
        <Input
          type="number"
          size={size}
          width={width}
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={Boolean(error) || undefined}
          onChange={(event) => handleChange(event.target.value)}
          className={cn("font-mono tabular-nums", inputClassName)}
        />
        {unit ? <span className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">{unit}</span> : null}
      </div>
    </CompactField>
  );
}

export { clampValue as clampNumberFieldValue };
