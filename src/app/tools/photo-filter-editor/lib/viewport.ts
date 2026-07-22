export const MIN_PHOTO_ZOOM = 0.25;
export const MAX_PHOTO_ZOOM = 8;
export const PHOTO_ZOOM_STEP = 0.25;

export function clampZoom(value: number): number {
  const finite = Number.isFinite(value) ? value : 1;
  return Math.min(MAX_PHOTO_ZOOM, Math.max(MIN_PHOTO_ZOOM, Math.round(finite * 100) / 100));
}

export function scalePanForZoom(pan: { x: number; y: number }, oldZoom: number, newZoom: number) {
  if (!Number.isFinite(oldZoom) || oldZoom <= 0 || !Number.isFinite(newZoom)) return { x: 0, y: 0 };
  const scale = newZoom / oldZoom;
  return { x: pan.x * scale, y: pan.y * scale };
}
