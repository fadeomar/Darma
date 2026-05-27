"use client";

import { useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Badge, Button, CopyButton } from "@/components/ui";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import {
  CodeOutputPanel,
  ColorField,
  ControlGrid,
  ControlSection,
  PresetGallery,
  PreviewToolbar,
  SegmentedControl,
  SliderNumberField,
  ToolControlPanel,
  WarningPanel,
  type CodeOutputTab,
  type WarningMessage,
} from "@/features/tools/components";
import { colorLuminance, getContrast } from "@/utils";

type Shape = "flat" | "pressed" | "convex" | "concave";
type LightSource = "top-left" | "top-right" | "bottom-right" | "bottom-left";

type NeumoState = {
  color: string;
  size: number;
  radius: number;
  distance: number;
  intensity: number;
  blur: number;
  shape: Shape;
  lightSource: LightSource;
  previewBackground: string;
};

const defaultState: NeumoState = { color: "#e0e0e0", size: 300, radius: 50, distance: 20, intensity: 0.15, blur: 40, shape: "flat", lightSource: "top-left", previewBackground: "#e0e0e0" };
const presets: { id: string; name: string; description: string; state: NeumoState }[] = [
  { id: "soft-card", name: "Soft card", description: "Classic raised neumorphic card.", state: defaultState },
  { id: "pressed", name: "Pressed", description: "Inset pressed control.", state: { ...defaultState, shape: "pressed", radius: 28, distance: 14, blur: 28 } },
  { id: "dark", name: "Dark surface", description: "Soft surface for dark dashboards.", state: { ...defaultState, color: "#1f2937", previewBackground: "#1f2937", intensity: 0.22, shape: "convex" } },
  { id: "pill", name: "Pill", description: "Rounded control with softer blur.", state: { ...defaultState, size: 240, radius: 999, distance: 12, blur: 28 } },
];

function lightConfig(source: LightSource) {
  if (source === "top-right") return { x: -1, y: 1, angle: 225 };
  if (source === "bottom-right") return { x: -1, y: -1, angle: 315 };
  if (source === "bottom-left") return { x: 1, y: -1, angle: 45 };
  return { x: 1, y: 1, angle: 145 };
}

function buildValues(state: NeumoState) {
  const config = lightConfig(state.lightSource);
  const dark = colorLuminance(state.color, -state.intensity);
  const light = colorLuminance(state.color, state.intensity);
  const positionX = state.distance * config.x;
  const positionY = state.distance * config.y;
  const radius = state.radius >= state.size / 2 ? "50%" : `${state.radius}px`;
  const firstGradient = state.shape === "convex" ? colorLuminance(state.color, 0.07) : state.shape === "concave" ? colorLuminance(state.color, -0.1) : state.color;
  const secondGradient = state.shape === "convex" ? colorLuminance(state.color, -0.1) : state.shape === "concave" ? colorLuminance(state.color, 0.07) : state.color;
  const background = state.shape === "convex" || state.shape === "concave" ? `linear-gradient(${config.angle}deg, ${firstGradient}, ${secondGradient})` : state.color;
  const inset = state.shape === "pressed" ? "inset " : "";
  const boxShadow = `${inset}${positionX}px ${positionY}px ${state.blur}px ${dark}, ${inset}${-positionX}px ${-positionY}px ${state.blur}px ${light}`;
  return { dark, light, radius, background, boxShadow, textColor: getContrast(state.color) };
}

function generateCss(state: NeumoState) {
  const values = buildValues(state);
  return `.neumorphic-surface {\n  width: ${state.size}px;\n  height: ${state.size}px;\n  border-radius: ${values.radius};\n  background: ${values.background};\n  box-shadow: ${values.boxShadow};\n  color: ${values.textColor};\n}`;
}

function generateVariables(state: NeumoState) {
  const values = buildValues(state);
  return `.neumorphic-surface {\n  --neumo-bg: ${state.color};\n  --neumo-shadow-dark: ${values.dark};\n  --neumo-shadow-light: ${values.light};\n  background: ${values.background};\n  box-shadow: ${values.boxShadow};\n}`;
}

