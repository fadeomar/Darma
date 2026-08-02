"use client";

import { useLayoutEffect, useRef } from "react";
import { Braces, Gamepad2, GitCompareArrows, Route, Sparkles, Wrench } from "lucide-react";
import { loadGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";
import { cn } from "@/lib/cn";

type DarmaHeroExperienceProps = {
  metrics: string[];
  className?: string;
};

const FLOATING_LABELS = [
  { icon: Wrench, label: "Build with live tools", className: "darma-hero-label-tools" },
  { icon: Route, label: "Learn through a route", className: "darma-hero-label-learn" },
  { icon: GitCompareArrows, label: "Compare real trade-offs", className: "darma-hero-label-compare" },
  { icon: Gamepad2, label: "Play, reset, return", className: "darma-hero-label-play" },
];

export function DarmaHeroExperience({ metrics, className }: DarmaHeroExperienceProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || userPrefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    let removePointerListeners: (() => void) | undefined;

    loadGsap().then(({ gsap }) => {
      if (cancelled || !rootRef.current) return;

      const context = gsap.context(() => {
        const scene = root.querySelector<SVGGElement>("[data-hero-scene]");
        const orbit = root.querySelector<SVGGElement>("[data-hero-orbit]");
        const innerOrbit = root.querySelector<SVGGElement>("[data-hero-inner-orbit]");
        const signals = root.querySelectorAll<SVGPathElement>("[data-hero-signal]");
        const nodes = root.querySelectorAll<SVGGElement>("[data-hero-node]");
        const labels = root.querySelectorAll<HTMLElement>("[data-hero-label]");
        const metricsEls = root.querySelectorAll<HTMLElement>("[data-hero-metric]");
        const codeLines = root.querySelectorAll<HTMLElement>("[data-code-line]");
        const center = root.querySelector<SVGGElement>("[data-hero-center]");

        gsap.set(signals, { strokeDasharray: 1, strokeDashoffset: 1 });
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .fromTo(scene, { scale: 0.94, opacity: 0, rotate: -1.2 }, { scale: 1, opacity: 1, rotate: 0, duration: 1 })
          .to(signals, { strokeDashoffset: 0, duration: 0.9, stagger: 0.08 }, "-=0.7")
          .fromTo(nodes, { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.62, stagger: 0.08, ease: "back.out(1.5)" }, "-=0.72")
          .fromTo(labels, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.08 }, "-=0.45")
          .fromTo(metricsEls, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06 }, "-=0.25")
          .fromTo(codeLines, { scaleX: 0, opacity: 0, transformOrigin: "left" }, { scaleX: 1, opacity: 1, duration: 0.5, stagger: 0.06 }, "-=0.35");

        if (orbit) {
          gsap.to(orbit, { rotate: 360, transformOrigin: "50% 50%", duration: 54, repeat: -1, ease: "none" });
        }
        if (innerOrbit) {
          gsap.to(innerOrbit, { rotate: -360, transformOrigin: "50% 50%", duration: 42, repeat: -1, ease: "none" });
        }
        if (center) {
          gsap.to(center, { scale: 1.035, transformOrigin: "50% 50%", duration: 2.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
        }
        gsap.to(labels, { y: (index) => (index % 2 === 0 ? -7 : 7), duration: 2.7, repeat: -1, yoyo: true, stagger: 0.18, ease: "sine.inOut" });
        gsap.to(scene, {
          yPercent: -4,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.65 },
        });

        if (scene && window.matchMedia("(pointer: fine)").matches) {
          const moveX = gsap.quickTo(scene, "x", { duration: 0.7, ease: "power3.out" });
          const moveY = gsap.quickTo(scene, "y", { duration: 0.7, ease: "power3.out" });
          const rotateX = gsap.quickTo(scene, "rotationY", { duration: 0.7, ease: "power3.out" });
          const rotateY = gsap.quickTo(scene, "rotationX", { duration: 0.7, ease: "power3.out" });

          const onPointerMove = (event: PointerEvent) => {
            const rect = root.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            moveX(x * 12);
            moveY(y * 10);
            rotateX(x * 2.4);
            rotateY(y * -2.2);
          };
          const onPointerLeave = () => {
            moveX(0);
            moveY(0);
            rotateX(0);
            rotateY(0);
          };

          root.addEventListener("pointermove", onPointerMove);
          root.addEventListener("pointerleave", onPointerLeave);
          removePointerListeners = () => {
            root.removeEventListener("pointermove", onPointerMove);
            root.removeEventListener("pointerleave", onPointerLeave);
          };
        }
      }, root);

      cleanup = () => context.revert();
    });

    return () => {
      cancelled = true;
      removePointerListeners?.();
      cleanup?.();
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("darma-hero-experience", className)}>
      <span className="darma-hero-aurora darma-hero-aurora-one" aria-hidden />
      <span className="darma-hero-aurora darma-hero-aurora-two" aria-hidden />

      <svg
        className="darma-hero-map"
        viewBox="0 0 760 620"
        role="img"
        aria-labelledby="darma-hero-map-title darma-hero-map-description"
      >
        <title id="darma-hero-map-title">Darma connected technology workspace</title>
        <desc id="darma-hero-map-description">
          A visual map connecting browser tools, learning routes, technology comparisons, games, resources, and practical output.
        </desc>
        <defs>
          <linearGradient id="darma-hero-card" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-surface-raised)" />
            <stop offset="1" stopColor="var(--color-page-bg-soft)" />
          </linearGradient>
          <linearGradient id="darma-hero-accent" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-primary)" />
            <stop offset="1" stopColor="var(--color-accent)" />
          </linearGradient>
          <radialGradient id="darma-hero-center-glow">
            <stop offset="0" stopColor="var(--color-primary-soft)" stopOpacity="1" />
            <stop offset="1" stopColor="var(--color-primary-soft)" stopOpacity="0" />
          </radialGradient>
          <filter id="darma-hero-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#000" floodOpacity="0.16" />
          </filter>
          <pattern id="darma-hero-grid" width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M 34 0 L 0 0 0 34" fill="none" stroke="var(--color-border-subtle)" strokeWidth="1" />
          </pattern>
        </defs>

        <g data-hero-scene>
          <rect x="18" y="18" width="724" height="584" rx="42" fill="url(#darma-hero-card)" stroke="var(--color-border-default)" />
          <rect x="18" y="18" width="724" height="584" rx="42" fill="url(#darma-hero-grid)" opacity="0.75" />
          <circle cx="380" cy="294" r="244" fill="url(#darma-hero-center-glow)" />

          <g data-hero-orbit>
            <ellipse cx="380" cy="294" rx="260" ry="204" fill="none" stroke="var(--color-border-default)" strokeDasharray="8 13" />
            <circle cx="380" cy="90" r="7" fill="var(--color-primary)" />
            <circle cx="640" cy="294" r="5" fill="var(--color-accent)" />
            <circle cx="380" cy="498" r="6" fill="var(--color-primary)" opacity="0.8" />
            <circle cx="120" cy="294" r="5" fill="var(--color-accent)" opacity="0.8" />
          </g>
          <g data-hero-inner-orbit>
            <ellipse cx="380" cy="294" rx="177" ry="142" fill="none" stroke="var(--color-primary-border)" strokeDasharray="4 11" />
            <circle cx="203" cy="294" r="4" fill="var(--color-primary)" />
            <circle cx="557" cy="294" r="4" fill="var(--color-accent)" />
          </g>

          <path data-hero-signal pathLength="1" d="M380 294 C304 222 251 185 173 163" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
          <path data-hero-signal pathLength="1" d="M380 294 C463 214 510 184 588 160" fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" />
          <path data-hero-signal pathLength="1" d="M380 294 C302 358 264 401 199 449" fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" />
          <path data-hero-signal pathLength="1" d="M380 294 C465 360 507 405 574 454" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />

          <g data-hero-node transform="translate(96 112)" filter="url(#darma-hero-shadow)">
            <rect width="164" height="102" rx="23" fill="var(--color-tool-controls-bg)" stroke="var(--color-tool-controls-border)" />
            <rect x="18" y="19" width="58" height="11" rx="5.5" fill="var(--color-primary)" opacity="0.88" />
            <rect x="18" y="42" width="126" height="9" rx="4.5" fill="var(--color-control-track)" />
            <circle cx="52" cy="46.5" r="10" fill="var(--color-surface-raised)" stroke="var(--color-primary-border)" />
            <rect x="18" y="67" width="60" height="18" rx="9" fill="var(--color-primary-soft)" stroke="var(--color-primary-border)" />
            <rect x="88" y="67" width="56" height="18" rx="9" fill="var(--color-accent-soft)" stroke="var(--color-accent-border)" />
          </g>

          <g data-hero-node transform="translate(502 105)" filter="url(#darma-hero-shadow)">
            <rect width="160" height="110" rx="23" fill="var(--color-tool-preview-bg)" stroke="var(--color-tool-preview-border)" />
            <rect x="17" y="17" width="126" height="76" rx="16" fill="var(--color-section-ink)" />
            <path d="M35 76 C58 46 74 66 94 39 C108 24 120 32 132 25" fill="none" stroke="var(--color-accent)" strokeWidth="4" strokeLinecap="round" />
            <circle cx="35" cy="76" r="5" fill="var(--color-primary)" />
            <circle cx="94" cy="39" r="5" fill="var(--color-primary)" />
            <circle cx="132" cy="25" r="5" fill="var(--color-accent)" />
          </g>

          <g data-hero-node transform="translate(111 399)" filter="url(#darma-hero-shadow)">
            <rect width="176" height="108" rx="23" fill="var(--color-surface-raised)" stroke="var(--color-border-default)" />
            <circle cx="42" cy="40" r="18" fill="var(--color-primary-soft)" stroke="var(--color-primary-border)" />
            <path d="M42 29 L42 51 M31 40 L53 40" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" />
            <rect x="70" y="24" width="82" height="9" rx="4.5" fill="var(--color-text-primary)" opacity="0.8" />
            <rect x="70" y="43" width="64" height="8" rx="4" fill="var(--color-text-tertiary)" opacity="0.45" />
            <rect x="23" y="73" width="129" height="14" rx="7" fill="var(--color-control-track)" />
            <rect x="23" y="73" width="88" height="14" rx="7" fill="url(#darma-hero-accent)" />
          </g>

          <g data-hero-node transform="translate(488 397)" filter="url(#darma-hero-shadow)">
            <rect width="168" height="112" rx="23" fill="var(--color-section-ink)" stroke="var(--color-border-strong)" />
            <rect x="18" y="18" width="132" height="76" rx="16" fill="#0b1715" />
            <circle cx="54" cy="54" r="16" fill="none" stroke="#2dd4bf" strokeWidth="7" strokeDasharray="32 18" />
            <circle cx="114" cy="55" r="15" fill="#ff6a3d" />
            <path d="M107 55 L121 55 M114 48 L114 62" stroke="#111110" strokeWidth="4" strokeLinecap="round" />
            <rect x="39" y="82" width="90" height="5" rx="2.5" fill="#f4f1ea" opacity="0.28" />
          </g>

          <g data-hero-center transform="translate(303 217)" filter="url(#darma-hero-shadow)">
            <rect width="154" height="154" rx="44" fill="url(#darma-hero-accent)" />
            <rect x="13" y="13" width="128" height="128" rx="34" fill="var(--color-section-ink)" />
            <text x="77" y="97" textAnchor="middle" fill="var(--color-text-on-ink)" fontSize="62" fontWeight="950" fontFamily="var(--font-sans)">D</text>
            <circle cx="121" cy="34" r="7" fill="var(--color-accent)" />
          </g>

          <g transform="translate(218 532)" filter="url(#darma-hero-shadow)">
            <rect width="324" height="50" rx="16" fill="var(--color-code-bg)" stroke="var(--color-code-border)" />
            <circle cx="21" cy="18" r="4" fill="#ff6a3d" />
            <circle cx="34" cy="18" r="4" fill="#f7c948" />
            <circle cx="47" cy="18" r="4" fill="#2dd4bf" />
            <rect x="20" y="31" width="68" height="5" rx="2.5" fill="var(--color-primary)" data-code-line />
            <rect x="97" y="31" width="104" height="5" rx="2.5" fill="var(--color-code-muted)" data-code-line />
            <rect x="210" y="31" width="70" height="5" rx="2.5" fill="var(--color-accent)" data-code-line />
          </g>
        </g>
      </svg>

      {FLOATING_LABELS.map(({ icon: Icon, label, className: labelClassName }) => (
        <span key={label} data-hero-label className={cn("darma-hero-label", labelClassName)}>
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </span>
      ))}

      <div className="darma-hero-metrics" aria-label="Live Darma catalog totals">
        {metrics.slice(0, 4).map((metric, index) => (
          <span key={metric} data-hero-metric>
            <span aria-hidden>{["✦", "⌁", "◉", "↗"][index]}</span>
            {metric}
          </span>
        ))}
      </div>

      <div className="darma-hero-live-pill" aria-label="Darma tools run in the browser">
        <span className="darma-hero-live-dot" aria-hidden />
        <Braces className="h-4 w-4" aria-hidden />
        Browser-first workspace
        <Sparkles className="h-4 w-4" aria-hidden />
      </div>
    </div>
  );
}
