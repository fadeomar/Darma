"use client";

import { useMemo, useState } from "react";
import type { BackgroundPreset } from "@/types/animatedBackgroundTypes";
import { generateCss } from "./lib/generateCss";
import { generateHtml } from "./lib/generateHtml";
import { generateParticleData } from "./lib/generateParticleData";
import { getPreset, presetToState, presets } from "./lib/presets";
import CodeOutput from "./components/CodeOutput";
import ControlPanel from "./components/ControlPanel";
import PresetGallery from "./components/PresetGallery";
import PreviewPanel from "./components/PreviewPanel";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function AnimatedBackgroundClient() {
  const [state, setState] = useState(() => presetToState(presets[0]));
  const particles = useMemo(() => generateParticleData(state), [state]);
  const html = useMemo(() => generateHtml(particles), [particles]);
  const css = useMemo(() => generateCss(state, particles), [state, particles]);

  const handlePresetSelect = (preset: BackgroundPreset) => setState(presetToState(preset));
  const handleReset = () => setState(presetToState(getPreset(state.presetId)));
  const handleRandomize = () => {
    const randomPreset = presets[Math.floor(Math.random() * presets.length)] ?? presets[0];
    const base = presetToState(randomPreset);
    setState({
      ...base,
      colors: [...base.colors].sort(() => Math.random() - 0.5),
      seed: Math.floor(Math.random() * 90000) + 1000,
      particleCount: Math.min(44, Math.max(6, base.particleCount + Math.floor(Math.random() * 9) - 4)),
      speed: Number(clamp(base.speed + (Math.random() - 0.5) * 0.35, 0.35, 1.65).toFixed(2)),
      intensity: Number(clamp(base.intensity + (Math.random() - 0.5) * 0.32, 0.25, 1.35).toFixed(2)),
    });
  };

  const handleSimilar = () => {
    setState((current) => ({
      ...current,
      seed: current.seed + 137,
      particleCount: Math.round(clamp(current.particleCount + (current.seed % 5) - 2, 5, 44)),
      speed: Number(clamp(current.speed + ((current.seed % 7) - 3) * 0.03, 0.3, 1.8).toFixed(2)),
      intensity: Number(clamp(current.intensity + ((current.seed % 9) - 4) * 0.025, 0.15, 1.4).toFixed(2)),
      opacity: Number(clamp(current.opacity + ((current.seed % 11) - 5) * 0.008, 0.1, 0.95).toFixed(2)),
    }));
  };

  const activePreset = getPreset(state.presetId);

  return (
    <div className="space-y-7">
      <section className="rounded-[2rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-fuchsia-600 dark:text-fuchsia-300">High-demand examples</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-slate-50">Choose a search-ready background style</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Examples are named around real developer searches: SaaS hero backgrounds, AI website backgrounds, dashboard ambient UI, cyber grids, portfolio glows, and mesh gradients.
          </p>
        </div>
        <PresetGallery presets={presets} activeId={state.presetId} onSelect={handlePresetSelect} compact />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Full width live preview</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-slate-50">{activePreset.name}</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{activePreset.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleSimilar} className="rounded-full border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-700 dark:bg-slate-950 dark:text-cyan-200">
              Generate similar
            </button>
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
              <input type="checkbox" checked={state.showContent} onChange={(event) => setState((current) => ({ ...current, showContent: event.target.checked, previewMode: event.target.checked ? current.previewMode === "empty" ? "hero" : current.previewMode : "empty" }))} />
              Website preview
            </label>
          </div>
        </div>
        <PreviewPanel state={state} particles={particles} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {(activePreset.bestFor ?? []).map((item) => (
          <div key={item} className="rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-950/60">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Use this for</p>
            <h3 className="mt-2 font-black text-slate-950 dark:text-slate-50">{item}</h3>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <CodeOutput html={html} css={css} />
        <aside className="rounded-[2rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40 sm:p-5 xl:sticky xl:top-24 xl:self-start">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-fuchsia-600 dark:text-fuchsia-300">Control panel</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-slate-50">Tune the result</h2>
          </div>
          <ControlPanel state={state} setState={setState} onRandomize={handleRandomize} onReset={handleReset} onSimilar={handleSimilar} />
        </aside>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-950/60">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Bookmark workflow</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-slate-50">Copy production-ready code, then bookmark Darma for the next project.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          The preview and exported snippet use the same deterministic particle data, so what users see is what they copy.
        </p>
      </section>
    </div>
  );
}
