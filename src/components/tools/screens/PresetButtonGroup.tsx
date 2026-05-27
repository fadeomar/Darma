"use client";

export default function PresetButtonGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={[
            "rounded-[var(--radius-full)] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition duration-[var(--duration-fast)]",
            value === option.value
              ? "border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
              : "border border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]",
          ].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
