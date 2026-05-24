import { Button } from "@/components/ui";
import { PreviewToolbar } from "@/features/tools/components";
import type { ContainerBreakpoint, ContainerQueryState } from "../types";
import { BreakpointTimeline } from "./BreakpointTimeline";

function ruleStyles(activeBreakpoints: ContainerBreakpoint[]) {
  const style: Record<string, string> = {};
  activeBreakpoints.flatMap((breakpoint) => breakpoint.styles).forEach((rule) => {
    if (rule.selector.includes("card") && !rule.selector.includes("__")) style[rule.property] = rule.value;
  });
  return style;
}

export function ContainerPreview({ state, activeBreakpoints, onPatch }: { state: ContainerQueryState; activeBreakpoints: ContainerBreakpoint[]; onPatch: (patch: Partial<ContainerQueryState>) => void }) {
  const activeIds = activeBreakpoints.map((item) => item.id);
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <PreviewToolbar title="Container preview" description="Resize the parent container and watch active query rules update." actions={<>{[320, 520, 760].map((width) => <Button key={width} size="sm" variant={state.previewWidth === width ? "primary" : "secondary"} onClick={() => onPatch({ previewWidth: width })}>{width}px</Button>)}</>} />
      <div className="space-y-4 bg-[var(--color-bg-soft)] p-4">
        <BreakpointTimeline breakpoints={state.breakpoints} activeIds={activeIds} width={state.previewWidth} onSelect={(selectedBreakpointId) => onPatch({ selectedBreakpointId })} />
        <div className="overflow-auto rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mx-auto rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-accent)]/50 p-3 transition-all" style={{ width: state.previewWidth, maxWidth: "100%" }}>
            <div className="mb-2 flex items-center justify-between text-xs text-[var(--color-text-soft)]"><span>{state.containerSelector}</span><span>{state.previewWidth}px</span></div>
            <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-sm" style={ruleStyles(activeBreakpoints)}>
              <div className="rounded-[var(--radius-sm)] bg-[var(--color-accent)]/15 p-8 text-center text-sm font-bold text-[var(--color-accent)]">Media</div>
              <div className="mt-4 space-y-2"><p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-soft)]">Active: {activeBreakpoints.map((item) => item.name).join(", ") || "base"}</p><h3 className="text-xl font-black text-[var(--color-text)]">Container-aware component</h3><p className="text-sm leading-6 text-[var(--color-text-soft)]">The generated CSS reacts to parent width, not viewport width.</p></div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
