import type { StrengthResult } from "./types";

const strengthTone: Record<StrengthResult["level"], string> = {
  "very-weak": "bg-[var(--color-danger)]",
  weak: "bg-[var(--color-danger)]",
  fair: "bg-[var(--color-warning)]",
  strong: "bg-[var(--color-success)]",
  "very-strong": "bg-[var(--color-success)]",
};

const strengthCopy: Record<StrengthResult["level"], string> = {
  "very-weak": "Add more length before using this for any real account.",
  weak: "This is still easy to guess offline. Increase the length or add more character types.",
  fair: "Good for low-risk use, but important accounts deserve more length.",
  strong: "Suitable for most accounts when saved in a password manager.",
  "very-strong": "Excellent for important accounts, especially when kept unique.",
};

export function PasswordStrengthMeter({ strength }: { strength: StrengthResult | null }) {
  if (!strength) return null;

  const roundedEntropy = Math.round(strength.entropy);

  return (
    <section
      aria-label="Password strength"
      className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
            Strength estimate
          </p>
          <p className="mt-1 text-lg font-black text-[var(--color-text-primary)]">
            {strength.label}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-right sm:flex sm:items-center">
          <span className="rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-1 font-mono text-xs font-bold text-[var(--color-text-secondary)]">
            {roundedEntropy} bits
          </span>
          <span className="rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-1 font-mono text-xs font-bold text-[var(--color-text-secondary)]">
            {strength.crackTime}
          </span>
        </div>
      </div>

      <div
        className="mt-4 h-3 overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-control-track)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={strength.score}
        aria-label={`Password strength: ${strength.label}`}
      >
        <div
          className={`h-full rounded-[var(--radius-full)] transition-[width] duration-300 ${strengthTone[strength.level]}`}
          style={{ width: `${strength.score}%` }}
        />
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
        {strengthCopy[strength.level]} For important accounts, use 16+ random characters or a 4+ word passphrase.
      </p>
    </section>
  );
}
