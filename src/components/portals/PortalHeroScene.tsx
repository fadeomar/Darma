"use client";

import { useId, useLayoutEffect, useRef } from "react";
import { withGsap, userPrefersReducedMotion } from "@/core/motion/gsap-loader";
import { cn } from "@/lib/cn";

export type PortalVariant =
  | "tools"
  | "games"
  | "learning"
  | "guides"
  | "resources"
  | "comparisons"
  | "careers"
  | "atlas";

type PortalMetric = {
  value: string;
  label: string;
};

type PortalHeroSceneProps = {
  variant: PortalVariant;
  metrics: PortalMetric[];
  className?: string;
};

const SCENE_LABELS: Record<PortalVariant, { title: string; description: string }> = {
  tools: {
    title: "Browser tool workspace",
    description: "Controls feed a live preview and a clear export-ready result.",
  },
  games: {
    title: "Darma browser arcade",
    description: "A playful board connecting speed, puzzle, creative, and strategy games.",
  },
  learning: {
    title: "Structured learning route",
    description: "A staged path connects foundations, practice, evidence, and a finished project.",
  },
  guides: {
    title: "Practical guide workbench",
    description: "A question becomes an ordered roadmap, a practical project, and evidence connected to primary sources.",
  },
  resources: {
    title: "Verified resource network",
    description: "Official sources, courses, tools, and community references converge around a reviewed core.",
  },
  comparisons: {
    title: "Decision comparison workspace",
    description: "Two options are evaluated through shared criteria before producing a contextual recommendation.",
  },
  careers: {
    title: "Technology career network",
    description: "A role connects to collaborators, evidence, scope, and the next learning direction.",
  },
  atlas: {
    title: "Connected technology atlas",
    description: "Resources, paths, roles, teams, methods, and language form one navigable reference.",
  },
};

function ToolsScene() {
  return (
    <g>
      <g data-portal-panel transform="translate(54 92)">
        <rect width="188" height="302" rx="28" className="portal-scene-surface portal-scene-surface-controls" />
        <text x="24" y="38" className="portal-scene-kicker">CONTROLS</text>
        <rect x="24" y="62" width="138" height="12" rx="6" className="portal-scene-track" />
        <circle cx="82" cy="68" r="15" className="portal-scene-knob" />
        <rect x="24" y="104" width="140" height="42" rx="12" className="portal-scene-field" />
        <rect x="24" y="164" width="64" height="34" rx="17" className="portal-scene-chip portal-scene-chip-primary" />
        <rect x="98" y="164" width="66" height="34" rx="17" className="portal-scene-chip" />
        <rect x="24" y="220" width="140" height="11" rx="5.5" className="portal-scene-track" />
        <rect x="24" y="249" width="99" height="11" rx="5.5" className="portal-scene-track portal-scene-track-accent" />
      </g>

      <path data-portal-path pathLength="1" d="M242 244 C290 244 302 174 350 174" className="portal-scene-path" />
      <path data-portal-path pathLength="1" d="M242 270 C302 270 304 330 354 330" className="portal-scene-path portal-scene-path-accent" />
      <g data-portal-node transform="translate(320 214)">
        <circle cx="34" cy="34" r="34" className="portal-scene-core" />
        <path d="M23 34h22M34 23v22" className="portal-scene-core-mark" />
      </g>

      <g data-portal-panel transform="translate(402 68)">
        <rect width="258" height="198" rx="30" className="portal-scene-surface portal-scene-surface-preview" />
        <text x="24" y="38" className="portal-scene-kicker">LIVE PREVIEW</text>
        <rect x="24" y="58" width="210" height="110" rx="20" className="portal-scene-ink" />
        <path d="M51 142 C80 97 105 124 132 88 C157 56 182 83 212 65" className="portal-scene-chart-line" />
        <circle cx="51" cy="142" r="6" className="portal-scene-dot" />
        <circle cx="132" cy="88" r="6" className="portal-scene-dot" />
        <circle cx="212" cy="65" r="6" className="portal-scene-dot portal-scene-dot-accent" />
      </g>

      <g data-portal-panel transform="translate(402 292)">
        <rect width="258" height="138" rx="28" className="portal-scene-surface portal-scene-surface-result" />
        <text x="24" y="36" className="portal-scene-kicker">RESULT</text>
        <text x="24" y="88" className="portal-scene-big-number">READY</text>
        <rect x="174" y="52" width="60" height="60" rx="18" className="portal-scene-export" />
        <path d="M191 82h26M204 69v26" className="portal-scene-export-mark" />
      </g>
    </g>
  );
}

