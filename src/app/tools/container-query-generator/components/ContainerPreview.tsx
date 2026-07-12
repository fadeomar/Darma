import { Button } from "@/components/ui";
import { PreviewToolbar } from "@/features/tools/components";
import { cn } from "@/lib/cn";
import type { ContainerBreakpoint, ContainerQueryState, ContainerQuerySummary } from "../types";
import { BreakpointTimeline } from "./BreakpointTimeline";

function ruleStyles(activeBreakpoints: ContainerBreakpoint[], componentClassName: string) {
  const style: Record<string, string> = {};
  const baseSelector = `.${componentClassName}`;
  activeBreakpoints.flatMap((breakpoint) => breakpoint.styles).forEach((rule) => {
    const selector = rule.selector.trim();
    if ((selector === baseSelector || selector.endsWith(` ${baseSelector}`) || selector.includes(componentClassName)) && !selector.includes("__")) {
      style[rule.property] = rule.value;
    }
  });
  return style;
}

const demoCopy = {
  card: { eyebrow: "Design system", title: "Container-aware component", body: "The generated CSS reacts to parent width, not viewport width.", cta: "View details" },
  product: { eyebrow: "Product card", title: "Premium workspace kit", body: "Media, copy, price, and actions adapt when the parent card gets wider.", cta: "Add to cart" },
  dashboard: { eyebrow: "Dashboard", title: "Revenue insight", body: "Compact widgets can become richer inside larger dashboard regions.", cta: "Open report" },
  article: { eyebrow: "Article preview", title: "Build reusable responsive cards", body: "Container queries make editorial cards work in sidebars, grids, and hero sections.", cta: "Read article" },
};

export function ContainerPreview({ state, summary, activeBreakpoints, onPatch }: { state: ContainerQueryState; summary: ContainerQuerySummary; activeBreakpoints: ContainerBreakpoint[]; onPatch: (patch: Partial<ContainerQueryState>) => void }) {
  const activeIds = activeBreakpoints.map((item) => item.id);
  const copy = demoCopy[state.previewMode];
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <PreviewToolbar
        title="Container query preview"
        description="Resize the parent container and watch active query rules update."
        actions={<>{[320, 520, 760, 960].map((width) => <Button key={width} size="sm" variant={state.previewWidth === width ? "primary" : "secondary"} onClick={() => onPatch({ previewWidth: width })}>{width}px</Button>)}</>}
      />
      <div className="space-y-4 bg-[var(--color-bg-soft)] p-4">
        <div className="grid gap-2 sm:grid-cols-4">
          <Metric label="Container" value={`${state.previewWidth}px`} />
          <Metric label="Active" value={activeBreakpoints.length || "Base"} />
          <Metric label="Rules" value={summary.rules} />
          <Metric label="Type" value={state.containerType} />
        </div>

        {state.showBreakpointMarkers ? <BreakpointTimeline breakpoints={state.breakpoints} activeIds={activeIds} width={state.previewWidth} onSelect={(selectedBreakpointId) => onPatch({ selectedBreakpointId })} /> : null}

        <div className="overflow-auto rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className={cn("mx-auto rounded-[var(--radius-lg)] p-3 transition-all", state.showContainerOutline && "border-2 border-dashed border-[var(--color-accent)]/50")} style={{ width: state.previewWidth, maxWidth: "100%" }}>
            <div className="mb-2 flex min-w-0 items-center justify-between gap-3 text-xs text-[var(--color-text-soft)]">
              <span className="truncate font-mono">{state.containerSelector}</span>
              <span className="shrink-0 font-mono font-bold">{state.previewWidth}px</span>
            </div>
            <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-sm transition-all" style={ruleStyles(activeBreakpoints, state.componentClassName)}>
              <div className={cn("rounded-[var(--radius-sm)] bg-[var(--color-accent)]/15 p-8 text-center text-sm font-bold text-[var(--color-accent)]", state.previewMode === "dashboard" && "min-h-28", state.previewMode === "product" && "bg-gradient-to-br from-orange-100 to-pink-100", state.previewMode === "article" && "bg-gradient-to-br from-sky-100 to-indigo-100")}>
                {state.showDemoContent ? (state.previewMode === "dashboard" ? "+24%" : "Media") : null}
              </div>
              <div className="mt-4 min-w-0 space-y-2">
                <p className="truncate text-xs font-bold uppercase tracking-wide text-[var(--color-text-soft)]">Active: {activeBreakpoints.map((item) => item.name).join(", ") || "base"}</p>
                <h3 className="text-xl font-black text-[var(--color-text)]">{copy.title}</h3>
                {state.showDemoContent ? <p className="text-sm leading-6 text-[var(--color-text-soft)]">{copy.body}</p> : null}
                {state.showDemoContent ? <a className="inline-flex rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-white" href="#" onClick={(event) => event.preventDefault()}>{copy.cta}</a> : null}
              </div>
            </article>
          </div>
        </div>

        {state.showActiveRules ? <ActiveRules activeBreakpoints={activeBreakpoints} /> : null}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"><div className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-soft)]">{label}</div><div className="mt-1 truncate text-sm font-black text-[var(--color-text)]">{value}</div></div>;
}

function ActiveRules({ activeBreakpoints }: { activeBreakpoints: ContainerBreakpoint[] }) {
  const rules = activeBreakpoints.flatMap((breakpoint) => breakpoint.styles.map((rule) => ({ breakpoint, rule })));
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-[var(--color-text)]"><span>Active rules</span><span className="text-[var(--color-text-soft)]">{rules.length}</span></div>
      {rules.length ? <div className="grid gap-2 sm:grid-cols-2">{rules.slice(0, 8).map(({ breakpoint, rule }) => <div key={`${breakpoint.id}-${rule.id}`} className="min-w-0 rounded-[var(--radius-sm)] bg-[var(--color-bg-soft)] p-2 font-mono text-[11px]"><div className="truncate text-[var(--color-text-soft)]">{breakpoint.name} · {rule.selector}</div><div className="truncate font-bold text-[var(--color-text)]">{rule.property}: {rule.value}</div></div>)}</div> : <p className="text-xs text-[var(--color-text-soft)]">No custom breakpoint is active at this width.</p>}
    </div>
  );
}
