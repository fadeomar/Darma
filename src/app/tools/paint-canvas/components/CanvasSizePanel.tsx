import { useEffect, useState } from "react";
import { CANVAS_PRESETS, MAX_CANVAS_DIMENSION, MIN_CANVAS_DIMENSION } from "../constants";
import type { CanvasSize } from "../types";

export default function CanvasSizePanel({ size, onResize }: { size: CanvasSize; onResize: (size: CanvasSize) => void }) {
  const [width, setWidth] = useState(size.width);
  const [height, setHeight] = useState(size.height);

  useEffect(() => {
    setWidth(size.width);
    setHeight(size.height);
  }, [size.height, size.width]);

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
      <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">Canvas size</div>
      <select
        aria-label="Canvas size preset"
        className="mb-3 w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 text-sm"
        value=""
        onChange={(event) => {
          const preset = CANVAS_PRESETS.find((candidate) => candidate.id === event.target.value);
          if (preset) onResize({ width: preset.width, height: preset.height });
        }}
      >
        <option value="">Choose a preset…</option>
        {CANVAS_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label} · {preset.hint}</option>)}
      </select>
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
          Width
          <input type="number" min={MIN_CANVAS_DIMENSION} max={MAX_CANVAS_DIMENSION} value={width} onChange={(e) => setWidth(Number(e.target.value))} className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-2 py-2 font-mono text-sm" />
        </label>
        <span className="pb-2 text-[var(--color-text-tertiary)]">×</span>
        <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
          Height
          <input type="number" min={MIN_CANVAS_DIMENSION} max={MAX_CANVAS_DIMENSION} value={height} onChange={(e) => setHeight(Number(e.target.value))} className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-2 py-2 font-mono text-sm" />
        </label>
      </div>
      <button type="button" onClick={() => onResize({ width, height })} className="mt-3 w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 py-2 text-sm font-semibold hover:bg-[var(--color-surface-subtle)]">Apply size</button>
      <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">128–4096 px per side. Resizing the artboard does not scale existing objects.</p>
    </section>
  );
}
