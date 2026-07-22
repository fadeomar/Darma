import { clampCrop } from "./crop";
import type { NormalizedCrop, Orientation, PhotoEditState } from "../types";

type NormalizedPoint = { x: number; y: number };

function sourcePointToOriented(point: NormalizedPoint, orientation: Orientation): NormalizedPoint {
  let next: NormalizedPoint;
  if (orientation.rotate === 90) next = { x: 1 - point.y, y: point.x };
  else if (orientation.rotate === 180) next = { x: 1 - point.x, y: 1 - point.y };
  else if (orientation.rotate === 270) next = { x: point.y, y: 1 - point.x };
  else next = { ...point };

  return {
    x: orientation.flipH ? 1 - next.x : next.x,
    y: orientation.flipV ? 1 - next.y : next.y,
  };
}

function orientedPointToSource(point: NormalizedPoint, orientation: Orientation): NormalizedPoint {
  const unflipped = {
    x: orientation.flipH ? 1 - point.x : point.x,
    y: orientation.flipV ? 1 - point.y : point.y,
  };

  if (orientation.rotate === 90) return { x: unflipped.y, y: 1 - unflipped.x };
  if (orientation.rotate === 180) return { x: 1 - unflipped.x, y: 1 - unflipped.y };
  if (orientation.rotate === 270) return { x: 1 - unflipped.y, y: unflipped.x };
  return unflipped;
}

export function remapCropBetweenOrientations(
  crop: NormalizedCrop,
  from: Orientation,
  to: Orientation,
): NormalizedCrop {
  const value = clampCrop(crop);
  const corners = [
    { x: value.x, y: value.y },
    { x: value.x + value.width, y: value.y },
    { x: value.x + value.width, y: value.y + value.height },
    { x: value.x, y: value.y + value.height },
  ].map((point) => sourcePointToOriented(orientedPointToSource(point, from), to));

  const left = Math.min(...corners.map((point) => point.x));
  const right = Math.max(...corners.map((point) => point.x));
  const top = Math.min(...corners.map((point) => point.y));
  const bottom = Math.max(...corners.map((point) => point.y));
  return clampCrop({ x: left, y: top, width: right - left, height: bottom - top });
}

export function rotateOrientation(orientation: Orientation, direction: 1 | -1): Orientation {
  return {
    ...orientation,
    rotate: (((orientation.rotate + direction * 90) % 360) + 360) % 360 as Orientation["rotate"],
  };
}

export function rotateEditState(state: PhotoEditState, direction: 1 | -1): PhotoEditState {
  const orientation = rotateOrientation(state.orientation, direction);
  return {
    ...state,
    orientation,
    crop: remapCropBetweenOrientations(state.crop, state.orientation, orientation),
  };
}

export function flipEditState(state: PhotoEditState, axis: "horizontal" | "vertical"): PhotoEditState {
  const orientation = axis === "horizontal"
    ? { ...state.orientation, flipH: !state.orientation.flipH }
    : { ...state.orientation, flipV: !state.orientation.flipV };
  return {
    ...state,
    orientation,
    crop: remapCropBetweenOrientations(state.crop, state.orientation, orientation),
  };
}

export function resetTransform(state: PhotoEditState): PhotoEditState {
  const orientation: Orientation = { rotate: 0, flipH: false, flipV: false };
  return {
    ...state,
    crop: remapCropBetweenOrientations(state.crop, state.orientation, orientation),
    orientation,
  };
}

export function orientationEqual(a: Orientation, b: Orientation): boolean {
  return a.rotate === b.rotate && a.flipH === b.flipH && a.flipV === b.flipV;
}

export function getCanvasTransform(
  sourceWidth: number,
  sourceHeight: number,
  orientation: Orientation,
): {
  orientedWidth: number;
  orientedHeight: number;
  centerX: number;
  centerY: number;
  radians: number;
  scaleX: number;
  scaleY: number;
} {
  const swapped = orientation.rotate === 90 || orientation.rotate === 270;
  const orientedWidth = swapped ? sourceHeight : sourceWidth;
  const orientedHeight = swapped ? sourceWidth : sourceHeight;
  return {
    orientedWidth,
    orientedHeight,
    centerX: orientedWidth / 2,
    centerY: orientedHeight / 2,
    radians: (orientation.rotate * Math.PI) / 180,
    scaleX: orientation.flipH ? -1 : 1,
    scaleY: orientation.flipV ? -1 : 1,
  };
}
