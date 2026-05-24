"use client";

import { useMemo, useState } from "react";
import { Download, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import {
  createDefaultResponsiveImageState,
  createImageCandidate,
  createPictureSource,
  createSizesRule,
  estimateSelectedCandidate,
  estimateSlotWidth,
  generateAllResponsiveImageCode,
  generateCandidatesFromPattern,
  generateCssHelper,
  generateImgMarkup,
  generateNextImageMarkup,
  generatePictureMarkup,
  generateResponsiveImageExplanation,
  generateSizes,
  getMatchedSizesRule,
  normalizeResponsiveImageState,
  validateResponsiveImageState,
} from "./responsiveImage";
import { RESPONSIVE_IMAGE_PRESETS } from "./presets";
import type { ImageCandidate, ImageFormat, PictureSource, ResponsiveImageAttributes, ResponsiveImageMode, ResponsiveImageState, SizesRule } from "./types";

type PanelTab = "source" | "sizes" | "picture" | "attributes" | "export";
type CodeTab = "img" | "picture" | "next" | "css" | "explanation";

const PANEL_TABS: readonly TabItem<PanelTab>[] = [
  { value: "source", label: "Source" },
  { value: "sizes", label: "Sizes" },
  { value: "picture", label: "Picture" },
  { value: "attributes", label: "Attributes" },
  { value: "export", label: "Export" },
];

const CODE_TABS: readonly TabItem<CodeTab>[] = [
  { value: "img", label: "HTML <img>" },
  { value: "picture", label: "<picture>" },
  { value: "next", label: "Next.js Image" },
  { value: "css", label: "CSS helper" },
  { value: "explanation", label: "Explanation" },
];

const MODES: { value: ResponsiveImageMode; label: string }[] = [
  { value: "img", label: "HTML img" },
  { value: "picture", label: "Picture" },
  { value: "next-image", label: "Next.js Image" },
];
const FORMATS: ImageFormat[] = ["jpg", "jpeg", "png", "webp", "avif", "custom"];
const MIME_TYPES: PictureSource["type"][] = ["image/avif", "image/webp", "image/jpeg", "image/png", "custom"];
const DPR_VALUES = [1, 1.5, 2, 3] as const;
const QUICK_WIDTHS = [320, 640, 900, 1200, 1440];

export default function ResponsiveImageSrcsetClient() {
  const [state, setState] = useState<ResponsiveImageState>(() => createDefaultResponsiveImageState());
  const [panelTab, setPanelTab] = useState<PanelTab>("source");
  const [codeTab, setCodeTab] = useState<CodeTab>("img");
  const [toast, setToast] = useState("");

  const normalized = useMemo(() => normalizeResponsiveImageState(state), [state]);
  const slotWidth = useMemo(() => estimateSlotWidth(normalized.sizes, normalized.defaultSlotSize, normalized.previewViewportWidth), [normalized]);
  const selectedCandidate = useMemo(() => estimateSelectedCandidate(normalized.candidates, slotWidth, normalized.previewDpr), [normalized, slotWidth]);
  const matchedRule = useMemo(() => getMatchedSizesRule(normalized.sizes, normalized.previewViewportWidth), [normalized]);
  const imgMarkup = useMemo(() => generateImgMarkup(normalized), [normalized]);
  const pictureMarkup = useMemo(() => generatePictureMarkup(normalized), [normalized]);
  const nextMarkup = useMemo(() => generateNextImageMarkup(normalized), [normalized]);
  const cssHelper = useMemo(() => generateCssHelper(normalized), [normalized]);
  const explanation = useMemo(() => generateResponsiveImageExplanation(normalized), [normalized]);
  const messages = useMemo(() => validateResponsiveImageState(normalized), [normalized]);
  const currentCode = { img: imgMarkup, picture: pictureMarkup, next: nextMarkup, css: cssHelper, explanation }[codeTab];

  function patchState(patch: Partial<ResponsiveImageState>) {
    setState((current) => normalizeResponsiveImageState({ ...current, ...patch }));
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1400);
  }

  function loadPreset(id: string) {
    const preset = RESPONSIVE_IMAGE_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setState(normalizeResponsiveImageState(preset.state));
    setCodeTab(preset.state.mode === "picture" ? "picture" : preset.state.mode === "next-image" ? "next" : "img");
    showToast(`${preset.name} loaded`);
  }

  function regenerateCandidates() {
    const widths = normalized.candidates.map((candidate) => candidate.width);
    const format = normalized.candidates[0]?.format ?? "jpg";
    patchState({ candidates: generateCandidatesFromPattern(normalized.urlPattern, widths, format) });
    showToast("Candidates regenerated");
  }

  function updateCandidate(id: string, patch: Partial<ImageCandidate>) {
    patchState({ candidates: normalized.candidates.map((candidate) => (candidate.id === id ? { ...candidate, ...patch } : candidate)) });
  }

  function addCandidate() {
    if (normalized.candidates.length >= 12) return;
    const last = normalized.candidates[normalized.candidates.length - 1];
    const width = Math.min((last?.width ?? 800) + 400, 8000);
    patchState({ candidates: [...normalized.candidates, createImageCandidate({ width, url: normalized.urlPattern.replaceAll("{width}", String(width)), format: last?.format ?? "jpg" })] });
  }

  function deleteCandidate(id: string) {
    if (normalized.candidates.length <= 1) return;
    patchState({ candidates: normalized.candidates.filter((candidate) => candidate.id !== id) });
  }

  function updateSizeRule(id: string, patch: Partial<SizesRule>) {
    patchState({ sizes: normalized.sizes.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)) });
  }

  function addSizeRule() {
    if (normalized.sizes.length >= 8) return;
    patchState({ sizes: [...normalized.sizes, createSizesRule({ mediaCondition: "(max-width: 1280px)", slotSize: "66vw" })] });
  }

  function deleteSizeRule(id: string) {
    patchState({ sizes: normalized.sizes.filter((rule) => rule.id !== id) });
  }

  function updateAttributes(patch: Partial<ResponsiveImageAttributes>) {
    patchState({ attributes: { ...normalized.attributes, ...patch } });
  }

  function addPictureSource() {
    if (normalized.pictureSources.length >= 5) return;
    patchState({ pictureSources: [...normalized.pictureSources, createPictureSource()] });
  }

  function updatePictureSource(id: string, patch: Partial<PictureSource>) {
    patchState({ pictureSources: normalized.pictureSources.map((source) => (source.id === id ? { ...source, ...patch } : source)) });
  }

  function deletePictureSource(id: string) {
    patchState({ pictureSources: normalized.pictureSources.filter((source) => source.id !== id) });
  }

  function download(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div>
          <h2 className="text-xl font-black text-[var(--color-text)]">Image Delivery Studio</h2>
          <p className="text-sm text-[var(--color-text-soft)]">Build responsive srcset, sizes, picture, and Next.js Image snippets visually.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select className="w-52" value={normalized.presetId} onChange={(event) => loadPreset(event.target.value)} aria-label="Choose image preset">
            {RESPONSIVE_IMAGE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.name}</option>
            ))}
          </Select>
          <Select className="w-40" value={normalized.mode} onChange={(event) => patchState({ mode: event.target.value as ResponsiveImageMode })} aria-label="Generation mode">
            {MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
          </Select>
          <CopyButton text={currentCode} size="sm">Copy current</CopyButton>
          <Button size="sm" variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => setState(createDefaultResponsiveImageState())}>Reset</Button>
        </div>
      </div>

      {toast ? <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-text)]">{toast}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_420px]">
        <PreviewPanel state={normalized} slotWidth={slotWidth} selectedCandidate={selectedCandidate} matchedRule={matchedRule} patchState={patchState} />

        <aside className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <Tabs<PanelTab> items={PANEL_TABS} value={panelTab} onChange={setPanelTab} ariaLabel="Responsive image controls" />
          {panelTab === "source" ? <SourcePanel state={normalized} updateCandidate={updateCandidate} addCandidate={addCandidate} deleteCandidate={deleteCandidate} regenerateCandidates={regenerateCandidates} patchState={patchState} /> : null}
          {panelTab === "sizes" ? <SizesPanel state={normalized} updateSizeRule={updateSizeRule} addSizeRule={addSizeRule} deleteSizeRule={deleteSizeRule} patchState={patchState} matchedRule={matchedRule} slotWidth={slotWidth} /> : null}
          {panelTab === "picture" ? <PicturePanel state={normalized} addPictureSource={addPictureSource} updatePictureSource={updatePictureSource} deletePictureSource={deletePictureSource} /> : null}
          {panelTab === "attributes" ? <AttributesPanel state={normalized} updateAttributes={updateAttributes} /> : null}
          {panelTab === "export" ? <ExportPanel state={normalized} patchState={patchState} /> : null}
        </aside>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs<CodeTab> items={CODE_TABS} value={codeTab} onChange={setCodeTab} ariaLabel="Responsive image code output" />
            <div className="flex flex-wrap gap-2">
              <CopyButton text={currentCode} size="sm" variant="secondary">Copy tab</CopyButton>
              <CopyButton text={generateAllResponsiveImageCode(normalized)} size="sm" variant="secondary">Copy all</CopyButton>
              <Button size="sm" variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={() => download(codeTab === "css" ? "responsive-image.css" : "responsive-image.html", currentCode)}>Download</Button>
            </div>
          </div>
          <pre className="max-h-[520px] overflow-auto rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100"><code>{currentCode}</code></pre>
        </section>

        <section className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--color-text-soft)]">Analyzer notes</h3>
          {messages.map((message, index) => (
            <div key={`${message.message}-${index}`} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3">
              <Badge variant={message.type === "error" ? "danger" : message.type === "warning" ? "warning" : "soft"}>{message.type}</Badge>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{message.message}</p>
            </div>
          ))}
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SupportCard title="Best for" text="Hero images, card grids, article covers, product galleries, avatars, and Next.js responsive images." />
        <SupportCard title="Mental model" text="Viewport width creates a layout slot. DPR multiplies that slot. The browser chooses the closest srcset candidate." />
        <SupportCard title="Exports" text="Copy HTML img, picture sources, Next.js Image snippets, CSS helpers, or all generated code at once." />
      </div>
    </div>
  );
}

