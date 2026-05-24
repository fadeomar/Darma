"use client";

import { useMemo, useState } from "react";
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
  applyQuickAction,
  createDefaultFlexState,
  createFlexItem,
  generateFlexCss,
  generateFlexHtml,
  generateFlexJsx,
  generateInlinePreviewStyles,
  generateTailwindStarter,
  normalizeFlexState,
  validateFlexState,
} from "./flexbox";
import { FLEX_PRESETS } from "./presets";
import type {
  AlignContent,
  AlignItems,
  FlexAlignSelf,
  FlexDirection,
  FlexDisplay,
  FlexGeneratorState,
  FlexItem,
  FlexQuickAction,
  FlexWrap,
  JustifyContent,
} from "./types";

type PanelTab = "container" | "alignment" | "items" | "responsive" | "export";
type CodeTab = "css" | "html" | "jsx" | "tailwind";

const PANEL_TABS: readonly TabItem<PanelTab>[] = [
  { value: "container", label: "Container" },
  { value: "alignment", label: "Alignment" },
  { value: "items", label: "Items" },
  { value: "responsive", label: "Responsive" },
  { value: "export", label: "Export" },
];

const CODE_TABS: readonly TabItem<CodeTab>[] = [
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "jsx", label: "React JSX" },
  { value: "tailwind", label: "Tailwind-style" },
];

const displays: FlexDisplay[] = ["flex", "inline-flex"];
const directions: FlexDirection[] = ["row", "row-reverse", "column", "column-reverse"];
const wraps: FlexWrap[] = ["nowrap", "wrap", "wrap-reverse"];
const justifyValues: JustifyContent[] = ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"];
const alignItemValues: AlignItems[] = ["stretch", "flex-start", "center", "flex-end", "baseline"];
const alignContentValues: AlignContent[] = ["stretch", "flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"];
const alignSelfValues: FlexAlignSelf[] = ["auto", "stretch", "flex-start", "center", "flex-end", "baseline"];

const quickActions: Array<{ id: FlexQuickAction; label: string }> = [
  { id: "center-everything", label: "Center everything" },
  { id: "space-between", label: "Space between" },
  { id: "equal-items", label: "Equal items" },
  { id: "wrap-cards", label: "Wrap cards" },
  { id: "vertical-stack", label: "Stack vertically" },
  { id: "push-last-end", label: "Push selected/end" },
  { id: "selected-fill-remaining", label: "Selected fills space" },
  { id: "reset-item-sizing", label: "Reset sizing" },
];

