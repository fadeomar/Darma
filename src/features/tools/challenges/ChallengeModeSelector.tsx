import { cn } from "@/lib/cn";

export type ChallengeModeOption<TMode extends string | number> = {
  value: TMode;
  label: string;
  hint?: string;
};

export function ChallengeModeSelector<TMode extends string | number>({
  options,
  value,
  disabled,
  onChange,
  className,
}: {
  options: ChallengeModeOption<TMode>[];
  value: TMode;
  disabled?: boolean;
  onChange: (value: TMode) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2 sm:grid-cols-5", className)}>
      {options.map((option) => {
        const active = value === option.value;

        return (
          <button
            key={String(option.value)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "group relative overflow-hidden rounded-[var(--radius-md)] border px-4 py-3 text-left transition duration-[var(--duration-fast)] focus:outline-none focus:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "border-[var(--color-primary)] bg-[linear-gradient(135deg,var(--color-primary-soft),rgba(255,255,255,0.72))] text-[var(--color-primary)] shadow-[0_14px_30px_rgba(160,103,38,0.16)] dark:bg-[linear-gradient(135deg,var(--color-primary-soft),rgba(255,255,255,0.06))]"
                : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:-translate-y-0.5 hover:border-[var(--color-primary-border)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] motion-reduce:hover:translate-y-0",
            )}
            aria-pressed={active}
          >
            <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent)]" />
            {active ? <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_0_4px_var(--color-primary-soft)]" /> : null}
            <span className="block pr-4 font-black tracking-[-0.01em]">{option.label}</span>
            {option.hint ? <span className="mt-1 block text-xs leading-5 opacity-80">{option.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
