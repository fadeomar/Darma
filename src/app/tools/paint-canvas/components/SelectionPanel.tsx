import { ArrowDownToLine, ArrowUpRight, Copy, FlipHorizontal2, FlipVertical2, ImageOff, Layers3, RotateCw, ScanSearch, Trash2, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui";
import type { SelectedSummary } from "../types";

export default function SelectionPanel({
  selected,
  onDuplicate,
  onDelete,
  onGroup,
  onUngroup,
  onFlipHorizontal,
  onFlipVertical,
  onBringToFront,
  onSendToBack,
  onUpdate,
  onBlurImage,
  onPixelateImage,
  onResetImageEffects,
}: {
  selected: SelectedSummary;
  onDuplicate: () => void;
  onDelete: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onUpdate: (patch: { opacity?: number; angle?: number }) => void;
  onBlurImage: () => void;
  onPixelateImage: () => void;
  onResetImageEffects: () => void;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
      <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
        <Layers3 className="h-3.5 w-3.5" /> Selection
      </div>
      <div className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">{selected.label}</div>
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="secondary" leftIcon={<Copy className="h-4 w-4" />} onClick={onDuplicate} disabled={selected.count !== 1}>Duplicate</Button>
        <Button size="sm" variant="secondary" leftIcon={<Trash2 className="h-4 w-4" />} onClick={onDelete} disabled={selected.count === 0}>Delete</Button>
        <Button size="sm" variant="ghost" onClick={onGroup} disabled={selected.count < 2}>Group</Button>
        <Button size="sm" variant="ghost" onClick={onUngroup} disabled={!selected.isGroup}>Ungroup</Button>
        <Button size="sm" variant="ghost" leftIcon={<ArrowUpRight className="h-4 w-4" />} onClick={onBringToFront} disabled={selected.count !== 1}>Front</Button>
        <Button size="sm" variant="ghost" leftIcon={<ArrowDownToLine className="h-4 w-4" />} onClick={onSendToBack} disabled={selected.count !== 1}>Back</Button>
      </div>

      {selected.count > 0 && (
        <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4">
          <div className="mb-2 text-xs font-bold text-[var(--color-text-secondary)]">Transform</div>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="ghost" leftIcon={<FlipHorizontal2 className="h-4 w-4" />} onClick={onFlipHorizontal} disabled={selected.count !== 1}>Flip H</Button>
            <Button size="sm" variant="ghost" leftIcon={<FlipVertical2 className="h-4 w-4" />} onClick={onFlipVertical} disabled={selected.count !== 1}>Flip V</Button>
          </div>
        </div>
      )}

      {selected.count === 1 && (
        <div className="mt-4 space-y-3 border-t border-[var(--color-border-subtle)] pt-4">
          <label className="block">
            <span className="mb-1 flex justify-between text-xs font-bold text-[var(--color-text-secondary)]">Object opacity <span className="font-mono text-[var(--color-text-tertiary)]">{Math.round(selected.opacity * 100)}%</span></span>
            <input type="range" min={10} max={100} step={5} value={Math.round(selected.opacity * 100)} onChange={(event) => onUpdate({ opacity: Number(event.target.value) / 100 })} className="w-full accent-[var(--color-primary)]" />
          </label>
          <Button size="sm" variant="ghost" leftIcon={<RotateCw className="h-4 w-4" />} onClick={() => onUpdate({ angle: (selected.angle + 90) % 360 })}>Rotate 90°</Button>
          <p className="text-xs leading-4 text-[var(--color-text-tertiary)]">Drag the rotation handle freely; nearby 15° angles snap into place for cleaner annotation layouts.</p>
        </div>
      )}

      {selected.isImage && (
        <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4">
          <div className="mb-2 text-xs font-bold text-[var(--color-text-secondary)]">Image privacy</div>
          <div className="grid grid-cols-1 gap-2">
            <Button size="sm" variant="ghost" leftIcon={<ScanSearch className="h-4 w-4" />} onClick={onBlurImage}>Blur image</Button>
            <Button size="sm" variant="ghost" leftIcon={<Grid3X3 className="h-4 w-4" />} onClick={onPixelateImage}>Pixelate image</Button>
            <Button size="sm" variant="ghost" leftIcon={<ImageOff className="h-4 w-4" />} onClick={onResetImageEffects}>Clear effects</Button>
          </div>
        </div>
      )}
    </section>
  );
}
