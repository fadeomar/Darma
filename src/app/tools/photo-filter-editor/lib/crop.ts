import type { CropAspectId, CropHandle, NormalizedCrop, Orientation } from "../types";

export const FULL_CROP: NormalizedCrop = { x: 0, y: 0, width: 1, height: 1 };
export const MIN_CROP_SIZE = 0.04;
const EPSILON = 0.00001;

export const CROP_ASPECTS: Array<{ id: CropAspectId; label: string }> = [
  { id: "free", label: "Free" },
  { id: "original", label: "Original" },
  { id: "1:1", label: "1:1" },
  { id: "4:5", label: "4:5" },
  { id: "3:4", label: "3:4" },
  { id: "4:3", label: "4:3" },
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
];

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function clampCrop(crop: NormalizedCrop, minSize = MIN_CROP_SIZE): NormalizedCrop {
  const width = Math.min(1, Math.max(minSize, Number.isFinite(crop.width) ? crop.width : 1));
  const height = Math.min(1, Math.max(minSize, Number.isFinite(crop.height) ? crop.height : 1));
  return {
    x: Math.min(1 - width, Math.max(0, Number.isFinite(crop.x) ? crop.x : 0)),
    y: Math.min(1 - height, Math.max(0, Number.isFinite(crop.y) ? crop.y : 0)),
    width,
    height,
  };
}

export function cropEqual(a: NormalizedCrop, b: NormalizedCrop, tolerance = EPSILON): boolean {
  return Math.abs(a.x - b.x) <= tolerance
    && Math.abs(a.y - b.y) <= tolerance
    && Math.abs(a.width - b.width) <= tolerance
    && Math.abs(a.height - b.height) <= tolerance;
}

export function getOrientedDimensions(width: number, height: number, orientation: Orientation): { width: number; height: number } {
  return orientation.rotate === 90 || orientation.rotate === 270
    ? { width: height, height: width }
    : { width, height };
}

export function getCropAspectRatio(id: CropAspectId, sourceWidth: number, sourceHeight: number): number | null {
  if (id === "free") return null;
  const sourceAspect = sourceHeight > 0 ? sourceWidth / sourceHeight : 1;
  const targetAspect = id === "original" ? sourceAspect : (() => {
    const [width, height] = id.split(":").map(Number);
    return width / height;
  })();
  // Crop coordinates are normalized, so account for the image's physical aspect.
  return targetAspect / sourceAspect;
}

export function fitAspectCrop(current: NormalizedCrop, aspectRatio: number | null): NormalizedCrop {
  const crop = clampCrop(current);
  if (!aspectRatio || !Number.isFinite(aspectRatio) || aspectRatio <= 0) return crop;
  const centerX = crop.x + crop.width / 2;
  const centerY = crop.y + crop.height / 2;
  let width = crop.width;
  let height = crop.height;
  if (width / height > aspectRatio) width = height * aspectRatio;
  else height = width / aspectRatio;
  if (width > 1) {
    width = 1;
    height = width / aspectRatio;
  }
  if (height > 1) {
    height = 1;
    width = height * aspectRatio;
  }
  return clampCrop({ x: centerX - width / 2, y: centerY - height / 2, width, height });
}

export function createCenteredAspectCrop(aspectRatio: number | null, coverage = 0.9): NormalizedCrop {
  if (!aspectRatio) {
    const inset = (1 - coverage) / 2;
    return { x: inset, y: inset, width: coverage, height: coverage };
  }
  let width = coverage;
  let height = width / aspectRatio;
  if (height > coverage) {
    height = coverage;
    width = height * aspectRatio;
  }
  return clampCrop({ x: (1 - width) / 2, y: (1 - height) / 2, width, height });
}

export function updateCropFromHandle(
  start: NormalizedCrop,
  handle: CropHandle,
  deltaX: number,
  deltaY: number,
  aspectRatio: number | null,
): NormalizedCrop {
  const base = clampCrop(start);
  if (handle === "move") {
    return clampCrop({ ...base, x: base.x + deltaX, y: base.y + deltaY });
  }

  let left = base.x;
  let top = base.y;
  let right = base.x + base.width;
  let bottom = base.y + base.height;

  if (handle.includes("w")) left += deltaX;
  if (handle.includes("e")) right += deltaX;
  if (handle.includes("n")) top += deltaY;
  if (handle.includes("s")) bottom += deltaY;

  left = Math.min(right - MIN_CROP_SIZE, Math.max(0, left));
  right = Math.max(left + MIN_CROP_SIZE, Math.min(1, right));
  top = Math.min(bottom - MIN_CROP_SIZE, Math.max(0, top));
  bottom = Math.max(top + MIN_CROP_SIZE, Math.min(1, bottom));

  let next = { x: left, y: top, width: right - left, height: bottom - top };
  if (!aspectRatio) return clampCrop(next);

  const horizontal = handle.includes("e") || handle.includes("w");
  const vertical = handle.includes("n") || handle.includes("s");
  const anchorX = handle.includes("w") ? right : left;
  const anchorY = handle.includes("n") ? bottom : top;
  let width = next.width;
  let height = next.height;

  if (horizontal && !vertical) height = width / aspectRatio;
  else if (vertical && !horizontal) width = height * aspectRatio;
  else if (Math.abs(deltaX) >= Math.abs(deltaY)) height = width / aspectRatio;
  else width = height * aspectRatio;

  width = Math.max(MIN_CROP_SIZE, Math.min(1, width));
  height = Math.max(MIN_CROP_SIZE, Math.min(1, height));
  next = {
    x: handle.includes("w") ? anchorX - width : anchorX,
    y: handle.includes("n") ? anchorY - height : anchorY,
    width,
    height,
  };
  return clampCrop(next);
}

export function remapCropForRotate(crop: NormalizedCrop, direction: 1 | -1): NormalizedCrop {
  const value = clampCrop(crop);
  if (direction === 1) {
    return clampCrop({ x: 1 - value.y - value.height, y: value.x, width: value.height, height: value.width });
  }
  return clampCrop({ x: value.y, y: 1 - value.x - value.width, width: value.height, height: value.width });
}

export function remapCropForFlip(crop: NormalizedCrop, axis: "horizontal" | "vertical"): NormalizedCrop {
  const value = clampCrop(crop);
  return axis === "horizontal"
    ? { ...value, x: 1 - value.x - value.width }
    : { ...value, y: 1 - value.y - value.height };
}

export function cropToPixels(crop: NormalizedCrop, width: number, height: number) {
  const value = clampCrop(crop);
  const x = Math.max(0, Math.round(value.x * width));
  const y = Math.max(0, Math.round(value.y * height));
  const right = Math.min(width, Math.round((value.x + value.width) * width));
  const bottom = Math.min(height, Math.round((value.y + value.height) * height));
  return { x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y) };
}

export function previewPointToCropCoordinates(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } {
  return {
    x: clamp01((clientX - rect.left) / Math.max(1, rect.width)),
    y: clamp01((clientY - rect.top) / Math.max(1, rect.height)),
  };
}
