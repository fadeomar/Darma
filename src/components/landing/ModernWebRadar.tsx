"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { withGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";
import { DarmaSymbol, type DarmaSymbolName } from "@/components/visuals";

/*
 * Modern web radar.
 *
 * Everything the stage renders is derived from one row of this table, so
 * selecting a card swaps the accent, the centre label, all four surrounding
 * chip labels, the process row, the symbol, the status, and the next action —
 * not only the index number. `core` and `next` are short restatements of the
 * row's own label and summary; nothing here asserts anything the card does not
 * already say.
 */
const SIGNALS = [
  {
    id: "baseline",
    index: "01",
    symbol: "build" as DarmaSymbolName,
    accent: "var(--color-on-ink-accent)",
    label: "Web platform",
    core: "PLATFORM",
    title: "Baseline 2026 tracks features that are ready to evaluate across major browsers.",
    summary: "Use compatibility evidence before adding a dependency or rejecting a native platform feature.",
    source: "web.dev",
    href: "https://web.dev/baseline/2026",
    stages: ["FEATURE", "SUPPORT", "DECISION"],
    status: "Current official guidance",
    next: "Decide with compatibility evidence",
  },
  {
    id: "accessibility",
    index: "02",
    symbol: "accessible" as DarmaSymbolName,
    accent: "var(--color-on-ink-primary)",
    label: "Accessibility",
    core: "ACCESS",
    title: "WCAG 2.2 makes focus visibility and pointer target size part of practical interface quality.",
    summary: "Readable content is only one layer. Controls also need visible focus and usable interaction areas.",
    source: "W3C WAI",
    href: "https://www.w3.org/TR/WCAG22/",
    stages: ["READ", "FOCUS", "ACT"],
    status: "International standard",
    next: "Ship visible focus and usable targets",
  },
  {
    id: "security",
    index: "03",
    symbol: "secure" as DarmaSymbolName,
    accent: "var(--color-on-ink-warning)",
    label: "Application security",
    core: "SUPPLY",
    title: "OWASP Top 10:2025 expands the security conversation to modern software supply chains.",
    summary: "Security is not only an authentication screen. Dependencies, delivery, and operational decisions belong in the model.",
    source: "OWASP",
    href: "https://owasp.org/Top10/2025/",
    stages: ["MODEL", "REDUCE", "VERIFY"],
    status: "Current awareness release",
    next: "Model dependencies and delivery too",
  },
  {
    id: "performance",
    index: "04",
    symbol: "performance" as DarmaSymbolName,
    accent: "var(--color-on-ink-info)",
    label: "User experience",
    core: "QUALITY",
    title: "Core Web Vitals keep loading, responsiveness, and visual stability measurable.",
    summary: "A polished interface should also respond quickly and avoid shifting while people read or interact.",
    source: "web.dev",
    href: "https://web.dev/explore/learn-core-web-vitals",
    stages: ["LOAD", "RESPOND", "STABILIZE"],
    status: "Active web quality guidance",
    next: "Measure loading, response, and stability",
  },
] as const;

/** Chip geometry in viewBox units — one shape, four placements. */
const CHIPS = [
  { x: 52, y: 44, path: "M260 169 148 88" },
  { x: 436, y: 44, path: "M360 169 472 88" },
  { x: 436, y: 322, path: "M360 241 472 322" },
  { x: 52, y: 322, path: "M260 241 148 322" },
] as const;

const CHIP_W = 132;
const CHIP_H = 44;

export function ModernWebRadar() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  // Selection survives the pointer leaving the list; hover only previews it.
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const activeIndex = previewIndex ?? selectedIndex;
  const active = SIGNALS[activeIndex] ?? SIGNALS[0];
  // Three process stages plus the official source that closes the loop.
  const chipLabels = [...active.stages, active.source.toUpperCase()];

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || userPrefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    withGsap(({ gsap }) => {
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
      <div className="modern-web-radar-stage" data-radar-active style={{ ["--radar-accent" as string]: active.accent }}>
        <div className="modern-web-radar-topbar">
          <div>
            <span><i aria-hidden /> Modern web radar</span>
            <strong>{active.label}</strong>
          </div>
          <small>{active.index} / 04</small>
        </div>

        <div className="modern-web-radar-scene" aria-hidden>
          <svg viewBox="0 0 620 410" fill="none" focusable="false">
            <circle cx="310" cy="205" r="152" className="modern-radar-ring" />
            <circle cx="310" cy="205" r="104" className="modern-radar-ring modern-radar-ring-soft" />

            {CHIPS.map((chip, index) => (
              <path
                key={`path-${chip.x}-${chip.y}`}
                d={chip.path}
                className="modern-radar-path"
                data-radar-path
                data-highlight={index === CHIPS.length - 1 ? "true" : "false"}
              />
            ))}

            <circle cx="310" cy="205" r="62" className="modern-radar-core" data-radar-node />
            <DarmaSymbol name={active.symbol} className="modern-radar-symbol" x={294} y={158} width={32} height={32} />
            <text x="310" y="214" textAnchor="middle" className="modern-radar-core-label">{active.index}</text>
            <text x="310" y="236" textAnchor="middle" className="modern-radar-core-caption">{active.core}</text>

            {CHIPS.map((chip, index) => (
              <g key={`chip-${chip.x}-${chip.y}`} transform={`translate(${chip.x} ${chip.y})`} data-highlight={index === CHIPS.length - 1 ? "true" : "false"}>
                <rect width={CHIP_W} height={CHIP_H} rx="14" className="modern-radar-node" data-radar-node />
                <text x={CHIP_W / 2} y={CHIP_H / 2 + 5} textAnchor="middle" className="modern-radar-node-label">{chipLabels[index]}</text>
              </g>
            ))}
          </svg>
        </div>

        <div className="modern-web-radar-stages" aria-hidden>
          {active.stages.map((stage, index) => <span key={stage}><i>{String(index + 1).padStart(2, "0")}</i>{stage}</span>)}
        </div>
        <div className="modern-web-radar-next"><span>Next action</span><strong>{active.next}</strong></div>
        <div className="modern-web-radar-status"><CheckCircle2 className="h-4 w-4" aria-hidden />{active.status}</div>
      </div>

      <div className="modern-web-radar-list" onMouseLeave={() => setPreviewIndex(null)}>
        {SIGNALS.map((signal, index) => {
          const selected = selectedIndex === index;
          return (
            <article
              key={signal.id}
              className="modern-web-radar-card"
              data-radar-card
              data-selected={selected ? "true" : "false"}
              data-preview={!selected && activeIndex === index ? "true" : "false"}
              style={{ ["--radar-accent" as string]: signal.accent }}
              onMouseEnter={() => setPreviewIndex(index)}
            >
              <button
                type="button"
                onClick={() => setSelectedIndex(index)}
                onFocus={() => setSelectedIndex(index)}
                aria-pressed={selected}
              >
                <span className="modern-web-radar-card-icon"><DarmaSymbol name={signal.symbol} /></span>
                <span>
                  <small>{signal.index} · {signal.label}</small>
                  <strong>{signal.title}</strong>
                  <em>{signal.summary}</em>
                </span>
                <span className="modern-web-radar-card-state" aria-hidden>{selected ? "On the radar" : "View"}</span>
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
