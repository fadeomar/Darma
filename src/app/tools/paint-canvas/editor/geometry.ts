import { MAX_CANVAS_DIMENSION, MIN_CANVAS_DIMENSION } from "../constants";
import type { CanvasSize, Point } from "../types";

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2;
export const ZOOM_STEP = 0.1;

export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function clampCanvasSize(size: CanvasSize): CanvasSize {
  const normalize = (value: number) => {
    const finite = Number.isFinite(value) ? Math.round(value) : MIN_CANVAS_DIMENSION;
    return Math.min(MAX_CANVAS_DIMENSION, Math.max(MIN_CANVAS_DIMENSION, finite));
  };
  return { width: normalize(size.width), height: normalize(size.height) };
}

export function fitZoom(viewportWidth: number, viewportHeight: number, canvasWidth: number, canvasHeight: number): number {
  if (viewportWidth <= 0 || viewportHeight <= 0 || canvasWidth <= 0 || canvasHeight <= 0) return 1;
  return clampZoom(Math.min(1, viewportWidth / canvasWidth, viewportHeight / canvasHeight));
}

export function normalizeRegion(start: Point, end: Point) {
  return {
    left: Math.min(start.x, end.x),
    top: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function arrowPath(start: Point, end: Point, headLength = 22, headWidth = 16): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.001) return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const actualHeadLength = Math.min(headLength, Math.max(8, length * 0.35));
  const actualHeadWidth = Math.min(headWidth, Math.max(8, length * 0.28));
  const baseX = end.x - ux * actualHeadLength;
  const baseY = end.y - uy * actualHeadLength;
  const leftX = baseX + px * (actualHeadWidth / 2);
  const leftY = baseY + py * (actualHeadWidth / 2);
  const rightX = baseX - px * (actualHeadWidth / 2);
  const rightY = baseY - py * (actualHeadWidth / 2);

  return [
    `M ${start.x} ${start.y}`,
    `L ${end.x} ${end.y}`,
    `M ${leftX} ${leftY}`,
    `L ${end.x} ${end.y}`,
    `L ${rightX} ${rightY}`,
  ].join(" ");
}