function PreviewPanel({ state, slotWidth, selectedCandidate, matchedRule, patchState }: { state: ResponsiveImageState; slotWidth: number; selectedCandidate: ImageCandidate | null; matchedRule: SizesRule | null; patchState: (patch: Partial<ResponsiveImageState>) => void }) {
  const ideal = Math.round(slotWidth * state.previewDpr);
  const maxFrame = Math.min(state.previewViewportWidth, 760);
  const visualSlot = Math.max(120, Math.min(slotWidth, maxFrame));
  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-bg-soft)] p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-[var(--color-text)]">Live slot analyzer</h3>
          <p className="text-sm text-[var(--color-text-soft)]">Preview the layout slot, DPR target, and estimated selected candidate.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft">Viewport {state.previewViewportWidth}px</Badge>
          <Badge variant="success">Slot {slotWidth}px</Badge>
          <Badge variant="outline">DPR {state.previewDpr}x</Badge>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4">
        <div className="flex flex-wrap gap-2">
          {QUICK_WIDTHS.map((width) => (
            <Button key={width} size="sm" variant={state.previewViewportWidth === width ? "primary" : "secondary"} onClick={() => patchState({ previewViewportWidth: width })}>{width}px</Button>
          ))}
        </div>
        <Field label="Viewport width" description="The sizes attribute is evaluated against viewport width.">
          <Input type="range" min={320} max={1920} value={state.previewViewportWidth} onChange={(event) => patchState({ previewViewportWidth: Number(event.target.value) })} />
        </Field>
        <Field label="Device pixel ratio">
          <Select value={String(state.previewDpr)} onChange={(event) => patchState({ previewDpr: Number(event.target.value) as ResponsiveImageState["previewDpr"] })}>
            {DPR_VALUES.map((value) => <option key={value} value={value}>{value}x</option>)}
          </Select>
        </Field>

        <div className="overflow-x-auto rounded-3xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)] p-4">
          <div className="mb-3 flex items-center justify-between text-xs font-bold text-[var(--color-text-soft)]" style={{ width: maxFrame }}>
            <span>Viewport frame</span>
            <span>{state.previewViewportWidth}px</span>
          </div>
          <div className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4" style={{ width: maxFrame, minWidth: 260 }}>
            {state.showSlotRuler ? <div className="absolute left-4 right-4 top-2 h-px bg-[var(--color-border-strong)]" /> : null}
            <div className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-sky-200 via-indigo-200 to-fuchsia-200 p-4 shadow-sm" style={{ width: visualSlot, maxWidth: "100%" }}>
              <div className="aspect-[3/2] rounded-xl bg-white/40 p-4 backdrop-blur-sm">
                <div className="h-full rounded-lg border border-white/60 bg-white/50" />
              </div>
              <div className="mt-4 space-y-2 rounded-xl bg-white/70 p-3 text-slate-800">
                <div className="h-3 w-2/3 rounded-full bg-slate-800/70" />
                <div className="h-2 w-full rounded-full bg-slate-500/50" />
                <div className="h-2 w-5/6 rounded-full bg-slate-500/40" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Matched rule" value={matchedRule ? matchedRule.mediaCondition : "default"} />
          <Metric label="Slot width" value={`${slotWidth}px`} />
          <Metric label="Ideal resource" value={`${ideal}w`} />
          <Metric label="Selected candidate" value={selectedCandidate ? `${selectedCandidate.width}w` : "none"} />
        </div>
      </div>
    </section>
  );
}

