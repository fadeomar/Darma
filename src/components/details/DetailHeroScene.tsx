"use client";

import { useEffect, useRef } from "react";
import { loadGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";
import type { DetailMetric, DetailVariant } from "./DetailHero";

const SCENE_COPY: Record<DetailVariant, { start: string; middle: string; end: string }> = {
  guide: { start: "QUESTION", middle: "EVIDENCE", end: "ACTION" },
  comparison: { start: "OPTION A", middle: "CRITERIA", end: "DECISION" },
  learning: { start: "FOUNDATION", middle: "PRACTICE", end: "PROOF" },
  career: { start: "ROLE", middle: "COLLABORATE", end: "GROW" },
  workflow: { start: "INPUT", middle: "HANDOFF", end: "OUTCOME" },
  method: { start: "CONTEXT", middle: "FLOW", end: "SIGNALS" },
};

function SceneGlyph({ variant }: { variant: DetailVariant }) {
  if (variant === "comparison") {
    return (
      <g data-detail-glyph>
        <rect x="225" y="88" width="90" height="60" rx="18" className="detail-scene-option" />
        <rect x="425" y="88" width="90" height="60" rx="18" className="detail-scene-option detail-scene-option-alt" />
        <text x="270" y="125" textAnchor="middle" className="detail-scene-glyph-label">A</text>
        <text x="470" y="125" textAnchor="middle" className="detail-scene-glyph-label">B</text>
        <path d="M315 118 H350 M390 118 H425" className="detail-scene-path detail-scene-path-soft" />
        <circle cx="370" cy="118" r="22" className="detail-scene-core" />
        <text x="370" y="124" textAnchor="middle" className="detail-scene-core-label">VS</text>
      </g>
    );
  }

  if (variant === "career") {
    return (
      <g data-detail-glyph>
        <circle cx="370" cy="118" r="44" className="detail-scene-core" />
        <circle cx="264" cy="76" r="18" className="detail-scene-node detail-scene-node-soft" />
        <circle cx="476" cy="76" r="18" className="detail-scene-node detail-scene-node-accent" />
        <circle cx="264" cy="164" r="18" className="detail-scene-node detail-scene-node-accent" />
        <circle cx="476" cy="164" r="18" className="detail-scene-node detail-scene-node-soft" />
        <path d="M300 90 L332 104 M440 90 L408 104 M300 150 L332 132 M440 150 L408 132" className="detail-scene-path detail-scene-path-soft" />
        <path d="M354 108 h32 M354 120 h32 M360 132 h20" className="detail-scene-core-lines" />
      </g>
    );
  }

  if (variant === "learning") {
    return (
      <g data-detail-glyph>
        <path d="M235 155 C285 98 315 145 360 92 C405 42 450 84 505 55" className="detail-scene-path detail-scene-route" />
        {[{ x: 235, y: 155 }, { x: 330, y: 120 }, { x: 410, y: 82 }, { x: 505, y: 55 }].map((point, index) => (
          <g key={index} data-detail-node>
            <circle cx={point.x} cy={point.y} r={index === 3 ? 19 : 14} className={index === 3 ? "detail-scene-node detail-scene-node-success" : "detail-scene-node"} />
            <text x={point.x} y={point.y + 4} textAnchor="middle" className="detail-scene-node-label">{index + 1}</text>
          </g>
        ))}
      </g>
    );
  }

  if (variant === "workflow" || variant === "method") {
    return (
      <g data-detail-glyph>
        {[230, 320, 410, 500].map((x, index) => (
          <g key={x} data-detail-node>
            <rect x={x - 28} y={90 + (index % 2) * 24} width="56" height="56" rx="16" className={index === 3 ? "detail-scene-stage detail-scene-stage-success" : "detail-scene-stage"} />
            <text x={x} y={124 + (index % 2) * 24} textAnchor="middle" className="detail-scene-node-label">{index + 1}</text>
          </g>
        ))}
        <path d="M258 118 H287 M348 142 H377 M438 118 H467" className="detail-scene-path detail-scene-route" />
      </g>
    );
  }

  return (
    <g data-detail-glyph>
      <rect x="236" y="70" width="268" height="98" rx="24" className="detail-scene-sheet" />
      <path d="M270 100 H410 M270 122 H470 M270 144 H438" className="detail-scene-sheet-lines" />
      <circle cx="492" cy="154" r="30" className="detail-scene-core" />
      <path d="M481 154 l8 8 15-18" className="detail-scene-check" />
    </g>
  );
}

export function DetailHeroScene({ variant, metrics }: { variant: DetailVariant; metrics: DetailMetric[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const copy = SCENE_COPY[variant];

  useEffect(() => {
    const root = rootRef.current;
    if (!root || userPrefersReducedMotion()) return;
    let context: { revert: () => void } | undefined;
    let cancelled = false;

    loadGsap().then(({ gsap }) => {
      if (cancelled || !root) return;
      context = gsap.context(() => {
        const paths = root.querySelectorAll<SVGPathElement>("[data-detail-path]");
        paths.forEach((path) => {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
          gsap.to(path, { strokeDashoffset: 0, duration: 1.1, ease: "power3.out", delay: 0.16 });
        });
        gsap.fromTo(root.querySelectorAll("[data-detail-panel]"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.62, stagger: 0.09, ease: "power3.out" });
        gsap.fromTo(root.querySelectorAll("[data-detail-node]"), { scale: 0.72, opacity: 0, transformOrigin: "center" }, { scale: 1, opacity: 1, duration: 0.55, stagger: 0.08, delay: 0.28, ease: "back.out(1.7)" });
        gsap.fromTo(root.querySelector("[data-detail-glyph]"), { scale: 0.96, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.72, delay: 0.18, ease: "power3.out" });
        gsap.to(root.querySelector("[data-detail-orbit]"), { rotate: 360, transformOrigin: "center", duration: 28, repeat: -1, ease: "none" });
        gsap.to(root.querySelector("[data-detail-float]"), { y: -7, duration: 2.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
      }, root);
    });

    return () => {
      cancelled = true;
      context?.revert();
    };
  }, [variant]);

  return (
    <div ref={rootRef} className="detail-scene" aria-hidden>
      <svg viewBox="0 0 740 390" role="presentation" focusable="false">
        <defs>
          <linearGradient id={`detail-scene-gradient-${variant}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" className="detail-scene-gradient-start" />
            <stop offset="1" className="detail-scene-gradient-end" />
          </linearGradient>
          <filter id={`detail-scene-shadow-${variant}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="12" stdDeviation="14" floodOpacity="0.12" />
          </filter>
        </defs>

        <rect x="10" y="10" width="720" height="370" rx="34" className="detail-scene-frame" />
        <path d="M34 78 H706 M34 300 H706" className="detail-scene-divider" />
        <circle cx="52" cy="45" r="6" className="detail-scene-window-dot" />
        <circle cx="72" cy="45" r="6" className="detail-scene-window-dot detail-scene-window-dot-alt" />
        <circle cx="92" cy="45" r="6" className="detail-scene-window-dot detail-scene-window-dot-muted" />
        <rect x="552" y="33" width="138" height="24" rx="12" className="detail-scene-status" />
        <text x="621" y="49" textAnchor="middle" className="detail-scene-status-label">DARMA / {variant.toUpperCase()}</text>

        <g data-detail-panel>
          <rect x="40" y="98" width="150" height="156" rx="24" className="detail-scene-side-panel" />
          <text x="62" y="126" className="detail-scene-kicker">START HERE</text>
          <text x="62" y="154" className="detail-scene-panel-title">{copy.start}</text>
          <path d="M62 178 H150 M62 198 H134 M62 218 H162" className="detail-scene-panel-lines" />
        </g>

        <g data-detail-panel>
          <rect x="550" y="98" width="150" height="156" rx="24" className="detail-scene-side-panel detail-scene-side-panel-alt" />
          <text x="572" y="126" className="detail-scene-kicker">MOVE TOWARD</text>
          <text x="572" y="154" className="detail-scene-panel-title">{copy.end}</text>
          <path d="M572 178 H666 M572 198 H648 M572 218 H680" className="detail-scene-panel-lines" />
        </g>

        <path data-detail-path d="M190 177 C230 177 218 202 256 202 C292 202 298 165 334 165 C372 165 372 207 410 207 C448 207 454 177 550 177" className="detail-scene-path" />
        <path data-detail-orbit d="M276 122 C330 78 432 80 480 126 C522 166 512 238 464 266 C404 302 316 286 268 232 C238 198 238 154 276 122 Z" className="detail-scene-orbit" />
        <SceneGlyph variant={variant} />

        <g data-detail-float>
          <rect x="312" y="230" width="116" height="38" rx="19" className="detail-scene-middle-pill" />
          <text x="370" y="254" textAnchor="middle" className="detail-scene-middle-label">{copy.middle}</text>
        </g>

        <g transform="translate(40 320)">
          {metrics.slice(0, 4).map((metric, index) => (
            <g key={metric.label} transform={`translate(${index * 166} 0)`} data-detail-panel>
              <rect width="152" height="44" rx="14" className="detail-scene-metric" />
              <text x="14" y="19" className="detail-scene-metric-value">{String(metric.value)}</text>
              <text x="14" y="34" className="detail-scene-metric-label">{metric.label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
