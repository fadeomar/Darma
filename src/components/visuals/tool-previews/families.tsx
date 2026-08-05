import type {
  CalcPreviewConfig,
  ChartPreviewConfig,
  CodePreviewConfig,
  ColorPreviewConfig,
  DataPreviewConfig,
  GeometryPreviewConfig,
  ImagePreviewConfig,
  LayoutPreviewConfig,
  MetaPreviewConfig,
  SecurityPreviewConfig,
  TextLine,
  TextPreviewConfig,
  TimePreviewConfig,
} from "./types";

/**
 * The twelve preview compositions. Each one takes its content from the tool's
 * entry in the registry, so tools that share a family still show their own
 * input, output, and result.
 */

/** Splits `a «match» b` into plain and highlighted runs. */
function marked(text: string, keyPrefix: string) {
  return text.split(/(«[^»]*»)/g).filter(Boolean).map((part, index) =>
    part.startsWith("«") && part.endsWith("»") ? (
      <mark key={`${keyPrefix}-${index}`} className="tp-mark">{part.slice(1, -1)}</mark>
    ) : (
      <span key={`${keyPrefix}-${index}`}>{part}</span>
    ),
  );
}

function TextLines({ lines, id }: { lines: TextLine[]; id: string }) {
  return (
    <div className="tp-lines">
      {lines.map((line, index) => (
        <p key={`${id}-${index}`} className={`tp-line tp-line-${line.tone ?? "plain"}`}>
          {line.tone === "bullet" ? <i className="tp-dot" /> : null}
          <span>{marked(line.text, `${id}-${index}`)}</span>
        </p>
      ))}
    </div>
  );
}

export function TextPreview({ config }: { config: TextPreviewConfig }) {
  return (
    <div className="tp-frame tp-text">
      {config.pattern ? <div className="tp-pattern"><span>/</span>{config.pattern}<span>/g</span></div> : null}
      <div className="tp-split">
        <div className="tp-pane">
          <span className="tp-pane-label">{config.inputLabel}</span>
          <TextLines lines={config.input} id="in" />
        </div>
        <div className="tp-op"><span>{config.op}</span></div>
        <div className="tp-pane tp-pane-out">
          <span className="tp-pane-label">{config.outputLabel}</span>
          <TextLines lines={config.output} id="out" />
        </div>
      </div>
      {config.stat ? (
        <div className="tp-stat"><span>{config.stat.label}</span><strong>{config.stat.value}</strong></div>
      ) : null}
    </div>
  );
}

export function DataPreview({ config }: { config: DataPreviewConfig }) {
  return (
    <div className="tp-frame tp-data">
      <div className="tp-window">
        <div className="tp-window-bar">
          <i /><i /><i />
          <span>{config.title}</span>
        </div>
        {config.segments ? (
          <div className="tp-segments">
            {config.segments.map((segment) => (
              <span key={segment.label} className={`tp-segment tp-segment-${segment.tone}`}>{segment.label}</span>
            ))}
          </div>
        ) : null}
        <div className="tp-code">
          {config.lines.map((line, index) => (
            <p key={index} style={{ paddingLeft: `${(line.indent ?? 0) * 0.85}em` }}>
              {line.key ? <b className="tp-tok-key">{line.key}</b> : null}
              {line.key && line.value !== undefined ? <span className="tp-tok-punct">: </span> : null}
              {line.value !== undefined ? (
                <span className={`tp-tok-${line.kind ?? "plain"}`}>{line.value}</span>
              ) : null}
            </p>
          ))}
        </div>
      </div>
      {config.status ? (
        <span className={`tp-badge tp-badge-${config.status.tone}`}>{config.status.text}</span>
      ) : null}
    </div>
  );
}

/** Colours a code line by shape: selector, comment, or property/value pair. */
function codeTokens(line: string, index: number) {
  const trimmed = line.trimStart();
  const indent = line.length - trimmed.length;
  const pad = { paddingLeft: `${indent * 0.42}em` };
  if (!trimmed) return <p key={index} style={pad}>&nbsp;</p>;
  if (trimmed.startsWith("/*") || trimmed.startsWith("//") || trimmed.startsWith("#")) {
    return <p key={index} style={pad}><span className="tp-tok-cmt">{trimmed}</span></p>;
  }
  const split = trimmed.indexOf(":");
  if (split > 0) {
    return (
      <p key={index} style={pad}>
        <span className="tp-tok-prop">{trimmed.slice(0, split)}</span>
        <span className="tp-tok-punct">:</span>
        <span className="tp-tok-val">{trimmed.slice(split + 1)}</span>
      </p>
    );
  }
  return <p key={index} style={pad}><span className="tp-tok-sel">{trimmed}</span></p>;
}

