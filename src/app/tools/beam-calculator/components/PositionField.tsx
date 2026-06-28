import { type ReactNode } from "react";
import { NumberField } from "@/features/tools/components";
import { cn } from "@/lib/cn";
import { clamp, roundTo } from "../lib/beamFormatting";
import { quickPositions } from "../lib/beamCoords";

// Widen the numeric input, hide browser number spinners (consistent with the
// rest of the tool), and keep a clear non-red focus ring unless invalid.
const NUMERIC_INPUT_CLASS =
  "min-w-[120px] h-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

type PositionFieldProps = {
  label: ReactNode;
  value: number;
  length: number;
  unit: string;
  onChange: (x: number) => void;
  ariaLabel: string;
  error?: ReactNode;
  disabled?: boolean;
};

export function PositionField({ label, value, length, unit, onChange, ariaLabel, error, disabled }: PositionFieldProps) {
  const safeLength = length > 0 ? length : 1;
  const set = (x: number) => onChange(roundTo(clamp(x, 0, safeLength), 2));
  const quick = quickPositions(safeLength);

  return (
    <div className="space-y-2">
      <NumberField
        label={label}
        unit={unit}
        value={value}
        min={0}
        max={safeLength}
        step={0.1}
        error={error}
        disabled={disabled}
        onChange={set}
        inputClassName={NUMERIC_INPUT_CLASS}
      />
      <input
        type="range"
        min={0}
        max={safeLength}
        step={0.01}
        value={clamp(value, 0, safeLength)}
        disabled={disabled}
        aria-label={`${ariaLabel} slider`}
        onChange={(event) => set(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-control-track)] accent-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="flex flex-wrap gap-1" role="group" aria-label={`${ariaLabel} quick positions`}>
        {quick.map((preset) => {
          const active = Math.abs(preset.x - value) < 1e-6;
          return (
            <button
              key={preset.label}
              type="button"
              disabled={disabled}
              onClick={() => set(preset.x)}
              aria-label={`${ariaLabel}: ${preset.label}`}
              aria-pressed={active}
              className={cn(
                "rounded-[var(--radius-sm)] border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.04em] transition disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]",
              )}
            >
              {preset.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { NUMERIC_INPUT_CLASS };
