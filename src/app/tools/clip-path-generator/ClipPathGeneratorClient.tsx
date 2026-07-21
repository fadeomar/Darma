"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { HelpCircle } from "lucide-react";
import { Button, Tabs } from "@/components/ui";
import { downloadText } from "../_shared/clientUtils";
import {
  appendPoint,
  clonePoints,
  createDefaultClipPathState,
  generateClipPathCss,
  generateClipPathValue,
  generateReactStyle,
  generateTailwindArbitrary,
  getClipPathStats,
  insertPointOnEdge,
  MAX_POINTS,
  MAX_SHAPE_JSON_CHARS,
  MIN_POINTS,
  mirrorHorizontal,
  mirrorVertical,
  movePoint,
  parseShapeFile,
  pointsEqual,
  removePoint,
  reversePoints,
  serializeShape,
  validateClipPathState,
} from "./clipPath";
import { ClipPathFeedback, type ToolStatus } from "./components/ClipPathFeedback";
import { EditorStage } from "./components/EditorStage";
import { OutputPanel } from "./components/OutputPanel";
import { PointEditor } from "./components/PointEditor";
import { PresetGallery } from "./components/PresetGallery";
import { PreviewControls } from "./components/PreviewControls";
import { ProjectControls } from "./components/ProjectControls";
import { SavedShapesPanel } from "./components/SavedShapesPanel";
import { ShortcutHelpDialog } from "./components/ShortcutHelpDialog";
import {
  createClippedPngBlob,
  downloadBlob,
  generateClipPathSvg,
  objectUrlToDataUrl,
  sanitizeFilename,
} from "./exporters";
import { usePointHistory } from "./hooks/usePointHistory";
import { MAX_ZOOM, MIN_ZOOM, useViewport } from "./hooks/useViewport";
import { findMatchingPresetId, getPresetById } from "./presets";
import { SAMPLE_BACKGROUNDS } from "./sampleImages";
import {
  createSavedShape,
  MAX_SAVED_SHAPES,
  normalizeSavedShapeName,
  parseSavedShapeStore,
  SAVED_SHAPES_STORAGE_KEY,
  serializeSavedShapeStore,
} from "./storage";
import {
  centerPoints,
  clampSnapSize,
  createDefaultStudioSettings,
  DEFAULT_SCALE_STEP,
  duplicatePoint,
  fitPointsToBounds,
  reorderPoint,
  rotatePoints,
  scalePoints,
  snapPoint,
  updatePointCoordinates,
} from "./studio";
import type {
  ClipOutputFormat,
  ClipPathState,
  ClipPathStudioSettings,
  ClipPoint,
  PreviewShape,
  SavedClipPathShape,
} from "./types";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const DEFAULT_OUTPUT_FORMAT: ClipOutputFormat = "css";
const INITIAL_STATUS: ToolStatus = {
  tone: "info",
  message: "Choose a preset or edit points directly on the stage.",
};

type MobilePanel = "shapes" | "points" | "preview" | "output";

const MOBILE_PANEL_ITEMS: { value: MobilePanel; label: string }[] = [
  { value: "shapes", label: "Shapes" },
  { value: "points", label: "Points" },
  { value: "preview", label: "Preview" },
  { value: "output", label: "Output" },
];

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="truncate text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 truncate text-base font-black text-[var(--color-text-primary)]">{value}</div>
    </div>
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.matches("input, textarea, select") || target.isContentEditable || Boolean(target.closest("[contenteditable='true']"));
}

async function decodeImage(url: string, timeoutMs?: number): Promise<{ width: number; height: number }> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const done = (fn: () => void) => {
      if (timer) clearTimeout(timer);
      fn();
    };
    image.onload = () => done(resolve);
    image.onerror = () => done(() => reject(new Error("decode")));
    if (timeoutMs) timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    image.src = url;
  });
  // `decode()` can reject for cross-origin images even after a successful load,
  // so treat it as best-effort — `naturalWidth`/`Height` are already reliable.
  if (typeof image.decode === "function") {
    try {
      await image.decode();
    } catch {
      // ignore: dimensions below still come from the loaded image
    }
  }
  return { width: image.naturalWidth, height: image.naturalHeight };
}

const REMOTE_IMAGE_TIMEOUT_MS = 15_000;

function isSupportedImageUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "data:";
  } catch {
    return false;
  }
}

