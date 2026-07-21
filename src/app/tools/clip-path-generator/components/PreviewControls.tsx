"use client";

import { Eye, EyeOff, ImageOff, Upload } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import type { ClipPathStudioSettings, PreviewObjectFit, PreviewObjectPosition } from "../types";

export function PreviewControls({
  imageUrl,
  settings,
  onUpload,
  onRemoveImage,
  onSettingsChange,
}: {
  imageUrl: string | null;
  settings: ClipPathStudioSettings;
  onUpload: () => void;
  onRemoveImage: () => void;
  onSettingsChange: (next: Partial<ClipPathStudioSettings>) => void;
}) {
  return (
    <section aria-labelledby="preview-controls-title" className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 id="preview-controls-title" className="text-sm font-black text-[var(--color-text-primary)]">Preview</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Images remain local to this browser.</p>
        </div>
        <Button size="icon" variant={settings.showHandles ? "ghost" : "soft"} onClick={() => onSettingsChange({ showHandles: !settings.showHandles })} aria-pressed={!settings.showHandles} aria-label={settings.showHandles ? "Enter preview mode" : "Return to edit mode"} title={settings.showHandles ? "Preview without handles" : "Return to edit mode"}>
          {settings.showHandles ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" leftIcon={<Upload className="h-4 w-4" />} onClick={onUpload}>{imageUrl ? "Replace image" : "Upload image"}</Button>
        {imageUrl ? <Button size="sm" variant="ghost" leftIcon={<ImageOff className="h-4 w-4" />} onClick={onRemoveImage}>Remove</Button> : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs font-bold text-[var(--color-text-secondary)]">
          Object fit
          <Select className="mt-1" size="sm" value={settings.objectFit} disabled={!imageUrl} onChange={(event) => onSettingsChange({ objectFit: event.target.value as PreviewObjectFit })}>
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
          </Select>
        </label>
        <label className="text-xs font-bold text-[var(--color-text-secondary)]">
          Position
          <Select className="mt-1" size="sm" value={settings.objectPosition} disabled={!imageUrl} onChange={(event) => onSettingsChange({ objectPosition: event.target.value as PreviewObjectPosition })}>
            <option value="center">Center</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </Select>
        </label>
      </div>

      <div className="mt-3 grid grid-cols-[auto_1fr] items-center gap-3">
        <Input type="color" width="auto" aria-label="Background color" value={settings.backgroundColor} onChange={(event) => onSettingsChange({ backgroundColor: event.target.value })} disabled={settings.checkerboard} className="h-10 w-14 p-1" />
        <label className="text-xs font-bold text-[var(--color-text-secondary)]">Background color</label>
      </div>

      <div className="mt-3 grid gap-2 text-sm text-[var(--color-text-secondary)] sm:grid-cols-2">
        <label className="flex min-h-9 items-center gap-2"><input type="checkbox" checked={settings.checkerboard} onChange={(event) => onSettingsChange({ checkerboard: event.target.checked })} /> Checkerboard</label>
        <label className="flex min-h-9 items-center gap-2"><input type="checkbox" checked={settings.showGhost} onChange={(event) => onSettingsChange({ showGhost: event.target.checked })} /> Ghost image</label>
        <label className="flex min-h-9 items-center gap-2"><input type="checkbox" checked={settings.showOutline} onChange={(event) => onSettingsChange({ showOutline: event.target.checked })} /> Polygon outline</label>
        <label className="flex min-h-9 items-center gap-2"><input type="checkbox" checked={settings.showPointLabels} onChange={(event) => onSettingsChange({ showPointLabels: event.target.checked })} /> Point labels</label>
      </div>
    </section>
  );
}
