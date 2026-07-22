"use client";

import { Download, FileJson, HelpCircle, ImageOff, RotateCcw, Upload } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import type { LoadedPhoto, PreviewSettings } from "../types";

export function ProjectControls({
  photo,
  projectName,
  preview,
  onProjectName,
  onChooseImage,
  onRemoveImage,
  onExportProject,
  onImportProject,
  onResetProject,
  onPreviewChange,
  onOpenHelp,
}: {
  photo: LoadedPhoto | null;
  projectName: string;
  preview: PreviewSettings;
  onProjectName: (name: string) => void;
  onChooseImage: () => void;
  onRemoveImage: () => void;
  onExportProject: () => void;
  onImportProject: () => void;
  onResetProject: () => void;
  onPreviewChange: (preview: PreviewSettings) => void;
  onOpenHelp: () => void;
}) {
  return (
    <section aria-label="Image and project controls" className="space-y-3">
      <div>
        <h2 className="text-sm font-black text-[var(--color-text-primary)]">Image &amp; project</h2>
        <p className="text-xs text-[var(--color-text-tertiary)]">Images remain local and are never stored in project files.</p>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" leftIcon={<Upload className="h-4 w-4" />} onClick={onChooseImage}>{photo ? "Replace" : "Choose image"}</Button>
          <Button size="sm" variant="secondary" leftIcon={<ImageOff className="h-4 w-4" />} onClick={onRemoveImage} disabled={!photo}>Remove</Button>
        </div>
        {photo ? <p className="mt-2 truncate text-[10px] text-[var(--color-text-tertiary)]" title={photo.info.fileName}>{photo.info.fileName} · {photo.info.width}×{photo.info.height}</p> : null}
      </div>
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
        <label className="text-xs font-bold text-[var(--color-text-secondary)]">Project name
          <Input className="mt-1" value={projectName} maxLength={80} onChange={(event) => onProjectName(event.target.value)} />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button size="sm" variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={onExportProject}>Export JSON</Button>
          <Button size="sm" variant="secondary" leftIcon={<FileJson className="h-4 w-4" />} onClick={onImportProject}>Import JSON</Button>
        </div>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
        <label className="text-xs font-bold text-[var(--color-text-secondary)]">Preview background
          <Select className="mt-1" value={preview.background} onChange={(event) => onPreviewChange({ ...preview, background: event.target.value as PreviewSettings["background"] })}>
            <option value="checkerboard">Checkerboard</option><option value="light">Light</option><option value="dark">Dark</option>
          </Select>
        </label>
        <label className="mt-3 flex min-h-10 items-center gap-2 text-xs text-[var(--color-text-secondary)]"><input type="checkbox" checked={preview.comparisonEnabled} onChange={(event) => onPreviewChange({ ...preview, comparisonEnabled: event.target.checked })} />Show before/after comparison</label>
        <label className="flex min-h-10 items-center gap-2 text-xs text-[var(--color-text-secondary)]"><input type="checkbox" checked={preview.showOverlays} onChange={(event) => onPreviewChange({ ...preview, showOverlays: event.target.checked })} />Show editing overlays</label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="ghost" leftIcon={<HelpCircle className="h-4 w-4" />} onClick={onOpenHelp}>Shortcuts</Button>
        <Button size="sm" variant="ghost" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={onResetProject}>Reset project</Button>
      </div>
    </section>
  );
}
