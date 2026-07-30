"use client";

import { useLayoutEffect, useRef } from "react";
import { Compass, Library, Route, Sparkles } from "lucide-react";
import { loadGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";

const STEPS = [
  { icon: Compass, label: "Start with a real question", text: "Describe the task, decision, role, or skill you need instead of guessing the correct technical category." },
  { icon: Library, label: "Verify with trusted sources", text: "Use official documentation and carefully selected references before relying on summaries or social posts." },
  { icon: Route, label: "Follow a practical route", text: "Connect the reference to a learning path, career guide, team flow, or tool that turns information into action." },
  { icon: Sparkles, label: "Build evidence and improve", text: "Complete a project, test the choice, review the outcome, and return with better questions rather than collecting links forever." },
];

export function AtlasScrollStory() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || userPrefersReducedMotion() || window.matchMedia("(max-width: 899px)").matches) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !rootRef.current) return;
      const context = gsap.context(() => {
        const steps = gsap.utils.toArray<HTMLElement>("[data-story-step]", root);
        const nodes = gsap.utils.toArray<HTMLElement>("[data-story-node]", root);
        const progress = root.querySelector<HTMLElement>("[data-story-progress]");

        ScrollTrigger.create({
          trigger: root,
          start: "top 15%",
          end: "bottom 70%",
          pin: root.querySelector("[data-story-visual]"),
          pinSpacing: false,
        });

        steps.forEach((step, index) => {
          ScrollTrigger.create({
            trigger: step,
            start: "top 55%",
            end: "bottom 45%",
            onToggle: ({ isActive }) => {
              if (!isActive) return;
              gsap.to(nodes, { opacity: 0.28, scale: 0.92, duration: 0.25 });
              gsap.to(nodes[index], { opacity: 1, scale: 1.08, duration: 0.45, ease: "back.out(1.8)" });
              gsap.to(progress, { scaleY: (index + 1) / steps.length, duration: 0.45, transformOrigin: "top" });
            },
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

  return (
    <div ref={rootRef} className="atlas-scroll-story">
      <div data-story-visual className="atlas-story-visual" aria-hidden>
        <div className="atlas-story-orbit">
          <span className="atlas-story-progress-track"><span data-story-progress className="atlas-story-progress" /></span>
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return <span key={step.label} data-story-node className={`atlas-story-node atlas-story-node-${index + 1}`}><Icon className="h-6 w-6" /></span>;
          })}
          <span className="atlas-story-center">D</span>
        </div>
      </div>
      <div className="atlas-story-steps">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <article key={step.label} data-story-step className="atlas-story-step">
              <span className="atlas-story-step-number">0{index + 1}</span>
              <div className="atlas-story-step-icon"><Icon className="h-5 w-5" aria-hidden /></div>
              <h3>{step.label}</h3>
              <p>{step.text}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