function createLocalId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `shape-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ClipPathGeneratorClient() {
  const defaults = useMemo(() => createDefaultClipPathState(), []);
  const studioDefaults = useMemo(() => createDefaultStudioSettings(), []);
  const {
    points,
    commit,
    beginTransaction,
    updateTransaction,
    endTransaction,
    undo,
    redo,
    resetHistory,
    canUndo,
    canRedo,
  } = usePointHistory(defaults.points);
  const viewport = useViewport();

  const [previewShape, setPreviewShape] = useState<PreviewShape>(defaults.previewShape);
  const [imageUrl, setImageUrl] = useState<string | null>(defaults.imageUrl);
  const [className, setClassName] = useState(defaults.className);
  const [settings, setSettings] = useState<ClipPathStudioSettings>(studioDefaults);
  const [selected, setSelected] = useState<number | null>(null);
  const [outputFormat, setOutputFormat] = useState<ClipOutputFormat>(DEFAULT_OUTPUT_FORMAT);
  const [status, setStatus] = useState<ToolStatus>(INITIAL_STATUS);
  const [isDragOver, setIsDragOver] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("shapes");
  const [savedShapes, setSavedShapes] = useState<SavedClipPathShape[]>([]);
  const [scaleStep, setScaleStep] = useState(DEFAULT_SCALE_STEP);
  const [helpOpen, setHelpOpen] = useState(false);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);
  const dragPointerId = useRef<number | null>(null);
  const dragMoved = useRef(false);
  const imageObjectUrlRef = useRef<string | null>(null);
  const imageLoadRequestRef = useRef(0);

  const state: ClipPathState = useMemo(
    () => ({
      points,
      previewShape,
      imageUrl,
      objectFit: settings.objectFit,
      showGhost: settings.showGhost,
      webkitFallback: settings.webkitFallback,
      className,
    }),
    [className, imageUrl, points, previewShape, settings.objectFit, settings.showGhost, settings.webkitFallback],
  );

  const clipValue = generateClipPathValue(state);
  const stats = getClipPathStats(points);
  const messages = validateClipPathState(state);
  const activePresetId = useMemo(() => findMatchingPresetId(points) ?? "custom", [points]);
  const cssOutput = useMemo(() => generateClipPathCss(state), [state]);
  const outputs = useMemo<Record<ClipOutputFormat, string>>(
    () => ({
      css: cssOutput,
      value: clipValue,
      tailwind: generateTailwindArbitrary(state),
      react: generateReactStyle(state),
    }),
    [clipValue, cssOutput, state],
  );
  const selectedDescription =
    selected !== null && points[selected]
      ? `Selected point ${selected + 1} of ${points.length}: x ${points[selected].x} percent, y ${points[selected].y} percent.`
      : "No polygon point is selected.";
  const selectedAnnouncement = selected !== null && points[selected]
    ? `Point ${selected + 1} selected.`
    : "Point selection cleared.";

  const replaceImageUrl = useCallback((nextUrl: string | null) => {
    const previous = imageObjectUrlRef.current;
    imageObjectUrlRef.current = nextUrl;
    setImageUrl(nextUrl);
    if (previous && previous !== nextUrl) URL.revokeObjectURL(previous);
  }, []);

  useEffect(
    () => () => {
      imageLoadRequestRef.current += 1;
      if (imageObjectUrlRef.current) URL.revokeObjectURL(imageObjectUrlRef.current);
      imageObjectUrlRef.current = null;
    },
    [],
  );

  useEffect(() => {
    try {
      const parsed = parseSavedShapeStore(window.localStorage.getItem(SAVED_SHAPES_STORAGE_KEY));
      if (parsed.ok === false) setStatus({ tone: "warning", message: `${parsed.error} Saved shapes were ignored.` });
      else setSavedShapes(parsed.items);
    } catch {
      setStatus({ tone: "warning", message: "Browser storage is unavailable; saved shapes are disabled." });
    }
  }, []);

  const persistSavedShapes = useCallback((next: SavedClipPathShape[]): boolean => {
    try {
      window.localStorage.setItem(SAVED_SHAPES_STORAGE_KEY, serializeSavedShapeStore(next));
      setSavedShapes(next);
      return true;
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Saved shapes could not be stored in this browser.",
      });
      return false;
    }
  }, []);

  const commitShape = useCallback(
    (next: ClipPoint[]): boolean => {
      if (pointsEqual(points, next)) return false;
      commit(next);
      return true;
    },
    [commit, points],
  );

  const updateSettings = useCallback((next: Partial<ClipPathStudioSettings>) => {
    setSettings((current) => ({
      ...current,
      ...next,
      snapSize: next.snapSize === undefined ? current.snapSize : clampSnapSize(next.snapSize),
    }));
  }, []);

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    undo();
    setSelected(null);
    setStatus({ tone: "success", message: "Undid the last shape edit." });
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    redo();
    setSelected(null);
    setStatus({ tone: "success", message: "Redid the shape edit." });
  }, [canRedo, redo]);

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if (isEditableTarget(event.target) || (!event.ctrlKey && !event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        if (!canRedo) return;
        event.preventDefault();
        handleRedo();
      } else if (key === "z") {
        if (!canUndo) return;
        event.preventDefault();
        handleUndo();
      } else if (key === "y") {
        if (!canRedo) return;
        event.preventDefault();
        handleRedo();
      }
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [canRedo, canUndo, handleRedo, handleUndo]);

  const pointerToPercent = useCallback(
    (clientX: number, clientY: number): ClipPoint => {
      const rect = artboardRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
      const point = {
        x: ((clientX - rect.left) / rect.width) * 100,
        y: ((clientY - rect.top) / rect.height) * 100,
      };
      return settings.snapEnabled ? snapPoint(point, settings.snapSize) : point;
    },
    [settings.snapEnabled, settings.snapSize],
  );

  const handleVertexPointerDown = useCallback(
    (event: ReactPointerEvent<SVGCircleElement>, index: number) => {
      event.preventDefault();
      event.stopPropagation();
      artboardRef.current?.focus();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragIndex.current = index;
      dragPointerId.current = event.pointerId;
      dragMoved.current = false;
      setSelected(index);
      beginTransaction();
    },
    [beginTransaction],
  );

  const handleVertexPointerMove = useCallback(
    (event: ReactPointerEvent<SVGCircleElement>, index: number) => {
      if (dragIndex.current !== index || dragPointerId.current !== event.pointerId) return;
      updateTransaction((current) => {
        const next = movePoint(current, index, pointerToPercent(event.clientX, event.clientY));
        if (!pointsEqual(current, next)) dragMoved.current = true;
        return next;
      });
    },
    [pointerToPercent, updateTransaction],
  );

  const finishDrag = useCallback(() => {
    if (dragIndex.current === null) return;
    const movedIndex = dragIndex.current;
    dragIndex.current = null;
    dragPointerId.current = null;
    endTransaction();
    if (dragMoved.current) setStatus({ tone: "success", message: `Moved point ${movedIndex + 1}.` });
    dragMoved.current = false;
  }, [endTransaction]);

  const handleVertexPointerEnd = useCallback(
    (event: ReactPointerEvent<SVGCircleElement>) => {
      if (dragPointerId.current !== event.pointerId) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      finishDrag();
    },
    [finishDrag],
  );

  const applyPreset = useCallback(
    (id: string) => {
      if (id === "custom") return;
      const preset = getPresetById(id);
      if (!preset) return;
      const changed = commitShape(clonePoints(preset.points));
      setSelected(null);
      setStatus({
        tone: changed ? "success" : "info",
        message: changed ? `Applied the ${preset.name} preset.` : `${preset.name} is already applied.`,
      });
    },
    [commitShape],
  );

  const handleStageKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget || selected === null || !points[selected]) return;
      const step = event.shiftKey ? 5 : event.altKey ? 0.5 : 1;
      let next: ClipPoint[] | null = null;
      if (event.key === "ArrowLeft") next = movePoint(points, selected, { ...points[selected], x: points[selected].x - step });
      else if (event.key === "ArrowRight") next = movePoint(points, selected, { ...points[selected], x: points[selected].x + step });
      else if (event.key === "ArrowUp") next = movePoint(points, selected, { ...points[selected], y: points[selected].y - step });
      else if (event.key === "ArrowDown") next = movePoint(points, selected, { ...points[selected], y: points[selected].y + step });
      else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        if (points.length <= MIN_POINTS) {
          setStatus({ tone: "warning", message: `A polygon needs at least ${MIN_POINTS} points.` });
          return;
        }
        commit(removePoint(points, selected));
        setSelected(null);
        setStatus({ tone: "success", message: "Removed the selected point." });
        return;
      } else if (event.key === "Escape") {
        event.preventDefault();
        setSelected(null);
        return;
      } else return;
      event.preventDefault();
      if (next) commitShape(next);
    },
    [commit, commitShape, points, selected],
  );

  const loadImageFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setStatus({ tone: "error", message: "Choose a valid image file." });
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setStatus({ tone: "error", message: "The image exceeds the 20 MB limit." });
        return;
      }
      const requestId = ++imageLoadRequestRef.current;
      const objectUrl = URL.createObjectURL(file);
      let accepted = false;
      try {
        const { width, height } = await decodeImage(objectUrl);
        if (requestId !== imageLoadRequestRef.current) return;
        if (width <= 0 || height <= 0) throw new Error("dimensions");
        if (width * height > MAX_IMAGE_PIXELS) {
          setStatus({ tone: "error", message: "The image dimensions are too large to preview safely." });
          return;
        }
        replaceImageUrl(objectUrl);
        accepted = true;
        setPreviewShape("image");
        setStatus({ tone: "success", message: `Loaded ${file.name}. The image remains local to this browser.` });
      } catch {
        if (requestId === imageLoadRequestRef.current) setStatus({ tone: "error", message: "The file could not be decoded as an image." });
      } finally {
        if (!accepted) URL.revokeObjectURL(objectUrl);
      }
    },
    [replaceImageUrl],
  );

  // Load an already-addressable image source (a built-in sample data URI or a
  // remote URL). Unlike loadImageFile there is no object URL to manage.
  const loadImageSrc = useCallback(
    async (src: string, label: string, options?: { remote?: boolean }) => {
      const requestId = ++imageLoadRequestRef.current;
      try {
        const { width, height } = await decodeImage(src, options?.remote ? REMOTE_IMAGE_TIMEOUT_MS : undefined);
        if (requestId !== imageLoadRequestRef.current) return;
        if (width <= 0 || height <= 0) throw new Error("dimensions");
        if (width * height > MAX_IMAGE_PIXELS) {
          setStatus({ tone: "error", message: "The image dimensions are too large to preview safely." });
          return;
        }
        replaceImageUrl(src);
        setPreviewShape("image");
        setStatus({ tone: "success", message: `Loaded ${label}.` });
      } catch {
        if (requestId !== imageLoadRequestRef.current) return;
        setStatus({
          tone: "error",
          message: options?.remote
            ? "That image URL could not be loaded. Check the link, or the host may block cross-origin images."
            : "The image could not be loaded.",
        });
      }
    },
    [replaceImageUrl],
  );

  const loadSample = useCallback(
    (dataUri: string, label: string) => void loadImageSrc(dataUri, label),
    [loadImageSrc],
  );

  const loadImageUrl = useCallback(
    (rawUrl: string) => {
      const url = rawUrl.trim();
      if (!url) return;
      if (!isSupportedImageUrl(url)) {
        setStatus({ tone: "error", message: "Enter a valid image URL starting with https://, http://, or data:." });
        return;
      }
      setStatus({ tone: "info", message: "Loading image from URL…" });
      void loadImageSrc(url, "the image from that URL", { remote: true });
    },
    [loadImageSrc],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      void loadImageFile(event.dataTransfer.files?.[0]);
    },
    [loadImageFile],
  );

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (!rootRef.current?.contains(document.activeElement)) return;
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) => entry.type.startsWith("image/"));
      if (item) void loadImageFile(item.getAsFile());
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadImageFile]);

  const removeImage = useCallback(() => {
    imageLoadRequestRef.current += 1;
    replaceImageUrl(null);
    setPreviewShape("solid");
    setStatus({ tone: "success", message: "Removed the image and restored the solid preview." });
  }, [replaceImageUrl]);

  const reset = useCallback(() => {
    const fresh = createDefaultClipPathState();
    const freshSettings = createDefaultStudioSettings();
    imageLoadRequestRef.current += 1;
    replaceImageUrl(null);
    resetHistory(fresh.points);
    setPreviewShape(fresh.previewShape);
    setClassName(fresh.className);
    setSettings(freshSettings);
    setOutputFormat(DEFAULT_OUTPUT_FORMAT);
    setSelected(null);
    setIsDragOver(false);
    setScaleStep(DEFAULT_SCALE_STEP);
    dragIndex.current = null;
    dragPointerId.current = null;
    dragMoved.current = false;
    viewport.resetView();
    setStatus({ tone: "success", message: "Reset the complete studio to its default state." });
  }, [replaceImageUrl, resetHistory, viewport]);

  const exportJson = useCallback(() => {
    if (!stats.isValid) {
      setStatus({ tone: "warning", message: "Fix the polygon validation errors before exporting JSON." });
      return;
    }
    downloadText(`${sanitizeFilename(className)}.json`, serializeShape(state), "application/json");
    setStatus({ tone: "success", message: "Exported the polygon and class name as JSON." });
  }, [className, state, stats.isValid]);

  const importJson = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      if (file.size > MAX_SHAPE_JSON_CHARS) {
        setStatus({ tone: "error", message: "The JSON file is too large." });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          setStatus({ tone: "error", message: "The JSON file could not be read." });
          return;
        }
        const parsed = parseShapeFile(reader.result);
        if (parsed.ok === false) {
          setStatus({ tone: "error", message: parsed.error });
          return;
        }
        commit(parsed.points);
        setClassName(parsed.className);
        setSelected(null);
        setStatus({ tone: "success", message: "Imported the polygon and class name from JSON." });
      };
      reader.onerror = () => setStatus({ tone: "error", message: "The JSON file could not be read." });
      reader.readAsText(file);
    },
    [commit],
  );

  const applyTransform = useCallback(
    (label: string, transformer: (current: ClipPoint[]) => ClipPoint[]) => {
      if (!stats.isValid) {
        setStatus({ tone: "warning", message: "Fix the polygon validation errors before applying this transform." });
        return;
      }
      const changed = commitShape(transformer(points));
      setStatus({ tone: changed ? "success" : "info", message: changed ? `${label} applied.` : `${label} made no change.` });
    },
    [commitShape, points, stats.isValid],
  );

  const addPoint = useCallback(() => {
    if (points.length >= MAX_POINTS) {
      setStatus({ tone: "warning", message: `The ${MAX_POINTS}-point limit has been reached.` });
      return;
    }
    const next = appendPoint(points);
    if (settings.snapEnabled && next.length > points.length) {
      next[next.length - 1] = snapPoint(next[next.length - 1], settings.snapSize);
    }
    if (commitShape(next)) {
      setSelected(next.length - 1);
      setStatus({ tone: "success", message: "Added a point." });
    }
  }, [commitShape, points, settings.snapEnabled, settings.snapSize]);

  const handleInsertEdge = useCallback(
    (index: number) => {
      if (points.length >= MAX_POINTS) {
        setStatus({ tone: "warning", message: `The ${MAX_POINTS}-point limit has been reached.` });
        return;
      }
      let next = insertPointOnEdge(points, index);
      if (settings.snapEnabled) next = updatePointCoordinates(next, index + 1, snapPoint(next[index + 1], settings.snapSize));
      if (!commitShape(next)) return;
      setSelected(index + 1);
      artboardRef.current?.focus();
      setStatus({ tone: "success", message: "Inserted a point on the edge." });
    },
    [commitShape, points, settings.snapEnabled, settings.snapSize],
  );

  const updateNumericPoint = useCallback(
    (index: number, next: Partial<ClipPoint>) => {
      const changed = commitShape(updatePointCoordinates(points, index, next));
      if (changed) {
        setSelected(index);
        setStatus({ tone: "success", message: `Updated point ${index + 1}.` });
      }
    },
    [commitShape, points],
  );

  const duplicateNumericPoint = useCallback(
    (index: number) => {
      const next = duplicatePoint(points, index);
      if (commitShape(next)) {
        setSelected(index + 1);
        setStatus({ tone: "success", message: `Duplicated point ${index + 1}.` });
      }
    },
    [commitShape, points],
  );

  const deleteNumericPoint = useCallback(
    (index: number) => {
      if (points.length <= MIN_POINTS) {
        setStatus({ tone: "warning", message: `A polygon needs at least ${MIN_POINTS} points.` });
        return;
      }
      if (commitShape(removePoint(points, index))) {
        setSelected((current) => {
          if (current === null) return null;
          if (current === index) return null;
          return current > index ? current - 1 : current;
        });
        setStatus({ tone: "success", message: `Removed point ${index + 1}.` });
      }
    },
    [commitShape, points],
  );

  const reorderNumericPoint = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (commitShape(reorderPoint(points, fromIndex, toIndex))) {
        setSelected(toIndex);
        setStatus({ tone: "success", message: `Moved point ${fromIndex + 1} to position ${toIndex + 1}.` });
      }
    },
    [commitShape, points],
  );

  const saveCurrentShape = useCallback(
    (name: string) => {
      const safeName = normalizeSavedShapeName(name);
      if (!safeName) {
        setStatus({ tone: "warning", message: "Enter a name before saving the shape." });
        return;
      }
      if (!stats.isValid) {
        setStatus({ tone: "warning", message: "Fix validation errors before saving this shape." });
        return;
      }
      if (savedShapes.length >= MAX_SAVED_SHAPES) {
        setStatus({ tone: "warning", message: `The ${MAX_SAVED_SHAPES}-shape limit has been reached.` });
        return;
      }
      const item = createSavedShape({ id: createLocalId(), name: safeName, className, points, settings });
      if (persistSavedShapes([item, ...savedShapes])) setStatus({ tone: "success", message: `Saved “${safeName}” in this browser.` });
    },
    [className, persistSavedShapes, points, savedShapes, settings, stats.isValid],
  );

  const loadSavedShape = useCallback(
    (item: SavedClipPathShape) => {
      imageLoadRequestRef.current += 1;
      replaceImageUrl(null);
      setPreviewShape("solid");
      commit(item.points);
      setClassName(item.className);
      setSettings(item.settings);
      setSelected(null);
      viewport.resetView();
      setStatus({ tone: "success", message: `Loaded “${item.name}”. The previous polygon remains available through Undo.` });
    },
    [commit, replaceImageUrl, viewport],
  );

  const renameSavedShape = useCallback(
    (id: string, name: string) => {
      const safeName = normalizeSavedShapeName(name);
      if (!safeName) {
        setStatus({ tone: "warning", message: "A saved shape name cannot be empty." });
        return;
      }
      const now = new Date().toISOString();
      const next = savedShapes.map((item) => (item.id === id ? { ...item, name: safeName, updatedAt: now } : item));
      if (persistSavedShapes(next)) setStatus({ tone: "success", message: `Renamed the saved shape to “${safeName}”.` });
    },
    [persistSavedShapes, savedShapes],
  );

  const deleteSavedShape = useCallback(
    (id: string) => {
      const item = savedShapes.find((candidate) => candidate.id === id);
      const next = savedShapes.filter((candidate) => candidate.id !== id);
      if (persistSavedShapes(next)) setStatus({ tone: "success", message: `Deleted “${item?.name ?? "saved shape"}”.` });
    },
    [persistSavedShapes, savedShapes],
  );

  const clearSavedShapes = useCallback(() => {
    if (!window.confirm("Delete all locally saved clip-path shapes? This cannot be undone.")) return;
    if (persistSavedShapes([])) setStatus({ tone: "success", message: "Cleared all locally saved shapes." });
  }, [persistSavedShapes]);

  const exportSvg = useCallback(
    async (embedImage: boolean) => {
      if (!stats.isValid) {
        setStatus({ tone: "warning", message: "Fix validation errors before exporting SVG." });
        return;
      }
      try {
        const embedded = embedImage && imageUrl ? await objectUrlToDataUrl(imageUrl) : null;
        const artboardRect = artboardRef.current?.getBoundingClientRect();
        const svg = generateClipPathSvg({
          points,
          className,
          aspectRatio: settings.aspectRatio,
          backgroundColor: settings.backgroundColor,
          embeddedImageDataUrl: embedded?.dataUrl,
          objectFit: settings.objectFit,
          objectPosition: settings.objectPosition,
          renderedArtboardWidth: artboardRect?.width,
          renderedArtboardHeight: artboardRect?.height,
        });
        downloadText(`${sanitizeFilename(className)}.svg`, svg, "image/svg+xml;charset=utf-8");
        setStatus({ tone: "success", message: embedded ? "Exported SVG with the local image embedded." : "Exported a reusable SVG clipPath." });
      } catch (error) {
        setStatus({ tone: "error", message: error instanceof Error ? error.message : "SVG export failed." });
      }
    },
    [className, imageUrl, points, settings, stats.isValid],
  );

  const exportPng = useCallback(async () => {
    if (!imageUrl || !stats.isValid) {
      setStatus({ tone: "warning", message: "Load an image and fix validation errors before exporting PNG." });
      return;
    }
    try {
      setStatus({ tone: "info", message: "Preparing a PNG that matches the current preview…" });
      const artboardRect = artboardRef.current?.getBoundingClientRect();
      const result = await createClippedPngBlob(imageUrl, points, {
        aspectRatio: settings.aspectRatio,
        objectFit: settings.objectFit,
        objectPosition: settings.objectPosition,
        renderedArtboardWidth: artboardRect?.width,
        renderedArtboardHeight: artboardRect?.height,
      });
      downloadBlob(`${sanitizeFilename(className)}.png`, result.blob);
      setStatus({
        tone: result.downscaled ? "warning" : "success",
        message: result.downscaled
          ? `Exported a safely downscaled ${result.width}×${result.height} PNG matching the preview.`
          : `Exported a ${result.width}×${result.height} PNG matching the preview.`,
      });
    } catch (error) {
      setStatus({ tone: "error", message: error instanceof Error ? error.message : "PNG export failed." });
    }
  }, [className, imageUrl, points, settings.aspectRatio, settings.objectFit, settings.objectPosition, stats.isValid]);

  const panelVisibility = (panel: MobilePanel) => (mobilePanel === panel ? "block" : "hidden");

  return (
    <div ref={rootRef} className="min-w-0 max-w-full overflow-x-clip">
      <div className="mb-4 flex min-w-0 items-center justify-between gap-3 xl:hidden">
        <Tabs className="min-w-0 flex-1" items={MOBILE_PANEL_ITEMS} value={mobilePanel} onChange={(value) => setMobilePanel(value)} ariaLabel="Studio control panels" />
        <Button size="icon" variant="ghost" onClick={() => setHelpOpen(true)} aria-label="Open keyboard shortcut help" title="Keyboard shortcuts"><HelpCircle className="h-4 w-4" /></Button>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[256px_minmax(0,1fr)_320px] xl:items-start">
        <aside className={`order-2 min-w-0 space-y-4 ${panelVisibility("shapes")} xl:order-1 xl:block`} aria-label="Shapes and project controls">
          <ProjectControls
            canUndo={canUndo}
            canRedo={canRedo}
            validShape={stats.isValid}
            aspectRatio={settings.aspectRatio}
            snapEnabled={settings.snapEnabled}
            snapSize={settings.snapSize}
            scaleStep={scaleStep}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onReset={reset}
            onAspectRatioChange={(aspectRatio) => {
              updateSettings({ aspectRatio });
              viewport.resetView();
            }}
            onSnapSizeChange={(snapSize) => updateSettings({ snapSize })}
            onReverse={() => {
              if (commitShape(reversePoints(points))) setStatus({ tone: "success", message: "Reversed the point order." });
            }}
            onMirrorX={() => {
              if (commitShape(mirrorHorizontal(points))) setStatus({ tone: "success", message: "Mirrored the polygon horizontally." });
            }}
            onMirrorY={() => {
              if (commitShape(mirrorVertical(points))) setStatus({ tone: "success", message: "Mirrored the polygon vertically." });
            }}
            onRotateClockwise={() => applyTransform("Rotate clockwise", (current) => rotatePoints(current, "clockwise"))}
            onRotateCounterclockwise={() => applyTransform("Rotate counterclockwise", (current) => rotatePoints(current, "counterclockwise"))}
            onCenter={() => applyTransform("Center shape", centerPoints)}
            onFit={() => applyTransform("Fit to safe bounds", fitPointsToBounds)}
            onScaleStepChange={setScaleStep}
            onScale={(percent) => applyTransform(percent > 0 ? "Scale outward" : "Scale inward", (current) => scalePoints(current, percent))}
          />
          <PresetGallery activePresetId={activePresetId} onApply={applyPreset} />
          <SavedShapesPanel
            items={savedShapes}
            canSave={stats.isValid}
            onSave={saveCurrentShape}
            onLoad={loadSavedShape}
            onRename={renameSavedShape}
            onDelete={deleteSavedShape}
            onClear={clearSavedShapes}
          />
        </aside>

        <main className="order-1 min-w-0 xl:order-2">
          <div className="mb-3 hidden items-center justify-end xl:flex">
            <Button size="sm" variant="ghost" leftIcon={<HelpCircle className="h-4 w-4" />} onClick={() => setHelpOpen(true)}>Shortcuts</Button>
          </div>
          <EditorStage
            points={points}
            selected={selected}
            clipValue={clipValue}
            imageUrl={imageUrl}
            previewShape={previewShape}
            settings={settings}
            zoom={viewport.zoom}
            pan={viewport.pan}
            panMode={viewport.panMode}
            canZoomIn={viewport.zoom < MAX_ZOOM}
            canZoomOut={viewport.zoom > MIN_ZOOM}
            isDragOver={isDragOver}
            stageRef={stageRef}
            artboardRef={artboardRef}
            onZoomIn={viewport.zoomIn}
            onZoomOut={viewport.zoomOut}
            onResetView={viewport.resetView}
            onTogglePanMode={() => viewport.setPanMode(!viewport.panMode)}
            onToggleGrid={() => updateSettings({ showGrid: !settings.showGrid })}
            onToggleSnap={() => updateSettings({ snapEnabled: !settings.snapEnabled })}
            onStageKeyDown={handleStageKeyDown}
            onSelectPoint={setSelected}
            onVertexPointerDown={handleVertexPointerDown}
            onVertexPointerMove={handleVertexPointerMove}
            onVertexPointerEnd={handleVertexPointerEnd}
            onFinishDrag={finishDrag}
            onInsertEdge={handleInsertEdge}
            onPanPointerDown={(event) => {
              viewport.beginPan(event);
            }}
            onPanPointerMove={viewport.movePan}
            onPanPointerEnd={(event) => viewport.endPan(event)}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          />
          <p id="clip-selected-point-description" className="sr-only">{selectedDescription}</p>
          <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">{selectedAnnouncement}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Points" value={String(stats.pointCount)} />
            <StatTile label="Area" value={`${stats.areaPercent}%`} />
            <StatTile label="Shape" value={stats.isConvex ? "Convex" : "Concave"} />
            <StatTile label="Valid" value={stats.isValid ? "Yes" : "No"} />
          </div>
          <div className="mt-4"><ClipPathFeedback status={status} messages={messages} /></div>
        </main>

        <aside className="order-3 min-w-0 space-y-4 xl:order-3" aria-label="Editing and export controls">
          <div className={`${panelVisibility("points")} xl:block`}>
            <PointEditor
              points={points}
              selected={selected}
              onSelect={(index, focusStage) => {
                setSelected(index);
                if (focusStage) artboardRef.current?.focus();
              }}
              onUpdate={updateNumericPoint}
              onDuplicate={duplicateNumericPoint}
              onDelete={deleteNumericPoint}
              onReorder={reorderNumericPoint}
              onAdd={addPoint}
            />
          </div>
          <div className={`${panelVisibility("preview")} xl:block`}>
            <PreviewControls
              imageUrl={imageUrl}
              settings={settings}
              samples={SAMPLE_BACKGROUNDS}
              onUpload={() => fileInputRef.current?.click()}
              onSelectSample={loadSample}
              onLoadUrl={loadImageUrl}
              onRemoveImage={removeImage}
              onSettingsChange={updateSettings}
            />
          </div>
          <div className={`${panelVisibility("output")} xl:block`}>
            <OutputPanel
              className={className}
              outputFormat={outputFormat}
              output={outputs[outputFormat]}
              cssOutput={cssOutput}
              webkitFallback={settings.webkitFallback}
              validShape={stats.isValid}
              hasImage={Boolean(imageUrl)}
              onClassNameChange={setClassName}
              onOutputFormatChange={setOutputFormat}
              onWebkitFallbackChange={(webkitFallback) => updateSettings({ webkitFallback })}
              onDownloadCss={() => {
                if (!stats.isValid) return;
                downloadText(`${sanitizeFilename(className)}.css`, cssOutput, "text/css;charset=utf-8");
                setStatus({ tone: "success", message: "Downloaded the CSS file." });
              }}
              onExportJson={exportJson}
              onImportJson={() => importInputRef.current?.click()}
              onExportSvg={(embedImage) => void exportSvg(embedImage)}
              onExportPng={() => void exportPng()}
            />
          </div>
        </aside>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void loadImageFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          importJson(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <ShortcutHelpDialog open={helpOpen} onClose={closeHelp} />
    </div>
  );
}
