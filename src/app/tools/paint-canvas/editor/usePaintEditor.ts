"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
} from "react";
import type { Canvas as FabricCanvas, FabricObject, TPointerEvent } from "fabric";
import {
  DEFAULT_BACKGROUND,
  DEFAULT_CANVAS_SIZE,
  HISTORY_LIMIT,
  LARGE_DOCUMENT_HISTORY_LIMIT,
  LARGE_DOCUMENT_SNAPSHOT_BYTES,
} from "../constants";
import { createDefaultSettings } from "../draw";
import type {
  CanvasBackground,
  CanvasObjectSummary,
  CanvasSize,
  ExportFormat,
  PaintSettings,
  PaintTool,
  Point,
  SelectedSummary,
} from "../types";
import { isFreeDrawingTool, isPrivacyTool, isShapeTool } from "../types";
import { applyCssZoom, buildExportDataUrl } from "./canvasOutput";
import {
  downloadDataUrl,
  downloadTextFile,
  makeProjectFile,
  parseProjectFile,
  type PaintDocumentSnapshot,
} from "./projectDocument";
import { clampCanvasSize, clampZoom, fitZoom, normalizeRegion, ZOOM_STEP } from "./geometry";
import type { PaintStarter } from "./starters";
import {
  createImportedImage,
  createPrivacyDraft,
  createPrivacyRegionImage,
  createShape,
  ensureCanvasObjectMetadata,
  ensureObjectMetadata,
  getCanvasObjectSummaries,
  getObjectLabel,
  isFilterableImage,
  PAINT_OBJECT_PROPERTIES,
  setImageEffect,
  type FabricRuntime,
} from "./fabricHelpers";
import { usePaintShortcuts } from "./usePaintShortcuts";
import { usePaintAutosave } from "./usePaintAutosave";
import { useCanvasObjectActions } from "./useCanvasObjectActions";
import { getBrushPreset } from "./brushPresets";
import { createPerfectFreehandBrush } from "./perfectFreehandBrush";

type DocumentSnapshot = PaintDocumentSnapshot;

