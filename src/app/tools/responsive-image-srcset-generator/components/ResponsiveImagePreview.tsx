import { Button } from "@/components/ui";
import { PreviewToolbar, SegmentedControl } from "@/features/tools/components";
import type { ResponsiveImageState } from "../types";
import { estimateSelectedCandidate, estimateSlotWidth } from "../responsiveImage";
import { ImageSlotAnalyzer } from "./ImageSlotAnalyzer";

export function ResponsiveImagePreview({ state, onPatch }: { state: ResponsiveImageState; onPatch: (patch: Partial<ResponsiveImageState>) => void }) {
  const slotWidth = estimateSlotWidth(state.sizes, state.defaultSlotSize, state.previewViewportWidth);
  const selected = estimateSelectedCandidate(state.candidates, slotWidth, state.previewDpr);
  const idealWidth = Math.round(slotWidth * state.previewDpr);

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <PreviewToolbar title="Responsive image analyzer" description="Preview slot size, density, and likely browser candidate." actions={<>{[375, 768, 1280].map((width) => <Button key={width} size="sm" variant={state.previewViewportWidth === width ? "primary" : "secondary"} onClick={() => onPatch({ previewViewportWidth: width })}>{width}px</Button>)}</>}>
        <SegmentedControl ariaLabel="Device pixel ratio" value={String(state.previewDpr)} onChange={(value) => onPatch({ previewDpr: Number(value) as ResponsiveImageState["previewDpr"] })} options={["1", "1.5", "2", "3"].map((value) => ({ value, label: `${value}x` }))} />
      </PreviewToolbar>
      <div className="space-y-4 bg-[var(--color-bg-soft)] p-4">
        {state.showCandidateAnalyzer ? <ImageSlotAnalyzer state={state} /> : null}
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          {state.showSlotRuler ? <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs text-[var(--color-text-secondary)]"><span>Rendered slot: <strong>{slotWidth}px</strong></span><span>Ideal resource: <strong>{idealWidth}w</strong> at {state.previewDpr}×</span></div> : null}
          <div className="mx-auto overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[linear-gradient(135deg,var(--color-preview-bg-strong),var(--color-preview-bg))] shadow-[var(--shadow-sm)]" style={{ width: Math.min(slotWidth, state.previewViewportWidth), maxWidth: "100%", aspectRatio: `${state.attributes.width} / ${state.attributes.height}` }}>
            <div className="flex h-full items-center justify-center p-6 text-center text-sm font-bold text-[var(--color-text-soft)]">{selected ? `${selected.url} · ${selected.width}w` : "No candidate selected"}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
