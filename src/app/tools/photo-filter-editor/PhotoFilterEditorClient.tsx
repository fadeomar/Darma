"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HelpCircle, Redo2, Undo2 } from "lucide-react";
import { Button, Tabs } from "@/components/ui";
import { downloadText } from "../_shared/clientUtils";
import { AdjustmentPanel } from "./components/AdjustmentPanel";
import { BeforeAfterStage } from "./components/BeforeAfterStage";
import { CropControls } from "./components/CropControls";
import { CssOutput } from "./components/CssOutput";
import { ExportPanel } from "./components/ExportPanel";
import { PresetGallery } from "./components/PresetGallery";
import { ProjectControls } from "./components/ProjectControls";
import { ShortcutHelpDialog } from "./components/ShortcutHelpDialog";
import { StatusMessage } from "./components/StatusMessage";
import { useCustomPresets } from "./hooks/useCustomPresets";
import { useImageSource } from "./hooks/useImageSource";
import { usePhotoHistory } from "./hooks/usePhotoHistory";
import { usePhotoViewport } from "./hooks/usePhotoViewport";
import {
  createDefaultFilterState,
  getActiveRasterAdjustments,
  isNeutral,
  sanitizeCssClassName,
  validateFilters,
} from "./lib/adjustments";
import { fitAspectCrop, FULL_CROP, getCropAspectRatio, getOrientedDimensions } from "./lib/crop";
import { browserSupportsWebP, createEditedImageBlob, downloadBlob } from "./lib/exporters";
import {
  MAX_PROJECT_JSON_CHARS,
  createDefaultEditState,
  createDefaultPreviewSettings,
  createPhotoProject,
  parseProjectJson,
  projectContainsImageData,
  serializeProject,
} from "./lib/project";
import { createDefaultExportSettings } from "./lib/resize";
import { flipEditState, resetTransform, rotateEditState } from "./lib/transforms";
import { getFilterPreset } from "./presets";
import type {
  AdjustmentKey,
  CropAspectId,
  ExportSettings,
  NormalizedCrop,
  PreviewSettings,
  ToolStatus,
} from "./types";

type MobileTab = "presets" | "adjust" | "crop" | "export" | "css" | "project";

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").trim() || "edited-photo";
}

