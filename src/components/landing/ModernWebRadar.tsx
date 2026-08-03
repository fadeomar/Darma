"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { withGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";
import { DarmaSymbol, type DarmaSymbolName } from "@/components/visuals";

const SIGNALS = [
  {
    id: "baseline",
    index: "01",
    symbol: "build" as DarmaSymbolName,
    label: "Web platform",
    title: "Baseline 2026 tracks features that are ready to evaluate across major browsers.",
    summary: "Use compatibility evidence before adding a dependency or rejecting a native platform feature.",
    source: "web.dev",
    href: "https://web.dev/baseline/2026",
    stages: ["FEATURE", "SUPPORT", "DECISION"],
    status: "Current official guidance",
  },
  {
    id: "accessibility",
    index: "02",
    symbol: "accessible" as DarmaSymbolName,
    label: "Accessibility",
    title: "WCAG 2.2 makes focus visibility and pointer target size part of practical interface quality.",
    summary: "Readable content is only one layer. Controls also need visible focus and usable interaction areas.",
    source: "W3C WAI",
    href: "https://www.w3.org/TR/WCAG22/",
    stages: ["READ", "FOCUS", "ACT"],
    status: "International standard",
  },
  {
    id: "security",
    index: "03",
    symbol: "secure" as DarmaSymbolName,
    label: "Application security",
    title: "OWASP Top 10:2025 expands the security conversation to modern software supply chains.",
    summary: "Security is not only an authentication screen. Dependencies, delivery, and operational decisions belong in the model.",
    source: "OWASP",
    href: "https://owasp.org/Top10/2025/",
    stages: ["MODEL", "REDUCE", "VERIFY"],
    status: "Current awareness release",
  },
  {
    id: "performance",
    index: "04",
    symbol: "performance" as DarmaSymbolName,
    label: "User experience",
    title: "Core Web Vitals keep loading, responsiveness, and visual stability measurable.",
    summary: "A polished interface should also respond quickly and avoid shifting while people read or interact.",
    source: "web.dev",
    href: "https://web.dev/explore/learn-core-web-vitals",
    stages: ["LOAD", "RESPOND", "STABILIZE"],
    status: "Active web quality guidance",
  },
] as const;

export function ModernWebRadar() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = SIGNALS[activeIndex] ?? SIGNALS[0];

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || userPrefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    withGsap(({ gsap, ScrollTrigger }) => {
      if (cancelled || !rootRef.current) return;
      const context = gsap.context(() => {
        const cards = root.querySelectorAll<HTMLElement>("[data-radar-card]");
        const paths = root.querySelectorAll<SVGPathElement>("[data-radar-path]");
        const nodes = root.querySelectorAll<SVGElement>("[data-radar-node]");

        gsap.from(cards, {
          opacity: 0,
          y: 24,
          duration: 0.55,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: root, start: "top 78%", once: true },
        });
        gsap.fromTo(paths, { strokeDasharray: 360, strokeDashoffset: 360 }, {
          strokeDashoffset: 0,
          duration: 1.15,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: root, start: "top 72%", once: true },
        });
        gsap.from(nodes, {
          opacity: 0,
          scale: 0.45,
          transformOrigin: "center",
          duration: 0.55,
          stagger: 0.08,
          ease: "back.out(1.7)",
          scrollTrigger: { trigger: root, start: "top 72%", once: true },
        });
      }, root);
      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || userPrefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    withGsap(({ gsap }) => {
      if (cancelled || !rootRef.current) return;
      const context = gsap.context(() => {
        gsap.fromTo(
          root.querySelectorAll("[data-radar-active]"),
          { opacity: 0.45, y: 8, scale: 0.985 },
          { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out" },
        );
      }, root);
      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [activeIndex]);

  return (
    <div ref={rootRef} className="modern-web-radar">
      <div className="modern-web-radar-stage" data-radar-active>
        <div className="modern-web-radar-topbar">
          <div>
            <span><i aria-hidden /> Modern web radar</span>
            <strong>{active.label}</strong>
          </div>
          <small>{active.index} / 04</small>
        </div>

        <div className={`modern-web-radar-scene modern-web-radar-scene-${active.id}`} aria-hidden>
          <svg viewBox="0 0 620 410" fill="none" focusable="false">
            <defs>
              <linearGradient id="modern-radar-gradient" x1="86" y1="55" x2="520" y2="350" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--color-primary)" />
                <stop offset="1" stopColor="var(--color-accent)" />
              </linearGradient>
            </defs>
            <circle cx="310" cy="205" r="152" className="modern-radar-ring" />
            <circle cx="310" cy="205" r="104" className="modern-radar-ring modern-radar-ring-soft" />
            <circle cx="310" cy="205" r="54" className="modern-radar-core" data-radar-node />
            <path d="M310 151 178 102" className="modern-radar-path" data-radar-path />
            <path d="M360 192 493 128" className="modern-radar-path" data-radar-path />
            <path d="M350 247 470 318" className="modern-radar-path" data-radar-path />
            <path d="M270 247 151 315" className="modern-radar-path" data-radar-path />
            <circle cx="178" cy="102" r="27" className="modern-radar-node" data-radar-node />
            <circle cx="493" cy="128" r="27" className="modern-radar-node" data-radar-node />
            <circle cx="470" cy="318" r="27" className="modern-radar-node" data-radar-node />
            <circle cx="151" cy="315" r="27" className="modern-radar-node" data-radar-node />
            <text x="310" y="201" textAnchor="middle" className="modern-radar-core-label">{active.index}</text>
            <text x="310" y="221" textAnchor="middle" className="modern-radar-core-caption">SIGNAL</text>
            <text x="178" y="107" textAnchor="middle" className="modern-radar-node-label">NOW</text>
            <text x="493" y="133" textAnchor="middle" className="modern-radar-node-label">USE</text>
            <text x="470" y="323" textAnchor="middle" className="modern-radar-node-label">TEST</text>
            <text x="151" y="320" textAnchor="middle" className="modern-radar-node-label">LEARN</text>
          </svg>
          <span className="modern-web-radar-symbol"><DarmaSymbol name={active.symbol} /></span>
        </div>

        <div className="modern-web-radar-stages" aria-hidden>
          {active.stages.map((stage, index) => <span key={stage}><i>{String(index + 1).padStart(2, "0")}</i>{stage}</span>)}
        </div>
        <div className="modern-web-radar-status"><CheckCircle2 className="h-4 w-4" aria-hidden />{active.status}</div>
      </div>

      <div className="modern-web-radar-list">
        {SIGNALS.map((signal, index) => {
          const selected = activeIndex === index;
          return (
            <article
              key={signal.id}
              className="modern-web-radar-card"
              data-radar-card
              data-selected={selected ? "true" : "false"}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
            >
              <button type="button" onClick={() => setActiveIndex(index)} aria-pressed={selected}>
                <span className="modern-web-radar-card-icon"><DarmaSymbol name={signal.symbol} /></span>
                <span>
                  <small>{signal.index} · {signal.label}</small>
                  <strong>{signal.title}</strong>
                  <em>{signal.summary}</em>
                </span>
              </button>
              <Link href={signal.href} target="_blank" rel="noopener noreferrer">
                Read the official source
                <span>{signal.source}</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
