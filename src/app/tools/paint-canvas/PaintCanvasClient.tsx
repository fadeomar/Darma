"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  Brush,
  Circle as CircleIcon,
  Download,
  Eraser,
  Minus,
  Redo2,
  Square,
  Trash2,
  Triangle as TriangleIcon,
  Undo2,
} from "lucide-react";
import { Button, Select } from "@/components/ui";
import {
  clampBrush,
  createDefaultSettings,
  drawShape,
  getCanvasPoint,
  MAX_BRUSH,
  MIN_BRUSH,
} from "./draw";
import type { ExportFormat, PaintSettings, PaintTool, Point } from "./types";
import { isShapeTool } from "./types";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const HISTORY_LIMIT = 40;
const BACKGROUND = "#ffffff";

const SWATCHES = ["#000000", "#ffffff", "#ef4444", "#f97316", "#eab308", "#22c55e", "#2563eb", "#7c3aed", "#ec4899", "#78716c"];

const TOOLS: { tool: PaintTool; label: string; icon: React.ReactNode }[] = [
  { tool: "brush", label: "Brush", icon: <Brush className="h-4 w-4" /> },
  { tool: "eraser", label: "Eraser", icon: <Eraser className="h-4 w-4" /> },
  { tool: "line", label: "Line", icon: <Minus className="h-4 w-4" /> },
  { tool: "rectangle", label: "Rectangle", icon: <Square className="h-4 w-4" /> },
  { tool: "circle", label: "Circle", icon: <CircleIcon className="h-4 w-4" /> },
  { tool: "triangle", label: "Triangle", icon: <TriangleIcon className="h-4 w-4" /> },
];