export default function PhotoFilterEditorClient() {
  const [status, setStatus] = useState<ToolStatus>({ tone: "info", message: "Load a photo to begin. Everything stays in your browser." });
  const [projectName, setProjectName] = useState("Untitled photo project");
  const [exportSettings, setExportSettings] = useState<ExportSettings>(createDefaultExportSettings);
  const [preview, setPreview] = useState<PreviewSettings>(createDefaultPreviewSettings);
  const [cropEditing, setCropEditing] = useState(false);
  const [pendingCrop, setPendingCrop] = useState<NormalizedCrop>({ ...FULL_CROP });
  const [cropAspectId, setCropAspectId] = useState<CropAspectId>("free");
  const [mobileTab, setMobileTab] = useState<MobileTab>("presets");
  const [exporting, setExporting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [webpSupported, setWebpSupported] = useState(true);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const projectInputRef = useRef<HTMLInputElement | null>(null);
  const reportStatus = useCallback((next: ToolStatus) => setStatus(next), []);
  const reportPreviewError = useCallback(() => reportStatus({ tone: "error", message: "The preview could not be rendered. Try a smaller image or reset the adjustments." }), [reportStatus]);
  const history = usePhotoHistory(createDefaultEditState());
  const viewport = usePhotoViewport();
  const image = useImageSource(reportStatus);
  const customPresets = useCustomPresets(useCallback((message: string) => reportStatus({ tone: "warning", message }), [reportStatus]));
  const edit = history.state;

  useEffect(() => setWebpSupported(browserSupportsWebP()), []);

  const loadFile = useCallback(async (file: File | null | undefined) => {
    if (!file) return;
    const hasImageEdits = !isNeutral(history.state.adjustments)
      || JSON.stringify(history.state.crop) !== JSON.stringify(FULL_CROP)
      || history.state.orientation.rotate !== 0
      || history.state.orientation.flipH
      || history.state.orientation.flipV;
    if (image.photo && hasImageEdits && !window.confirm("Replace the image and reset the current photo edits?")) return;
    const loaded = await image.load(file);
    if (!loaded) return;
    const name = baseName(file.name);
    history.reset(createDefaultEditState());
    viewport.resetView();
    setPendingCrop({ ...FULL_CROP });
    setCropEditing(false);
    setCropAspectId("free");
    setProjectName(name);
    setExportSettings({ ...createDefaultExportSettings(), filename: name });
  }, [history, image, viewport]);

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (isEditableTarget(event.target)) return;
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) => entry.type.startsWith("image/"));
      if (!item) return;
      const file = item.getAsFile();
      if (file) void loadFile(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadFile]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (helpOpen || isEditableTarget(event.target)) return;
      if (event.key === "Escape" && cropEditing) {
        event.preventDefault();
        setPendingCrop({ ...edit.crop });
        setCropEditing(false);
        reportStatus({ tone: "info", message: "Crop edit cancelled." });
        return;
      }
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        history.undo();
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        history.redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cropEditing, edit.crop, helpOpen, history, reportStatus]);

  const sourceOriented = image.photo
    ? getOrientedDimensions(image.photo.info.width, image.photo.info.height, edit.orientation)
    : { width: 1, height: 1 };
  const cropAspectRatio = useMemo(
    () => getCropAspectRatio(cropAspectId, sourceOriented.width, sourceOriented.height),
    [cropAspectId, sourceOriented.height, sourceOriented.width],
  );

  const validation = validateFilters(edit.adjustments, Boolean(image.photo));
  const cssClassName = sanitizeCssClassName(exportSettings.filename || "filtered-image");

  function applyPreset(id: string) {
    const preset = getFilterPreset(id);
    if (!preset) return;
    if (history.apply((current) => ({ ...current, adjustments: { ...preset.filters } }))) {
      reportStatus({ tone: "success", message: `Applied ${preset.name}.` });
    }
  }

  function setAdjustment(key: AdjustmentKey, value: number) {
    history.apply((current) => ({ ...current, adjustments: { ...current.adjustments, [key]: value } }));
  }

  function startCrop() {
    if (!image.photo) return;
    setPendingCrop({ ...edit.crop });
    setCropEditing(true);
    setPreview((current) => ({ ...current, showOverlays: true }));
    viewport.resetView();
    reportStatus({ tone: "info", message: "Drag the crop area or its handles, then apply or cancel." });
  }

  function cancelCrop() {
    setPendingCrop({ ...edit.crop });
    setCropEditing(false);
    reportStatus({ tone: "info", message: "Crop edit cancelled." });
  }

  async function exportImage() {
    if (!image.photo || exporting) return;
    if (exportSettings.format === "webp" && !webpSupported) {
      reportStatus({ tone: "error", message: "WebP export is not supported in this browser. Choose PNG or JPEG." });
      return;
    }
    setExporting(true);
    reportStatus({ tone: "info", message: "Rendering the full-resolution export locally…" });
    try {
      const result = await createEditedImageBlob(image.photo, edit, exportSettings);
      downloadBlob(result.blob, result.plan.filename);
      reportStatus({ tone: result.plan.wasDownscaled ? "warning" : "success", message: `Exported ${result.plan.filename} at ${result.plan.width}×${result.plan.height}.${result.plan.wasDownscaled ? " Safe downscaling was applied." : ""}` });
    } catch {
      reportStatus({ tone: "error", message: "Export failed. Try smaller output dimensions or another format." });
    } finally {
      setExporting(false);
    }
  }

  function exportProject() {
    const project = createPhotoProject(projectName, edit, exportSettings, preview);
    downloadText(`${sanitizeCssClassName(projectName)}.photo-filter.json`, serializeProject(project), "application/json;charset=utf-8");
    reportStatus({ tone: "success", message: "Exported project settings. The image itself was not included." });
  }

  async function importProjectFile(file: File | null | undefined) {
    if (!file) return;
    if (file.size > MAX_PROJECT_JSON_CHARS) {
      reportStatus({ tone: "error", message: "The project file is too large." });
      return;
    }
    try {
      const text = await file.text();
      if (projectContainsImageData(text)) {
        reportStatus({ tone: "error", message: "Project files must not contain embedded image data." });
        return;
      }
      const result = parseProjectJson(text);
      if (result.ok === false) {
        reportStatus({ tone: "error", message: result.error });
        return;
      }
      image.remove();
      history.reset(result.project.edit);
      setProjectName(result.project.name);
      setExportSettings(result.project.export);
      setPreview(result.project.preview);
      setPendingCrop(result.project.edit.crop);
      setCropEditing(false);
      setCropAspectId("free");
      viewport.resetView();
      reportStatus({ tone: "success", message: "Imported project settings. Load the matching image to continue." });
    } catch {
      reportStatus({ tone: "error", message: "The project file could not be read." });
    }
  }

  function resetProject() {
    const defaultExport = createDefaultExportSettings();
    const defaultPreview = createDefaultPreviewSettings();
    const meaningful = Boolean(image.photo)
      || projectName !== "Untitled photo project"
      || !isNeutral(edit.adjustments)
      || JSON.stringify(edit.crop) !== JSON.stringify(FULL_CROP)
      || edit.orientation.rotate !== 0
      || edit.orientation.flipH
      || edit.orientation.flipV
      || JSON.stringify(exportSettings) !== JSON.stringify(defaultExport)
      || JSON.stringify(preview) !== JSON.stringify(defaultPreview);
    if (meaningful && !window.confirm("Reset the complete photo project? The current image and edits will be removed.")) return;
    image.remove();
    history.reset(createDefaultEditState());
    setProjectName("Untitled photo project");
    setExportSettings(createDefaultExportSettings());
    setPreview(createDefaultPreviewSettings());
    setPendingCrop({ ...FULL_CROP });
    setCropEditing(false);
    setCropAspectId("free");
    setMobileTab("presets");
    viewport.resetView();
    reportStatus({ tone: "info", message: "Reset the complete project." });
  }

  const presetPanel = (
    <PresetGallery
      photo={image.photo}
      adjustments={edit.adjustments}
      customPresets={customPresets.items}
      onApply={applyPreset}
      onApplyCustom={(preset) => {
        if (history.apply((current) => ({ ...current, adjustments: { ...preset.adjustments } }))) reportStatus({ tone: "success", message: `Loaded ${preset.name}.` });
      }}
      onSaveCustom={(name) => {
        const saved = customPresets.save(name, edit.adjustments);
        if (saved) reportStatus({ tone: "success", message: `Saved ${saved.name}.` });
      }}
      onRenameCustom={(id, name) => {
        if (customPresets.rename(id, name)) reportStatus({ tone: "success", message: "Renamed the custom preset." });
      }}
      onDeleteCustom={(id) => {
        if (customPresets.remove(id)) reportStatus({ tone: "success", message: "Deleted the custom preset." });
      }}
      onClearCustom={() => {
        if (window.confirm("Delete all custom photo presets from this browser?") && customPresets.clear()) {
          reportStatus({ tone: "success", message: "Cleared all custom presets." });
        }
      }}
    />
  );

  const adjustmentPanel = (
    <AdjustmentPanel
      adjustments={edit.adjustments}
      onBeginSlider={history.beginTransaction}
      onLiveValue={(key, value) => history.updateTransaction((current) => ({ ...current, adjustments: { ...current.adjustments, [key]: value } }))}
      onCommitSlider={history.commitTransaction}
      onCancelSlider={history.cancelTransaction}
      onCommitValue={setAdjustment}
      onResetValue={(key) => setAdjustment(key, createDefaultFilterState()[key])}
      onResetAll={() => {
        if (history.apply((current) => ({ ...current, adjustments: createDefaultFilterState() }))) reportStatus({ tone: "success", message: "Reset all adjustments." });
      }}
    />
  );

  const cropPanel = (
    <CropControls
      hasImage={Boolean(image.photo)}
      crop={edit.crop}
      pendingCrop={pendingCrop}
      orientation={edit.orientation}
      cropEditing={cropEditing}
      aspectId={cropAspectId}
      sourceWidth={sourceOriented.width}
      sourceHeight={sourceOriented.height}
      onAspectChange={(id, ratio) => {
        setCropAspectId(id);
        const next = fitAspectCrop(cropEditing ? pendingCrop : edit.crop, ratio);
        if (cropEditing) setPendingCrop(next);
        else {
          setPendingCrop(next);
          setCropEditing(true);
        }
      }}
      onStartCrop={startCrop}
      onApplyCrop={() => {
        if (history.apply((current) => ({ ...current, crop: { ...pendingCrop } }))) reportStatus({ tone: "success", message: "Applied the crop." });
        setCropEditing(false);
      }}
      onCancelCrop={cancelCrop}
      onResetCrop={() => {
        setCropEditing(false);
        setPendingCrop({ ...FULL_CROP });
        if (history.apply((current) => ({ ...current, crop: { ...FULL_CROP } }))) reportStatus({ tone: "success", message: "Reset the crop." });
      }}
      onRotate={(direction) => {
        setCropEditing(false);
        history.apply((current) => rotateEditState(current, direction));
      }}
      onFlip={(axis) => {
        setCropEditing(false);
        history.apply((current) => flipEditState(current, axis));
      }}
      onResetTransform={() => {
        setCropEditing(false);
        history.apply(resetTransform);
      }}
    />
  );

  const projectPanel = (
    <ProjectControls
      photo={image.photo}
      projectName={projectName}
      preview={preview}
      onProjectName={setProjectName}
      onChooseImage={() => imageInputRef.current?.click()}
      onRemoveImage={() => { image.remove(); reportStatus({ tone: "info", message: "Removed the image. Editing settings are preserved." }); }}
      onExportProject={exportProject}
      onImportProject={() => projectInputRef.current?.click()}
      onResetProject={resetProject}
      onPreviewChange={setPreview}
      onOpenHelp={() => setHelpOpen(true)}
    />
  );

  const exportPanel = <ExportPanel photo={image.photo} edit={edit} settings={exportSettings} exporting={exporting} webpSupported={webpSupported} onChange={setExportSettings} onExport={() => void exportImage()} />;
  const cssPanel = <CssOutput edit={edit} className={cssClassName} />;

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-2">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" leftIcon={<Undo2 className="h-4 w-4" />} onClick={history.undo} disabled={!history.canUndo} aria-label="Undo" title="Undo (Ctrl or Command Z)">Undo</Button>
          <Button size="icon" variant="ghost" leftIcon={<Redo2 className="h-4 w-4" />} onClick={history.redo} disabled={!history.canRedo} aria-label="Redo" title="Redo (Ctrl or Command Shift Z)">Redo</Button>
          <Button size="icon" variant="ghost" leftIcon={<HelpCircle className="h-4 w-4" />} onClick={() => setHelpOpen(true)} aria-label="Show keyboard shortcuts" title="Keyboard shortcuts">Help</Button>
        </div>
        <div className="min-w-0 text-right">
          <div className="truncate text-xs font-bold text-[var(--color-text-primary)]">{projectName}</div>
          <div className="text-xs text-[var(--color-text-tertiary)]">{getActiveRasterAdjustments(edit.adjustments).length > 0 ? "CSS + raster adjustments" : "CSS-compatible adjustments"}</div>
        </div>
      </div>

      <StatusMessage status={status} />
      {validation.length > 0 ? <ul className="space-y-1 text-xs text-[var(--color-text-tertiary)]">{validation.map((message) => <li key={message.message}>• {message.message}</li>)}</ul> : null}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <aside className="hidden min-w-0 space-y-5 xl:block">{projectPanel}{presetPanel}{cropPanel}</aside>
        <main className="min-w-0 xl:col-start-2">
          <BeforeAfterStage
            photo={image.photo}
            edit={edit}
            preview={preview}
            cropEditing={cropEditing}
            pendingCrop={pendingCrop}
            cropAspectRatio={cropAspectRatio}
            zoom={viewport.zoom}
            pan={viewport.pan}
            panMode={viewport.panMode}
            loading={image.loading}
            onChooseImage={() => imageInputRef.current?.click()}
            onDropFile={(file) => void loadFile(file)}
            onComparisonPosition={(position) => setPreview((current) => ({ ...current, comparisonPosition: position }))}
            onToggleComparison={() => setPreview((current) => ({ ...current, comparisonEnabled: !current.comparisonEnabled }))}
            onResetComparison={() => setPreview((current) => ({ ...current, comparisonPosition: 50 }))}
            onToggleOverlays={() => setPreview((current) => ({ ...current, showOverlays: !current.showOverlays }))}
            onPendingCrop={setPendingCrop}
            onZoomIn={viewport.zoomIn}
            onZoomOut={viewport.zoomOut}
            onResetView={viewport.resetView}
            onSetZoom={viewport.setZoom}
            onSetPan={viewport.setPan}
            onTogglePan={() => viewport.setPanMode((current) => !current)}
            onRenderError={reportPreviewError}
          />

          <div className="mt-4 min-w-0 xl:hidden">
            <Tabs<MobileTab>
              ariaLabel="Photo editor controls"
              value={mobileTab}
              onChange={setMobileTab}
              items={[
                { value: "presets", label: "Presets" },
                { value: "adjust", label: "Adjust" },
                { value: "crop", label: "Crop" },
                { value: "export", label: "Export" },
                { value: "css", label: "CSS" },
                { value: "project", label: "Project" },
              ]}
            />
            <div className="mt-4 min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3 sm:p-4">
              {mobileTab === "presets" ? presetPanel : null}
              {mobileTab === "adjust" ? adjustmentPanel : null}
              {mobileTab === "crop" ? cropPanel : null}
              {mobileTab === "export" ? exportPanel : null}
              {mobileTab === "css" ? cssPanel : null}
              {mobileTab === "project" ? projectPanel : null}
            </div>
          </div>
        </main>
        <aside className="hidden min-w-0 space-y-5 xl:block">{adjustmentPanel}{exportPanel}{cssPanel}</aside>
      </div>

      <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" className="hidden" onChange={(event) => { void loadFile(event.target.files?.[0]); event.target.value = ""; }} />
      <input ref={projectInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => { void importProjectFile(event.target.files?.[0]); event.target.value = ""; }} />
      <ShortcutHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
