"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Download, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import {
  createBreakpoint,
  createDefaultContainerQueryState,
  createStyleRule,
  formatContainerCondition,
  generateContainerQueryCss,
  generateContainerQueryExplanation,
  generateContainerQueryHtml,
  generateContainerQueryJsx,
  getActiveBreakpoints,
  normalizeContainerQueryState,
  validateContainerQueryState,
} from "./containerQuery";
import { CONTAINER_QUERY_PRESETS } from "./presets";
import type { ContainerBreakpoint, ContainerConditionType, ContainerQueryState, ContainerStyleRule, ContainerType, ContainerUnit } from "./types";

type PanelTab = "container" | "breakpoints" | "styles" | "preview" | "export";
type CodeTab = "css" | "html" | "jsx" | "explanation";

const PANEL_TABS: readonly TabItem<PanelTab>[] = [
  { value: "container", label: "Container" },
  { value: "breakpoints", label: "Breakpoints" },
  { value: "styles", label: "Styles" },
  { value: "preview", label: "Preview" },
  { value: "export", label: "Export" },
];

const CODE_TABS: readonly TabItem<CodeTab>[] = [
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "jsx", label: "React JSX" },
  { value: "explanation", label: "Explanation" },
];

const containerTypes: ContainerType[] = ["inline-size", "size", "normal"];
const conditionTypes: ContainerConditionType[] = ["min-width", "max-width", "range"];
const units: ContainerUnit[] = ["px", "rem", "em"];
const selectors = [".card", ".card__media", ".card__content", ".card__eyebrow", ".card__title", ".card__description", ".card__actions"];
const properties = ["display", "grid-template-columns", "flex-direction", "gap", "padding", "margin", "border-radius", "font-size", "line-height", "aspect-ratio", "width", "align-items"];

