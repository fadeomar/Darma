"use client";

import { useCallback, useState } from "react";
import { PHOTO_ZOOM_STEP, clampZoom, scalePanForZoom } from "../lib/viewport";

export { MAX_PHOTO_ZOOM, MIN_PHOTO_ZOOM, clampZoom, scalePanForZoom } from "../lib/viewport";

export function usePhotoViewport() {
  const [zoom, setZoomState] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);

  const updateZoom = useCallback((resolve: (current: number) => number) => {
    setZoomState((current) => {
      const next = clampZoom(resolve(current));
      setPan((currentPan) => next <= 1 ? { x: 0, y: 0 } : scalePanForZoom(currentPan, current, next));
      if (next <= 1) setPanMode(false);
      return next;
    });
  }, []);

  const setZoom = useCallback((value: number) => updateZoom(() => value), [updateZoom]);
  const zoomIn = useCallback(() => updateZoom((current) => current + PHOTO_ZOOM_STEP), [updateZoom]);
  const zoomOut = useCallback(() => updateZoom((current) => current - PHOTO_ZOOM_STEP), [updateZoom]);
  const resetView = useCallback(() => {
    setZoomState(1);
    setPan({ x: 0, y: 0 });
    setPanMode(false);
  }, []);

  return { zoom, pan, panMode, setZoom, zoomIn, zoomOut, setPan, setPanMode, resetView };
}
