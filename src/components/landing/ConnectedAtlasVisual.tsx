type ConnectedAtlasVisualProps = {
  guides: number;
  comparisons: number;
  resources: number;
  paths: number;
};

/*
 * Connected Atlas map.
 *
 * One coordinate system, one node shape. Every metric node is drawn from the
 * same `<AtlasMetricNode>` at the same width/height/padding, so a three-digit
 * count and a one-digit count produce identical boxes and the number can never
 * run into its label. Positions live in `NODE_LAYOUT` rather than being spread
 * across per-fragment x/y attributes.
 *
 * Text is sized in viewBox units and the whole SVG scales as one piece, so the
 * composition holds at any width it is given. Below the Atlas band's two-column
 * breakpoint the radial form has no room left, so the same data renders as a
 * plain grid instead of a shrunken diagram.
 */

const NODE_W = 158;
const NODE_H = 100;

/** Anchor = where this node's connector meets it, in viewBox units. */
const NODE_LAYOUT = [
  { id: "guides", x: 14, y: 36, anchorX: 172, anchorY: 86, path: "M199 197 C174 178 172 128 172 86" },
  { id: "comparisons", x: 448, y: 36, anchorX: 448, anchorY: 86, path: "M421 197 C446 178 448 128 448 86" },
  { id: "resources", x: 14, y: 332, anchorX: 172, anchorY: 382, path: "M199 253 C174 272 172 322 172 382" },
  { id: "paths", x: 448, y: 332, anchorX: 448, anchorY: 382, path: "M421 253 C446 272 448 322 448 382" },
] as const;

type AtlasMetric = {
  id: string;
  /** Small category row above the number. */
  kicker: string;
  value: number;
  label: string;
  accent: string;
};

function AtlasMetricNode({ metric, x, y }: { metric: AtlasMetric; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={NODE_W} height={NODE_H} rx="20" fill="var(--color-surface-raised)" stroke="var(--color-border-default)" />
      <circle cx="20" cy="24" r="5.5" fill={metric.accent} />
      <text className="landing-atlas-node-kicker" x="34" y="30">{metric.kicker}</text>
      <text className="landing-atlas-node-value" x="18" y="68">{metric.value}</text>
      <text className="landing-atlas-node-label" x="18" y="87">{metric.label}</text>
    </g>
  );
}

function AtlasSecondaryNode({ label, y }: { label: string; y: number }) {
  return (
    <g transform={`translate(230 ${y})`}>
      <rect width="160" height="40" rx="14" fill="var(--color-surface-overlay)" stroke="var(--color-border-default)" />
      <text className="landing-atlas-node-label" x="80" y="25" textAnchor="middle">{label}</text>
    </g>
  );
}

export function ConnectedAtlasVisual({ guides, comparisons, resources, paths }: ConnectedAtlasVisualProps) {
  const metrics: AtlasMetric[] = [
    { id: "guides", kicker: "EDITORIAL", value: guides, label: "GUIDES", accent: "var(--color-primary)" },
    { id: "comparisons", kicker: "DECISIONS", value: comparisons, label: "COMPARE", accent: "var(--color-accent)" },
    { id: "resources", kicker: "CATALOG", value: resources, label: "SOURCES", accent: "var(--color-accent)" },
    { id: "paths", kicker: "ROUTES", value: paths, label: "PATHS", accent: "var(--color-primary)" },
  ];
  const byId = new Map(metrics.map((metric) => [metric.id, metric]));

  return (
    <div
      className="landing-atlas-map"
      role="img"
      aria-label={`A connected map: a question leads to ${guides} guides, ${comparisons} comparisons, ${resources} cataloged sources, and ${paths} learning paths, framed by real context and a next action.`}
    >
      <svg className="landing-atlas-map-diagram" viewBox="0 0 620 470" aria-hidden focusable="false">
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

        <circle cx="310" cy="225" r="210" fill="url(#landing-atlas-glow)" />
        <circle cx="310" cy="225" r="152" fill="none" stroke="var(--color-border-default)" strokeDasharray="7 11" />
        <circle cx="310" cy="225" r="132" fill="none" stroke="var(--color-accent-border)" strokeDasharray="4 9" />

        {NODE_LAYOUT.map((node) => (
          <path key={`link-${node.id}`} d={node.path} fill="none" stroke="url(#landing-atlas-link)" strokeWidth="4" strokeLinecap="round" />
        ))}
        <path d="M310 169V40" fill="none" stroke="var(--color-primary-border)" strokeWidth="3" strokeLinecap="round" />
        <path d="M310 281V430" fill="none" stroke="var(--color-accent-border)" strokeWidth="3" strokeLinecap="round" />

        <g transform="translate(199 169)">
          <rect width="222" height="112" rx="34" fill="var(--color-section-ink)" stroke="var(--color-primary)" strokeWidth="3" />
          {/* Deliberate two-line break so the centre never has to hyphenate or
              spill past the shape at any scale. */}
          <text className="landing-atlas-center-kicker" x="111" y="47" textAnchor="middle">START WITH</text>
          <text className="landing-atlas-center-title" x="111" y="79" textAnchor="middle">A QUESTION</text>
        </g>

        {NODE_LAYOUT.map((node) => {
          const metric = byId.get(node.id);
          return metric ? <AtlasMetricNode key={node.id} metric={metric} x={node.x} y={node.y} /> : null;
        })}

        <AtlasSecondaryNode label="REAL CONTEXT" y={0} />
        <AtlasSecondaryNode label="NEXT ACTION" y={430} />
      </svg>

      {/* Narrow viewports: the same six directions as a stacked relationship
          map, so nothing is shrunk below a readable size. */}
      <div className="landing-atlas-stack" aria-hidden>
        <p className="landing-atlas-stack-band">Real context</p>
        <div className="landing-atlas-stack-center">
          <small>Start with</small>
          <strong>A question</strong>
        </div>
        <ul className="landing-atlas-stack-grid">
          {metrics.map((metric) => (
            <li key={metric.id} style={{ ["--atlas-node-accent" as string]: metric.accent }}>
              <span><i />{metric.kicker}</span>
              <strong>{metric.value}</strong>
              <small>{metric.label}</small>
            </li>
          ))}
        </ul>
        <p className="landing-atlas-stack-band">Next action</p>
      </div>
    </div>
  );
}