function SourcePanel({ state, updateCandidate, addCandidate, deleteCandidate, regenerateCandidates, patchState }: { state: ResponsiveImageState; updateCandidate: (id: string, patch: Partial<ImageCandidate>) => void; addCandidate: () => void; deleteCandidate: (id: string) => void; regenerateCandidates: () => void; patchState: (patch: Partial<ResponsiveImageState>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="URL pattern" description="Use {width} to generate image candidates automatically.">
        <Input value={state.urlPattern} maxLength={300} onChange={(event) => patchState({ urlPattern: event.target.value })} />
      </Field>
      <Field label="Fallback src">
        <Input value={state.attributes.src} maxLength={300} onChange={(event) => patchState({ fallbackSrc: event.target.value, attributes: { ...state.attributes, src: event.target.value } })} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={regenerateCandidates}>Generate from pattern</Button>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={addCandidate}>Add candidate</Button>
      </div>
      <div className="space-y-3">
        {state.candidates.map((candidate) => (
          <div key={candidate.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3">
            <div className="grid gap-2 sm:grid-cols-[90px_1fr_90px_auto]">
              <Input type="number" min={16} max={8000} value={candidate.width} onChange={(event) => updateCandidate(candidate.id, { width: Number(event.target.value) })} aria-label="Candidate width" />
              <Input value={candidate.url} onChange={(event) => updateCandidate(candidate.id, { url: event.target.value })} aria-label="Candidate URL" />
              <Select value={candidate.format} onChange={(event) => updateCandidate(candidate.id, { format: event.target.value as ImageFormat })} aria-label="Candidate format">
                {FORMATS.map((format) => <option key={format} value={format}>{format}</option>)}
              </Select>
              <Button size="icon" variant="ghost" onClick={() => deleteCandidate(candidate.id)}><Trash2 className="h-4 w-4" />Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SizesPanel({ state, updateSizeRule, addSizeRule, deleteSizeRule, patchState, matchedRule, slotWidth }: { state: ResponsiveImageState; updateSizeRule: (id: string, patch: Partial<SizesRule>) => void; addSizeRule: () => void; deleteSizeRule: (id: string) => void; patchState: (patch: Partial<ResponsiveImageState>) => void; matchedRule: SizesRule | null; slotWidth: number }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3 text-sm leading-6 text-[var(--color-text-muted)]">
        Current sizes: <span className="font-semibold text-[var(--color-text)]">{generateSizes(state.sizes, state.defaultSlotSize)}</span>
        <div className="mt-2">Matched now: <Badge variant="soft">{matchedRule ? matchedRule.mediaCondition : "default"}</Badge> <Badge variant="success">{slotWidth}px slot</Badge></div>
      </div>
      {state.sizes.map((rule) => (
        <div key={rule.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
            <Input value={rule.mediaCondition} onChange={(event) => updateSizeRule(rule.id, { mediaCondition: event.target.value })} aria-label="Media condition" />
            <Input value={rule.slotSize} onChange={(event) => updateSizeRule(rule.id, { slotSize: event.target.value })} aria-label="Slot size" />
            <Button size="icon" variant="ghost" onClick={() => deleteSizeRule(rule.id)}><Trash2 className="h-4 w-4" />Delete</Button>
          </div>
        </div>
      ))}
      <Field label="Default slot size" description="Used when no sizes rule matches.">
        <Input value={state.defaultSlotSize} onChange={(event) => patchState({ defaultSlotSize: event.target.value })} />
      </Field>
      <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={addSizeRule}>Add sizes rule</Button>
    </div>
  );
}

function PicturePanel({ state, addPictureSource, updatePictureSource, deletePictureSource }: { state: ResponsiveImageState; addPictureSource: () => void; updatePictureSource: (id: string, patch: Partial<PictureSource>) => void; deletePictureSource: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[var(--color-text-muted)]">Use picture sources for AVIF/WebP fallback or art direction crops.</p>
      {state.pictureSources.map((source) => (
        <div key={source.id} className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Type">
              <Select value={source.type} onChange={(event) => updatePictureSource(source.id, { type: event.target.value as PictureSource["type"] })}>
                {MIME_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </Select>
            </Field>
            <Field label="Media condition">
              <Input value={source.media} placeholder="(max-width: 680px)" onChange={(event) => updatePictureSource(source.id, { media: event.target.value })} />
            </Field>
          </div>
          <Field label="Source URL pattern">
            <Input value={source.urlPattern} onChange={(event) => updatePictureSource(source.id, { urlPattern: event.target.value })} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => updatePictureSource(source.id, { candidates: generateCandidatesFromPattern(source.urlPattern, source.candidates.map((candidate) => candidate.width), source.type.includes("avif") ? "avif" : source.type.includes("webp") ? "webp" : source.type.includes("png") ? "png" : "jpg") })}>Regenerate source</Button>
            <Button size="sm" variant="ghost" onClick={() => deletePictureSource(source.id)}>Delete source</Button>
          </div>
          <p className="text-xs text-[var(--color-text-soft)]">{source.candidates.map((candidate) => `${candidate.width}w`).join(", ")}</p>
        </div>
      ))}
      <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={addPictureSource}>Add picture source</Button>
    </div>
  );
}

function AttributesPanel({ state, updateAttributes }: { state: ResponsiveImageState; updateAttributes: (patch: Partial<ResponsiveImageAttributes>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Alt text"><Input value={state.attributes.alt} maxLength={200} onChange={(event) => updateAttributes({ alt: event.target.value })} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Width"><Input type="number" min={1} value={state.attributes.width} onChange={(event) => updateAttributes({ width: Number(event.target.value) })} /></Field>
        <Field label="Height"><Input type="number" min={1} value={state.attributes.height} onChange={(event) => updateAttributes({ height: Number(event.target.value) })} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Loading"><Select value={state.attributes.loading} onChange={(event) => updateAttributes({ loading: event.target.value as ResponsiveImageAttributes["loading"] })}><option value="lazy">lazy</option><option value="eager">eager</option></Select></Field>
        <Field label="Decoding"><Select value={state.attributes.decoding} onChange={(event) => updateAttributes({ decoding: event.target.value as ResponsiveImageAttributes["decoding"] })}><option value="async">async</option><option value="auto">auto</option><option value="sync">sync</option></Select></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Fetch priority"><Select value={state.attributes.fetchPriority} onChange={(event) => updateAttributes({ fetchPriority: event.target.value as ResponsiveImageAttributes["fetchPriority"] })}><option value="auto">auto</option><option value="high">high</option><option value="low">low</option></Select></Field>
        <Field label="Object fit"><Select value={state.attributes.objectFit} onChange={(event) => updateAttributes({ objectFit: event.target.value as ResponsiveImageAttributes["objectFit"] })}><option value="cover">cover</option><option value="contain">contain</option><option value="fill">fill</option><option value="none">none</option><option value="scale-down">scale-down</option></Select></Field>
      </div>
      <Field label="Class name"><Input value={state.attributes.className} onChange={(event) => updateAttributes({ className: event.target.value })} /></Field>
    </div>
  );
}

function ExportPanel({ state, patchState }: { state: ResponsiveImageState; patchState: (patch: Partial<ResponsiveImageState>) => void }) {
  const options = state.exportOptions;
  return (
    <div className="space-y-4">
      <Field label="Next.js component name"><Input value={options.componentName} onChange={(event) => patchState({ exportOptions: { ...options, componentName: event.target.value } })} /></Field>
      <Field label="Quote style"><Select value={options.quoteStyle} onChange={(event) => patchState({ exportOptions: { ...options, quoteStyle: event.target.value as ResponsiveImageState["exportOptions"]["quoteStyle"] } })}><option value="double">Double quotes</option><option value="single">Single quotes</option></Select></Field>
      <label className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text)]"><input type="checkbox" checked={options.includeComments} onChange={(event) => patchState({ exportOptions: { ...options, includeComments: event.target.checked } })} /> Include comments</label>
      <label className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text)]"><input type="checkbox" checked={options.includeCssHelper} onChange={(event) => patchState({ exportOptions: { ...options, includeCssHelper: event.target.checked } })} /> Include CSS helper</label>
      <label className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text)]"><input type="checkbox" checked={state.showSlotRuler} onChange={(event) => patchState({ showSlotRuler: event.target.checked })} /> Show slot ruler</label>
      <label className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text)]"><input type="checkbox" checked={state.showCandidateAnalyzer} onChange={(event) => patchState({ showCandidateAnalyzer: event.target.checked })} /> Show candidate analyzer</label>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-soft)]">{label}</p><p className="mt-1 truncate text-sm font-black text-[var(--color-text)]">{value}</p></div>;
}

function SupportCard({ title, text }: { title: string; text: string }) {
  return <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"><h3 className="text-base font-black text-[var(--color-text)]">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{text}</p></div>;
}
