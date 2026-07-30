"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { loadGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";

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

    loadGsap().then(({ gsap }) => {
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
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [delay, distance, once]);

  return (
    <Component ref={rootRef as never} id={id} className={cn("motion-section", className)}>
      {children}
    </Component>
  );
}
