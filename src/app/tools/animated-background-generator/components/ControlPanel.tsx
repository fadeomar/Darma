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
import type { AnimatedBackgroundState, BackgroundShape, BlendMode, PreviewMode } from "@/types/animatedBackgroundTypes";

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
    <ToolControlPanel title="Background settings" description="Tune content preview, palette, motion, shape density, and export-ready effects." badge={<Badge variant={state.isPaused ? "warning" : "success"}>{state.isPaused ? "Paused" : "Live"}</Badge>}>
      <ControlSection title="Actions">
        <ControlGrid columns={2}>
          <Button size="sm" variant="primary" onClick={onRandomize}>Randomize</Button>
          <Button size="sm" variant="secondary" onClick={onSimilar}>Similar</Button>
          <Button size="sm" variant="secondary" onClick={onReset}>Reset preset</Button>
          <Button size="sm" variant={state.isPaused ? "soft" : "secondary"} onClick={() => patch({ isPaused: !state.isPaused })}>{state.isPaused ? "Play" : "Pause"}</Button>
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Preview">
        <SegmentedControl
          ariaLabel="Animated background preview mode"
          value={state.previewMode}
          onChange={(previewMode) => patch({ previewMode, showContent: previewMode !== "empty" })}
          options={previewModes.map((mode) => ({ value: mode, label: mode }))}
          fullWidth
        />
      </ControlSection>

      <ControlSection title="Colors">
        <ColorField label="Background" value={state.background} onChange={(background) => patch({ background })} />
        <ControlGrid columns={2}>
          {state.colors.map((color, index) => (
            <ColorField key={`${index}-${color}`} label={`Color ${index + 1}`} value={color} onChange={(value) => updateColor(index, value)} />
          ))}
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Motion">
        <ControlGrid columns={2}>
          <SliderNumberField label="Speed" value={state.speed} min={0.3} max={1.8} step={0.05} unit="x" onChange={(speed) => patch({ speed })} />
          <SliderNumberField label="Intensity" value={state.intensity} min={0.1} max={1.4} step={0.05} onChange={(intensity) => patch({ intensity })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Shapes">
        <ControlGrid columns={2}>
          <SliderNumberField label="Elements" value={state.particleCount} min={4} max={44} onChange={(particleCount) => patch({ particleCount })} />
          <label className="grid gap-1.5">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">Shape</span>
            <Select size="sm" value={state.shape} onChange={(event) => patch({ shape: event.target.value as BackgroundShape })}>
              {shapes.map((shape) => <option key={shape} value={shape}>{shape}</option>)}
            </Select>
          </label>
          <SliderNumberField label="Min size" value={state.minSize} min={4} max={320} unit="px" onChange={(minSize) => patch({ minSize: Math.min(minSize, state.maxSize - 4) })} />
          <SliderNumberField label="Max size" value={state.maxSize} min={24} max={720} unit="px" onChange={(maxSize) => patch({ maxSize: Math.max(maxSize, state.minSize + 4) })} />
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Effects">
        <ControlGrid columns={2}>
          <SliderNumberField label="Blur" value={state.blur} min={0} max={120} unit="px" onChange={(blur) => patch({ blur })} />
          <SliderNumberField label="Opacity" value={state.opacity} min={0.1} max={0.95} step={0.01} onChange={(opacity) => patch({ opacity })} />
          <SliderNumberField label="Glow" value={state.glow} min={0} max={110} unit="px" onChange={(glow) => patch({ glow })} />
          <label className="grid gap-1.5">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">Blend</span>
            <Select size="sm" value={state.blendMode} onChange={(event) => patch({ blendMode: event.target.value as BlendMode })}>
              {blendModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </Select>
          </label>
        </ControlGrid>
      </ControlSection>
    </ToolControlPanel>
  );
}
