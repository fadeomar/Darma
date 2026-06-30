import { Lock, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { BEAM_MODE_OPTIONS, isGuidedMode, type BeamMode } from "../lib/beamMode";

type BeamTypeSelectorProps = {
  mode: BeamMode;
  onChange: (mode: BeamMode) => void;
};

const MODE_HINT: Record<BeamMode, string> = {
  "simply-supported": "Pin at start, roller at end",
  "cantilever-left": "Fixed at the left end",
  "cantilever-right": "Fixed at the right end",
  advanced: "Place supports manually",
};

export function BeamTypeSelector({ mode, onChange }: BeamTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Beam type">
        {BEAM_MODE_OPTIONS.map((option) => {
          const active = option.value === mode;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-[var(--radius-md)] border px-3 py-2 text-left transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]",
                active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] ring-1 ring-[var(--color-primary-soft)]"
                  : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)]",
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-primary)]">
                {option.value === "advanced" ? <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> : null}
                {option.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-4 text-[var(--color-text-tertiary)]">{MODE_HINT[option.value]}</span>
            </button>
          );
        })}
      </div>
      {isGuidedMode(mode) ? (
        <p className="flex items-center gap-1.5 text-[11px] leading-4 text-[var(--color-text-tertiary)]">
          <Lock className="h-3 w-3 shrink-0" aria-hidden />
          Supports are placed for you and locked. Switch to <strong className="font-semibold">Advanced custom</strong> to edit them.
        </p>
      ) : null}
    </div>
  );
}