export default function PaintCanvasClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const startPoint = useRef<Point | null>(null);
  const strokeSnapshot = useRef<ImageData | null>(null);
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);

  const [settings, setSettings] = useState<PaintSettings>(createDefaultSettings);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [status, setStatus] = useState("Draw with your mouse, finger, or pen.");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const paintBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;
    paintBackground(ctx);
  }, [paintBackground]);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(past.current.length > 0);
    setCanRedo(future.current.length > 0);
  }, []);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    past.current.push(canvas.toDataURL());
    if (past.current.length > HISTORY_LIMIT) past.current.shift();
    future.current = [];
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  const restoreFromDataUrl = useCallback((url: string) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(img, 0, 0);
    };
    img.src = url;
  }, []);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || past.current.length === 0) return;
    const previous = past.current.pop()!;
    future.current.push(canvas.toDataURL());
    restoreFromDataUrl(previous);
    syncHistoryFlags();
    setStatus("Undo.");
  }, [restoreFromDataUrl, syncHistoryFlags]);

  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || future.current.length === 0) return;
    const next = future.current.pop()!;
    past.current.push(canvas.toDataURL());
    restoreFromDataUrl(next);
    syncHistoryFlags();
    setStatus("Redo.");
  }, [restoreFromDataUrl, syncHistoryFlags]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      pushHistory();

      const point = getCanvasPoint(canvas.getBoundingClientRect(), event.clientX, event.clientY, canvas);
      drawing.current = true;
      startPoint.current = point;
      strokeSnapshot.current = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const current = settingsRef.current;
      if (current.tool === "brush" || current.tool === "eraser") {
        ctx.strokeStyle = current.tool === "eraser" ? BACKGROUND : current.color;
        ctx.lineWidth = current.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(point.x + 0.01, point.y); // dot on click
        ctx.stroke();
      }
    },
    [pushHistory],
  );

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || !drawing.current || !startPoint.current) return;
    const point = getCanvasPoint(canvas.getBoundingClientRect(), event.clientX, event.clientY, canvas);
    const current = settingsRef.current;

    if (current.tool === "brush" || current.tool === "eraser") {
      ctx.strokeStyle = current.tool === "eraser" ? BACKGROUND : current.color;
      ctx.lineWidth = current.size;
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      return;
    }
    // Shape preview: restore the pre-drag snapshot, then draw the live shape.
    if (strokeSnapshot.current) ctx.putImageData(strokeSnapshot.current, 0, 0);
    drawShape(ctx, current.tool, startPoint.current, point, current);
  }, []);

  const endStroke = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !drawing.current) return;
    canvas.releasePointerCapture(event.pointerId);
    drawing.current = false;
    startPoint.current = null;
    strokeSnapshot.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    pushHistory();
    paintBackground(ctx);
    setStatus("Cleared the canvas.");
  }, [paintBackground, pushHistory]);

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mime = exportFormat === "png" ? "image/png" : "image/jpeg";
    const url = canvas.toDataURL(mime, 0.92);
    const link = document.createElement("a");
    link.href = url;
    link.download = `drawing.${exportFormat === "png" ? "png" : "jpg"}`;
    link.click();
    setStatus(`Downloaded drawing.${exportFormat === "png" ? "png" : "jpg"}.`);
  }, [exportFormat]);

  const update = <K extends keyof PaintSettings>(key: K, value: PaintSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
        <div className="flex flex-wrap gap-1.5">
          {TOOLS.map((item) => (
            <Button
              key={item.tool}
              size="sm"
              variant={settings.tool === item.tool ? "primary" : "secondary"}
              leftIcon={item.icon}
              onClick={() => update("tool", item.tool)}
              aria-pressed={settings.tool === item.tool}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="brush-size" className="text-xs font-bold text-[var(--color-text-secondary)]">
            Size
          </label>
          <input
            id="brush-size"
            type="range"
            className="w-28 accent-[var(--color-primary)]"
            min={MIN_BRUSH}
            max={MAX_BRUSH}
            value={settings.size}
            onChange={(event) => update("size", clampBrush(Number(event.target.value)))}
          />
          <span className="w-6 text-xs tabular-nums text-[var(--color-text-tertiary)]">{settings.size}</span>
        </div>

        {isShapeTool(settings.tool) && (
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={settings.fill} onChange={(event) => update("fill", event.target.checked)} />
            Fill
          </label>
        )}
      </div>

      {/* Colors */}
      <div className="flex flex-wrap items-center gap-2">
        {SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={`Color ${swatch}`}
            onClick={() => update("color", swatch)}
            className={`h-7 w-7 rounded-full border shadow-[var(--shadow-xs)] ${
              settings.color === swatch ? "ring-2 ring-[var(--color-primary)] ring-offset-2" : "border-[var(--color-border-subtle)]"
            }`}
            style={{ backgroundColor: swatch }}
          />
        ))}
        <label className="ml-1 inline-flex items-center gap-1 text-xs font-bold text-[var(--color-text-secondary)]">
          Custom
          <input
            type="color"
            value={settings.color}
            onChange={(event) => update("color", event.target.value)}
            className="h-7 w-9 cursor-pointer rounded border border-[var(--color-border-subtle)] bg-transparent"
          />
        </label>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        className="w-full touch-none rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-white shadow-[var(--shadow-sm)]"
        style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`, cursor: "crosshair" }}
      />

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" leftIcon={<Undo2 className="h-4 w-4" />} onClick={undo} disabled={!canUndo}>
          Undo
        </Button>
        <Button size="sm" variant="secondary" leftIcon={<Redo2 className="h-4 w-4" />} onClick={redo} disabled={!canRedo}>
          Redo
        </Button>
        <Button size="sm" variant="ghost" leftIcon={<Trash2 className="h-4 w-4" />} onClick={clearCanvas}>
          Clear
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Select width="short" value={exportFormat} onChange={(event) => setExportFormat(event.target.value as ExportFormat)}>
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
          </Select>
          <Button size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={download}>
            Download
          </Button>
        </div>
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {status}
      </div>
    </div>
  );
}
