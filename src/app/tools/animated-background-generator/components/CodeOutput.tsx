"use client";

import { CodeOutputPanel, type CodeOutputTab } from "@/features/tools/components";
import type { AnimatedBackgroundState } from "@/types/animatedBackgroundTypes";

interface CodeOutputProps {
  html: string;
  css: string;
  state: AnimatedBackgroundState;
  particleCount: number;
}

function cssVariablesSnippet(state: AnimatedBackgroundState) {
  return `:root {
  --darma-bg-base: ${state.background};
  --darma-bg-color-1: ${state.colors[0] ?? "#38bdf8"};
  --darma-bg-color-2: ${state.colors[1] ?? "#6366f1"};
  --darma-bg-color-3: ${state.colors[2] ?? "#a855f7"};
  --darma-bg-color-4: ${state.colors[3] ?? state.colors[0] ?? "#38bdf8"};
  --darma-bg-speed: ${state.speed.toFixed(2)};
  --darma-bg-blur: ${state.blur}px;
  --darma-bg-glow: ${state.glow}px;
  --darma-bg-opacity: ${state.opacity.toFixed(2)};
  --darma-bg-blend-mode: ${state.blendMode};
}`;
}

function reactSnippet(css: string, particleCount: number) {
  return `export function AnimatedBackground() {
  return (
    <div className="darma-animated-bg">
      <style>{\`
${css}
\`}</style>
      {Array.from({ length: ${particleCount} }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}`;
}

function tailwindSnippet(html: string, css: string) {
  return `{/* The animation relies on custom keyframes, so keep this CSS alongside your Tailwind setup. */}
<div className="relative w-full min-h-[420px] overflow-hidden rounded-3xl">
${html
    .split("\n")
    .map((line) => (line ? `  ${line}` : line))
    .join("\n")}
</div>

<style>
${css}
</style>`;
}

function tokenJsonSnippet(state: AnimatedBackgroundState, particleCount: number) {
  return JSON.stringify(
    {
      name: "animated-background",
      preset: state.presetId,
      background: state.background,
      colors: state.colors,
      gradientStyle: state.gradientStyle,
      shape: state.shape,
      particleCount,
      size: { min: state.minSize, max: state.maxSize },
      motion: { speed: state.speed, intensity: state.intensity, reducedMotion: true },
      effects: { blur: state.blur, glow: state.glow, opacity: state.opacity, blendMode: state.blendMode },
    },
    null,
    2,
  );
}

function reducedMotionCssSnippet() {
  return `@media (prefers-reduced-motion: reduce) {
  .darma-animated-bg span,
  .darma-animated-bg::after {
    animation: none !important;
  }
}`;
}

export default function CodeOutput({ html, css, state, particleCount }: CodeOutputProps) {
  const tabs: CodeOutputTab[] = [
    { id: "full", label: "HTML + CSS", language: "html", filename: "animated-background.html", code: `${html}\n\n<style>\n${css}\n</style>` },
    { id: "css", label: "CSS", language: "css", filename: "animated-background.css", code: css },
    { id: "vars", label: "CSS vars", language: "css", filename: "animated-background.tokens.css", code: cssVariablesSnippet(state) },
    { id: "react", label: "React", language: "tsx", filename: "AnimatedBackground.tsx", code: reactSnippet(css, particleCount) },
    { id: "tailwind", label: "Tailwind", language: "html", filename: "animated-background-tailwind.html", code: tailwindSnippet(html, css) },
    { id: "tokens", label: "Token JSON", language: "json", filename: "animated-background.tokens.json", code: tokenJsonSnippet(state, particleCount) },
    { id: "motion", label: "Reduced motion", language: "css", filename: "animated-background-reduced-motion.css", code: reducedMotionCssSnippet() },
  ];

  return (
    <CodeOutputPanel
      title="Animated background code"
      description="Copy complete HTML/CSS, scoped CSS, CSS variables, a React component, Tailwind starter, or design tokens."
      tabs={tabs}
      defaultTab="full"
    />
  );
}
