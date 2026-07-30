"use client";

import { useLayoutEffect, useRef } from "react";
import { Compass, Library, Route, Sparkles } from "lucide-react";
import { loadGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";

const STEPS = [
  {
    icon: Compass,
    label: "Start with a real question",
    text: "Describe the task, decision, role, or skill you need. You do not need to know the perfect technical category first.",
  },
  {
    icon: Library,
    label: "Check reliable sources",
    text: "Begin with official documentation and carefully selected references before relying on summaries or social posts.",
  },
  {
    icon: Route,
    label: "Choose a practical route",
    text: "Connect the reference to a learning path, career guide, team flow, or tool that turns information into a useful next step.",
  },
  {
    icon: Sparkles,
    label: "Build evidence and improve",
    text: "Complete a project, test the choice, review the outcome, and use what you learned to ask a better question next time.",
  },
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

        const activate = (index: number) => {
          nodes.forEach((node, nodeIndex) => {
            node.dataset.active = nodeIndex === index ? "true" : "false";
          });
          steps.forEach((step, stepIndex) => {
            step.dataset.active = stepIndex === index ? "true" : "false";
          });

          gsap.to(nodes, { opacity: 0.34, scale: 0.94, duration: 0.2, overwrite: true });
          gsap.to(nodes[index], { opacity: 1, scale: 1.06, duration: 0.35, ease: "back.out(1.5)", overwrite: true });
          gsap.to(progress, {
            scaleY: (index + 1) / steps.length,
            duration: 0.35,
            transformOrigin: "top",
            ease: "power2.out",
            overwrite: true,
          });
        };

        activate(0);

        steps.forEach((step, index) => {
          ScrollTrigger.create({
            trigger: step,
            start: "top 58%",
            end: "bottom 42%",
            onEnter: () => activate(index),
            onEnterBack: () => activate(index),
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
        <div className="atlas-story-visual-copy">
          <span className="atlas-story-visual-kicker">Darma method</span>
          <strong>One question. Four useful steps.</strong>
        </div>
        <div className="atlas-story-orbit">
          <span className="atlas-story-progress-track">
            <span data-story-progress className="atlas-story-progress" />
          </span>
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <span
                key={step.label}
                data-story-node
                data-active={index === 0 ? "true" : "false"}
                className={`atlas-story-node atlas-story-node-${index + 1}`}
              >
                <Icon className="h-5 w-5" />
              </span>
            );
          })}
          <span className="atlas-story-center">D</span>
        </div>
      </div>

      <div className="atlas-story-steps">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <article
              key={step.label}
              data-story-step
              data-active={index === 0 ? "true" : "false"}
              className="atlas-story-step"
            >
              <div className="atlas-story-step-header">
                <span className="atlas-story-step-number">0{index + 1}</span>
                <div className="atlas-story-step-icon">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
              </div>
              <h3>{step.label}</h3>
              <p>{step.text}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
