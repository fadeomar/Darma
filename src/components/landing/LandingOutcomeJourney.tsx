"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Compass,
  GitCompareArrows,
  Route,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { loadGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";

export type LandingOutcome = {
  id: "build" | "learn" | "decide" | "explore";
  index: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  stages: [string, string, string];
};

const OUTCOMES: LandingOutcome[] = [
  {
    id: "build",
    index: "01",
    icon: Wrench,
    eyebrow: "Finish a practical task",
    title: "Move from input to a usable result without losing the context.",
    description:
      "Open a focused browser workspace, keep controls next to the live result, and copy or export the outcome when it is ready.",
    href: "/tools",
    cta: "Browse browser tools",
    stages: ["INPUT", "PREVIEW", "EXPORT"],
  },
  {
    id: "learn",
    index: "02",
    icon: Route,
    eyebrow: "Learn in a useful order",
    title: "Follow a route that turns reading into evidence.",
    description:
      "Connect foundations, trusted references, checkpoints, and a practical project instead of collecting disconnected tabs.",
    href: "/learning-paths",
    cta: "Choose a learning path",
    stages: ["LEARN", "BUILD", "PROVE"],
  },
  {
    id: "decide",
    index: "03",
    icon: GitCompareArrows,
    eyebrow: "Make a decision you can explain",
    title: "See trade-offs before choosing a technology, role, or workflow.",
    description:
      "Compare daily work, constraints, maintenance, team fit, and risk. Darma keeps the surrounding context visible beside the options.",
    href: "/comparisons",
    cta: "Compare real options",
    stages: ["CONTEXT", "TRADE-OFF", "CHOICE"],
  },
  {
    id: "explore",
    index: "04",
    icon: Compass,
    eyebrow: "Explore a career direction",
    title: "Start with your interests, then inspect the work behind the title.",
    description:
      "Move from a personal starting point to responsibilities, collaborators, evidence, and the clearest next learning route.",
    href: "/career-pathfinder",
    cta: "Try Career Pathfinder",
    stages: ["YOU", "ROLE", "ROUTE"],
  },
];

export function LandingOutcomeJourney() {
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const active = OUTCOMES[activeIndex] ?? OUTCOMES[0];

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-outcome-step]"));
    if (!steps.length || userPrefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !rootRef.current) return;
      const context = gsap.context(() => {
        steps.forEach((step, index) => {
          ScrollTrigger.create({
            trigger: step,
            start: "top 58%",
            end: "bottom 42%",
            onEnter: () => setActiveIndex(index),
            onEnterBack: () => setActiveIndex(index),
          });
        });
      }, root);
      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || userPrefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    loadGsap().then(({ gsap }) => {
      if (cancelled || !rootRef.current) return;
      const context = gsap.context(() => {
        const scene = root.querySelector<HTMLElement>("[data-outcome-scene]");
        const nodes = root.querySelectorAll<SVGElement>("[data-outcome-node]");
        const paths = root.querySelectorAll<SVGPathElement>("[data-outcome-path]");
        const labels = root.querySelectorAll<HTMLElement>("[data-outcome-label]");

        gsap.fromTo(scene, { opacity: 0.72, scale: 0.982, rotate: -0.7 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.55, ease: "power3.out" });
        gsap.fromTo(nodes, { opacity: 0, scale: 0.55, transformOrigin: "center" }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.055, ease: "back.out(1.7)" });
        gsap.fromTo(paths, { strokeDasharray: 240, strokeDashoffset: 240 }, { strokeDashoffset: 0, duration: 0.75, stagger: 0.06, ease: "power2.out" });
        gsap.fromTo(labels, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.38, stagger: 0.05, ease: "power2.out" });
      }, root);
      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [activeIndex]);

  return (
    <div ref={rootRef} className="landing-outcome-journey">
      <div className="landing-outcome-visual-wrap">
        <div className="landing-outcome-visual" data-outcome-scene>
          <div className="landing-outcome-visual-topbar">
            <div>
              <span className="landing-outcome-live"><i aria-hidden /> Connected route</span>
              <strong>{active.eyebrow}</strong>
            </div>
            <span className="landing-outcome-counter">{active.index} / 04</span>
          </div>

          <OutcomeScene outcome={active} />

          <div className="landing-outcome-stage-row" aria-hidden>
            {active.stages.map((stage, index) => (
              <span key={stage} data-outcome-label>
                <i>{String(index + 1).padStart(2, "0")}</i>
                {stage}
              </span>
            ))}
          </div>

          <div className="landing-outcome-visual-caption" data-outcome-label>
            <Sparkles className="h-4 w-4" aria-hidden />
            <span>The visual changes as each outcome enters the reading line.</span>
          </div>
        </div>
      </div>

      <div className="landing-outcome-steps">
        {OUTCOMES.map((outcome, index) => {
          const Icon = outcome.icon;
          const selected = activeIndex === index;
          return (
            <article
              key={outcome.id}
              data-outcome-step
              data-active={selected ? "true" : "false"}
              className="landing-outcome-step"
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
            >
              <div className="landing-outcome-step-marker">
                <span>{outcome.index}</span>
                <i><Icon className="h-5 w-5" aria-hidden /></i>
              </div>
              <div>
                <p>{outcome.eyebrow}</p>
                <h3>{outcome.title}</h3>
                <span>{outcome.description}</span>
                <Link href={outcome.href}>
                  {outcome.cta}
                  <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function OutcomeScene({ outcome }: { outcome: LandingOutcome }) {
  return (
    <div className={`landing-outcome-scene landing-outcome-scene-${outcome.id}`} aria-hidden>
      <svg viewBox="0 0 620 390" focusable="false">
        <defs>
          <linearGradient id="outcome-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-primary)" />
            <stop offset="1" stopColor="var(--color-accent)" />
          </linearGradient>
          <filter id="outcome-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="15" stdDeviation="16" floodColor="#111111" floodOpacity="0.2" />
          </filter>
        </defs>

        <circle cx="310" cy="194" r="150" fill="var(--color-primary-soft)" opacity="0.42" />
        <circle cx="310" cy="194" r="118" fill="none" stroke="var(--color-border-default)" strokeDasharray="7 11" />
        <circle cx="310" cy="194" r="74" fill="none" stroke="var(--color-accent-border)" strokeDasharray="4 8" />

        <path data-outcome-path d="M310 194 C235 126 176 120 104 104" fill="none" stroke="url(#outcome-gradient)" strokeWidth="4" strokeLinecap="round" />
        <path data-outcome-path d="M310 194 C386 127 446 120 516 104" fill="none" stroke="url(#outcome-gradient)" strokeWidth="4" strokeLinecap="round" />
        <path data-outcome-path d="M310 194 C237 265 177 278 108 302" fill="none" stroke="url(#outcome-gradient)" strokeWidth="4" strokeLinecap="round" />
        <path data-outcome-path d="M310 194 C385 266 446 280 514 302" fill="none" stroke="url(#outcome-gradient)" strokeWidth="4" strokeLinecap="round" />

        <g data-outcome-node transform="translate(245 129)" filter="url(#outcome-shadow)">
          <rect width="130" height="130" rx="38" fill="var(--color-section-ink)" stroke="url(#outcome-gradient)" strokeWidth="3" />
          <text x="65" y="56" textAnchor="middle" fill="var(--color-text-on-ink-muted)" fontSize="11" fontWeight="900">CURRENT</text>
          <text x="65" y="86" textAnchor="middle" fill="var(--color-text-on-ink)" fontSize="25" fontWeight="950">{outcome.id.toUpperCase()}</text>
          <circle cx="105" cy="27" r="7" fill="var(--color-accent)" />
        </g>

        {outcome.id === "build" ? <BuildScene /> : null}
        {outcome.id === "learn" ? <LearnScene /> : null}
        {outcome.id === "decide" ? <DecideScene /> : null}
        {outcome.id === "explore" ? <ExploreScene /> : null}
      </svg>
    </div>
  );
}

function BuildScene() {
  return (
    <>
      <g data-outcome-node transform="translate(44 72)"><rect width="124" height="70" rx="20" fill="var(--color-tool-controls-bg)" stroke="var(--color-tool-controls-border)" /><text x="19" y="27" fill="var(--color-text-tertiary)" fontSize="10" fontWeight="900">CONTROLS</text><rect x="19" y="40" width="82" height="6" rx="3" fill="var(--color-control-track)" /><rect x="19" y="40" width="54" height="6" rx="3" fill="var(--color-primary)" /><circle cx="73" cy="43" r="8" fill="var(--color-surface-raised)" stroke="var(--color-primary)" /></g>
      <g data-outcome-node transform="translate(452 69)"><rect width="126" height="76" rx="20" fill="var(--color-tool-preview-bg)" stroke="var(--color-tool-preview-border)" /><rect x="20" y="18" width="86" height="40" rx="13" fill="url(#outcome-gradient)" /><circle cx="102" cy="21" r="5" fill="var(--color-accent)" /></g>
      <g data-outcome-node transform="translate(48 271)"><rect width="120" height="62" rx="18" fill="var(--color-code-bg)" stroke="var(--color-code-border)" /><rect x="18" y="18" width="68" height="5" rx="2.5" fill="var(--color-primary)" /><rect x="18" y="30" width="84" height="5" rx="2.5" fill="var(--color-code-muted)" /><rect x="18" y="42" width="51" height="5" rx="2.5" fill="var(--color-accent)" /></g>
      <g data-outcome-node transform="translate(457 270)"><rect width="116" height="64" rx="18" fill="var(--color-tool-result-bg)" stroke="var(--color-tool-result-border)" /><text x="58" y="27" textAnchor="middle" fill="var(--color-text-tertiary)" fontSize="10" fontWeight="900">READY</text><text x="58" y="47" textAnchor="middle" fill="var(--color-success-text)" fontSize="15" fontWeight="950">EXPORT ✓</text></g>
    </>
  );
}

function LearnScene() {
  return (
    <>
      {[{ x: 52, y: 76, n: "01", t: "FOUNDATION" }, { x: 455, y: 73, n: "02", t: "PRACTICE" }, { x: 50, y: 270, n: "03", t: "CHECKPOINT" }, { x: 452, y: 268, n: "04", t: "EVIDENCE" }].map((node) => (
        <g data-outcome-node key={node.n} transform={`translate(${node.x} ${node.y})`}>
          <rect width="126" height="70" rx="20" fill="var(--color-surface-raised)" stroke="var(--color-border-default)" />
          <circle cx="25" cy="24" r="11" fill="var(--color-primary-soft)" stroke="var(--color-primary-border)" />
          <text x="25" y="28" textAnchor="middle" fill="var(--color-primary)" fontSize="9" fontWeight="950">{node.n}</text>
          <text x="18" y="52" fill="var(--color-text-primary)" fontSize="11" fontWeight="950">{node.t}</text>
          <circle cx="104" cy="23" r="6" fill={node.n === "04" ? "var(--color-success-text)" : "var(--color-accent)"} />
        </g>
      ))}
    </>
  );
}

function DecideScene() {
  return (
    <>
      <g data-outcome-node transform="translate(42 72)"><rect width="134" height="76" rx="21" fill="var(--color-surface-raised)" stroke="var(--color-primary-border)" /><text x="67" y="31" textAnchor="middle" fill="var(--color-primary)" fontSize="12" fontWeight="950">OPTION A</text><rect x="23" y="44" width="88" height="6" rx="3" fill="var(--color-primary-soft)" /><rect x="23" y="56" width="62" height="5" rx="2.5" fill="var(--color-border-strong)" /></g>
      <g data-outcome-node transform="translate(444 72)"><rect width="134" height="76" rx="21" fill="var(--color-surface-raised)" stroke="var(--color-accent-border)" /><text x="67" y="31" textAnchor="middle" fill="var(--color-accent)" fontSize="12" fontWeight="950">OPTION B</text><rect x="23" y="44" width="88" height="6" rx="3" fill="var(--color-accent-soft)" /><rect x="23" y="56" width="72" height="5" rx="2.5" fill="var(--color-border-strong)" /></g>
      <g data-outcome-node transform="translate(50 274)"><rect width="126" height="62" rx="18" fill="var(--color-info-bg)" stroke="var(--color-info-border)" /><text x="63" y="27" textAnchor="middle" fill="var(--color-info-text)" fontSize="10" fontWeight="950">CONSTRAINTS</text><text x="63" y="46" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="10" fontWeight="800">TEAM · RISK · TIME</text></g>
      <g data-outcome-node transform="translate(445 274)"><rect width="128" height="62" rx="18" fill="var(--color-success-bg)" stroke="var(--color-success-border)" /><text x="64" y="27" textAnchor="middle" fill="var(--color-success-text)" fontSize="10" fontWeight="950">EXPLAINABLE</text><text x="64" y="46" textAnchor="middle" fill="var(--color-text-primary)" fontSize="12" fontWeight="950">DECISION ✓</text></g>
    </>
  );
}

function ExploreScene() {
  return (
    <>
      <g data-outcome-node transform="translate(45 72)"><rect width="128" height="74" rx="22" fill="var(--color-accent-soft)" stroke="var(--color-accent-border)" /><circle cx="28" cy="27" r="12" fill="var(--color-accent)" /><text x="51" y="31" fill="var(--color-text-primary)" fontSize="11" fontWeight="950">YOUR SIGNALS</text><text x="22" y="55" fill="var(--color-text-secondary)" fontSize="10" fontWeight="800">INTEREST · ENERGY</text></g>
      <g data-outcome-node transform="translate(450 70)"><rect width="126" height="76" rx="22" fill="var(--color-primary-soft)" stroke="var(--color-primary-border)" /><circle cx="63" cy="25" r="13" fill="var(--color-primary)" /><text x="63" y="29" textAnchor="middle" fill="var(--color-primary-text)" fontSize="11" fontWeight="950">R</text><text x="63" y="55" textAnchor="middle" fill="var(--color-text-primary)" fontSize="11" fontWeight="950">ROLE FIT</text></g>
      <g data-outcome-node transform="translate(48 273)"><rect width="126" height="62" rx="18" fill="var(--color-surface-raised)" stroke="var(--color-border-default)" /><text x="63" y="26" textAnchor="middle" fill="var(--color-text-tertiary)" fontSize="10" fontWeight="900">COLLABORATORS</text><circle cx="45" cy="44" r="6" fill="var(--color-primary)" /><circle cx="63" cy="44" r="6" fill="var(--color-accent)" /><circle cx="81" cy="44" r="6" fill="var(--color-info-text)" /></g>
      <g data-outcome-node transform="translate(448 273)"><rect width="128" height="62" rx="18" fill="var(--color-tool-result-bg)" stroke="var(--color-tool-result-border)" /><text x="64" y="26" textAnchor="middle" fill="var(--color-text-tertiary)" fontSize="10" fontWeight="900">NEXT ROUTE</text><path d="M25 44 H96" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" /><path d="M88 36 L99 44 L88 52" fill="none" stroke="var(--color-accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></g>
    </>
  );
}
