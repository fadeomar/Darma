"use client";

import { Check, FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw, Scan, X } from "lucide-react";
import { Button, Select } from "@/components/ui";
import { CROP_ASPECTS, cropEqual, FULL_CROP, getCropAspectRatio } from "../lib/crop";
import type { CropAspectId, NormalizedCrop, Orientation } from "../types";

export function CropControls({
  hasImage,
  crop,
  pendingCrop,
  orientation,
  cropEditing,
  aspectId,
  sourceWidth,
  sourceHeight,
  onAspectChange,
  onStartCrop,
  onApplyCrop,
  onCancelCrop,
  onResetCrop,
  onRotate,
  onFlip,
  onResetTransform,
}: {
  hasImage: boolean;
  crop: NormalizedCrop;
  pendingCrop: NormalizedCrop;
  orientation: Orientation;
  cropEditing: boolean;
  aspectId: CropAspectId;
  sourceWidth: number;
  sourceHeight: number;
  onAspectChange: (id: CropAspectId, ratio: number | null) => void;
  onStartCrop: () => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  onResetCrop: () => void;
  onRotate: (direction: 1 | -1) => void;
  onFlip: (axis: "horizontal" | "vertical") => void;
  onResetTransform: () => void;
}) {
  const transformNeutral = orientation.rotate === 0 && !orientation.flipH && !orientation.flipV;
  const cropNeutral = cropEqual(crop, FULL_CROP);

  return (
    <section aria-label="Crop and transform" className="space-y-3">
      <div>
        <h2 className="text-sm font-black text-[var(--color-text-primary)]">Crop &amp; transform</h2>
        <p className="text-xs text-[var(--color-text-tertiary)]">Non-destructive until export.</p>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
        <label className="block text-xs font-bold text-[var(--color-text-secondary)]">
          Crop aspect ratio
          <Select
            className="mt-1"
            value={aspectId}
            disabled={!hasImage}
            onChange={(event) => {
              const id = event.target.value as CropAspectId;
              onAspectChange(id, getCropAspectRatio(id, sourceWidth, sourceHeight));
            }}
          >
            {CROP_ASPECTS.map((aspect) => <option key={aspect.id} value={aspect.id}>{aspect.label}</option>)}
          </Select>
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {!cropEditing ? (
            <Button size="sm" leftIcon={<Scan className="h-4 w-4" />} onClick={onStartCrop} disabled={!hasImage}>Edit crop</Button>
          ) : (
            <>
              <Button size="sm" leftIcon={<Check className="h-4 w-4" />} onClick={onApplyCrop} disabled={cropEqual(crop, pendingCrop)}>Apply crop</Button>
              <Button size="sm" variant="secondary" leftIcon={<X className="h-4 w-4" />} onClick={onCancelCrop}>Cancel</Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={onResetCrop} disabled={!hasImage || cropNeutral}>Reset crop</Button>
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
        <div className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Transform</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
          <Button size="sm" variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => onRotate(-1)} disabled={!hasImage}>Rotate left</Button>
          <Button size="sm" variant="secondary" leftIcon={<RotateCw className="h-4 w-4" />} onClick={() => onRotate(1)} disabled={!hasImage}>Rotate right</Button>
          <Button size="sm" variant="secondary" leftIcon={<FlipHorizontal2 className="h-4 w-4" />} onClick={() => onFlip("horizontal")} disabled={!hasImage}>Flip H</Button>
          <Button size="sm" variant="secondary" leftIcon={<FlipVertical2 className="h-4 w-4" />} onClick={() => onFlip("vertical")} disabled={!hasImage}>Flip V</Button>
        </div>
        <Button className="mt-2 w-full" size="sm" variant="ghost" onClick={onResetTransform} disabled={!hasImage || transformNeutral}>Reset transform</Button>
      </div>
    </section>
  );
}
