"use client";

import type { Dispatch, SetStateAction } from "react";
import { Badge, Button, Select } from "@/components/ui";
import {
  ColorField,
  ControlGrid,
  ControlSection,
  SegmentedControl,
  SliderNumberField,
  ToolControlPanel,
} from "@/features/tools/components";
import type { AnimatedBackgroundState, BackgroundShape, BlendMode, GradientStyle, PreviewMode } from "@/types/animatedBackgroundTypes";

interface ControlPanelProps {
  state: AnimatedBackgroundState;
  setState: Dispatch<SetStateAction<AnimatedBackgroundState>>;
  onRandomize: () => void;
  onReset: () => void;
  onSimilar: () => void;
}

const blendModes: BlendMode[] = ["screen", "plus-lighter", "overlay", "normal", "multiply"];
const shapes: BackgroundShape[] = ["circle", "soft-square", "diamond"];
const previewModes: PreviewMode[] = ["hero", "cards", "dashboard", "empty"];
const gradientStyles: GradientStyle[] = ["mesh", "linear", "radial"];

function getPerformanceCopy(state: AnimatedBackgroundState) {
  if (state.particleCount > 34 || state.blur > 90 || state.maxSize > 560) {
    return "This preset is visually rich. Keep it behind short hero sections and use reduced-motion fallback.";
  }
  if (state.particleCount > 22 || state.blur > 48) {
    return "Balanced for landing pages. Test on low-end mobile before shipping as a full-page background.";
  }
  return "Light setup. Good for sections, dashboard headers, and reusable UI blocks.";
}

export default function ControlPanel({ state, setState, onRandomize, onReset, onSimilar }: ControlPanelProps) {
  function patch(patchState: Partial<AnimatedBackgroundState>) {
    setState((current) => ({ ...current, ...patchState }));
  }

  function updateColor(index: number, color: string) {
    setState((current) => {
      const colors = [...current.colors];
      colors[index] = color;
      return { ...current, colors };
    });
  }

  return (
    <ToolControlPanel
      title="Background settings"
      description="Tune palette, motion, density, gradient style, and export-safe performance."
      badge={<Badge variant={state.isPaused ? "warning" : "success"}>{state.isPaused ? "Paused" : "Live"}</Badge>}
      footer={getPerformanceCopy(state)}
    >
      <ControlSection title="Actions" compact>
        <ControlGrid columns={2}>
          <Button size="sm" variant="primary" onClick={onRandomize}>Randomize</Button>
          <Button size="sm" variant="secondary" onClick={onSimilar}>Similar</Button>
          <Button size="sm" variant="secondary" onClick={onReset}>Reset preset</Button>
          <Button size="sm" variant={state.isPaused ? "soft" : "secondary"} onClick={() => patch({ isPaused: !state.isPaused })}>{state.isPaused ? "Play" : "Pause"}</Button>
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Preview" description="Use real content previews to catch readability issues before export." compact>
        <SegmentedControl
          ariaLabel="Animated background preview mode"
          value={state.previewMode}
          onChange={(previewMode) => patch({ previewMode, showContent: previewMode !== "empty" })}
          options={previewModes.map((mode) => ({ value: mode, label: mode }))}
          fullWidth
        />
        <Button size="sm" variant={state.showContent ? "soft" : "secondary"} fullWidth onClick={() => patch({ showContent: !state.showContent })}>
          {state.showContent ? "Hide demo content" : "Show demo content"}
        </Button>
      </ControlSection>

      <ControlSection title="Colors" compact>
        <ColorField label="Background" value={state.background} onChange={(background) => patch({ background })} />
        <ControlGrid columns={2}>
          {state.colors.map((color, index) => (
            <ColorField key={`${index}-${color}`} label={`Color ${index + 1}`} value={color} onChange={(value) => updateColor(index, value)} />
          ))}
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Composition" description="Gradient style changes the overall visual structure, not just color." compact>
        <ControlGrid columns={2}>
          <label className="grid gap-1.5">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">Gradient</span>
            <Select size="sm" value={state.gradientStyle} onChange={(event) => patch({ gradientStyle: event.target.value as GradientStyle })}>
              {gradientStyles.map((style) => <option key={style} value={style}>{style}</option>)}
            </Select>
          </label>
          <label className="grid gap-1.5">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">Shape</span>
            <Select size="sm" value={state.shape} onChange={(event) => patch({ shape: event.target.value as BackgroundShape })}>
              {shapes.map((shape) => <option key={shape} value={shape}>{shape}</option>)}
            </Select>
          </label>
          <SliderNumberField label="Elements" value={state.particleCount} min={4} max={44} onChange={(particleCount) => patch({ particleCount })} />
          <SliderNumberField label="Radius" value={state.borderRadius} min={0} max={999} unit="%" onChange={(borderRadius) => patch({ borderRadius })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Motion" compact>
        <ControlGrid columns={2}>
          <SliderNumberField label="Speed" value={state.speed} min={0.3} max={1.8} step={0.05} unit="x" onChange={(speed) => patch({ speed })} />
          <SliderNumberField label="Intensity" value={state.intensity} min={0.1} max={1.4} step={0.05} onChange={(intensity) => patch({ intensity })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Size" compact>
        <ControlGrid columns={2}>
          <SliderNumberField label="Min size" value={state.minSize} min={4} max={320} unit="px" onChange={(minSize) => patch({ minSize: Math.min(minSize, state.maxSize - 4) })} />
          <SliderNumberField label="Max size" value={state.maxSize} min={24} max={720} unit="px" onChange={(maxSize) => patch({ maxSize: Math.max(maxSize, state.minSize + 4) })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Effects" compact>
        <ControlGrid columns={2}>
          <SliderNumberField label="Blur" value={state.blur} min={0} max={120} unit="px" onChange={(blur) => patch({ blur })} />
          <SliderNumberField label="Opacity" value={state.opacity} min={0.1} max={0.95} step={0.01} onChange={(opacity) => patch({ opacity })} />
          <SliderNumberField label="Glow" value={state.glow} min={0} max={110} unit="px" onChange={(glow) => patch({ glow })} />
          <label className="grid gap-1.5">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">Blend</span>
            <Select size="sm" value={state.blendMode} onChange={(event) => patch({ blendMode: event.target.value as BlendMode })}>
              {blendModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </Select>
          </label>
        </ControlGrid>
      </ControlSection>
    </ToolControlPanel>
  );
}
