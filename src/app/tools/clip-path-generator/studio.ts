import {
  MAX_POINTS,
  MIN_POINTS,
  clampPercent,
  clonePoints,
  normalizePoint,
  pointsEqual,
  roundCoord,
} from "./clipPath";
import type { CanvasAspectRatio, ClipPathStudioSettings, ClipPoint } from "./types";

export const DEFAULT_SNAP_SIZE = 5;
export const MIN_SNAP_SIZE = 1;
export const MAX_SNAP_SIZE = 25;
export const SAFE_BOUND_PADDING = 5;
export const DEFAULT_SCALE_STEP = 10;


export function createDefaultStudioSettings(): ClipPathStudioSettings {
  return {
    aspectRatio: "square",
    objectFit: "cover",
    objectPosition: "center",
    backgroundColor: "#111827",
    checkerboard: true,
    showGhost: true,
    showOutline: true,
    showPointLabels: false,
    showHandles: true,
    showGrid: false,
    snapEnabled: false,
    snapSize: DEFAULT_SNAP_SIZE,
    webkitFallback: true,
  };
}
export const ASPECT_RATIO_VALUES: Record<Exclude<CanvasAspectRatio, "free">, number> = {
  square: 1,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};

export function clampSnapSize(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SNAP_SIZE;
  return Math.min(MAX_SNAP_SIZE, Math.max(MIN_SNAP_SIZE, Math.round(value)));
}

export function snapCoordinate(value: number, size: number): number {
  const safeSize = clampSnapSize(size);
  return roundCoord(clampPercent(Math.round(value / safeSize) * safeSize), 2);
}

export function snapPoint(point: ClipPoint, size: number): ClipPoint {
  return { x: snapCoordinate(point.x, size), y: snapCoordinate(point.y, size) };
}

export function updatePointCoordinates(
  points: ClipPoint[],
  index: number,
  next: Partial<ClipPoint>,
): ClipPoint[] {
  if (index < 0 || index >= points.length) return points;
  const current = points[index];
  const normalized = normalizePoint({
    x: next.x ?? current.x,
    y: next.y ?? current.y,
  });
  if (current.x === normalized.x && current.y === normalized.y) return points;
  const copy = clonePoints(points);
  copy[index] = normalized;
  return copy;
}

export function reorderPoint(points: ClipPoint[], fromIndex: number, toIndex: number): ClipPoint[] {
  if (
    fromIndex < 0 ||
    fromIndex >= points.length ||
    toIndex < 0 ||
    toIndex >= points.length ||
    fromIndex === toIndex
  ) {
    return points;
  }
  const copy = clonePoints(points);
  const [point] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, point);
  return copy;
}

export function duplicatePoint(points: ClipPoint[], index: number, offset = 2): ClipPoint[] {
  if (points.length >= MAX_POINTS || index < 0 || index >= points.length) return points;
  const source = points[index];
  const candidates = [
    { x: source.x + offset, y: source.y + offset },
    { x: source.x - offset, y: source.y - offset },
    { x: source.x + offset, y: source.y - offset },
    { x: source.x - offset, y: source.y + offset },
  ].map((point) => normalizePoint(point));
  const duplicate =
    candidates.find(
      (candidate) =>
        !points.some((point) => Math.abs(point.x - candidate.x) < 0.05 && Math.abs(point.y - candidate.y) < 0.05),
    ) ?? normalizePoint({ x: source.x + offset, y: source.y });
  const copy = clonePoints(points);
  copy.splice(index + 1, 0, duplicate);
  return copy;
}

export function getPointBounds(points: ClipPoint[]) {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 50, centerY: 50 };
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

function mapAroundCenter(
  points: ClipPoint[],
  mapper: (point: ClipPoint, center: ClipPoint) => ClipPoint,
): ClipPoint[] {
  if (points.length < MIN_POINTS) return points;
  if (!points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))) return points;
  const bounds = getPointBounds(points);
  const center = { x: bounds.centerX, y: bounds.centerY };
  return points.map((point) => normalizePoint(mapper(point, center)));
}

export function rotatePoints(points: ClipPoint[], direction: "clockwise" | "counterclockwise"): ClipPoint[] {
  return mapAroundCenter(points, (point, center) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return direction === "clockwise"
      ? { x: center.x - dy, y: center.y + dx }
      : { x: center.x + dy, y: center.y - dx };
  });
}

export function centerPoints(points: ClipPoint[]): ClipPoint[] {
  if (points.length < MIN_POINTS) return points;
  const bounds = getPointBounds(points);
  const dx = 50 - bounds.centerX;
  const dy = 50 - bounds.centerY;
  const next = points.map((point) => normalizePoint({ x: point.x + dx, y: point.y + dy }));
  return pointsEqual(points, next) ? points : next;
}

export function fitPointsToBounds(points: ClipPoint[], padding = SAFE_BOUND_PADDING): ClipPoint[] {
  if (points.length < MIN_POINTS) return points;
  const safePadding = Math.min(45, Math.max(0, padding));
  const bounds = getPointBounds(points);
  if (bounds.width <= 0 || bounds.height <= 0) return points;
  const available = 100 - safePadding * 2;
  const scale = Math.min(available / bounds.width, available / bounds.height);
  const next = points.map((point) =>
    normalizePoint({
      x: 50 + (point.x - bounds.centerX) * scale,
      y: 50 + (point.y - bounds.centerY) * scale,
    }),
  );
  return pointsEqual(points, next) ? points : next;
}

export function scalePoints(points: ClipPoint[], percent: number): ClipPoint[] {
  if (points.length < MIN_POINTS || !Number.isFinite(percent)) return points;
  const factor = Math.max(0.05, 1 + percent / 100);
  return mapAroundCenter(points, (point, center) => ({
    x: center.x + (point.x - center.x) * factor,
    y: center.y + (point.y - center.y) * factor,
  }));
}

export function getAspectRatioValue(aspectRatio: CanvasAspectRatio): number | null {
  return aspectRatio === "free" ? null : ASPECT_RATIO_VALUES[aspectRatio];
}
