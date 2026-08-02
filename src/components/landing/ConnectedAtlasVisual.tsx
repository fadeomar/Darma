type ConnectedAtlasVisualProps = {
  guides: number;
  comparisons: number;
  resources: number;
  paths: number;
};

export function ConnectedAtlasVisual({ guides, comparisons, resources, paths }: ConnectedAtlasVisualProps) {
  return (
    <div className="landing-atlas-map" aria-label="A connected map of Darma guides, comparisons, resources, and learning paths">
      <svg viewBox="0 0 620 430" role="img" aria-labelledby="landing-atlas-title landing-atlas-description">
        <title id="landing-atlas-title">Darma Tech Atlas connection map</title>
        <desc id="landing-atlas-description">A question connects to guides, comparisons, learning paths, roles, teams, and trusted sources.</desc>
        <defs>
          <linearGradient id="landing-atlas-link" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-primary)" />
            <stop offset="1" stopColor="var(--color-accent)" />
          </linearGradient>
          <radialGradient id="landing-atlas-glow">
            <stop offset="0" stopColor="var(--color-accent-soft)" />
            <stop offset="1" stopColor="var(--color-accent-soft)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="310" cy="214" r="185" fill="url(#landing-atlas-glow)" />
        <circle cx="310" cy="214" r="152" fill="none" stroke="var(--color-border-default)" strokeDasharray="7 11" />
        <circle cx="310" cy="214" r="94" fill="none" stroke="var(--color-accent-border)" strokeDasharray="4 9" />
        <path d="M310 214 C230 132 169 121 90 105" fill="none" stroke="url(#landing-atlas-link)" strokeWidth="4" strokeLinecap="round" />
        <path d="M310 214 C395 126 455 121 535 93" fill="none" stroke="url(#landing-atlas-link)" strokeWidth="4" strokeLinecap="round" />
        <path d="M310 214 C223 295 159 315 93 341" fill="none" stroke="url(#landing-atlas-link)" strokeWidth="4" strokeLinecap="round" />
        <path d="M310 214 C392 294 455 319 530 339" fill="none" stroke="url(#landing-atlas-link)" strokeWidth="4" strokeLinecap="round" />
        <path d="M310 214 C310 138 310 96 310 47" fill="none" stroke="var(--color-primary-border)" strokeWidth="3" strokeLinecap="round" />
        <path d="M310 214 C310 291 310 335 310 389" fill="none" stroke="var(--color-accent-border)" strokeWidth="3" strokeLinecap="round" />

        <g transform="translate(250 154)">
          <rect width="120" height="120" rx="36" fill="var(--color-section-ink)" stroke="var(--color-primary)" strokeWidth="3" />
          <text x="60" y="53" textAnchor="middle" fill="var(--color-text-on-ink-muted)" fontSize="13" fontWeight="800">START WITH</text>
          <text x="60" y="82" textAnchor="middle" fill="var(--color-text-on-ink)" fontSize="22" fontWeight="950">A QUESTION</text>
        </g>

        {[
          { x: 47, y: 72, label: "GUIDES", value: guides, accent: "var(--color-primary)" },
          { x: 464, y: 58, label: "COMPARE", value: comparisons, accent: "var(--color-accent)" },
          { x: 48, y: 309, label: "SOURCES", value: resources, accent: "var(--color-accent)" },
          { x: 462, y: 307, label: "PATHS", value: paths, accent: "var(--color-primary)" },
        ].map((node) => (
          <g key={node.label} transform={`translate(${node.x} ${node.y})`}>
            <rect width="112" height="70" rx="19" fill="var(--color-surface-raised)" stroke="var(--color-border-default)" />
            <circle cx="20" cy="20" r="7" fill={node.accent} />
            <text x="18" y="50" fill="var(--color-text-primary)" fontSize="21" fontWeight="950">{node.value}</text>
            <text x="52" y="50" fill="var(--color-text-tertiary)" fontSize="10" fontWeight="900">{node.label}</text>
          </g>
        ))}

        <g transform="translate(257 16)">
          <rect width="106" height="49" rx="16" fill="var(--color-surface-overlay)" stroke="var(--color-border-default)" />
          <text x="53" y="30" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="12" fontWeight="900">REAL CONTEXT</text>
        </g>
        <g transform="translate(252 365)">
          <rect width="116" height="49" rx="16" fill="var(--color-surface-overlay)" stroke="var(--color-border-default)" />
          <text x="58" y="30" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="12" fontWeight="900">NEXT ACTION</text>
        </g>
      </svg>
    </div>
  );
}
