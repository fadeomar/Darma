import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { ControlGrid, ControlSection, NumberField, PresetGallery, SegmentedControl, ToolControlPanel } from "@/features/tools/components";
import { RESPONSIVE_IMAGE_PRESETS } from "../presets";
import type { ImageCandidate, PictureSource, ResponsiveImageMode, ResponsiveImageState, SizesRule } from "../types";

function ToggleRow({ checked, label, description, onChange }: { checked: boolean; label: string; description: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]" />
      <span className="min-w-0"><span className="block text-xs font-bold text-[var(--color-text-primary)]">{label}</span><span className="mt-1 block text-[11px] leading-5 text-[var(--color-text-tertiary)]">{description}</span></span>
    </label>
  );
}

export function ResponsiveImageControls({
  state,
  onPatch,
  onLoadPreset,
  onUpdateCandidate,
  onRemoveCandidate,
  onUpdateSizeRule,
  onRemoveSizeRule,
  onAddCandidate,
  onRegenerateCandidates,
  onAddSizeRule,
  onAddPictureSource,
  onUpdatePictureSource,
  onRemovePictureSource,
  onRegeneratePictureSource,
}: {
  state: ResponsiveImageState;
  onPatch: (patch: Partial<ResponsiveImageState>) => void;
  onLoadPreset: (state: ResponsiveImageState) => void;
  onUpdateCandidate: (id: string, patch: Partial<ImageCandidate>) => void;
  onRemoveCandidate: (id: string) => void;
  onUpdateSizeRule: (id: string, patch: Partial<SizesRule>) => void;
  onRemoveSizeRule: (id: string) => void;
  onAddCandidate: () => void;
  onRegenerateCandidates: () => void;
  onAddSizeRule: () => void;
  onAddPictureSource: () => void;
  onUpdatePictureSource: (id: string, patch: Partial<PictureSource>) => void;
  onRemovePictureSource: (id: string) => void;
  onRegeneratePictureSource: (id: string) => void;
}) {
  return (
    <ToolControlPanel title="Image settings" description="Define sources, sizing rules, browser hints, and export options.">
      <ControlSection title="Presets">
        <PresetGallery presets={RESPONSIVE_IMAGE_PRESETS} selectedId={state.presetId} onSelect={(_, preset) => onLoadPreset(preset.state)} getId={(preset) => preset.id} getLabel={(preset) => preset.name} getDescription={(preset) => preset.description} />
      </ControlSection>

      <ControlSection title="Output mode">
        <SegmentedControl ariaLabel="Responsive image output mode" value={state.mode} onChange={(mode: ResponsiveImageMode) => onPatch({ mode })} options={[{ value: "img", label: "img" }, { value: "picture", label: "picture" }, { value: "next-image", label: "Next.js" }]} fullWidth />
      </ControlSection>

      <ControlSection title="Fallback and semantics" description="The final img element always needs a stable fallback and dimensions.">
        <div className="space-y-2">
          <Input size="sm" value={state.attributes.src || state.fallbackSrc} onChange={(event) => onPatch({ attributes: { ...state.attributes, src: event.target.value }, fallbackSrc: event.target.value })} aria-label="Fallback image source" placeholder="/images/card-800.jpg" />
          <Input size="sm" value={state.attributes.alt} onChange={(event) => onPatch({ attributes: { ...state.attributes, alt: event.target.value } })} aria-label="Alternative text" placeholder="Describe meaningful image content" />
          <Input size="sm" value={state.attributes.className} onChange={(event) => onPatch({ attributes: { ...state.attributes, className: event.target.value } })} aria-label="CSS class name" placeholder="responsive-image" />
        </div>
        <ControlGrid columns={2}>
          <NumberField label="Width" value={state.attributes.width} min={1} max={10000} unit="px" onChange={(width) => onPatch({ attributes: { ...state.attributes, width } })} />
          <NumberField label="Height" value={state.attributes.height} min={1} max={10000} unit="px" onChange={(height) => onPatch({ attributes: { ...state.attributes, height } })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Browser loading hints">
        <ControlGrid columns={2}>
          <label className="space-y-1 text-[11px] font-bold text-[var(--color-text-tertiary)]">Loading<Select size="sm" value={state.attributes.loading} onChange={(event) => onPatch({ attributes: { ...state.attributes, loading: event.target.value as ResponsiveImageState["attributes"]["loading"] } })}><option value="lazy">lazy</option><option value="eager">eager</option></Select></label>
          <label className="space-y-1 text-[11px] font-bold text-[var(--color-text-tertiary)]">Decoding<Select size="sm" value={state.attributes.decoding} onChange={(event) => onPatch({ attributes: { ...state.attributes, decoding: event.target.value as ResponsiveImageState["attributes"]["decoding"] } })}><option value="async">async</option><option value="auto">auto</option><option value="sync">sync</option></Select></label>
          <label className="space-y-1 text-[11px] font-bold text-[var(--color-text-tertiary)]">Fetch priority<Select size="sm" value={state.attributes.fetchPriority} onChange={(event) => onPatch({ attributes: { ...state.attributes, fetchPriority: event.target.value as ResponsiveImageState["attributes"]["fetchPriority"] } })}><option value="auto">auto</option><option value="high">high</option><option value="low">low</option></Select></label>
          <label className="space-y-1 text-[11px] font-bold text-[var(--color-text-tertiary)]">Object fit<Select size="sm" value={state.attributes.objectFit} onChange={(event) => onPatch({ attributes: { ...state.attributes, objectFit: event.target.value as ResponsiveImageState["attributes"]["objectFit"] } })}><option value="cover">cover</option><option value="contain">contain</option><option value="fill">fill</option><option value="none">none</option><option value="scale-down">scale-down</option></Select></label>
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Candidates" meta={`${state.candidates.length}/12`} action={<Button size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden />} onClick={onAddCandidate}>Add</Button>}>
        <div className="flex gap-2"><Input size="sm" value={state.urlPattern} onChange={(event) => onPatch({ urlPattern: event.target.value })} aria-label="Candidate URL pattern" placeholder="/images/card-{width}.jpg" /><Button size="icon" variant="secondary" onClick={onRegenerateCandidates} leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}>Regenerate candidates</Button></div>
        <div className="space-y-2">{state.candidates.map((candidate) => <CandidateRow key={candidate.id} candidate={candidate} canRemove={state.candidates.length > 1} onUpdate={(patch) => onUpdateCandidate(candidate.id, patch)} onRemove={() => onRemoveCandidate(candidate.id)} />)}</div>
      </ControlSection>

      <ControlSection title="Sizes rules" meta={`${state.sizes.length}/8`} action={<Button size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden />} onClick={onAddSizeRule}>Add</Button>}>
        <div className="space-y-2">{state.sizes.map((rule) => <SizeRuleRow key={rule.id} rule={rule} onUpdate={(patch) => onUpdateSizeRule(rule.id, patch)} onRemove={() => onRemoveSizeRule(rule.id)} />)}</div>
        <label className="space-y-1 text-[11px] font-bold text-[var(--color-text-tertiary)]">Default slot size<Input size="sm" value={state.defaultSlotSize} onChange={(event) => onPatch({ defaultSlotSize: event.target.value })} aria-label="Default slot size" placeholder="33vw" /></label>
      </ControlSection>

      {state.mode === "picture" ? (
        <ControlSection title="Picture sources" meta={`${state.pictureSources.length}/5`} action={<Button size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden />} onClick={onAddPictureSource}>Add source</Button>}>
          <div className="space-y-2">{state.pictureSources.map((source) => <PictureSourceRow key={source.id} source={source} onUpdate={(patch) => onUpdatePictureSource(source.id, patch)} onRemove={() => onRemovePictureSource(source.id)} onRegenerate={() => onRegeneratePictureSource(source.id)} />)}</div>
        </ControlSection>
      ) : null}

      <ControlSection title="Preview helpers">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <ToggleRow checked={state.showCandidateAnalyzer} label="Candidate analyzer" description="Show slot, candidate, and browser-choice steps." onChange={(showCandidateAnalyzer) => onPatch({ showCandidateAnalyzer })} />
          <ToggleRow checked={state.showSlotRuler} label="Slot ruler" description="Show slot and ideal-resource labels above the preview." onChange={(showSlotRuler) => onPatch({ showSlotRuler })} />
        </div>
      </ControlSection>

      <ControlSection title="Export options">
        <Input size="sm" value={state.exportOptions.componentName} onChange={(event) => onPatch({ exportOptions: { ...state.exportOptions, componentName: event.target.value } })} aria-label="React component name" placeholder="ResponsiveImage" />
        <SegmentedControl ariaLabel="HTML quote style" value={state.exportOptions.quoteStyle} onChange={(quoteStyle) => onPatch({ exportOptions: { ...state.exportOptions, quoteStyle } })} options={[{ value: "double", label: 'Double "' }, { value: "single", label: "Single '" }]} fullWidth />
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <ToggleRow checked={state.exportOptions.includeComments} label="Include comments" description="Keep section labels in combined snippet exports." onChange={(includeComments) => onPatch({ exportOptions: { ...state.exportOptions, includeComments } })} />
          <ToggleRow checked={state.exportOptions.includeCssHelper} label="Include CSS helper" description="Include object-fit and responsive sizing styles in handoffs." onChange={(includeCssHelper) => onPatch({ exportOptions: { ...state.exportOptions, includeCssHelper } })} />
        </div>
      </ControlSection>
    </ToolControlPanel>
  );
}

