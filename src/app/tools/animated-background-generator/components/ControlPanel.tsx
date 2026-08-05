"use client";

import { useMemo, type Dispatch, type SetStateAction } from "react";
import {
  Boxes,
  CirclePause,
  CirclePlay,
  GalleryHorizontal,
  Image,
  LayoutDashboard,
  LayoutTemplate,
  Plus,
  RotateCcw,
  Shuffle,
  Sparkles,
  Sun,
  Moon,
  WandSparkles,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { Badge, Button, Select } from "@/components/ui";
import {
  ColorField,
  ControlGrid,
  ControlSection,
  SegmentedControl,
  SliderNumberField,
  ToolControlPanel,
} from "@/features/tools/components";
import { cn } from "@/lib/cn";
import type { AnimatedBackgroundState, BackgroundShape, BlendMode, ForegroundMode, GradientStyle, PreviewMode } from "@/types/animatedBackgroundTypes";
import { getAnimatedBackgroundReadability } from "../lib/readability";

interface ControlPanelProps {
  state: AnimatedBackgroundState;
  setState: Dispatch<SetStateAction<AnimatedBackgroundState>>;
  onRandomize: () => void;
  onReset: () => void;
  onSimilar: () => void;
}

const blendModes: BlendMode[] = ["screen", "plus-lighter", "overlay", "normal", "multiply"];
const shapes: BackgroundShape[] = ["circle", "soft-square", "diamond"];
const gradientStyles: GradientStyle[] = ["mesh", "linear", "radial"];
const previewModes: Array<{ value: PreviewMode; label: string; description: string; icon: typeof LayoutTemplate }> = [
  { value: "hero", label: "Hero", description: "Headline and actions", icon: LayoutTemplate },
  { value: "cards", label: "Cards", description: "Layered product cards", icon: GalleryHorizontal },
  { value: "dashboard", label: "Dashboard", description: "Dense application UI", icon: LayoutDashboard },
  { value: "empty", label: "Background only", description: "No demo content", icon: Image },
];
const foregroundModes: Array<{ value: ForegroundMode; label: string; icon: typeof Sun }> = [
  { value: "auto", label: "Auto", icon: WandSparkles },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

const extraColors = ["#f97316", "#14b8a6", "#f43f5e", "#facc15", "#8b5cf6", "#22d3ee"];

function getPerformanceCopy(state: AnimatedBackgroundState) {
  if (state.particleCount > 34 || state.blur > 90 || state.maxSize > 560) {
    return "This setup is visually rich. Keep it behind a short section and test it on low-end mobile hardware.";
  }
  if (state.particleCount > 22 || state.blur > 48) {
    return "This setup suits landing-page heroes. Complete a mobile performance check before shipping it full-page.";
  }
  return "This is a light setup for sections, dashboard headers, and reusable interface blocks.";
}

export default function ControlPanel({ state, setState, onRandomize, onReset, onSimilar }: ControlPanelProps) {
  const readability = useMemo(() => getAnimatedBackgroundReadability(state), [state]);

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

  function addColor() {
    setState((current) => {
      if (current.colors.length >= 6) return current;
      const color = extraColors.find((candidate) => !current.colors.includes(candidate)) ?? extraColors[current.colors.length % extraColors.length];
      return { ...current, colors: [...current.colors, color] };
    });
  }

  function removeColor(index: number) {
    setState((current) => {
      if (current.colors.length <= 2) return current;
      return { ...current, colors: current.colors.filter((_, colorIndex) => colorIndex !== index) };
    });
  }

  function updateShape(shape: BackgroundShape) {
    patch({
      shape,
      borderRadius: shape === "circle" ? 999 : state.borderRadius > 50 ? 28 : state.borderRadius,
    });
  }

  return (
    <ToolControlPanel
      title="Customize background"
      description="Adjust appearance and motion. The preview and production checks update instantly."
      footer={getPerformanceCopy(state)}
      sticky={false}
    >
      <ControlSection title="Quick actions" compact>
        <ControlGrid columns={2} compact>
          <Button size="sm" variant="primary" leftIcon={<Shuffle className="h-3.5 w-3.5" aria-hidden />} onClick={onRandomize}>Randomize</Button>
          <Button size="sm" variant="secondary" leftIcon={<Sparkles className="h-3.5 w-3.5" aria-hidden />} onClick={onSimilar}>Similar style</Button>
          <Button size="sm" variant="secondary" leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />} onClick={onReset}>Reset preset</Button>
          <Button
            size="sm"
            variant={state.isPaused ? "soft" : "secondary"}
            leftIcon={state.isPaused ? <CirclePlay className="h-3.5 w-3.5" aria-hidden /> : <CirclePause className="h-3.5 w-3.5" aria-hidden />}
            onClick={() => patch({ isPaused: !state.isPaused })}
          >
            {state.isPaused ? "Resume animation" : "Pause animation"}
          </Button>
        </ControlGrid>
      </ControlSection>

      <ControlSection title="Content preview" description="Check the background behind realistic interface content before export." compact>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Animated background preview mode">
          {previewModes.map((mode) => {
            const active = state.previewMode === mode.value;
            const Icon = mode.icon;
            return (
              <button
                key={mode.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => patch({ previewMode: mode.value, showContent: mode.value !== "empty" })}
                className={cn(
                  "min-w-0 rounded-[var(--radius-md)] border p-3 text-left transition focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]",
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-text-primary)]"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-control-hover)]",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="mt-2 block text-xs font-bold leading-4">{mode.label}</span>
                <span className="mt-0.5 block text-xs leading-4 text-[var(--color-text-tertiary)]">{mode.description}</span>
              </button>
            );
          })}
        </div>
      </ControlSection>

      <ControlSection
        title="Readability"
        description="Estimate foreground contrast across generated background samples and protect copy automatically."
        action={<Badge variant={readability.meetsNormalTextAA ? "success" : readability.protectedMinContrast >= 3 ? "warning" : "danger"}>{readability.status}</Badge>}
        compact
      >
        <div className="grid gap-1.5">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">Content foreground</span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Content foreground mode">
            {foregroundModes.map((mode) => {
              const Icon = mode.icon;
              const active = state.foregroundMode === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => patch({ foregroundMode: mode.value })}
                  className={cn(
                    "flex min-w-0 flex-col items-center gap-1.5 rounded-[var(--radius-md)] border px-2 py-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]",
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-text-primary)]"
                      : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-control-hover)]",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-[var(--color-text-primary)]">Estimated minimum contrast</p>
              <p className="mt-1 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">{readability.protectedMinContrast.toFixed(2)}:1</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">Resolved foreground</p>
              <p className="mt-1 text-xs font-black capitalize text-[var(--color-text-primary)]">{readability.resolvedTone}</p>
            </div>
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">{readability.recommendation}</p>
          <p className="mt-1 text-xs leading-4 text-[var(--color-text-tertiary)]">Estimated from {readability.sampleCount} conservative color samples. Verify the final section with real content.</p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={state.readabilityProtection}
          onClick={() => patch({ readabilityProtection: !state.readabilityProtection })}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]",
            state.readabilityProtection
              ? "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)]"
              : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]",
          )}
        >
          <span className="flex min-w-0 items-start gap-2.5">
            {state.readabilityProtection ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden /> : <ShieldOff className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" aria-hidden />}
            <span>
              <span className="block text-xs font-black text-[var(--color-text-primary)]">Protect text readability</span>
              <span className="mt-0.5 block text-xs leading-4 text-[var(--color-text-tertiary)]">Add only the minimum light or dark scrim needed to target 4.5:1.</span>
            </span>
          </span>
          <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition", state.readabilityProtection ? "bg-[var(--color-primary)]" : "bg-[var(--color-control-track)]")}>
            <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white shadow transition", state.readabilityProtection ? "left-6" : "left-1")} />
          </span>
        </button>
      </ControlSection>

      <ControlSection
        title="Palette"
        description="Use two to six accent colors. Add or remove accents without changing the base background."
        action={<span className="font-mono text-xs font-bold text-[var(--color-text-tertiary)]">{state.colors.length}/6</span>}
        compact
      >
        <ColorField label="Base background" value={state.background} onChange={(background) => patch({ background })} />
        <div className="space-y-2.5">
          {state.colors.map((color, index) => (
            <div key={`${index}-${color}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)_32px] items-end gap-2">
              <ColorField label={`Accent ${index + 1}`} value={color} onChange={(value) => updateColor(index, value)} />
              <Button
                size="icon"
                variant="ghost"
                disabled={state.colors.length <= 2}
                onClick={() => removeColor(index)}
                aria-label={`Remove accent ${index + 1}`}
                className="mb-0.5 h-8 w-8"
                leftIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
              >
                Remove accent {index + 1}
              </Button>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" fullWidth disabled={state.colors.length >= 6} leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden />} onClick={addColor}>
          Add accent color
        </Button>
      </ControlSection>

      <ControlSection title="Composition" description="Choose the background structure and particle shape." compact>
        <label className="grid gap-1.5">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">Gradient structure</span>
          <SegmentedControl
            ariaLabel="Gradient structure"
            value={state.gradientStyle}
            onChange={(gradientStyle) => patch({ gradientStyle })}
            options={gradientStyles.map((style) => ({ value: style, label: style }))}
            layout="grid"
            fullWidth
          />
        </label>
        <label className="grid gap-1.5">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">Particle shape</span>
          <SegmentedControl
            ariaLabel="Particle shape"
            value={state.shape}
            onChange={updateShape}
            options={shapes.map((shape) => ({ value: shape, label: shape === "soft-square" ? "Soft square" : shape }))}
            layout="grid"
            fullWidth
          />
        </label>
        <SliderNumberField label="Density" hint="Number of animated elements" value={state.particleCount} min={4} max={44} onChange={(particleCount) => patch({ particleCount })} />
        {state.shape !== "circle" ? (
          <SliderNumberField label="Corner radius" value={state.borderRadius} min={0} max={50} unit="%" onChange={(borderRadius) => patch({ borderRadius })} />
        ) : (
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-2.5 text-xs leading-5 text-[var(--color-text-tertiary)]">
            <Boxes className="h-4 w-4 shrink-0" aria-hidden />
            Circle uses a fixed full radius, so no radius control is needed.
          </div>
        )}
      </ControlSection>

      <ControlSection title="Motion" compact>
        <SliderNumberField label="Speed" value={state.speed} min={0.3} max={1.8} step={0.05} unit="x" onChange={(speed) => patch({ speed })} />
        <SliderNumberField label="Intensity" value={state.intensity} min={0.1} max={1.4} step={0.05} onChange={(intensity) => patch({ intensity })} />
      </ControlSection>

      <ControlSection title="Particle size" compact>
        <SliderNumberField label="Minimum size" value={state.minSize} min={4} max={320} unit="px" onChange={(minSize) => patch({ minSize: Math.min(minSize, state.maxSize - 4) })} />
        <SliderNumberField label="Maximum size" value={state.maxSize} min={24} max={720} unit="px" onChange={(maxSize) => patch({ maxSize: Math.max(maxSize, state.minSize + 4) })} />
      </ControlSection>

      <ControlSection title="Effects" compact>
        <SliderNumberField label="Blur" value={state.blur} min={0} max={120} unit="px" onChange={(blur) => patch({ blur })} />
        <SliderNumberField label="Opacity" value={state.opacity} min={0.1} max={0.95} step={0.01} onChange={(opacity) => patch({ opacity })} />
        <SliderNumberField label="Glow" value={state.glow} min={0} max={110} unit="px" onChange={(glow) => patch({ glow })} />
        <label className="grid gap-1.5">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">Blend mode</span>
          <Select size="sm" value={state.blendMode} onChange={(event) => patch({ blendMode: event.target.value as BlendMode })}>
            {blendModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </Select>
        </label>
      </ControlSection>
    </ToolControlPanel>
  );
}
