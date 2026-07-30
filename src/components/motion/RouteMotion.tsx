"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { loadGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";

export function RouteMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || userPrefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    loadGsap().then(({ gsap }) => {
      if (cancelled || !rootRef.current) return;
      const context = gsap.context(() => {
        gsap.fromTo(root, { opacity: 0.72, y: 8 }, { opacity: 1, y: 0, duration: 0.42, ease: "power2.out", clearProps: "transform,opacity" });
      }, root);
      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [pathname]);

  return <div ref={rootRef}>{children}</div>;
}