function CandidateRow({ candidate, canRemove, onUpdate, onRemove }: { candidate: ImageCandidate; canRemove: boolean; onUpdate: (patch: Partial<ImageCandidate>) => void; onRemove: () => void }) {
  return (
    <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-2.5">
      <div className="flex gap-2"><Input size="sm" value={candidate.url} onChange={(event) => onUpdate({ url: event.target.value })} aria-label={`Candidate ${candidate.width} URL`} /><Button size="icon" variant="ghost" disabled={!canRemove} onClick={onRemove} leftIcon={<Trash2 className="h-4 w-4" aria-hidden />}>Remove candidate</Button></div>
      <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2"><NumberField label="Width" value={candidate.width} min={16} max={8000} unit="w" onChange={(width) => onUpdate({ width })} /><label className="space-y-1 text-[11px] font-bold text-[var(--color-text-tertiary)]">Format<Select size="sm" value={candidate.format} onChange={(event) => onUpdate({ format: event.target.value as ImageCandidate["format"] })}><option value="jpg">JPG</option><option value="png">PNG</option><option value="webp">WebP</option><option value="avif">AVIF</option><option value="custom">Custom</option></Select></label></div>
    </div>
  );
}

function SizeRuleRow({ rule, onUpdate, onRemove }: { rule: SizesRule; onUpdate: (patch: Partial<SizesRule>) => void; onRemove: () => void }) {
  return (
    <div className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-2.5 sm:grid-cols-[minmax(0,1fr)_8rem_auto] xl:grid-cols-1">
      <Input size="sm" value={rule.mediaCondition} onChange={(event) => onUpdate({ mediaCondition: event.target.value })} aria-label="Sizes media condition" placeholder="(max-width: 640px)" />
      <Input size="sm" value={rule.slotSize} onChange={(event) => onUpdate({ slotSize: event.target.value })} aria-label="Sizes slot size" placeholder="100vw" />
      <Button size="sm" variant="ghost" leftIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden />} onClick={onRemove}>Remove</Button>
    </div>
  );
}

