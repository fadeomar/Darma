"use client";

import { useMemo, useState } from "react";
import { Copy, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { Badge, Button, CopyButton } from "@/components/ui";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import {
  CodeOutputPanel,
  ColorField,
  ControlGrid,
  ControlSection,
  NumberField,
  PreviewToolbar,
  SegmentedControl,
  SliderNumberField,
  ToolControlPanel,
  WarningPanel,
  type CodeOutputTab,
  type WarningMessage,
} from "@/features/tools/components";
import type { BoxShadowState, Shadow } from "@/types";

const defaultShadow: Shadow = { id: "1", offsetX: 0, offsetY: 12, blur: 32, spread: 0, opacity: 0.22, color: "#000000", inset: false, distance: 0 };
const defaultState: BoxShadowState = { shadows: [defaultShadow], boxSize: 220, borderRadius: 24, backgroundColor: "#ffffff", activeLightSource: 1 };

const presets: { id: string; name: string; description: string; state: BoxShadowState }[] = [
  { id: "soft-card", name: "Soft card", description: "Balanced UI card elevation.", state: defaultState },
  { id: "floating", name: "Floating", description: "Large airy product card shadow.", state: { ...defaultState, shadows: [{ ...defaultShadow, id: "1", offsetY: 28, blur: 72, opacity: 0.24 }] } },
  { id: "crisp", name: "Crisp", description: "Small layered app shadow.", state: { ...defaultState, shadows: [{ ...defaultShadow, id: "1", offsetY: 4, blur: 12, opacity: 0.16 }, { ...defaultShadow, id: "2", offsetY: 12, blur: 28, opacity: 0.12 }] } },
  { id: "inner", name: "Inset", description: "Inset pressed surface.", state: { ...defaultState, shadows: [{ ...defaultShadow, id: "1", offsetX: 0, offsetY: 4, blur: 16, opacity: 0.24, inset: true }] } },
];

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const parsed = Number.parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  if (Number.isNaN(parsed)) return "0 0 0";
  return `${(parsed >> 16) & 255} ${(parsed >> 8) & 255} ${parsed & 255}`;
}

function shadowString(shadow: Shadow) {
  return `${shadow.inset ? "inset " : ""}${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.spread}px rgb(${hexToRgb(shadow.color)} / ${shadow.opacity.toFixed(2)})`;
}

function boxShadowValue(state: BoxShadowState) {
  return state.shadows.map(shadowString).join(", ");
}

function generateCss(state: BoxShadowState) {
  return `.shadow-card {\n  width: ${state.boxSize}px;\n  height: ${state.boxSize}px;\n  border-radius: ${state.borderRadius}px;\n  background: ${state.backgroundColor};\n  box-shadow: ${boxShadowValue(state)};\n}`;
}

function generateVariable(state: BoxShadowState) {
  return `:root {\n  --darma-shadow: ${boxShadowValue(state)};\n}\n\n.shadow-card {\n  box-shadow: var(--darma-shadow);\n}`;
}

function generateTailwind(state: BoxShadowState) {
  return `<div className="h-[${state.boxSize}px] w-[${state.boxSize}px] rounded-[${state.borderRadius}px] bg-white shadow-[${boxShadowValue(state).replace(/\s+/g, "_")}]" />`;
}

function cloneState(state: BoxShadowState): BoxShadowState {
  return { ...state, shadows: state.shadows.map((shadow) => ({ ...shadow })) };
}