function GamesScene() {
  return (
    <g>
      <rect x="62" y="58" width="596" height="382" rx="38" className="portal-scene-surface portal-scene-game-board" />
      <path d="M360 58v382" className="portal-scene-grid-line" />
      <path d="M62 249h596" className="portal-scene-grid-line" />
      <path data-portal-path pathLength="1" d="M110 356 C180 270 221 342 283 250 C337 170 391 222 449 154 C499 96 546 138 610 88" className="portal-scene-path portal-scene-path-game" />

      <g data-portal-node transform="translate(94 324)">
        <rect width="82" height="48" rx="16" className="portal-scene-chip portal-scene-game-chip" />
        <text x="41" y="30" textAnchor="middle" className="portal-scene-game-label">START</text>
      </g>
      <g data-portal-node transform="translate(255 212)">
        <circle cx="34" cy="34" r="34" className="portal-scene-game-orb portal-scene-game-orb-a" />
        <path d="M24 34h20M34 24v20" className="portal-scene-core-mark" />
      </g>
      <g data-portal-node transform="translate(424 120)">
        <rect width="86" height="86" rx="24" className="portal-scene-game-orb portal-scene-game-orb-b" />
        <path d="M26 43h34M43 26v34" className="portal-scene-core-mark portal-scene-core-mark-dark" />
      </g>
      <g data-portal-node transform="translate(552 58)">
        <path d="M42 0 84 42 42 84 0 42Z" className="portal-scene-game-diamond" />
        <circle cx="42" cy="42" r="10" className="portal-scene-game-core" />
      </g>

      <g data-portal-float transform="translate(102 86)">
        <rect width="126" height="76" rx="20" className="portal-scene-game-tile" />
        <text x="18" y="28" className="portal-scene-kicker portal-scene-kicker-on-dark">SCORE</text>
        <text x="18" y="58" className="portal-scene-score">02480</text>
      </g>
      <g data-portal-float transform="translate(488 330)">
        <rect width="128" height="70" rx="20" className="portal-scene-game-tile" />
        <text x="20" y="28" className="portal-scene-kicker portal-scene-kicker-on-dark">COMBO</text>
        <text x="20" y="55" className="portal-scene-score">x 08</text>
      </g>
    </g>
  );
}

