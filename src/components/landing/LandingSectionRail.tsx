"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { withGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";

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
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const placedRef = useRef(false);
  const activeLabel = SECTIONS.find((section) => section.id === activeId)?.label ?? SECTIONS[0].label;

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

  /*
   * The marker only ever travels along the fixed marker column, so its target is
   * the row's vertical offset inside the rail — never the label box. Rows have a
   * fixed height in CSS, which keeps the travel identical for "Play" and for
   * "Workbench" and stops the long label from dragging the marker sideways.
   */
  const placeIndicator = useCallback((animate: boolean) => {
    const root = rootRef.current;
    const indicator = indicatorRef.current;
    if (!root || !indicator) return undefined;
    const row = root.querySelector<HTMLElement>(`[data-section-id="${activeId}"]`);
    if (!row) return undefined;

    const y = row.offsetTop + row.offsetHeight / 2 - indicator.offsetHeight / 2;

    if (!animate) {
      indicator.style.transform = `translate3d(0, ${y}px, 0)`;
      return undefined;
    }

    let cancelled = false;
    let killTween: (() => void) | undefined;
    withGsap(({ gsap }) => {
      if (cancelled || !indicatorRef.current) return;
      const tween = gsap.to(indicator, { y, duration: 0.36, ease: "power3.out", overwrite: "auto" });
      killTween = () => tween.kill();
    });
    return () => {
      cancelled = true;
      killTween?.();
    };
  }, [activeId]);

  useLayoutEffect(() => {
    const animate = placedRef.current && !userPrefersReducedMotion();
    placedRef.current = true;
    return placeIndicator(animate);
  }, [placeIndicator]);

  // The rail switches between the labelled and the compact layout on a media
  // query, so row heights change with the viewport. Re-place without animation.
  useEffect(() => {
    const onResize = () => placeIndicator(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [placeIndicator]);

  return (
    <nav ref={rootRef} className="landing-section-rail" aria-label="Landing page sections">
      <span data-section-indicator ref={indicatorRef} className="landing-section-rail-indicator" aria-hidden />
      <span className="landing-section-rail-active" aria-hidden>{activeLabel}</span>
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
