"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { armVisibilityFailsafe, loadGsap, reportMotionFailure, restoreInlineStyles, userPrefersReducedMotion } from "@/core/motion/gsap-loader";

/** Restore content if the animation has not taken over by then. */
const VISIBILITY_FAILSAFE_MS = 1000;

type MotionSectionProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  once?: boolean;
  as?: "div" | "section" | "article";
  id?: string;
};

export function MotionSection({
  children,
  className,
  delay = 0,
  distance = 28,
  once = true,
  as = "div",
  id,
}: MotionSectionProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const Component = as;

  useLayoutEffect(() => {
    const element = rootRef.current;
    if (!element || userPrefersReducedMotion()) return;

    element.style.opacity = "0";
    element.style.transform = `translate3d(0, ${distance}px, 0)`;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    // Left armed past a successful load on purpose: it also covers a trigger
    // that never fires, and it only reveals in-viewport content GSAP has not
    // touched, so scroll reveals below the fold are preserved.
    const clearFailsafe = armVisibilityFailsafe([element], VISIBILITY_FAILSAFE_MS);

    loadGsap()
      .then(({ gsap }) => {
        if (cancelled || !rootRef.current) return;
        const context = gsap.context(() => {
          gsap.to(element, {
            opacity: 1,
            y: 0,
            duration: 0.72,
            delay,
            ease: "power3.out",
            clearProps: "transform,opacity",
            scrollTrigger: {
              trigger: element,
              start: "top 88%",
              once,
            },
          });
        }, element);
        cleanup = () => context.revert();
      })
      .catch((error: unknown) => {
        clearFailsafe();
        if (!cancelled) restoreInlineStyles([element]);
        reportMotionFailure(error);
      });

    return () => {
      cancelled = true;
      clearFailsafe();
      cleanup?.();
    };
  }, [delay, distance, once]);

  return (
    <Component ref={rootRef as never} id={id} className={cn("motion-section", className)}>
      {children}
    </Component>
  );
}
