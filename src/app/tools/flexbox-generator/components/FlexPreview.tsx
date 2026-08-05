import { Button } from "@/components/ui";
import { PreviewToolbar, SegmentedControl, type WarningMessage } from "@/features/tools/components";
import { cn } from "@/lib/cn";
import type { FlexGeneratorState, FlexItem, FlexStats } from "../types";
import { generateInlinePreviewStyles } from "../flexbox";
import { FlexAxisHelper } from "./FlexAxisHelper";

export function FlexPreview({ state, stats, messages, onPatch, onSelectItem }: { state: FlexGeneratorState; stats: FlexStats; messages: WarningMessage[]; onPatch: (patch: Partial<FlexGeneratorState>) => void; onSelectItem: (id: string) => void }) {
  const previewStyles = generateInlinePreviewStyles(state);
  const selectedItem = state.items.find((item) => item.id === state.selectedItemId) ?? state.items[0] ?? null;
  const riskLabel = stats.riskLevel === "low" ? "Safe" : stats.riskLevel === "medium" ? "Review" : "High risk";

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <PreviewToolbar
        title="Flex preview"
        description="Visualize main/cross axes, wrapping, item order, selected item sizing, and responsive risk."
        actions={<>{[375, 640, 768, 1024].map((width) => <Button key={width} size="sm" variant={state.previewWidth === width ? "primary" : "secondary"} onClick={() => onPatch({ previewWidth: width })}>{width}px</Button>)}</>}
      >
        <SegmentedControl
          ariaLabel="Flex preview overlays"
          value={state.showAxisOverlay ? "axis" : state.showItemSizes ? "sizes" : "clean"}
          onChange={(value) => onPatch({ showAxisOverlay: value === "axis", showItemSizes: value === "sizes", showWrapLines: value !== "clean" })}
          options={[{ value: "axis", label: "Axes" }, { value: "sizes", label: "Sizes" }, { value: "clean", label: "Clean" }]}
        />
      </PreviewToolbar>
      <div className="space-y-4 bg-[var(--color-bg-soft)] p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="Axis" value={state.direction.replace("-", " ")} detail={stats.mainAxis} />
          <MetricCard label="Items" value={`${state.items.length}`} detail={`${stats.growingItems} growing · ${stats.fixedItems} fixed`} />
          <MetricCard label="Responsive" value={state.responsive.enabled ? stats.responsiveSummary : "Off"} detail={state.responsive.enabled ? `${state.responsive.mobileBreakpoint}px mobile` : "No media query"} />
          <MetricCard label="Checks" value={riskLabel} detail={messages.length ? `${messages.length} note${messages.length === 1 ? "" : "s"}` : "No issues"} tone={stats.riskLevel} />
        </div>

        <FlexAxisHelper direction={state.direction} wrap={state.wrap} />

        {selectedItem ? (
          <div className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs text-[var(--color-text-soft)] sm:grid-cols-4">
            <CompactFact label="Selected" value={selectedItem.name} />
            <CompactFact label="Flex" value={`${selectedItem.flexGrow} ${selectedItem.flexShrink} ${selectedItem.flexBasis}`} />
            <CompactFact label="Order" value={String(selectedItem.order)} />
            <CompactFact label="Align" value={selectedItem.alignSelf} />
          </div>
        ) : null}

        <div className="overflow-auto rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="relative mx-auto transition-all" style={{ width: state.previewWidth, maxWidth: "100%" }}>
            {state.showAxisOverlay ? <AxisOverlay direction={state.direction} /> : null}
            {state.showGapMarkers ? <GapMarker row={state.gap.row} column={state.gap.column} unit={state.gap.unit} /> : null}
            <div className="relative" style={previewStyles.container}>
              {state.items.map((item) => <FlexPreviewItem key={item.id} item={item} selected={item.id === state.selectedItemId} showSizes={state.showItemSizes} onSelect={() => onSelectItem(item.id)} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FlexPreviewItem({ item, selected, showSizes, onSelect }: { item: FlexItem; selected: boolean; showSizes: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn("relative min-h-20 min-w-0 rounded-[var(--radius-md)] border border-white/40 p-4 text-left shadow-sm transition hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]", selected && "ring-4 ring-[var(--color-accent)]/30")}
      style={{ flexGrow: item.flexGrow, flexShrink: item.flexShrink, flexBasis: item.flexBasis, width: item.width === "auto" ? undefined : item.width, height: item.height === "auto" ? undefined : item.height, order: item.order, alignSelf: item.alignSelf === "auto" ? undefined : item.alignSelf, marginLeft: item.marginLeftAuto ? "auto" : undefined, marginRight: item.marginRightAuto ? "auto" : undefined, background: item.background, color: item.textColor, borderRadius: item.borderRadius, padding: item.padding }}
    >
      <span className="absolute right-2 top-2 rounded-full bg-black/20 px-2 py-0.5 text-xs font-bold text-white">order {item.order}</span>
      <span className="block truncate pr-16 text-sm font-black">{item.content}</span>
      {showSizes ? <span className="mt-2 block truncate text-xs opacity-80">grow {item.flexGrow} · shrink {item.flexShrink} · basis {item.flexBasis}</span> : null}
      {(item.marginLeftAuto || item.marginRightAuto) ? <span className="mt-2 inline-flex rounded-full bg-black/20 px-2 py-0.5 text-xs font-bold text-white">auto margin</span> : null}
    </button>
  );
}

function AxisOverlay({ direction }: { direction: FlexGeneratorState["direction"] }) {
  const horizontal = direction === "row" || direction === "row-reverse";
  return (
    <div className="pointer-events-none absolute inset-3 z-10 text-xs font-black uppercase tracking-wide text-[var(--color-accent-text)]">
      <span className={cn("absolute rounded-full bg-[var(--color-surface)]/90 px-2 py-1 shadow", horizontal ? "left-4 top-4" : "left-4 top-4")}>main axis {horizontal ? "→" : "↓"}</span>
      <span className={cn("absolute rounded-full bg-[var(--color-surface)]/90 px-2 py-1 shadow", horizontal ? "left-4 top-12" : "left-24 top-4")}>cross axis {horizontal ? "↓" : "→"}</span>
    </div>
  );
}

function GapMarker({ row, column, unit }: { row: number; column: number; unit: string }) {
  return (
    <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wide text-[var(--color-text-soft)] shadow-sm">
      gap {row}{unit} / {column}{unit}
    </div>
  );
}

function MetricCard({ label, value, detail, tone = "low" }: { label: string; value: string; detail: string; tone?: FlexStats["riskLevel"] }) {
  const toneClass = tone === "high" ? "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]" : tone === "medium" ? "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)]" : "border-[var(--color-border)] bg-[var(--color-surface)]";
  return (
    <div className={cn("min-w-0 rounded-[var(--radius-md)] border p-3 shadow-[var(--shadow-xs)]", toneClass)}>
      <div className="font-mono text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-[var(--color-text)]">{value}</div>
      <div className="mt-1 truncate text-xs text-[var(--color-text-soft)]" title={detail}>{detail}</div>
    </div>
  );
}

function CompactFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="truncate font-semibold text-[var(--color-text)]" title={value}>{value}</div>
    </div>
  );
}