function LearningScene() {
  return (
    <g>
      <path data-portal-path pathLength="1" d="M82 390 C162 374 147 285 230 278 C314 271 300 184 390 178 C480 172 493 88 626 92" className="portal-scene-path portal-scene-path-learning" />
      {[
        { x: 60, y: 350, n: "01", title: "FOUNDATIONS" },
        { x: 205, y: 238, n: "02", title: "PRACTICE" },
        { x: 365, y: 138, n: "03", title: "EVIDENCE" },
        { x: 536, y: 52, n: "04", title: "PROJECT" },
      ].map((step, index) => (
        <g key={step.n} data-portal-node className={`portal-scene-learning-step portal-scene-learning-step-${index + 1}`} transform={`translate(${step.x} ${step.y})`}>
          <rect width="130" height="82" rx="22" className={`portal-scene-surface portal-scene-learning-card portal-scene-learning-card-${index + 1}`} />
          <text x="18" y="29" className="portal-scene-kicker">{step.n}</text>
          <text x="18" y="56" className="portal-scene-learning-label">{step.title}</text>
        </g>
      ))}
      <g data-portal-float transform="translate(68 78)">
        <rect width="210" height="102" rx="26" className="portal-scene-surface" />
        <text x="22" y="31" className="portal-scene-kicker">PROGRESS</text>
        <rect x="22" y="51" width="166" height="14" rx="7" className="portal-scene-track" />
        <rect x="22" y="51" width="112" height="14" rx="7" className="portal-scene-progress" />
        <text x="22" y="86" className="portal-scene-small-label">3 checkpoints completed</text>
      </g>
      <g data-portal-float transform="translate(458 302)">
        <rect width="196" height="112" rx="26" className="portal-scene-surface portal-scene-surface-result" />
        <text x="22" y="32" className="portal-scene-kicker">PROOF OF WORK</text>
        <rect x="22" y="52" width="58" height="40" rx="12" className="portal-scene-export" />
        <rect x="92" y="56" width="78" height="9" rx="4.5" className="portal-scene-track" />
        <rect x="92" y="76" width="58" height="9" rx="4.5" className="portal-scene-track portal-scene-track-accent" />
      </g>
    </g>
  );
}


function GuidesScene() {
  return (
    <g>
      <g data-portal-panel transform="translate(54 76)">
        <rect width="206" height="312" rx="30" className="portal-scene-surface portal-scene-guide-outline" />
        <text x="24" y="38" className="portal-scene-kicker">STARTING QUESTION</text>
        <rect x="24" y="60" width="152" height="16" rx="8" className="portal-scene-track portal-scene-track-accent" />
        <rect x="24" y="94" width="128" height="10" rx="5" className="portal-scene-track" />
        <rect x="24" y="118" width="158" height="10" rx="5" className="portal-scene-track" />
        <rect x="24" y="156" width="58" height="58" rx="18" className="portal-scene-guide-step" />
        <text x="53" y="191" textAnchor="middle" className="portal-scene-guide-step-label">01</text>
        <rect x="96" y="165" width="86" height="10" rx="5" className="portal-scene-track" />
        <rect x="96" y="188" width="66" height="10" rx="5" className="portal-scene-track portal-scene-track-accent" />
        <rect x="24" y="235" width="158" height="52" rx="16" className="portal-scene-guide-note" />
        <text x="38" y="257" className="portal-scene-kicker">WHAT CAN WAIT</text>
        <rect x="38" y="268" width="92" height="7" rx="3.5" className="portal-scene-track" />
      </g>

      <path data-portal-path pathLength="1" d="M260 232 C302 232 313 190 354 190" className="portal-scene-path" />
      <path data-portal-path pathLength="1" d="M260 270 C304 270 314 326 354 326" className="portal-scene-path portal-scene-path-accent" />
      <g data-portal-node transform="translate(326 220)">
        <rect width="70" height="92" rx="24" className="portal-scene-guide-core" />
        <path d="M24 31h22M24 46h22M24 61h14" className="portal-scene-guide-core-lines" />
      </g>

      <g data-portal-panel transform="translate(432 58)">
        <rect width="232" height="196" rx="30" className="portal-scene-surface portal-scene-guide-evidence" />
        <text x="24" y="37" className="portal-scene-kicker">PRIMARY EVIDENCE</text>
        <rect x="24" y="60" width="184" height="42" rx="14" className="portal-scene-guide-source" />
        <circle cx="47" cy="81" r="9" className="portal-scene-status-dot" />
        <rect x="66" y="72" width="106" height="8" rx="4" className="portal-scene-track" />
        <rect x="66" y="88" width="74" height="7" rx="3.5" className="portal-scene-track portal-scene-track-accent" />
        <rect x="24" y="118" width="184" height="52" rx="14" className="portal-scene-guide-source" />
        <circle cx="47" cy="144" r="9" className="portal-scene-dot portal-scene-dot-accent" />
        <rect x="66" y="133" width="120" height="8" rx="4" className="portal-scene-track" />
        <rect x="66" y="149" width="88" height="7" rx="3.5" className="portal-scene-track portal-scene-track-accent" />
      </g>

      <g data-portal-float transform="translate(414 286)">
        <rect width="250" height="136" rx="28" className="portal-scene-surface portal-scene-surface-result" />
        <text x="24" y="36" className="portal-scene-kicker">PRACTICAL OUTPUT</text>
        <rect x="24" y="55" width="72" height="56" rx="16" className="portal-scene-export" />
        <path d="M43 84h34M60 67v34" className="portal-scene-export-mark" />
        <text x="116" y="76" className="portal-scene-small-label">Roadmap + project</text>
        <text x="116" y="99" className="portal-scene-kicker">READY TO USE</text>
      </g>
    </g>
  );
}

