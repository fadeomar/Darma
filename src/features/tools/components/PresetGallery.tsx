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
  compact?: boolean;
};

export function PresetGallery<T>({
  presets,
  selectedId,
  onSelect,
  getId,
  getLabel,
  getDescription,
  renderPreview,
  className,
  compact = false,
}: PresetGalleryProps<T>) {
  return (
    <div className={cn("grid min-w-0 gap-2 sm:grid-cols-2", className)}>
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
              "group min-w-0 rounded-[var(--radius-md)] border bg-[var(--color-surface-base)] text-left shadow-[var(--shadow-xs)] transition duration-[var(--duration-fast)]",
              "hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-raised)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]",
              selected
                ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary-soft)]"
                : "border-[var(--color-border-default)]",
              compact ? "p-2" : "p-2.5",
            )}
          >
            {renderPreview ? (
              <div
                className={cn(
                  "mb-2 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-preview-bg)]",
                  compact ? "h-10" : "h-14",
                )}
              >
                {renderPreview(preset)}
              </div>
            ) : null}
            <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">{getLabel(preset)}</span>
            {getDescription ? <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[var(--color-text-tertiary)]">{getDescription(preset)}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
