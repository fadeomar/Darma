"use client";

import { useEffect, useRef, useState } from "react";
import { Check, MoreHorizontal, Save, Trash2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { adjustmentsEqual, createDefaultOrientation } from "../lib/adjustments";
import { FULL_CROP } from "../lib/crop";
import { renderPhotoToCanvas } from "../lib/renderPipeline";
import { FILTER_PRESETS, findMatchingPresetId, getPresetCategories } from "../presets";
import type { CustomPreset, LoadedPhoto, PhotoAdjustments } from "../types";

function PresetThumbnail({ photo, adjustments }: { photo: LoadedPhoto | null; adjustments: PhotoAdjustments }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!photo || !canvas) return;
    const maxEdge = 240;
    const scale = Math.min(1, maxEdge / Math.max(photo.previewWidth, photo.previewHeight));
    const outputWidth = Math.max(1, Math.round(photo.previewWidth * scale));
    const outputHeight = Math.max(1, Math.round(photo.previewHeight * scale));
    const frame = requestAnimationFrame(() => {
      try {
        renderPhotoToCanvas(canvas, {
          source: photo.preview,
          sourceWidth: photo.previewWidth,
          sourceHeight: photo.previewHeight,
          outputWidth,
          outputHeight,
          adjustments,
          orientation: createDefaultOrientation(),
          crop: FULL_CROP,
        });
      } catch {
        canvas.width = 1;
        canvas.height = 1;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [adjustments, photo]);

  return photo ? <canvas ref={canvasRef} className="h-full w-full object-cover" aria-hidden="true" /> : null;
}

export function PresetGallery({
  photo,
  adjustments,
  customPresets,
  onApply,
  onApplyCustom,
  onSaveCustom,
  onRenameCustom,
  onDeleteCustom,
  onClearCustom,
}: {
  photo: LoadedPhoto | null;
  adjustments: PhotoAdjustments;
  customPresets: CustomPreset[];
  onApply: (id: string) => void;
  onApplyCustom: (preset: CustomPreset) => void;
  onSaveCustom: (name: string) => void;
  onRenameCustom: (id: string, name: string) => void;
  onDeleteCustom: (id: string) => void;
  onClearCustom: () => void;
}) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const activeId = findMatchingPresetId(adjustments);

  return (
    <section aria-label="Filter presets" className="min-w-0 space-y-4">
      <div>
        <h2 className="text-sm font-black text-[var(--color-text-primary)]">Presets</h2>
        <p className="text-xs text-[var(--color-text-tertiary)]">Start with a look, then fine-tune.</p>
      </div>

      {getPresetCategories().map((category) => {
        const presets = FILTER_PRESETS.filter((preset) => preset.category === category);
        return (
          <div key={category}>
            <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{category}</h3>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => {
                const active = activeId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onApply(preset.id)}
                    className={`group min-w-0 overflow-hidden rounded-[var(--radius-md)] border text-left outline-none transition focus-visible:shadow-[var(--focus-ring)] ${active ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]" : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]"}`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[linear-gradient(135deg,#f59e0b,#ec4899_48%,#2563eb)]">
                      <PresetThumbnail photo={photo} adjustments={preset.filters} />
                      {active ? <span className="absolute right-1.5 top-1.5 rounded-full bg-[var(--color-primary)] p-1 text-white"><Check className="h-3 w-3" /></span> : null}
                    </div>
                    <div className="p-2">
                      <div className="truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.name}</div>
                      <div className="line-clamp-2 text-[10px] leading-4 text-[var(--color-text-tertiary)]">{preset.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black text-[var(--color-text-primary)]">Custom presets</h3>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">Adjustment values only.</p>
          </div>
          {customPresets.length > 0 ? <Button size="sm" variant="ghost" onClick={onClearCustom}>Clear all</Button> : null}
        </div>
        <div className="flex min-w-0 gap-2">
          <Input value={name} maxLength={50} placeholder="Preset name" aria-label="Custom preset name" onChange={(event) => setName(event.target.value)} />
          <Button
            size="icon"
            leftIcon={<Save className="h-4 w-4" />}
            aria-label="Save current adjustments as preset"
            title="Save current adjustments"
            onClick={() => {
              if (!name.trim()) return;
              onSaveCustom(name);
              setName("");
            }}
            disabled={!name.trim()}
          >
            Save preset
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {customPresets.map((preset) => {
            const active = adjustmentsEqual(preset.adjustments, adjustments, 0.0005);
            return (
              <div key={preset.id} className={`flex min-w-0 items-center gap-2 rounded-[var(--radius-sm)] border p-2 ${active ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]" : "border-[var(--color-border-subtle)]"}`}>
                {editingId === preset.id ? (
                  <Input
                    autoFocus
                    size="sm"
                    defaultValue={preset.name}
                    maxLength={50}
                    aria-label={`Rename ${preset.name}`}
                    onBlur={(event) => {
                      onRenameCustom(preset.id, event.currentTarget.value);
                      setEditingId(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                      if (event.key === "Escape") setEditingId(null);
                    }}
                  />
                ) : (
                  <button type="button" aria-pressed={active} className="flex min-h-9 min-w-0 flex-1 items-center gap-2 text-left text-xs font-bold text-[var(--color-text-primary)]" onClick={() => onApplyCustom(preset)}>
                    <span className="min-w-0 flex-1 truncate">{preset.name}</span>
                    {active ? <Check className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" aria-hidden="true" /> : null}
                  </button>
                )}
                <Button size="icon" variant="ghost" leftIcon={<MoreHorizontal className="h-4 w-4" />} aria-label={`Rename ${preset.name}`} title="Rename preset" onClick={() => setEditingId(preset.id)}>Rename</Button>
                <Button size="icon" variant="ghost" leftIcon={<Trash2 className="h-4 w-4" />} aria-label={`Delete ${preset.name}`} title="Delete preset" onClick={() => onDeleteCustom(preset.id)}>Delete</Button>
              </div>
            );
          })}
          {customPresets.length === 0 ? <p className="py-2 text-center text-xs text-[var(--color-text-tertiary)]">No custom presets yet.</p> : null}
        </div>
      </div>
    </section>
  );
}
