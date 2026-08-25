import { Button } from "@/components/ui";
import { PreviewToolbar, SegmentedControl } from "@/features/tools/components";
import type { ResponsiveImageState } from "../types";
import { estimateSelectedCandidate, estimateSlotWidth, getMatchedSizesRule } from "../responsiveImage";
import { ImageSlotAnalyzer } from "./ImageSlotAnalyzer";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-2">
      <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 text-sm font-black text-[var(--color-text-primary)]">{value}</div>
    </div>
  );
}

export function ResponsiveImagePreview({ state, onPatch }: { state: ResponsiveImageState; onPatch: (patch: Partial<ResponsiveImageState>) => void }) {
  const slotWidth = estimateSlotWidth(state.sizes, state.defaultSlotSize, state.previewViewportWidth);
  const selected = estimateSelectedCandidate(state.candidates, slotWidth, state.previewDpr);
  const idealWidth = Math.round(slotWidth * state.previewDpr);
  const matchedRule = getMatchedSizesRule(state.sizes, state.previewViewportWidth);

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <PreviewToolbar title="Responsive image preview" description="See the estimated slot and browser candidate before copying production markup." actions={<>{[375, 768, 1280].map((width) => <Button key={width} size="sm" variant={state.previewViewportWidth === width ? "primary" : "secondary"} onClick={() => onPatch({ previewViewportWidth: width })}>{width}px</Button>)}</>}>
        <SegmentedControl ariaLabel="Device pixel ratio" value={String(state.previewDpr)} onChange={(value) => onPatch({ previewDpr: Number(value) as ResponsiveImageState["previewDpr"] })} options={["1", "1.5", "2", "3"].map((value) => ({ value, label: `${value}x` }))} />
      </PreviewToolbar>

      <div className="space-y-4 bg-[var(--color-bg-soft)] p-4 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Viewport" value={`${state.previewViewportWidth}px`} />
          <Metric label="Rendered slot" value={`${Math.round(slotWidth)}px`} />
          <Metric label="Ideal resource" value={`${idealWidth}w`} />
          <Metric label="Browser pick" value={selected ? `${selected.width}w` : "No match"} />
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
          {state.showSlotRuler ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
              <span>{matchedRule ? matchedRule.mediaCondition : "Default sizes rule"}</span>
              <span><strong>{Math.round(slotWidth)}px</strong> slot · <strong>{state.previewDpr}×</strong> DPR</span>
            </div>
          ) : null}

          <div className="mx-auto flex min-h-[260px] items-center justify-center sm:min-h-[340px]">
            <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[linear-gradient(135deg,var(--color-preview-bg-strong),var(--color-preview-bg))] shadow-[var(--shadow-md)] transition-[width] duration-200" style={{ width: Math.min(slotWidth, state.previewViewportWidth), maxWidth: "100%", aspectRatio: `${state.attributes.width} / ${state.attributes.height}` }}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.18),transparent_34%),linear-gradient(145deg,transparent,rgba(255,255,255,0.08))]" aria-hidden />
              <div className="relative flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                <span className="rounded-full border border-white/20 bg-black/15 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white/80">{state.mode === "picture" ? "picture" : state.mode === "next-image" ? "Next.js Image" : "img + srcset"}</span>
                <strong className="max-w-full truncate text-base font-black text-white sm:text-lg">{selected ? `${selected.width}w candidate` : "No candidate selected"}</strong>
                <span className="max-w-full truncate font-mono text-xs text-white/75">{selected?.url ?? "Add at least one valid candidate URL"}</span>
              </div>
            </div>
          </div>
        </div>

        {state.showCandidateAnalyzer ? (
          <details className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
            <summary className="cursor-pointer list-none px-3 py-3 text-sm font-bold text-[var(--color-text-primary)] [&::-webkit-details-marker]:hidden">How the browser choice is estimated</summary>
            <div className="border-t border-[var(--color-border-subtle)] p-3"><ImageSlotAnalyzer state={state} /></div>
          </details>
        ) : null}
      </div>
    </section>
  );
}