function ResourcesScene() {
  return (
    <g>
      <g data-portal-orbit>
        <ellipse cx="360" cy="252" rx="265" ry="174" className="portal-scene-orbit" />
        <ellipse cx="360" cy="252" rx="182" ry="116" className="portal-scene-orbit portal-scene-orbit-inner" />
      </g>
      <path data-portal-path pathLength="1" d="M126 170 C212 198 242 209 316 236" className="portal-scene-path" />
      <path data-portal-path pathLength="1" d="M570 139 C504 179 463 201 406 238" className="portal-scene-path portal-scene-path-accent" />
      <path data-portal-path pathLength="1" d="M142 351 C222 319 267 291 318 268" className="portal-scene-path portal-scene-path-accent" />
      <path data-portal-path pathLength="1" d="M576 352 C502 322 456 296 404 269" className="portal-scene-path" />

      {[
        { x: 58, y: 120, label: "DOCS", tone: "primary" },
        { x: 530, y: 86, label: "COURSES", tone: "accent" },
        { x: 72, y: 322, label: "TOOLS", tone: "accent" },
        { x: 530, y: 324, label: "COMMUNITY", tone: "primary" },
      ].map((node) => (
        <g key={node.label} data-portal-node transform={`translate(${node.x} ${node.y})`}>
          <rect width="138" height="78" rx="22" className={`portal-scene-surface portal-scene-resource-node portal-scene-resource-node-${node.tone}`} />
          <text x="69" y="46" textAnchor="middle" className="portal-scene-resource-label">{node.label}</text>
        </g>
      ))}

      <g data-portal-node transform="translate(292 184)">
        <circle cx="68" cy="68" r="68" className="portal-scene-resource-core" />
        <circle cx="68" cy="68" r="47" className="portal-scene-resource-core-inner" />
        <path d="M46 70 61 85 92 50" className="portal-scene-check" />
        <text x="68" y="116" textAnchor="middle" className="portal-scene-kicker">REVIEWED</text>
      </g>
      <g data-portal-float transform="translate(250 374)">
        <rect width="220" height="66" rx="20" className="portal-scene-surface portal-scene-resource-status" />
        <circle cx="28" cy="33" r="8" className="portal-scene-status-dot" />
        <text x="50" y="29" className="portal-scene-small-label">Official source</text>
        <text x="50" y="48" className="portal-scene-kicker">CONNECTED TO A PATH</text>
      </g>
    </g>
  );
}

