import { useId } from "react";
import type { DiagramSample, Extreme } from "../lib/beamTypes";
import { formatNumber, formatSigned } from "../lib/beamFormatting";

type DiagramProps = {
  title: string;
  description: string;
  samples: DiagramSample[];
  metric: "shear" | "moment";
  length: number;
  lengthUnit: string;
  valueUnit: string;
  extreme: Extreme;
  secondaryExtreme?: Extreme; // e.g. max negative moment
};

const W = 720;
const H = 220;
const PAD_LEFT = 52;
const PAD_RIGHT = 24;
const PAD_TOP = 26;
const PAD_BOTTOM = 34;

export function BeamDiagram({
  title,
  description,
  samples,
  metric,
  length,
  lengthUnit,
  valueUnit,
  extreme,
  secondaryExtreme,
}: DiagramProps) {
  const titleId = useId();
  const descId = useId();

  const values = samples.map((s) => s[metric]);
  const maxVal = Math.max(0, ...values);
  const minVal = Math.min(0, ...values);
  const range = Math.max(Math.abs(maxVal), Math.abs(minVal), 1e-9);

  const plotW = W - PAD_LEFT - PAD_RIGHT;
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const safeLength = length > 0 ? length : 1;

  const toX = (x: number) => PAD_LEFT + (x / safeLength) * plotW;
  // Positive plotted up (smaller y). Map data range [minVal, maxVal] to [bottom, top].
  const span = maxVal - minVal || 1;
  const mapY = (v: number) => PAD_TOP + ((maxVal - v) / span) * plotH;
  const baseY = mapY(0);

  const linePath = samples
    .map((s, i) => `${i === 0 ? "M" : "L"} ${toX(s.x).toFixed(2)} ${mapY(s[metric]).toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L ${toX(samples[samples.length - 1]?.x ?? safeLength).toFixed(2)} ${baseY.toFixed(2)} L ${toX(samples[0]?.x ?? 0).toFixed(2)} ${baseY.toFixed(2)} Z`;

  const isFlat = range <= 1e-9 || values.every((v) => Math.abs(v) < 1e-9);

  const extremePoints = [extreme, secondaryExtreme].filter(
    (p): p is Extreme => Boolean(p) && Math.abs(p!.value) > 1e-9,
  );

  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold text-[var(--color-text-primary)]">{title}</span>
        <span className="font-mono text-[11px] font-bold text-[var(--color-text-tertiary)]">
          max {formatNumber(Math.abs(extreme.value))} {valueUnit}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]"
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <title id={titleId}>{title}</title>
        <desc id={descId}>{description}</desc>

        {/* axis frame */}
        <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={H - PAD_BOTTOM} stroke="var(--color-border-default)" strokeWidth="1" />
        {/* zero baseline */}
        <line
          x1={PAD_LEFT}
          y1={baseY}
          x2={W - PAD_RIGHT}
          y2={baseY}
          stroke="var(--color-text-tertiary)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <text x={PAD_LEFT - 6} y={baseY + 3} textAnchor="end" className="fill-[var(--color-text-tertiary)]" fontSize="10">
          0
        </text>

        {/* x ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const xv = t * safeLength;
          return (
            <g key={t}>
              <line x1={toX(xv)} y1={H - PAD_BOTTOM} x2={toX(xv)} y2={H - PAD_BOTTOM + 4} stroke="var(--color-border-default)" />
              <text x={toX(xv)} y={H - PAD_BOTTOM + 16} textAnchor="middle" className="fill-[var(--color-text-tertiary)]" fontSize="10">
                {formatNumber(xv)}
              </text>
            </g>
          );
        })}
        <text x={W - PAD_RIGHT} y={H - 4} textAnchor="end" className="fill-[var(--color-text-tertiary)]" fontSize="10">
          x ({lengthUnit})
        </text>

        {!isFlat ? (
          <>
            <path d={areaPath} fill="var(--color-primary)" opacity="0.12" />
            <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {extremePoints.map((p, i) => {
              const px = toX(p.x);
              const py = mapY(p.value);
              const above = p.value >= 0;
              return (
                <g key={i}>
                  <circle cx={px} cy={py} r="3.5" fill="var(--color-primary)" stroke="var(--color-surface-base)" strokeWidth="1.5" />
                  <text
                    x={px}
                    y={above ? py - 7 : py + 14}
                    textAnchor="middle"
                    className="fill-[var(--color-text-primary)]"
                    fontSize="10"
                    fontWeight="700"
                  >
                    {formatSigned(p.value)}
                  </text>
                </g>
              );
            })}
          </>
        ) : (
          <text x={(PAD_LEFT + W - PAD_RIGHT) / 2} y={baseY - 8} textAnchor="middle" className="fill-[var(--color-text-tertiary)]" fontSize="11">
            All values zero
          </text>
        )}
      </svg>
    </figure>
  );
}
