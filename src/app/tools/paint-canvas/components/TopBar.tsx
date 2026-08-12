import { Brush, Download, FilePlus2, FolderOpen, ImagePlus, Maximize2, Minus, Plus, Redo2, RotateCcw, Save, Undo2 } from "lucide-react";
import { Button, Select } from "@/components/ui";
import type { ExportFormat, LocalSaveState } from "../types";

const SAVE_LABEL: Record<LocalSaveState, string> = {
  idle: "Local autosave",
  saving: "Saving…",
  saved: "Saved locally",
  unavailable: "Autosave unavailable",
  error: "Autosave issue",
};

export default function TopBar({ canUndo, canRedo, ready, exportFormat, zoom, saveState, onExportFormatChange, onUndo, onRedo, onZoomOut, onZoomIn, onFit, onResetView, onNew, onOpenProject, onSaveProject, onAddImage, onExport }: {
  canUndo: boolean;
  canRedo: boolean;
  ready: boolean;
  exportFormat: ExportFormat;
  zoom: number;
  saveState: LocalSaveState;
  onExportFormatChange: (format: ExportFormat) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFit: () => void;
  onResetView: () => void;
  onNew: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onAddImage: () => void;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-xs)]">
      <div className="mr-1 flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]"><span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"><Brush className="h-4 w-4" /></span>Paint &amp; Annotate</div>
      <span className="rounded-full border border-[var(--color-border-subtle)] px-2 py-1 text-xs font-semibold text-[var(--color-text-tertiary)]">{SAVE_LABEL[saveState]}</span>
      <div className="h-6 w-px bg-[var(--color-border-subtle)]" aria-hidden="true" />
      <Button size="sm" variant="ghost" leftIcon={<FilePlus2 className="h-4 w-4" />} onClick={onNew} disabled={!ready}>New</Button>
      <Button size="sm" variant="ghost" leftIcon={<FolderOpen className="h-4 w-4" />} onClick={onOpenProject} disabled={!ready}>Open project</Button>
      <Button size="sm" variant="ghost" leftIcon={<Save className="h-4 w-4" />} onClick={onSaveProject} disabled={!ready}>Save project</Button>
      <Button size="sm" variant="secondary" leftIcon={<Undo2 className="h-4 w-4" />} onClick={onUndo} disabled={!canUndo}>Undo</Button>
      <Button size="sm" variant="secondary" leftIcon={<Redo2 className="h-4 w-4" />} onClick={onRedo} disabled={!canRedo}>Redo</Button>
      <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-1">
        <Button size="sm" variant="ghost" onClick={onZoomOut} aria-label="Zoom out"><Minus className="h-4 w-4" /></Button>
        <span className="min-w-12 text-center font-mono text-xs font-semibold text-[var(--color-text-secondary)]">{Math.round(zoom * 100)}%</span>
        <Button size="sm" variant="ghost" onClick={onZoomIn} aria-label="Zoom in"><Plus className="h-4 w-4" /></Button>
      </div>
      <Button size="sm" variant="ghost" leftIcon={<Maximize2 className="h-4 w-4" />} onClick={onFit}>Fit</Button>
      <Button size="sm" variant="ghost" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={onResetView}>100%</Button>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" leftIcon={<ImagePlus className="h-4 w-4" />} onClick={onAddImage}>Add image</Button>
        <Select width="short" value={exportFormat} onChange={(event) => onExportFormatChange(event.target.value as ExportFormat)}><option value="png">PNG</option><option value="jpeg">JPEG</option><option value="webp">WebP</option></Select>
        <Button size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={onExport} disabled={!ready}>Export</Button>
      </div>
    </div>
  );
}