function ComparisonsScene() {
  return (
    <g>
      <g data-portal-panel transform="translate(48 88)">
        <rect width="208" height="292" rx="30" className="portal-scene-surface portal-scene-option-a" />
        <text x="24" y="39" className="portal-scene-kicker">OPTION A</text>
        <circle cx="104" cy="110" r="54" className="portal-scene-comparison-orb portal-scene-comparison-orb-a" />
        <path d="M77 110h54M104 83v54" className="portal-scene-core-mark" />
        <rect x="28" y="192" width="152" height="12" rx="6" className="portal-scene-track" />
        <rect x="28" y="222" width="112" height="12" rx="6" className="portal-scene-track portal-scene-track-accent" />
        <rect x="28" y="252" width="134" height="12" rx="6" className="portal-scene-track" />
      </g>
      <g data-portal-panel transform="translate(464 88)">
        <rect width="208" height="292" rx="30" className="portal-scene-surface portal-scene-option-b" />
        <text x="24" y="39" className="portal-scene-kicker">OPTION B</text>
        <rect x="50" y="56" width="108" height="108" rx="30" className="portal-scene-comparison-orb portal-scene-comparison-orb-b" />
        <path d="M78 110h52M104 84v52" className="portal-scene-core-mark portal-scene-core-mark-dark" />
        <rect x="28" y="192" width="132" height="12" rx="6" className="portal-scene-track" />
        <rect x="28" y="222" width="152" height="12" rx="6" className="portal-scene-track portal-scene-track-accent" />
        <rect x="28" y="252" width="102" height="12" rx="6" className="portal-scene-track" />
      </g>

      <path data-portal-path pathLength="1" d="M256 222 C294 222 307 222 332 222" className="portal-scene-path" />
      <path data-portal-path pathLength="1" d="M388 222 C420 222 429 222 464 222" className="portal-scene-path portal-scene-path-accent" />
      <g data-portal-node transform="translate(322 176)">
        <rect width="76" height="92" rx="25" className="portal-scene-comparison-vs" />
        <text x="38" y="57" textAnchor="middle" className="portal-scene-vs-label">VS</text>
      </g>
      <g data-portal-float transform="translate(262 38)">
        <rect width="196" height="88" rx="24" className="portal-scene-surface portal-scene-criteria" />
        <text x="98" y="31" textAnchor="middle" className="portal-scene-kicker">SHARED CRITERIA</text>
        <g className="portal-scene-criteria-dots"><circle cx="46" cy="59" r="7"/><circle cx="76" cy="59" r="7"/><circle cx="106" cy="59" r="7"/><circle cx="136" cy="59" r="7"/><circle cx="166" cy="59" r="7"/></g>
      </g>
      <g data-portal-float transform="translate(244 398)">
        <rect width="232" height="64" rx="20" className="portal-scene-surface portal-scene-surface-result" />
        <circle cx="31" cy="32" r="10" className="portal-scene-status-dot" />
        <text x="54" y="28" className="portal-scene-small-label">Contextual recommendation</text>
        <text x="54" y="47" className="portal-scene-kicker">NO UNIVERSAL WINNER</text>
      </g>
    </g>
  );
}

function CareersScene() {
  const nodes = [
    { x: 60, y: 82, label: "DESIGN" },
    { x: 534, y: 82, label: "PRODUCT" },
    { x: 42, y: 334, label: "QUALITY" },
    { x: 544, y: 334, label: "DELIVERY" },
  ];
  return (
    <g>
      {nodes.map((node, index) => (
        <g key={node.label}>
          <path data-portal-path pathLength="1" d={index === 0 ? "M198 152 C252 176 276 196 322 222" : index === 1 ? "M534 152 C476 177 452 197 398 222" : index === 2 ? "M180 352 C244 326 276 300 322 270" : "M544 352 C480 326 445 300 398 270"} className={index % 2 ? "portal-scene-path portal-scene-path-accent" : "portal-scene-path"} />
          <g data-portal-node transform={`translate(${node.x} ${node.y})`}>
            <rect width="142" height="76" rx="22" className="portal-scene-surface portal-scene-career-node" />
            <text x="71" y="45" textAnchor="middle" className="portal-scene-resource-label">{node.label}</text>
          </g>
        </g>
      ))}
      <g data-portal-node transform="translate(286 176)">
        <circle cx="74" cy="74" r="74" className="portal-scene-career-core" />
        <circle cx="74" cy="74" r="51" className="portal-scene-career-core-inner" />
        <text x="74" y="69" textAnchor="middle" className="portal-scene-career-role">ROLE</text>
        <text x="74" y="91" textAnchor="middle" className="portal-scene-kicker">IN CONTEXT</text>
      </g>
      <g data-portal-float transform="translate(238 34)">
        <rect width="244" height="76" rx="22" className="portal-scene-surface" />
        <text x="22" y="30" className="portal-scene-kicker">SCOPE</text>
        <rect x="22" y="47" width="200" height="12" rx="6" className="portal-scene-track" />
        <rect x="22" y="47" width="135" height="12" rx="6" className="portal-scene-progress" />
      </g>
      <g data-portal-float transform="translate(220 394)">
        <rect width="280" height="70" rx="22" className="portal-scene-surface portal-scene-surface-result" />
        <text x="24" y="29" className="portal-scene-kicker">EVIDENCE</text>
        <text x="24" y="52" className="portal-scene-small-label">Deliverables • autonomy • influence • outcomes</text>
      </g>
    </g>
  );
}

