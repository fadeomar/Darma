// components/ShadowSelectorButton.tsx
import React from "react";
import { XCircle } from "lucide-react";

interface ShadowSelectorButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  onRemove: () => void;
}

const ShadowSelectorButton: React.FC<ShadowSelectorButtonProps> = ({
  label,
  isActive,
  onClick,
  onRemove,
}) => {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        className={`rounded-[var(--radius-sm)] border px-3 py-1 text-sm font-semibold transition-colors focus-visible:shadow-[var(--focus-ring)] ${
          isActive
            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
            : "border-[var(--color-border-default)] bg-[var(--color-surface-inset)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]"
        }`}
      >
        {label}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} shadow`}
        className="rounded-[var(--radius-full)] p-0.5 text-[var(--color-danger-text)] transition hover:bg-[var(--color-danger-bg)] focus-visible:shadow-[var(--focus-ring)]"
      >
        <XCircle className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
};

export default ShadowSelectorButton;