function PictureSourceRow({ source, onUpdate, onRemove, onRegenerate }: { source: PictureSource; onUpdate: (patch: Partial<PictureSource>) => void; onRemove: () => void; onRegenerate: () => void }) {
  return (
    <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-2.5">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <Select size="sm" value={source.type} onChange={(event) => onUpdate({ type: event.target.value as PictureSource["type"] })} aria-label="Picture source MIME type"><option value="image/avif">image/avif</option><option value="image/webp">image/webp</option><option value="image/jpeg">image/jpeg</option><option value="image/png">image/png</option><option value="custom">custom</option></Select>
        <Input size="sm" value={source.media} onChange={(event) => onUpdate({ media: event.target.value })} aria-label="Picture source media condition" placeholder="Optional media condition" />
      </div>
      <Input size="sm" value={source.urlPattern} onChange={(event) => onUpdate({ urlPattern: event.target.value })} aria-label="Picture source URL pattern" placeholder="/images/card-{width}.webp" />
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--color-text-tertiary)]"><span>{source.candidates.length} candidate{source.candidates.length === 1 ? "" : "s"}</span><div className="flex gap-2"><Button size="sm" variant="ghost" leftIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />} onClick={onRegenerate}>Regenerate</Button><Button size="sm" variant="ghost" leftIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden />} onClick={onRemove}>Remove</Button></div></div>
    </div>
  );
}
