import { Button } from "@/components/ui";
import { PreviewToolbar, SegmentedControl } from "@/features/tools/components";
import { cn } from "@/lib/cn";
import type { FlexGeneratorState, FlexItem } from "../types";
import { generateInlinePreviewStyles } from "../flexbox";
import { FlexAxisHelper } from "./FlexAxisHelper";

export function FlexPreview({ state, onPatch, onSelectItem }: { state: FlexGeneratorState; onPatch: (patch: Partial<FlexGeneratorState>) => void; onSelectItem: (id: string) => void }) {
  const previewStyles = generateInlinePreviewStyles(state);
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <PreviewToolbar
        title="Flex preview"
        description="Visualize main/cross axes, wrapping, item order, and selected item sizing."
        actions={<>{[375, 768, 1024].map((width) => <Button key={width} size="sm" variant={state.previewWidth === width ? "primary" : "secondary"} onClick={() => onPatch({ previewWidth: width })}>{width}px</Button>)}</>}
      >
        <SegmentedControl
          ariaLabel="Flex preview overlays"
          value={state.showAxisOverlay ? "axis" : state.showItemSizes ? "sizes" : "clean"}
          onChange={(value) => onPatch({ showAxisOverlay: value === "axis", showItemSizes: value === "sizes", showWrapLines: value !== "clean" })}
          options={[{ value: "axis", label: "Axes" }, { value: "sizes", label: "Sizes" }, { value: "clean", label: "Clean" }]}
        />
      </PreviewToolbar>
      <div className="bg-[var(--color-bg-soft)] p-4">
        <FlexAxisHelper direction={state.direction} wrap={state.wrap} />
        <div className="mt-4 overflow-auto rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="relative mx-auto transition-all" style={{ width: state.previewWidth, maxWidth: "100%" }}>
            {state.showAxisOverlay ? <AxisOverlay direction={state.direction} /> : null}
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
      className={cn("relative min-h-20 rounded-[var(--radius-md)] border border-white/40 p-4 text-left shadow-sm transition hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]", selected && "ring-4 ring-[var(--color-accent)]/30")}
      style={{ flexGrow: item.flexGrow, flexShrink: item.flexShrink, flexBasis: item.flexBasis, width: item.width || undefined, height: item.height || undefined, order: item.order, alignSelf: item.alignSelf === "auto" ? undefined : item.alignSelf, marginLeft: item.marginLeftAuto ? "auto" : undefined, marginRight: item.marginRightAuto ? "auto" : undefined, background: item.background, color: item.textColor, borderRadius: item.borderRadius, padding: item.padding }}
    >
      <span className="absolute right-2 top-2 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold text-white">order {item.order}</span>
      <span className="block text-sm font-black">{item.content}</span>
      {showSizes ? <span className="mt-2 block text-xs opacity-80">grow {item.flexGrow} · shrink {item.flexShrink} · basis {item.flexBasis}</span> : null}
    </button>
  );
}

function AxisOverlay({ direction }: { direction: FlexGeneratorState["direction"] }) {
  const horizontal = direction === "row" || direction === "row-reverse";
  return (
    <div className="pointer-events-none absolute inset-3 z-10 text-[10px] font-black uppercase tracking-wide text-[var(--color-accent)]">
      <span className={cn("absolute rounded-full bg-[var(--color-surface)]/90 px-2 py-1 shadow", horizontal ? "left-4 top-4" : "left-4 top-4")}>main axis {horizontal ? "→" : "↓"}</span>
      <span className={cn("absolute rounded-full bg-[var(--color-surface)]/90 px-2 py-1 shadow", horizontal ? "left-4 top-12" : "left-24 top-4")}>cross axis {horizontal ? "↓" : "→"}</span>
    </div>
  );
}
