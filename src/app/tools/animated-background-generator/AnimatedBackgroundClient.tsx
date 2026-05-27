"use client";

import { useMemo, useState } from "react";
import type { AnimatedBackgroundState, BackgroundPreset } from "@/types/animatedBackgroundTypes";
import { presets, presetToState, getPreset } from "./lib/presets";
import { generateParticleData } from "./lib/generateParticleData";
import { generateCss } from "./lib/generateCss";
import { generateHtml } from "./lib/generateHtml";
import PresetGallery from "./components/PresetGallery";
import PreviewPanel from "./components/PreviewPanel";
import ControlPanel from "./components/ControlPanel";
import CodeOutput from "./components/CodeOutput";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";

const initialState = presetToState(presets[0]);

function randomSeed() {
  return Math.floor(Math.random() * 2_000_000) + 1;
}

export default function AnimatedBackgroundClient() {
  const [state, setState] = useState<AnimatedBackgroundState>(initialState);

  const particles = useMemo(
    () => generateParticleData(state),
    [
      state.seed,
      state.particleCount,
      state.minSize,
      state.maxSize,
      state.speed,
      state.intensity,
      state.opacity,
      state.colors,
    ],
  );

  // Exported code always uses the running (non-paused) animation.
  const css = useMemo(() => generateCss(state, particles), [state, particles]);
  const html = useMemo(() => generateHtml(particles), [particles]);

  const handleSelect = (preset: BackgroundPreset) => setState(presetToState(preset));
  const handleReset = () => setState(presetToState(getPreset(state.presetId)));
  const handleRandomize = () => setState((current) => ({ ...current, seed: randomSeed() }));
  const handleSimilar = () => setState((current) => ({ ...current, seed: current.seed + 137 }));

  return (
    <ToolLayoutVisualGenerator
      previewSlot={<PreviewPanel state={state} particles={particles} />}
      controlsSlot={
        <ControlPanel
          state={state}
          setState={setState}
          onRandomize={handleRandomize}
          onReset={handleReset}
          onSimilar={handleSimilar}
        />
      }
      presetsSlot={<PresetGallery presets={presets} activeId={state.presetId} onSelect={handleSelect} />}
      codeSlot={<CodeOutput html={html} css={css} particleCount={particles.length} />}
    />
  );
}