export default function ContainerQueryGeneratorClient() {
  const [state, setState] = useState<ContainerQueryState>(() => createDefaultContainerQueryState());
  const [panelTab, setPanelTab] = useState<PanelTab>("container");
  const [codeTab, setCodeTab] = useState<CodeTab>("css");
  const [activePreset, setActivePreset] = useState("responsive-card");
  const [toast, setToast] = useState("");

  const normalized = useMemo(() => normalizeContainerQueryState(state), [state]);
  const activeBreakpoints = useMemo(() => getActiveBreakpoints(normalized, normalized.previewWidth), [normalized]);
  const selectedBreakpoint = normalized.breakpoints.find((breakpoint) => breakpoint.id === normalized.selectedBreakpointId) ?? normalized.breakpoints[0] ?? null;
  const css = useMemo(() => generateContainerQueryCss(normalized), [normalized]);
  const html = useMemo(() => generateContainerQueryHtml(normalized), [normalized]);
  const jsx = useMemo(() => generateContainerQueryJsx(normalized), [normalized]);
  const explanation = useMemo(() => generateContainerQueryExplanation(normalized), [normalized]);
  const messages = useMemo(() => validateContainerQueryState(normalized), [normalized]);
  const currentCode = { css, html, jsx, explanation }[codeTab];

  function patchState(patch: Partial<ContainerQueryState>) {
    setState((current) => normalizeContainerQueryState({ ...current, ...patch }));
  }

  function loadPreset(presetId: string) {
    const preset = CONTAINER_QUERY_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setState(normalizeContainerQueryState(preset.state));
    setActivePreset(preset.id);
    setToast(`${preset.name} loaded`);
    window.setTimeout(() => setToast(""), 1400);
  }

  function addBreakpoint() {
    if (normalized.breakpoints.length >= 8) return;
    const breakpoint = createBreakpoint({ name: `Breakpoint ${normalized.breakpoints.length + 1}`, minWidth: 560 });
    patchState({ breakpoints: [...normalized.breakpoints, breakpoint], selectedBreakpointId: breakpoint.id });
    setPanelTab("breakpoints");
  }

  function updateBreakpoint(id: string, patch: Partial<ContainerBreakpoint>) {
    patchState({ breakpoints: normalized.breakpoints.map((breakpoint) => (breakpoint.id === id ? { ...breakpoint, ...patch } : breakpoint)) });
  }

  function duplicateBreakpoint() {
    if (!selectedBreakpoint || normalized.breakpoints.length >= 8) return;
    const breakpoint = createBreakpoint({ ...selectedBreakpoint, id: undefined, name: `${selectedBreakpoint.name} copy`, styles: selectedBreakpoint.styles.map((rule) => createStyleRule({ ...rule, id: undefined })) });
    patchState({ breakpoints: [...normalized.breakpoints, breakpoint], selectedBreakpointId: breakpoint.id });
  }

  function deleteBreakpoint() {
    if (!selectedBreakpoint || normalized.breakpoints.length <= 1) return;
    const breakpoints = normalized.breakpoints.filter((breakpoint) => breakpoint.id !== selectedBreakpoint.id);
    patchState({ breakpoints, selectedBreakpointId: breakpoints[0]?.id ?? null });
  }

  function addRule() {
    if (!selectedBreakpoint || selectedBreakpoint.styles.length >= 20) return;
    const rule = createStyleRule({ selector: `.${normalized.componentClassName}`, property: "gap", value: "1rem" });
    updateBreakpoint(selectedBreakpoint.id, { styles: [...selectedBreakpoint.styles, rule] });
    setPanelTab("styles");
  }

  function updateRule(ruleId: string, patch: Partial<ContainerStyleRule>) {
    if (!selectedBreakpoint) return;
    updateBreakpoint(selectedBreakpoint.id, {
      styles: selectedBreakpoint.styles.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
    });
  }

  function deleteRule(ruleId: string) {
    if (!selectedBreakpoint || selectedBreakpoint.styles.length <= 1) return;
    updateBreakpoint(selectedBreakpoint.id, { styles: selectedBreakpoint.styles.filter((rule) => rule.id !== ruleId) });
  }

  function downloadFile(filename: string, content: string, type = "text/plain") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setState(createDefaultContainerQueryState());
    setActivePreset("responsive-card");
  }

  const wrapperClass = (normalized.containerSelector || ".card-wrapper").replace(/^\./, "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">Responsive Component Studio</p>
          <p className="text-xs text-[var(--color-text-muted)]">Resize the container, not the viewport, and watch active @container rules change.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={addBreakpoint} disabled={normalized.breakpoints.length >= 8}><Plus className="h-4 w-4" /> Add breakpoint</Button>
          <CopyButton text={css}>Copy CSS</CopyButton>
          <Button type="button" variant="ghost" onClick={reset}><RefreshCw className="h-4 w-4" /> Reset</Button>
        </div>
      </div>

      {toast ? <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-900">{toast}</div> : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="space-y-4">
          <PresetGallery activePreset={activePreset} onLoad={loadPreset} />
          <PreviewPanel state={normalized} activeBreakpoints={activeBreakpoints} wrapperClass={wrapperClass} />
        </div>

        <aside className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <Tabs<PanelTab> items={PANEL_TABS} value={panelTab} onChange={setPanelTab} ariaLabel="Container query controls" />
          {panelTab === "container" ? <ContainerPanel state={normalized} patchState={patchState} /> : null}
          {panelTab === "breakpoints" ? (
            <BreakpointPanel
              state={normalized}
              selectedBreakpoint={selectedBreakpoint}
              patchState={patchState}
              updateBreakpoint={updateBreakpoint}
              addBreakpoint={addBreakpoint}
              duplicateBreakpoint={duplicateBreakpoint}
              deleteBreakpoint={deleteBreakpoint}
            />
          ) : null}
          {panelTab === "styles" ? <StylesPanel selectedBreakpoint={selectedBreakpoint} addRule={addRule} updateRule={updateRule} deleteRule={deleteRule} /> : null}
          {panelTab === "preview" ? <PreviewControls state={normalized} patchState={patchState} /> : null}
          {panelTab === "export" ? <ExportPanel state={normalized} patchState={patchState} /> : null}
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Best for" items={["Reusable cards", "Dashboard widgets", "Sidebar modules", "Product cards"]} />
        <InfoCard title="Key concept" items={["Parent/container size", "Named containers", "Active query badges", "Component-first CSS"]} />
        <InfoCard title="Export formats" items={["CSS", "HTML", "React JSX", "Plain explanation"]} />
      </section>

      {messages.length ? (
        <section className="grid gap-2">
          {messages.map((message, index) => (
            <div key={`${message.message}-${index}`} className="flex items-start gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-muted)]">
              <Badge variant={message.type === "error" ? "danger" : message.type === "warning" ? "warning" : "soft"}>{message.type}</Badge>
              <span>{message.message}</span>
            </div>
          ))}
        </section>
      ) : null}

      <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Tabs<CodeTab> items={CODE_TABS} value={codeTab} onChange={setCodeTab} ariaLabel="Generated code output" />
          <div className="flex flex-wrap gap-2">
            <CopyButton text={currentCode} variant="secondary">Copy tab</CopyButton>
            <Button type="button" variant="secondary" onClick={() => downloadFile(`container-query.${codeTab === "css" ? "css" : codeTab === "html" ? "html" : "txt"}`, currentCode)}><Download className="h-4 w-4" /> Download</Button>
          </div>
        </div>
        <pre className="max-h-[520px] overflow-auto rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100"><code>{currentCode}</code></pre>
      </section>
    </div>
  );
}

