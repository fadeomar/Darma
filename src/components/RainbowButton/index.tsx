import { CheckCircle } from "lucide-react";

interface RainbowButtonProps {
  handleClick: () => void;
  isActive: boolean;
  label: string;
}

const RainbowButton = ({
  handleClick,
  isActive,
  label,
}: RainbowButtonProps) => {
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group relative mb-2 flex max-h-fit w-full items-center justify-center rounded-[var(--radius-sm)] border p-3 text-xs font-bold uppercase tracking-[0.08em] transition duration-[var(--duration-fast)] focus:outline-none focus-visible:shadow-[var(--focus-ring)] ${
        isActive
          ? "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
          : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]"
      }`}
    >
      <span>{label}</span>
      {isActive && (
        <CheckCircle
          className="absolute -left-2 -top-2 h-5 w-5 rounded-[var(--radius-full)] bg-[var(--color-surface-raised)] text-[var(--color-success)]"
          fill="var(--color-success)"
        />
      )}
      <span className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-[var(--radius-sm)] bg-[var(--color-code-bg)] px-2 py-1 text-xs text-[var(--color-code-text)] opacity-0 transition group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
};

export default RainbowButton;
