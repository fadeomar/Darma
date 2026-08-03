"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { loadGsap, reportMotionFailure, userPrefersReducedMotion } from "@/core/motion/gsap-loader";
import { cn } from "@/lib/cn";

type AtlasHeroSceneProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  labels?: string[];
};

export function AtlasHeroScene({ src, alt, className, priority = false, labels = [] }: AtlasHeroSceneProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || userPrefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    loadGsap()
      .then(({ gsap }) => {
        if (cancelled || !rootRef.current) return;
        const context = gsap.context(() => {
          const image = root.querySelector<HTMLElement>("[data-hero-image]");
          const chips = Array.from(root.querySelectorAll<HTMLElement>("[data-hero-chip]"));
          const glow = root.querySelector<HTMLElement>("[data-hero-glow]");

          // `labels` is optional, so the chip collection is frequently empty.
          // GSAP warns ("target not found") when handed an empty target list.
          if (image) {
            gsap.fromTo(image, { scale: 0.94, rotate: -1.5, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 1.05, ease: "power4.out" });
            gsap.to(image, { yPercent: -5, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.6 } });
          }
          if (chips.length > 0) {
            gsap.fromTo(chips, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, stagger: 0.09, delay: 0.42, ease: "power3.out" });
          }
          if (glow) {
            gsap.to(glow, { rotate: 24, scale: 1.12, duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut" });
          }
        }, root);
        cleanup = () => context.revert();
      })
      .catch(reportMotionFailure);

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("atlas-hero-scene", className)}>
      <span data-hero-glow className="atlas-hero-glow" aria-hidden />
      <div data-hero-image className="atlas-hero-image-wrap">
        <Image src={src} alt={alt} width={960} height={720} priority={priority} className="h-auto w-full" />
      </div>
      {labels.slice(0, 4).map((label, index) => (
        <span key={label} data-hero-chip className={`atlas-hero-chip atlas-hero-chip-${index + 1}`}>
          <span aria-hidden>{["✦", "↗", "⌁", "◉"][index]}</span>
          {label}
        </span>
      ))}
    </div>
  );
}
