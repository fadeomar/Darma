"use client";

import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Crop,
  Download,
  Eraser,
  Eye,
  FlipHorizontal2,
  FlipVertical2,
  Image as ImageIcon,
  ImageOff,
  Layers,
  Files,
  Palette,
  Plus,
  Save,
  Trash2,
  Maximize2,
  Redo2,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Undo2,
  Upload,
  WandSparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button, CopyButton, Input, Slider } from "@/components/ui";
import { SegmentedControl } from "@/features/tools/components";
import { cn } from "@/lib/cn";
import {
  advancedIsNeutral,
  createDefaultAdvancedState,
  CURVE_CHANNELS,
  HSL_BANDS,
} from "./advanced";
import { parseCubeLut } from "./lut";
import { normalizeCustomPhotoPreset } from "./customPresets";
import { removeBackgroundLocally } from "./backgroundRemoval";
import { backgroundModelBackend, createDefaultSmartState } from "./smart";
import {
  buildFilterString,
  createDefaultFilterState,
  createDefaultOrientation,
  EXPORT_MIME,
  FILTER_CONTROLS,
  formatControlValue,
  generateFilterCss,
  hasAdvancedAdjustments,
  validateFilters,
} from "./filters";
import {
  DEFAULT_PRESET_ID,
  FILTER_PRESETS,
  getFilterPreset,
  mixPresetFilters,
  PRESET_CATEGORIES,
} from "./presets";
import {
  approximateBlobSize,
  createDefaultCrop,
  getNaturalOutputDimensions,
  renderPhotoToCanvas,
  resolveCrop,
} from "./render";
import { estimateCanvasWorkingMemory, fitPreviewToWorkspace, resolveOutputDimensions, shouldWarnLargeExport } from "./workspace";
import type {
  BackgroundFillMode,
  BackgroundMask,
  BackgroundRemovalProgress,
  BatchItem,
  CustomPhotoPreset,
  CurveChannel,
  CropRatioId,
  CropState,
  EditorPanelId,
  EditorSnapshot,
  ExportFormat,
  FilterControl,
  FilterPresetCategory,
  FilterState,
  HslBandId,
  LutDefinition,
  Orientation,
  OverlayType,
  PreviewCompareMode,
} from "./types";

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_PRESET_BYTES = 512 * 1024;
const MAX_CUSTOM_PRESETS = 60;
const MAX_HISTORY = 40;
const PREVIEW_MAX_DIMENSION = 1200;
const INTERACTIVE_PREVIEW_MAX_DIMENSION = 720;
const CUSTOM_PRESET_STORAGE_KEY = "darma-photo-filter-custom-presets-v1";

const CROP_RATIOS: { id: CropRatioId; label: string; hint: string }[] = [
  { id: "original", label: "Original", hint: "Full image" },
  { id: "free", label: "Free", hint: "Custom" },
  { id: "1:1", label: "1:1", hint: "Square" },
  { id: "4:3", label: "4:3", hint: "Classic" },
  { id: "3:2", label: "3:2", hint: "Photo" },
  { id: "5:4", label: "5:4", hint: "Print" },
  { id: "16:9", label: "16:9", hint: "Wide" },
  { id: "9:16", label: "9:16", hint: "Story" },
];

const PANEL_ITEMS: { id: EditorPanelId; label: string; icon: typeof Sparkles }[] = [
  { id: "filters", label: "Filters", icon: Sparkles },
  { id: "adjust", label: "Adjust", icon: SlidersHorizontal },
  { id: "crop", label: "Crop", icon: Crop },
  { id: "effects", label: "Effects", icon: WandSparkles },
  { id: "advanced", label: "Advanced", icon: Palette },
  { id: "smart", label: "Smart", icon: Eraser },
  { id: "batch", label: "Batch", icon: Files },
  { id: "export", label: "Export", icon: Download },
];

const EXPORT_FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
];

const COMPARE_OPTIONS: { value: PreviewCompareMode; label: string }[] = [
  { value: "edited", label: "Edited" },
  { value: "split", label: "Compare" },
  { value: "original", label: "Original" },
];

