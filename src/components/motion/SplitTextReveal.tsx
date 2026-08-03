"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/cn";
import { loadGsap, reportMotionFailure, restoreInlineStyles, userPrefersReducedMotion } from "@/core/motion/gsap-loader";

/** Restore words if the animation has not taken over by then. */
const VISIBILITY_FAILSAFE_MS = 1000;

type SplitTextRevealProps = {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "p";
  start?: string;
};

export function SplitTextReveal({ text, className, as = "h1", start = "top 92%" }: SplitTextRevealProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const words = useMemo(() => text.split(/\s+/), [text]);
  const Component = as;

  useLayoutEffect(() => {
    const element = rootRef.current;
    if (!element || userPrefersReducedMotion()) return;

    const targets = Array.from(element.querySelectorAll<HTMLElement>("[data-reveal-word]"));
    if (targets.length === 0) return;

    targets.forEach((target) => {
      target.style.opacity = "0";
      target.style.transform = "translate3d(0, 0.75em, 0) rotate(1.2deg)";
    });

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    let failsafe: ReturnType<typeof setTimeout> | undefined = setTimeout(() => {
      failsafe = undefined;
      if (!cancelled) restoreInlineStyles(targets);
    }, VISIBILITY_FAILSAFE_MS);

    const clearFailsafe = () => {
      if (failsafe !== undefined) {
        clearTimeout(failsafe);
        failsafe = undefined;
      }
    };

    loadGsap()
      .then(({ gsap }) => {
        if (cancelled || !rootRef.current) return;
        clearFailsafe();
        const context = gsap.context(() => {
          gsap.to(targets, {
            opacity: 1,
            y: 0,
            rotate: 0,
            duration: 0.8,
            stagger: 0.035,
            ease: "power4.out",
            clearProps: "transform,opacity",
            scrollTrigger: { trigger: element, start, once: true },
          });
        }, element);
        cleanup = () => context.revert();
      })
      .catch((error: unknown) => {
        clearFailsafe();
        if (!cancelled) restoreInlineStyles(targets);
        reportMotionFailure(error);
      });

    return () => {
      cancelled = true;
      clearFailsafe();
      cleanup?.();
    };
  }, [start, text]);

  return (
    <Component ref={rootRef as never} className={cn("split-text-reveal", className)} aria-label={text}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} data-reveal-word className="inline-block will-change-transform" aria-hidden="true">
          {word}
          {index < words.length - 1 ? "\u00a0" : null}
        </span>
      ))}
    </Component>
  );
}
