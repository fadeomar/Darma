"use client";

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import type { BeamLoad, BeamModel, BeamResult, SelectedItem, UnitLabels } from "../lib/beamTypes";
import { isSameSelection } from "../lib/beamTypes";
import { formatNumber, formatSigned, clamp, roundTo } from "../lib/beamFormatting";
import { CANVAS, beamXToSvgX, clampBeamX, clientXToBeamX, snapBeamX, type SnapResult } from "../lib/beamCoords";

const { W, H, MARGIN, BEAM_Y } = CANVAS;
const X0 = MARGIN;
const X1 = W - MARGIN;
const MIN_UDL_GAP = 0.1;

type BeamCanvasProps = {
  model: BeamModel;
  result: BeamResult | null;
  units: UnitLabels;
  selected: SelectedItem | null;
  onSelect: (item: SelectedItem | null) => void;
  onSupportPosition: (id: string, x: number) => void;
  onLoadPosition: (id: string, patch: Partial<BeamLoad>) => void;
  supportsDraggable: boolean;
};

// The active gesture is tracked in a ref so pointermove/up never read a stale
// closure, and the pointer is captured on the handle element itself so the
// browser always delivers pointerup/lostpointercapture back to that handle.
type DragState = { item: SelectedItem; pointerId: number; offset: number; target: Element };

