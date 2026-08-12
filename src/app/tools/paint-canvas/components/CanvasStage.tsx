"use client";

import { useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import type { CanvasBackground, CanvasSize, PaintSettings } from "../types";
import { isFreeDrawingTool } from "../types";

const CHECKERBOARD =
  "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)";

type CursorPoint = { x: number; y: number } | null;

export default function CanvasStage({ canvasRef, viewportRef, ready, status, zoom, background, size, settings, onDrop }: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
  ready: boolean;
  status: string;
  zoom: number;
  background: CanvasBackground;
  size: CanvasSize;
  settings: PaintSettings;
  onDrop: (event: ReactDragEvent<HTMLDivElement>) => void;
}) {
  const [cursorPoint, setCursorPoint] = useState<CursorPoint>(null);
  const scaledWidth = Math.round(size.width * zoom);
  const scaledHeight = Math.round(size.height * zoom);
  const artboardStyle = background.mode === "transparent"
    ? { backgroundColor: "#ffffff", backgroundImage: CHECKERBOARD, backgroundSize: "20px 20px", backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px" }
    : { backgroundColor: background.color };
  const showBrushCursor = ready && isFreeDrawingTool(settings.tool) && cursorPoint;
  const cursorDiameter = Math.max(6, Math.min(120, (settings.tool === "highlight" ? Math.max(12, settings.size) : settings.size) * zoom));

  const trackPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const overCanvas = target instanceof HTMLCanvasElement || Boolean(target.closest(".canvas-container"));
    if (!isFreeDrawingTool(settings.tool) || !overCanvas) {
      setCursorPoint(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setCursorPoint({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  return (
    <main className="min-w-0 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3 sm:p-5" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
        <span>{ready ? status : "Preparing the browser-only editor…"}</span>
        <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-2.5 py-1 font-semibold">{size.width} × {size.height} · {background.mode === "transparent" ? "transparent" : "solid"} · local only</span>
      </div>
      <div
        ref={viewportRef}
        className="relative min-h-[420px] max-h-[72vh] overflow-auto rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[#d8dde6] p-4 shadow-inner"
        onPointerMove={trackPointer}
        onPointerLeave={() => setCursorPoint(null)}
      >
        {showBrushCursor && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute z-30 rounded-full border border-black/50 shadow-[0_0_0_1px_rgba(255,255,255,0.8)]"
            style={{
              left: cursorPoint.x,
              top: cursorPoint.y,
              width: cursorDiameter,
              height: cursorDiameter,
              transform: "translate(-50%, -50%)",
              backgroundColor: settings.tool === "eraser" ? "transparent" : settings.color,
              opacity: settings.tool === "highlight" ? Math.min(0.45, settings.opacity) : settings.tool === "eraser" ? 1 : Math.min(0.3, settings.opacity),
            }}
          />
        )}
        <div className="mx-auto w-max">
          <div className="overflow-hidden rounded-sm shadow-[var(--shadow-md)]" style={{ ...artboardStyle, width: scaledWidth, height: scaledHeight }}>
            <canvas ref={canvasRef} aria-label="Paint and annotation canvas" />
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-tertiary)]"><span>Paste or drag an image directly into the workspace.</span><span>Autosave stays in this browser.</span><span>Pen pressure works automatically with supported styluses.</span><span>Ctrl/Cmd+Z undo</span></div>
    </main>
  );
}
