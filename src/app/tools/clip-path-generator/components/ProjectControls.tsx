"use client";

import {
  AlignCenter,
  FlipHorizontal2,
  FlipVertical2,
  Maximize,
  Redo2,
  RotateCcw,
  RotateCw,
  Shuffle,
  Undo2,
} from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { MAX_SNAP_SIZE, MIN_SNAP_SIZE } from "../studio";
import type { CanvasAspectRatio } from "../types";

export function ProjectControls({
  canUndo,
  canRedo,
  validShape,
  aspectRatio,
  snapEnabled,
  snapSize,
  scaleStep,
  onUndo,
  onRedo,
  onReset,
  onAspectRatioChange,
  onSnapSizeChange,
  onReverse,
  onMirrorX,
  onMirrorY,
  onRotateClockwise,
  onRotateCounterclockwise,
  onCenter,
  onFit,
  onScaleStepChange,
  onScale,
}: {
  canUndo: boolean;
  canRedo: boolean;
  validShape: boolean;
  aspectRatio: CanvasAspectRatio;
  snapEnabled: boolean;
  snapSize: number;
  scaleStep: number;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onAspectRatioChange: (value: CanvasAspectRatio) => void;
  onSnapSizeChange: (value: number) => void;
  onReverse: () => void;
  onMirrorX: () => void;
  onMirrorY: () => void;
  onRotateClockwise: () => void;
  onRotateCounterclockwise: () => void;
  onCenter: () => void;
  onFit: () => void;
  onScaleStepChange: (value: number) => void;
  onScale: (percent: number) => void;
}) {
  return (
    <section aria-labelledby="project-controls-title" className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <h2 id="project-controls-title" className="text-sm font-black text-[var(--color-text-primary)]">Project controls</h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Button size="sm" variant="secondary" leftIcon={<Undo2 className="h-4 w-4" />} onClick={onUndo} disabled={!canUndo}>Undo</Button>
        <Button size="sm" variant="secondary" leftIcon={<Redo2 className="h-4 w-4" />} onClick={onRedo} disabled={!canRedo}>Redo</Button>
        <Button size="sm" variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={onReset}>Reset</Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="text-xs font-bold text-[var(--color-text-secondary)]">
          Canvas ratio
          <Select className="mt-1" size="sm" value={aspectRatio} onChange={(event) => onAspectRatioChange(event.target.value as CanvasAspectRatio)}>
            <option value="square">Square</option>
            <option value="4:3">4:3</option>
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="free">Free</option>
          </Select>
        </label>
        <label className="text-xs font-bold text-[var(--color-text-secondary)]">
          Snap size (%)
          <Input className="mt-1" size="sm" type="number" min={MIN_SNAP_SIZE} max={MAX_SNAP_SIZE} value={snapSize} disabled={!snapEnabled} title={!snapEnabled ? "Enable snapping from the stage toolbar first" : "Grid spacing in percent"} onChange={(event) => onSnapSizeChange(Number(event.target.value))} />
        </label>
      </div>
      {aspectRatio === "free" ? (
        <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">
          Free adapts to the available workspace; manual canvas resizing is not available.
        </p>
      ) : null}

      <div className="mt-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Transforms</h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button size="sm" variant="ghost" leftIcon={<Shuffle className="h-4 w-4" />} onClick={onReverse}>Reverse</Button>
          <Button size="sm" variant="ghost" leftIcon={<AlignCenter className="h-4 w-4" />} onClick={onCenter} disabled={!validShape} title={!validShape ? "Fix validation errors first" : undefined}>Center</Button>
          <Button size="sm" variant="ghost" leftIcon={<FlipHorizontal2 className="h-4 w-4" />} onClick={onMirrorX}>Mirror X</Button>
          <Button size="sm" variant="ghost" leftIcon={<FlipVertical2 className="h-4 w-4" />} onClick={onMirrorY}>Mirror Y</Button>
          <Button size="sm" variant="ghost" leftIcon={<RotateCw className="h-4 w-4" />} onClick={onRotateClockwise} disabled={!validShape} title={!validShape ? "Fix validation errors first" : "Rotate 90 degrees clockwise"}>Rotate CW</Button>
          <Button size="sm" variant="ghost" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={onRotateCounterclockwise} disabled={!validShape} title={!validShape ? "Fix validation errors first" : "Rotate 90 degrees counterclockwise"}>Rotate CCW</Button>
          <Button className="col-span-2" size="sm" variant="ghost" leftIcon={<Maximize className="h-4 w-4" />} onClick={onFit} disabled={!validShape} title={!validShape ? "Fix validation errors first" : "Fit the shape inside safe bounds"}>Fit safe bounds</Button>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto_auto] items-end gap-2">
          <label className="text-xs font-bold text-[var(--color-text-secondary)]">
            Scale step (%)
            <Input className="mt-1" size="sm" type="number" min={1} max={40} value={scaleStep} onChange={(event) => onScaleStepChange(Math.min(40, Math.max(1, Number(event.target.value) || 1)))} />
          </label>
          <Button size="sm" variant="secondary" onClick={() => onScale(-scaleStep)} disabled={!validShape} title={!validShape ? "Fix validation errors first" : `Scale inward by ${scaleStep}%`}>Inward</Button>
          <Button size="sm" variant="secondary" onClick={() => onScale(scaleStep)} disabled={!validShape} title={!validShape ? "Fix validation errors first" : `Scale outward by ${scaleStep}%`}>Outward</Button>
        </div>
      </div>
    </section>
  );
}