// Interaction props applied to a draggable SVG handle. Typed explicitly (rather
// than SVGProps<SVGElement>) so it spreads cleanly onto circle/rect without the
// incompatible `ref` type that SVGProps carries.
type HandleProps = {
  onPointerDown: (event: PointerEvent<SVGElement>) => void;
  onPointerMove: (event: PointerEvent<SVGElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onLostPointerCapture: () => void;
  onKeyDown: (event: KeyboardEvent<SVGElement>) => void;
  role: "slider";
  tabIndex: number;
  "aria-label": string;
  "aria-valuemin": number;
  "aria-valuemax": number;
  "aria-valuenow": number;
  style: CSSProperties;
};

export function BeamCanvas({
  model,
  result,
  units,
  selected,
  onSelect,
  onSupportPosition,
  onLoadPosition,
  supportsDraggable,
}: BeamCanvasProps) {
  const titleId = useId();
  const descId = useId();
  const arrowId = useId();
  const reactionArrowId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [dragItem, setDragItem] = useState<SelectedItem | null>(null);
  const [snap, setSnap] = useState<SnapResult | null>(null);

  const length = model.length > 0 ? model.length : 1;
  const toX = (x: number) => beamXToSvgX(x, length);
  const stepSmall = Math.max(0.05, roundTo(length / 100, 2));
  const stepLarge = Math.max(0.5, roundTo(length / 10, 2));

  const loadById = (id: string) => model.loads.find((l) => l.id === id);

  function beamXFromClient(clientX: number): number {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return clientXToBeamX(clientX, rect, length);
  }

  // Snap targets are the canonical positions plus the other items' positions.
  function snapTargets(item: SelectedItem): number[] {
    const targets: number[] = [];
    for (const s of model.supports) if (item.kind !== "support" || s.id !== item.id) targets.push(s.x);
    for (const l of model.loads) {
      if (l.id === item.id) continue;
      if (l.kind === "udl") targets.push(l.start, l.end);
      else targets.push(l.x);
    }
    return targets;
  }

  // Single move path used by both pointer drag (useSnap) and keyboard (no snap).
  function moveItemTo(item: SelectedItem, rawX: number, useSnap: boolean, offset = 0) {
    const resolve = (value: number): SnapResult => (useSnap ? snapBeamX(clampBeamX(value, length), length, snapTargets(item)) : { x: clampBeamX(value, length) });

    if (item.kind === "support") {
      const r = resolve(rawX);
      onSupportPosition(item.id, roundTo(r.x, 2));
      setSnap(useSnap ? r : null);
      return;
    }

    const load = loadById(item.id);
    if (!load) return;

    if (item.kind === "point" || item.kind === "moment") {
      const r = resolve(rawX);
      onLoadPosition(item.id, { x: roundTo(r.x, 2) });
      setSnap(useSnap ? r : null);
      return;
    }

    if (load.kind !== "udl") return;

    if (item.kind === "udl-start") {
      const r = resolve(rawX);
      const x = clampBeamX(Math.min(r.x, load.end - MIN_UDL_GAP), length);
      onLoadPosition(item.id, { start: roundTo(x, 2) });
      setSnap(useSnap ? { ...r, x } : null);
      return;
    }
    if (item.kind === "udl-end") {
      const r = resolve(rawX);
      const x = clampBeamX(Math.max(r.x, load.start + MIN_UDL_GAP), length);
      onLoadPosition(item.id, { end: roundTo(x, 2) });
      setSnap(useSnap ? { ...r, x } : null);
      return;
    }
    if (item.kind === "udl-body") {
      const width = load.end - load.start;
      const r = resolve(rawX - offset);
      let start = clampBeamX(r.x, length);
      start = Math.min(start, length - width);
      start = Math.max(0, start);
      onLoadPosition(item.id, { start: roundTo(start, 2), end: roundTo(start + width, 2) });
      setSnap(useSnap ? { ...r, x: start } : null);
    }
  }

  function endDrag() {
    const active = dragRef.current;
    if (active) {
      try {
        if (active.target.hasPointerCapture?.(active.pointerId)) active.target.releasePointerCapture(active.pointerId);
      } catch {
        // capture may already be released
      }
    }
    dragRef.current = null;
    setDragItem(null);
    setSnap(null);
  }

  function handleKeyDown(event: KeyboardEvent, item: SelectedItem, current: number) {
    let next: number | null = null;
    if (event.key === "ArrowRight") next = current + (event.shiftKey ? stepLarge : stepSmall);
    else if (event.key === "ArrowLeft") next = current - (event.shiftKey ? stepLarge : stepSmall);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = length;
    if (next === null) return;
    event.preventDefault();
    onSelect(item);
    moveItemTo(item, next, false);
  }

  // Returns the full set of interaction props for a draggable handle. Pointer
  // capture + move/up live on the handle itself, which is what makes release
  // reliable (the previous svg-level capture left drags "stuck").
  function dragHandle(item: SelectedItem, ariaLabel: string, current: number, anchor?: number): HandleProps {
    return {
      onPointerDown: (event: PointerEvent<SVGElement>) => {
        event.preventDefault();
        event.stopPropagation();
        onSelect(item);
        // For UDL-body drags, record the grab offset relative to the range start.
        const offset = anchor !== undefined ? beamXFromClient(event.clientX) - anchor : 0;
        const target = event.currentTarget;
        try {
          target.setPointerCapture(event.pointerId);
        } catch {
          // capture unavailable for some pointer types; move events still work
        }
        dragRef.current = { item, pointerId: event.pointerId, offset, target };
        setDragItem(item);
      },
      onPointerMove: (event: PointerEvent<SVGElement>) => {
        const active = dragRef.current;
        if (!active || active.pointerId !== event.pointerId) return;
        moveItemTo(active.item, beamXFromClient(event.clientX), true, active.offset);
      },
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onLostPointerCapture: endDrag,
      onKeyDown: (event: KeyboardEvent<SVGElement>) => handleKeyDown(event, item, current),
      role: "slider",
      tabIndex: 0,
      "aria-label": ariaLabel,
      "aria-valuemin": 0,
      "aria-valuemax": roundTo(length, 2),
      "aria-valuenow": roundTo(current, 2),
      style: { cursor: "grab", touchAction: "none" },
    };
  }

  function backgroundClick(event: PointerEvent<SVGRectElement>) {
    // Click-to-place: move the selected item to where the user clicked.
    if (!selected || dragRef.current) return;
    moveItemTo(selected, beamXFromClient(event.clientX), true);
    window.setTimeout(() => setSnap(null), 250);
  }

  // ---- label collision: stagger labels that sit close together ----
  function assignRows(svgXs: number[], minGap: number): number[] {
    const lastXByRow: number[] = [];
    const assignment = new Array(svgXs.length).fill(0);
    const order = svgXs.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x);
    for (const { x, i } of order) {
      let row = 0;
      while (row < lastXByRow.length && x - lastXByRow[row] < minGap) row += 1;
      lastXByRow[row] = x;
      assignment[i] = row;
    }
    return assignment;
  }

  const points = model.loads.filter((l): l is Extract<BeamLoad, { kind: "point" }> => l.kind === "point");
  const moments = model.loads.filter((l): l is Extract<BeamLoad, { kind: "moment" }> => l.kind === "moment");
  const udls = model.loads.filter((l): l is Extract<BeamLoad, { kind: "udl" }> => l.kind === "udl");

  const aboveItems = [...points.map((p) => ({ id: p.id, x: p.x })), ...moments.map((m) => ({ id: m.id, x: m.x }))];
  const aboveRows = assignRows(aboveItems.map((i) => toX(i.x)), 56);
  const aboveRowById = new Map(aboveItems.map((item, i) => [item.id, aboveRows[i]]));

  const supportRows = assignRows(model.supports.map((s) => toX(clampBeamX(s.x, length))), 64);
  const supportRowById = new Map(model.supports.map((s, i) => [s.id, supportRows[i]]));

  const isSelected = (item: SelectedItem) => isSameSelection(selected, item);
  const isDragging = dragItem !== null;
  const handleFill = (active: boolean) => (active ? "var(--color-primary-hover)" : "var(--color-primary)");
  const handleRadius = (active: boolean) => (active ? 8 : 6);

  function dragTooltip() {
    if (!dragItem || !snap) return null;
    let x = snap.x;
    let label = dragItem.kind === "support" ? `Support ${dragItem.id}` : dragItem.kind === "udl-start" ? "UDL start" : dragItem.kind === "udl-end" ? "UDL end" : dragItem.id;
    if (dragItem.kind === "udl-body") {
      const load = loadById(dragItem.id);
      label = `UDL ${dragItem.id}`;
      x = load && load.kind === "udl" ? load.start : x;
    }
    const px = clamp(toX(x), X0, X1);
    const pct = Math.round((clampBeamX(x, length) / length) * 100);
    const text = `${label} · x = ${formatNumber(x)} ${units.length} · ${pct}%`;
    return (
      <g pointerEvents="none">
        <line x1={px} y1={BEAM_Y - 70} x2={px} y2={BEAM_Y + 60} stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
        <g transform={`translate(${clamp(px, X0 + 60, X1 - 60)}, ${BEAM_Y - 84})`}>
          <rect x={-78} y={-13} width={156} height={20} rx={6} fill="var(--color-text-primary)" />
          <text x={0} y={1} textAnchor="middle" dominantBaseline="middle" fontSize="10.5" fontWeight="700" fill="var(--color-surface-base)">
            {text}
          </text>
        </g>
        {snap.label ? (
          <g transform={`translate(${px}, ${BEAM_Y + 74})`}>
            <rect x={-22} y={-9} width={44} height={16} rx={5} fill="var(--color-info-text)" />
            <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="800" fill="var(--color-surface-base)">
              {snap.label}
            </text>
          </g>
        ) : null}
      </g>
    );
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full select-none rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]"
      style={{ cursor: isDragging ? "grabbing" : "default", touchAction: "none" }}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <title id={titleId}>Beam diagram</title>
      <desc id={descId}>
        Beam of length {formatNumber(model.length)} {units.length} with {model.supports.length} support(s) and {model.loads.length} load(s). Drag the orange handles to reposition loads and supports.
      </desc>

      <defs>
        <marker id={arrowId} markerWidth="8" markerHeight="8" refX="4" refY="7" orient="auto">
          <path d="M0,0 L4,7 L8,0 Z" fill="var(--color-danger)" />
        </marker>
        <marker id={reactionArrowId} markerWidth="8" markerHeight="8" refX="4" refY="1" orient="auto">
          <path d="M0,8 L4,1 L8,8 Z" fill="var(--color-primary)" />
        </marker>
      </defs>

      {/* background click-to-place target */}
      <rect x={0} y={0} width={W} height={H} fill="transparent" onPointerDown={backgroundClick} />

      {/* dimension line */}
      <g pointerEvents="none">
        <line x1={X0} y1={H - 26} x2={X1} y2={H - 26} stroke="var(--color-text-tertiary)" strokeWidth="1" />
        <line x1={X0} y1={H - 31} x2={X0} y2={H - 21} stroke="var(--color-text-tertiary)" />
        <line x1={X1} y1={H - 31} x2={X1} y2={H - 21} stroke="var(--color-text-tertiary)" />
        <text x={(X0 + X1) / 2} y={H - 12} textAnchor="middle" fontSize="11" fontWeight="700" className="fill-[var(--color-text-secondary)]">
          L = {formatNumber(model.length)} {units.length}
        </text>
      </g>

      {/* beam */}
      <line x1={X0} y1={BEAM_Y} x2={X1} y2={BEAM_Y} stroke="var(--color-text-primary)" strokeWidth="6" strokeLinecap="round" pointerEvents="none" />

      {/* UDLs */}
      {udls.map((l) => {
        const inRange = l.start >= -1e-6 && l.end <= length + 1e-6 && l.start < l.end;
        const ax = clamp(toX(Math.min(l.start, l.end)), X0, X1);
        const bx = clamp(toX(Math.max(l.start, l.end)), X0, X1);
        const up = l.direction === "up";
        const top = up ? BEAM_Y + 6 : BEAM_Y - 42;
        const arrowCount = Math.max(2, Math.round((bx - ax) / 26));
        const startSel = isSelected({ kind: "udl-start", id: l.id });
        const endSel = isSelected({ kind: "udl-end", id: l.id });
        const bodySel = isSelected({ kind: "udl-body", id: l.id });
        const labelY = up ? BEAM_Y + 58 : BEAM_Y - 48;
        return (
          <g key={l.id} opacity={inRange ? 1 : 0.4}>
            {/* body (drag whole range) */}
            <rect
              x={ax}
              y={top}
              width={Math.max(2, bx - ax)}
              height="36"
              fill="var(--color-danger)"
              opacity={bodySel ? 0.18 : 0.08}
              {...dragHandle({ kind: "udl-body", id: l.id }, `Drag UDL ${l.id} along beam`, l.start, l.start)}
            />
            <line x1={ax} y1={up ? BEAM_Y + 42 : BEAM_Y - 42} x2={bx} y2={up ? BEAM_Y + 42 : BEAM_Y - 42} stroke="var(--color-danger)" strokeWidth="1.5" pointerEvents="none" />
            {Array.from({ length: arrowCount + 1 }).map((_, i) => {
              const px = ax + (i * (bx - ax)) / arrowCount;
              return <line key={i} x1={px} y1={up ? BEAM_Y + 42 : BEAM_Y - 42} x2={px} y2={BEAM_Y - 2} stroke="var(--color-danger)" strokeWidth="1.5" markerEnd={`url(#${arrowId})`} pointerEvents="none" />;
            })}
            <text x={(ax + bx) / 2} y={labelY} textAnchor="middle" fontSize="10.5" fontWeight="700" className="fill-[var(--color-danger)]" pointerEvents="none">
              {l.id}: {formatNumber(l.magnitude)} {units.distributed}
            </text>
            {/* start/end handles */}
            <circle cx={ax} cy={up ? BEAM_Y + 42 : BEAM_Y - 42} r={handleRadius(startSel)} fill={handleFill(startSel)} stroke="var(--color-surface-base)" strokeWidth="2" {...dragHandle({ kind: "udl-start", id: l.id }, `Drag UDL ${l.id} start position`, l.start)} style={{ cursor: "ew-resize", touchAction: "none" }} />
            <circle cx={bx} cy={up ? BEAM_Y + 42 : BEAM_Y - 42} r={handleRadius(endSel)} fill={handleFill(endSel)} stroke="var(--color-surface-base)" strokeWidth="2" {...dragHandle({ kind: "udl-end", id: l.id }, `Drag UDL ${l.id} end position`, l.end)} style={{ cursor: "ew-resize", touchAction: "none" }} />
          </g>
        );
      })}

      {/* point loads */}
      {points.map((l) => {
        const inRange = l.x >= -1e-6 && l.x <= length + 1e-6;
        const px = clamp(toX(l.x), X0, X1);
        const up = l.direction === "up";
        const tail = up ? BEAM_Y + 48 : BEAM_Y - 48;
        const sel = isSelected({ kind: "point", id: l.id });
        const row = aboveRowById.get(l.id) ?? 0;
        return (
          <g key={l.id} opacity={inRange ? 1 : 0.4}>
            <line x1={px} y1={tail} x2={px} y2={BEAM_Y - 2} stroke="var(--color-danger)" strokeWidth={sel ? 3.5 : 2.5} markerEnd={`url(#${arrowId})`} pointerEvents="none" />
            <text x={px} y={(up ? BEAM_Y + 62 : BEAM_Y - 54) - (up ? 0 : row * 13)} textAnchor="middle" fontSize="10.5" fontWeight="700" className="fill-[var(--color-danger)]" pointerEvents="none">
              {l.id}: {formatNumber(l.magnitude)} {units.force}
            </text>
            <circle cx={px} cy={tail} r={handleRadius(sel)} fill={handleFill(sel)} stroke="var(--color-surface-base)" strokeWidth="2" {...dragHandle({ kind: "point", id: l.id }, `Drag point load ${l.id} along beam`, l.x)} />
          </g>
        );
      })}

      {/* applied moments */}
      {moments.map((l) => {
        const inRange = l.x >= -1e-6 && l.x <= length + 1e-6;
        const px = clamp(toX(l.x), X0, X1);
        const r = 16;
        const ccw = l.rotation === "ccw";
        const sweep = ccw ? 1 : 0;
        const path = `M ${px} ${BEAM_Y - r} A ${r} ${r} 0 1 ${sweep} ${px - 0.01} ${BEAM_Y - r}`;
        const sel = isSelected({ kind: "moment", id: l.id });
        const row = aboveRowById.get(l.id) ?? 0;
        return (
          <g key={l.id} opacity={inRange ? 1 : 0.4}>
            <path d={path} fill="none" stroke="var(--color-info-text)" strokeWidth="2" markerEnd={`url(#${arrowId})`} pointerEvents="none" />
            <text x={px} y={BEAM_Y - r - 8 - row * 13} textAnchor="middle" fontSize="10.5" fontWeight="700" className="fill-[var(--color-info-text)]" pointerEvents="none">
              {l.id}: {formatNumber(l.magnitude)} {units.moment}
            </text>
            <circle cx={px} cy={BEAM_Y - r - 1} r={handleRadius(sel)} fill={handleFill(sel)} stroke="var(--color-surface-base)" strokeWidth="2" {...dragHandle({ kind: "moment", id: l.id }, `Drag applied moment ${l.id} along beam`, l.x)} />
          </g>
        );
      })}

      {/* supports */}
      {model.supports.map((s) => {
        const inRange = s.x >= -1e-6 && s.x <= length + 1e-6;
        const px = clamp(toX(s.x), X0, X1);
        const sel = isSelected({ kind: "support", id: s.id });
        const row = supportRowById.get(s.id) ?? 0;
        const labelY = BEAM_Y + 50 + row * 13;
        const color = supportsDraggable ? "var(--color-text-secondary)" : "var(--color-text-tertiary)";

        return (
          <g key={s.id} opacity={inRange ? 1 : 0.4}>
            {s.type === "fixed" ? (
              (() => {
                const onLeft = s.x <= length / 2;
                const wallX = onLeft ? px - 6 : px + 6;
                return (
                  <>
                    <rect x={Math.min(px, wallX)} y={BEAM_Y - 34} width="6" height="68" fill={color} />
                    {Array.from({ length: 7 }).map((_, i) => {
                      const hy = BEAM_Y - 30 + i * 10;
                      return <line key={i} x1={wallX} y1={hy} x2={wallX + (onLeft ? -8 : 8)} y2={hy + 8} stroke="var(--color-text-tertiary)" strokeWidth="1" />;
                    })}
                  </>
                );
              })()
            ) : (
              <>
                <path d={`M ${px} ${BEAM_Y + 4} L ${px - 14} ${BEAM_Y + 26} L ${px + 14} ${BEAM_Y + 26} Z`} fill="var(--color-surface-raised)" stroke={color} strokeWidth="2" />
                {s.type === "roller" ? (
                  <>
                    <circle cx={px - 7} cy={BEAM_Y + 31} r="4" fill="none" stroke={color} strokeWidth="1.5" />
                    <circle cx={px + 7} cy={BEAM_Y + 31} r="4" fill="none" stroke={color} strokeWidth="1.5" />
                  </>
                ) : (
                  <line x1={px - 16} y1={BEAM_Y + 28} x2={px + 16} y2={BEAM_Y + 28} stroke={color} strokeWidth="2" />
                )}
              </>
            )}
            {/* interaction target / handle */}
            {supportsDraggable ? (
              <circle cx={px} cy={BEAM_Y} r={handleRadius(sel)} fill={handleFill(sel)} stroke="var(--color-surface-base)" strokeWidth="2" {...dragHandle({ kind: "support", id: s.id }, `Drag support ${s.id} along beam`, s.x)} />
            ) : (
              <circle cx={px} cy={BEAM_Y} r={5} fill="var(--color-text-tertiary)" stroke="var(--color-surface-base)" strokeWidth="2" style={{ cursor: "default" }} onPointerDown={(e) => { e.stopPropagation(); onSelect({ kind: "support", id: s.id }); }} />
            )}
            <text x={px} y={labelY} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={color} pointerEvents="none">
              {s.id} · {s.type}
              {supportsDraggable ? "" : " 🔒"}
            </text>
          </g>
        );
      })}

      {/* reaction arrows */}
      {result?.reactions.map((r) => {
        if (Math.abs(r.fy) < 1e-9) return null;
        const px = clamp(toX(r.x), X0, X1);
        const up = r.fy >= 0;
        const tail = up ? BEAM_Y + 62 : BEAM_Y - 62;
        const head = up ? BEAM_Y + 10 : BEAM_Y - 10;
        return (
          <g key={`reaction-${r.supportId}`} pointerEvents="none">
            <line x1={px} y1={tail} x2={px} y2={head} stroke="var(--color-primary)" strokeWidth="2.5" markerEnd={`url(#${reactionArrowId})`} />
            <text x={px + 18} y={up ? BEAM_Y + 40 : BEAM_Y - 36} textAnchor="start" fontSize="10.5" fontWeight="800" className="fill-[var(--color-primary)]">
              {formatSigned(r.fy)} {units.force}
            </text>
          </g>
        );
      })}

      {dragTooltip()}
    </svg>
  );
}
