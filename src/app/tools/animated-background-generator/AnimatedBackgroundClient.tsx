"use client";

import { useMemo, useState } from "react";
import { Maximize2, RotateCcw, Shuffle } from "lucide-react";
import { Button, CopyButton, Input, Select, Slider, Tabs } from "@/components/ui";
import { cn } from "@/lib/cn";
import { animatedBackgroundPresets, defaultAnimatedBackgroundConfig } from "./presets";
import {
  generateAnimatedBackgroundCss,
  generateAnimatedBackgroundHtml,
  generateReactStyleSnippet,
  generateTailwindSnippet,
} from "./generators";
import type { AnimatedBackgroundConfig, AnimatedBackgroundType, AnimationDirection } from "./types";

const outputTabs = [
  { value: "css", label: "CSS" },
  { value: "tailwind", label: "Tailwind" },
  { value: "react", label: "React style" },
] as const;

type OutputTab = (typeof outputTabs)[number]["value"];

const backgroundTypes: Array<{ value: AnimatedBackgroundType; label: string }> = [
  { value: "gradient-mesh", label: "Gradient mesh" },
  { value: "floating-blobs", label: "Floating blobs" },
  { value: "grid-animation", label: "Grid animation" },
  { value: "particles", label: "Particles" },
  { value: "aurora", label: "Aurora" },
  { value: "noise-overlay", label: "Noise overlay" },
  { value: "radial-glow", label: "Radial glow" },
  { value: "conic-gradient", label: "Conic gradient" },
  { value: "css-waves", label: "CSS waves" },
  { value: "spotlight", label: "Spotlight" },
];

const colorPool = ["#6366f1", "#ec4899", "#22d3ee", "#f97316", "#14b8a6", "#a855f7", "#f43f5e", "#a3e635", "#60a5fa", "#facc15"];

function randomFrom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function updateColor(config: AnimatedBackgroundConfig, index: number, value: string): AnimatedBackgroundConfig {
  const colors = [...config.colors];
  colors[index] = value;
  return { ...config, colors };
}

export default function AnimatedBackgroundClient() {
  const [config, setConfig] = useState<AnimatedBackgroundConfig>(defaultAnimatedBackgroundConfig);
  const [output, setOutput] = useState<OutputTab>("css");
  const [fullscreen, setFullscreen] = useState(false);

  function handleOutputChange(value: OutputTab) {
    setOutput(value);
  }

  const css = useMemo(() => generateAnimatedBackgroundCss(config), [config]);
  const code = output === "css" ? css : output === "tailwind" ? generateTailwindSnippet(config) : generateReactStyleSnippet(config);
  const previewClass = cn("darma-animated-background min-h-[320px] md:min-h-[420px]", fullscreen && "fixed inset-4 z-50 min-h-0 rounded-[28px] shadow-2xl");

  function applyPreset(id: string) {
    const preset = animatedBackgroundPresets.find((item) => item.id === id);
    if (preset) setConfig(preset.config);
  }

  function randomize() {
    const colors = Array.from({ length: 4 }, () => randomFrom(colorPool));
    setConfig({
      ...config,
      type: randomFrom(backgroundTypes).value,
      colors,
      colorCount: Math.floor(Math.random() * 3) + 2,
      speed: Math.floor(Math.random() * 18) + 12,
      blur: Math.floor(Math.random() * 38),
      opacity: Number((Math.random() * 0.35 + 0.55).toFixed(2)),
      size: Math.floor(Math.random() * 44) + 42,
      direction: randomFrom<AnimationDirection>(["normal", "reverse", "alternate"]),
    });
  }

  return (
    <div className="space-y-6">
      <style>{css}</style>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
          <div className={previewClass} aria-label="Animated background preview" />
          {fullscreen ? (
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-zoom-out bg-black/40"
              aria-label="Close fullscreen preview"
              onClick={() => setFullscreen(false)}
            />
          ) : null}
        </div>

        <div className="space-y-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-[var(--color-text)]">Preset</label>
            <Select onChange={(event) => applyPreset(event.target.value)} value={animatedBackgroundPresets.find((item) => item.config === config)?.id ?? config.type}>
              {animatedBackgroundPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold text-[var(--color-text)]">Background type</label>
            <Select value={config.type} onChange={(event) => setConfig({ ...config, type: event.target.value as AnimatedBackgroundType })}>
              {backgroundTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text)]">
              Base color
              <Input type="color" value={config.backgroundColor} onChange={(event) => setConfig({ ...config, backgroundColor: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text)]">
              Direction
              <Select value={config.direction} onChange={(event) => setConfig({ ...config, direction: event.target.value as AnimationDirection })}>
                <option value="normal">Normal</option>
                <option value="reverse">Reverse</option>
                <option value="alternate">Alternate</option>
              </Select>
            </label>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {config.colors.map((color, index) => (
              <label key={index} className="grid gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
                Color {index + 1}
                <Input type="color" value={color} onChange={(event) => setConfig(updateColor(config, index, event.target.value))} />
              </label>
            ))}
          </div>

          {[
            ["Speed", "speed", 6, 42, 1],
            ["Blur", "blur", 0, 60, 1],
            ["Opacity", "opacity", 0.2, 1, 0.01],
            ["Color count", "colorCount", 2, 4, 1],
            ["Background size", "size", 28, 96, 1],
          ].map(([label, key, min, max, step]) => (
            <label key={key as string} className="grid gap-1 text-sm font-semibold text-[var(--color-text)]">
              <span className="flex justify-between"><span>{label}</span><span className="text-[var(--color-text-muted)]">{String(config[key as keyof AnimatedBackgroundConfig])}</span></span>
              <Slider
                min={min as number}
                max={max as number}
                step={step as number}
                value={Number(config[key as keyof AnimatedBackgroundConfig])}
                onChange={(event) => setConfig({ ...config, [key as string]: Number(event.target.value) })}
              />
            </label>
          ))}

          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" onClick={() => setFullscreen(true)} leftIcon={<Maximize2 className="h-4 w-4" />}>Full</Button>
            <Button variant="secondary" onClick={randomize} leftIcon={<Shuffle className="h-4 w-4" />}>Random</Button>
            <Button variant="ghost" onClick={() => setConfig(defaultAnimatedBackgroundConfig)} leftIcon={<RotateCcw className="h-4 w-4" />}>Reset</Button>
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs items={outputTabs} value={output} onChange={handleOutputChange} ariaLabel="Output format" />
          <CopyButton text={output === "css" ? generateAnimatedBackgroundHtml(config) : code}>Copy {output === "css" ? "HTML + CSS" : output}</CopyButton>
        </div>
        <pre className="mt-4 max-h-[420px] overflow-auto rounded-[var(--radius-md)] bg-slate-950 p-4 text-xs leading-6 text-slate-100"><code>{code}</code></pre>
      </div>
    </div>
  );
}
