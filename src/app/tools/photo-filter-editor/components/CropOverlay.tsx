"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { previewPointToCropCoordinates, updateCropFromHandle } from "../lib/crop";
import type { CropHandle, NormalizedCrop } from "../types";

const HANDLES: Array<{ handle: CropHandle; label: string; className: string }> = [
  { handle: "nw", label: "Resize crop from top left", className: "left-0 top-0 cursor-nwse-resize" },
  { handle: "n", label: "Resize crop from top", className: "left-1/2 top-0 -translate-x-1/2 cursor-ns-resize" },
  { handle: "ne", label: "Resize crop from top right", className: "right-0 top-0 cursor-nesw-resize" },
  { handle: "e", label: "Resize crop from right", className: "right-0 top-1/2 -translate-y-1/2 cursor-ew-resize" },
  { handle: "se", label: "Resize crop from bottom right", className: "bottom-0 right-0 cursor-nwse-resize" },
  { handle: "s", label: "Resize crop from bottom", className: "bottom-0 left-1/2 -translate-x-1/2 cursor-ns-resize" },
  { handle: "sw", label: "Resize crop from bottom left", className: "bottom-0 left-0 cursor-nesw-resize" },
  { handle: "w", label: "Resize crop from left", className: "left-0 top-1/2 -translate-y-1/2 cursor-ew-resize" },
];

export function CropOverlay({
  crop,
  aspectRatio,
  onChange,
}: {
  crop: NormalizedCrop;
  aspectRatio: number | null;
  onChange: (crop: NormalizedCrop) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ handle: CropHandle; startCrop: NormalizedCrop; startX: number; startY: number } | null>(null);

  function startDrag(event: ReactPointerEvent, handle: CropHandle) {
    event.preventDefault();
    event.stopPropagation();
    const rect = rootRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const point = previewPointToCropCoordinates(event.clientX, event.clientY, rect);
    dragRef.current = { handle, startCrop: { ...crop }, startX: point.x, startY: point.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent) {
    const drag = dragRef.current;
    const rect = rootRef.current?.parentElement?.getBoundingClientRect();
    if (!drag || !rect) return;
    event.preventDefault();
    const point = previewPointToCropCoordinates(event.clientX, event.clientY, rect);
    onChange(updateCropFromHandle(drag.startCrop, drag.handle, point.x - drag.startX, point.y - drag.startY, aspectRatio));
  }

  function endDrag(event: ReactPointerEvent) {
    if (dragRef.current && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-label="Crop editor">
      <div className="absolute left-0 right-0 top-0 bg-black/55" style={{ height: `${crop.y * 100}%` }} />
      <div className="absolute bottom-0 left-0 right-0 bg-black/55" style={{ top: `${(crop.y + crop.height) * 100}%` }} />
      <div className="absolute left-0 bg-black/55" style={{ top: `${crop.y * 100}%`, width: `${crop.x * 100}%`, height: `${crop.height * 100}%` }} />
      <div className="absolute right-0 bg-black/55" style={{ top: `${crop.y * 100}%`, left: `${(crop.x + crop.width) * 100}%`, height: `${crop.height * 100}%` }} />
      <div
        ref={rootRef}
        className="pointer-events-auto absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.6)]"
        style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.width * 100}%`, height: `${crop.height * 100}%`, touchAction: "none" }}
        role="group"
        tabIndex={0}
        aria-label={`Crop area, ${Math.round(crop.width * 100)} by ${Math.round(crop.height * 100)} percent`}
        onPointerDown={(event) => startDrag(event, "move")}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.02 : 0.005;
          const delta = event.key === "ArrowLeft" ? { x: -step, y: 0 }
            : event.key === "ArrowRight" ? { x: step, y: 0 }
              : event.key === "ArrowUp" ? { x: 0, y: -step }
                : event.key === "ArrowDown" ? { x: 0, y: step }
                  : null;
          if (!delta) return;
          event.preventDefault();
          onChange(updateCropFromHandle(crop, "move", delta.x, delta.y, aspectRatio));
        }}
      >
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, index) => <span key={index} className="border border-white/35" />)}
        </div>
        {HANDLES.map(({ handle, label, className }) => (
          <button
            key={handle}
            type="button"
            aria-label={label}
            className={`absolute h-10 w-10 rounded-full bg-transparent outline-none focus-visible:shadow-[var(--focus-ring)] ${className}`}
            style={{ touchAction: "none" }}
            onPointerDown={(event) => startDrag(event, handle)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
          >
            <span className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--color-primary)] shadow-md" />
          </button>
        ))}
      </div>
    </div>
  );
}
