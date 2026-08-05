"use client";

import { CodeOutputPanel, type CodeOutputTab } from "@/features/tools/components";
import { downloadTextFile } from "@/features/tools/export/downloadText";
import type { AnimatedBackgroundState } from "@/types/animatedBackgroundTypes";
import { getAnimatedBackgroundReadability, rgbaFromHex } from "../lib/readability";

interface CodeOutputProps {
  html: string;
  css: string;
  state: AnimatedBackgroundState;
  particleCount: number;
}

function cssVariablesSnippet(state: AnimatedBackgroundState) {
  const readability = getAnimatedBackgroundReadability(state);
  const colorVariables = state.colors
    .map((color, index) => `  --darma-bg-color-${index + 1}: ${color};`)
    .join("\n");

  return `:root {
  --darma-bg-base: ${state.background};
${colorVariables}
  --darma-bg-speed: ${state.speed.toFixed(2)};
  --darma-bg-blur: ${state.blur}px;
  --darma-bg-glow: ${state.glow}px;
  --darma-bg-opacity: ${state.opacity.toFixed(2)};
  --darma-bg-blend-mode: ${state.blendMode};
  --darma-content-color: ${readability.foregroundColor};
  --darma-content-muted: ${rgbaFromHex(readability.foregroundColor, 0.74)};
  --darma-content-scrim: ${rgbaFromHex(readability.scrimColor, readability.scrimOpacity)};
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
  const readability = getAnimatedBackgroundReadability(state);
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
      readability: {
        foregroundMode: state.foregroundMode,
        resolvedTone: readability.resolvedTone,
        foregroundColor: readability.foregroundColor,
        estimatedMinimumContrast: readability.protectedMinContrast,
        protection: state.readabilityProtection,
        scrimColor: readability.scrimColor,
        scrimOpacity: readability.scrimOpacity,
      },
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
      onDownload={(tab) => downloadTextFile({
        content: tab.code,
        filename: tab.filename ?? `animated-background.${tab.language ?? "txt"}`,
        mimeType: "text/plain;charset=utf-8",
      })}
    />
  );
}
