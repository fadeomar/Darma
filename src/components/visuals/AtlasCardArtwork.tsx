import type { LearningPathTrack } from "@/features/learning-paths/schema";
import type { TechCareer } from "@/features/tech-careers/schema";

const TRACK_LABELS: Record<LearningPathTrack, string> = {
  web: "WEB",
  mobile: "MOBILE",
  design: "DESIGN",
  devops: "DELIVERY",
};

export function LearningPathArtwork({ track, stages }: { track: LearningPathTrack; stages: number }) {
  const nodeCount = Math.max(3, Math.min(stages, 6));
  const positions = [44, 112, 180, 248, 316, 384];
  return (
    <div className={`atlas-card-art atlas-card-art-path atlas-card-art-track-${track}`} aria-hidden>
      <svg viewBox="0 0 430 176" focusable="false">
        <path d="M42 104 C112 37 164 143 224 82 C278 29 330 129 389 70" fill="none" stroke="var(--color-border-default)" strokeWidth="9" strokeLinecap="round" opacity="0.55" />
        <path d="M42 104 C112 37 164 143 224 82 C278 29 330 129 389 70" fill="none" stroke="var(--atlas-card-accent)" strokeWidth="4" strokeLinecap="round" />
        {positions.slice(0, nodeCount).map((x, index) => {
          const y = [104, 65, 113, 82, 65, 70][index] ?? 82;
          return (
            <g key={x} transform={`translate(${x} ${y})`}>
              <circle r={index === nodeCount - 1 ? 14 : 11} fill="var(--color-surface-raised)" stroke="var(--atlas-card-accent)" strokeWidth="3" />
              <circle r="4" fill={index === nodeCount - 1 ? "var(--color-accent)" : "var(--atlas-card-accent)"} />
            </g>
          );
        })}
        <rect x="22" y="18" width="92" height="28" rx="14" fill="var(--color-surface-overlay)" stroke="var(--color-border-default)" />
        <text x="68" y="36" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="10" fontWeight="950">{TRACK_LABELS[track]} ROUTE</text>
        <rect x="320" y="124" width="87" height="28" rx="14" fill="var(--color-surface-overlay)" stroke="var(--color-border-default)" />
        <text x="363.5" y="142" textAnchor="middle" fill="var(--color-text-primary)" fontSize="10" fontWeight="950">{stages} STAGES</text>
      </svg>
    </div>
  );
}

export function EditorialArtwork({ kind, subjects }: { kind: "guide" | "comparison"; subjects?: string[] }) {
  if (kind === "comparison") {
    const items = subjects?.slice(0, 3) ?? [];
    return (
      <div className="atlas-card-art atlas-card-art-comparison" aria-hidden>
        <div className="atlas-card-comparison-track">
          {[0, 1, 2].map((index) => (
            <div key={index} className="atlas-card-comparison-option">
              <span>{items[index]?.slice(0, 1).toUpperCase() || String.fromCharCode(65 + index)}</span>
              <i>{items[index] || `Option ${index + 1}`}</i>
            </div>
          ))}
          <span className="atlas-card-comparison-vs atlas-card-comparison-vs-one">VS</span>
          <span className="atlas-card-comparison-vs atlas-card-comparison-vs-two">VS</span>
        </div>
        <div className="atlas-card-comparison-context"><span>CONTEXT</span><i /><span>TRADE-OFF</span><i /><span>CHOICE</span></div>
      </div>
    );
  }

  return (
    <div className="atlas-card-art atlas-card-art-guide" aria-hidden>
      <svg viewBox="0 0 430 176" focusable="false">
        <path d="M48 122 C112 116 113 54 178 56 C240 58 242 124 306 119 C348 116 370 89 391 54" fill="none" stroke="var(--color-border-default)" strokeWidth="10" strokeLinecap="round" opacity="0.58" />
        <path d="M48 122 C112 116 113 54 178 56 C240 58 242 124 306 119 C348 116 370 89 391 54" fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" />
        {[{ x: 48, y: 122, n: "01" }, { x: 178, y: 56, n: "02" }, { x: 306, y: 119, n: "03" }, { x: 391, y: 54, n: "04" }].map((node, index) => <g key={node.n} transform={`translate(${node.x} ${node.y})`}><circle r={index === 3 ? 15 : 12} fill="var(--color-surface-raised)" stroke={index === 3 ? "var(--color-accent)" : "var(--color-primary)"} strokeWidth="3" /><text y="4" textAnchor="middle" fill="var(--color-text-primary)" fontSize="8" fontWeight="950">{node.n}</text></g>)}
        <rect x="24" y="20" width="110" height="30" rx="15" fill="var(--color-primary-soft)" stroke="var(--color-primary-border)" /><text x="79" y="39" textAnchor="middle" fill="var(--color-primary)" fontSize="10" fontWeight="950">PRACTICAL GUIDE</text>
      </svg>
    </div>
  );
}

const CAREER_LABELS: Record<TechCareer["category"], string> = {
  engineering: "ENGINEERING",
  "quality-security": "QUALITY",
  "design-research": "DESIGN",
  "product-delivery": "PRODUCT",
  leadership: "LEADERSHIP",
  "operations-growth": "OPERATIONS",
};

export function CareerArtwork({ category, collaborators }: { category: TechCareer["category"]; collaborators: number }) {
  return (
    <div className={`atlas-card-art atlas-card-art-career atlas-card-art-career-${category}`} aria-hidden>
      <svg viewBox="0 0 430 176" focusable="false">
        <circle cx="215" cy="88" r="62" fill="var(--color-primary-soft)" opacity="0.5" />
        <circle cx="215" cy="88" r="43" fill="var(--color-surface-raised)" stroke="var(--atlas-card-accent)" strokeWidth="3" />
        <circle cx="215" cy="88" r="14" fill="var(--atlas-card-accent)" />
        <path d="M215 45 V23 M258 88 H286 M215 131 V153 M172 88 H144 M185 58 L163 36 M245 58 L267 36 M185 118 L163 140 M245 118 L267 140" stroke="var(--color-border-strong)" strokeWidth="3" strokeLinecap="round" />
        {[{ x: 215, y: 20 }, { x: 291, y: 88 }, { x: 215, y: 156 }, { x: 139, y: 88 }, { x: 159, y: 32 }, { x: 271, y: 32 }, { x: 159, y: 144 }, { x: 271, y: 144 }].slice(0, Math.max(4, Math.min(collaborators, 8))).map((node, index) => <g key={`${node.x}-${node.y}`} transform={`translate(${node.x} ${node.y})`}><circle r={index < 2 ? 10 : 8} fill="var(--color-surface-raised)" stroke={index % 2 ? "var(--color-accent)" : "var(--atlas-card-accent)"} strokeWidth="3" /><circle r="3" fill={index % 2 ? "var(--color-accent)" : "var(--atlas-card-accent)"} /></g>)}
        <rect x="22" y="18" width="116" height="28" rx="14" fill="var(--color-surface-overlay)" stroke="var(--color-border-default)" /><text x="80" y="36" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="10" fontWeight="950">{CAREER_LABELS[category]}</text>
        <rect x="309" y="129" width="98" height="28" rx="14" fill="var(--color-surface-overlay)" stroke="var(--color-border-default)" /><text x="358" y="147" textAnchor="middle" fill="var(--color-text-primary)" fontSize="10" fontWeight="950">{collaborators} LINKS</text>
      </svg>
    </div>
  );
}