const OVERLAY_OPTIONS: { value: OverlayType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "light-leak", label: "Light leak" },
  { value: "warm-glow", label: "Warm glow" },
  { value: "cool-glow", label: "Cool glow" },
  { value: "film-dust", label: "Film dust" },
];

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function imageFromFile(file: File) {
  return new Promise<{ image: HTMLImageElement; url: string }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not decode ${file.name}.`));
    };
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, mime: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed."))), mime, quality);
  });
}


function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 100 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

function sameSnapshot(a: EditorSnapshot | undefined, b: EditorSnapshot) {
  return Boolean(a && JSON.stringify(a) === JSON.stringify(b));
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return target.isContentEditable || tag === "input" || tag === "textarea" || tag === "select";
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('button, a, input, textarea, select, [role="button"], [contenteditable="true"]'));
}

function SliderControl({
  control,
  value,
  disabled,
  onChange,
  onEditStart,
  onEditEnd,
}: {
  control: FilterControl;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-[var(--color-text-secondary)]">{control.label}</span>
        <span className="rounded-[var(--radius-full)] bg-[var(--color-surface-subtle)] px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-[var(--color-text-tertiary)]">
          {formatControlValue(control, value)}
        </span>
      </span>
      <Slider
        min={control.min}
        max={control.max}
        step={control.step}
        value={value}
        disabled={disabled}
        aria-label={control.label}
        onPointerDown={onEditStart}
        onPointerUp={onEditEnd}
        onPointerCancel={onEditEnd}
        onBlur={onEditEnd}
        onKeyDown={onEditStart}
        onKeyUp={onEditEnd}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {control.description ? (
        <span className="block text-xs leading-4 text-[var(--color-text-tertiary)]">{control.description}</span>
      ) : null}
    </label>
  );
}

function PanelTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1 border-b border-[var(--color-border-subtle)] pb-3">
      <h3 className="text-sm font-black tracking-[-0.01em] text-[var(--color-text-primary)]">{title}</h3>
      <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">{description}</p>
    </div>
  );
}

export default function PhotoFilterEditorClient() {
  const [filters, setFilters] = useState<FilterState>(createDefaultFilterState);
  const [advanced, setAdvanced] = useState(createDefaultAdvancedState);
  const [smart, setSmart] = useState(createDefaultSmartState);
  const [backgroundMask, setBackgroundMask] = useState<BackgroundMask | null>(null);
  const [backgroundProgress, setBackgroundProgress] = useState<BackgroundRemovalProgress>({ status: "idle", percent: 0, message: "Model loads only when you ask for background removal." });
  const [healMode, setHealMode] = useState(false);
  const [healBrushSize, setHealBrushSize] = useState(4);
  const [lut, setLut] = useState<LutDefinition | null>(null);
  const [orientation, setOrientation] = useState<Orientation>(createDefaultOrientation);
  const [crop, setCrop] = useState<CropState>(createDefaultCrop);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("edited-image");
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);
  const [presetStrength, setPresetStrength] = useState(1);
  const [presetCategory, setPresetCategory] = useState<"all" | FilterPresetCategory>("essentials");
  const [activePanel, setActivePanel] = useState<EditorPanelId>("filters");
  const [compareMode, setCompareMode] = useState<PreviewCompareMode>("edited");
  const [splitPosition, setSplitPosition] = useState(50);
  const [zoom, setZoom] = useState(100);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("jpeg");
  const [exportQuality, setExportQuality] = useState(0.92);
  const [outputMode, setOutputMode] = useState<"original" | "custom">("original");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [lockAspect, setLockAspect] = useState(true);
  const [customDimensionDriver, setCustomDimensionDriver] = useState<"width" | "height">("width");
  const [estimatedBytes, setEstimatedBytes] = useState(0);
  const [status, setStatus] = useState("Upload an image to begin.");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [activeHslBand, setActiveHslBand] = useState<HslBandId>("red");
  const [activeCurveChannel, setActiveCurveChannel] = useState<CurveChannel>("rgb");
  const [customPresetName, setCustomPresetName] = useState("");
  const [customPresets, setCustomPresets] = useState<CustomPhotoPreset[]>([]);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [batchSmartBackground, setBatchSmartBackground] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isPreviewDraft, setIsPreviewDraft] = useState(false);
  const [workspaceSize, setWorkspaceSize] = useState({ width: 0, height: 0 });

  const initialSnapshot = useMemo<EditorSnapshot>(
    () => ({
      filters: createDefaultFilterState(),
      orientation: createDefaultOrientation(),
      crop: createDefaultCrop(),
      presetId: DEFAULT_PRESET_ID,
      presetStrength: 1,
      advanced: createDefaultAdvancedState(),
      smart: createDefaultSmartState(),
    }),
    [],
  );
  const [history, setHistory] = useState<EditorSnapshot[]>([initialSnapshot]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lutInputRef = useRef<HTMLInputElement>(null);
  const presetImportRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const editedCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const currentSnapshotRef = useRef<EditorSnapshot>(initialSnapshot);
  const continuousEditRef = useRef(false);
  const healPointerRef = useRef<{ x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const compareHoldRestoreRef = useRef<PreviewCompareMode | null>(null);
  const batchCancelRef = useRef(false);

  const snapshot = useMemo<EditorSnapshot>(
    () => ({ filters, orientation, crop, presetId, presetStrength, advanced, smart }),
    [filters, orientation, crop, presetId, presetStrength, advanced, smart],
  );
  // Latest-value mirror for the event handlers and requestAnimationFrame
  // callbacks below, which read the freshest snapshot without being re-created
  // on every edit. It is never read during render, and writing it here (rather
  // than in an effect) keeps it current before the rAF commits on lines ~901
  // and ~1171 run.
  // eslint-disable-next-line react-hooks/refs
  currentSnapshotRef.current = snapshot;

  const cssClassName = fileName.trim() ? fileName.trim().replace(/\.[^.]+$/, "") : "filtered-image";
  const cssFilterString = useMemo(() => buildFilterString(filters), [filters]);
  const advancedActive = useMemo(() => hasAdvancedAdjustments(filters) || !advancedIsNeutral(advanced) || Boolean(lut), [filters, advanced, lut]);
  const messages = validateFilters(filters, Boolean(imageEl));

  const naturalOutput = useMemo(() => {
    if (!imageEl) return { width: 0, height: 0 };
    return getNaturalOutputDimensions(imageEl.naturalWidth, imageEl.naturalHeight, crop, orientation);
  }, [imageEl, crop, orientation]);

  const outputDimensions = useMemo(() => {
    if (!imageEl) return { width: 0, height: 0 };
    return resolveOutputDimensions(naturalOutput, {
      mode: outputMode,
      customWidth,
      customHeight,
      lockAspect,
      driver: customDimensionDriver,
    });
  }, [imageEl, naturalOutput, outputMode, customWidth, customHeight, lockAspect, customDimensionDriver]);

  const estimatedWorkingMemory = useMemo(() => estimateCanvasWorkingMemory(outputDimensions), [outputDimensions]);
  const largeExport = useMemo(() => shouldWarnLargeExport(outputDimensions), [outputDimensions]);
  const fittedPreview = useMemo(() => fitPreviewToWorkspace(previewSize, workspaceSize), [previewSize, workspaceSize]);

  const visiblePresets = useMemo(
    () => FILTER_PRESETS.filter((preset) => presetCategory === "all" || preset.category === presetCategory),
    [presetCategory],
  );

  const lightControls = useMemo(() => FILTER_CONTROLS.filter((control) => control.group === "light"), []);
  const colorControls = useMemo(() => FILTER_CONTROLS.filter((control) => control.group === "color"), []);
  const effectControls = useMemo(() => FILTER_CONTROLS.filter((control) => control.group === "effects"), []);

  const revokeUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => revokeUrl, [revokeUrl]);

  useEffect(() => {
    const node = workspaceRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const update = () => setWorkspaceSize({ width: node.clientWidth, height: node.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const replaceHistory = useCallback(
    (next: EditorSnapshot) => {
      setHistory([next]);
      setHistoryIndex(0);
    },
    [],
  );

  const commitSnapshot = useCallback(
    (next: EditorSnapshot) => {
      setHistory((prev) => {
        const base = prev.slice(0, historyIndex + 1);
        if (sameSnapshot(base.at(-1), next)) return prev;
        const appended = [...base, next];
        const capped = appended.length > MAX_HISTORY ? appended.slice(appended.length - MAX_HISTORY) : appended;
        setHistoryIndex(capped.length - 1);
        return capped;
      });
    },
    [historyIndex],
  );

  const applySnapshot = useCallback((next: EditorSnapshot) => {
    setFilters(next.filters);
    setOrientation(next.orientation);
    setCrop(next.crop);
    setPresetId(next.presetId);
    setPresetStrength(next.presetStrength);
    setAdvanced(next.advanced);
    setSmart(next.smart);
  }, []);

  const beginContinuousEdit = useCallback(() => {
    continuousEditRef.current = true;
    setIsPreviewDraft(true);
  }, []);

  const finishContinuousEdit = useCallback(() => {
    setIsPreviewDraft(false);
    if (!continuousEditRef.current) return;
    continuousEditRef.current = false;
    commitSnapshot(currentSnapshotRef.current);
  }, [commitSnapshot]);

  const resetEditorState = useCallback(() => {
    const next = {
      filters: createDefaultFilterState(),
      orientation: createDefaultOrientation(),
      crop: createDefaultCrop(),
      presetId: DEFAULT_PRESET_ID,
      presetStrength: 1,
      advanced: createDefaultAdvancedState(),
      smart: createDefaultSmartState(),
    } satisfies EditorSnapshot;
    applySnapshot(next);
    replaceHistory(next);
    setCompareMode("edited");
    setZoom(100);
    setOutputMode("original");
    setCustomWidth("");
    setCustomHeight("");
    setLut(null);
    setBackgroundMask(null);
    setBackgroundProgress({ status: "idle", percent: 0, message: "Model loads only when you ask for background removal." });
    setHealMode(false);
    setIsPreviewDraft(false);
    return next;
  }, [applySnapshot, replaceHistory]);

  const loadFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setStatus("Unsupported file. Choose a PNG, JPEG, WebP, GIF, or another browser-readable image.");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setStatus("That image is larger than 25 MB. Choose a smaller file.");
        return;
      }

      setIsBusy(true);
      revokeUrl();
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      const img = new Image();
      img.onload = () => {
        setImageSrc(url);
        setImageEl(img);
        setFileName(file.name.replace(/\.[^.]+$/, "") || "edited-image");
        resetEditorState();
        setIsBusy(false);
        setStatus(`Loaded ${file.name} · ${img.naturalWidth}×${img.naturalHeight} · editing stays on this device.`);
      };
      img.onerror = () => {
        revokeUrl();
        setIsBusy(false);
        setStatus("Could not decode that image. Try a different file.");
      };
      img.src = url;
    },
    [resetEditorState, revokeUrl],
  );

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) => entry.type.startsWith("image/"));
      if (item) loadFile(item.getAsFile());
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadFile]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CUSTOM_PRESET_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      setCustomPresets(
        parsed
          .slice(0, MAX_CUSTOM_PRESETS)
          .map((item, index) => normalizeCustomPhotoPreset(item, `stored-preset-${index + 1}`))
          .filter((item): item is CustomPhotoPreset => Boolean(item)),
      );
    } catch {
      // A corrupted local preset cache should never block the editor.
    }
  }, []);

  const persistCustomPresets = useCallback((next: CustomPhotoPreset[]) => {
    const capped = next.slice(0, MAX_CUSTOM_PRESETS);
    setCustomPresets(capped);
    try {
      window.localStorage.setItem(CUSTOM_PRESET_STORAGE_KEY, JSON.stringify(capped));
    } catch {
      setStatus("The preset works in this session, but browser storage is unavailable.");
    }
  }, []);

  useEffect(() => {
    if (!imageEl || !editedCanvasRef.current || !originalCanvasRef.current) return;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled || !editedCanvasRef.current || !originalCanvasRef.current) return;
      try {
        const edited = renderPhotoToCanvas(imageEl, editedCanvasRef.current, {
          filters,
          orientation,
          crop,
          maxDimension: isPreviewDraft ? INTERACTIVE_PREVIEW_MAX_DIMENSION : PREVIEW_MAX_DIMENSION,
          advanced,
          lut,
          smart,
          backgroundMask,
        });
        renderPhotoToCanvas(imageEl, originalCanvasRef.current, {
          filters: createDefaultFilterState(),
          orientation,
          crop,
          maxDimension: isPreviewDraft ? INTERACTIVE_PREVIEW_MAX_DIMENSION : PREVIEW_MAX_DIMENSION,
        });
        setPreviewSize(edited);
      } catch {
        setStatus("Preview rendering failed for this image.");
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [imageEl, filters, orientation, crop, advanced, lut, smart, backgroundMask, isPreviewDraft]);

  useEffect(() => {
    if (!imageEl || !editedCanvasRef.current || previewSize.width <= 0 || outputDimensions.width <= 0) {
      setEstimatedBytes(0);
      return;
    }
    const canvas = editedCanvasRef.current;
    const mime = EXPORT_MIME[exportFormat];
    const quality = exportFormat === "png" ? undefined : exportQuality;
    const timer = window.setTimeout(() => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const previewPixels = previewSize.width * previewSize.height;
          const outputPixels = outputDimensions.width * outputDimensions.height;
          setEstimatedBytes(approximateBlobSize(blob.size, previewPixels, outputPixels));
        },
        mime,
        quality,
      );
    }, 140);
    return () => window.clearTimeout(timer);
  }, [imageEl, previewSize, outputDimensions, exportFormat, exportQuality, filters, crop, orientation, advanced, lut, smart, backgroundMask]);

  const applyPreset = useCallback(
    (id: string) => {
      const preset = getFilterPreset(id);
      if (!preset) return;
      const next: EditorSnapshot = {
        ...currentSnapshotRef.current,
        filters: preset.filters,
        presetId: id,
        presetStrength: 1,
      };
      applySnapshot(next);
      commitSnapshot(next);
      setStatus(`Applied ${preset.name}. Fine-tune it or change its strength.`);
    },
    [applySnapshot, commitSnapshot],
  );

  const updatePresetStrength = useCallback(
    (strengthPercent: number) => {
      const preset = getFilterPreset(presetId);
      if (!preset) return;
      const strength = Math.max(0, Math.min(1, strengthPercent / 100));
      setPresetStrength(strength);
      setFilters(mixPresetFilters(preset.filters, strength));
    },
    [presetId],
  );

  const updateFilter = useCallback((key: keyof FilterState, value: number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPresetId("custom");
    setPresetStrength(1);
  }, []);

  const updateOrientationAndCommit = useCallback(
    (nextOrientation: Orientation) => {
      const next = { ...currentSnapshotRef.current, orientation: nextOrientation };
      applySnapshot(next);
      commitSnapshot(next);
    },
    [applySnapshot, commitSnapshot],
  );

  const setCropRatio = useCallback(
    (ratioId: CropRatioId) => {
      if (!imageEl) return;
      const base = { ...crop, ratioId };
      const nextCrop = resolveCrop(base, imageEl.naturalWidth, imageEl.naturalHeight);
      const next = { ...currentSnapshotRef.current, crop: nextCrop };
      applySnapshot(next);
      commitSnapshot(next);
      setStatus(ratioId === "original" ? "Restored the full image." : `Crop ratio set to ${ratioId}.`);
    },
    [imageEl, crop, applySnapshot, commitSnapshot],
  );

  const updateCrop = useCallback((patch: Partial<CropState>) => {
    setCrop((prev) => ({ ...prev, ...patch }));
  }, []);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    const next = history[nextIndex];
    if (!next) return;
    applySnapshot(next);
    setHistoryIndex(nextIndex);
    setStatus("Undid the last edit.");
  }, [history, historyIndex, applySnapshot]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const next = history[nextIndex];
    if (!next) return;
    applySnapshot(next);
    setHistoryIndex(nextIndex);
    setStatus("Redid the edit.");
  }, [history, historyIndex, applySnapshot]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!imageEl || event.defaultPrevented || isEditableTarget(event.target)) return;
      const activeElement = document.activeElement;
      if (rootRef.current && activeElement !== document.body && !rootRef.current.contains(activeElement)) return;
      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey || event.metaKey;

      if (modifier && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (modifier && key === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (!modifier && key === "o" && !event.repeat) {
        event.preventDefault();
        compareHoldRestoreRef.current = compareMode;
        setCompareMode("original");
        return;
      }
      if (!modifier && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        setZoom((value) => Math.min(200, value + 25));
        return;
      }
      if (!modifier && event.key === "-") {
        event.preventDefault();
        setZoom((value) => Math.max(25, value - 25));
        return;
      }
      if (!modifier && event.key === "0") {
        event.preventDefault();
        setZoom(100);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "o" || compareHoldRestoreRef.current === null) return;
      const restore = compareHoldRestoreRef.current;
      compareHoldRestoreRef.current = null;
      setCompareMode(restore);
    };
    const restoreHeldCompare = () => {
      if (compareHoldRestoreRef.current === null) return;
      const restore = compareHoldRestoreRef.current;
      compareHoldRestoreRef.current = null;
      setCompareMode(restore);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", restoreHeldCompare);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", restoreHeldCompare);
    };
  }, [imageEl, compareMode, undo, redo]);

  const resetAll = useCallback(() => {
    const next: EditorSnapshot = {
      filters: createDefaultFilterState(),
      orientation: createDefaultOrientation(),
      crop: createDefaultCrop(),
      presetId: DEFAULT_PRESET_ID,
      presetStrength: 1,
      advanced: createDefaultAdvancedState(),
      smart: createDefaultSmartState(),
    };
    setLut(null);
    setBackgroundMask(null);
    setBackgroundProgress({ status: "idle", percent: 0, message: "Model loads only when you ask for background removal." });
    setHealMode(false);
    setIsPreviewDraft(false);
    applySnapshot(next);
    commitSnapshot(next);
    setStatus("Reset filters, crop, and orientation.");
  }, [applySnapshot, commitSnapshot]);

  const removeImage = useCallback(() => {
    revokeUrl();
    setImageSrc(null);
    setImageEl(null);
    resetEditorState();
    setPreviewSize({ width: 0, height: 0 });
    setEstimatedBytes(0);
    setStatus("Removed the image. Nothing was uploaded or stored.");
  }, [revokeUrl, resetEditorState]);

  const handleCustomWidth = useCallback(
    (value: string) => {
      setCustomDimensionDriver("width");
      setCustomWidth(value);
      if (!lockAspect || naturalOutput.width <= 0) return;
      const width = Number.parseInt(value, 10);
      if (width > 0) setCustomHeight(String(Math.max(1, Math.round((width / naturalOutput.width) * naturalOutput.height))));
    },
    [lockAspect, naturalOutput],
  );

  const handleCustomHeight = useCallback(
    (value: string) => {
      setCustomDimensionDriver("height");
      setCustomHeight(value);
      if (!lockAspect || naturalOutput.height <= 0) return;
      const height = Number.parseInt(value, 10);
      if (height > 0) setCustomWidth(String(Math.max(1, Math.round((height / naturalOutput.height) * naturalOutput.width))));
    },
    [lockAspect, naturalOutput],
  );

  const toggleLockAspect = useCallback((checked: boolean) => {
    setLockAspect(checked);
    if (!checked || outputMode !== "custom" || naturalOutput.width <= 0 || naturalOutput.height <= 0) return;
    if (customDimensionDriver === "height") {
      const height = Math.max(1, Number.parseInt(customHeight, 10) || naturalOutput.height);
      setCustomHeight(String(height));
      setCustomWidth(String(Math.max(1, Math.round((height / naturalOutput.height) * naturalOutput.width))));
      return;
    }
    const width = Math.max(1, Number.parseInt(customWidth, 10) || naturalOutput.width);
    setCustomWidth(String(width));
    setCustomHeight(String(Math.max(1, Math.round((width / naturalOutput.width) * naturalOutput.height))));
  }, [outputMode, naturalOutput, customDimensionDriver, customWidth, customHeight]);

  const switchOutputMode = useCallback(
    (mode: "original" | "custom") => {
      setOutputMode(mode);
      if (mode === "custom" && naturalOutput.width > 0) {
        setCustomDimensionDriver("width");
        setCustomWidth(String(naturalOutput.width));
        setCustomHeight(String(naturalOutput.height));
      }
    },
    [naturalOutput],
  );

  const exportImage = useCallback(() => {
    if (!imageEl || outputDimensions.width <= 0 || outputDimensions.height <= 0) return;
    setIsBusy(true);
    setStatus("Rendering the full-resolution export locally…");
    try {
      const canvas = document.createElement("canvas");
      renderPhotoToCanvas(imageEl, canvas, {
        filters,
        orientation,
        crop,
        advanced,
        lut,
        smart,
        backgroundMask,
        targetWidth: outputDimensions.width,
        targetHeight: outputDimensions.height,
        jpegBackground: exportFormat === "jpeg",
      });
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setStatus("Export failed. Try a smaller output size or another format.");
            setIsBusy(false);
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          const extension = exportFormat === "jpeg" ? "jpg" : exportFormat;
          link.href = url;
          link.download = `${cssClassName}.${extension}`;
          link.click();
          window.setTimeout(() => URL.revokeObjectURL(url), 0);
          setEstimatedBytes(blob.size);
          setIsBusy(false);
          setStatus(`Exported ${link.download} · ${canvas.width}×${canvas.height} · ${formatBytes(blob.size)} · no watermark.`);
        },
        EXPORT_MIME[exportFormat],
        exportFormat === "png" ? undefined : exportQuality,
      );
    } catch {
      setStatus("Export failed unexpectedly. Try a smaller image or output size.");
      setIsBusy(false);
    }
  }, [imageEl, outputDimensions, filters, orientation, crop, advanced, lut, smart, backgroundMask, exportFormat, exportQuality, cssClassName]);

  const updateHslBand = useCallback((bandId: HslBandId, key: "hue" | "saturation" | "lightness", value: number) => {
    setAdvanced((prev) => ({
      ...prev,
      hsl: { ...prev.hsl, [bandId]: { ...prev.hsl[bandId], [key]: value } },
    }));
  }, []);

  const updateCurvePoint = useCallback((channel: CurveChannel, index: 1 | 2 | 3, value: number) => {
    setAdvanced((prev) => {
      const points = [...prev.curves[channel]] as typeof prev.curves[typeof channel];
      points[index] = value;
      return { ...prev, curves: { ...prev.curves, [channel]: points } };
    });
  }, []);

  const resetAdvancedColor = useCallback(() => {
    const defaults = createDefaultAdvancedState();
    const nextAdvanced = { ...advanced, hsl: defaults.hsl, curves: defaults.curves };
    const next = { ...currentSnapshotRef.current, advanced: nextAdvanced };
    applySnapshot(next);
    commitSnapshot(next);
    setStatus("Reset HSL and curves.");
  }, [advanced, applySnapshot, commitSnapshot]);

  const setOverlay = useCallback((type: OverlayType) => {
    const nextAdvanced = { ...advanced, overlay: { ...advanced.overlay, type } };
    const next = { ...currentSnapshotRef.current, advanced: nextAdvanced };
    applySnapshot(next);
    commitSnapshot(next);
  }, [advanced, applySnapshot, commitSnapshot]);

  const addCurrentLookLayer = useCallback(() => {
    if (!imageEl) return;
    const name = presetId === "custom" ? `Custom look ${advanced.layers.length + 1}` : getFilterPreset(presetId)?.name ?? "Custom look";
    const layer = { id: createId("layer"), name, filters: { ...filters }, intensity: 1, enabled: true };
    const nextAdvanced = { ...advanced, layers: [...advanced.layers, layer] };
    const next: EditorSnapshot = {
      ...currentSnapshotRef.current,
      filters: createDefaultFilterState(),
      presetId: DEFAULT_PRESET_ID,
      presetStrength: 1,
      advanced: nextAdvanced,
    };
    applySnapshot(next);
    commitSnapshot(next);
    setStatus(`Moved ${name} into the look stack. Choose another filter to layer above it.`);
  }, [imageEl, presetId, advanced, filters, applySnapshot, commitSnapshot]);

  const updateLayer = useCallback((id: string, patch: Partial<{ intensity: number; enabled: boolean }>, commit = false) => {
    setAdvanced((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)),
    }));
    if (commit) window.requestAnimationFrame(() => commitSnapshot(currentSnapshotRef.current));
  }, [commitSnapshot]);

  const removeLayer = useCallback((id: string) => {
    const nextAdvanced = { ...advanced, layers: advanced.layers.filter((layer) => layer.id !== id) };
    const next = { ...currentSnapshotRef.current, advanced: nextAdvanced };
    applySnapshot(next);
    commitSnapshot(next);
  }, [advanced, applySnapshot, commitSnapshot]);

  const loadLutFile = useCallback(async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".cube")) {
      setStatus("Choose a .cube 3D LUT file.");
      return;
    }
    try {
      const parsed = parseCubeLut(await file.text(), file.name.replace(/\.cube$/i, ""));
      setLut(parsed);
      setAdvanced((prev) => ({ ...prev, lutIntensity: 1 }));
      setStatus(`Loaded LUT “${parsed.title}” (${parsed.size}³) locally. No upload required.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not parse that LUT.");
    }
  }, []);

  const saveCustomPreset = useCallback(() => {
    const name = customPresetName.trim() || `My preset ${customPresets.length + 1}`;
    const preset: CustomPhotoPreset = {
      version: 1,
      id: createId("preset"),
      name,
      createdAt: new Date().toISOString(),
      filters: { ...filters },
      advanced: JSON.parse(JSON.stringify(advanced)) as CustomPhotoPreset["advanced"],
    };
    persistCustomPresets([preset, ...customPresets]);
    setCustomPresetName("");
    setStatus(lut ? `Saved ${name}. The imported LUT itself is not embedded in browser presets.` : `Saved ${name} in this browser.`);
  }, [customPresetName, customPresets, filters, advanced, persistCustomPresets, lut]);

  const applyCustomPreset = useCallback((preset: CustomPhotoPreset) => {
    setLut(null);
    const next: EditorSnapshot = {
      ...currentSnapshotRef.current,
      filters: preset.filters,
      presetId: "custom",
      presetStrength: 1,
      advanced: preset.advanced,
    };
    applySnapshot(next);
    commitSnapshot(next);
    setStatus(`Applied custom preset “${preset.name}”.`);
  }, [applySnapshot, commitSnapshot]);

  const deleteCustomPreset = useCallback((id: string) => {
    persistCustomPresets(customPresets.filter((preset) => preset.id !== id));
  }, [customPresets, persistCustomPresets]);

  const exportCurrentPreset = useCallback(() => {
    const name = customPresetName.trim() || "Darma custom look";
    const preset: CustomPhotoPreset = {
      version: 1,
      id: createId("shared-preset"),
      name,
      createdAt: new Date().toISOString(),
      filters: { ...filters },
      advanced: JSON.parse(JSON.stringify(advanced)) as CustomPhotoPreset["advanced"],
    };
    downloadBlob(new Blob([JSON.stringify(preset, null, 2)], { type: "application/json" }), `${name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "darma-preset"}.darma.json`);
    setStatus(lut ? "Exported the Darma preset. Imported .cube LUT data is intentionally kept as a separate file." : "Exported a shareable Darma preset JSON.");
  }, [customPresetName, filters, advanced, lut]);

  const importCustomPreset = useCallback(async (file: File | null | undefined) => {
    if (!file) return;
    if (file.size > MAX_PRESET_BYTES) {
      setStatus("That preset file is unexpectedly large. Darma preset JSON must be under 512 KB.");
      return;
    }
    try {
      const normalized = normalizeCustomPhotoPreset(JSON.parse(await file.text()), createId("preset"));
      if (!normalized) throw new Error("Not a supported Darma photo preset.");
      const imported = { ...normalized, id: createId("preset") };
      persistCustomPresets([imported, ...customPresets]);
      applyCustomPreset(imported);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import that preset.");
    }
  }, [customPresets, persistCustomPresets, applyCustomPreset]);

  const addBatchFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files).filter((file) => file.type.startsWith("image/") && file.size <= MAX_IMAGE_BYTES);
    if (!incoming.length) {
      setStatus("No supported batch images were selected (25 MB max per image).");
      return;
    }
    setBatchItems((prev) => [
      ...prev,
      ...incoming.map((file) => ({ id: createId("batch"), file, status: "ready" as const })),
    ]);
    setBatchProgress({ done: 0, total: 0 });
    setStatus(`Added ${incoming.length} image${incoming.length === 1 ? "" : "s"} to the local batch queue.`);
  }, []);

  const removeBatchItem = useCallback((id: string) => {
    setBatchItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const exportBatch = useCallback(async () => {
    if (!batchItems.length || isBusy) return;
    setIsBusy(true);
    setIsBatchProcessing(true);
    batchCancelRef.current = false;
    setBatchProgress({ done: 0, total: batchItems.length });
    setStatus(`Processing ${batchItems.length} images locally…`);
    const extension = exportFormat === "jpeg" ? "jpg" : exportFormat;
    const mime = EXPORT_MIME[exportFormat];
    const usedNames = new Set<string>();
    let completed = 0;
    let successCount = 0;
    let cancelReason = "";

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const item of batchItems) {
        if (batchCancelRef.current) break;
        setBatchItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, status: "processing", error: undefined } : entry)));
        let objectUrl = "";
        try {
          const loaded = await imageFromFile(item.file);
          objectUrl = loaded.url;
          const natural = getNaturalOutputDimensions(loaded.image.naturalWidth, loaded.image.naturalHeight, crop, orientation);
          const batchBackend = backgroundProgress.backend ?? backgroundModelBackend();
          const itemBackgroundMask = batchSmartBackground
            ? await removeBackgroundLocally(
                objectUrl,
                (progress) => {
                  setStatus(`Batch ${completed + 1}/${batchItems.length} · ${progress.message}${progress.status === "loading" || progress.status === "processing" ? ` · ${Math.round(progress.percent)}%` : ""}`);
                },
                batchBackend,
              )
            : null;
          const canvas = document.createElement("canvas");
          renderPhotoToCanvas(loaded.image, canvas, {
            filters,
            orientation,
            crop,
            advanced,
            lut,
            smart: batchSmartBackground ? { ...smart, backgroundEnabled: true, healStrokes: [] } : undefined,
            backgroundMask: itemBackgroundMask,
            targetWidth: outputMode === "custom" && (!lockAspect || customDimensionDriver === "width")
              ? Math.max(1, Number.parseInt(customWidth, 10) || natural.width)
              : undefined,
            targetHeight: outputMode === "custom" && (!lockAspect || customDimensionDriver === "height")
              ? Math.max(1, Number.parseInt(customHeight, 10) || natural.height)
              : undefined,
            jpegBackground: exportFormat === "jpeg",
          });
          const blob = await canvasBlob(canvas, mime, exportFormat === "png" ? undefined : exportQuality);
          const base = item.file.name.replace(/\.[^.]+$/, "") || "edited-image";
          let outputName = `${base}.${extension}`;
          let suffix = 2;
          while (usedNames.has(outputName.toLowerCase())) outputName = `${base}-${suffix++}.${extension}`;
          usedNames.add(outputName.toLowerCase());
          zip.file(outputName, blob);
          successCount += 1;
          setBatchItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, status: "done", error: undefined } : entry)));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Processing failed.";
          setBatchItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, status: "error", error: message } : entry)));
          if (batchSmartBackground) {
            cancelReason = `Batch background removal stopped on ${item.file.name}: ${message} Try the Smart panel once to choose a working WebGPU or CPU/WASM backend, then retry the batch.`;
            batchCancelRef.current = true;
          }
        } finally {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          completed += 1;
          setBatchProgress({ done: completed, total: batchItems.length });
        }
      }
      if (batchCancelRef.current) {
        setStatus(cancelReason || `Batch canceled after ${completed}/${batchItems.length} images. Nothing was downloaded.`);
        return;
      }
      if (successCount === 0) throw new Error("No images could be exported.");
      const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 4 } });
      downloadBlob(zipBlob, `darma-photo-batch-${new Date().toISOString().slice(0, 10)}.zip`);
      setStatus(`Batch ZIP ready · ${successCount}/${batchItems.length} exported · ${formatBytes(zipBlob.size)} · same local look, no watermark.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Batch export failed.");
    } finally {
      setIsBusy(false);
      setIsBatchProcessing(false);
      batchCancelRef.current = false;
    }
  }, [batchItems, isBusy, exportFormat, exportQuality, crop, orientation, filters, advanced, lut, smart, batchSmartBackground, backgroundProgress.backend, outputMode, customWidth, customHeight, lockAspect, customDimensionDriver]);

  const cancelBatch = useCallback(() => {
    if (!isBatchProcessing) return;
    batchCancelRef.current = true;
    setStatus("Cancel requested. Finishing the current image, then stopping the batch.");
  }, [isBatchProcessing]);

  const updateSmartAndCommit = useCallback((nextSmart: typeof smart, message?: string) => {
    const next = { ...currentSnapshotRef.current, smart: nextSmart };
    applySnapshot(next);
    commitSnapshot(next);
    if (message) setStatus(message);
  }, [applySnapshot, commitSnapshot]);

  const runBackgroundRemoval = useCallback(async (forcedBackend?: "webgpu" | "wasm") => {
    if (!imageEl || !imageSrc || backgroundProgress.status === "loading" || backgroundProgress.status === "processing") return;
    const requestedBackend = forcedBackend ?? backgroundModelBackend();
    setHealMode(false);
    setCompareMode("edited");
    setBackgroundProgress({ status: "loading", percent: 0, message: "Preparing the local model…", backend: requestedBackend });
    setStatus(requestedBackend === "webgpu"
      ? "Preparing local background removal with WebGPU. First use downloads and caches the FP16 model in this browser."
      : "Preparing the CPU/WASM fallback. First use downloads and caches the larger FP32 model in this browser.");
    try {
      const mask = await removeBackgroundLocally(imageSrc, setBackgroundProgress, requestedBackend);
      setBackgroundMask(mask);
      const nextSmart = { ...smart, backgroundEnabled: true };
      updateSmartAndCommit(nextSmart, "Background removed locally. PNG keeps transparency; JPEG uses a white background.");
      if (nextSmart.backgroundFill === "transparent") setExportFormat("png");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Background removal failed.";
      setBackgroundProgress({ status: "error", percent: 0, message, backend: requestedBackend });
      setStatus(`${message} Spot Heal and the rest of the editor still work without the AI model.`);
    }
  }, [imageEl, imageSrc, backgroundProgress.status, smart, updateSmartAndCommit]);

  const setBackgroundEnabled = useCallback((enabled: boolean) => {
    if (!backgroundMask && enabled) return;
    updateSmartAndCommit({ ...smart, backgroundEnabled: enabled }, enabled ? "Background removal enabled." : "Background removal preview disabled; the cached mask is kept.");
  }, [backgroundMask, smart, updateSmartAndCommit]);

  const setBackgroundFill = useCallback((backgroundFill: BackgroundFillMode) => {
    const nextSmart = { ...smart, backgroundFill };
    updateSmartAndCommit(nextSmart, backgroundFill === "transparent" ? "Transparent background selected." : "Background fill updated.");
    if (backgroundFill === "transparent") setExportFormat("png");
  }, [smart, updateSmartAndCommit]);

  const clearBackgroundMask = useCallback(() => {
    setBackgroundMask(null);
    setBackgroundProgress({ status: "idle", percent: 0, message: "Model stays cached by the browser; run it again whenever you need a new mask." });
    updateSmartAndCommit({ ...smart, backgroundEnabled: false }, "Removed the generated background mask from this edit.");
  }, [smart, updateSmartAndCommit]);

  const addHealStroke = useCallback((event: ReactPointerEvent<HTMLCanvasElement>, force = false) => {
    if (!healMode || !editedCanvasRef.current) return;
    const rect = editedCanvasRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    const last = healPointerRef.current;
    const minDistance = Math.max(0.006, (healBrushSize / 100) * 0.45);
    if (!force && last && Math.hypot(x - last.x, y - last.y) < minDistance) return;
    healPointerRef.current = { x, y };
    setSmart((prev) => ({
      ...prev,
      healStrokes: [...prev.healStrokes, { id: createId("heal"), x, y, radius: healBrushSize / 100 }],
    }));
  }, [healMode, healBrushSize]);

  const finishHealStroke = useCallback(() => {
    if (!healPointerRef.current) return;
    healPointerRef.current = null;
    window.requestAnimationFrame(() => commitSnapshot(currentSnapshotRef.current));
  }, [commitSnapshot]);

  const undoLastHeal = useCallback(() => {
    if (!smart.healStrokes.length) return;
    updateSmartAndCommit({ ...smart, healStrokes: smart.healStrokes.slice(0, -1) }, "Removed the last Spot Heal stroke.");
  }, [smart, updateSmartAndCommit]);

  const clearHeals = useCallback(() => {
    if (!smart.healStrokes.length) return;
    updateSmartAndCommit({ ...smart, healStrokes: [] }, "Cleared Spot Heal edits.");
  }, [smart, updateSmartAndCommit]);

  const renderControls = (controls: FilterControl[]) => (
    <div className="space-y-4">
      {controls.map((control) => (
        <SliderControl
          key={control.key}
          control={control}
          value={filters[control.key]}
          disabled={!imageEl}
          onChange={(value) => updateFilter(control.key, value)}
          onEditStart={beginContinuousEdit}
          onEditEnd={finishContinuousEdit}
        />
      ))}
    </div>
  );

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      onPointerDown={(event) => {
        if (!isInteractiveTarget(event.target)) rootRef.current?.focus({ preventScroll: true });
      }}
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)] outline-none"
    >
      {/* Workspace toolbar */}
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-[var(--color-text-primary)]">{imageEl ? fileName : "Photo workspace"}</p>
            <p className="truncate text-xs text-[var(--color-text-tertiary)]">
              {imageEl ? `${imageEl.naturalWidth}×${imageEl.naturalHeight} · ${presetId === "custom" ? "Custom edit" : getFilterPreset(presetId)?.name ?? "Original"}` : "No signup · No upload · No watermark"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button size="icon" variant="ghost" leftIcon={<Undo2 className="h-4 w-4" />} disabled={!imageEl || historyIndex <= 0} onClick={undo} title="Undo">
            Undo
          </Button>
          <Button size="icon" variant="ghost" leftIcon={<Redo2 className="h-4 w-4" />} disabled={!imageEl || historyIndex >= history.length - 1} onClick={redo} title="Redo">
            Redo
          </Button>
          <div className="hidden h-6 w-px bg-[var(--color-border-subtle)] sm:block" />
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Eye className="h-4 w-4" />}
            disabled={!imageEl}
            title="Hold to preview the original · shortcut O"
            onPointerDown={(event) => {
              if (!imageEl) return;
              event.preventDefault();
              compareHoldRestoreRef.current = compareMode;
              setCompareMode("original");
            }}
            onPointerUp={() => {
              if (compareHoldRestoreRef.current === null) return;
              const restore = compareHoldRestoreRef.current;
              compareHoldRestoreRef.current = null;
              setCompareMode(restore);
            }}
            onPointerLeave={() => {
              if (compareHoldRestoreRef.current === null) return;
              const restore = compareHoldRestoreRef.current;
              compareHoldRestoreRef.current = null;
              setCompareMode(restore);
            }}
            onClick={(event) => {
              if (event.detail === 0) setCompareMode((mode) => (mode === "split" ? "edited" : "split"));
            }}
          >
            Hold original
          </Button>
          <Button
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            disabled={!imageEl}
            onClick={() => setActivePanel("export")}
          >
            Export
          </Button>
        </div>
      </div>

      <div className="grid min-w-0 lg:grid-cols-[72px_minmax(0,1fr)_336px]">
        {/* Tool rail */}
        <nav
          aria-label="Photo editor tools"
          className="order-2 flex overflow-x-auto border-y border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-2 lg:order-none lg:flex-col lg:overflow-x-visible lg:border-b-0 lg:border-l-0 lg:border-r lg:border-t-0 lg:p-1"
        >
          {PANEL_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activePanel === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setActivePanel(item.id)}
                className={cn(
                  "flex min-h-14 min-w-[68px] flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-2 text-xs font-bold transition lg:w-full lg:min-w-0 lg:px-1",
                  active
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-tertiary)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Canvas workspace */}
        <section className="order-1 min-w-0 bg-[var(--color-surface-subtle)]/55 lg:order-none">
          <div
            ref={workspaceRef}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragOver(false);
              loadFile(event.dataTransfer.files?.[0]);
            }}
            className={cn(
              "relative flex h-[330px] items-center justify-center overflow-auto p-4 sm:h-[480px] sm:p-6 lg:h-[600px] xl:h-[680px]",
              isDragOver && "ring-2 ring-inset ring-[var(--color-primary)]",
            )}
          >
            {imageEl ? (
              <div className="flex min-h-full min-w-full items-center justify-center">
                <div
                  className="relative shrink-0"
                  style={{
                    width: `${Math.max(1, fittedPreview.width * (zoom / 100))}px`,
                    height: `${Math.max(1, fittedPreview.height * (zoom / 100))}px`,
                  }}
                >
                  <div
                    className="absolute left-0 top-0 inline-grid origin-top-left transition-transform duration-150 [grid-template-areas:'canvas']"
                    style={{
                      width: `${fittedPreview.width}px`,
                      height: `${fittedPreview.height}px`,
                      transform: `scale(${zoom / 100})`,
                    }}
                  >
                  <canvas
                    ref={editedCanvasRef}
                    className={cn(
                      "[grid-area:canvas] block h-full w-full rounded-[var(--radius-sm)] shadow-[var(--shadow-lg)]",
                      healMode && "cursor-crosshair touch-none",
                    )}
                    aria-label={healMode ? "Edited photo preview. Spot Heal brush active." : "Edited photo preview"}
                    onPointerDown={(event) => {
                      if (!healMode) return;
                      event.preventDefault();
                      event.currentTarget.setPointerCapture(event.pointerId);
                      healPointerRef.current = null;
                      addHealStroke(event, true);
                    }}
                    onPointerMove={(event) => {
                      if (!healMode || !healPointerRef.current || event.buttons === 0) return;
                      event.preventDefault();
                      addHealStroke(event);
                    }}
                    onPointerUp={(event) => {
                      if (!healMode) return;
                      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                      finishHealStroke();
                    }}
                    onPointerCancel={finishHealStroke}
                  />
                  <canvas
                    ref={originalCanvasRef}
                    className="pointer-events-none [grid-area:canvas] block h-full w-full rounded-[var(--radius-sm)]"
                    style={{
                      opacity: compareMode === "edited" ? 0 : 1,
                      clipPath: compareMode === "split" ? `inset(0 ${100 - splitPosition}% 0 0)` : undefined,
                    }}
                    aria-hidden
                  />
                  {compareMode === "split" ? (
                    <div
                      className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white shadow-[0_0_0_1px_rgba(0,0,0,.25)]"
                      style={{ left: `${splitPosition}%` }}
                      aria-hidden
                    />
                  ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-lg rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-base)] p-7 text-center shadow-[var(--shadow-sm)] sm:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-black text-[var(--color-text-primary)]">Drop a photo and start editing</h3>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[var(--color-text-secondary)]">
                  Drag &amp; drop, paste from your clipboard, or choose an image. Editing happens entirely in this browser.
                </p>
                <Button className="mt-5" onClick={() => fileInputRef.current?.click()} leftIcon={<Upload className="h-4 w-4" />}>
                  Choose image
                </Button>
                <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-bold text-[var(--color-text-tertiary)]">
                  <span className="rounded-[var(--radius-full)] bg-[var(--color-surface-subtle)] px-2.5 py-1">No signup</span>
                  <span className="rounded-[var(--radius-full)] bg-[var(--color-surface-subtle)] px-2.5 py-1">No watermark</span>
                  <span className="inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-[var(--color-surface-subtle)] px-2.5 py-1">
                    <ShieldCheck className="h-3 w-3" /> Private &amp; local
                  </span>
                </div>
                <div className="mx-auto mt-5 grid max-w-md grid-cols-4 gap-2 border-t border-[var(--color-border-subtle)] pt-4 text-xs font-bold text-[var(--color-text-tertiary)]">
                  {[["1", "Upload"], ["2", "Choose look"], ["3", "Fine-tune"], ["4", "Export"]].map(([step, label]) => (
                    <div key={step} className="flex flex-col items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] font-mono text-[var(--color-text-secondary)]">{step}</span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isBusy ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--color-surface-base)]/72 text-sm font-bold backdrop-blur-sm">
                Working locally…
              </div>
            ) : null}
          </div>

          {/* Preview footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-2.5 sm:px-4">
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" leftIcon={<ZoomOut className="h-4 w-4" />} disabled={!imageEl || zoom <= 25} onClick={() => setZoom((value) => Math.max(25, value - 25))} title="Zoom out">
                Zoom out
              </Button>
              <button
                type="button"
                disabled={!imageEl}
                onClick={() => setZoom(100)}
                className="min-w-14 rounded-[var(--radius-sm)] px-2 py-1 font-mono text-xs font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)] disabled:opacity-45"
              >
                {zoom}%
              </button>
              <Button size="icon" variant="ghost" leftIcon={<ZoomIn className="h-4 w-4" />} disabled={!imageEl || zoom >= 200} onClick={() => setZoom((value) => Math.min(200, value + 25))} title="Zoom in">
                Zoom in
              </Button>
              <Button size="icon" variant="ghost" leftIcon={<Maximize2 className="h-4 w-4" />} disabled={!imageEl} onClick={() => setZoom(100)} title="Fit preview">
                Fit preview
              </Button>
              {imageEl && isPreviewDraft ? (
                <span className="ml-1 hidden rounded-[var(--radius-full)] bg-[var(--color-primary-soft)] px-2 py-1 text-xs font-bold text-[var(--color-primary)] sm:inline">Fast preview</span>
              ) : null}
            </div>

            {imageEl ? (
              <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                {compareMode === "split" ? (
                  <div className="hidden min-w-[130px] max-w-[220px] flex-1 items-center gap-2 sm:flex">
                    <span className="text-xs font-bold text-[var(--color-text-tertiary)]">Before</span>
                    <Slider min={5} max={95} step={1} value={splitPosition} aria-label="Before and after split" onChange={(event) => setSplitPosition(Number(event.target.value))} />
                    <span className="text-xs font-bold text-[var(--color-text-tertiary)]">After</span>
                  </div>
                ) : null}
                <SegmentedControl options={COMPARE_OPTIONS} value={compareMode} onChange={(mode) => setCompareMode(mode)} ariaLabel="Preview comparison" size="sm" />
              </div>
            ) : (
              <span className="text-xs text-[var(--color-text-tertiary)]">Paste an image with Ctrl/Cmd + V</span>
            )}
          </div>
        </section>

        {/* Context panel */}
        <aside className="order-3 min-w-0 border-t border-[var(--color-border-default)] bg-[var(--color-surface-base)] lg:order-none lg:border-l lg:border-t-0">
          {/* Height tracks the canvas at each breakpoint so the panel scrolls on
              its own and the preview stays put while editing. */}
          <div className="max-h-[58vh] space-y-4 overflow-y-auto p-3.5 sm:max-h-[62vh] sm:p-4 lg:max-h-[600px] xl:max-h-[680px]">
            {activePanel === "filters" ? (
              <>
                <PanelTitle title="Filters" description="Start with a visual preset, then adjust its intensity or fine-tune every value." />
                <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
                  {PRESET_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setPresetCategory(category.id)}
                      className={cn(
                        "shrink-0 rounded-[var(--radius-full)] border px-2.5 py-1.5 text-xs font-bold transition",
                        presetCategory === category.id
                          ? "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                          : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)]",
                      )}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {visiblePresets.map((preset) => {
                    const active = presetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={!imageEl}
                        onClick={() => applyPreset(preset.id)}
                        className={cn(
                          "group overflow-hidden rounded-[var(--radius-md)] border text-left transition disabled:cursor-not-allowed disabled:opacity-45",
                          active ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]" : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]",
                        )}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-surface-subtle)]">
                          {imageSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageSrc}
                              alt=""
                              className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                              style={{ filter: buildFilterString(preset.filters) }}
                            />
                          ) : (
                            <div className="h-full w-full bg-[linear-gradient(135deg,var(--color-surface-subtle),var(--color-control-track))]" />
                          )}
                          {active ? <span className="absolute right-1.5 top-1.5 rounded-[var(--radius-full)] bg-black/70 px-1.5 py-0.5 text-xs font-bold text-white">Active</span> : null}
                        </div>
                        <div className="p-2">
                          <div className="text-xs font-bold text-[var(--color-text-primary)]">{preset.name}</div>
                          <div className="mt-0.5 line-clamp-1 text-xs text-[var(--color-text-tertiary)]">{preset.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {presetId !== "custom" && imageEl ? (
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/55 p-3">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[var(--color-text-secondary)]">
                      <span>Filter intensity</span>
                      <span className="font-mono text-xs font-bold tabular-nums text-[var(--color-text-tertiary)]">{Math.round(presetStrength * 100)}%</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={presetStrength * 100}
                      onPointerDown={beginContinuousEdit}
                      onPointerUp={finishContinuousEdit}
                      onPointerCancel={finishContinuousEdit}
                      onBlur={finishContinuousEdit}
                      onKeyDown={beginContinuousEdit}
                      onKeyUp={finishContinuousEdit}
                      onChange={(event) => updatePresetStrength(Number(event.target.value))}
                    />
                  </div>
                ) : null}
              </>
            ) : null}

            {activePanel === "adjust" ? (
              <>
                <PanelTitle title="Adjust" description="Control light and color without sending your photo to a server." />
                <section className="space-y-3">
                  <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Light</div>
                  {renderControls(lightControls)}
                </section>
                <div className="border-t border-[var(--color-border-subtle)]" />
                <section className="space-y-3">
                  <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Color</div>
                  {renderControls(colorControls)}
                </section>
              </>
            ) : null}

            {activePanel === "effects" ? (
              <>
                <PanelTitle title="Effects" description="Add film character, monochrome treatments, local overlays, blur, grain, fade, and vignette." />
                {renderControls(effectControls)}
                <div className="border-t border-[var(--color-border-subtle)] pt-3">
                  <div className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Creative overlay</div>
                  <div className="grid grid-cols-2 gap-2">
                    {OVERLAY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        disabled={!imageEl}
                        onClick={() => setOverlay(option.value)}
                        className={cn(
                          "rounded-[var(--radius-md)] border px-2.5 py-2 text-xs font-bold transition disabled:opacity-45",
                          advanced.overlay.type === option.value
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                            : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)]",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {advanced.overlay.type !== "none" ? (
                    <label className="mt-3 block space-y-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                      <span className="flex justify-between"><span>Overlay intensity</span><span className="font-mono text-xs text-[var(--color-text-tertiary)]">{Math.round(advanced.overlay.intensity * 100)}%</span></span>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={advanced.overlay.intensity * 100}
                        onPointerDown={beginContinuousEdit}
                        onPointerUp={finishContinuousEdit}
                        onPointerCancel={finishContinuousEdit}
                        onBlur={finishContinuousEdit}
                        onChange={(event) => setAdvanced((prev) => ({ ...prev, overlay: { ...prev.overlay, intensity: Number(event.target.value) / 100 } }))}
                      />
                    </label>
                  ) : null}
                </div>
                <Button fullWidth variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" />} disabled={!imageEl} onClick={resetAll}>
                  Reset all edits
                </Button>
              </>
            ) : null}

            {activePanel === "advanced" ? (
              <>
                <PanelTitle title="Advanced color & looks" description="Pro-style controls that still run locally: selective HSL, tone curves, 3D LUTs, stackable looks, and shareable presets." />

                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Selective HSL</div>
                    <button type="button" disabled={!imageEl} onClick={resetAdvancedColor} className="text-xs font-bold text-[var(--color-primary)] disabled:opacity-45">Reset color</button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {HSL_BANDS.map((band) => (
                      <button
                        key={band.id}
                        type="button"
                        disabled={!imageEl}
                        onClick={() => setActiveHslBand(band.id)}
                        className={cn(
                          "rounded-[var(--radius-sm)] border px-1 py-1.5 text-xs font-bold transition disabled:opacity-45",
                          activeHslBand === band.id
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                            : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)]",
                        )}
                      >
                        {band.label}
                      </button>
                    ))}
                  </div>
                  {([
                    ["hue", "Hue", -60, 60],
                    ["saturation", "Saturation", -100, 100],
                    ["lightness", "Lightness", -100, 100],
                  ] as const).map(([key, label, min, max]) => (
                    <label key={key} className="block space-y-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                      <span className="flex justify-between"><span>{label}</span><span className="font-mono text-xs text-[var(--color-text-tertiary)]">{advanced.hsl[activeHslBand][key] > 0 ? "+" : ""}{advanced.hsl[activeHslBand][key]}</span></span>
                      <Slider
                        min={min}
                        max={max}
                        step={1}
                        value={advanced.hsl[activeHslBand][key]}
                        disabled={!imageEl}
                        onPointerDown={beginContinuousEdit}
                        onPointerUp={finishContinuousEdit}
                        onPointerCancel={finishContinuousEdit}
                        onBlur={finishContinuousEdit}
                        onKeyDown={beginContinuousEdit}
                        onKeyUp={finishContinuousEdit}
                        onChange={(event) => updateHslBand(activeHslBand, key, Number(event.target.value))}
                      />
                    </label>
                  ))}
                </section>

                <div className="border-t border-[var(--color-border-subtle)]" />
                <section className="space-y-3">
                  <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Tone curves</div>
                  <div className="flex gap-1.5">
                    {CURVE_CHANNELS.map((channel) => (
                      <button
                        key={channel.id}
                        type="button"
                        disabled={!imageEl}
                        onClick={() => setActiveCurveChannel(channel.id)}
                        className={cn(
                          "flex-1 rounded-[var(--radius-sm)] border px-2 py-1.5 text-xs font-black transition disabled:opacity-45",
                          activeCurveChannel === channel.id
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                            : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]",
                        )}
                      >
                        {channel.label}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-2">
                    <svg viewBox="0 0 255 255" className="aspect-square w-full" role="img" aria-label={`${activeCurveChannel.toUpperCase()} tone curve`}>
                      <path d="M0 255 L255 0" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />
                      <polyline
                        points={advanced.curves[activeCurveChannel].map((value, index) => `${[0, 64, 128, 192, 255][index]},${255 - value}`).join(" ")}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[var(--color-primary)]"
                      />
                    </svg>
                  </div>
                  {([1, 2, 3] as const).map((point, index) => (
                    <label key={point} className="block space-y-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                      <span className="flex justify-between"><span>{["Shadows", "Midtones", "Highlights"][index]}</span><span className="font-mono text-xs text-[var(--color-text-tertiary)]">{advanced.curves[activeCurveChannel][point]}</span></span>
                      <Slider
                        min={0}
                        max={255}
                        step={1}
                        value={advanced.curves[activeCurveChannel][point]}
                        disabled={!imageEl}
                        onPointerDown={beginContinuousEdit}
                        onPointerUp={finishContinuousEdit}
                        onPointerCancel={finishContinuousEdit}
                        onBlur={finishContinuousEdit}
                        onKeyDown={beginContinuousEdit}
                        onKeyUp={finishContinuousEdit}
                        onChange={(event) => updateCurvePoint(activeCurveChannel, point, Number(event.target.value))}
                      />
                    </label>
                  ))}
                </section>

                <div className="border-t border-[var(--color-border-subtle)]" />
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">3D LUT (.cube)</div>
                      <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">Import professional color looks without an account or paid LUT gate.</div>
                    </div>
                    <Button size="sm" variant="secondary" leftIcon={<Upload className="h-3.5 w-3.5" />} onClick={() => lutInputRef.current?.click()}>Import</Button>
                  </div>
                  {lut ? (
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0"><div className="truncate text-xs font-black text-[var(--color-text-primary)]">{lut.title}</div><div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{lut.size}×{lut.size}×{lut.size} · local .cube</div></div>
                        <button type="button" onClick={() => setLut(null)} className="text-xs font-bold text-[var(--color-primary)]">Remove</button>
                      </div>
                      <label className="mt-3 block space-y-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                        <span className="flex justify-between"><span>LUT intensity</span><span className="font-mono text-xs">{Math.round(advanced.lutIntensity * 100)}%</span></span>
                        <Slider min={0} max={100} step={1} value={advanced.lutIntensity * 100} onPointerDown={beginContinuousEdit} onPointerUp={finishContinuousEdit} onPointerCancel={finishContinuousEdit} onBlur={finishContinuousEdit} onKeyDown={beginContinuousEdit} onKeyUp={finishContinuousEdit} onChange={(event) => setAdvanced((prev) => ({ ...prev, lutIntensity: Number(event.target.value) / 100 }))} />
                      </label>
                    </div>
                  ) : (
                    <button type="button" onClick={() => lutInputRef.current?.click()} className="w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] p-4 text-center text-xs font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)]">Drop-in support for standard 3D `.cube` LUTs</button>
                  )}
                </section>

                <div className="border-t border-[var(--color-border-subtle)]" />
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div><div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Look stack</div><div className="mt-1 text-xs text-[var(--color-text-tertiary)]">Layer multiple filter looks non-destructively.</div></div>
                    <Button size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" />} disabled={!imageEl} onClick={addCurrentLookLayer}>Add look</Button>
                  </div>
                  {advanced.layers.length ? advanced.layers.map((layer) => (
                    <div key={layer.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={layer.enabled} onChange={(event) => updateLayer(layer.id, { enabled: event.target.checked }, true)} className="accent-[var(--color-primary)]" />
                        <Layers className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                        <span className="min-w-0 flex-1 truncate text-xs font-bold text-[var(--color-text-primary)]">{layer.name}</span>
                        <button type="button" onClick={() => removeLayer(layer.id)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)]" title="Remove layer"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                      <Slider className="mt-2" min={0} max={100} step={1} value={layer.intensity * 100} onChange={(event) => updateLayer(layer.id, { intensity: Number(event.target.value) / 100 })} onPointerUp={() => updateLayer(layer.id, {}, true)} />
                    </div>
                  )) : <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] px-3 py-3 text-xs text-[var(--color-text-tertiary)]">No stacked looks yet. Add the current look, choose another filter, then stack again.</div>}
                </section>

                <div className="border-t border-[var(--color-border-subtle)]" />
                <section className="space-y-3">
                  <div><div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">My presets</div><div className="mt-1 text-xs text-[var(--color-text-tertiary)]">Save locally or export a small `.darma.json` file to share the look.</div></div>
                  <div className="flex gap-2"><Input placeholder="Preset name" value={customPresetName} onChange={(event) => setCustomPresetName(event.target.value)} /><Button size="sm" leftIcon={<Save className="h-3.5 w-3.5" />} disabled={!imageEl} onClick={saveCustomPreset}>Save</Button></div>
                  <div className="grid grid-cols-2 gap-2"><Button size="sm" variant="secondary" disabled={!imageEl} onClick={exportCurrentPreset}>Export preset</Button><Button size="sm" variant="secondary" onClick={() => presetImportRef.current?.click()}>Import preset</Button></div>
                  {customPresets.slice(0, 8).map((preset) => (
                    <div key={preset.id} className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-2.5">
                      <button type="button" onClick={() => applyCustomPreset(preset)} className="min-w-0 flex-1 text-left"><div className="truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.name}</div><div className="text-xs text-[var(--color-text-tertiary)]">Saved in this browser</div></button>
                      <button type="button" onClick={() => deleteCustomPreset(preset.id)} title="Delete preset" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)]"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </section>
              </>
            ) : null}

            {activePanel === "smart" ? (
              <>
                <PanelTitle
                  title="Smart tools"
                  description="Private, on-device helpers for background removal and small-object cleanup. Your photo is processed in this browser."
                />

                <section className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                        <WandSparkles className="h-3.5 w-3.5" /> Background removal
                      </div>
                      <p className="mt-1 text-xs leading-4 text-[var(--color-text-tertiary)]">
                        BiRefNet Lite runs locally with Transformers.js. The model downloads only when you click the button; your image is never uploaded.
                      </p>
                    </div>
                    {backgroundMask ? (
                      <span className="shrink-0 rounded-[var(--radius-full)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-2 py-1 text-xs font-black text-[var(--color-success-text)]">MASK READY</span>
                    ) : null}
                  </div>

                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/60 p-3">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                      <div className="text-xs leading-4 text-[var(--color-text-secondary)]">
                        <strong className="text-[var(--color-text-primary)]">On-demand, no credits.</strong>{" "}
                        {backgroundModelBackend() === "webgpu"
                          ? "This browser can use WebGPU with the ~115 MB FP16 model."
                          : "WebGPU is unavailable, so background removal uses the heavier ~224 MB CPU/WASM model."}
                        {" "}After the first download, browser caching can make later uses faster.
                      </div>
                    </div>
                  </div>

                  <Button
                    fullWidth
                    leftIcon={<Eraser className="h-4 w-4" />}
                    disabled={!imageEl || backgroundProgress.status === "loading" || backgroundProgress.status === "processing"}
                    onClick={() => void runBackgroundRemoval()}
                  >
                    {backgroundProgress.status === "loading" || backgroundProgress.status === "processing"
                      ? "Removing background…"
                      : backgroundMask
                        ? "Refresh background mask"
                        : "Remove background locally"}
                  </Button>

                  {backgroundProgress.status !== "idle" ? (
                    <div className={cn(
                      "rounded-[var(--radius-md)] border p-3",
                      backgroundProgress.status === "error"
                        ? "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]"
                        : "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/55",
                    )}>
                      <div className="flex items-center justify-between gap-2 text-xs font-bold">
                        <span className="text-[var(--color-text-secondary)]">{backgroundProgress.message}</span>
                        <span className="shrink-0 font-mono text-[var(--color-text-tertiary)]">
                          {backgroundProgress.backend ? backgroundProgress.backend.toUpperCase() : "LOCAL"}
                          {backgroundProgress.status !== "error" ? ` · ${Math.round(backgroundProgress.percent)}%` : ""}
                        </span>
                      </div>
                      {backgroundProgress.status === "loading" || backgroundProgress.status === "processing" ? (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-border-subtle)]">
                          <div
                            className="h-full rounded-[var(--radius-full)] bg-[var(--color-primary)] transition-[width] duration-300"
                            style={{ width: `${Math.max(2, backgroundProgress.percent)}%` }}
                          />
                        </div>
                      ) : null}
                      {backgroundProgress.status === "error" && backgroundProgress.backend === "webgpu" ? (
                        <Button className="mt-2" size="sm" variant="secondary" onClick={() => void runBackgroundRemoval("wasm")}>
                          Retry with CPU / WASM
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {backgroundMask ? (
                    <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-black text-[var(--color-text-primary)]">Background mask</div>
                          <div className="text-xs text-[var(--color-text-tertiary)]">Keep the mask and toggle it without rerunning the model.</div>
                        </div>
                        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
                          <input
                            type="checkbox"
                            checked={smart.backgroundEnabled}
                            onChange={(event) => setBackgroundEnabled(event.target.checked)}
                            className="accent-[var(--color-primary)]"
                          />
                          Enabled
                        </label>
                      </div>

                      <div>
                        <div className="mb-1.5 text-xs font-bold text-[var(--color-text-secondary)]">Background</div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {([
                            ["transparent", "Transparent"],
                            ["white", "White"],
                            ["color", "Color"],
                          ] as const).map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setBackgroundFill(value)}
                              className={cn(
                                "rounded-[var(--radius-sm)] border px-2 py-1.5 text-xs font-black transition",
                                smart.backgroundFill === value
                                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                                  : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)]",
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {smart.backgroundFill === "color" ? (
                        <label className="flex items-center justify-between gap-3 text-xs font-bold text-[var(--color-text-secondary)]">
                          Fill color
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[var(--color-text-tertiary)]">{smart.backgroundColor.toUpperCase()}</span>
                            <input
                              type="color"
                              value={smart.backgroundColor}
                              onPointerDown={beginContinuousEdit}
                              onPointerUp={finishContinuousEdit}
                              onPointerCancel={finishContinuousEdit}
                              onBlur={finishContinuousEdit}
                              onChange={(event) => setSmart((prev) => ({ ...prev, backgroundColor: event.target.value }))}
                              className="h-8 w-10 cursor-pointer rounded border border-[var(--color-border-subtle)] bg-transparent p-0.5"
                              aria-label="Background fill color"
                            />
                          </span>
                        </label>
                      ) : null}

                      <label className="block space-y-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                        <span className="flex justify-between"><span>Edge feather</span><span className="font-mono text-xs text-[var(--color-text-tertiary)]">{smart.maskFeather.toFixed(1)}px</span></span>
                        <Slider
                          min={0}
                          max={12}
                          step={0.5}
                          value={smart.maskFeather}
                          onPointerDown={beginContinuousEdit}
                          onPointerUp={finishContinuousEdit}
                          onPointerCancel={finishContinuousEdit}
                          onBlur={finishContinuousEdit}
                          onKeyDown={beginContinuousEdit}
                          onKeyUp={finishContinuousEdit}
                          onChange={(event) => setSmart((prev) => ({ ...prev, maskFeather: Number(event.target.value) }))}
                        />
                      </label>

                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setBackgroundEnabled(!smart.backgroundEnabled)}>{smart.backgroundEnabled ? "Preview original background" : "Use mask"}</Button>
                        <Button size="sm" variant="ghost" onClick={clearBackgroundMask}>Clear mask</Button>
                      </div>
                      <p className="text-xs leading-4 text-[var(--color-text-tertiary)]">Transparent output automatically switches export to PNG. JPEG always gets a white matte instead of black transparency.</p>
                    </div>
                  ) : null}
                </section>

                <div className="border-t border-[var(--color-border-subtle)]" />

                <section className="space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]"><Eraser className="h-3.5 w-3.5" /> Spot Heal</div>
                    <p className="mt-1 text-xs leading-4 text-[var(--color-text-tertiary)]">Paint over dust, skin blemishes, scratches, or small distractions. Darma samples a nearby matching patch locally—this is intentionally not generative fill.</p>
                  </div>

                  <Button
                    fullWidth
                    variant={healMode ? "primary" : "secondary"}
                    leftIcon={<Eraser className="h-4 w-4" />}
                    disabled={!imageEl}
                    onClick={() => {
                      setHealMode((enabled) => !enabled);
                      setCompareMode("edited");
                      setStatus(healMode ? "Spot Heal brush disabled." : "Spot Heal active — paint or click directly on the edited preview.");
                    }}
                  >
                    {healMode ? "Finish Spot Heal" : "Paint on preview"}
                  </Button>

                  <label className="block space-y-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                    <span className="flex justify-between"><span>Brush size</span><span className="font-mono text-xs text-[var(--color-text-tertiary)]">{healBrushSize}%</span></span>
                    <Slider min={1} max={10} step={1} value={healBrushSize} disabled={!imageEl} onChange={(event) => setHealBrushSize(Number(event.target.value))} />
                  </label>

                  <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] px-3 py-2.5">
                    <div>
                      <div className="text-xs font-black text-[var(--color-text-primary)]">{smart.healStrokes.length} heal stamp{smart.healStrokes.length === 1 ? "" : "s"}</div>
                      <div className="text-xs text-[var(--color-text-tertiary)]">Undo stays integrated with the editor history.</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" disabled={!smart.healStrokes.length} onClick={undoLastHeal}>Undo heal</Button>
                      <Button size="sm" variant="ghost" disabled={!smart.healStrokes.length} onClick={clearHeals}>Clear</Button>
                    </div>
                  </div>

                  {healMode ? (
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-3 text-xs font-bold leading-4 text-[var(--color-primary)]">
                      Brush mode is active. Click or drag over a small object in the center preview. Use several small strokes for cleaner results than one oversized stroke.
                    </div>
                  ) : null}
                </section>
              </>
            ) : null}

            {activePanel === "crop" ? (
              <>
                <PanelTitle title="Crop & orientation" description="Choose a common aspect ratio, reposition the crop, rotate, or flip the image." />
                <div className="grid grid-cols-4 gap-2">
                  {CROP_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      disabled={!imageEl}
                      onClick={() => setCropRatio(ratio.id)}
                      className={cn(
                        "rounded-[var(--radius-md)] border p-2 text-center transition disabled:opacity-45",
                        crop.ratioId === ratio.id
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                          : "border-[var(--color-border-subtle)] hover:bg-[var(--color-control-hover)]",
                      )}
                    >
                      <div className="text-xs font-black">{ratio.label}</div>
                      <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{ratio.hint}</div>
                    </button>
                  ))}
                </div>

                {crop.ratioId === "free" ? (
                  <div className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/55 p-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      Width <span className="float-right font-mono text-xs text-[var(--color-text-tertiary)]">{Math.round(crop.width * 100)}%</span>
                      <Slider
                        className="mt-1"
                        min={10}
                        max={100}
                        step={1}
                        value={crop.width * 100}
                        onPointerDown={beginContinuousEdit}
                        onPointerUp={finishContinuousEdit}
                        onPointerCancel={finishContinuousEdit}
                        onBlur={finishContinuousEdit}
                        onChange={(event) => updateCrop({ width: Number(event.target.value) / 100 })}
                      />
                    </label>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      Height <span className="float-right font-mono text-xs text-[var(--color-text-tertiary)]">{Math.round(crop.height * 100)}%</span>
                      <Slider
                        className="mt-1"
                        min={10}
                        max={100}
                        step={1}
                        value={crop.height * 100}
                        onPointerDown={beginContinuousEdit}
                        onPointerUp={finishContinuousEdit}
                        onPointerCancel={finishContinuousEdit}
                        onBlur={finishContinuousEdit}
                        onChange={(event) => updateCrop({ height: Number(event.target.value) / 100 })}
                      />
                    </label>
                  </div>
                ) : null}

                {crop.ratioId !== "original" ? (
                  <div className="space-y-4">
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)]">
                      Horizontal position <span className="float-right font-mono text-xs text-[var(--color-text-tertiary)]">{Math.round(crop.positionX * 100)}%</span>
                      <Slider
                        className="mt-1"
                        min={0}
                        max={100}
                        step={1}
                        value={crop.positionX * 100}
                        onPointerDown={beginContinuousEdit}
                        onPointerUp={finishContinuousEdit}
                        onPointerCancel={finishContinuousEdit}
                        onBlur={finishContinuousEdit}
                        onChange={(event) => updateCrop({ positionX: Number(event.target.value) / 100 })}
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)]">
                      Vertical position <span className="float-right font-mono text-xs text-[var(--color-text-tertiary)]">{Math.round(crop.positionY * 100)}%</span>
                      <Slider
                        className="mt-1"
                        min={0}
                        max={100}
                        step={1}
                        value={crop.positionY * 100}
                        onPointerDown={beginContinuousEdit}
                        onPointerUp={finishContinuousEdit}
                        onPointerCancel={finishContinuousEdit}
                        onBlur={finishContinuousEdit}
                        onChange={(event) => updateCrop({ positionY: Number(event.target.value) / 100 })}
                      />
                    </label>
                  </div>
                ) : null}

                <div className="grid grid-cols-4 gap-2">
                  <Button size="icon" variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" />} disabled={!imageEl} onClick={() => updateOrientationAndCommit({ ...orientation, rotate: (((orientation.rotate - 90) % 360 + 360) % 360) as Orientation["rotate"] })} title="Rotate left">
                    Rotate left
                  </Button>
                  <Button size="icon" variant="secondary" leftIcon={<RotateCw className="h-4 w-4" />} disabled={!imageEl} onClick={() => updateOrientationAndCommit({ ...orientation, rotate: ((orientation.rotate + 90) % 360) as Orientation["rotate"] })} title="Rotate right">
                    Rotate right
                  </Button>
                  <Button size="icon" variant={orientation.flipH ? "soft" : "secondary"} leftIcon={<FlipHorizontal2 className="h-4 w-4" />} disabled={!imageEl} onClick={() => updateOrientationAndCommit({ ...orientation, flipH: !orientation.flipH })} title="Flip horizontal">
                    Flip horizontal
                  </Button>
                  <Button size="icon" variant={orientation.flipV ? "soft" : "secondary"} leftIcon={<FlipVertical2 className="h-4 w-4" />} disabled={!imageEl} onClick={() => updateOrientationAndCommit({ ...orientation, flipV: !orientation.flipV })} title="Flip vertical">
                    Flip vertical
                  </Button>
                </div>

                {imageEl ? (
                  <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs text-[var(--color-text-tertiary)]">
                    Current crop output: <strong className="text-[var(--color-text-secondary)]">{naturalOutput.width}×{naturalOutput.height}</strong>
                  </div>
                ) : null}
              </>
            ) : null}

            {activePanel === "batch" ? (
              <>
                <PanelTitle title="Batch editor" description="Apply the current crop, filters, HSL, curves, LUT, overlays, and export settings to many images, then download one ZIP." />
                <div className="rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                  <div className="font-black text-[var(--color-primary)]">Free batch workflow</div>
                  No signup, per-image credits, watermark, or server upload. Processing is sequential to reduce browser memory pressure.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => batchInputRef.current?.click()}>Add images</Button>
                  <Button variant="ghost" disabled={!batchItems.length || isBusy} onClick={() => { setBatchItems([]); setBatchProgress({ done: 0, total: 0 }); }}>Clear queue</Button>
                </div>

                {batchItems.length ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text-tertiary)]"><span>{batchItems.length} image{batchItems.length === 1 ? "" : "s"}</span><span>{exportFormat.toUpperCase()} · {outputMode === "original" ? "per-image size" : `${customWidth || "auto"}×${customHeight || "auto"}`}</span></div>
                    <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                      {batchItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-2.5 py-2">
                          <div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-[var(--color-text-primary)]">{item.file.name}</div><div className={cn("text-xs", item.status === "error" ? "text-[var(--color-danger)]" : "text-[var(--color-text-tertiary)]")}>{item.status === "ready" ? formatBytes(item.file.size) : item.status === "processing" ? "Processing…" : item.status === "done" ? "Ready in ZIP" : item.error || "Failed"}</div></div>
                          {!isBusy ? <button type="button" onClick={() => removeBatchItem(item.id)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)]" title="Remove"><Trash2 className="h-3.5 w-3.5" /></button> : null}
                        </div>
                      ))}
                    </div>
                    {batchProgress.total > 0 ? (
                      <div className="space-y-1"><div className="flex justify-between text-xs font-bold text-[var(--color-text-tertiary)]"><span>Progress</span><span>{batchProgress.done}/{batchProgress.total}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-control-track)]"><div className="h-full bg-[var(--color-primary)] transition-[width]" style={{ width: `${(batchProgress.done / batchProgress.total) * 100}%` }} /></div></div>
                    ) : null}
                  </div>
                ) : (
                  <button type="button" onClick={() => batchInputRef.current?.click()} className="w-full rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] p-6 text-center hover:bg-[var(--color-control-hover)]"><Files className="mx-auto h-5 w-5 text-[var(--color-primary)]" /><div className="mt-2 text-xs font-black text-[var(--color-text-primary)]">Choose multiple images</div><div className="mt-1 text-xs text-[var(--color-text-tertiary)]">They stay in this browser and use the current edit recipe.</div></button>
                )}

                <label className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={batchSmartBackground}
                    disabled={isBatchProcessing}
                    onChange={(event) => setBatchSmartBackground(event.target.checked)}
                    className="mt-1 accent-[var(--color-primary)]"
                  />
                  <span>
                    <strong className="block text-[var(--color-text-primary)]">Remove each background locally</strong>
                    Runs the segmentation model separately for every batch image using {backgroundProgress.backend === "wasm" ? "CPU/WASM" : backgroundProgress.backend === "webgpu" ? "WebGPU" : "the best available local backend"}. First use may download the same on-demand model used by Smart Background Removal. This is slower, but stays private and has no credits or paid limit. Spot Heal strokes are not copied between different photos.
                  </span>
                </label>

                <div className="space-y-1 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                  <div><strong>Current recipe:</strong> {presetId === "custom" ? "Custom edit" : getFilterPreset(presetId)?.name ?? "Original"}{advanced.layers.length ? ` + ${advanced.layers.length} stacked look${advanced.layers.length === 1 ? "" : "s"}` : ""}{lut ? ` + ${lut.title} LUT` : ""}{advanced.overlay.type !== "none" ? ` + ${OVERLAY_OPTIONS.find((option) => option.value === advanced.overlay.type)?.label}` : ""}.</div>
                  {outputMode === "custom" && lockAspect ? (
                    <div><strong>Batch sizing:</strong> preserves each image&apos;s own aspect ratio using the custom {customDimensionDriver} as the target.</div>
                  ) : null}
                </div>
                {isBatchProcessing ? (
                  <Button fullWidth size="lg" variant="secondary" onClick={cancelBatch} leftIcon={<Trash2 className="h-4 w-4" />}>Cancel after current image</Button>
                ) : (
                  <Button fullWidth size="lg" disabled={!batchItems.length} onClick={exportBatch} leftIcon={<Download className="h-4 w-4" />}>
                    {batchSmartBackground ? "Remove backgrounds & download ZIP" : "Apply to all & download ZIP"}
                  </Button>
                )}
              </>
            ) : null}

            {activePanel === "export" ? (
              <>
                <PanelTitle title="Export" description="Full-resolution local export. No account, watermark, upload, or hidden quality gate." />
                <div className="space-y-2">
                  <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Format</div>
                  <SegmentedControl options={EXPORT_FORMAT_OPTIONS} value={exportFormat} onChange={(format) => setExportFormat(format)} ariaLabel="Export format" fullWidth />
                </div>

                {exportFormat !== "png" ? (
                  <label className="block space-y-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                    <span className="flex justify-between gap-2">
                      Quality
                      <span className="font-mono text-xs font-bold text-[var(--color-text-tertiary)]">{Math.round(exportQuality * 100)}%</span>
                    </span>
                    <Slider min={10} max={100} step={1} value={exportQuality * 100} onChange={(event) => setExportQuality(Number(event.target.value) / 100)} />
                  </label>
                ) : null}

                <div className="space-y-2">
                  <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Dimensions</div>
                  <SegmentedControl
                    options={[{ value: "original" as const, label: "Original" }, { value: "custom" as const, label: "Custom" }]}
                    value={outputMode}
                    onChange={switchOutputMode}
                    ariaLabel="Output dimensions"
                    fullWidth
                  />
                  {outputMode === "custom" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs font-bold text-[var(--color-text-tertiary)]">
                        Width
                        <Input className="mt-1" inputMode="numeric" value={customWidth} onChange={(event) => handleCustomWidth(event.target.value.replace(/\D/g, ""))} />
                      </label>
                      <label className="text-xs font-bold text-[var(--color-text-tertiary)]">
                        Height
                        <Input className="mt-1" inputMode="numeric" value={customHeight} onChange={(event) => handleCustomHeight(event.target.value.replace(/\D/g, ""))} />
                      </label>
                      <label className="col-span-2 inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                        <input type="checkbox" checked={lockAspect} onChange={(event) => toggleLockAspect(event.target.checked)} className="accent-[var(--color-primary)]" />
                        Lock aspect ratio
                      </label>
                    </div>
                  ) : null}
                </div>

                <label className="block text-xs font-bold text-[var(--color-text-tertiary)]">
                  Filename
                  <Input className="mt-1" value={fileName} onChange={(event) => setFileName(event.target.value)} />
                </label>

                <div className="grid grid-cols-3 gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/55 p-3 text-center">
                  <div>
                    <div className="text-xs uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">Size</div>
                    <div className="mt-1 text-xs font-black text-[var(--color-text-primary)]">{outputDimensions.width || "—"}×{outputDimensions.height || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">Estimate</div>
                    <div className="mt-1 text-xs font-black text-[var(--color-text-primary)]">{formatBytes(estimatedBytes)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">Watermark</div>
                    <div className="mt-1 text-xs font-black text-[var(--color-primary)]">None</div>
                  </div>
                </div>

                {largeExport ? (
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-warning-border,var(--color-border-strong))] bg-[var(--color-warning-soft,var(--color-surface-subtle))] p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                    <strong className="text-[var(--color-text-primary)]">Large export:</strong> {outputDimensions.width}×{outputDimensions.height} may use roughly {formatBytes(estimatedWorkingMemory)} of temporary working memory. Very large canvases can hit browser/device limits.
                  </div>
                ) : null}

                <Button fullWidth size="lg" loading={isBusy} disabled={!imageEl} onClick={exportImage} leftIcon={<Download className="h-4 w-4" />}>
                  Download {exportFormat.toUpperCase()}
                </Button>

                <div className="rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                  <div className="flex items-center gap-1.5 font-black text-[var(--color-primary)]"><ShieldCheck className="h-3.5 w-3.5" /> Private export</div>
                  Your photo is rendered on-device. Canvas export strips embedded metadata by default and never adds a Darma watermark.
                </div>
              </>
            ) : null}
          </div>
        </aside>
      </div>

      {/* Secondary actions / developer output */}
      <div className="flex flex-col gap-3 border-t border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" leftIcon={<Upload className="h-4 w-4" />} onClick={() => fileInputRef.current?.click()}>
              {imageEl ? "Replace" : "Choose image"}
            </Button>
            {imageEl ? (
              <Button size="sm" variant="ghost" leftIcon={<ImageOff className="h-4 w-4" />} onClick={removeImage}>
                Remove
              </Button>
            ) : null}
            <CopyButton size="sm" variant="ghost" getText={() => generateFilterCss(filters, cssClassName)} disabled={!imageEl}>
              Copy CSS-compatible filters
            </CopyButton>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-[var(--color-text-tertiary)]">
            {advancedActive ? <span>Advanced canvas adjustments are baked into exports and are not representable in CSS alone.</span> : <code className="rounded bg-[var(--color-code-surface)] px-2 py-1">filter: {cssFilterString};</code>}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border-subtle)] pt-2 text-xs leading-4 text-[var(--color-text-tertiary)]">
          <span role="status" aria-live="polite">{status}</span>
          <span className="hidden sm:inline">Shortcuts: Ctrl/Cmd+Z undo · Shift+Ctrl/Cmd+Z redo · O original · +/− zoom · 0 fit</span>
          {messages.length ? <span>{messages.at(-1)?.message}</span> : null}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          loadFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input ref={lutInputRef} type="file" accept=".cube,text/plain" className="hidden" onChange={(event) => { void loadLutFile(event.target.files?.[0]); event.target.value = ""; }} />
      <input ref={presetImportRef} type="file" accept=".json,application/json" className="hidden" onChange={(event) => { void importCustomPreset(event.target.files?.[0]); event.target.value = ""; }} />
      <input ref={batchInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => { if (event.target.files) addBatchFiles(event.target.files); event.target.value = ""; }} />
    </div>
  );
}
