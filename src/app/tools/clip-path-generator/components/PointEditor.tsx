"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, CopyPlus, Crosshair, Plus, Trash2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { MAX_POINTS, MIN_POINTS, normalizePoint } from "../clipPath";
import type { ClipPoint } from "../types";

function PointRow({
  point,
  index,
  count,
  selected,
  rowRef,
  onSelect,
  onCommit,
  onDuplicate,
  onDelete,
  onReorder,
}: {
  point: ClipPoint;
  index: number;
  count: number;
  selected: boolean;
  rowRef: (node: HTMLDivElement | null) => void;
  onSelect: (focusStage?: boolean) => void;
  onCommit: (next: Partial<ClipPoint>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReorder: (toIndex: number) => void;
}) {
  const [draftX, setDraftX] = useState(String(point.x));
  const [draftY, setDraftY] = useState(String(point.y));
  const cancelledCommitRef = useRef<"x" | "y" | null>(null);

  useEffect(() => setDraftX(String(point.x)), [point.x]);
  useEffect(() => setDraftY(String(point.y)), [point.y]);

  function commit(axis: "x" | "y") {
    if (cancelledCommitRef.current === axis) {
      cancelledCommitRef.current = null;
      if (axis === "x") setDraftX(String(point.x));
      else setDraftY(String(point.y));
      return;
    }
    const raw = axis === "x" ? draftX : draftY;
    if (!raw.trim()) {
      if (axis === "x") setDraftX(String(point.x));
      else setDraftY(String(point.y));
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      if (axis === "x") setDraftX(String(point.x));
      else setDraftY(String(point.y));
      return;
    }
    const normalized = normalizePoint({ ...point, [axis]: value })[axis];
    if (axis === "x") setDraftX(String(normalized));
    else setDraftY(String(normalized));
    onCommit({ [axis]: normalized });
  }

  return (
    <div ref={rowRef} role="group" aria-label={`Point ${index + 1} coordinates and actions`} className={`rounded-[var(--radius-md)] border p-2 ${selected ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]"}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => onSelect(true)} className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-sm)] px-2 text-xs font-black text-[var(--color-text-primary)] outline-none hover:bg-[var(--color-control-hover)] focus-visible:shadow-[var(--focus-ring)]" aria-pressed={selected}>
          <Crosshair className="h-3.5 w-3.5" /> Point {index + 1}
        </button>
        <div className="grid grid-cols-4 gap-1">
          <Button size="icon" variant="ghost" onClick={() => onReorder(index - 1)} disabled={index === 0} aria-label={`Move point ${index + 1} up`} title="Move up"><ChevronUp className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => onReorder(index + 1)} disabled={index === count - 1} aria-label={`Move point ${index + 1} down`} title="Move down"><ChevronDown className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={onDuplicate} disabled={count >= MAX_POINTS} aria-label={`Duplicate point ${index + 1}`} title={count >= MAX_POINTS ? `Maximum ${MAX_POINTS} points reached` : "Duplicate point"}><CopyPlus className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={onDelete} disabled={count <= MIN_POINTS} aria-label={`Delete point ${index + 1}`} title={count <= MIN_POINTS ? `A polygon needs at least ${MIN_POINTS} points` : "Delete point"}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] font-bold text-[var(--color-text-secondary)]">
          X (%)
          <Input
            className="mt-1"
            type="number"
            min={0}
            max={100}
            step="0.1"
            inputMode="decimal"
            aria-label={`Point ${index + 1} X coordinate in percent`}
            value={draftX}
            onFocus={() => onSelect(false)}
            onChange={(event) => setDraftX(event.target.value)}
            onBlur={() => commit("x")}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                cancelledCommitRef.current = "x";
                setDraftX(String(point.x));
                event.currentTarget.blur();
              }
            }}
          />
        </label>
        <label className="text-[11px] font-bold text-[var(--color-text-secondary)]">
          Y (%)
          <Input
            className="mt-1"
            type="number"
            min={0}
            max={100}
            step="0.1"
            inputMode="decimal"
            aria-label={`Point ${index + 1} Y coordinate in percent`}
            value={draftY}
            onFocus={() => onSelect(false)}
            onChange={(event) => setDraftY(event.target.value)}
            onBlur={() => commit("y")}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                cancelledCommitRef.current = "y";
                setDraftY(String(point.y));
                event.currentTarget.blur();
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}

export function PointEditor({
  points,
  selected,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete,
  onReorder,
  onAdd,
}: {
  points: ClipPoint[];
  selected: number | null;
  onSelect: (index: number, focusStage?: boolean) => void;
  onUpdate: (index: number, next: Partial<ClipPoint>) => void;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAdd: () => void;
}) {
  const rowsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selected === null) return;
    const list = listRef.current;
    const row = rowsRef.current.get(selected);
    if (!list || !row) return;
    const listRect = list.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    if (rowRect.top < listRect.top) list.scrollTop -= listRect.top - rowRect.top;
    else if (rowRect.bottom > listRect.bottom) list.scrollTop += rowRect.bottom - listRect.bottom;
  }, [selected]);

  return (
    <section aria-labelledby="point-editor-title" className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 id="point-editor-title" className="text-sm font-black text-[var(--color-text-primary)]">Point editor</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{points.length} of {MAX_POINTS} points</p>
        </div>
        <Button size="sm" variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={onAdd} disabled={points.length >= MAX_POINTS} title={points.length >= MAX_POINTS ? `Maximum ${MAX_POINTS} points reached` : "Add a point"}>Add</Button>
      </div>
      <div ref={listRef} className="max-h-[min(480px,55dvh)] space-y-2 overflow-y-auto overscroll-contain pr-1">
        {points.map((point, index) => (
          <PointRow
            key={index}
            point={point}
            index={index}
            count={points.length}
            selected={selected === index}
            rowRef={(node) => {
              if (node) rowsRef.current.set(index, node);
              else rowsRef.current.delete(index);
            }}
            onSelect={(focusStage) => onSelect(index, focusStage)}
            onCommit={(next) => onUpdate(index, next)}
            onDuplicate={() => onDuplicate(index)}
            onDelete={() => onDelete(index)}
            onReorder={(toIndex) => onReorder(index, toIndex)}
          />
        ))}
      </div>
    </section>
  );
}