export function usePaintEditor() {
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<FabricCanvas | null>(null);
  const fabricRef = useRef<FabricRuntime | null>(null);
  const draftObjectRef = useRef<FabricObject | null>(null);
  const dragStartRef = useRef<Point | null>(null);
  const settingsRef = useRef<PaintSettings>(createDefaultSettings());
  const backgroundRef = useRef<CanvasBackground>({ ...DEFAULT_BACKGROUND });
  const canvasSizeRef = useRef<CanvasSize>({ ...DEFAULT_CANVAS_SIZE });
  const zoomRef = useRef(1);
  const highlightPreviousRef = useRef<Pick<PaintSettings, "color" | "size" | "opacity"> | null>(null);
  const historyRef = useRef<string[]>([]);
  const futureRef = useRef<string[]>([]);
  const restoringHistoryRef = useRef(false);
  const textHistoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [settings, setSettings] = useState<PaintSettings>(createDefaultSettings);
  const [background, setBackgroundState] = useState<CanvasBackground>({ ...DEFAULT_BACKGROUND });
  const [canvasSize, setCanvasSizeState] = useState<CanvasSize>({ ...DEFAULT_CANVAS_SIZE });
  const [objects, setObjects] = useState<CanvasObjectSummary[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [zoom, setZoomState] = useState(1);
  const [status, setStatus] = useState("Loading the drawing workspace…");
  const [ready, setReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [selected, setSelected] = useState<SelectedSummary>({
    label: "Nothing selected",
    count: 0,
    isImage: false,
    isGroup: false,
    opacity: 1,
    angle: 0,
  });

  const { saveState, scheduleAutosave, loadRecoverySnapshot, enableAutosave, cancelAutosave } = usePaintAutosave();

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof PaintSettings>(key: K, value: PaintSettings[K]) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
  }, []);

  const selectBrushPreset = useCallback((preset: PaintSettings["brushPreset"]) => {
    const definition = getBrushPreset(preset);
    setSettings((previous) => ({
      ...previous,
      tool: "brush",
      brushPreset: preset,
      size: definition.defaultSize,
    }));
    setStatus(`${definition.label} brush selected.`);
  }, []);

  const selectTool = useCallback((tool: PaintTool) => {
    setSettings((previous) => {
      if (tool === "highlight" && previous.tool !== "highlight") {
        highlightPreviousRef.current = { color: previous.color, size: previous.size, opacity: previous.opacity };
        return { ...previous, tool, color: "#eab308", size: 18, opacity: 0.35 };
      }
      if (previous.tool === "highlight" && tool !== "highlight" && highlightPreviousRef.current) {
        const restored = highlightPreviousRef.current;
        highlightPreviousRef.current = null;
        return { ...previous, ...restored, tool };
      }
      return { ...previous, tool };
    });
  }, []);


  /**
   * Quick starting styles only change tool settings. Canvas objects are never
   * added, replaced, or cleared, so a starter is safe on in-progress artwork.
   */
  const applyStarter = useCallback((starter: PaintStarter) => {
    const previous = settingsRef.current;
    const nextTool = starter.settings.tool ?? previous.tool;
    if (nextTool === "highlight" && previous.tool !== "highlight") {
      highlightPreviousRef.current = { color: previous.color, size: previous.size, opacity: previous.opacity };
    } else if (previous.tool === "highlight" && nextTool !== "highlight") {
      highlightPreviousRef.current = null;
    }
    setSettings((current) => ({ ...current, ...starter.settings }));
    setStatus(`${starter.label} settings applied. Your artwork was not changed.`);
  }, []);
  const syncHistoryFlags = useCallback(() => {
    setCanUndo(historyRef.current.length > 1);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const syncObjects = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ensureCanvasObjectMetadata(canvas);
    setObjects(getCanvasObjectSummaries(canvas));
  }, []);

  const serializeCanvas = useCallback((canvas: FabricCanvas): string => {
    ensureCanvasObjectMetadata(canvas);
    const snapshot: DocumentSnapshot = {
      canvas: canvas.toObject(PAINT_OBJECT_PROPERTIES),
      background: backgroundRef.current,
      size: canvasSizeRef.current,
    };
    return JSON.stringify(snapshot);
  }, []);

  const recordHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || restoringHistoryRef.current) return;
    const snapshot = serializeCanvas(canvas);
    const last = historyRef.current[historyRef.current.length - 1];
    if (snapshot === last) return;
    historyRef.current.push(snapshot);
    const historyLimit = snapshot.length > LARGE_DOCUMENT_SNAPSHOT_BYTES ? LARGE_DOCUMENT_HISTORY_LIMIT : HISTORY_LIMIT;
    while (historyRef.current.length > historyLimit) historyRef.current.shift();
    futureRef.current = [];
    syncHistoryFlags();
    syncObjects();
    scheduleAutosave(snapshot);
  }, [scheduleAutosave, serializeCanvas, syncHistoryFlags, syncObjects]);

  const restoreSnapshot = useCallback(async (snapshot: string, options?: { autosave?: boolean }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    restoringHistoryRef.current = true;
    try {
      const parsed = JSON.parse(snapshot) as unknown;
      const hasDocumentEnvelope = Boolean(
        parsed && typeof parsed === "object" && "canvas" in parsed && "background" in parsed,
      );
      const canvasJson = hasDocumentEnvelope ? (parsed as DocumentSnapshot).canvas : parsed;
      const rawBackground = hasDocumentEnvelope ? (parsed as DocumentSnapshot).background : { ...DEFAULT_BACKGROUND };
      const nextBackground: CanvasBackground = rawBackground
        && (rawBackground.mode === "solid" || rawBackground.mode === "transparent")
        && typeof rawBackground.color === "string"
        ? rawBackground
        : { ...DEFAULT_BACKGROUND };
      const rawSize = hasDocumentEnvelope && (parsed as DocumentSnapshot).size
        ? (parsed as DocumentSnapshot).size
        : { ...DEFAULT_CANVAS_SIZE };
      const nextSize = clampCanvasSize(rawSize);
      backgroundRef.current = nextBackground;
      canvasSizeRef.current = nextSize;
      setBackgroundState(nextBackground);
      setCanvasSizeState(nextSize);
      canvas.discardActiveObject();
      canvas.setDimensions(nextSize);
      await canvas.loadFromJSON(canvasJson);
      ensureCanvasObjectMetadata(canvas);
      applyCssZoom(canvas, zoomRef.current, nextSize);
      canvas.requestRenderAll();
      syncObjects();
      if (options?.autosave !== false) scheduleAutosave(serializeCanvas(canvas));
    } finally {
      restoringHistoryRef.current = false;
    }
  }, [scheduleAutosave, serializeCanvas, syncObjects]);

  const undo = useCallback(async () => {
    if (historyRef.current.length <= 1) return;
    const current = historyRef.current.pop();
    if (!current) return;
    futureRef.current.push(current);
    const previous = historyRef.current[historyRef.current.length - 1];
    if (previous) await restoreSnapshot(previous);
    syncHistoryFlags();
    setSelected({ label: "Nothing selected", count: 0, isImage: false, isGroup: false, opacity: 1, angle: 0 });
    setStatus("Undid the last change.");
  }, [restoreSnapshot, syncHistoryFlags]);

  const redo = useCallback(async () => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push(next);
    await restoreSnapshot(next);
    syncHistoryFlags();
    setSelected({ label: "Nothing selected", count: 0, isImage: false, isGroup: false, opacity: 1, angle: 0 });
    setStatus("Redid the last change.");
  }, [restoreSnapshot, syncHistoryFlags]);

  const syncSelection = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    const active = canvas.getActiveObject();
    if (activeObjects.length > 1 && active) {
      active.set({ snapAngle: 15, snapThreshold: 4, touchCornerSize: 36, cornerSize: 12, padding: 4 });
    }
    const fabric = fabricRef.current;
    setSelected({
      label: activeObjects.length > 1 ? `${activeObjects.length} objects` : getObjectLabel(active),
      count: activeObjects.length,
      isImage: activeObjects.length === 1 && isFilterableImage(active),
      isGroup: activeObjects.length === 1 && Boolean(fabric && active instanceof fabric.Group),
      opacity: activeObjects.length === 1 ? active?.opacity ?? 1 : 1,
      angle: activeObjects.length === 1 ? active?.angle ?? 0 : 0,
    });
    syncObjects();
  }, [syncObjects]);

  const configureTool = useCallback((nextSettings: PaintSettings) => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;

    canvas.isDrawingMode = isFreeDrawingTool(nextSettings.tool);
    canvas.selection = nextSettings.tool === "select";
    canvas.skipTargetFind = nextSettings.tool !== "select";
    canvas.defaultCursor = nextSettings.tool === "select" ? "default" : nextSettings.tool === "text" ? "text" : "crosshair";
    canvas.hoverCursor = nextSettings.tool === "select" ? "move" : canvas.defaultCursor;

    if (isFreeDrawingTool(nextSettings.tool)) {
      const brush = nextSettings.tool === "brush"
        ? createPerfectFreehandBrush(fabric, canvas, () => settingsRef.current)
        : new fabric.PencilBrush(canvas);
      brush.width = nextSettings.tool === "highlight" ? Math.max(12, nextSettings.size) : nextSettings.size;
      brush.color = nextSettings.tool === "eraser" ? "#000000" : nextSettings.color;
      brush.limitedToCanvasSize = true;
      if (brush instanceof fabric.PencilBrush) {
        brush.decimate = nextSettings.tool === "highlight" ? 0.8 : nextSettings.tool === "eraser" ? 0.55 : 0;
      }
      canvas.freeDrawingBrush = brush;
      canvas.freeDrawingCursor = "none";
    } else {
      canvas.freeDrawingCursor = "crosshair";
    }

    canvas.requestRenderAll();
  }, []);

  useEffect(() => {
    configureTool(settings);
  }, [configureTool, settings]);

  const addTextAt = useCallback(
    (point: Point) => {
      const canvas = canvasRef.current;
      const fabric = fabricRef.current;
      if (!canvas || !fabric) return;
      const current = settingsRef.current;
      const text = new fabric.IText("Type here", {
        left: point.x,
        top: point.y,
        fill: current.color,
        fontSize: Math.max(20, current.size * 4),
        opacity: current.opacity,
        originX: "left",
        originY: "top",
      });
      ensureObjectMetadata(text, "Text");
      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      text.selectAll();
      canvas.requestRenderAll();
      recordHistory();
      syncSelection();
      setStatus("Text added. Start typing to replace the placeholder.");
    },
    [recordHistory, syncSelection],
  );

  const addPrivacyRegion = useCallback(
    (tool: PaintTool, start: Point, end: Point) => {
      const canvas = canvasRef.current;
      const fabric = fabricRef.current;
      if (!canvas || !fabric || !isPrivacyTool(tool)) return;
      const region = normalizeRegion(start, end);
      if (region.width < 6 || region.height < 6) {
        setStatus("Drag a larger area to apply a privacy effect.");
        return;
      }

      try {
        const image = createPrivacyRegionImage(canvas, fabric, tool, start, end);
        if (!image) return;
        canvas.add(image);
        canvas.setActiveObject(image);
        canvas.requestRenderAll();
        recordHistory();
        syncSelection();
        setStatus(tool === "blur-region" ? "Blurred that local region." : "Pixelated that local region.");
      } catch {
        setStatus("That privacy effect could not be applied to this region.");
      }
    },
    [recordHistory, syncSelection],
  );

  const importImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setStatus("Choose an image file to add it to the canvas.");
        return;
      }
      const canvas = canvasRef.current;
      const fabric = fabricRef.current;
      if (!canvas || !fabric) return;

      try {
        // The helper stores a durable local data URL in Fabric JSON so undo/redo can
        // rehydrate the image after the original File object is gone.
        const image = await createImportedImage(fabric, file, canvasSizeRef.current);
        canvas.add(image);
        canvas.setActiveObject(image);
        canvas.requestRenderAll();
        recordHistory();
        syncSelection();
        selectTool("select");
        setStatus(`Added ${file.name}. The file stayed on this device.`);
      } catch {
        setStatus("That image could not be opened in the canvas.");
      }
    },
    [recordHistory, selectTool, syncSelection],
  );

  const handleFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) void importImageFile(file);
      event.target.value = "";
    },
    [importImageFile],
  );

  const handleDrop = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = Array.from(event.dataTransfer.files).find((candidate) => candidate.type.startsWith("image/"));
      if (file) void importImageFile(file);
    },
    [importImageFile],
  );

  const {
    deleteSelection,
    duplicateSelection,
    bringToFront,
    sendToBack,
    selectObject,
    toggleObjectSelection,
    selectAll,
    groupSelection,
    ungroupSelection,
    renameObject,
    toggleObjectVisibility,
    toggleObjectLock,
    moveObject,
    updateSelectedObject,
    alignSelection,
    distributeSelection,
    flipSelection,
    nudgeSelection,
  } = useCanvasObjectActions({
    canvasRef,
    fabricRef,
    recordHistory,
    syncSelection,
    syncObjects,
    selectTool,
    setStatus,
  });

  const applySelectedImageEffect = useCallback(
    (effect: "blur" | "pixelate" | "none") => {
      const canvas = canvasRef.current;
      const fabric = fabricRef.current;
      const active = canvas?.getActiveObject();
      if (!canvas || !fabric || !isFilterableImage(active)) return;
      setImageEffect(active, fabric, effect);
      canvas.requestRenderAll();
      recordHistory();
      setStatus(effect === "none" ? "Cleared image effects." : effect === "blur" ? "Blurred the selected image." : "Pixelated the selected image.");
    },
    [recordHistory],
  );

  const hasDocumentContent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const size = canvasSizeRef.current;
    const background = backgroundRef.current;
    return canvas.getObjects().length > 0
      || size.width !== DEFAULT_CANVAS_SIZE.width
      || size.height !== DEFAULT_CANVAS_SIZE.height
      || background.mode !== DEFAULT_BACKGROUND.mode
      || background.color !== DEFAULT_BACKGROUND.color;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.getObjects().length === 0) return;
    canvas.discardActiveObject();
    canvas.remove(...canvas.getObjects());
    canvas.requestRenderAll();
    recordHistory();
    syncSelection();
    setStatus("Cleared the canvas.");
  }, [recordHistory, syncSelection]);

  const setBackground = useCallback(
    (nextBackground: CanvasBackground) => {
      backgroundRef.current = nextBackground;
      setBackgroundState(nextBackground);
      recordHistory();
      setStatus(nextBackground.mode === "transparent" ? "Canvas background is transparent." : `Canvas background changed to ${nextBackground.color}.`);
    },
    [recordHistory],
  );

  const resizeCanvas = useCallback((nextSize: CanvasSize) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const safeSize = clampCanvasSize(nextSize);
    canvasSizeRef.current = safeSize;
    setCanvasSizeState(safeSize);
    canvas.setDimensions(safeSize);
    applyCssZoom(canvas, zoomRef.current, safeSize);
    canvas.requestRenderAll();
    recordHistory();
    setStatus(`Canvas resized to ${safeSize.width} × ${safeSize.height}. Existing objects kept their size.`);
  }, [recordHistory]);

  const saveProject = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const document = JSON.parse(serializeCanvas(canvas)) as DocumentSnapshot;
      const project = makeProjectFile(document);
      downloadTextFile(JSON.stringify(project, null, 2), "darma-paint-project.json");
      setStatus("Saved an editable Darma project file. It never left this device.");
    } catch {
      setStatus("The editable project file could not be created.");
    }
  }, [serializeCanvas]);

  const handleProjectInput = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (hasDocumentContent() && !window.confirm("Open this project and replace the current workspace?")) return;
    try {
      const project = parseProjectFile(JSON.parse(await file.text()));
      const snapshot = JSON.stringify(project.document);
      await restoreSnapshot(snapshot, { autosave: false });
      historyRef.current = [serializeCanvas(canvasRef.current!)];
      futureRef.current = [];
      syncHistoryFlags();
      enableAutosave();
      scheduleAutosave(historyRef.current[0]);
      syncSelection();
      setStatus(`Opened ${file.name} as an editable local project.`);
    } catch {
      setStatus("That file is not a supported Darma Paint project.");
    }
  }, [enableAutosave, hasDocumentContent, restoreSnapshot, scheduleAutosave, serializeCanvas, syncHistoryFlags, syncSelection]);

  const newDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (hasDocumentContent() && !window.confirm("Start a new drawing? Your autosaved workspace will be replaced.")) return;
    canvas.discardActiveObject();
    canvas.remove(...canvas.getObjects());
    const nextSize = { ...DEFAULT_CANVAS_SIZE };
    const nextBackground = { ...DEFAULT_BACKGROUND };
    canvasSizeRef.current = nextSize;
    backgroundRef.current = nextBackground;
    setCanvasSizeState(nextSize);
    setBackgroundState(nextBackground);
    canvas.setDimensions(nextSize);
    applyCssZoom(canvas, zoomRef.current, nextSize);
    canvas.requestRenderAll();
    const snapshot = serializeCanvas(canvas);
    historyRef.current = [snapshot];
    futureRef.current = [];
    syncHistoryFlags();
    syncSelection();
    scheduleAutosave(snapshot);
    setStatus("Started a new local drawing.");
  }, [hasDocumentContent, scheduleAutosave, serializeCanvas, syncHistoryFlags, syncSelection]);

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const url = buildExportDataUrl(canvas, exportFormat, backgroundRef.current, canvasSizeRef.current);
      const extension = exportFormat === "jpeg" ? "jpg" : exportFormat;
      downloadDataUrl(url, `darma-paint.${extension}`);
      const jpegNote = exportFormat === "jpeg" && backgroundRef.current.mode === "transparent" ? " JPEG uses a white background." : "";
      setStatus(`Downloaded darma-paint.${extension}. Nothing was uploaded.${jpegNote}`);
    } catch {
      setStatus("The canvas could not be exported.");
    }
  }, [exportFormat]);

  const setZoom = useCallback((value: number) => {
    const canvas = canvasRef.current;
    const next = clampZoom(value);
    zoomRef.current = next;
    if (canvas) applyCssZoom(canvas, next, canvasSizeRef.current);
    setZoomState(next);
  }, []);

  const zoomIn = useCallback(() => {
    setZoom(Math.round((zoom + ZOOM_STEP) * 10) / 10);
  }, [setZoom, zoom]);

  const zoomOut = useCallback(() => {
    setZoom(Math.round((zoom - ZOOM_STEP) * 10) / 10);
  }, [setZoom, zoom]);

  const fitToViewport = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const size = canvasSizeRef.current;
    const next = fitZoom(Math.max(100, viewport.clientWidth - 32), Math.max(100, viewport.clientHeight - 32), size.width, size.height);
    setZoom(next);
    viewport.scrollTo({ left: 0, top: 0 });
    setStatus(`Fit the canvas to ${Math.round(next * 100)}%.`);
  }, [setZoom]);

  const resetView = useCallback(() => {
    setZoom(1);
    viewportRef.current?.scrollTo({ left: 0, top: 0 });
    setStatus("Reset the canvas view to 100%.");
  }, [setZoom]);

  useEffect(() => {
    const canvasElement = canvasElementRef.current;
    if (!canvasElement) return;
    let disposed = false;
    let editor: FabricCanvas | null = null;

    void (async () => {
      const fabric = await import("fabric");
      if (disposed) return;
      fabric.FabricObject.customProperties = Array.from(new Set([
        ...fabric.FabricObject.customProperties,
        ...PAINT_OBJECT_PROPERTIES,
      ]));
      fabricRef.current = fabric;

      const canvas = new fabric.Canvas(canvasElement, {
        width: DEFAULT_CANVAS_SIZE.width,
        height: DEFAULT_CANVAS_SIZE.height,
        backgroundColor: "rgba(0,0,0,0)",
        preserveObjectStacking: true,
        enablePointerEvents: true,
        allowTouchScrolling: true,
        selectionKey: ["shiftKey", "ctrlKey", "metaKey"],
        altSelectionKey: "altKey",
        selection: false,
      });
      editor = canvas;
      canvasRef.current = canvas;
      canvas.selectionColor = "rgba(37, 99, 235, 0.10)";
      canvas.selectionBorderColor = "#2563eb";
      canvas.selectionLineWidth = 1;
      canvas.targetFindTolerance = 10;

      const onMouseDown = (event: { e: TPointerEvent }) => {
        const current = settingsRef.current;
        if (isFreeDrawingTool(current.tool) || current.tool === "select") return;
        const point = canvas.getScenePoint(event.e);
        if (current.tool === "text") {
          addTextAt(point);
          return;
        }
        if (isPrivacyTool(current.tool)) {
          dragStartRef.current = point;
          const draft = createPrivacyDraft(fabric, point, point);
          draftObjectRef.current = draft;
          canvas.add(draft);
          canvas.requestRenderAll();
          return;
        }
        if (!isShapeTool(current.tool)) return;
        dragStartRef.current = point;
        const shape = createShape(fabric, current.tool, point, point, current);
        if (!shape) return;
        draftObjectRef.current = shape;
        canvas.add(shape);
        canvas.requestRenderAll();
      };

      const onMouseMove = (event: { e: TPointerEvent }) => {
        const current = settingsRef.current;
        const start = dragStartRef.current;
        const draft = draftObjectRef.current;
        if (!start || !draft) return;
        const point = canvas.getScenePoint(event.e);
        if (isPrivacyTool(current.tool)) {
          const region = normalizeRegion(start, point);
          draft.set({ left: region.left, top: region.top, width: Math.max(1, region.width), height: Math.max(1, region.height) });
          draft.setCoords();
          canvas.requestRenderAll();
          return;
        }
        if (!isShapeTool(current.tool)) return;
        canvas.remove(draft);
        const nextDraft = createShape(fabric, current.tool, start, point, current);
        if (!nextDraft) return;
        draftObjectRef.current = nextDraft;
        canvas.add(nextDraft);
        canvas.requestRenderAll();
      };

      const onMouseUp = (event: { e: TPointerEvent }) => {
        const start = dragStartRef.current;
        const draft = draftObjectRef.current;
        if (!start || !draft) return;
        const current = settingsRef.current;
        const end = canvas.getScenePoint(event.e);
        dragStartRef.current = null;
        draftObjectRef.current = null;

        if (isPrivacyTool(current.tool)) {
          canvas.remove(draft);
          canvas.requestRenderAll();
          addPrivacyRegion(current.tool, start, end);
          return;
        }

        draft.setCoords();
        recordHistory();
        setStatus("Added a shape. Switch to Select to move, resize, or rotate it.");
      };

      const onPathCreated = (event: { path?: FabricObject }) => {
        const path = event.path;
        if (!path) return;
        const current = settingsRef.current;
        if (current.tool === "eraser") {
          path.set({
            globalCompositeOperation: "destination-out",
            opacity: 1,
            selectable: false,
            evented: false,
          });
        } else if (current.tool === "highlight") {
          path.set({ opacity: Math.min(0.45, current.opacity) });
        } else {
          path.set({ opacity: current.opacity });
        }
        const metadata = ensureObjectMetadata(path, current.tool === "highlight" ? "Highlight" : current.tool === "eraser" ? "Eraser stroke" : "Drawing");
        if (current.tool === "eraser") metadata.paintLocked = true;
        path.setCoords();
        canvas.requestRenderAll();
        recordHistory();
      };

      const onTextChanged = () => {
        if (textHistoryTimerRef.current) clearTimeout(textHistoryTimerRef.current);
        textHistoryTimerRef.current = setTimeout(recordHistory, 350);
      };

      canvas.on("mouse:down", onMouseDown);
      canvas.on("mouse:move", onMouseMove);
      canvas.on("mouse:up", onMouseUp);
      canvas.on("path:created", onPathCreated);
      const onObjectModified = () => {
        recordHistory();
        syncSelection();
      };

      canvas.on("object:modified", onObjectModified);
      canvas.on("selection:created", syncSelection);
      canvas.on("selection:updated", syncSelection);
      canvas.on("selection:cleared", syncSelection);
      canvas.on("text:changed", onTextChanged);

      let recovered = false;
      let recoveryFailed = false;
      const recoverySnapshot = await loadRecoverySnapshot();
      if (recoverySnapshot) {
        try {
          await restoreSnapshot(recoverySnapshot, { autosave: false });
          recovered = true;
        } catch {
          recoveryFailed = true;
          canvas.discardActiveObject();
          canvas.remove(...canvas.getObjects());
          canvasSizeRef.current = { ...DEFAULT_CANVAS_SIZE };
          backgroundRef.current = { ...DEFAULT_BACKGROUND };
          setCanvasSizeState({ ...DEFAULT_CANVAS_SIZE });
          setBackgroundState({ ...DEFAULT_BACKGROUND });
          canvas.setDimensions(DEFAULT_CANVAS_SIZE);
          canvas.requestRenderAll();
        }
      }

      historyRef.current = [serializeCanvas(canvas)];
      futureRef.current = [];
      enableAutosave();
      if (recoveryFailed) scheduleAutosave(historyRef.current[0]);
      syncHistoryFlags();
      syncObjects();
      configureTool(settingsRef.current);
      setReady(true);
      setStatus(
        recovered
          ? "Recovered your last local drawing."
          : recoveryFailed
            ? "The previous local autosave could not be restored. Started with a blank canvas instead."
            : "Ready. Draw, highlight, add text, drop an image, or hide sensitive regions locally.",
      );
      requestAnimationFrame(() => {
        const viewport = viewportRef.current;
        if (!viewport || disposed) return;
        const initialZoom = fitZoom(
          Math.max(100, viewport.clientWidth - 32),
          Math.max(100, viewport.clientHeight - 32),
          canvasSizeRef.current.width,
          canvasSizeRef.current.height,
        );
        zoomRef.current = initialZoom;
        applyCssZoom(canvas, initialZoom, canvasSizeRef.current);
        setZoomState(initialZoom);
      });
    })().catch(() => {
      setStatus("The drawing engine could not be loaded.");
    });

    return () => {
      disposed = true;
      if (textHistoryTimerRef.current) clearTimeout(textHistoryTimerRef.current);
      cancelAutosave();
      canvasRef.current = null;
      fabricRef.current = null;
      if (editor) void editor.dispose();
    };
  }, [addPrivacyRegion, addTextAt, cancelAutosave, configureTool, enableAutosave, loadRecoverySnapshot, recordHistory, restoreSnapshot, scheduleAutosave, serializeCanvas, syncHistoryFlags, syncObjects, syncSelection]);

  usePaintShortcuts({
    workspaceRef,
    canvasRef,
    onPasteImage: (file) => void importImageFile(file),
    undo,
    redo,
    duplicateSelection,
    deleteSelection,
    selectAll,
    nudgeSelection,
    zoomIn,
    zoomOut,
    resetView,
    syncSelection,
  });

  return {
    canvasElementRef,
    workspaceRef,
    viewportRef,
    fileInputRef,
    projectInputRef,
    settings,
    updateSetting,
    selectBrushPreset,
    selectTool,
    applyStarter,
    background,
    setBackground,
    canvasSize,
    resizeCanvas,
    objects,
    saveState,
    exportFormat,
    setExportFormat,
    zoom,
    status,
    ready,
    canUndo,
    canRedo,
    selected,
    undo,
    redo,
    zoomIn,
    zoomOut,
    fitToViewport,
    resetView,
    openImagePicker: () => fileInputRef.current?.click(),
    openProjectPicker: () => projectInputRef.current?.click(),
    handleFileInput,
    handleProjectInput,
    saveProject,
    newDrawing,
    handleDrop,
    download,
    duplicateSelection,
    deleteSelection,
    selectAll,
    groupSelection,
    ungroupSelection,
    alignSelection,
    distributeSelection,
    flipSelection,
    bringToFront,
    sendToBack,
    selectObject,
    toggleObjectSelection,
    renameObject,
    toggleObjectVisibility,
    toggleObjectLock,
    moveObject,
    updateSelectedObject,
    blurSelectedImage: () => applySelectedImageEffect("blur"),
    pixelateSelectedImage: () => applySelectedImageEffect("pixelate"),
    resetSelectedImageEffects: () => applySelectedImageEffect("none"),
    clearCanvas,
  };
}
