"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { DarmaSymbol, type DarmaSymbolName } from "@/components/visuals";
import { loadGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";

export type LandingIntent = {
  id: string;
  label: string;
  symbol: DarmaSymbolName;
  eyebrow: string;
  title: string;
  description: string;
  start: string;
  workspace: string;
  outcome: string;
  result: string;
  links: Array<{ title: string; description: string; href: string; meta: string }>;
  checklist: string[];
};

const INTENTS: LandingIntent[] = [
  {
    id: "clean",
    label: "Clean content",
    symbol: "resource",
    eyebrow: "Text and data",
    title: "Turn a messy input into something ready to use.",
    description: "Normalize text, inspect structured data, improve readability, and leave with a result you can copy, export, or continue editing.",
    start: "Messy input",
    workspace: "Clean + inspect",
    outcome: "Ready content",
    result: "A cleaner source, visible checks, and an exportable result.",
    links: [
      { title: "Text Cleaner", description: "Build an ordered cleanup workflow for copied or inconsistent text.", href: "/tools/text-cleaner", meta: "Browser tool" },
      { title: "JSON Formatter", description: "Format, validate, compare, and inspect structured data.", href: "/tools/json-formatter", meta: "Production studio" },
      { title: "Readability Audit", description: "Find difficult sentences and match writing to an audience.", href: "/tools/readability-score", meta: "Editorial tool" },
    ],
    checklist: ["Keep the original input visible", "Review checks before export", "Continue with a related tool"],
  },
  {
    id: "design",
    label: "Design a visual",
    symbol: "color",
    eyebrow: "Interface and visual systems",
    title: "Shape a visual idea while the result stays in view.",
    description: "Adjust real controls, inspect the live preview, and export production-ready CSS, tokens, or image assets without losing the visual context.",
    start: "Visual goal",
    workspace: "Control + preview",
    outcome: "Reusable asset",
    result: "A tested visual direction with copy-ready output.",
    links: [
      { title: "Color Scale & Token Generator", description: "Build palettes and semantic color roles for light and dark interfaces.", href: "/tools/color-shades", meta: "Design system" },
      { title: "CSS Gradient Studio", description: "Create gradients with live controls and production output.", href: "/tools/css-gradient-generator", meta: "Visual generator" },
      { title: "Fluid CSS Clamp", description: "Design responsive type and spacing scales across viewports.", href: "/tools/css-clamp-generator", meta: "Responsive system" },
    ],
    checklist: ["Preview in light and dark", "Check responsive behavior", "Export tokens or code"],
  },
  {
    id: "ship",
    label: "Ship a page",
    symbol: "build",
    eyebrow: "Launch workflow",
    title: "Prepare the pieces a page needs before it goes live.",
    description: "Move through metadata, social previews, crawl controls, and launch checks as one connected release route rather than four unrelated tabs.",
    start: "Page draft",
    workspace: "Prepare release",
    outcome: "Launch pack",
    result: "A more complete release package with visible handoffs.",
    links: [
      { title: "Meta Tag Studio", description: "Audit search and social metadata, then export web or Next.js output.", href: "/tools/meta-tag-generator", meta: "SEO workflow" },
      { title: "Open Graph Studio", description: "Create a visual social preview and package the supporting metadata.", href: "/tools/og-image-generator", meta: "Social preview" },
      { title: "Website Launch Workflow", description: "Follow the release route from URLs and metadata to validation.", href: "/workflows/website-launch", meta: "Connected workflow" },
    ],
    checklist: ["Confirm canonical URLs", "Preview search and social cards", "Validate crawl and sitemap files"],
  },
  {
    id: "learn",
    label: "Learn with direction",
    symbol: "learn",
    eyebrow: "Guided learning",
    title: "Replace random reading with a route that produces evidence.",
    description: "Start with foundations, follow trusted references, build something practical, and know what proof to collect before moving on.",
    start: "Question",
    workspace: "Route + sources",
    outcome: "Evidence",
    result: "A sequence you can follow and a clearer next checkpoint.",
    links: [
      { title: "Learning Paths", description: "Choose an ordered route with stages, checkpoints, and project evidence.", href: "/learning-paths", meta: "Guided routes" },
      { title: "Resource Library", description: "Browse official documentation, standards, and durable learning sources.", href: "/resources", meta: "Reviewed references" },
      { title: "Practical Guides", description: "Open focused explanations built around real decisions and workflows.", href: "/guides", meta: "Editorial guidance" },
    ],
    checklist: ["Start from a real outcome", "Use primary sources", "Create a small proof project"],
  },
  {
    id: "decide",
    label: "Make a decision",
    symbol: "compare",
    eyebrow: "Options and trade-offs",
    title: "Compare the work around an option, not only its label.",
    description: "Inspect constraints, daily responsibilities, team fit, maintenance, risk, and the route that follows a decision before you commit.",
    start: "Real constraint",
    workspace: "Compare context",
    outcome: "Explainable choice",
    result: "A decision grounded in the work, team, and trade-offs around it.",
    links: [
      { title: "Comparisons", description: "Compare technologies, roles, and workflows without pretending there is one universal winner.", href: "/comparisons", meta: "Decision guides" },
      { title: "Career Pathfinder", description: "Match interests and working preferences with practical role directions.", href: "/career-pathfinder", meta: "Career exploration" },
      { title: "Teams and Delivery", description: "See how roles collaborate through different team structures and delivery stages.", href: "/tech-teams", meta: "Operating context" },
    ],
    checklist: ["Write down constraints first", "Compare the daily work", "Record why the choice fits"],
  },
  {
    id: "play",
    label: "Reset with a game",
    symbol: "play",
    eyebrow: "Short focused break",
    title: "Take a contained break, then return without opening another platform.",
    description: "Choose a quick browser game, keep local progress when supported, and use a deliberate reset instead of falling into an endless feed.",
    start: "Mental fatigue",
    workspace: "Focused play",
    outcome: "Clearer return",
    result: "A short interruption with a visible end and an easy route back.",
    links: [
      { title: "Browse Games", description: "Explore quick challenges, puzzles, classics, and creative browser games.", href: "/games", meta: "Game library" },
      { title: "Reaction Time Test", description: "Run a controlled browser reaction challenge with local evidence.", href: "/tools/reaction-time-test", meta: "Interactive challenge" },
      { title: "Click Speed Studio", description: "Measure a short input sprint and inspect timing consistency.", href: "/tools/click-speed-test", meta: "Quick challenge" },
    ],
    checklist: ["Choose a short session", "Keep the finish visible", "Return to the previous task"],
  },
];

export function LandingIntentNavigator() {
  const [activeId, setActiveId] = useState(INTENTS[0].id);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const active = INTENTS.find((intent) => intent.id === activeId) ?? INTENTS[0];

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || userPrefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    loadGsap().then(({ gsap }) => {
      if (cancelled || !rootRef.current) return;
      const context = gsap.context(() => {
        const panel = root.querySelector<HTMLElement>("[data-intent-panel]");
        const nodes = root.querySelectorAll<HTMLElement>("[data-intent-node]");
        const links = root.querySelectorAll<HTMLElement>("[data-intent-link]");
        const paths = root.querySelectorAll<SVGPathElement>("[data-intent-path]");
        const checks = root.querySelectorAll<HTMLElement>("[data-intent-check]");

        gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });
        const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
        timeline
          .fromTo(panel, { opacity: 0.72, y: 16, scale: 0.992 }, { opacity: 1, y: 0, scale: 1, duration: 0.48 })
          .to(paths, { strokeDashoffset: 0, duration: 0.62, stagger: 0.08 }, "-=0.3")
          .fromTo(nodes, { opacity: 0, scale: 0.72, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.44, stagger: 0.07, ease: "back.out(1.45)" }, "-=0.48")
          .fromTo(links, { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: 0.34, stagger: 0.055 }, "-=0.28")
          .fromTo(checks, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.28, stagger: 0.045 }, "-=0.18");
      }, root);
      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [activeId]);

  return (
    <div ref={rootRef} className="landing-intent-shell">
      <div className="landing-intent-tabs" role="tablist" aria-label="Choose what you want to do in Darma">
        {INTENTS.map((intent) => (
          <button
            key={intent.id}
            type="button"
            role="tab"
            id={`intent-tab-${intent.id}`}
            aria-selected={activeId === intent.id}
            aria-controls="landing-intent-panel"
            data-active={activeId === intent.id ? "true" : "false"}
            onClick={() => setActiveId(intent.id)}
            className="landing-intent-tab"
          >
            <span><DarmaSymbol name={intent.symbol} className="h-5 w-5" /></span>
            <strong>{intent.label}</strong>
          </button>
        ))}
      </div>

      <div
        data-intent-panel
        role="tabpanel"
        id="landing-intent-panel"
        aria-labelledby={`intent-tab-${active.id}`}
        className="landing-intent-panel"
      >
        <div className="landing-intent-story">
          <div className="landing-intent-story-copy">
            <span className="landing-intent-kicker"><Sparkles className="h-4 w-4" aria-hidden />{active.eyebrow}</span>
            <h3>{active.title}</h3>
            <p>{active.description}</p>
          </div>

          <div className="landing-intent-map" aria-label={`${active.start} to ${active.outcome}`}>
            <svg viewBox="0 0 820 220" aria-hidden focusable="false">
              <defs>
                <linearGradient id="intent-path-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="var(--color-primary)" />
                  <stop offset="1" stopColor="var(--color-accent)" />
                </linearGradient>
              </defs>
              <path data-intent-path pathLength="1" d="M152 110 C245 42 310 42 401 110" fill="none" stroke="url(#intent-path-gradient)" strokeWidth="4" strokeLinecap="round" />
              <path data-intent-path pathLength="1" d="M419 110 C510 178 575 178 668 110" fill="none" stroke="url(#intent-path-gradient)" strokeWidth="4" strokeLinecap="round" />
              <path d="M401 110h18" stroke="var(--color-border-strong)" strokeWidth="2" strokeDasharray="4 7" />
            </svg>

            <div data-intent-node className="landing-intent-node landing-intent-node-start">
              <small>Start</small>
              <strong>{active.start}</strong>
            </div>
            <div data-intent-node className="landing-intent-node landing-intent-node-workspace">
              <span><DarmaSymbol name={active.symbol} className="h-7 w-7" /></span>
              <small>Darma workspace</small>
              <strong>{active.workspace}</strong>
            </div>
            <div data-intent-node className="landing-intent-node landing-intent-node-outcome">
              <small>Leave with</small>
              <strong>{active.outcome}</strong>
            </div>
          </div>

          <div className="landing-intent-result">
            <span><Check className="h-4 w-4" aria-hidden /></span>
            <div><small>Expected result</small><strong>{active.result}</strong></div>
          </div>
        </div>

        <div className="landing-intent-destinations">
          <div className="landing-intent-destinations-heading">
            <span>Recommended starting points</span>
            <small>Open one now. The related route stays visible.</small>
          </div>
          <div className="landing-intent-link-list">
            {active.links.map((link, index) => (
              <Link key={link.href} href={link.href} data-intent-link className="landing-intent-link">
                <span className="landing-intent-link-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="landing-intent-link-copy"><small>{link.meta}</small><strong>{link.title}</strong><p>{link.description}</p></span>
                <span className="landing-intent-link-arrow"><ArrowRight className="h-[18px] w-[18px]" aria-hidden /></span>
              </Link>
            ))}
          </div>
          <div className="landing-intent-checklist">
            {active.checklist.map((item) => (
              <span key={item} data-intent-check><i><Check className="h-3.5 w-3.5" aria-hidden /></i>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