export function CodePreview({ config }: { config: CodePreviewConfig }) {
  return (
    <div className="tp-frame tp-codegen">
      {config.chips?.length ? (
        <div className="tp-chips">
          {config.chips.map((chip) => <span key={chip}>{chip}</span>)}
        </div>
      ) : null}
      <div className="tp-codegen-body">
        <div className="tp-window tp-window-flat">
          <div className="tp-window-bar"><i /><i /><i /><span>{config.lang}</span></div>
          <div className="tp-code">{config.code.map(codeTokens)}</div>
        </div>
        {config.sample && config.sample !== "none" ? (
          <div className={`tp-sample tp-sample-${config.sample}`}>
            {config.sample === "button" ? <span>Action</span> : null}
            {config.sample === "badge" ? <span>Live</span> : null}
            {config.sample === "card" ? <><i /><i /></> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CalcPreview({ config }: { config: CalcPreviewConfig }) {
  return (
    <div className="tp-frame tp-calc">
      <div className="tp-calc-inputs">
        {config.inputs.map((row) => (
          <div key={row.label} className="tp-row">
            <span>{row.label}</span>
            <b>{row.value}</b>
          </div>
        ))}
      </div>
      <div className="tp-calc-result">
        <span className="tp-pane-label">{config.result.label}</span>
        <strong>
          {config.result.value}
          {config.result.unit ? <em>{config.result.unit}</em> : null}
        </strong>
        {config.result.note ? <small>{config.result.note}</small> : null}
        {config.scale ? (
          <div className="tp-scale">
            <span className="tp-scale-track"><i style={{ left: `${config.scale.pos}%` }} /></span>
            <span className="tp-scale-ends"><em>{config.scale.min}</em><em>{config.scale.max}</em></span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function linePoints(series: number[]) {
  const step = series.length > 1 ? 100 / (series.length - 1) : 100;
  return series.map((value, index) => `${(index * step).toFixed(1)},${(100 - value).toFixed(1)}`).join(" ");
}

export function ChartPreview({ config }: { config: ChartPreviewConfig }) {
  const total = config.series.reduce((sum, value) => sum + value, 0) || 1;
  return (
    <div className="tp-frame tp-chart">
      <div className="tp-metric">
        <span className="tp-pane-label">{config.metric.label}</span>
        <strong>{config.metric.value}</strong>
        {config.metric.delta ? (
          <em className={`tp-delta tp-delta-${config.metric.tone ?? "flat"}`}>{config.metric.delta}</em>
        ) : null}
      </div>
      <div className="tp-plot">
        {config.kind === "bars" ? (
          <div className="tp-bars">
            {config.series.map((value, index) => (
              <span key={index} style={{ height: `${Math.max(8, value)}%` }} />
            ))}
          </div>
        ) : null}
        {config.kind === "line" ? (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false" aria-hidden>
            <polyline points={linePoints(config.series)} fill="none" stroke="var(--tp-accent)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <polyline points={`0,100 ${linePoints(config.series)} 100,100`} fill="var(--tp-accent-wash)" stroke="none" />
          </svg>
        ) : null}
        {config.kind === "donut" ? (
          <div className="tp-donut">
            <svg viewBox="0 0 42 42" focusable="false" aria-hidden>
              {config.series.reduce<{ offset: number; nodes: React.ReactNode[] }>((acc, value, index) => {
                const share = (value / total) * 100;
                acc.nodes.push(
                  <circle
                    key={index}
                    cx="21"
                    cy="21"
                    r="15.9"
                    fill="none"
                    strokeWidth="7"
                    className={`tp-donut-arc tp-donut-arc-${index % 4}`}
                    strokeDasharray={`${share} ${100 - share}`}
                    strokeDashoffset={`${25 - acc.offset}`}
                  />,
                );
                acc.offset += share;
                return acc;
              }, { offset: 0, nodes: [] }).nodes}
            </svg>
          </div>
        ) : null}
      </div>
      {config.legend?.length ? (
        <div className="tp-legend">
          {config.legend.map((item, index) => (
            <span key={item}><i className={`tp-legend-dot-${index % 4}`} />{item}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ColorPreview({ config }: { config: ColorPreviewConfig }) {
  return (
    <div className="tp-frame tp-color">
      {config.gradient ? (
        <div className="tp-gradient" style={{ background: config.gradient }}>
          {(config.stops ?? []).map((stop, index) => (
            <i key={`${stop}-${index}`} style={{ background: stop, left: `${(index / Math.max(1, (config.stops?.length ?? 1) - 1)) * 100}%` }} />
          ))}
        </div>
      ) : null}
      {config.swatches?.length ? (
        <div className="tp-swatches">
          {config.swatches.map((swatch, index) => (
            <span key={`${swatch}-${index}`} style={{ background: swatch }} />
          ))}
        </div>
      ) : null}
      {config.rows?.length ? (
        <div className="tp-rows tp-rows-mono">
          {config.rows.map((row) => (
            <div key={row.label} className="tp-row"><span>{row.label}</span><b>{row.value}</b></div>
          ))}
        </div>
      ) : null}
      {config.verdict ? (
        <div className="tp-verdict">
          {config.verdict.ratio ? <strong>{config.verdict.ratio}</strong> : null}
          <span className={`tp-badge tp-badge-${config.verdict.tone}`}>{config.verdict.text}</span>
        </div>
      ) : null}
    </div>
  );
}

export function ImagePreview({ config }: { config: ImagePreviewConfig }) {
  if (config.mode === "srcset") {
    return (
      <div className="tp-frame tp-image tp-image-srcset">
        <div className="tp-srcset-row">
          {(config.variants ?? []).map((variant) => (
            <div key={variant.label} className="tp-srcset-item" style={{ flexGrow: variant.width }}>
              <div className="tp-photo" />
              <span>{variant.label}</span>
            </div>
          ))}
        </div>
        {config.badge ? <span className="tp-badge tp-badge-ok">{config.badge}</span> : null}
      </div>
    );
  }

  if (config.mode === "device") {
    return (
      <div className="tp-frame tp-image tp-image-device">
        <div className="tp-device">
          <div className="tp-device-bar"><i /><i /><i /><em /></div>
          <div className="tp-device-screen"><span /><span /><span /></div>
        </div>
        <div className="tp-device-phone">
          <div className="tp-device-notch" />
          <div className="tp-device-screen tp-device-screen-sm"><span /><span /></div>
        </div>
        {config.badge ? <span className="tp-badge tp-badge-ok">{config.badge}</span> : null}
      </div>
    );
  }

  if (config.mode === "fullscreen") {
    return (
      <div className="tp-frame tp-image tp-image-fullscreen">
        <div className="tp-fullscreen" style={{ background: config.scene?.tone }}>
          <span className="tp-fullscreen-label">{config.scene?.label}</span>
          <span className="tp-fullscreen-track"><i style={{ width: `${config.scene?.progress ?? 40}%` }} /></span>
        </div>
        <div className="tp-fullscreen-chips">
          {(config.variants ?? []).map((variant) => <span key={variant.label}>{variant.label}</span>)}
        </div>
      </div>
    );
  }

  if (config.mode === "canvas") {
    return (
      <div className="tp-frame tp-image tp-image-canvas">
        <svg viewBox="0 0 160 92" focusable="false" aria-hidden className="tp-canvas-art">
          {(config.strokes ?? []).map((stroke, index) => (
            <path
              key={index}
              d={["M14 70 C40 22 58 84 84 40", "M30 82 C62 60 78 30 132 24", "M18 40 C52 46 74 74 140 62"][index % 3]}
              fill="none"
              stroke={stroke}
              strokeWidth={9 - index * 2}
              strokeLinecap="round"
              opacity={0.9}
            />
          ))}
        </svg>
        <div className="tp-palette">
          {(config.strokes ?? []).map((stroke, index) => <i key={index} style={{ background: stroke }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="tp-frame tp-image tp-image-compare">
      <div className="tp-compare">
        <div className="tp-compare-half" style={{ background: config.before?.tone }}>
          <span>{config.before?.label}</span>
        </div>
        <div className="tp-compare-divider"><i /></div>
        <div className="tp-compare-half" style={{ background: config.after?.tone }}>
          <span>{config.after?.label}</span>
        </div>
      </div>
      {config.badge ? <span className="tp-badge tp-badge-ok tp-badge-float">{config.badge}</span> : null}
    </div>
  );
}

export function GeometryPreview({ config }: { config: GeometryPreviewConfig }) {
  return (
    <div className="tp-frame tp-geometry">
      <svg viewBox="0 0 160 92" focusable="false" aria-hidden>
        {(config.guides ?? []).map((guide, index) => (
          <line key={`g-${index}`} x1={guide[0]} y1={guide[1]} x2={guide[2]} y2={guide[3]} className="tp-geo-guide" />
        ))}
        <path d={config.path} className={config.fill ? "tp-geo-shape" : "tp-geo-path"} />
        {(config.handles ?? []).map((handle, index) => (
          <g key={`h-${index}`}>
            <line x1={handle[0]} y1={handle[1]} x2={handle[2]} y2={handle[3]} className="tp-geo-handle" />
            <circle cx={handle[2]} cy={handle[3]} r="3" className="tp-geo-control" />
          </g>
        ))}
        {(config.anchors ?? []).map((anchor, index) => (
          <rect key={`a-${index}`} x={anchor[0] - 3.4} y={anchor[1] - 3.4} width="6.8" height="6.8" rx="1.4" className="tp-geo-anchor" />
        ))}
      </svg>
      {config.code ? <div className="tp-geo-code">{config.code}</div> : null}
      {config.caption ? <span className="tp-geo-caption">{config.caption}</span> : null}
    </div>
  );
}

export function SecurityPreview({ config }: { config: SecurityPreviewConfig }) {
  return (
    <div className="tp-frame tp-security">
      {config.sample ? (
        <div className="tp-secret">
          {config.sample.split("").map((character, index) => (
            <span key={index} className={/[0-9]/.test(character) ? "tp-secret-num" : /[^a-zA-Z0-9]/.test(character) ? "tp-secret-sym" : ""}>
              {character}
            </span>
          ))}
        </div>
      ) : null}
      {config.strength ? (
        <div className="tp-strength">
          <span className={`tp-strength-bar tp-strength-${config.strength.level}`}>
            <i /><i /><i /><i />
          </span>
          <em>{config.strength.label}</em>
        </div>
      ) : null}
      {config.checks?.length ? (
        <div className="tp-checks">
          {config.checks.map((check) => (
            <span key={check.label} className={`tp-check tp-check-${check.state}`}>
              <i />{check.label}
            </span>
          ))}
        </div>
      ) : null}
      {config.meta?.length ? (
        <div className="tp-rows tp-rows-mono">
          {config.meta.map((row) => (
            <div key={row.label} className="tp-row"><span>{row.label}</span><b>{row.value}</b></div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TimePreview({ config }: { config: TimePreviewConfig }) {
  return (
    <div className={`tp-frame tp-time tp-time-${config.mode}`}>
      <div className="tp-time-pair">
        <div className="tp-time-card">
          <span className="tp-pane-label">{config.from.label}</span>
          <strong>{config.from.value}</strong>
          {config.from.sub ? <small>{config.from.sub}</small> : null}
        </div>
        <div className="tp-time-arrow" aria-hidden>
          {config.mode === "countdown" ? (
            <svg viewBox="0 0 36 36" focusable="false">
              <circle cx="18" cy="18" r="15" className="tp-dial-track" />
              <circle
                cx="18"
                cy="18"
                r="15"
                className="tp-dial-value"
                strokeDasharray={`${(config.dial ?? 0.6) * 94.2} 94.2`}
              />
            </svg>
          ) : (
            <span>→</span>
          )}
        </div>
        <div className="tp-time-card tp-time-card-out">
          <span className="tp-pane-label">{config.to.label}</span>
          <strong>{config.to.value}</strong>
          {config.to.sub ? <small>{config.to.sub}</small> : null}
        </div>
      </div>
      {config.extra?.length ? (
        <div className="tp-time-extra">
          {config.extra.map((item) => (
            <span key={item.label}><em>{item.label}</em>{item.value}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Deterministic matrix so the QR-style block is stable between renders. */
function matrixCells(seed: number, size = 11) {
  const cells: boolean[] = [];
  let state = seed || 7;
  for (let index = 0; index < size * size; index += 1) {
    state = (state * 1103515245 + 12345) % 2147483648;
    cells.push((state >> 16) % 100 > 47);
  }
  return cells;
}

export function MetaPreview({ config }: { config: MetaPreviewConfig }) {
  if (config.mode === "qr") {
    const cells = matrixCells(config.seed ?? 11);
    return (
      <div className="tp-frame tp-meta tp-meta-qr">
        <div className="tp-qr">
          {cells.map((filled, index) => <i key={index} className={filled ? "tp-qr-on" : undefined} />)}
          <span className="tp-qr-eye tp-qr-eye-tl" />
          <span className="tp-qr-eye tp-qr-eye-tr" />
          <span className="tp-qr-eye tp-qr-eye-bl" />
        </div>
        <div className="tp-meta-side">
          {config.url ? <span className="tp-url">{config.url}</span> : null}
          <div className="tp-chips tp-chips-column">
            {(config.chips ?? []).map((chip) => <span key={chip}>{chip}</span>)}
          </div>
        </div>
      </div>
    );
  }

  if (config.mode === "icons") {
    return (
      <div className="tp-frame tp-meta tp-meta-icons">
        <div className="tp-icon-row">
          {(config.icons ?? []).map((size, index) => (
            <div key={size} className="tp-icon" style={{ width: `${2.6 - index * 0.55}em`, height: `${2.6 - index * 0.55}em` }}>
              <i />
            </div>
          ))}
        </div>
        <div className="tp-icon-tab">
          <span className="tp-icon-tab-favicon" />
          <span className="tp-icon-tab-title">{config.title}</span>
        </div>
        <div className="tp-chips">
          {(config.chips ?? []).map((chip) => <span key={chip}>{chip}</span>)}
        </div>
      </div>
    );
  }

  if (config.mode === "lines") {
    return (
      <div className="tp-frame tp-meta tp-meta-lines">
        <div className="tp-window tp-window-flat">
          <div className="tp-window-bar"><i /><i /><i /><span>{config.title}</span></div>
          <div className="tp-code">
            {(config.lines ?? []).map((line, index) => codeTokens(line, index))}
          </div>
        </div>
      </div>
    );
  }

  if (config.mode === "browser") {
    return (
      <div className="tp-frame tp-meta tp-meta-browser">
        <div className="tp-browser">
          <div className="tp-browser-bar"><i /><i /><i /><span>{config.url}</span></div>
          <div className="tp-browser-result">
            <strong>{config.title}</strong>
            <em>{config.url}</em>
            <p>{config.description}</p>
          </div>
        </div>
        <div className="tp-chips">
          {(config.chips ?? []).map((chip) => <span key={chip}>{chip}</span>)}
        </div>
      </div>
    );
  }

  return (
    <div className="tp-frame tp-meta tp-meta-social">
      <div className="tp-social-card">
        <div className="tp-social-art"><i /><span /></div>
        <div className="tp-social-copy">
          <strong>{config.title}</strong>
          <p>{config.description}</p>
          <em>{config.url}</em>
        </div>
      </div>
      <div className="tp-chips tp-chips-column">
        {(config.chips ?? []).map((chip) => <span key={chip}>{chip}</span>)}
      </div>
    </div>
  );
}

export function LayoutPreview({ config }: { config: LayoutPreviewConfig }) {
  if (config.mode === "breakpoints") {
    return (
      <div className="tp-frame tp-layout tp-layout-breakpoints">
        <div className="tp-bp-row">
          {(config.breakpoints ?? []).map((breakpoint) => (
            <div key={breakpoint.label} className="tp-bp" style={{ flexGrow: breakpoint.width }}>
              <div className="tp-bp-frame"><i /><i /></div>
              <span>{breakpoint.label}</span>
            </div>
          ))}
        </div>
        {config.code ? <div className="tp-geo-code">{config.code}</div> : null}
      </div>
    );
  }

  if (config.mode === "shadow" || config.mode === "surface") {
    return (
      <div className={`tp-frame tp-layout tp-layout-${config.mode}`}>
        <div className="tp-surface-stage">
          <div className="tp-surface-card" style={{ boxShadow: config.surface, background: config.mode === "surface" ? config.surface : undefined }}>
            <i /><i />
          </div>
        </div>
        {config.code ? <div className="tp-geo-code">{config.code}</div> : null}
      </div>
    );
  }

  if (config.mode === "box") {
    return (
      <div className="tp-frame tp-layout tp-layout-box">
        <div className="tp-box-margin">
          <span>margin</span>
          <div className="tp-box-border">
            <span>border</span>
            <div className="tp-box-padding">
              <div className="tp-box-content" />
            </div>
          </div>
        </div>
        {config.code ? <div className="tp-geo-code">{config.code}</div> : null}
      </div>
    );
  }

  const cells = config.cells ?? [1, 1, 1, 2, 1, 1];
  return (
    <div className={`tp-frame tp-layout tp-layout-${config.mode}`}>
      <div
        className="tp-grid-stage"
        style={config.mode === "grid" ? { gridTemplateColumns: `repeat(${config.cols ?? 4}, 1fr)` } : undefined}
      >
        {cells.map((span, index) => (
          <div key={index} className="tp-grid-cell" style={config.mode === "grid" ? { gridColumn: `span ${span}` } : { flexGrow: span }} />
        ))}
      </div>
      {config.code ? <div className="tp-geo-code">{config.code}</div> : null}
    </div>
  );
}
