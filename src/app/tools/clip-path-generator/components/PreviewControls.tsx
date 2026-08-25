"use client";

import { useState } from "react";
import { Eye, EyeOff, ImageOff, Link2, Upload } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SampleBackground } from "../sampleImages";
import type { ClipPathStudioSettings, PreviewObjectFit, PreviewObjectPosition } from "../types";

export function PreviewControls({
  imageUrl,
  settings,
  samples,
  onUpload,
  onSelectSample,
  onLoadUrl,
  onRemoveImage,
  onSettingsChange,
}: {
  imageUrl: string | null;
  settings: ClipPathStudioSettings;
  samples: SampleBackground[];
  onUpload: () => void;
  onSelectSample: (dataUri: string, label: string) => void;
  onLoadUrl: (url: string) => void;
  onRemoveImage: () => void;
  onSettingsChange: (next: Partial<ClipPathStudioSettings>) => void;
}) {
  const [urlDraft, setUrlDraft] = useState("");
  const submitUrl = () => {
    const value = urlDraft.trim();
    if (!value) return;
    onLoadUrl(value);
  };

  return (
    <section aria-labelledby="preview-controls-title" className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 id="preview-controls-title" className="text-sm font-black text-[var(--color-text-primary)]">Preview image</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Use a photo or sample to judge the crop. Images stay in your browser.</p>
        </div>
        <Button size="icon" variant={settings.showHandles ? "ghost" : "soft"} onClick={() => onSettingsChange({ showHandles: !settings.showHandles })} aria-pressed={!settings.showHandles} aria-label={settings.showHandles ? "Enter preview mode" : "Return to edit mode"} title={settings.showHandles ? "Preview without handles" : "Return to edit mode"}>
          {settings.showHandles ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" leftIcon={<Upload className="h-4 w-4" />} onClick={onUpload}>{imageUrl ? "Replace image" : "Upload image"}</Button>
        {imageUrl ? <Button size="sm" variant="ghost" leftIcon={<ImageOff className="h-4 w-4" />} onClick={onRemoveImage}>Remove</Button> : null}
      </div>

      <div className="mt-3">
        <p className="text-xs font-bold text-[var(--color-text-secondary)]">Sample backgrounds</p>
        <div className="mt-1.5 grid grid-cols-5 gap-1.5">
          {samples.map((sample) => {
            const active = imageUrl === sample.dataUri;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => onSelectSample(sample.dataUri, sample.label)}
                aria-pressed={active}
                title={`Use “${sample.label}” as the preview background`}
                className={cn(
                  "aspect-[4/3] overflow-hidden rounded-[var(--radius-sm)] border bg-cover bg-center transition duration-[var(--duration-fast)]",
                  active
                    ? "border-[var(--color-primary)] shadow-[var(--focus-ring)]"
                    : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]",
                )}
                style={{ backgroundImage: `url("${sample.dataUri}")` }}
              >
                <span className="sr-only">{sample.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <details className="mt-4 border-t border-[var(--color-border-subtle)] pt-3">
        <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-secondary)] outline-none focus-visible:shadow-[var(--focus-ring)]">
          Advanced preview
        </summary>

        <div className="mt-3">
          <label htmlFor="clip-path-image-url" className="text-xs font-bold text-[var(--color-text-secondary)]">Load image from URL</label>
          <div className="mt-1.5 flex gap-2">
            <Input
              id="clip-path-image-url"
              type="url"
              size="sm"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="https://example.com/photo.jpg"
              value={urlDraft}
              onChange={(event) => setUrlDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitUrl();
                }
              }}
            />
            <Button size="sm" variant="secondary" leftIcon={<Link2 className="h-4 w-4" />} onClick={submitUrl} disabled={!urlDraft.trim()}>Load</Button>
          </div>
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
      </details>
    </section>
  );
}
