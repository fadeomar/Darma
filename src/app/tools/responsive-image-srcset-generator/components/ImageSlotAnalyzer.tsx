import type { ResponsiveImageState } from "../types";
import { estimateSelectedCandidate, estimateSlotWidth, getMatchedSizesRule } from "../responsiveImage";

export function ImageSlotAnalyzer({ state }: { state: ResponsiveImageState }) {
  const matchedRule = getMatchedSizesRule(state.sizes, state.previewViewportWidth);
  const slotWidth = estimateSlotWidth(state.sizes, state.defaultSlotSize, state.previewViewportWidth);
  const candidate = estimateSelectedCandidate(state.candidates, slotWidth, state.previewDpr);
  const steps = [
    ["1", "Slot", `${Math.round(slotWidth)}px from ${matchedRule?.mediaCondition ?? "default sizes"}`],
    ["2", "Candidates", `${state.candidates.length} width candidates`],
    ["3", "Browser pick", candidate ? `${candidate.width}w at ${state.previewDpr}x DPR` : "No matching candidate"],
    ["4", "Markup", state.mode === "picture" ? "picture output" : state.mode === "next-image" ? "Next.js Image output" : "img output"],
  ];
  return <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{steps.map(([num, title, body]) => <div key={num} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"><span className="text-[10px] font-black uppercase tracking-wide text-[var(--color-accent)]">Step {num}</span><h3 className="mt-1 text-sm font-bold text-[var(--color-text)]">{title}</h3><p className="mt-1 text-xs leading-5 text-[var(--color-text-soft)]">{body}</p></div>)}</div>;
}