export default function FlexboxGeneratorClient() {
  const [state, setState] = useState<FlexGeneratorState>(() => createDefaultFlexState());
  const [panelTab, setPanelTab] = useState<PanelTab>("container");
  const [codeTab, setCodeTab] = useState<CodeTab>("css");
  const [activePreset, setActivePreset] = useState("navbar");
  const [toast, setToast] = useState("");

  const normalized = useMemo(() => normalizeFlexState(state), [state]);
  const selectedItem = normalized.items.find((item) => item.id === normalized.selectedItemId) ?? normalized.items[0] ?? null;
  const previewStyles = useMemo(() => generateInlinePreviewStyles(normalized), [normalized]);
  const css = useMemo(() => generateFlexCss(normalized), [normalized]);
  const html = useMemo(() => generateFlexHtml(normalized), [normalized]);
  const jsx = useMemo(() => generateFlexJsx(normalized), [normalized]);
  const tailwind = useMemo(() => generateTailwindStarter(normalized), [normalized]);
  const messages = useMemo(() => validateFlexState(normalized), [normalized]);
  const currentCode = { css, html, jsx, tailwind }[codeTab];

  function patchState(patch: Partial<FlexGeneratorState>) {
    setState((current) => normalizeFlexState({ ...current, ...patch }));
  }

  function updateSelectedItem(patch: Partial<FlexItem>) {
    if (!selectedItem) return;
    setState((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === selectedItem.id ? { ...item, ...patch } : item)),
    }));
  }

  function loadPreset(presetId: string) {
    const preset = FLEX_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setState(normalizeFlexState(preset.state));
    setActivePreset(preset.id);
  }

  function addItem() {
    if (normalized.items.length >= 20) return;
    const item = createFlexItem({
      name: `Item ${normalized.items.length + 1}`,
      content: `Item ${normalized.items.length + 1}`,
      flexBasis: "160px",
      background: ["#2563eb", "#7c3aed", "#0f766e", "#ea580c", "#be123c"][normalized.items.length % 5],
    });
    patchState({ items: [...normalized.items, item], selectedItemId: item.id });
    setPanelTab("items");
  }

  function duplicateSelectedItem() {
    if (!selectedItem || normalized.items.length >= 20) return;
    const item = createFlexItem({
      ...selectedItem,
      id: undefined,
      name: `${selectedItem.name} copy`,
      content: `${selectedItem.content} copy`,
      marginLeftAuto: false,
      marginRightAuto: false,
    });
    patchState({ items: [...normalized.items, item], selectedItemId: item.id });
  }

  function deleteSelectedItem() {
    if (!selectedItem || normalized.items.length <= 1) return;
    const items = normalized.items.filter((item) => item.id !== selectedItem.id);
    patchState({ items, selectedItemId: items[0]?.id ?? null });
  }

  function runQuickAction(action: FlexQuickAction, label: string) {
    setState((current) => applyQuickAction(current, action));
    setToast(`${label} applied`);
    window.setTimeout(() => setToast(""), 1600);
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

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-end">
        <Field label="Preset" className="min-w-0">
          <Select value={activePreset} onChange={(event) => loadPreset(event.target.value)} aria-label="Choose a Flexbox preset">
            {FLEX_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Direction">
          <Select value={normalized.direction} onChange={(event) => patchState({ direction: event.target.value as FlexDirection })}>
            {directions.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </Field>
        <Field label="Wrap">
          <Select value={normalized.wrap} onChange={(event) => patchState({ wrap: event.target.value as FlexWrap })}>
            {wraps.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={addItem} leftIcon={<Plus className="h-4 w-4" />}>Add item</Button>
          <Button variant="ghost" onClick={() => { setState(createDefaultFlexState()); setActivePreset("navbar"); }} leftIcon={<RefreshCw className="h-4 w-4" />}>Reset</Button>
          <CopyButton text={css}>Copy CSS</CopyButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FLEX_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => loadPreset(preset.id)}
            className={cn(
              "rounded-3xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
              activePreset === preset.id ? "border-[var(--color-accent)] bg-[var(--color-bg-soft)]" : "border-[var(--color-border)] bg-[var(--color-surface)]",
            )}
          >
            <MiniPreset state={preset.state} />
            <span className="mt-3 block text-sm font-bold text-[var(--color-text)]">{preset.name}</span>
            <span className="mt-1 block text-xs leading-5 text-[var(--color-text-muted)]">{preset.description}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[var(--color-text)]">Live Flex Preview</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Actual CSS flexbox with axis hints, item sizing, and responsive width.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[360, 768, 1024, 1280].map((width) => (
                <Button key={width} size="sm" variant={normalized.previewWidth === width ? "primary" : "secondary"} onClick={() => patchState({ previewWidth: width })}>
                  {width === 360 ? "Mobile" : width === 768 ? "Tablet" : width === 1024 ? "Desktop" : "Wide"}
                </Button>
              ))}
            </div>
          </div>

          <Field label={`Preview width: ${normalized.previewWidth}px`}>
            <Input type="range" min={320} max={1440} value={normalized.previewWidth} onChange={(event) => patchState({ previewWidth: Number(event.target.value) })} />
          </Field>

          <div className="mt-4 overflow-auto rounded-3xl border border-dashed border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(79,70,229,0.08),rgba(15,118,110,0.08))] p-4">
            <div className="relative mx-auto transition-all" style={{ width: `${normalized.previewWidth}px`, maxWidth: "100%" }}>
              {normalized.showAxisOverlay ? <AxisOverlay direction={normalized.direction} /> : null}
              {normalized.showGapMarkers ? <GapMarkers gap={`${normalized.gap.row}${normalized.gap.unit} / ${normalized.gap.column}${normalized.gap.unit}`} /> : null}
              <div className="relative border border-[var(--color-border)] shadow-sm" style={previewStyles.container}>
                {normalized.showWrapLines && normalized.wrap !== "nowrap" ? <WrapLineHint /> : null}
                {normalized.items.map((item, index) => {
                  const isSelected = item.id === selectedItem?.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { patchState({ selectedItemId: item.id }); setPanelTab("items"); }}
                      className={cn(
                        "relative min-h-16 text-left font-semibold shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
                        isSelected && "ring-4 ring-[var(--color-accent)]/35",
                      )}
                      style={previewStyles.items[item.id]}
                    >
                      <span className="block truncate text-sm">{item.content}</span>
                      <span className="mt-1 block text-xs opacity-80">{item.name}</span>
                      {normalized.showItemSizes ? (
                        <span className="mt-2 inline-flex rounded-full bg-black/20 px-2 py-1 text-[10px] font-bold text-white">
                          {item.flexGrow} {item.flexShrink} {item.flexBasis}
                        </span>
                      ) : null}
                      <span className="absolute right-2 top-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white">#{index + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <Tabs<PanelTab> items={PANEL_TABS} value={panelTab} onChange={setPanelTab} ariaLabel="Flexbox controls" />
          {toast ? <Badge variant="success">{toast}</Badge> : null}
          {panelTab === "container" ? <ContainerControls state={normalized} patchState={patchState} /> : null}
          {panelTab === "alignment" ? <AlignmentControls state={normalized} patchState={patchState} /> : null}
          {panelTab === "items" ? (
            <ItemsPanel
              state={normalized}
              selectedItem={selectedItem}
              patchState={patchState}
              updateSelectedItem={updateSelectedItem}
              addItem={addItem}
              duplicateSelectedItem={duplicateSelectedItem}
              deleteSelectedItem={deleteSelectedItem}
            />
          ) : null}
          {panelTab === "responsive" ? <ResponsiveControls state={normalized} patchState={patchState} /> : null}
          {panelTab === "export" ? <ExportControls state={normalized} patchState={patchState} /> : null}

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
              <Sparkles className="h-4 w-4" /> Quick actions
            </div>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Button key={action.id} size="sm" variant="secondary" onClick={() => runQuickAction(action.id, action.label)}>
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {messages.length ? (
            <div className="space-y-2">
              {messages.map((message) => (
                <div key={message.message} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3 text-sm text-[var(--color-text-muted)]">
                  <Badge variant={message.type === "warning" ? "warning" : message.type === "error" ? "danger" : "soft"}>{message.type}</Badge>
                  <p className="mt-2 leading-6">{message.message}</p>
                </div>
              ))}
            </div>
          ) : null}
        </aside>
      </div>

      <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text)]">Generated code</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Copy CSS, HTML, React JSX, or a Tailwind-style starter.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={currentCode} variant="secondary">Copy tab</CopyButton>
            <CopyButton text={`${css}\n\n${html}`} variant="secondary">Copy all</CopyButton>
            <Button variant="ghost" leftIcon={<Download className="h-4 w-4" />} onClick={() => downloadFile("flexbox-layout.css", css, "text/css")}>Download CSS</Button>
            <Button variant="ghost" leftIcon={<Download className="h-4 w-4" />} onClick={() => downloadFile("flexbox-layout.html", `${html}\n\n<style>\n${css}\n</style>`, "text/html")}>Download HTML</Button>
          </div>
        </div>
        <Tabs<CodeTab> className="mt-4" items={CODE_TABS} value={codeTab} onChange={setCodeTab} ariaLabel="Generated code output" />
        <pre className="mt-4 max-h-[520px] overflow-auto rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100"><code>{currentCode}</code></pre>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Best for" text="Navbars, toolbars, form actions, centered states, media objects, card rows, and flexible one-dimensional UI layouts." />
        <InfoCard title="Flex concepts" text="The preview labels the main axis and cross axis so users can see why justify-content and align-items change direction." />
        <InfoCard title="Private by design" text="Everything runs in the browser. Darma does not send your generated layout or CSS to a server." />
      </div>
    </div>
  );
}

