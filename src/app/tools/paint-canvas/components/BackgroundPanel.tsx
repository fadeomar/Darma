import { Check, Grid3X3, Palette } from "lucide-react";
import type { CanvasBackground } from "../types";

export default function BackgroundPanel({
  background,
  onChange,
}: {
  background: CanvasBackground;
  onChange: (background: CanvasBackground) => void;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
        <Palette className="h-3.5 w-3.5" /> Background
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange({ ...background, mode: "solid" })}
          aria-pressed={background.mode === "solid"}
          className={`flex items-center justify-between rounded-[var(--radius-md)] border px-3 py-2 text-left text-xs font-semibold transition ${
            background.mode === "solid"
              ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
              : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
          }`}
        >
          <span>Solid</span>
          {background.mode === "solid" && <Check className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...background, mode: "transparent" })}
          aria-pressed={background.mode === "transparent"}
          className={`flex items-center justify-between rounded-[var(--radius-md)] border px-3 py-2 text-left text-xs font-semibold transition ${
            background.mode === "transparent"
              ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
              : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
          }`}
        >
          <span className="flex items-center gap-1.5"><Grid3X3 className="h-3.5 w-3.5" /> Clear</span>
          {background.mode === "transparent" && <Check className="h-3.5 w-3.5" />}
        </button>
      </div>

      <label className={`mt-3 block ${background.mode === "transparent" ? "opacity-50" : ""}`}>
        <span className="mb-2 block text-xs font-bold text-[var(--color-text-secondary)]">Canvas color</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label="Canvas background color"
            value={background.color}
            disabled={background.mode === "transparent"}
            onChange={(event) => onChange({ mode: "solid", color: event.target.value })}
            className="h-9 w-11 cursor-pointer rounded border border-[var(--color-border-subtle)] bg-transparent disabled:cursor-not-allowed"
          />
          <code className="text-xs text-[var(--color-text-tertiary)]">{background.mode === "transparent" ? "transparent" : background.color}</code>
        </div>
      </label>
    </section>
  );
}
