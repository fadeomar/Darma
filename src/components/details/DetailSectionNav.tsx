"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type DetailSectionNavItem = {
  id: string;
  label: string;
};

export function DetailSectionNav({ items, label = "Page sections", className }: { items: DetailSectionNavItem[]; label?: string; className?: string }) {
  const normalizedItems = useMemo(() => items.filter((item, index, all) => item.id && all.findIndex((candidate) => candidate.id === item.id) === index), [items]);
  const [activeId, setActiveId] = useState(normalizedItems[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!normalizedItems.length) return;
    const sections = normalizedItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-24% 0px -62% 0px", threshold: [0, 0.1, 0.35] },
    );
    sections.forEach((section) => observer.observe(section));

    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const first = sections[0];
      const last = sections[sections.length - 1];
      const start = first.offsetTop - window.innerHeight * 0.35;
      const end = last.offsetTop + last.offsetHeight - window.innerHeight * 0.65;
      const range = Math.max(1, end - start);
      setProgress(Math.min(1, Math.max(0, (window.scrollY - start) / range)));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };
    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [normalizedItems]);

  useEffect(() => {
    const activeLink = Array.from(railRef.current?.querySelectorAll<HTMLAnchorElement>("a[href^=\"#\"]") ?? [])
      .find((link) => link.getAttribute("href") === `#${activeId}`);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    activeLink?.scrollIntoView({ block: "nearest", inline: "center", behavior: reducedMotion ? "auto" : "smooth" });
  }, [activeId]);

  if (!normalizedItems.length) return null;

  return (
    <nav className={cn("detail-section-nav", className)} aria-label={label}>
      <div className="detail-section-nav-progress" aria-hidden>
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div ref={railRef} className="detail-section-nav-rail">
        {normalizedItems.map((item, index) => {
          const active = activeId === item.id;
          return (
            <a key={item.id} href={`#${item.id}`} className={cn("detail-section-nav-link", active && "is-active")} aria-current={active ? "location" : undefined}>
              <span className="detail-section-nav-index" aria-hidden>{String(index + 1).padStart(2, "0")}</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
