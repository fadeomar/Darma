import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export type ViewportPan = { x: number; y: number };
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const ZOOM_STEP = 0.25;

export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return MIN_ZOOM;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
}

export function clampPan(pan: ViewportPan, zoom: number, width: number, height: number): ViewportPan {
  if (zoom <= 1 || width <= 0 || height <= 0) return { x: 0, y: 0 };
  const maxX = (width * (zoom - 1)) / 2;
  const maxY = (height * (zoom - 1)) / 2;
  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y)),
  };
}

export function rescalePanForZoom(pan: ViewportPan, currentZoom: number, nextZoom: number): ViewportPan {
  if (nextZoom <= MIN_ZOOM || currentZoom <= MIN_ZOOM) return { x: 0, y: 0 };
  const scale = (nextZoom - 1) / (currentZoom - 1);
  return { x: pan.x * scale, y: pan.y * scale };
}

export function useViewport() {
  const [zoom, setZoomState] = useState(MIN_ZOOM);
  const [pan, setPan] = useState<ViewportPan>({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; pan: ViewportPan } | null>(null);

  const zoomIn = useCallback(() => setZoomState((current) => clampZoom(current + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => {
    setZoomState((current) => {
      const next = clampZoom(current - ZOOM_STEP);
      if (next === MIN_ZOOM) {
        setPan({ x: 0, y: 0 });
        setPanMode(false);
      } else {
        setPan((currentPan) => rescalePanForZoom(currentPan, current, next));
      }
      return next;
    });
  }, []);

  const resetView = useCallback(() => {
    setZoomState(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
    setPanMode(false);
    dragRef.current = null;
  }, []);

  const beginPan = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!panMode || zoom <= MIN_ZOOM) return false;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        pan,
      };
      return true;
    },
    [pan, panMode, zoom],
  );

  const movePan = useCallback(
    (event: ReactPointerEvent<HTMLElement>, width: number, height: number) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      setPan(
        clampPan(
          {
            x: drag.pan.x + event.clientX - drag.startX,
            y: drag.pan.y + event.clientY - drag.startY,
          },
          zoom,
          width,
          height,
        ),
      );
    },
    [zoom],
  );

  const endPan = useCallback((event?: ReactPointerEvent<HTMLElement>) => {
    if (event && dragRef.current?.pointerId === event.pointerId && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }, []);

  return {
    zoom,
    pan,
    panMode,
    setPanMode,
    zoomIn,
    zoomOut,
    resetView,
    beginPan,
    movePan,
    endPan,
  };
}
