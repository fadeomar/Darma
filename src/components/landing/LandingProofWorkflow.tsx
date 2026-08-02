"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, FileCode2, PackageCheck, ScanSearch } from "lucide-react";
import { DarmaSymbol, type DarmaSymbolName } from "@/components/visuals";
import { loadGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";

export type ProofWorkflow = {
  id: string;
  label: string;
  symbol: DarmaSymbolName;
  title: string;
  description: string;
  outcome: string;
  artifacts: string[];
  steps: Array<{ label: string; title: string; description: string; href: string; type: string }>;
};

const WORKFLOWS: ProofWorkflow[] = [
  {
    id: "launch",
    label: "Launch a page",
    symbol: "build",
    title: "Turn a page draft into a release-ready handoff.",
    description: "This route keeps search metadata, social presentation, crawl controls, and launch validation connected. Each step produces something the next step can use.",
    outcome: "A release pack you can inspect before deployment.",
    artifacts: ["Search and social metadata", "Open Graph image", "Robots and sitemap files", "Launch checklist"],
    steps: [
      { label: "01", title: "Prepare metadata", description: "Write, preview, and audit search and social copy.", href: "/tools/meta-tag-generator", type: "Tool" },
      { label: "02", title: "Build the social image", description: "Create the visual card and keep the metadata context beside it.", href: "/tools/og-image-generator", type: "Tool" },
      { label: "03", title: "Control discovery", description: "Generate robots rules and a valid XML sitemap for the release.", href: "/tools/robots-txt-generator", type: "Tool" },
      { label: "04", title: "Run the launch route", description: "Follow the final workflow and validate the handoffs together.", href: "/workflows/website-launch", type: "Workflow" },
    ],
  },
  {
    id: "content",
    label: "Prepare content",
    symbol: "resource",
    title: "Move from rough copy to a publishable document.",
    description: "Clean the source, review readability, preview the final structure, and export a document without losing the relationship between edits and checks.",
    outcome: "A cleaner, reviewed document with reusable output.",
    artifacts: ["Normalized source text", "Readability findings", "Structured Markdown", "HTML or text export"],
    steps: [
      { label: "01", title: "Clean the source", description: "Normalize copied text and build a reusable cleanup workflow.", href: "/tools/text-cleaner", type: "Tool" },
      { label: "02", title: "Audit readability", description: "Find difficult sentences and audience-level risks.", href: "/tools/readability-score", type: "Tool" },
      { label: "03", title: "Preview the document", description: "Inspect headings, links, code, and the final reading structure.", href: "/tools/markdown-previewer", type: "Tool" },
      { label: "04", title: "Use editorial guidance", description: "Check the writing process and source expectations before publishing.", href: "/editorial-policy", type: "Reference" },
    ],
  },
  {
    id: "system",
    label: "Build a visual system",
    symbol: "color",
    title: "Connect color, scale, layout, and reusable output.",
    description: "Instead of designing isolated values, move through semantic color, fluid scale, layout structure, and production code as one small design-system route.",
    outcome: "A visual foundation that can move into a real interface.",
    artifacts: ["Semantic color roles", "Fluid type and spacing", "Responsive layout rules", "CSS and token output"],
    steps: [
      { label: "01", title: "Define color roles", description: "Create a color system that accounts for surfaces, text, states, and modes.", href: "/tools/color-shades", type: "Tool" },
      { label: "02", title: "Create fluid scale", description: "Build responsive typography and spacing values with visible interpolation.", href: "/tools/css-clamp-generator", type: "Tool" },
      { label: "03", title: "Compose the layout", description: "Use Grid or responsive layout tools while the output stays visible.", href: "/tools/css-grid-generator", type: "Tool" },
      { label: "04", title: "Check the wider system", description: "Connect the visual decisions to implementation and design-system references.", href: "/guides", type: "Guide" },
    ],
  },
];

export function LandingProofWorkflow() {
  const [activeId, setActiveId] = useState(WORKFLOWS[0].id);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const active = WORKFLOWS.find((workflow) => workflow.id === activeId) ?? WORKFLOWS[0];

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || userPrefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    loadGsap().then(({ gsap }) => {
      if (cancelled || !rootRef.current) return;
      const context = gsap.context(() => {
        const shell = root.querySelector<HTMLElement>("[data-proof-workflow]");
        const steps = root.querySelectorAll<HTMLElement>("[data-proof-step]");
        const connectors = root.querySelectorAll<HTMLElement>("[data-proof-connector]");
        const artifacts = root.querySelectorAll<HTMLElement>("[data-proof-artifact]");
        gsap.timeline({ defaults: { ease: "power3.out" } })
          .fromTo(shell, { opacity: 0.76, y: 14 }, { opacity: 1, y: 0, duration: 0.46 })
          .fromTo(steps, { opacity: 0, y: 18, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.07 }, "-=0.25")
          .fromTo(connectors, { scaleX: 0, transformOrigin: "left" }, { scaleX: 1, duration: 0.34, stagger: 0.05 }, "-=0.28")
          .fromTo(artifacts, { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.05 }, "-=0.18");
      }, root);
      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [activeId]);

  return (
    <div ref={rootRef} className="landing-proof-shell">
      <div className="landing-proof-tabs" role="tablist" aria-label="Choose a real Darma workflow">
        {WORKFLOWS.map((workflow) => (
          <button
            key={workflow.id}
            type="button"
            role="tab"
            id={`proof-tab-${workflow.id}`}
            aria-selected={activeId === workflow.id}
            aria-controls="landing-proof-panel"
            data-active={activeId === workflow.id ? "true" : "false"}
            onClick={() => setActiveId(workflow.id)}
          >
            <DarmaSymbol name={workflow.symbol} className="h-5 w-5" />
            <span>{workflow.label}</span>
          </button>
        ))}
      </div>

      <div
        data-proof-workflow
        id="landing-proof-panel"
        role="tabpanel"
        aria-labelledby={`proof-tab-${active.id}`}
        className="landing-proof-workflow"
      >
        <div className="landing-proof-copy">
          <span className="landing-proof-kicker"><ScanSearch className="h-4 w-4" aria-hidden />Connected handoff</span>
          <h3>{active.title}</h3>
          <p>{active.description}</p>
          <div className="landing-proof-outcome"><PackageCheck className="h-5 w-5" aria-hidden /><div><small>Outcome</small><strong>{active.outcome}</strong></div></div>
          <div className="landing-proof-artifacts">
            <span className="landing-proof-artifacts-title"><FileCode2 className="h-4 w-4" aria-hidden />What the route produces</span>
            {active.artifacts.map((artifact) => (
              <span key={artifact} data-proof-artifact><CheckCircle2 className="h-4 w-4" aria-hidden />{artifact}</span>
            ))}
          </div>
        </div>

        <div className="landing-proof-route">
          {active.steps.map((step, index) => (
            <div key={`${active.id}-${step.label}`} className="landing-proof-route-row">
              <Link href={step.href} data-proof-step className="landing-proof-step">
                <span className="landing-proof-step-number">{step.label}</span>
                <span className="landing-proof-step-copy"><small>{step.type}</small><strong>{step.title}</strong><p>{step.description}</p></span>
                <span className="landing-proof-step-arrow"><ArrowRight className="h-[18px] w-[18px]" aria-hidden /></span>
              </Link>
              {index < active.steps.length - 1 ? <span data-proof-connector className="landing-proof-connector" aria-hidden><i /></span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
