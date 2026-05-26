"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { AnimatedBackgroundState, BackgroundShape, BlendMode, PreviewMode } from "@/types/animatedBackgroundTypes";

interface ControlPanelProps {
  state: AnimatedBackgroundState;
  setState: Dispatch<SetStateAction<AnimatedBackgroundState>>;
  onRandomize: () => void;
  onReset: () => void;
  onSimilar: () => void;
}

const blendModes: BlendMode[] = ["screen", "plus-lighter", "overlay", "normal", "multiply"];
const shapes: BackgroundShape[] = ["circle", "soft-square", "diamond"];

function Field({ label, value, children }: { label: string; value?: string | number; children: ReactNode }) {
  return (
    <label className="block rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</span>
        {value !== undefined && (
          <span className="rounded-full bg-[var(--color-control-track)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">
            {value}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

const previewModes: PreviewMode[] = ["hero", "cards", "dashboard", "empty"];

export default function ControlPanel({ state, setState, onRandomize, onReset, onSimilar }: ControlPanelProps) {
  const updateColor = (index: number, color: string) => {
    const colors = [...state.colors];
    colors[index] = color;
    setState((current) => ({ ...current, colors }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onRandomize} className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-text)] transition hover:bg-[var(--color-primary-hover)]">
          Randomize
        </button>
        <button type="button" onClick={onSimilar} className="rounded-full border border-cyan-300 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-200 dark:hover:bg-cyan-950/40">
          Generate similar
        </button>
        <button type="button" onClick={onReset} className="rounded-full border border-[var(--color-border-default)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]">
          Reset preset
        </button>
        <button type="button" onClick={() => setState((current) => ({ ...current, isPaused: !current.isPaused }))} className="rounded-full border border-fuchsia-300 px-4 py-2 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50 dark:border-fuchsia-700 dark:text-fuchsia-200 dark:hover:bg-fuchsia-950/40">
          {state.isPaused ? "Play" : "Pause"}
        </button>
      </div>


      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">Preview</h3>
        <Field label="Real content mode">
          <select value={state.previewMode} onChange={(event) => setState((current) => ({ ...current, previewMode: event.target.value as PreviewMode, showContent: event.target.value !== "empty" }))} className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)]">
            {previewModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>
        </Field>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">Colors</h3>
        <Field label="Background" value={state.background}>
          <div className="flex items-center gap-3">
            <input type="color" value={state.background} onChange={(event) => setState((current) => ({ ...current, background: event.target.value }))} className="h-11 w-14 cursor-pointer rounded-lg border border-[var(--color-border-default)] bg-transparent" />
            <input value={state.background} onChange={(event) => setState((current) => ({ ...current, background: event.target.value }))} className="min-w-0 flex-1 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)]" />
          </div>
        </Field>
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
          <div className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Palette</div>
          <div className="grid grid-cols-2 gap-3">
            {state.colors.map((color, index) => (
              <div key={`${color}-${index}`} className="flex items-center gap-2 rounded-xl border border-[var(--color-border-default)] p-2">
                <input type="color" value={color} onChange={(event) => updateColor(index, event.target.value)} className="h-9 w-10 cursor-pointer rounded-md border border-[var(--color-border-default)] bg-transparent" />
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">{color}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">Motion</h3>
        <Field label="Speed" value={`${state.speed.toFixed(2)}x`}>
          <input type="range" min="0.3" max="1.8" step="0.05" value={state.speed} onChange={(event) => setState((current) => ({ ...current, speed: Number(event.target.value) }))} className="w-full" />
        </Field>
        <Field label="Intensity" value={`${Math.round(state.intensity * 100)}%`}>
          <input type="range" min="0.1" max="1.4" step="0.05" value={state.intensity} onChange={(event) => setState((current) => ({ ...current, intensity: Number(event.target.value) }))} className="w-full" />
        </Field>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">Shapes</h3>
        <Field label="Elements" value={state.particleCount}>
          <input type="range" min="4" max="44" value={state.particleCount} onChange={(event) => setState((current) => ({ ...current, particleCount: Number(event.target.value) }))} className="w-full" />
        </Field>
        <Field label="Size range" value={`${state.minSize}-${state.maxSize}px`}>
          <div className="space-y-3">
            <input type="range" min="4" max="320" value={state.minSize} onChange={(event) => setState((current) => ({ ...current, minSize: Math.min(Number(event.target.value), current.maxSize - 4) }))} className="w-full" />
            <input type="range" min="24" max="720" value={state.maxSize} onChange={(event) => setState((current) => ({ ...current, maxSize: Math.max(Number(event.target.value), current.minSize + 4) }))} className="w-full" />
          </div>
        </Field>
        <Field label="Shape">
          <select value={state.shape} onChange={(event) => setState((current) => ({ ...current, shape: event.target.value as BackgroundShape }))} className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)]">
            {shapes.map((shape) => <option key={shape} value={shape}>{shape}</option>)}
          </select>
        </Field>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">Effects</h3>
        <Field label="Blur" value={`${state.blur}px`}>
          <input type="range" min="0" max="120" value={state.blur} onChange={(event) => setState((current) => ({ ...current, blur: Number(event.target.value) }))} className="w-full" />
        </Field>
        <Field label="Opacity" value={`${Math.round(state.opacity * 100)}%`}>
          <input type="range" min="0.1" max="0.95" step="0.01" value={state.opacity} onChange={(event) => setState((current) => ({ ...current, opacity: Number(event.target.value) }))} className="w-full" />
        </Field>
        <Field label="Glow" value={`${state.glow}px`}>
          <input type="range" min="0" max="110" value={state.glow} onChange={(event) => setState((current) => ({ ...current, glow: Number(event.target.value) }))} className="w-full" />
        </Field>
        <Field label="Blend mode">
          <select value={state.blendMode} onChange={(event) => setState((current) => ({ ...current, blendMode: event.target.value as BlendMode }))} className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)]">
            {blendModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>
        </Field>
      </section>
    </div>
  );
}
