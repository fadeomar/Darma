"use client";

import React, { useState } from "react";
import Preview from "./Preview";
import Configuration from "./Configuration";
import VariantSelector from "@/components/VariantSelector";
import CodeEditor from "@/components/CodeEditor";
import type { State } from "./types";
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
    <div className="space-y-4">
      <style>{bodyStyles}</style>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left: preview only */}
        <div className="rounded-2xl border border-black/10 bg-slate-50 p-5">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Preview</p>
          <Preview state={state} />
        </div>

        {/* Right: variant selector + configuration */}
        <div className="rounded-2xl border border-black/10 bg-slate-50 p-5 space-y-4">
          <VariantSelector
            label="Select background variant"
            variants={["particles", "bubbles", "explosion", "custom"]}
            selected={state.variant}
            handleSelect={handleVariantSelect}
          />
          <Configuration state={state} setState={setState} />
        </div>
      </div>

      {/* Code output: full-width, below */}
      <div className="rounded-2xl border border-black/10 bg-slate-50 p-5">
        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Generated code</p>
        <CodeEditor
          code={`<div class="animated-background"></div>\n<style>\n${handleBackgroundStyle(state)}\n</style>`}
          language="html"
          showCopyButton
          setCode={() => {}}
          analyticsContext="code from animated background"
        />
      </div>
    </div>
  );
}