function ContainerControls({ state, patchState }: { state: FlexGeneratorState; patchState: (patch: Partial<FlexGeneratorState>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Display"><Select value={state.display} onChange={(event) => patchState({ display: event.target.value as FlexDisplay })}>{displays.map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field>
        <Field label="Direction"><Select value={state.direction} onChange={(event) => patchState({ direction: event.target.value as FlexDirection })}>{directions.map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field>
        <Field label="Wrap"><Select value={state.wrap} onChange={(event) => patchState({ wrap: event.target.value as FlexWrap })}>{wraps.map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field>
        <Field label="Gap unit"><Select value={state.gap.unit} onChange={(event) => patchState({ gap: { ...state.gap, unit: event.target.value as "px" | "rem" } })}><option value="rem">rem</option><option value="px">px</option></Select></Field>
        <Field label="Row gap"><Input type="number" min={0} max={state.gap.unit === "rem" ? 6 : 96} value={state.gap.row} onChange={(event) => patchState({ gap: { ...state.gap, row: Number(event.target.value) } })} /></Field>
        <Field label="Column gap"><Input type="number" min={0} max={state.gap.unit === "rem" ? 6 : 96} value={state.gap.column} onChange={(event) => patchState({ gap: { ...state.gap, column: Number(event.target.value) } })} /></Field>
        <Field label="Min height"><Input type="number" min={120} max={800} value={state.minHeight} onChange={(event) => patchState({ minHeight: Number(event.target.value) })} /></Field>
        <Field label="Border radius"><Input type="number" min={0} max={64} value={state.borderRadius} onChange={(event) => patchState({ borderRadius: Number(event.target.value) })} /></Field>
      </div>
      <Field label="Padding"><Input value={state.padding} onChange={(event) => patchState({ padding: event.target.value })} /></Field>
      <Field label="Background color"><Input type="color" value={state.background} onChange={(event) => patchState({ background: event.target.value })} /></Field>
      <ToggleGrid state={state} patchState={patchState} />
    </div>
  );
}

function AlignmentControls({ state, patchState }: { state: FlexGeneratorState; patchState: (patch: Partial<FlexGeneratorState>) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3 text-sm leading-6 text-[var(--color-text-muted)]">
        <strong className="text-[var(--color-text)]">Tip:</strong> justify-content moves items on the main axis. align-items moves items on the cross axis. The axes change when flex-direction changes.
      </div>
      <Field label="justify-content"><Select value={state.justifyContent} onChange={(event) => patchState({ justifyContent: event.target.value as JustifyContent })}>{justifyValues.map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field>
      <Field label="align-items"><Select value={state.alignItems} onChange={(event) => patchState({ alignItems: event.target.value as AlignItems })}>{alignItemValues.map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field>
      <Field label="align-content"><Select value={state.alignContent} onChange={(event) => patchState({ alignContent: event.target.value as AlignContent })}>{alignContentValues.map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field>
    </div>
  );
}

function ItemsPanel({
  state,
  selectedItem,
  patchState,
  updateSelectedItem,
  addItem,
  duplicateSelectedItem,
  deleteSelectedItem,
}: {
  state: FlexGeneratorState;
  selectedItem: FlexItem | null;
  patchState: (patch: Partial<FlexGeneratorState>) => void;
  updateSelectedItem: (patch: Partial<FlexItem>) => void;
  addItem: () => void;
  duplicateSelectedItem: () => void;
  deleteSelectedItem: () => void;
}) {
  if (!selectedItem) return null;
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {state.items.map((item, index) => (
          <button key={item.id} type="button" onClick={() => patchState({ selectedItemId: item.id })} className={cn("rounded-2xl border p-3 text-left text-sm transition", item.id === selectedItem.id ? "border-[var(--color-accent)] bg-[var(--color-bg-soft)]" : "border-[var(--color-border)] bg-[var(--color-surface-strong)]")}>
            <span className="font-bold text-[var(--color-text)]">#{index + 1} {item.name}</span>
            <span className="mt-1 block text-xs text-[var(--color-text-muted)]">flex: {item.flexGrow} {item.flexShrink} {item.flexBasis}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={addItem}>Add</Button><Button size="sm" variant="secondary" onClick={duplicateSelectedItem}>Duplicate</Button><Button size="sm" variant="danger" onClick={deleteSelectedItem} leftIcon={<Trash2 className="h-4 w-4" />}>Delete</Button></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name"><Input value={selectedItem.name} onChange={(event) => updateSelectedItem({ name: event.target.value })} /></Field>
        <Field label="Content"><Input value={selectedItem.content} onChange={(event) => updateSelectedItem({ content: event.target.value })} /></Field>
        <Field label="flex-grow"><Input type="number" min={0} max={12} value={selectedItem.flexGrow} onChange={(event) => updateSelectedItem({ flexGrow: Number(event.target.value) })} /></Field>
        <Field label="flex-shrink"><Input type="number" min={0} max={12} value={selectedItem.flexShrink} onChange={(event) => updateSelectedItem({ flexShrink: Number(event.target.value) })} /></Field>
        <Field label="flex-basis"><Input value={selectedItem.flexBasis} onChange={(event) => updateSelectedItem({ flexBasis: event.target.value })} /></Field>
        <Field label="Order"><Input type="number" min={-12} max={12} value={selectedItem.order} onChange={(event) => updateSelectedItem({ order: Number(event.target.value) })} /></Field>
        <Field label="Width"><Input value={selectedItem.width} onChange={(event) => updateSelectedItem({ width: event.target.value })} /></Field>
        <Field label="Height"><Input value={selectedItem.height} onChange={(event) => updateSelectedItem({ height: event.target.value })} /></Field>
        <Field label="align-self"><Select value={selectedItem.alignSelf} onChange={(event) => updateSelectedItem({ alignSelf: event.target.value as FlexAlignSelf })}>{alignSelfValues.map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field>
        <Field label="Radius"><Input type="number" min={0} max={64} value={selectedItem.borderRadius} onChange={(event) => updateSelectedItem({ borderRadius: Number(event.target.value) })} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Background"><Input type="color" value={selectedItem.background} onChange={(event) => updateSelectedItem({ background: event.target.value })} /></Field>
        <Field label="Text color"><Input type="color" value={selectedItem.textColor} onChange={(event) => updateSelectedItem({ textColor: event.target.value })} /></Field>
      </div>
      <Field label="Padding"><Input value={selectedItem.padding} onChange={(event) => updateSelectedItem({ padding: event.target.value })} /></Field>
      <label className="flex items-center gap-2 text-sm text-[var(--color-text)]"><input type="checkbox" checked={selectedItem.marginLeftAuto} onChange={(event) => updateSelectedItem({ marginLeftAuto: event.target.checked })} /> margin-left: auto</label>
      <label className="flex items-center gap-2 text-sm text-[var(--color-text)]"><input type="checkbox" checked={selectedItem.marginRightAuto} onChange={(event) => updateSelectedItem({ marginRightAuto: event.target.checked })} /> margin-right: auto</label>
    </div>
  );
}

function ResponsiveControls({ state, patchState }: { state: FlexGeneratorState; patchState: (patch: Partial<FlexGeneratorState>) => void }) {
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]"><input type="checkbox" checked={state.responsive.enabled} onChange={(event) => patchState({ responsive: { ...state.responsive, enabled: event.target.checked } })} /> Include responsive CSS</label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tablet breakpoint"><Input type="number" min={480} max={1200} value={state.responsive.tabletBreakpoint} onChange={(event) => patchState({ responsive: { ...state.responsive, tabletBreakpoint: Number(event.target.value) } })} /></Field>
        <Field label="Mobile breakpoint"><Input type="number" min={320} max={900} value={state.responsive.mobileBreakpoint} onChange={(event) => patchState({ responsive: { ...state.responsive, mobileBreakpoint: Number(event.target.value) } })} /></Field>
        <Field label="Tablet behavior"><Select value={state.responsive.tabletBehavior} onChange={(event) => patchState({ responsive: { ...state.responsive, tabletBehavior: event.target.value as FlexGeneratorState["responsive"]["tabletBehavior"] } })}><option value="preserve">preserve</option><option value="wrap">wrap</option><option value="stack">stack</option></Select></Field>
        <Field label="Mobile behavior"><Select value={state.responsive.mobileBehavior} onChange={(event) => patchState({ responsive: { ...state.responsive, mobileBehavior: event.target.value as FlexGeneratorState["responsive"]["mobileBehavior"] } })}><option value="preserve">preserve</option><option value="wrap">wrap</option><option value="stack">stack</option><option value="center-stack">center-stack</option></Select></Field>
      </div>
    </div>
  );
}

function ExportControls({ state, patchState }: { state: FlexGeneratorState; patchState: (patch: Partial<FlexGeneratorState>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Container class"><Input value={state.containerClassName} onChange={(event) => patchState({ containerClassName: event.target.value })} /></Field>
      <Field label="Item class prefix"><Input value={state.itemClassPrefix} onChange={(event) => patchState({ itemClassPrefix: event.target.value })} /></Field>
      <label className="flex items-center gap-2 text-sm text-[var(--color-text)]"><input type="checkbox" checked={state.includeDemoStyles} onChange={(event) => patchState({ includeDemoStyles: event.target.checked })} /> Include demo colors and spacing</label>
      <label className="flex items-center gap-2 text-sm text-[var(--color-text)]"><input type="checkbox" checked={state.includeComments} onChange={(event) => patchState({ includeComments: event.target.checked })} /> Include comments</label>
    </div>
  );
}

function ToggleGrid({ state, patchState }: { state: FlexGeneratorState; patchState: (patch: Partial<FlexGeneratorState>) => void }) {
  const toggles: Array<[keyof FlexGeneratorState, string]> = [
    ["showAxisOverlay", "Axis overlay"],
    ["showItemSizes", "Item sizes"],
    ["showGapMarkers", "Gap marker"],
    ["showWrapLines", "Wrap hint"],
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {toggles.map(([key, label]) => (
        <label key={String(key)} className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3 text-sm text-[var(--color-text)]">
          <input type="checkbox" checked={Boolean(state[key])} onChange={(event) => patchState({ [key]: event.target.checked } as Partial<FlexGeneratorState>)} /> {label}
        </label>
      ))}
    </div>
  );
}

function AxisOverlay({ direction }: { direction: FlexDirection }) {
  const isColumn = direction.includes("column");
  return (
    <div className="pointer-events-none absolute inset-3 z-10 text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
      <div className={cn("absolute rounded-full bg-white/90 px-2 py-1 shadow", isColumn ? "left-2 top-10 rotate-90" : "left-8 top-2")}>Main axis →</div>
      <div className={cn("absolute rounded-full bg-white/90 px-2 py-1 shadow", isColumn ? "right-2 top-2" : "left-2 top-10 rotate-90")}>Cross axis →</div>
    </div>
  );
}

function GapMarkers({ gap }: { gap: string }) {
  return <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[var(--color-text-muted)] shadow">gap {gap}</div>;
}

function WrapLineHint() {
  return <div className="pointer-events-none absolute inset-x-4 top-1/2 border-t border-dashed border-white/60" aria-hidden />;
}

function MiniPreset({ state }: { state: FlexGeneratorState }) {
  const normalized = normalizeFlexState(state);
  return (
    <div className="flex h-20 gap-1 overflow-hidden rounded-2xl bg-[var(--color-bg-soft)] p-2" style={{ flexDirection: normalized.direction, flexWrap: normalized.wrap, justifyContent: normalized.justifyContent, alignItems: normalized.alignItems }}>
      {normalized.items.slice(0, 6).map((item, index) => (
        <span key={item.id} className="min-h-5 rounded-md" style={{ background: item.background, flex: index === 1 ? "1 1 28px" : "0 1 28px", width: "28px" }} />
      ))}
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <h3 className="text-base font-bold text-[var(--color-text)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{text}</p>
    </div>
  );
}
