import { Button, Input, Select } from "@/components/ui";
import { ColorField, ControlGrid, ControlSection, NumberField, PresetGallery, SegmentedControl, SliderNumberField, ToolControlPanel } from "@/features/tools/components";
import { applyQuickAction } from "../flexbox";
import { FLEX_PRESETS } from "../presets";
import type { AlignContent, AlignItems, FlexAlignSelf, FlexDirection, FlexGeneratorState, FlexItem, FlexPreset, FlexWrap, JustifyContent } from "../types";

const directions: FlexDirection[] = ["row", "row-reverse", "column", "column-reverse"];
const wraps: FlexWrap[] = ["nowrap", "wrap", "wrap-reverse"];
const justify: JustifyContent[] = ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"];
const alignItems: AlignItems[] = ["stretch", "flex-start", "center", "flex-end", "baseline"];
const alignContent: AlignContent[] = ["stretch", "flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"];
const alignSelf: FlexAlignSelf[] = ["auto", "stretch", "flex-start", "center", "flex-end", "baseline"];

export function FlexControls({
  state,
  activePreset,
  selectedItem,
  onPatch,
  onReplaceState,
  onLoadPreset,
  onUpdateItem,
  onAddItem,
  onDuplicateItem,
  onDeleteItem,
}: {
  state: FlexGeneratorState;
  activePreset: string;
  selectedItem: FlexItem | null;
  onPatch: (patch: Partial<FlexGeneratorState>) => void;
  onReplaceState: (nextState: FlexGeneratorState) => void;
  onLoadPreset: (preset: FlexPreset) => void;
  onUpdateItem: (patch: Partial<FlexItem>) => void;
  onAddItem: () => void;
  onDuplicateItem: () => void;
  onDeleteItem: () => void;
}) {
  return (
    <ToolControlPanel title="Flex settings" description="Tune axes, wrapping, alignment, item sizing, responsive behavior, and production exports.">
      <ControlSection title="Presets">
        <PresetGallery presets={FLEX_PRESETS} selectedId={activePreset} onSelect={(_, preset) => onLoadPreset(preset)} getId={(preset) => preset.id} getLabel={(preset) => preset.name} getDescription={(preset) => preset.description} />
      </ControlSection>

      <ControlSection title="Quick actions">
        <div className="grid gap-2 sm:grid-cols-2">
          <QuickAction label="Center all" onClick={() => onReplaceState(applyQuickAction(state, "center-everything"))} />
          <QuickAction label="Space between" onClick={() => onReplaceState(applyQuickAction(state, "space-between"))} />
          <QuickAction label="Equal items" onClick={() => onReplaceState(applyQuickAction(state, "equal-items"))} />
          <QuickAction label="Wrap cards" onClick={() => onReplaceState(applyQuickAction(state, "wrap-cards"))} />
          <QuickAction label="Vertical stack" onClick={() => onReplaceState(applyQuickAction(state, "vertical-stack"))} />
          <QuickAction label="Push selected" onClick={() => onReplaceState(applyQuickAction(state, "push-last-end"))} />
        </div>
      </ControlSection>

      <ControlSection title="Container layout">
        <div className="space-y-3">
          <SegmentedControl ariaLabel="Flex direction" value={state.direction} onChange={(direction) => onPatch({ direction })} options={directions.map((value) => ({ value, label: value.replace("-", " ") }))} fullWidth />
          <SegmentedControl ariaLabel="Flex wrap" value={state.wrap} onChange={(wrap) => onPatch({ wrap })} options={wraps.map((value) => ({ value, label: value }))} fullWidth />
          <ControlGrid columns={2}>
            <CompactSelect label="display" value={state.display} values={["flex", "inline-flex"]} onChange={(display) => onPatch({ display })} />
            <CompactSelect label="gap unit" value={state.gap.unit} values={["rem", "px"]} onChange={(unit) => onPatch({ gap: { ...state.gap, unit } })} />
            <SliderNumberField label="Row gap" value={state.gap.row} min={0} max={state.gap.unit === "rem" ? 6 : 96} step={state.gap.unit === "rem" ? 0.25 : 1} unit={state.gap.unit} onChange={(row) => onPatch({ gap: { ...state.gap, row } })} />
            <SliderNumberField label="Column gap" value={state.gap.column} min={0} max={state.gap.unit === "rem" ? 6 : 96} step={state.gap.unit === "rem" ? 0.25 : 1} unit={state.gap.unit} onChange={(column) => onPatch({ gap: { ...state.gap, column } })} />
            <SliderNumberField label="Min height" value={state.minHeight} min={120} max={800} unit="px" onChange={(minHeight) => onPatch({ minHeight })} />
            <SliderNumberField label="Radius" value={state.borderRadius} min={0} max={64} unit="px" onChange={(borderRadius) => onPatch({ borderRadius })} />
          </ControlGrid>
          <ControlGrid columns={2}>
            <ColorField label="Background" value={state.background} onChange={(background) => onPatch({ background })} />
            <TextField label="Padding" value={state.padding} onChange={(padding) => onPatch({ padding })} />
            <TextField label="Container class" value={state.containerClassName} onChange={(containerClassName) => onPatch({ containerClassName })} />
            <TextField label="Item class prefix" value={state.itemClassPrefix} onChange={(itemClassPrefix) => onPatch({ itemClassPrefix })} />
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

      <ControlSection title="Selected item" action={<div className="flex gap-2"><Button size="sm" variant="secondary" onClick={onAddItem}>Add</Button><Button size="sm" variant="secondary" onClick={onDuplicateItem} disabled={!selectedItem || state.items.length >= 20}>Duplicate</Button></div>}>
        {selectedItem ? (
          <div className="space-y-3">
            <ControlGrid columns={2}>
              <TextField label="Name" value={selectedItem.name} onChange={(name) => onUpdateItem({ name })} />
              <TextField label="Content" value={selectedItem.content} onChange={(content) => onUpdateItem({ content })} />
              <NumberField label="Order" value={selectedItem.order} min={-12} max={12} onChange={(order) => onUpdateItem({ order })} />
              <NumberField label="Grow" value={selectedItem.flexGrow} min={0} max={12} step={0.1} onChange={(flexGrow) => onUpdateItem({ flexGrow })} />
              <NumberField label="Shrink" value={selectedItem.flexShrink} min={0} max={12} step={0.1} onChange={(flexShrink) => onUpdateItem({ flexShrink })} />
              <CompactSelect label="align-self" value={selectedItem.alignSelf} values={alignSelf} onChange={(value) => onUpdateItem({ alignSelf: value })} />
              <TextField label="Flex basis" value={selectedItem.flexBasis} onChange={(flexBasis) => onUpdateItem({ flexBasis })} />
              <TextField label="Width" value={selectedItem.width} onChange={(width) => onUpdateItem({ width })} />
              <TextField label="Height" value={selectedItem.height} onChange={(height) => onUpdateItem({ height })} />
              <TextField label="Padding" value={selectedItem.padding} onChange={(padding) => onUpdateItem({ padding })} />
              <SliderNumberField label="Radius" value={selectedItem.borderRadius} min={0} max={64} unit="px" onChange={(borderRadius) => onUpdateItem({ borderRadius })} />
              <ColorField label="Item color" value={selectedItem.background} onChange={(background) => onUpdateItem({ background })} />
              <ColorField label="Text color" value={selectedItem.textColor} onChange={(textColor) => onUpdateItem({ textColor })} />
            </ControlGrid>
            <div className="grid gap-2 sm:grid-cols-2">
              <ToggleButton active={selectedItem.marginLeftAuto} label="margin-left auto" onClick={() => onUpdateItem({ marginLeftAuto: !selectedItem.marginLeftAuto })} />
              <ToggleButton active={selectedItem.marginRightAuto} label="margin-right auto" onClick={() => onUpdateItem({ marginRightAuto: !selectedItem.marginRightAuto })} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => onReplaceState(applyQuickAction(state, "selected-fill-remaining"))}>Fill remaining</Button>
              <Button size="sm" variant="secondary" onClick={() => onReplaceState(applyQuickAction(state, "reset-item-sizing"))}>Reset sizing</Button>
              <Button size="sm" variant="danger" onClick={onDeleteItem} disabled={state.items.length <= 1}>Remove selected</Button>
            </div>
          </div>
        ) : null}
      </ControlSection>

      <ControlSection title="Responsive behavior">
        <div className="space-y-3">
          <ToggleButton active={state.responsive.enabled} label={state.responsive.enabled ? "Responsive CSS enabled" : "Responsive CSS disabled"} onClick={() => onPatch({ responsive: { ...state.responsive, enabled: !state.responsive.enabled } })} />
          <ControlGrid columns={2}>
            <SliderNumberField label="Tablet breakpoint" value={state.responsive.tabletBreakpoint} min={480} max={1200} step={8} unit="px" onChange={(tabletBreakpoint) => onPatch({ responsive: { ...state.responsive, tabletBreakpoint } })} />
            <SliderNumberField label="Mobile breakpoint" value={state.responsive.mobileBreakpoint} min={320} max={900} step={8} unit="px" onChange={(mobileBreakpoint) => onPatch({ responsive: { ...state.responsive, mobileBreakpoint } })} />
            <CompactSelect label="Tablet" value={state.responsive.tabletBehavior} values={["preserve", "wrap", "stack"]} onChange={(tabletBehavior) => onPatch({ responsive: { ...state.responsive, tabletBehavior } })} />
            <CompactSelect label="Mobile" value={state.responsive.mobileBehavior} values={["preserve", "wrap", "stack", "center-stack"]} onChange={(mobileBehavior) => onPatch({ responsive: { ...state.responsive, mobileBehavior } })} />
          </ControlGrid>
        </div>
      </ControlSection>

      <ControlSection title="Preview & export options">
        <ControlGrid columns={2}>
          <SliderNumberField label="Preview width" value={state.previewWidth} min={320} max={1440} step={20} unit="px" onChange={(previewWidth) => onPatch({ previewWidth })} />
          <ToggleButton active={state.includeDemoStyles} label="Demo styles" onClick={() => onPatch({ includeDemoStyles: !state.includeDemoStyles })} />
          <ToggleButton active={state.includeComments} label="CSS comments" onClick={() => onPatch({ includeComments: !state.includeComments })} />
          <ToggleButton active={state.showGapMarkers} label="Gap markers" onClick={() => onPatch({ showGapMarkers: !state.showGapMarkers })} />
        </ControlGrid>
      </ControlSection>
    </ToolControlPanel>
  );
}

function CompactSelect<T extends string>({ label, value, values, onChange }: { label: string; value: T; values: T[]; onChange: (value: T) => void }) {
  return (
    <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
      <span>{label}</span>
      <Select size="sm" value={value} onChange={(event) => onChange(event.target.value as T)}>
        {values.map((item) => <option key={item} value={item}>{item}</option>)}
      </Select>
    </label>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1 text-xs font-semibold text-[var(--color-text-soft)]">
      <span>{label}</span>
      <Input size="sm" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button size="sm" variant="secondary" className="justify-center" onClick={onClick}>{label}</Button>;
}

function ToggleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <Button size="sm" variant={active ? "primary" : "secondary"} className="justify-center" onClick={onClick}>
      {label}
    </Button>
  );
}
