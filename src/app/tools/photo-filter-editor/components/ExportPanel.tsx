"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Download, Link2, Link2Off } from "lucide-react";
import { Button, Input, Select, Slider } from "@/components/ui";
import { COMMON_SIZE_PRESETS, calculateOutputDimensions, clampOutputEdge, clampQuality, setLockedHeight, setLockedWidth } from "../lib/resize";
import type { ExportSettings, LoadedPhoto, PhotoEditState } from "../types";
import { cropToPixels, getOrientedDimensions } from "../lib/crop";


function CommitNumberInput({
  label,
  value,
  min,
  max,
  disabled,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const cancelledRef = useRef(false);
  useEffect(() => setDraft(String(value)), [value]);

  function commit() {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setDraft(String(value));
      return;
    }
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = Math.min(max, Math.max(min, Math.round(parsed)));
    onCommit(next);
    setDraft(String(next));
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      event.preventDefault();
      cancelledRef.current = true;
      setDraft(String(value));
      event.currentTarget.blur();
    }
  }

  return (
    <Input
      className="mt-1"
      aria-label={label}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={draft}
      disabled={disabled}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={keyDown}
    />
  );
}

export function ExportPanel({
  photo,
  edit,
  settings,
  exporting,
  webpSupported,
  onChange,
  onExport,
}: {
  photo: LoadedPhoto | null;
  edit: PhotoEditState;
  settings: ExportSettings;
  exporting: boolean;
  webpSupported: boolean;
  onChange: (settings: ExportSettings) => void;
  onExport: () => void;
}) {
  const oriented = photo ? getOrientedDimensions(photo.info.width, photo.info.height, edit.orientation) : { width: settings.width, height: settings.height };
  const cropPixels = cropToPixels(edit.crop, oriented.width, oriented.height);
  const aspect = cropPixels.width / cropPixels.height;
  const dimensions = calculateOutputDimensions(cropPixels.width, cropPixels.height, settings);
  const aspectMismatch = Math.abs(dimensions.width / dimensions.height - aspect) > 0.01;

  function update(patch: Partial<ExportSettings>) {
    onChange({ ...settings, ...patch });
  }

  function applyCommonPreset(id: string) {
    const preset = COMMON_SIZE_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    if (preset.mode === "original") {
      update({ resizeMode: "original" });
      return;
    }
    if (preset.width && preset.height) {
      update({ resizeMode: "custom", width: preset.width, height: preset.height, lockAspect: false });
      return;
    }
    const next = setLockedWidth(preset.width ?? cropPixels.width, aspect);
    update({ resizeMode: "custom", ...next, lockAspect: true });
  }

  return (
    <section aria-label="Image export" className="space-y-3">
      <div>
        <h2 className="text-sm font-black text-[var(--color-text-primary)]">Export image</h2>
        <p className="text-xs text-[var(--color-text-tertiary)]">Preview and export share the same render pipeline.</p>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <label className="text-xs font-bold text-[var(--color-text-secondary)]">
            Format
            <Select className="mt-1" value={settings.format} onChange={(event) => update({ format: event.target.value as ExportSettings["format"] })}>
              <option value="png">PNG — transparency</option>
              <option value="jpeg">JPEG — smaller file</option>
              <option value="webp" disabled={!webpSupported}>WebP{webpSupported ? "" : " — unsupported"}</option>
            </Select>
          </label>
          <label className="text-xs font-bold text-[var(--color-text-secondary)]">
            Filename
            <Input className="mt-1" value={settings.filename} maxLength={80} onChange={(event) => update({ filename: event.target.value })} />
          </label>
        </div>

        {settings.format !== "png" ? (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs font-bold text-[var(--color-text-secondary)]"><span>Quality</span><span>{Math.round(settings.quality * 100)}%</span></div>
            <Slider min={0.1} max={1} step={0.01} value={settings.quality} aria-label={`Export quality ${Math.round(settings.quality * 100)} percent`} onChange={(event) => update({ quality: clampQuality(Number(event.target.value)) })} />
          </div>
        ) : null}

        {settings.format === "jpeg" ? (
          <label className="mt-3 block text-xs font-bold text-[var(--color-text-secondary)]">
            Transparency background
            <Input className="mt-1 h-10 p-1" type="color" value={settings.backgroundColor} onChange={(event) => update({ backgroundColor: event.target.value })} />
          </label>
        ) : null}

        <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-3">
          <label className="block text-xs font-bold text-[var(--color-text-secondary)]">
            Size preset
            <Select className="mt-1" value="" onChange={(event) => applyCommonPreset(event.target.value)}>
              <option value="" disabled>Choose a size…</option>
              {COMMON_SIZE_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
            </Select>
          </label>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
            <label className="min-w-0 text-xs font-bold text-[var(--color-text-secondary)]">Width
              <CommitNumberInput
                label="Output width in pixels"
                min={16}
                max={12000}
                value={settings.resizeMode === "original" ? cropPixels.width : settings.width}
                disabled={settings.resizeMode === "original"}
                onCommit={(rawWidth) => {
                  const width = clampOutputEdge(rawWidth);
                  const next = settings.lockAspect ? setLockedWidth(width, aspect) : { width };
                  update({ resizeMode: "custom", ...next });
                }}
              />
            </label>
            <Button size="icon" variant="ghost" leftIcon={settings.lockAspect ? <Link2 className="h-4 w-4" /> : <Link2Off className="h-4 w-4" />} aria-label={settings.lockAspect ? "Unlock output aspect ratio" : "Lock output aspect ratio"} title={settings.lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"} onClick={() => update({ lockAspect: !settings.lockAspect })}>Aspect lock</Button>
            <label className="min-w-0 text-xs font-bold text-[var(--color-text-secondary)]">Height
              <CommitNumberInput
                label="Output height in pixels"
                min={16}
                max={12000}
                value={settings.resizeMode === "original" ? cropPixels.height : settings.height}
                disabled={settings.resizeMode === "original"}
                onCommit={(rawHeight) => {
                  const height = clampOutputEdge(rawHeight);
                  const next = settings.lockAspect ? setLockedHeight(height, aspect) : { height };
                  update({ resizeMode: "custom", ...next });
                }}
              />
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <label className="text-xs font-bold text-[var(--color-text-secondary)]">Resize mode
              <Select className="mt-1" value={settings.resizeMode} onChange={(event) => update({ resizeMode: event.target.value as ExportSettings["resizeMode"] })}>
                <option value="original">Original crop size</option>
                <option value="custom">Custom dimensions</option>
                <option value="scale">Scale percentage</option>
              </Select>
            </label>
            {settings.resizeMode === "scale" ? <label className="text-xs font-bold text-[var(--color-text-secondary)]">Scale
              <CommitNumberInput label="Export scale percentage" min={1} max={400} value={settings.scalePercent} onCommit={(scalePercent) => update({ scalePercent })} />
            </label> : null}
          </div>
          <label className="mt-3 flex min-h-10 items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={settings.allowUpscale} onChange={(event) => update({ allowUpscale: event.target.checked })} />
            Allow upscaling
          </label>
        </div>

        <div className="mt-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-subtle)] p-3 text-xs text-[var(--color-text-secondary)]">
          Final output: <strong className="text-[var(--color-text-primary)]">{dimensions.width}×{dimensions.height}</strong>
          {dimensions.wasDownscaled ? <div className="mt-1 text-[var(--color-warning-text)]">Safely downscaled to avoid unnecessary upscaling or the pixel limit.</div> : null}
          {dimensions.wouldUpscale && settings.allowUpscale ? <div className="mt-1 text-[var(--color-warning-text)]">Upscaling can reduce sharpness.</div> : null}
          {aspectMismatch && !settings.lockAspect ? <div className="mt-1 text-[var(--color-warning-text)]">Unlocked dimensions will stretch the cropped image.</div> : null}
        </div>

        <Button className="mt-3 w-full" leftIcon={<Download className="h-4 w-4" />} onClick={onExport} disabled={!photo || exporting} title={!photo ? "Load an image before exporting" : undefined}>
          {exporting ? "Rendering…" : "Download image"}
        </Button>
      </div>
    </section>
  );
}