export default function BoxShadowsGeneratorClient() {
  const [state, setState] = useState<BoxShadowState>(() => cloneState(defaultState));
  const [activeId, setActiveId] = useState(state.shadows[0]?.id ?? "1");

  const activeShadow = state.shadows.find((shadow) => shadow.id === activeId) ?? state.shadows[0];
  const css = useMemo(() => generateCss(state), [state]);
  const tabs = useMemo<CodeOutputTab[]>(() => [
    { id: "css", label: "CSS", language: "css", filename: "box-shadow.css", code: css },
    { id: "variable", label: "CSS variable", language: "css", filename: "box-shadow-variable.css", code: generateVariable(state) },
    { id: "tailwind", label: "Tailwind", language: "txt", filename: "box-shadow-tailwind.txt", code: generateTailwind(state) },
  ], [css, state]);
  const warnings = useMemo<WarningMessage[]>(() => {
    const messages: WarningMessage[] = [];
    if (state.shadows.length > 3) messages.push({ id: "many", severity: "warning", message: "Multiple large shadow layers can affect paint performance." });
    if (state.shadows.some((shadow) => shadow.blur > 80)) messages.push({ id: "blur", severity: "warning", message: "Very high blur values can become expensive on large elements." });
    if (state.shadows.some((shadow) => shadow.inset)) messages.push({ id: "inset", severity: "info", message: "Inset shadows may look different on transparent or image backgrounds." });
    return messages;
  }, [state.shadows]);

  function updateShadow(id: string, patch: Partial<Shadow>) {
    setState((current) => ({ ...current, shadows: current.shadows.map((shadow) => (shadow.id === id ? { ...shadow, ...patch } : shadow)) }));
  }

  function addShadow() {
    setState((current) => {
      const next: Shadow = { ...defaultShadow, id: String(current.shadows.length + 1), offsetY: 16 + current.shadows.length * 4, blur: 32 + current.shadows.length * 8, opacity: 0.16 };
      setActiveId(next.id);
      return { ...current, shadows: [...current.shadows, next] };
    });
  }

  function duplicateShadow() {
    if (!activeShadow) return;
    setState((current) => {
      const next = { ...activeShadow, id: String(current.shadows.length + 1) };
      setActiveId(next.id);
      return { ...current, shadows: [...current.shadows, next] };
    });
  }

  function removeShadow(id: string) {
    setState((current) => {
      const shadows = current.shadows.filter((shadow) => shadow.id !== id).map((shadow, index) => ({ ...shadow, id: String(index + 1) }));
      setActiveId(shadows[0]?.id ?? "1");
      return { ...current, shadows: shadows.length ? shadows : [{ ...defaultShadow }] };
    });
  }

  const previewSlot = (
    <div className="space-y-4">
      <PreviewToolbar title="Shadow preview" description="Preview the selected multi-layer shadow on a large surface." />
      <div className="flex min-h-[520px] items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[radial-gradient(circle_at_top_left,rgb(59_130_246_/_0.12),transparent_34%),linear-gradient(135deg,#f8fafc,#e2e8f0)] p-8 dark:bg-[linear-gradient(135deg,#020617,#0f172a)]">
        <div
          className="flex items-center justify-center text-center text-sm font-bold text-[var(--color-text-tertiary)]"
          style={{ width: state.boxSize, height: state.boxSize, borderRadius: state.borderRadius, background: state.backgroundColor, boxShadow: boxShadowValue(state) }}
        >
          box-shadow
        </div>
      </div>
    </div>
  );

  const controlsSlot = (
    <ToolControlPanel title="Shadow settings" description="Edit layers with compact controls." badge={<Badge variant="soft">{state.shadows.length} layer{state.shadows.length === 1 ? "" : "s"}</Badge>}>
      <ControlSection title="Presets">
        <div className="grid gap-2 sm:grid-cols-2">
          {presets.map((preset) => (
            <button key={preset.id} type="button" onClick={() => { setState(cloneState(preset.state)); setActiveId("1"); }} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3 text-left text-sm transition hover:border-[var(--color-border-strong)]">
              <span className="block font-bold text-[var(--color-text)]">{preset.name}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--color-text-soft)]">{preset.description}</span>
            </button>
          ))}
        </div>
      </ControlSection>

      <ControlSection title="Layers" action={<Button size="sm" variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={addShadow}>Add</Button>}>
        <div className="space-y-2">
          {state.shadows.map((shadow, index) => (
            <button key={shadow.id} type="button" onClick={() => setActiveId(shadow.id)} className={`flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm transition ${activeId === shadow.id ? "border-[var(--color-accent)] bg-[var(--color-bg-soft)]" : "border-[var(--color-border)] bg-[var(--color-surface-strong)]"}`}>
              <span className="font-semibold text-[var(--color-text)]">Layer {index + 1}</span>
              <span className="text-xs text-[var(--color-text-soft)]">{shadowString(shadow)}</span>
            </button>
          ))}
        </div>
      </ControlSection>

      {activeShadow ? (
        <ControlSection title="Selected layer" action={<Button size="sm" variant="ghost" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => removeShadow(activeShadow.id)}>Remove</Button>}>
          <ControlGrid columns={2}>
            <SliderNumberField label="X offset" value={activeShadow.offsetX} min={-100} max={100} unit="px" onChange={(value) => updateShadow(activeShadow.id, { offsetX: value })} />
            <SliderNumberField label="Y offset" value={activeShadow.offsetY} min={-100} max={100} unit="px" onChange={(value) => updateShadow(activeShadow.id, { offsetY: value })} />
            <SliderNumberField label="Blur" value={activeShadow.blur} min={0} max={140} unit="px" onChange={(value) => updateShadow(activeShadow.id, { blur: value })} />
            <SliderNumberField label="Spread" value={activeShadow.spread} min={-60} max={80} unit="px" onChange={(value) => updateShadow(activeShadow.id, { spread: value })} />
            <SliderNumberField label="Opacity" value={activeShadow.opacity} min={0} max={1} step={0.01} onChange={(value) => updateShadow(activeShadow.id, { opacity: value })} />
            <ColorField label="Color" value={activeShadow.color} onChange={(value) => updateShadow(activeShadow.id, { color: value })} />
          </ControlGrid>
          <ControlGrid columns={2}>
            <SegmentedControl ariaLabel="Inset mode" value={activeShadow.inset ? "inset" : "outset"} onChange={(value) => updateShadow(activeShadow.id, { inset: value === "inset" })} options={[{ value: "outset", label: "Outset" }, { value: "inset", label: "Inset" }]} />
            <Button variant="secondary" leftIcon={<Copy className="h-4 w-4" />} onClick={duplicateShadow}>Duplicate</Button>
          </ControlGrid>
        </ControlSection>
      ) : null}

      <ControlSection title="Preview object">
        <ControlGrid columns={2}>
          <SliderNumberField label="Size" value={state.boxSize} min={80} max={420} unit="px" onChange={(value) => setState((current) => ({ ...current, boxSize: value }))} />
          <SliderNumberField label="Radius" value={state.borderRadius} min={0} max={120} unit="px" onChange={(value) => setState((current) => ({ ...current, borderRadius: value }))} />
          <ColorField label="Background" value={state.backgroundColor} onChange={(value) => setState((current) => ({ ...current, backgroundColor: value }))} />
        </ControlGrid>
      </ControlSection>
    </ToolControlPanel>
  );

  return (
    <ToolLayoutVisualGenerator
      previewSlot={previewSlot}
      controlsSlot={controlsSlot}
      actionsSlot={<div className="flex flex-wrap gap-2"><Button variant="secondary" leftIcon={<RefreshCcw className="h-4 w-4" />} onClick={() => { setState(cloneState(defaultState)); setActiveId("1"); }}>Reset</Button><CopyButton text={css}>Copy CSS</CopyButton></div>}
      codeSlot={<div className="space-y-4"><WarningPanel title="Shadow notes" messages={warnings} /><CodeOutputPanel title="Generated shadow code" tabs={tabs} defaultTab="css" /></div>}
    />
  );
}