function PresetGallery({ activePreset, onLoad }: { activePreset: string; onLoad: (presetId: string) => void }) {
  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-[var(--color-accent)]" /><h3 className="text-sm font-bold text-[var(--color-text)]">Component presets</h3></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {CONTAINER_QUERY_PRESETS.map((preset) => (
          <button key={preset.id} type="button" onClick={() => onLoad(preset.id)} className={cn("rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md", activePreset === preset.id ? "border-[var(--color-accent)] bg-[var(--color-bg-soft)]" : "border-[var(--color-border)] bg-[var(--color-surface-strong)]")}>
            <div className="mb-3 grid h-12 grid-cols-[1fr_2fr] gap-1 rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 p-1">
              <span className="rounded-lg bg-white/70" /><span className="rounded-lg bg-white/90" />
            </div>
            <p className="text-sm font-bold text-[var(--color-text)]">{preset.name}</p>
            <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">{preset.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function PreviewPanel({ state, activeBreakpoints, wrapperClass }: { state: ContainerQueryState; activeBreakpoints: ContainerBreakpoint[]; wrapperClass: string }) {
  const componentStyles = buildPreviewStyles(state, activeBreakpoints);
  const markerPosition = (value: number) => `${Math.min(100, Math.max(0, ((value - 240) / (1200 - 240)) * 100))}%`;

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-slate-50 to-blue-50 p-4 shadow-sm dark:from-slate-950 dark:to-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--color-text)]">Live container preview</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Changing container width, not viewport width.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeBreakpoints.length ? activeBreakpoints.map((breakpoint) => <Badge key={breakpoint.id} variant="success">Active: {breakpoint.name}</Badge>) : <Badge variant="soft">No active custom rule</Badge>}
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)]"><span>240px</span><span>{state.previewWidth}px container</span><span>1200px</span></div>
        <div className="relative h-3 rounded-full bg-white/70 shadow-inner dark:bg-slate-800">
          {state.showBreakpointMarkers ? state.breakpoints.map((breakpoint) => {
            const width = breakpoint.conditionType === "max-width" ? breakpoint.maxWidth ?? 0 : breakpoint.minWidth ?? 0;
            return <span key={breakpoint.id} className="absolute top-0 h-3 w-0.5 rounded bg-blue-500" style={{ left: markerPosition(width) }} title={`${breakpoint.name} ${formatContainerCondition(breakpoint)}`} />;
          }) : null}
          <span className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--color-accent)] shadow" style={{ left: markerPosition(state.previewWidth) }} />
        </div>
      </div>

      <div className="overflow-auto rounded-3xl border border-dashed border-blue-200 bg-white/70 p-5 dark:border-slate-700 dark:bg-slate-950/70">
        <div className={cn(wrapperClass, state.showContainerOutline && "outline outline-2 outline-dashed outline-blue-400/70")} style={{ width: state.previewWidth, maxWidth: "100%", margin: "0 auto", padding: "12px" }}>
          <article className={state.componentClassName} style={componentStyles.card}>
            <div className={`${state.componentClassName}__media`} style={componentStyles.media} />
            <div className={`${state.componentClassName}__content`} style={componentStyles.content}>
              <p className={`${state.componentClassName}__eyebrow`} style={componentStyles.eyebrow}>Design system</p>
              <h3 className={`${state.componentClassName}__title`} style={componentStyles.title}>Container-aware card</h3>
              <p className={`${state.componentClassName}__description`} style={componentStyles.description}>This card adapts to the space provided by its parent container.</p>
              <div className={`${state.componentClassName}__actions`} style={componentStyles.actions}><a href="#" onClick={(event: any) => event.preventDefault()}>View details</a></div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function buildPreviewStyles(state: ContainerQueryState, activeBreakpoints: ContainerBreakpoint[]) {
  const styles: Record<string, CSSProperties> = {
    card: { display: "grid", gap: "1rem", overflow: "hidden", borderRadius: "1.25rem", border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 20px 50px rgb(15 23 42 / 0.08)" },
    media: { minHeight: 160, background: "linear-gradient(135deg, #dbeafe, #c4b5fd)", aspectRatio: "16 / 9" },
    content: { display: "grid", gap: "0.75rem", padding: "1.25rem" },
    eyebrow: { margin: 0, fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4f46e5" },
    title: { margin: 0, fontSize: "1.35rem", lineHeight: 1.15, color: "#0f172a" },
    description: { margin: 0, color: "#475569" },
    actions: { fontWeight: 800 },
  };
  const aliases: Record<string, string> = {
    [`.${state.componentClassName}`]: "card",
    ".card": "card",
    [`.${state.componentClassName}__media`]: "media",
    ".card__media": "media",
    [`.${state.componentClassName}__content`]: "content",
    ".card__content": "content",
    [`.${state.componentClassName}__eyebrow`]: "eyebrow",
    ".card__eyebrow": "eyebrow",
    [`.${state.componentClassName}__title`]: "title",
    ".card__title": "title",
    [`.${state.componentClassName}__description`]: "description",
    ".card__description": "description",
    [`.${state.componentClassName}__actions`]: "actions",
    ".card__actions": "actions",
  };
  activeBreakpoints.forEach((breakpoint) => {
    breakpoint.styles.forEach((rule) => {
      const key = aliases[rule.selector];
      if (key) styles[key] = { ...styles[key], [rule.property]: rule.value } as CSSProperties;
    });
  });
  return styles as { card: CSSProperties; media: CSSProperties; content: CSSProperties; eyebrow: CSSProperties; title: CSSProperties; description: CSSProperties; actions: CSSProperties };
}

function ContainerPanel({ state, patchState }: { state: ContainerQueryState; patchState: (patch: Partial<ContainerQueryState>) => void }) {
  return <div className="space-y-4">
    <Field label="Container selector"><Input value={state.containerSelector} onChange={(event: any) => patchState({ containerSelector: event.target.value })} /></Field>
    <Field label="Container name"><Input value={state.containerName} maxLength={40} onChange={(event: any) => patchState({ containerName: event.target.value })} /></Field>
    <Field label="Container type"><Select value={state.containerType} onChange={(event: any) => patchState({ containerType: event.target.value as ContainerType })}>{containerTypes.map((item) => <option key={item} value={item}>{item}</option>)}</Select></Field>
    <Field label="Component class"><Input value={state.componentClassName} maxLength={40} onChange={(event: any) => patchState({ componentClassName: event.target.value })} /></Field>
  </div>;
}

function BreakpointPanel({ state, selectedBreakpoint, patchState, updateBreakpoint, addBreakpoint, duplicateBreakpoint, deleteBreakpoint }: { state: ContainerQueryState; selectedBreakpoint: ContainerBreakpoint | null; patchState: (patch: Partial<ContainerQueryState>) => void; updateBreakpoint: (id: string, patch: Partial<ContainerBreakpoint>) => void; addBreakpoint: () => void; duplicateBreakpoint: () => void; deleteBreakpoint: () => void }) {
  return <div className="space-y-4">
    <div className="grid gap-2">
      {state.breakpoints.map((breakpoint) => <button key={breakpoint.id} type="button" onClick={() => patchState({ selectedBreakpointId: breakpoint.id })} className={cn("rounded-2xl border p-3 text-left text-sm", breakpoint.id === state.selectedBreakpointId ? "border-[var(--color-accent)] bg-[var(--color-bg-soft)]" : "border-[var(--color-border)] bg-[var(--color-surface-strong)]")}><strong>{breakpoint.name}</strong><span className="mt-1 block text-xs text-[var(--color-text-muted)]">{formatContainerCondition(breakpoint)}</span></button>)}
    </div>
    {selectedBreakpoint ? <div className="space-y-3 rounded-2xl border border-[var(--color-border)] p-3">
      <Field label="Name"><Input value={selectedBreakpoint.name} onChange={(event: any) => updateBreakpoint(selectedBreakpoint.id, { name: event.target.value })} /></Field>
      <Field label="Condition"><Select value={selectedBreakpoint.conditionType} onChange={(event: any) => updateBreakpoint(selectedBreakpoint.id, { conditionType: event.target.value as ContainerConditionType })}>{conditionTypes.map((item) => <option key={item} value={item}>{item}</option>)}</Select></Field>
      {selectedBreakpoint.conditionType !== "max-width" ? <Field label="Min width"><Input type="number" value={selectedBreakpoint.minWidth ?? 0} onChange={(event: any) => updateBreakpoint(selectedBreakpoint.id, { minWidth: Number(event.target.value) })} /></Field> : null}
      {selectedBreakpoint.conditionType !== "min-width" ? <Field label="Max width"><Input type="number" value={selectedBreakpoint.maxWidth ?? 0} onChange={(event: any) => updateBreakpoint(selectedBreakpoint.id, { maxWidth: Number(event.target.value) })} /></Field> : null}
      <Field label="Unit"><Select value={selectedBreakpoint.unit} onChange={(event: any) => updateBreakpoint(selectedBreakpoint.id, { unit: event.target.value as ContainerUnit })}>{units.map((item) => <option key={item} value={item}>{item}</option>)}</Select></Field>
    </div> : null}
    <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={addBreakpoint} disabled={state.breakpoints.length >= 8}><Plus className="h-4 w-4" /> Add</Button><Button type="button" variant="secondary" onClick={duplicateBreakpoint} disabled={!selectedBreakpoint || state.breakpoints.length >= 8}>Duplicate</Button><Button type="button" variant="ghost" onClick={deleteBreakpoint} disabled={!selectedBreakpoint || state.breakpoints.length <= 1}><Trash2 className="h-4 w-4" /> Delete</Button></div>
  </div>;
}

function StylesPanel({ selectedBreakpoint, addRule, updateRule, deleteRule }: { selectedBreakpoint: ContainerBreakpoint | null; addRule: () => void; updateRule: (ruleId: string, patch: Partial<ContainerStyleRule>) => void; deleteRule: (ruleId: string) => void }) {
  if (!selectedBreakpoint) return <p className="text-sm text-[var(--color-text-muted)]">Select a breakpoint first.</p>;
  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-2"><p className="text-sm font-bold text-[var(--color-text)]">Rules for {selectedBreakpoint.name}</p><Button type="button" variant="secondary" onClick={addRule} disabled={selectedBreakpoint.styles.length >= 20}><Plus className="h-4 w-4" /> Add rule</Button></div>
    {selectedBreakpoint.styles.map((rule) => <div key={rule.id} className="space-y-2 rounded-2xl border border-[var(--color-border)] p-3">
      <Field label="Selector"><Input list="cq-selectors" value={rule.selector} onChange={(event: any) => updateRule(rule.id, { selector: event.target.value })} /></Field>
      <Field label="Property"><Input list="cq-properties" value={rule.property} onChange={(event: any) => updateRule(rule.id, { property: event.target.value })} /></Field>
      <Field label="Value"><Input value={rule.value} onChange={(event: any) => updateRule(rule.id, { value: event.target.value })} /></Field>
      <Button type="button" variant="ghost" onClick={() => deleteRule(rule.id)} disabled={selectedBreakpoint.styles.length <= 1}><Trash2 className="h-4 w-4" /> Delete rule</Button>
    </div>)}
    <datalist id="cq-selectors">{selectors.map((item) => <option key={item} value={item} />)}</datalist>
    <datalist id="cq-properties">{properties.map((item) => <option key={item} value={item} />)}</datalist>
  </div>;
}

function PreviewControls({ state, patchState }: { state: ContainerQueryState; patchState: (patch: Partial<ContainerQueryState>) => void }) {
  const buttons = [{ label: "Narrow", value: 280 }, { label: "Card", value: 420 }, { label: "Sidebar", value: 520 }, { label: "Content", value: 760 }, { label: "Wide", value: 1040 }];
  return <div className="space-y-4">
    <Field label={`Container width: ${state.previewWidth}px`}><Input type="range" min={240} max={1200} value={state.previewWidth} onChange={(event: any) => patchState({ previewWidth: Number(event.target.value) })} /></Field>
    <div className="flex flex-wrap gap-2">{buttons.map((button) => <Button key={button.label} type="button" variant="secondary" onClick={() => patchState({ previewWidth: button.value })}>{button.label}</Button>)}</div>
    <Toggle label="Show container outline" checked={state.showContainerOutline} onChange={(checked) => patchState({ showContainerOutline: checked })} />
    <Toggle label="Show breakpoint markers" checked={state.showBreakpointMarkers} onChange={(checked) => patchState({ showBreakpointMarkers: checked })} />
    <Toggle label="Show active rules" checked={state.showActiveRules} onChange={(checked) => patchState({ showActiveRules: checked })} />
  </div>;
}

function ExportPanel({ state, patchState }: { state: ContainerQueryState; patchState: (patch: Partial<ContainerQueryState>) => void }) {
  const options = state.exportOptions;
  const patchOptions = (patch: Partial<typeof options>) => patchState({ exportOptions: { ...options, ...patch } });
  return <div className="space-y-4">
    <Field label="Class prefix"><Input value={options.classPrefix} onChange={(event: any) => patchOptions({ classPrefix: event.target.value })} /></Field>
    <Toggle label="Include comments" checked={options.includeComments} onChange={(checked) => patchOptions({ includeComments: checked })} />
    <Toggle label="Include demo styles" checked={options.includeDemoStyles} onChange={(checked) => patchOptions({ includeDemoStyles: checked })} />
    <Toggle label="Include media query comparison" checked={options.includeMediaQueryComparison} onChange={(checked) => patchOptions({ includeMediaQueryComparison: checked })} />
  </div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3 text-sm font-semibold text-[var(--color-text)]"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event: any) => onChange(event.target.checked)} /></label>;
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"><h3 className="mb-2 text-sm font-bold text-[var(--color-text)]">{title}</h3><ul className="space-y-1 text-sm text-[var(--color-text-muted)]">{items.map((item) => <li key={item}>• {item}</li>)}</ul></div>;
}
