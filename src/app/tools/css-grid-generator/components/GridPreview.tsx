import { Button } from "@/components/ui";
import { PreviewToolbar, SegmentedControl } from "@/features/tools/components";
import { cn } from "@/lib/cn";
import type { GridGeneratorState, GridItem } from "../types";

export function GridPreview({
  state,
  onPatch,
  onSelectItem,
}: {
  state: GridGeneratorState;
  onPatch: (patch: Partial<GridGeneratorState>) => void;
  onSelectItem: (id: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <PreviewToolbar
        title="Grid preview"
        description="Real CSS Grid with selectable items, grid lines, and responsive width controls."
        actions={
          <>
            {[375, 768, 1024].map((width) => (
              <Button key={width} size="sm" variant={state.previewWidth === width ? "primary" : "secondary"} onClick={() => onPatch({ previewWidth: width })}>
                {width}px
              </Button>
            ))}
          </>
        }
      >
        <SegmentedControl
          ariaLabel="Grid preview overlays"
          value={state.showGridLines ? "lines" : state.showAreaNames ? "labels" : "clean"}
          onChange={(value) =>
            onPatch({
              showGridLines: value === "lines",
              showAreaNames: value !== "clean",
              showLineNumbers: value === "lines",
            })
          }
          options={[
            { value: "lines", label: "Lines" },
            { value: "labels", label: "Labels" },
            { value: "clean", label: "Clean" },
          ]}
        />
      </PreviewToolbar>
      <div className="overflow-auto bg-[var(--color-bg-soft)] p-4">
        <div className="relative mx-auto transition-all" style={{ width: state.previewWidth, maxWidth: "100%" }}>
          <div className="mb-3 flex items-center justify-between text-xs text-[var(--color-text-soft)]">
            <span>{state.columns} columns × {state.rows} rows</span>
            <span>{state.previewWidth}px container</span>
          </div>
          {state.showLineNumbers ? <GridLineLabels columns={state.columns} rows={state.rows} /> : null}
          <div
            className={cn(
              "relative grid min-h-[430px] rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] p-3",
              state.showGridLines && "bg-[linear-gradient(to_right,var(--color-preview-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-preview-grid)_1px,transparent_1px)] bg-[size:48px_48px]",
            )}
            style={{
              gridTemplateColumns: state.columnTemplate,
              gridTemplateRows: state.rowTemplate,
              gap: `${state.gap.row}${state.gap.unit} ${state.gap.column}${state.gap.unit}`,
              justifyItems: state.justifyItems,
              alignItems: state.alignItems,
              justifyContent: state.justifyContent,
              alignContent: state.alignContent,
            }}
          >
            {state.items.map((item) => <GridPreviewItem key={item.id} item={item} selected={item.id === state.selectedItemId} showAreaNames={state.showAreaNames} onSelect={() => onSelectItem(item.id)} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

function GridPreviewItem({ item, selected, showAreaNames, onSelect }: { item: GridItem; selected: boolean; showAreaNames: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group min-h-20 rounded-[var(--radius-md)] border border-white/40 p-4 text-left shadow-sm transition hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
        selected && "ring-4 ring-[var(--color-accent)]/30",
      )}
      style={{
        gridColumn: `${item.columnStart} / ${item.columnEnd}`,
        gridRow: `${item.rowStart} / ${item.rowEnd}`,
        background: item.background,
        color: item.textColor,
        borderRadius: item.borderRadius,
        padding: item.padding,
        justifySelf: item.justifySelf === "auto" ? undefined : item.justifySelf,
        alignSelf: item.alignSelf === "auto" ? undefined : item.alignSelf,
      }}
    >
      <span className="block text-sm font-black">{showAreaNames ? item.areaName : item.name}</span>
      <span className="mt-2 block text-xs opacity-80">{item.columnStart}/{item.rowStart} → {item.columnEnd}/{item.rowEnd}</span>
      <span className="mt-4 block text-sm font-medium opacity-90">{item.content}</span>
    </button>
  );
}

function GridLineLabels({ columns, rows }: { columns: number; rows: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-[10px] font-bold text-[var(--color-accent)]/70">
      {Array.from({ length: columns + 1 }).map((_, index) => (
        <span key={`c-${index}`} className="absolute -top-2" style={{ left: `${(index / columns) * 100}%` }}>{index + 1}</span>
      ))}
      {Array.from({ length: rows + 1 }).map((_, index) => (
        <span key={`r-${index}`} className="absolute -left-2" style={{ top: `${(index / rows) * 100}%` }}>{index + 1}</span>
      ))}
    </div>
  );
}