export default function NeumorphicCssGeneratorClient() {
  const [state, setState] = useState<NeumoState>(defaultState);
  const values = useMemo(() => buildValues(state), [state]);
  const css = useMemo(() => generateCss(state), [state]);
  const tabs = useMemo<CodeOutputTab[]>(() => [
    { id: "css", label: "CSS", language: "css", filename: "neumorphic.css", code: css },
    { id: "variables", label: "CSS variables", language: "css", filename: "neumorphic-variables.css", code: generateVariables(state) },
    { id: "html", label: "HTML", language: "html", filename: "neumorphic.html", code: `<div class="neumorphic-surface">Soft UI</div>` },
  ], [css, state]);
  const warnings = useMemo<WarningMessage[]>(() => {
    const messages: WarningMessage[] = [];
    if (state.blur > 80) messages.push({ id: "blur", severity: "warning", message: "Very large blur values can be expensive and reduce crispness." });
    if (state.intensity < 0.07) messages.push({ id: "contrast", severity: "info", message: "Low intensity can make neumorphic depth hard to see." });
    return messages;
  }, [state.blur, state.intensity]);

  function patch(patchState: Partial<NeumoState>) {
    setState((current) => ({ ...current, ...patchState }));
  }

  const previewSlot = (
    <div className="space-y-4">
      <PreviewToolbar title="Neumorphic preview" description="The soft UI style is scoped to this preview surface only." />
      <div className="flex min-h-[520px] items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] p-8" style={{ background: state.previewBackground }}>
        <div
          className="flex items-center justify-center text-center text-sm font-black"
          style={{
            width: state.size,
            height: state.size,
            borderRadius: values.radius,
            background: values.background,
            boxShadow: values.boxShadow,
            color: values.textColor,
          }}
        >
          Soft UI
        </div>
      </div>
    </div>
  );

  const controlsSlot = (
    <ToolControlPanel title="Neumorphic settings" description="Darma controls with preview-only soft shadows." badge={<Badge variant="soft">Scoped</Badge>}>
      <ControlSection title="Presets">
        <PresetGallery presets={presets} selectedId={presets.find((preset) => preset.state === state)?.id} onSelect={(_, preset) => setState(preset.state)} getId={(preset) => preset.id} getLabel={(preset) => preset.name} getDescription={(preset) => preset.description} />
      </ControlSection>
      <ControlSection title="Shape">
        <SegmentedControl ariaLabel="Shape" value={state.shape} onChange={(shape) => patch({ shape })} options={(["flat", "pressed", "convex", "concave"] as const).map((shape) => ({ value: shape, label: shape }))} />
      </ControlSection>
      <ControlSection title="Surface">
        <ControlGrid columns={2}>
          <ColorField label="Surface" value={state.color} onChange={(color) => patch({ color, previewBackground: color })} />
          <ColorField label="Preview bg" value={state.previewBackground} onChange={(previewBackground) => patch({ previewBackground })} />
          <SliderNumberField label="Size" value={state.size} min={80} max={480} unit="px" onChange={(size) => patch({ size, radius: Math.min(state.radius, Math.round(size / 2)) })} />
          <SliderNumberField label="Radius" value={state.radius} min={0} max={240} unit="px" onChange={(radius) => patch({ radius })} />
        </ControlGrid>
      </ControlSection>
      <ControlSection title="Shadow">
        <ControlGrid columns={2}>
          <SliderNumberField label="Distance" value={state.distance} min={2} max={60} unit="px" onChange={(distance) => patch({ distance })} />
          <SliderNumberField label="Blur" value={state.blur} min={4} max={120} unit="px" onChange={(blur) => patch({ blur })} />
          <SliderNumberField label="Intensity" value={state.intensity} min={0.03} max={0.36} step={0.01} onChange={(intensity) => patch({ intensity })} />
        </ControlGrid>
      </ControlSection>
      <ControlSection title="Light source">
        <SegmentedControl ariaLabel="Light source" value={state.lightSource} onChange={(lightSource) => patch({ lightSource })} options={(["top-left", "top-right", "bottom-right", "bottom-left"] as const).map((source) => ({ value: source, label: source.replace("-", " ") }))} />
      </ControlSection>
    </ToolControlPanel>
  );

  return (
    <ToolLayoutVisualGenerator
      previewSlot={previewSlot}
      controlsSlot={controlsSlot}
      actionsSlot={<div className="flex flex-wrap gap-2"><Button variant="secondary" leftIcon={<RefreshCcw className="h-4 w-4" />} onClick={() => setState(defaultState)}>Reset</Button><CopyButton text={css}>Copy CSS</CopyButton></div>}
      codeSlot={<div className="space-y-4"><WarningPanel title="Neumorphic notes" messages={warnings} /><CodeOutputPanel title="Generated neumorphic code" tabs={tabs} defaultTab="css" /></div>}
    />
  );
}
