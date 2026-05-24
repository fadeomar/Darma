import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PresetGalleryProps<T> = {
  presets: T[];
  selectedId?: string;
  onSelect: (id: string, preset: T) => void;
  getId: (preset: T) => string;
  getLabel: (preset: T) => ReactNode;
  getDescription?: (preset: T) => ReactNode;
  renderPreview?: (preset: T) => ReactNode;
  className?: string;
};

export function PresetGallery<T>({ presets, selectedId, onSelect, getId, getLabel, getDescription, renderPreview, className }: PresetGalleryProps<T>) {
  return (
    <div className={cn("grid gap-2 sm:grid-cols-2", className)}>
      {presets.map((preset) => {
        const id = getId(preset);
        const selected = id === selectedId;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(id, preset)}
            className={cn(
              "min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3 text-left transition hover:border-[var(--color-border-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
              selected && "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20",
            )}
          >
            {renderPreview ? <div className="mb-3 overflow-hidden rounded-[var(--radius-sm)]">{renderPreview(preset)}</div> : null}
            <span className="block text-sm font-semibold text-[var(--color-text)]">{getLabel(preset)}</span>
            {getDescription ? <span className="mt-1 block text-xs leading-5 text-[var(--color-text-soft)]">{getDescription(preset)}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
