import { type ReactNode } from "react";
import { Input, Slider } from "@/components/ui";
import { cn } from "@/lib/cn";
import { clampNumberFieldValue } from "./NumberField";

export type SliderNumberFieldProps = {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  onChange: (value: number) => void;
  className?: string;
  showInput?: boolean;
};

function formatSliderValue(value: number, step: number, unit?: ReactNode) {
  const decimalPlaces = step.toString().includes(".") ? step.toString().split(".")[1]?.length ?? 0 : 0;
  const normalized = Number.isInteger(value) ? value.toString() : value.toFixed(Math.min(4, decimalPlaces || 2)).replace(/\.?0+$/, "");
  return `${normalized}${typeof unit === "string" ? unit : ""}`;
}

export function SliderNumberField({
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
  showInput = true,
}: SliderNumberFieldProps) {
  const ariaLabel = typeof label === "string" ? label : "Slider value";

  function commitValue(next: number) {
    if (Number.isNaN(next)) return;
    onChange(clampNumberFieldValue(next, min, max));
  }

  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="font-mono text-[11px] font-bold uppercase leading-none tracking-[0.07em] text-[var(--color-text-tertiary)]">
            {label}
          </div>
          {hint ? <div className="text-[11px] leading-4 text-[var(--color-text-tertiary)]">{hint}</div> : null}
        </div>
        <div className="shrink-0 rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-[var(--color-text-secondary)]">
          {formatSliderValue(value, step, unit)}
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 shadow-[var(--shadow-xs)]">
        <Slider
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={Boolean(error) || undefined}
          onChange={(event) => commitValue(Number(event.target.value))}
          className="min-w-0 flex-1"
        />
        {showInput ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <Input
              type="number"
              size="sm"
              width="numeric"
              value={value}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              aria-label={`${ariaLabel} number`}
              aria-invalid={Boolean(error) || undefined}
              onChange={(event) => {
                if (event.target.value === "") return;
                commitValue(Number(event.target.value));
              }}
              className="font-mono tabular-nums"
            />
            {unit && typeof unit !== "string" ? <span className="text-[11px] font-bold text-[var(--color-text-tertiary)]">{unit}</span> : null}
          </div>
        ) : null}
      </div>
      {error ? <p className="text-[11px] font-semibold leading-4 text-[var(--color-danger-text)]">{error}</p> : null}
    </div>
  );
}
