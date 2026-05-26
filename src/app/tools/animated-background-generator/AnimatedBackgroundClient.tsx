"use client";

import React, { CSSProperties, useState } from "react";
import Preview from "./Preview";
import Configuration from "./Configuration";
import VariantSelector from "@/components/VariantSelector";
import Title from "@/components/Title";
import CodeEditor from "@/components/CodeEditor";
import type { State } from "@/types/animatedBackgroundTypes";
import { handleBackgroundStyle } from "./styles";

const defaultParticleState: State = {
  variant: "particles",
  particleCount: 20,
  particleSize: "10vmin",
  animationDuration: "45s",
  colors: ["#E45A84", "#FFACAC", "#583C87"],
  backgroundColor: "#3E1E68",
  particleShape: "circle",
  animationTiming: "linear",
  animationType: "rotate",
};

const defaultBubbleState: State = {
  variant: "bubbles",
  particleCount: 10,
  particleSize: "10vmin",
  animationDuration: "19s",
  colors: ["rgba(255, 255, 255, 0.2)"],
  backgroundColor: "#4e54c8",
  particleShape: "circle",
  animationTiming: "linear",
  animationType: "float-up",
  morphToCircle: true,
};

const defaultExplosionState: State = {
  variant: "explosion",
  particleCount: 14,
  particleSize: "10px",
  animationDuration: "7s",
  colors: ["#0039ad", "#0046d4"],
  backgroundColor: "#0040C1",
  particleShape: "circle",
  animationTiming: "ease-in",
  animationType: "explode",
  maxScale: 20,
};

const defaultCustomState: State = {
  variant: "custom",
  particleCount: 30,
  particleSize: "15px",
  animationDuration: "10s",
  colors: ["#00ff99", "#ff0066"],
  backgroundColor: "#222222",
  particleShape: "circle",
  animationTiming: "ease",
  animationType: "rotate",
  opacity: 0.8,
  speed: 1,
};

export default function AnimatedBackgroundClient() {
  const [state, setState] = useState<State>(defaultParticleState);

  const handleVariantSelect = (value: string) => {
    switch (value) {
      case "particles":
        setState(defaultParticleState);
        break;
      case "bubbles":
        setState(defaultBubbleState);
        break;
      case "explosion":
        setState(defaultExplosionState);
        break;
      case "custom":
        setState(defaultCustomState);
        break;
      default:
        setState(defaultParticleState);
    }
  };

  const bodyStyles = `
    ${handleBackgroundStyle(state)}
  `;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <style>{bodyStyles}</style>

      <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-5">
        <VariantSelector
          label="Select background variant"
          variants={["particles", "bubbles", "explosion", "custom"]}
          selected={state.variant}
          handleSelect={handleVariantSelect}
        />
        <Title
          variant="h4"
          as="h2"
          label="Preview"
          style={{ "--angle": "90deg" } as CSSProperties}
          className="my-6 text-gray-900"
        />
        <Preview state={state} />
        <Title
          variant="h4"
          as="h2"
          label="Generated code"
          style={{ "--angle": "90deg" } as CSSProperties}
          className="my-6 text-gray-900"
        />
        <CodeEditor
          code={`<div class="animated-background"></div>\n<style>\n${handleBackgroundStyle(state)}\n</style>`}
          language="html"
          showCopyButton
          setCode={() => {}}
          analyticsContext="code from animated background"
        />
      </div>

      <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-5">
        <Configuration state={state} setState={setState} />
      </div>
    </div>
  );
}
