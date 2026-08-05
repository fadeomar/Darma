"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Braces, Check, Gamepad2, GraduationCap, SlidersHorizontal, Sparkles } from "lucide-react";
import { withGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";

type DemoMode = "build" | "analyze" | "learn" | "play";

type ModeDefinition = {
  id: DemoMode;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Braces;
};

const MODES: ModeDefinition[] = [
  {
    id: "build",
    label: "Build",
    eyebrow: "Live generator",
    title: "Shape a component and see the result immediately.",
    description: "Controls stay beside the preview, and the output is ready to copy or export.",
    icon: Braces,
  },
  {
    id: "analyze",
    label: "Analyze",
    eyebrow: "Decision surface",
    title: "Turn raw values into one clear result and useful context.",
    description: "Primary outcomes stay prominent while detailed checks remain available below.",
    icon: BarChart3,
  },
  {
    id: "learn",
    label: "Learn",
    eyebrow: "Connected route",
    title: "Move through a path with checkpoints instead of collecting tabs.",
    description: "Each stage connects concepts, cataloged references, practice, and evidence.",
    icon: GraduationCap,
  },
  {
    id: "play",
    label: "Play",
    eyebrow: "Quick reset",
    title: "Take a focused break without leaving the browser.",
    description: "Darma games use clear controls, local progress, and accessible player settings.",
    icon: Gamepad2,
  },
];

export function LandingWorkbenchDemo() {
  const [mode, setMode] = useState<DemoMode>("build");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const current = useMemo(() => MODES.find((item) => item.id === mode) ?? MODES[0], [mode]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || userPrefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    withGsap(({ gsap }) => {
      if (cancelled || !rootRef.current) return;
      const context = gsap.context(() => {
        const stage = root.querySelector<HTMLElement>("[data-workbench-stage]");
        const details = root.querySelectorAll<HTMLElement>("[data-workbench-detail]");
        const indicators = root.querySelectorAll<HTMLElement>("[data-workbench-indicator]");

        gsap.fromTo(stage, { opacity: 0.7, y: 12, scale: 0.988 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out", clearProps: "transform,opacity" });
        gsap.fromTo(details, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out", clearProps: "transform,opacity" });
        gsap.fromTo(indicators, { scaleX: 0.35, opacity: 0.5, transformOrigin: "left" }, { scaleX: 1, opacity: 1, duration: 0.55, stagger: 0.06, ease: "power3.out", clearProps: "transform,opacity" });
      }, root);
      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [mode]);

  return (
    <div ref={rootRef} className="landing-workbench">
      <div className="landing-workbench-topbar">
        <div>
          <p className="landing-workbench-kicker">Interactive preview</p>
          <h3>One workspace, different kinds of progress.</h3>
        </div>
        <div className="landing-workbench-window-controls" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="landing-workbench-tabs" role="tablist" aria-label="Preview Darma workspace modes">
        {MODES.map((item) => {
          const Icon = item.icon;
          const selected = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="landing-workbench-panel"
              className="landing-workbench-tab"
              data-active={selected ? "true" : "false"}
              onClick={() => setMode(item.id)}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </div>

      <div id="landing-workbench-panel" role="tabpanel" className="landing-workbench-grid" data-workbench-stage>
        <aside className="landing-workbench-controls">
          <div className="landing-workbench-region-title">
            <span><SlidersHorizontal className="h-4 w-4" aria-hidden /></span>
            <div>
              <p>Controls</p>
              <small>Change the current setup</small>
            </div>
          </div>

          {mode === "build" ? <BuildControls /> : null}
          {mode === "analyze" ? <AnalyzeControls /> : null}
          {mode === "learn" ? <LearnControls /> : null}
          {mode === "play" ? <PlayControls /> : null}

          <button type="button" className="landing-workbench-primary-action">
            {mode === "build" ? "Copy component" : mode === "analyze" ? "Open full analysis" : mode === "learn" ? "Continue the route" : "Start a quick game"}
            <Sparkles className="h-4 w-4" aria-hidden />
          </button>
        </aside>

        <section className="landing-workbench-preview" aria-live="polite">
          <div className="landing-workbench-region-title">
            <span><current.icon className="h-4 w-4" aria-hidden /></span>
            <div>
              <p>{current.eyebrow}</p>
              <small>Updates with the selected mode</small>
            </div>
            <span className="landing-workbench-status"><span aria-hidden /> Live</span>
          </div>

          <div className="landing-workbench-preview-stage">
            {mode === "build" ? <BuildPreview /> : null}
            {mode === "analyze" ? <AnalyzePreview /> : null}
            {mode === "learn" ? <LearnPreview /> : null}
            {mode === "play" ? <PlayPreview /> : null}
          </div>

          <div className="landing-workbench-copy" data-workbench-detail>
            <p>{current.title}</p>
            <span>{current.description}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

function SliderRow({ label, value, width }: { label: string; value: string; width: string }) {
  return (
    <div className="landing-control-row" data-workbench-detail>
      <div><span>{label}</span><strong>{value}</strong></div>
      <div className="landing-control-track"><span data-workbench-indicator style={{ width }} /></div>
    </div>
  );
}

function BuildControls() {
  return (
    <div className="landing-workbench-control-stack">
      <SliderRow label="Radius" value="24 px" width="72%" />
      <SliderRow label="Depth" value="Soft" width="52%" />
      <div className="landing-control-swatches" data-workbench-detail>
        <span className="is-active" />
        <span />
        <span />
        <span />
      </div>
      <div className="landing-control-toggle" data-workbench-detail><span>Accessible focus state</span><span className="is-on"><i /></span></div>
    </div>
  );
}

function AnalyzeControls() {
  return (
    <div className="landing-workbench-control-stack">
      <div className="landing-control-input" data-workbench-detail><span>Current value</span><strong>3.42</strong></div>
      <div className="landing-control-input" data-workbench-detail><span>Target</span><strong>3.80</strong></div>
      <SliderRow label="Confidence" value="High" width="84%" />
      <div className="landing-control-toggle" data-workbench-detail><span>Show practical context</span><span className="is-on"><i /></span></div>
    </div>
  );
}

function LearnControls() {
  return (
    <div className="landing-workbench-control-stack">
      {[
        ["01", "Foundations", true],
        ["02", "Build a small project", true],
        ["03", "Validate the result", false],
        ["04", "Create evidence", false],
      ].map(([number, label, done]) => (
        <div key={String(number)} className="landing-route-control" data-workbench-detail data-complete={done ? "true" : "false"}>
          <span>{number}</span><p>{label}</p>{done ? <Check className="h-4 w-4" aria-hidden /> : <i />}
        </div>
      ))}
    </div>
  );
}

function PlayControls() {
  return (
    <div className="landing-workbench-control-stack">
      <div className="landing-control-segment" data-workbench-detail>
        <span className="is-active">Quick</span><span>Classic</span><span>Puzzle</span>
      </div>
      <div className="landing-control-toggle" data-workbench-detail><span>Sound</span><span className="is-on"><i /></span></div>
      <div className="landing-control-toggle" data-workbench-detail><span>Reduced motion</span><span><i /></span></div>
      <div className="landing-control-input" data-workbench-detail><span>Best local score</span><strong>8,420</strong></div>
    </div>
  );
}

function BuildPreview() {
  return (
    <div className="landing-build-preview" aria-hidden>
      <span className="landing-build-orb landing-build-orb-one" />
      <span className="landing-build-orb landing-build-orb-two" />
      <div className="landing-build-card">
        <div className="landing-build-card-icon">D</div>
        <div><span /><span /><span /></div>
        <button type="button" tabIndex={-1}>Open workspace <span>↗</span></button>
      </div>
      <div className="landing-build-code"><span>.card</span> <i>{"{"}</i> radius: <b>24px</b>; <i>{"}"}</i></div>
    </div>
  );
}

function AnalyzePreview() {
  return (
    <div className="landing-analyze-preview" aria-hidden>
      <div className="landing-analyze-score"><span>Result</span><strong>3.57</strong><small>Projected outcome</small></div>
      <div className="landing-analyze-chart">
        {[42, 68, 55, 82, 73, 91].map((height, index) => <span key={height} data-workbench-indicator style={{ height: `${height}%` }}><i>{index + 1}</i></span>)}
      </div>
      <div className="landing-analyze-insight"><Check className="h-4 w-4" />On track with one clear next action</div>
    </div>
  );
}

function LearnPreview() {
  return (
    <div className="landing-learn-preview" aria-hidden>
      <svg viewBox="0 0 560 270">
        <path d="M74 136 C145 54 215 214 282 132 C347 55 421 204 494 120" fill="none" stroke="var(--color-primary-border)" strokeWidth="10" strokeLinecap="round" />
        {[{ x: 74, y: 136, label: "1" }, { x: 200, y: 150, label: "2" }, { x: 327, y: 94, label: "3" }, { x: 494, y: 120, label: "4" }].map((node, index) => (
          <g key={node.label} transform={`translate(${node.x} ${node.y})`}>
            <circle r="31" fill={index < 2 ? "var(--color-primary)" : "var(--color-surface-raised)"} stroke="var(--color-primary)" strokeWidth="3" />
            <text textAnchor="middle" dy="7" fill={index < 2 ? "var(--color-primary-text)" : "var(--color-primary)"} fontSize="20" fontWeight="900">{node.label}</text>
          </g>
        ))}
      </svg>
      <div className="landing-learn-note"><span>Next checkpoint</span><strong>Build a responsive interface and explain your decisions.</strong></div>
    </div>
  );
}

function PlayPreview() {
  return (
    <div className="landing-play-preview" aria-hidden>
      <div className="landing-play-sky"><span /><span /><span /></div>
      <div className="landing-play-board">
        {Array.from({ length: 35 }, (_, index) => <span key={index} className={index === 17 ? "is-player" : [7, 11, 26, 30].includes(index) ? "is-goal" : ""} />)}
      </div>
      <div className="landing-play-score"><span>SCORE</span><strong>08420</strong><small>LOCAL BEST</small></div>
    </div>
  );
}