function AtlasScene() {
  const nodes = [
    { x: 50, y: 76, label: "RESOURCES" },
    { x: 518, y: 70, label: "PATHS" },
    { x: 34, y: 330, label: "ROLES" },
    { x: 536, y: 330, label: "TEAMS" },
    { x: 284, y: 38, label: "METHODS" },
    { x: 284, y: 404, label: "LANGUAGE" },
  ];
  return (
    <g>
      <g data-portal-orbit>
        <ellipse cx="360" cy="248" rx="278" ry="180" className="portal-scene-orbit" />
        <ellipse cx="360" cy="248" rx="190" ry="126" className="portal-scene-orbit portal-scene-orbit-inner" />
      </g>
      {nodes.map((node, index) => {
        const paths = [
          "M176 134 C240 164 278 191 322 218",
          "M518 130 C466 161 430 188 398 218",
          "M168 362 C236 330 278 300 322 278",
          "M536 362 C476 329 437 300 398 278",
          "M360 102 C360 145 360 176 360 204",
          "M360 404 C360 350 360 319 360 292",
        ];
        return (
          <g key={node.label}>
            <path data-portal-path pathLength="1" d={paths[index]} className={index % 2 ? "portal-scene-path portal-scene-path-accent" : "portal-scene-path"} />
            <g data-portal-node transform={`translate(${node.x} ${node.y})`}>
              <rect width="144" height="68" rx="21" className="portal-scene-surface portal-scene-atlas-node" />
              <text x="72" y="41" textAnchor="middle" className="portal-scene-resource-label">{node.label}</text>
            </g>
          </g>
        );
      })}
      <g data-portal-node transform="translate(298 186)">
        <rect width="124" height="124" rx="38" className="portal-scene-atlas-core" />
        <rect x="15" y="15" width="94" height="94" rx="29" className="portal-scene-atlas-core-inner" />
        <text x="62" y="78" textAnchor="middle" className="portal-scene-atlas-letter">D</text>
      </g>
    </g>
  );
}

function VariantScene({ variant }: { variant: PortalVariant }) {
  switch (variant) {
    case "tools": return <ToolsScene />;
    case "games": return <GamesScene />;
    case "learning": return <LearningScene />;
    case "guides": return <GuidesScene />;
    case "resources": return <ResourcesScene />;
    case "comparisons": return <ComparisonsScene />;
    case "careers": return <CareersScene />;
    case "atlas": return <AtlasScene />;
  }
}

