"use client";

import { useEffect, useRef } from "react";
import type { AnimatedBackgroundState, ParticleData } from "@/types/animatedBackgroundTypes";
import { generateCss } from "../lib/generateCss";

interface PreviewPanelProps {
  state: AnimatedBackgroundState;
  particles: ParticleData[];
}

function HeroPreview() {
  return (
    <div className="relative z-20 flex min-h-[640px] flex-col justify-between p-6 text-white sm:p-10 lg:p-12">
      <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/10 px-4 py-3 text-xs backdrop-blur-md">
        <strong>Darma Studio</strong>
        <div className="hidden gap-4 text-white/70 sm:flex"><span>Tools</span><span>Showcase</span><span>Snippets</span></div>
      </div>
      <div className="max-w-3xl py-20">
        <div className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur">Production-ready background</div>
        <h2 className="text-5xl font-black tracking-tight sm:text-7xl">Create premium animated backgrounds.</h2>
        <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">Tune a professional example, preview it in a real hero section, then copy clean HTML and CSS for your project.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <div className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">Start building</div>
          <div className="rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white/90 backdrop-blur">View examples</div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {["Responsive", "CSS export", "Reduced motion"].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-semibold text-white/80 backdrop-blur">{item}</div>)}
      </div>
    </div>
  );
}

function CardsPreview() {
  return (
    <div className="relative z-20 min-h-[640px] p-6 text-white sm:p-10 lg:p-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">Card UI preview</p>
          <h2 className="mt-3 text-4xl font-black sm:text-6xl">A background behind real interface cards.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {["Starter", "Growth", "Enterprise"].map((title, index) => (
            <div key={title} className="rounded-[1.75rem] border border-white/12 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
              <div className="mb-8 h-12 w-12 rounded-2xl bg-white/15" />
              <h3 className="text-2xl font-black">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/70">Use this mode to check readability, contrast, and premium UI depth.</p>
              <div className="mt-8 rounded-full bg-white px-4 py-3 text-center text-sm font-bold text-slate-950">Choose plan</div>
              {index === 1 && <div className="mt-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-white/60">Most popular</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative z-20 min-h-[640px] p-5 text-white sm:p-8 lg:p-10">
      <div className="grid min-h-[560px] gap-4 lg:grid-cols-[260px,1fr]">
        <aside className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
          <strong>Darma Analytics</strong>
          <div className="mt-8 space-y-3 text-sm text-white/70">
            {['Overview', 'Revenue', 'Users', 'Settings'].map((item) => <div key={item} className="rounded-2xl bg-white/10 px-4 py-3">{item}</div>)}
          </div>
        </aside>
        <main className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm text-white/60">Live dashboard</p><h2 className="text-3xl font-black">$128.4K revenue</h2></div>
            <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950">Export report</div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[["Conversion", "68%"], ["Retention", "84%"], ["Active users", "92%"]].map(([item, value]) => <div key={item} className="rounded-3xl border border-white/10 bg-black/20 p-5"><p className="text-sm text-white/60">{item}</p><div className="mt-3 text-3xl font-black">{value}</div></div>)}
          </div>
          <div className="mt-4 h-64 rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="flex h-full items-end gap-3">
              {[38, 62, 54, 86, 70, 92, 74, 98, 84].map((height, index) => <div key={index} className="flex-1 rounded-t-xl bg-white/25" style={{ height: `${height}%` }} />)}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PreviewPanel({ state, particles }: PreviewPanelProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const css = generateCss(state, particles, { paused: state.isPaused });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && document.fullscreenElement) document.exitFullscreen();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const openFullscreen = async () => {
    const element = wrapperRef.current;
    if (!element || !element.requestFullscreen) return;
    await element.requestFullscreen();
  };

  return (
    <div ref={wrapperRef} className="abg-preview-shell group relative overflow-hidden rounded-[2rem] border border-[var(--color-border-default)] bg-slate-950 shadow-2xl">
      <style>{css}</style>
      <button
        type="button"
        onClick={openFullscreen}
        className="absolute right-4 top-4 z-30 rounded-full border border-white/15 bg-black/45 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur transition hover:bg-black/65"
      >
        Enter fullscreen
      </button>
      <div className="pointer-events-none absolute left-4 top-4 z-30 hidden rounded-full bg-black/45 px-4 py-2 text-xs font-bold text-white backdrop-blur group-fullscreen:block">
        Press Esc to exit fullscreen
      </div>
      <div className="darma-animated-bg min-h-[640px]">
        {particles.map((particle) => <span key={particle.id} />)}
        {state.showContent && state.previewMode === "hero" && <HeroPreview />}
        {state.showContent && state.previewMode === "cards" && <CardsPreview />}
        {state.showContent && state.previewMode === "dashboard" && <DashboardPreview />}
      </div>
    </div>
  );
}
