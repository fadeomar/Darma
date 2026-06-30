import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { MODE_META, type CspPolicyMode } from "../builder";

const MODES: CspPolicyMode[] = ["basic", "standard", "strict"];

export function CspModeStep({ mode, onChange }: { mode: CspPolicyMode; onChange: (mode: CspPolicyMode) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Policy mode">
      {MODES.map((value) => {
        const meta = MODE_META[value];
        const active = value === mode;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(value)}
            className={cn(
              "relative flex flex-col rounded-[var(--radius-md)] border p-3.5 text-left transition focus:outline-none focus:shadow-[var(--focus-ring)]",
              active
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-[var(--shadow-xs)]"
                : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-black text-[var(--color-text-primary)]">{meta.label}</span>
              {active ? (
                <Check className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
              ) : meta.recommended ? (
                <span className="rounded-[var(--radius-full)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--color-success-text)]">
                  Recommended
                </span>
              ) : null}
            </div>
            <span className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              {meta.tagline}
            </span>
            <span className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">{meta.description}</span>
          </button>
        );
      })}
    </div>
  );
}
