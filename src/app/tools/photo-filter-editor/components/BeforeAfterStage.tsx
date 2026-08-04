"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Eye, EyeOff, Hand, Maximize2, Minus, Plus, RotateCcw, SplitSquareVertical, Upload } from "lucide-react";
import { Button } from "@/components/ui";
import { getActiveRasterAdjustments } from "../lib/adjustments";
import { FULL_CROP, getOrientedDimensions } from "../lib/crop";
import { createBeforeAdjustments, renderPhotoToCanvas } from "../lib/renderPipeline";
import type { LoadedPhoto, NormalizedCrop, PhotoEditState, PreviewSettings } from "../types";
import { CropOverlay } from "./CropOverlay";

const PREVIEW_PIXEL_BUDGET = 2_500_000;
const RASTER_PREVIEW_PIXEL_BUDGET = 900_000;

function getBackgroundClass(background: PreviewSettings["background"]) {
  if (background === "light") return "bg-white";
  if (background === "dark") return "bg-slate-900";
  return "bg-[var(--color-surface-subtle)] [background-image:repeating-conic-gradient(var(--color-border-subtle)_0%_25%,transparent_0%_50%)] [background-size:24px_24px]";
}

export function BeforeAfterStage({
  photo,
  edit,
  preview,
  cropEditing,
  pendingCrop,
  cropAspectRatio,
  zoom,
  pan,
  panMode,
  loading,
  onChooseImage,
  onDropFile,
  onComparisonPosition,
  onToggleComparison,
  onResetComparison,
  onToggleOverlays,
  onPendingCrop,
  onZoomIn,
  onZoomOut,
  onResetView,
  onSetZoom,
  onSetPan,
  onTogglePan,
  onRenderError,
}: {
  photo: LoadedPhoto | null;
  edit: PhotoEditState;
  preview: PreviewSettings;
  cropEditing: boolean;
  pendingCrop: NormalizedCrop;
  cropAspectRatio: number | null;
  zoom: number;
  pan: { x: number; y: number };
  panMode: boolean;
  loading: boolean;
  onChooseImage: () => void;
  onDropFile: (file: File | null | undefined) => void;
  onComparisonPosition: (position: number) => void;
  onToggleComparison: () => void;
  onResetComparison: () => void;
  onToggleOverlays: () => void;
  onPendingCrop: (crop: NormalizedCrop) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onSetZoom: (zoom: number) => void;
  onSetPan: (pan: { x: number; y: number }) => void;
  onTogglePan: () => void;
  onRenderError: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const beforeRef = useRef<HTMLCanvasElement | null>(null);
  const afterRef = useRef<HTMLCanvasElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 720, height: 480 });
  const [dragOver, setDragOver] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; clientX: number; clientY: number } | null>(null);
  const compareDragRef = useRef(false);
  const renderErrorRef = useRef(false);

  const renderCrop = cropEditing ? FULL_CROP : edit.crop;
  const sourceDimensions = photo ? getOrientedDimensions(photo.previewWidth, photo.previewHeight, edit.orientation) : { width: 4, height: 3 };
  const aspect = cropEditing
    ? sourceDimensions.width / sourceDimensions.height
    : (sourceDimensions.width * renderCrop.width) / (sourceDimensions.height * renderCrop.height);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const observer = new ResizeObserver((entries) => {
      const width = Math.max(1, (entries[0]?.contentRect.width ?? root.clientWidth) - 32);
      const maxHeight = Math.min(680, Math.max(300, window.innerHeight * 0.64));
      let renderWidth = width;
      let renderHeight = renderWidth / aspect;
      if (renderHeight > maxHeight) {
        renderHeight = maxHeight;
        renderWidth = renderHeight * aspect;
      }
      setStageSize({ width: Math.floor(renderWidth), height: Math.floor(renderHeight) });
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [aspect]);

  useEffect(() => {
    if (!photo || !beforeRef.current || !afterRef.current) return;
    const frame = requestAnimationFrame(() => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      let width = Math.max(1, Math.round(stageSize.width * ratio));
      let height = Math.max(1, Math.round(stageSize.height * ratio));
      const pixels = width * height;
      const pixelBudget = getActiveRasterAdjustments(edit.adjustments).length > 0 ? RASTER_PREVIEW_PIXEL_BUDGET : PREVIEW_PIXEL_BUDGET;
      if (pixels > pixelBudget) {
        const scale = Math.sqrt(pixelBudget / pixels);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }
      const common = {
        source: photo.preview,
        sourceWidth: photo.previewWidth,
        sourceHeight: photo.previewHeight,
        outputWidth: width,
        outputHeight: height,
        orientation: edit.orientation,
        crop: renderCrop,
      };
      try {
        renderPhotoToCanvas(beforeRef.current!, { ...common, adjustments: createBeforeAdjustments() });
        renderPhotoToCanvas(afterRef.current!, { ...common, adjustments: edit.adjustments });
        renderErrorRef.current = false;
      } catch {
        if (!renderErrorRef.current) {
          renderErrorRef.current = true;
          onRenderError();
        }
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [photo, edit.adjustments, edit.orientation, onRenderError, renderCrop, stageSize]);

  const setComparisonFromPointer = useCallback((event: ReactPointerEvent) => {
    const rect = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;
    onComparisonPosition(Math.min(100, Math.max(0, ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100)));
  }, [onComparisonPosition]);

  const imageInfo = photo ? `${photo.info.width}×${photo.info.height}` : "No image";

  return (
    <section className="min-w-0" aria-label="Photo preview stage">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-2">
        <div className="flex flex-wrap items-center gap-1">
          <Button size="icon" variant="ghost" leftIcon={<Minus className="h-4 w-4" />} onClick={onZoomOut} disabled={zoom <= 0.25} aria-label="Zoom out" title="Zoom out">Zoom out</Button>
          <span className="min-w-12 text-center text-xs font-bold tabular-nums text-[var(--color-text-secondary)]">{Math.round(zoom * 100)}%</span>
          <Button size="icon" variant="ghost" leftIcon={<Plus className="h-4 w-4" />} onClick={onZoomIn} disabled={zoom >= 8} aria-label="Zoom in" title="Zoom in">Zoom in</Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const pixelWidth = sourceDimensions.width * renderCrop.width;
              const pixelHeight = sourceDimensions.height * renderCrop.height;
              onSetZoom(Math.max(pixelWidth / Math.max(1, stageSize.width), pixelHeight / Math.max(1, stageSize.height)));
            }}
            disabled={!photo}
            aria-label="View image at one hundred percent"
            title="One image pixel per screen pixel, within the zoom limit"
          >
            1:1
          </Button>
          <Button size="icon" variant="ghost" leftIcon={<Maximize2 className="h-4 w-4" />} onClick={onResetView} aria-label="Fit image to stage" title="Fit to screen">Fit</Button>
          <Button size="icon" variant={panMode ? "soft" : "ghost"} leftIcon={<Hand className="h-4 w-4" />} onClick={onTogglePan} disabled={zoom <= 1} aria-pressed={panMode} aria-label="Toggle pan mode" title={zoom <= 1 ? "Zoom in to pan" : "Toggle pan mode"}>Pan</Button>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Button size="icon" variant={preview.comparisonEnabled ? "soft" : "ghost"} leftIcon={<SplitSquareVertical className="h-4 w-4" />} onClick={onToggleComparison} aria-pressed={preview.comparisonEnabled} aria-label="Toggle before and after comparison" title="Before and after">Compare</Button>
          <Button size="icon" variant="ghost" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={onResetComparison} disabled={!preview.comparisonEnabled || preview.comparisonPosition === 50} aria-label="Center before and after comparison" title="Center comparison">Center comparison</Button>
          <Button size="icon" variant={preview.showOverlays ? "soft" : "ghost"} leftIcon={preview.showOverlays ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} onClick={onToggleOverlays} aria-pressed={preview.showOverlays} aria-label="Toggle editing overlays" title="Preview overlays">Overlays</Button>
          <span className="px-2 text-xs text-[var(--color-text-tertiary)]">{imageInfo}</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`relative flex min-h-[320px] w-full min-w-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] p-2 sm:p-4 ${getBackgroundClass(preview.background)} ${panMode ? "cursor-grab active:cursor-grabbing" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => { event.preventDefault(); setDragOver(false); onDropFile(event.dataTransfer.files?.[0]); }}
        onPointerDown={(event) => {
          if (!panMode || zoom <= 1) return;
          panStartRef.current = { x: pan.x, y: pan.y, clientX: event.clientX, clientY: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const start = panStartRef.current;
          if (!start) return;
          onSetPan({ x: start.x + event.clientX - start.clientX, y: start.y + event.clientY - start.clientY });
        }}
        onPointerUp={(event) => { panStartRef.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
        onPointerCancel={() => { panStartRef.current = null; }}
        onLostPointerCapture={() => { panStartRef.current = null; }}
        style={{ touchAction: panMode ? "none" : "auto" }}
      >
        {photo ? (
          <div
            className="relative max-w-full shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-transparent shadow-[var(--shadow-md)]"
            style={{ width: stageSize.width, height: stageSize.height, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "center" }}
          >
            <canvas ref={beforeRef} className="absolute inset-0 h-full w-full" aria-label="Original image preview" />
            <canvas
              ref={afterRef}
              className="absolute inset-0 h-full w-full"
              aria-label="Adjusted image preview"
              style={{ clipPath: preview.comparisonEnabled && !cropEditing ? `inset(0 ${100 - preview.comparisonPosition}% 0 0)` : undefined }}
            />
            {preview.comparisonEnabled && preview.showOverlays && !cropEditing ? (
              <div
                className="absolute inset-y-0 z-10 w-1 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,.45)]"
                style={{ left: `${preview.comparisonPosition}%`, touchAction: "none" }}
                role="slider"
                tabIndex={0}
                aria-label="Before and after comparison position"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(preview.comparisonPosition)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                    event.preventDefault();
                    onComparisonPosition(Math.min(100, Math.max(0, preview.comparisonPosition + (event.key === "ArrowRight" ? 2 : -2))));
                  }
                  if (event.key === "Home") { event.preventDefault(); onComparisonPosition(0); }
                  if (event.key === "End") { event.preventDefault(); onComparisonPosition(100); }
                }}
                onPointerDown={(event) => { event.stopPropagation(); compareDragRef.current = true; event.currentTarget.setPointerCapture(event.pointerId); setComparisonFromPointer(event); }}
                onPointerMove={(event) => { event.stopPropagation(); if (compareDragRef.current) setComparisonFromPointer(event); }}
                onPointerUp={(event) => { event.stopPropagation(); compareDragRef.current = false; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
                onPointerCancel={(event) => { event.stopPropagation(); compareDragRef.current = false; }}
                onLostPointerCapture={() => { compareDragRef.current = false; }}
              >
                <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[var(--color-primary)] shadow-md"><SplitSquareVertical className="h-4 w-4 text-white" /></span>
              </div>
            ) : null}
            {preview.showOverlays && preview.comparisonEnabled && !cropEditing ? (
              <>
                <span className="absolute left-2 top-2 rounded bg-black/65 px-2 py-1 text-xs font-bold text-white">Before</span>
                <span className="absolute right-2 top-2 rounded bg-black/65 px-2 py-1 text-xs font-bold text-white">After</span>
              </>
            ) : null}
            {cropEditing && preview.showOverlays ? <CropOverlay crop={pendingCrop} aspectRatio={cropAspectRatio} onChange={onPendingCrop} /> : null}
          </div>
        ) : (
          <div className="flex max-w-sm flex-col items-center gap-3 px-4 text-center">
            <Upload className="h-9 w-9 text-[var(--color-text-tertiary)]" />
            <div>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">Load a photo to start</p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">Choose, drop, or paste a supported image. Processing stays in this browser.</p>
            </div>
            <Button onClick={onChooseImage}>Choose image</Button>
          </div>
        )}
        {dragOver ? <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[var(--color-surface-base)]/85 text-sm font-black text-[var(--color-text-primary)]">Drop image to replace</div> : null}
        {loading ? <div className="absolute inset-0 z-40 flex items-center justify-center bg-[var(--color-surface-base)]/75 text-sm font-black"><RotateCcw className="mr-2 h-4 w-4 animate-spin" /> Decoding image…</div> : null}
      </div>
      <p className="mt-2 text-center text-xs leading-4 text-[var(--color-text-tertiary)]">Use the comparison handle to inspect changes. Zoom and pan affect only the view, never the exported pixels.</p>
    </section>
  );
}