export function PortalHeroScene({ variant, metrics, className }: PortalHeroSceneProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rawId = useId();
  const id = rawId.replace(/:/g, "");
  const labels = SCENE_LABELS[variant];

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || userPrefersReducedMotion()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    let removePointerListeners: (() => void) | undefined;

    withGsap(({ gsap }) => {
      if (cancelled || !rootRef.current) return;
      const context = gsap.context(() => {
        const scene = root.querySelector<SVGGElement>("[data-portal-scene]");
        const paths = root.querySelectorAll<SVGPathElement>("[data-portal-path]");
        const nodes = root.querySelectorAll<SVGGElement>("[data-portal-node]");
        const panels = root.querySelectorAll<SVGGElement>("[data-portal-panel]");
        const floats = root.querySelectorAll<SVGGElement>("[data-portal-float]");
        const orbits = root.querySelectorAll<SVGGElement>("[data-portal-orbit]");
        const metricsEls = root.querySelectorAll<HTMLElement>("[data-portal-metric]");

        gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .fromTo(scene, { opacity: 0, scale: 0.955, rotate: -0.8 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.85 })
          .fromTo(panels, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.58, stagger: 0.08 }, "-=0.56")
          .to(paths, { strokeDashoffset: 0, duration: 0.86, stagger: 0.08 }, "-=0.58")
          .fromTo(nodes, { opacity: 0, scale: 0.62 }, { opacity: 1, scale: 1, duration: 0.56, stagger: 0.065, ease: "back.out(1.45)" }, "-=0.68")
          .fromTo(floats, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.48, stagger: 0.07 }, "-=0.34")
          .fromTo(metricsEls, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.42, stagger: 0.05 }, "-=0.2");

        if (floats.length) {
          gsap.to(floats, { y: (index) => index % 2 === 0 ? -7 : 7, duration: 2.8, repeat: -1, yoyo: true, stagger: 0.18, ease: "sine.inOut" });
        }
        if (orbits.length) {
          gsap.to(orbits, { rotate: 360, transformOrigin: "50% 50%", duration: 58, repeat: -1, ease: "none" });
        }
        gsap.to(scene, {
          yPercent: -3,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.7 },
        });

        if (scene && window.matchMedia("(pointer: fine)").matches) {
          const moveX = gsap.quickTo(scene, "x", { duration: 0.65, ease: "power3.out" });
          const moveY = gsap.quickTo(scene, "y", { duration: 0.65, ease: "power3.out" });
          const rotateX = gsap.quickTo(scene, "rotationY", { duration: 0.65, ease: "power3.out" });
          const rotateY = gsap.quickTo(scene, "rotationX", { duration: 0.65, ease: "power3.out" });
          const onPointerMove = (event: PointerEvent) => {
            const rect = root.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            moveX(x * 10);
            moveY(y * 8);
            rotateX(x * 2.2);
            rotateY(y * -1.9);
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
  }, [variant]);

  return (
    <div ref={rootRef} className={cn("portal-hero-scene", `portal-hero-scene-${variant}`, className)}>
      <span className="portal-scene-aurora portal-scene-aurora-a" aria-hidden />
      <span className="portal-scene-aurora portal-scene-aurora-b" aria-hidden />
      <svg viewBox="0 0 720 500" role="img" aria-labelledby={`${id}-title ${id}-description`}>
        <title id={`${id}-title`}>{labels.title}</title>
        <desc id={`${id}-description`}>{labels.description}</desc>
        <defs>
          <linearGradient id={`${id}-primary`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-primary)" />
            <stop offset="1" stopColor="var(--color-accent)" />
          </linearGradient>
          <linearGradient id={`${id}-soft`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-primary-soft)" />
            <stop offset="1" stopColor="var(--color-accent-soft)" />
          </linearGradient>
          <pattern id={`${id}-grid`} width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M34 0H0V34" fill="none" stroke="var(--color-border-subtle)" strokeWidth="1" />
          </pattern>
        </defs>
        <g data-portal-scene>
          <rect x="14" y="14" width="692" height="472" rx="44" className="portal-scene-frame" />
          <rect x="14" y="14" width="692" height="472" rx="44" fill={`url(#${id}-grid)`} opacity="0.72" />
          <VariantScene variant={variant} />
        </g>
      </svg>
      <div className="portal-scene-metrics" aria-label="Section overview">
        {metrics.slice(0, 4).map((metric, index) => (
          <span key={`${metric.value}-${metric.label}`} data-portal-metric>
            <i aria-hidden>{["✦", "⌁", "◉", "↗"][index]}</i>
            <strong>{metric.value}</strong>
            <small>{metric.label}</small>
          </span>
        ))}
      </div>
    </div>
  );
}
