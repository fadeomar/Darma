import type { ReactNode } from "react";

/**
 * Shared building blocks for game thumbnails.
 *
 * Every scene is drawn in the same 320 x 180 viewBox so the pieces line up
 * across games: 2px strokes, 3px corner radii on small cells, and one score
 * panel shape. Games keep their own palette and composition on top of that, so
 * the set reads as one universe without every card looking the same.
 *
 * In-scene text follows the readable floor the Phase 2 sweep established. SVG
 * text scales with the viewBox, so a user-unit size only lands at a fixed pixel
 * size for a fixed tile width. Values are 17 units or more, which clears 12px
 * down to a 226px tile — narrower than any surface renders. Captions are 12
 * units, which needs a 320px tile, so they carry `gscene-cap` and the
 * stylesheet drops them below that rather than shrinking them into noise.
 */

export const SCENE_WIDTH = 320;
export const SCENE_HEIGHT = 180;

export type ScenePalette = {
  /** Two-stop background gradient for the stage. */
  bg: [string, string];
  /** Faint rule colour for grids and guides. */
  rule: string;
  /** Primary play colour. */
  ink: string;
  /** Accent used for the one thing the eye should land on. */
  accent: string;
  /** Text colour used on the stage. */
  text: string;
};

export function SceneStage({
  palette,
  id,
  children,
  texture = "grid",
}: {
  palette: ScenePalette;
  id: string;
  children: ReactNode;
  texture?: "grid" | "scan" | "dots" | "none";
}) {
  return (
    <svg
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      className="gscene-svg"
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={palette.bg[0]} />
          <stop offset="1" stopColor={palette.bg[1]} />
        </linearGradient>
        {texture === "grid" ? (
          <pattern id={`${id}-tex`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0 H0 V20" fill="none" stroke={palette.rule} strokeWidth="1" />
          </pattern>
        ) : null}
        {texture === "scan" ? (
          <pattern id={`${id}-tex`} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="3" fill={palette.rule} />
          </pattern>
        ) : null}
        {texture === "dots" ? (
          <pattern id={`${id}-tex`} width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.6" fill={palette.rule} />
          </pattern>
        ) : null}
      </defs>
      <rect width={SCENE_WIDTH} height={SCENE_HEIGHT} fill={`url(#${id}-bg)`} />
      {texture !== "none" ? (
        <rect width={SCENE_WIDTH} height={SCENE_HEIGHT} fill={`url(#${id}-tex)`} opacity="0.5" />
      ) : null}
      {children}
    </svg>
  );
}

/** A play area: the panel most board games sit on. */
export function Board({
  x,
  y,
  width,
  height,
  fill,
  stroke,
  radius = 8,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  radius?: number;
}) {
  return <rect x={x} y={y} width={width} height={height} rx={radius} fill={fill} stroke={stroke} strokeWidth={stroke ? 2 : undefined} />;
}

/** Evenly spaced rules across a board. */
export function GridLines({
  x,
  y,
  width,
  height,
  cols,
  rows,
  stroke,
  strokeWidth = 1.5,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  cols: number;
  rows: number;
  stroke: string;
  strokeWidth?: number;
}) {
  const vertical = Array.from({ length: cols - 1 }, (_, index) => x + ((index + 1) * width) / cols);
  const horizontal = Array.from({ length: rows - 1 }, (_, index) => y + ((index + 1) * height) / rows);
  return (
    <g stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
      {vertical.map((position) => <line key={`v${position}`} x1={position} y1={y} x2={position} y2={y + height} />)}
      {horizontal.map((position) => <line key={`h${position}`} x1={x} y1={position} x2={x + width} y2={position} />)}
    </g>
  );
}

/** A board cell that can carry a short label. */
export function Cell({
  x,
  y,
  size,
  height,
  fill,
  stroke,
  label,
  labelFill,
  labelSize = 15,
  radius = 4,
  opacity,
}: {
  x: number;
  y: number;
  size: number;
  height?: number;
  fill: string;
  stroke?: string;
  label?: string;
  labelFill?: string;
  labelSize?: number;
  radius?: number;
  opacity?: number;
}) {
  const cellHeight = height ?? size;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={size} height={cellHeight} rx={radius} fill={fill} stroke={stroke} strokeWidth={stroke ? 1.5 : undefined} />
      {label ? (
        <text
          x={x + size / 2}
          y={y + cellHeight / 2 + labelSize * 0.35}
          textAnchor="middle"
          fill={labelFill}
          fontSize={labelSize}
          fontWeight="900"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

/** The score / lives / timer readout every arcade scene carries. */
export function ScorePanel({
  x,
  y,
  label,
  value,
  palette,
  width = 92,
  align = "left",
}: {
  x: number;
  y: number;
  label: string;
  value: string;
  palette: ScenePalette;
  width?: number;
  align?: "left" | "right";
}) {
  const anchor = align === "right" ? "end" : "start";
  const textX = align === "right" ? x + width - 10 : x + 10;
  return (
    <g>
      <rect x={x} y={y} width={width} height={34} rx={10} fill={palette.bg[0]} fillOpacity="0.82" stroke={palette.rule} strokeWidth="1.5" />
      <text x={textX} y={y + 13} textAnchor={anchor} className="gscene-cap" fill={palette.text} fillOpacity="0.72" fontSize="12" fontWeight="900" letterSpacing="0.8">
        {label}
      </text>
      <text x={textX} y={y + 29} textAnchor={anchor} fill={palette.accent} fontSize="17" fontWeight="900">
        {value}
      </text>
    </g>
  );
}

/** The controllable object: a rounded body with a highlight. */
export function Player({
  x,
  y,
  size = 20,
  fill,
  glow,
}: {
  x: number;
  y: number;
  size?: number;
  fill: string;
  glow?: string;
}) {
  return (
    <g>
      {glow ? <circle cx={x} cy={y} r={size * 1.5} fill={glow} opacity="0.28" /> : null}
      <circle cx={x} cy={y} r={size / 2} fill={fill} />
      <circle cx={x - size * 0.14} cy={y - size * 0.16} r={size * 0.14} fill="#ffffff" opacity="0.75" />
    </g>
  );
}

/** A hostile object: an angular body so it never reads as the player. */
export function Enemy({ x, y, size = 16, fill }: { x: number; y: number; size?: number; fill: string }) {
  const half = size / 2;
  return (
    <g>
      <path
        d={`M${x} ${y - half} L${x + half} ${y} L${x} ${y + half} L${x - half} ${y} Z`}
        fill={fill}
      />
      <circle cx={x} cy={y} r={size * 0.16} fill="#0b0f19" opacity="0.55" />
    </g>
  );
}

export function Projectile({ x, y, angle = 0, fill }: { x: number; y: number; angle?: number; fill: string }) {
  return (
    <g transform={`rotate(${angle} ${x} ${y})`}>
      <rect x={x - 8} y={y - 2} width={16} height={4} rx={2} fill={fill} />
      <circle cx={x + 8} cy={y} r="3" fill={fill} />
    </g>
  );
}

/** Motion trail behind a moving object. */
export function Trail({
  x,
  y,
  count = 3,
  spacing = 12,
  fill,
  direction = -1,
}: {
  x: number;
  y: number;
  count?: number;
  spacing?: number;
  fill: string;
  direction?: 1 | -1;
}) {
  return (
    <g>
      {Array.from({ length: count }, (_, index) => (
        <rect
          key={index}
          x={x + direction * spacing * (index + 1)}
          y={y - 1.5}
          width={spacing * 0.6}
          height={3}
          rx={1.5}
          fill={fill}
          opacity={0.5 - index * 0.13}
        />
      ))}
    </g>
  );
}

/** A ring gauge: health, timer, or accuracy. */
export function Gauge({
  x,
  y,
  radius,
  progress,
  track,
  fill,
  width = 6,
  label,
  labelFill,
  labelSize = 18,
}: {
  x: number;
  y: number;
  radius: number;
  progress: number;
  track: string;
  fill: string;
  width?: number;
  label?: string;
  labelFill?: string;
  labelSize?: number;
}) {
  const circumference = 2 * Math.PI * radius;
  return (
    <g>
      <circle cx={x} cy={y} r={radius} fill="none" stroke={track} strokeWidth={width} />
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill="none"
        stroke={fill}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={`${circumference * progress} ${circumference}`}
        transform={`rotate(-90 ${x} ${y})`}
      />
      {label ? (
        <text x={x} y={y + labelSize * 0.35} textAnchor="middle" fill={labelFill} fontSize={labelSize} fontWeight="900">
          {label}
        </text>
      ) : null}
    </g>
  );
}

/** A pill used for choices, tags, and state chips. */
export function Chip({
  x,
  y,
  width,
  label,
  fill,
  textFill,
  stroke,
  height = 24,
  fontSize = 14,
}: {
  x: number;
  y: number;
  width: number;
  label: string;
  fill: string;
  textFill: string;
  stroke?: string;
  height?: number;
  fontSize?: number;
}) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={height / 2} fill={fill} stroke={stroke} strokeWidth={stroke ? 1.5 : undefined} />
      <text x={x + width / 2} y={y + height / 2 + fontSize * 0.35} textAnchor="middle" fill={textFill} fontSize={fontSize} fontWeight="900">
        {label}
      </text>
    </g>
  );
}

/** A face-down or face-up card. */
export function PlayCard({
  x,
  y,
  width = 40,
  height = 54,
  face,
  back,
  symbol,
  symbolFill,
  stroke,
  matched,
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
  face: string;
  back?: string;
  symbol?: string;
  symbolFill?: string;
  stroke?: string;
  matched?: boolean;
}) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} fill={back ?? face} stroke={matched ? symbolFill : stroke} strokeWidth={matched ? 2.5 : 1.5} />
      {back ? (
        <path
          d={`M${x + 8} ${y + 8} L${x + width - 8} ${y + height - 8} M${x + width - 8} ${y + 8} L${x + 8} ${y + height - 8}`}
          stroke={symbolFill}
          strokeWidth="2"
          opacity="0.35"
        />
      ) : (
        <text x={x + width / 2} y={y + height / 2 + 8} textAnchor="middle" fill={symbolFill} fontSize="22" fontWeight="900">
          {symbol}
        </text>
      )}
    </g>
  );
}

/** Ground plane plus a single obstacle, for the side-scrolling scenes. */
export function Ground({
  y,
  fill,
  detail,
}: {
  y: number;
  fill: string;
  detail?: string;
}) {
  return (
    <g>
      <rect x="0" y={y} width={SCENE_WIDTH} height={SCENE_HEIGHT - y} fill={fill} />
      {detail ? (
        <g stroke={detail} strokeWidth="2" strokeLinecap="round" opacity="0.5">
          {[18, 78, 138, 198, 258].map((position) => (
            <line key={position} x1={position} y1={y + 10} x2={position + 22} y2={y + 10} />
          ))}
        </g>
      ) : null}
    </g>
  );
}
