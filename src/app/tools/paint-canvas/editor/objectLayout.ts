export type BoundsRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type LayoutDelta = { x: number; y: number };

export type AlignAction = "left" | "center-x" | "right" | "top" | "center-y" | "bottom";
export type DistributeAction = "horizontal" | "vertical";
export type FlipAxis = "horizontal" | "vertical";

function right(rect: BoundsRect): number {
  return rect.left + rect.width;
}

function bottom(rect: BoundsRect): number {
  return rect.top + rect.height;
}

function selectionBounds(rects: BoundsRect[]): BoundsRect {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const maxRight = Math.max(...rects.map(right));
  const maxBottom = Math.max(...rects.map(bottom));
  return { left, top, width: maxRight - left, height: maxBottom - top };
}

export function alignmentDeltas(rects: BoundsRect[], action: AlignAction): LayoutDelta[] {
  if (rects.length < 2) return rects.map(() => ({ x: 0, y: 0 }));
  const bounds = selectionBounds(rects);
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  const targetRight = bounds.left + bounds.width;
  const targetBottom = bounds.top + bounds.height;

  return rects.map((rect) => {
    if (action === "left") return { x: bounds.left - rect.left, y: 0 };
    if (action === "center-x") return { x: centerX - (rect.left + rect.width / 2), y: 0 };
    if (action === "right") return { x: targetRight - right(rect), y: 0 };
    if (action === "top") return { x: 0, y: bounds.top - rect.top };
    if (action === "center-y") return { x: 0, y: centerY - (rect.top + rect.height / 2) };
    return { x: 0, y: targetBottom - bottom(rect) };
  });
}

export function distributionDeltas(rects: BoundsRect[], action: DistributeAction): LayoutDelta[] {
  if (rects.length < 3) return rects.map(() => ({ x: 0, y: 0 }));
  const indexed = rects.map((rect, index) => ({ rect, index }));
  const sorted = [...indexed].sort((a, b) => action === "horizontal" ? a.rect.left - b.rect.left : a.rect.top - b.rect.top);
  const first = sorted[0].rect;
  const last = sorted[sorted.length - 1].rect;
  const totalSize = sorted.reduce((sum, item) => sum + (action === "horizontal" ? item.rect.width : item.rect.height), 0);
  const availableSpan = action === "horizontal"
    ? right(last) - first.left
    : bottom(last) - first.top;
  const gap = (availableSpan - totalSize) / (sorted.length - 1);
  const deltas = rects.map(() => ({ x: 0, y: 0 }));
  let cursor = action === "horizontal" ? first.left : first.top;

  sorted.forEach(({ rect, index }, sortedIndex) => {
    if (sortedIndex === 0) {
      cursor += (action === "horizontal" ? rect.width : rect.height) + gap;
      return;
    }
    if (sortedIndex === sorted.length - 1) return;
    const current = action === "horizontal" ? rect.left : rect.top;
    const delta = cursor - current;
    deltas[index] = action === "horizontal" ? { x: delta, y: 0 } : { x: 0, y: delta };
    cursor += (action === "horizontal" ? rect.width : rect.height) + gap;
  });

  return deltas;
}
