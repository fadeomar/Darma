import { Button } from "@/components/ui";
import { PreviewToolbar, SegmentedControl } from "@/features/tools/components";
import { cn } from "@/lib/cn";
import { TRANSFORM_PRESETS } from "../presets";
import type { TransformGeneratorState, TransformPreset } from "../types";
import { getPreviewStyle, getPreviewTransform, getTransformProductionChecks, getTransformSummary } from "../transform";

type PreviewState = TransformGeneratorState["previewState"];

function toneClass(tone?: "good" | "warn" | "info") {
  if (tone === "good") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
  if (tone === "warn") return "border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-200";
  return "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-text-primary)]";
}

function PreviewContent({ object }: { object: TransformGeneratorState["style"]["previewObject"] }) {
  if (object === "button") return <span className="rounded-full bg-white/20 px-5 py-2 text-sm font-black">Transform button</span>;
  if (object === "badge") return <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em]">Badge</span>;
  if (object === "image") return <span className="grid h-full min-h-24 w-full place-items-center rounded-[inherit] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.45),transparent_28%),linear-gradient(135deg,rgba(255,255,255,.18),rgba(0,0,0,.08))] text-lg">Image zoom</span>;
  if (object === "modal") return <span className="space-y-2"><span className="block text-xs uppercase tracking-[0.18em] opacity-80">Modal</span><span className="block text-xl font-black">Entrance motion</span></span>;
  return <span className="space-y-2"><span className="block text-xs uppercase tracking-[0.18em] opacity-80">Darma UI</span><span className="block text-xl font-black">Transform</span><span className="block text-xs font-semibold opacity-75">production-ready motion</span></span>;
}

function markerPosition(value: string, axis: "x" | "y") {
  if (axis === "x") {
    if (value === "left") return "0%";
    if (value === "center") return "50%";
    if (value === "right") return "100%";
  } else {
    if (value === "top") return "0%";
    if (value === "center") return "50%";
    if (value === "bottom") return "100%";
  }
  return value;
}

function PresetCard({ preset, selected, onSelect }: { preset: TransformPreset; selected: boolean; onSelect: () => void }) {
  const presetStyle = getPreviewStyle(preset.state);
  const presetTransform = getPreviewTransform(preset.state);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group overflow-hidden rounded-[var(--radius-md)] border bg-[var(--color-surface-base)] text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]",
        selected ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30" : "border-[var(--color-border-subtle)]",
      )}
    >
      <span className="grid h-20 place-items-center overflow-hidden bg-[var(--color-bg-soft)] p-3">
        <span
          className="grid h-10 w-14 place-items-center rounded-lg text-xs font-black shadow-sm"
          style={{ ...presetStyle, width: 56, height: 40, padding: 0, transform: presetTransform, transformOrigin: `${preset.state.origin.x} ${preset.state.origin.y}` }}
        >
          Aa
        </span>
      </span>
      <span className="block px-3 py-2">
        <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.name}</span>
        <span className="mt-0.5 block truncate text-xs text-[var(--color-text-tertiary)]">{preset.category}</span>
      </span>
    </button>
  );
}

export function TransformPreview({ state, onPatch, onLoadPreset }: { state: TransformGeneratorState; onPatch: (patch: Partial<TransformGeneratorState>) => void; onLoadPreset: (preset: TransformPreset) => void }) {
  const style = getPreviewStyle(state);
  const transform = getPreviewTransform(state);
  const summary = getTransformSummary(state);
  const checks = getTransformProductionChecks(state);
  const originLeft = markerPosition(state.origin.x, "x");
  const originTop = markerPosition(state.origin.y, "y");

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]">
      <PreviewToolbar
        title="Live transform preview"
        description="Tune the transform while keeping the result, origin, and interaction state visible."
        actions={<Button size="sm" variant="secondary" onClick={() => onPatch({ previewState: state.previewState === "animated" ? "base" : "animated" })}>Replay</Button>}
      >
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl<PreviewState>
            ariaLabel="Transform preview state"
            value={state.previewState}
            onChange={(previewState) => onPatch({ previewState })}
            options={[
              { value: "base", label: "Base" },
              { value: "hover", label: "Hover" },
              { value: "active", label: "Active" },
              { value: "animated", label: "Replay" },
            ]}
          />
          <SegmentedControl
            ariaLabel="Transform preview overlays"
            value={state.showAxisOverlay ? "grid" : state.showBeforeOutline ? "outline" : "clean"}
            onChange={(value) => onPatch({ showAxisOverlay: value === "grid", show3dGrid: value === "grid", showBeforeOutline: value !== "clean" })}
            options={[{ value: "grid", label: "Grid" }, { value: "outline", label: "Outline" }, { value: "clean", label: "Clean" }]}
          />
        </div>
      </PreviewToolbar>

      <div className={cn("relative flex min-h-[500px] items-center justify-center overflow-hidden bg-[var(--color-bg-soft)] p-6 sm:p-10", state.showAxisOverlay && "bg-[linear-gradient(to_right,var(--color-preview-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-preview-grid)_1px,transparent_1px)] bg-[size:40px_40px]")}> 
        <div className="relative max-w-full" style={{ width: state.style.width, height: state.style.height }}>
          {state.showBeforeOutline ? <div className="absolute inset-0 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-text-soft)]/40" /> : null}
          {state.showOriginMarker ? (
            <span
              className="absolute z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--color-accent)] shadow"
              style={{ left: originLeft, top: originTop }}
              title={`Transform origin: ${state.origin.x} ${state.origin.y}`}
            />
          ) : null}
          <div
            className={cn(
              "flex h-full w-full items-center justify-center overflow-hidden rounded-[var(--radius-md)] text-center text-sm font-black shadow-[var(--shadow-md)] transition-transform motion-reduce:transition-none",
              state.previewState === "animated" && "animate-[transform-preview-pop_900ms_ease-out_both]",
            )}
            style={{ ...style, transform, transformOrigin: `${state.origin.x} ${state.origin.y} ${state.origin.z}` }}
          >
            <PreviewContent object={state.style.previewObject} />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-[var(--color-border-subtle)] p-4">
        <div>
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-[var(--color-text-primary)]">Quick styles</div>
              <div className="text-xs text-[var(--color-text-tertiary)]">Start from a visual transform preset, then fine-tune it.</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            {TRANSFORM_PRESETS.map((preset) => (
              <PresetCard key={preset.id} preset={preset} selected={state.presetId === preset.id} onSelect={() => onLoadPreset(preset)} />
            ))}
          </div>
        </div>

        <details className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-bold text-[var(--color-text-primary)] marker:hidden">Output details & motion checks</summary>
          <div className="space-y-3 border-t border-[var(--color-border-subtle)] p-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {summary.map((item) => (
                <div key={item.label} className={cn("min-w-0 rounded-[var(--radius-md)] border px-3 py-2", toneClass(item.tone))}>
                  <div className="text-xs font-black uppercase tracking-[0.12em] opacity-70">{item.label}</div>
                  <div className="mt-1 truncate font-mono text-xs font-bold" title={item.value}>{item.value}</div>
                </div>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {checks.map((check) => (
                <div key={check.label} className={cn("rounded-[var(--radius-md)] border px-3 py-2 text-xs", toneClass(check.tone))}>
                  <div className="font-bold">{check.label}</div>
                  <div className="mt-0.5 text-xs opacity-75">{check.value}</div>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>

      <style>{`@keyframes transform-preview-pop { 0% { opacity: .55; transform: translateY(24px) scale(.94); } 60% { opacity: 1; } 100% { transform: ${transform}; } }`}</style>
    </section>
  );
}
