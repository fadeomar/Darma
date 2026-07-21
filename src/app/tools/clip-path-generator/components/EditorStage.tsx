"use client";

import { useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { Grid3X3, Hand, Magnet, Maximize2, MousePointer2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui";
import { MAX_POINTS } from "../clipPath";
import { getAspectRatioValue } from "../studio";
import type { ClipPathStudioSettings, ClipPoint, PreviewShape } from "../types";
import type { ViewportPan } from "../hooks/useViewport";

export function EditorStage({
  points,
  selected,
  clipValue,
  imageUrl,
  previewShape,
  settings,
  zoom,
  pan,
  panMode,
  canZoomIn,
  canZoomOut,
  isDragOver,
  stageRef,
  artboardRef,
  onZoomIn,
  onZoomOut,
  onResetView,
  onTogglePanMode,
  onToggleGrid,
  onToggleSnap,
  onStageKeyDown,
  onSelectPoint,
  onVertexPointerDown,
  onVertexPointerMove,
  onVertexPointerEnd,
  onFinishDrag,
  onInsertEdge,
  onPanPointerDown,
  onPanPointerMove,
  onPanPointerEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  points: ClipPoint[];
  selected: number | null;
  clipValue: string;
  imageUrl: string | null;
  previewShape: PreviewShape;
  settings: ClipPathStudioSettings;
  zoom: number;
  pan: ViewportPan;
  panMode: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
  isDragOver: boolean;
  stageRef: RefObject<HTMLDivElement | null>;
  artboardRef: RefObject<HTMLDivElement | null>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onTogglePanMode: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onStageKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onSelectPoint: (index: number) => void;
  onVertexPointerDown: (event: ReactPointerEvent<SVGCircleElement>, index: number) => void;
  onVertexPointerMove: (event: ReactPointerEvent<SVGCircleElement>, index: number) => void;
  onVertexPointerEnd: (event: ReactPointerEvent<SVGCircleElement>) => void;
  onFinishDrag: () => void;
  onInsertEdge: (index: number) => void;
  onPanPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPanPointerMove: (event: ReactPointerEvent<HTMLDivElement>, width: number, height: number) => void;
  onPanPointerEnd: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
}) {
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
  const aspectRatio = getAspectRatioValue(settings.aspectRatio);
  const editable = settings.showHandles && !panMode;
  const stageBackground = settings.checkerboard
    ? "repeating-conic-gradient(var(--color-border-subtle) 0% 25%, transparent 0% 50%) 50% / 20px 20px"
    : settings.backgroundColor;
  const gridBackground = settings.showGrid
    ? `linear-gradient(to right, color-mix(in srgb, var(--color-text-primary) 13%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-text-primary) 13%, transparent) 1px, transparent 1px)`
    : undefined;
  const gridSize = settings.showGrid ? `${settings.snapSize}% ${settings.snapSize}%` : undefined;
  const imageStyle = { objectFit: settings.objectFit, objectPosition: settings.objectPosition } as const;
  const solidFill = "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)";
  const responsiveArtboardWidth = aspectRatio
    ? `min(100%, min(820px, calc(72vh * ${aspectRatio})))`
    : "min(100%, 820px)";

  return (
    <section className="min-w-0" aria-label="Editing stage">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-2">
        <div className="flex flex-wrap gap-1">
          <Button size="icon" variant="ghost" onClick={onZoomOut} disabled={!canZoomOut} aria-label="Zoom out" title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="flex min-w-14 items-center justify-center text-xs font-bold text-[var(--color-text-secondary)]" aria-label={`Zoom ${Math.round(zoom * 100)} percent`}>
            {Math.round(zoom * 100)}%
          </span>
          <Button size="icon" variant="ghost" onClick={onZoomIn} disabled={!canZoomIn} aria-label="Zoom in" title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onResetView} aria-label="Reset view" title="Reset view">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={panMode ? "soft" : "ghost"}
            onClick={onTogglePanMode}
            disabled={zoom <= 1}
            aria-pressed={panMode}
            aria-label="Toggle pan mode"
            title={zoom <= 1 ? "Zoom in to enable panning" : "Toggle pan mode"}
          >
            <Hand className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          <Button size="icon" variant={settings.showGrid ? "soft" : "ghost"} onClick={onToggleGrid} aria-pressed={settings.showGrid} aria-label="Toggle grid" title="Toggle grid">
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant={settings.snapEnabled ? "soft" : "ghost"} onClick={onToggleSnap} aria-pressed={settings.snapEnabled} aria-label="Toggle snapping" title="Toggle snapping">
            <Magnet className="h-4 w-4" />
          </Button>
          <span className="hidden items-center gap-1 px-2 text-xs text-[var(--color-text-tertiary)] sm:flex">
            {settings.showHandles ? <MousePointer2 className="h-3.5 w-3.5" /> : null}
            {settings.showHandles ? "Edit mode" : "Preview mode"}
          </span>
        </div>
      </div>

      <div
        ref={stageRef}
        className={`relative mx-auto flex w-full min-w-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-2 sm:p-4 ${panMode ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{ minHeight: settings.aspectRatio === "9:16" ? 420 : 340 }}
        onPointerDown={onPanPointerDown}
        onPointerMove={(event) => {
          const artboard = artboardRef.current;
          const fallbackRect = event.currentTarget.getBoundingClientRect();
          onPanPointerMove(event, artboard?.offsetWidth ?? fallbackRect.width, artboard?.offsetHeight ?? fallbackRect.height);
        }}
        onPointerUp={onPanPointerEnd}
        onPointerCancel={onPanPointerEnd}
        onLostPointerCapture={onPanPointerEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div
          ref={artboardRef}
          role="application"
          tabIndex={0}
          aria-label="Clip path editing canvas. Select a point and use arrow keys to move it, or Delete to remove it."
          aria-describedby="clip-selected-point-description"
          onKeyDown={onStageKeyDown}
          className={`relative max-h-[72vh] max-w-full shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-default)] shadow-[var(--shadow-md)] outline-none focus-visible:shadow-[var(--focus-ring)] ${settings.aspectRatio === "free" ? "h-[clamp(300px,55vh,620px)]" : ""}`}
          style={{
            aspectRatio: aspectRatio ?? undefined,
            width: responsiveArtboardWidth,
            background: stageBackground,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center",
            touchAction: panMode ? "none" : "auto",
          }}
        >
          {settings.showGrid ? (
            <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: gridBackground, backgroundSize: gridSize }} aria-hidden="true" />
          ) : null}

          {settings.showGhost ? (
            <div className="pointer-events-none absolute inset-0 opacity-20" style={{ background: previewShape === "image" && imageUrl ? undefined : solidFill }} aria-hidden="true">
              {previewShape === "image" && imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="h-full w-full" style={imageStyle} />
              ) : null}
            </div>
          ) : null}

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: previewShape === "image" && imageUrl ? undefined : solidFill,
              WebkitClipPath: clipValue,
              clipPath: clipValue,
            }}
            aria-hidden="true"
          >
            {previewShape === "image" && imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="h-full w-full" style={imageStyle} />
            ) : null}
          </div>

          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" role="presentation" style={{ pointerEvents: editable ? "auto" : "none" }}>
            {settings.showOutline ? (
              <polygon points={points.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="var(--color-primary)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
            ) : null}
            {points.map((point, index) => {
              const next = points[(index + 1) % points.length];
              return (
                <g key={`edge-${index}`}>
                  {hoveredEdge === index && points.length < MAX_POINTS ? (
                    <line x1={point.x} y1={point.y} x2={next.x} y2={next.y} stroke="var(--color-primary)" strokeWidth={3} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" pointerEvents="none" />
                  ) : null}
                  <line
                    x1={point.x}
                    y1={point.y}
                    x2={next.x}
                    y2={next.y}
                    stroke="transparent"
                    strokeWidth={14}
                    vectorEffect="non-scaling-stroke"
                    style={{ cursor: points.length < MAX_POINTS ? "copy" : "not-allowed", touchAction: "none" }}
                    onPointerEnter={() => setHoveredEdge(index)}
                    onPointerLeave={() => setHoveredEdge(null)}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onInsertEdge(index);
                    }}
                  />
                </g>
              );
            })}
            {points.map((point, index) => (
              <g key={`point-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={7}
                  fill="transparent"
                  stroke="transparent"
                  style={{ cursor: "grab", touchAction: "none" }}
                  onPointerDown={(event) => {
                    onSelectPoint(index);
                    onVertexPointerDown(event, index);
                  }}
                  onPointerMove={(event) => onVertexPointerMove(event, index)}
                  onPointerUp={onVertexPointerEnd}
                  onPointerCancel={onVertexPointerEnd}
                  onLostPointerCapture={onFinishDrag}
                />
                {selected === index ? (
                  <circle cx={point.x} cy={point.y} r={3.6} fill="none" stroke="var(--color-primary)" strokeWidth={2.5} vectorEffect="non-scaling-stroke" pointerEvents="none" />
                ) : null}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={selected === index ? 2.2 : 1.7}
                  fill={selected === index ? "var(--color-primary)" : "var(--color-surface-base)"}
                  stroke="var(--color-primary)"
                  strokeWidth={1.2}
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
                />
                {settings.showPointLabels ? (
                  <g pointerEvents="none">
                    <circle cx={point.x + 3.2} cy={point.y - 3.2} r={2.6} fill="var(--color-surface-raised)" stroke="var(--color-border-strong)" strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
                    <text x={point.x + 3.2} y={point.y - 2.45} textAnchor="middle" fontSize={2.4} fontWeight={800} fill="var(--color-text-primary)">
                      {index + 1}
                    </text>
                  </g>
                ) : null}
              </g>
            ))}
          </svg>

          {isDragOver ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--color-surface-base)]/80 text-sm font-bold text-[var(--color-text-primary)]">
              Drop image to preview
            </div>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-center text-xs leading-5 text-[var(--color-text-tertiary)]">
        Click an edge to insert · drag points to shape · arrow keys move the selected point · Shift = 5% · Alt = 0.5%
      </p>
    </section>
  );
}
