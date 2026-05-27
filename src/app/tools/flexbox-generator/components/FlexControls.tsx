import { Button, Input, Select } from "@/components/ui";
import { ColorField, ControlGrid, ControlSection, NumberField, PresetGallery, SegmentedControl, SliderNumberField, ToolControlPanel } from "@/features/tools/components";
import { FLEX_PRESETS } from "../presets";
import type { AlignContent, AlignItems, FlexDirection, FlexGeneratorState, FlexItem, FlexPreset, FlexWrap, JustifyContent } from "../types";

const directions: FlexDirection[] = ["row", "row-reverse", "column", "column-reverse"];
const wraps: FlexWrap[] = ["nowrap", "wrap", "wrap-reverse"];
const justify: JustifyContent[] = ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"];
const alignItems: AlignItems[] = ["stretch", "flex-start", "center", "flex-end", "baseline"];
const alignContent: AlignContent[] = ["stretch", "flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"];

export function FlexControls({ state, activePreset, selectedItem, onPatch, onLoadPreset, onUpdateItem, onAddItem, onDeleteItem }: { state: FlexGeneratorState; activePreset: string; selectedItem: FlexItem | null; onPatch: (patch: Partial<FlexGeneratorState>) => void; onLoadPreset: (preset: FlexPreset) => void; onUpdateItem: (patch: Partial<FlexItem>) => void; onAddItem: () => void; onDeleteItem: () => void }) {
  return (
    <ToolControlPanel title="Flex settings" description="Tune axes, wrapping, alignment, and item behavior.">
      <ControlSection title="Presets">
        <PresetGallery presets={FLEX_PRESETS} selectedId={activePreset} onSelect={(_, preset) => onLoadPreset(preset)} getId={(preset) => preset.id} getLabel={(preset) => preset.name} getDescription={(preset) => preset.description} />
      </ControlSection>
      <ControlSection title="Container">
        <div className="space-y-3">
          <SegmentedControl ariaLabel="Flex direction" value={state.direction} onChange={(direction) => onPatch({ direction })} options={directions.map((value) => ({ value, label: value.replace("-", " ") }))} />
          <SegmentedControl ariaLabel="Flex wrap" value={state.wrap} onChange={(wrap) => onPatch({ wrap })} options={wraps.map((value) => ({ value, label: value }))} />
          <ControlGrid columns={2}>
            <SliderNumberField label="Row gap" value={state.gap.row} min={0} max={state.gap.unit === "rem" ? 6 : 96} step={state.gap.unit === "rem" ? 0.25 : 1} unit={state.gap.unit} onChange={(row) => onPatch({ gap: { ...state.gap, row } })} />
            <SliderNumberField label="Column gap" value={state.gap.column} min={0} max={state.gap.unit === "rem" ? 6 : 96} step={state.gap.unit === "rem" ? 0.25 : 1} unit={state.gap.unit} onChange={(column) => onPatch({ gap: { ...state.gap, column } })} />
            <SliderNumberField label="Min height" value={state.minHeight} min={160} max={720} unit="px" onChange={(minHeight) => onPatch({ minHeight })} />
            <ColorField label="Background" value={state.background} onChange={(background) => onPatch({ background })} />
          </ControlGrid>
        </div>
      </ControlSection>
      <ControlSection title="Alignment">
        <ControlGrid columns={2}>
          <CompactSelect label="justify-content" value={state.justifyContent} values={justify} onChange={(justifyContent) => onPatch({ justifyContent })} />
          <CompactSelect label="align-items" value={state.alignItems} values={alignItems} onChange={(alignItems) => onPatch({ alignItems })} />
          <CompactSelect label="align-content" value={state.alignContent} values={alignContent} onChange={(alignContent) => onPatch({ alignContent })} />
        </ControlGrid>
      </ControlSection>
      <ControlSection title="Selected item" action={<Button size="sm" variant="secondary" onClick={onAddItem}>Add</Button>}>
        {selectedItem ? (
          <div className="space-y-3">
            <Input size="sm" value={selectedItem.content} aria-label="Flex item content" onChange={(event) => onUpdateItem({ content: event.target.value })} />
            <ControlGrid columns={2}>
              <NumberField label="Order" value={selectedItem.order} min={-12} max={12} onChange={(order) => onUpdateItem({ order })} />
              <NumberField label="Grow" value={selectedItem.flexGrow} min={0} max={12} step={0.1} onChange={(flexGrow) => onUpdateItem({ flexGrow })} />
              <NumberField label="Shrink" value={selectedItem.flexShrink} min={0} max={12} step={0.1} onChange={(flexShrink) => onUpdateItem({ flexShrink })} />
              <ColorField label="Item color" value={selectedItem.background} onChange={(background) => onUpdateItem({ background })} />
            </ControlGrid>
            <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]"><span>Flex basis</span><Input size="sm" value={selectedItem.flexBasis} onChange={(event) => onUpdateItem({ flexBasis: event.target.value })} /></label>
            <Button size="sm" variant="danger" onClick={onDeleteItem} disabled={state.items.length <= 1}>Remove selected</Button>
          </div>
        ) : null}
      </ControlSection>
    </ToolControlPanel>
  );
}

function CompactSelect<T extends string>({ label, value, values, onChange }: { label: string; value: T; values: T[]; onChange: (value: T) => void }) {
  return <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]"><span>{label}</span><Select size="sm" value={value} onChange={(event) => onChange(event.target.value as T)}>{values.map((item) => <option key={item} value={item}>{item}</option>)}</Select></label>;
}
