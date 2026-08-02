"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { loadGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";

const SECTIONS = [
  { id: "start", label: "Start" },
  { id: "choose", label: "Choose" },
  { id: "workbench", label: "Workbench" },
  { id: "featured", label: "Tools" },
  { id: "proof", label: "Route" },
  { id: "radar", label: "Radar" },
  { id: "atlas", label: "Atlas" },
  { id: "play", label: "Play" },
];

export function LandingSectionRail() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sections = SECTIONS.map((section) => document.getElementById(section.id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-32% 0px -54% 0px", threshold: [0, 0.1, 0.3] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || userPrefersReducedMotion()) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    loadGsap().then(({ gsap }) => {
      if (cancelled || !rootRef.current) return;
      const target = root.querySelector<HTMLElement>(`[data-section-id="${activeId}"]`);
      const indicator = root.querySelector<HTMLElement>("[data-section-indicator]");
      if (!target || !indicator) return;
      const rootRect = root.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const tween = gsap.to(indicator, { y: targetRect.top - rootRect.top + targetRect.height / 2 - 5, duration: 0.36, ease: "power3.out" });
      cleanup = () => tween.kill();
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [activeId]);

  return (
    <nav ref={rootRef} className="landing-section-rail" aria-label="Landing page sections">
      <span data-section-indicator className="landing-section-rail-indicator" aria-hidden />
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          data-section-id={section.id}
          data-active={activeId === section.id ? "true" : "false"}
          aria-current={activeId === section.id ? "location" : undefined}
        >
          <i aria-hidden />
          <span>{section.label}</span>
        </a>
      ))}
    </nav>
  );
}
