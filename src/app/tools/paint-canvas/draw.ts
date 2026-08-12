import type { PaintSettings, PaintTool, Point } from "./types";

export const MIN_BRUSH = 1;
export const MAX_BRUSH = 60;

export function createDefaultSettings(): PaintSettings {
  return {
    tool: "brush",
    color: "#2563eb",
    size: 6,
    fill: false,
    opacity: 1,
    brushPreset: "pen",
    stabilizer: 0.55,
    dynamicWidth: true,
  };
}

export function clampBrush(size: number): number {
  if (!Number.isFinite(size)) return MIN_BRUSH;
  return Math.min(MAX_BRUSH, Math.max(MIN_BRUSH, Math.round(size)));
}

/** Distance between two points (used for circle radius). */
export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Rectangle origin/size from a drag between two points (handles any direction). */
export function rectFromDrag(start: Point, end: Point): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

/**
 * Isosceles triangle vertices from a drag: apex at the start x centered over
 * the base, base spanning the drag width at the end y.
 */
export function triangleVertices(start: Point, end: Point): [Point, Point, Point] {
  return [
    { x: start.x, y: start.y },
    { x: end.x, y: end.y },
    { x: start.x * 2 - end.x, y: end.y },
  ];
}

export function getCanvasPoint(rect: DOMRect, clientX: number, clientY: number, canvas: HTMLCanvasElement): Point {
  // Map CSS pixel position to the canvas's internal pixel grid.
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

/** Draw the active shape/stroke onto a 2D context using the current settings. */
export function drawShape(
  ctx: CanvasRenderingContext2D,
  tool: PaintTool,
  start: Point,
  end: Point,
  settings: PaintSettings,
): void {
  ctx.strokeStyle = settings.color;
  ctx.fillStyle = settings.color;
  ctx.lineWidth = settings.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (tool === "line") {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    return;
  }
  if (tool === "rectangle") {
    const { x, y, width, height } = rectFromDrag(start, end);
    if (settings.fill) ctx.fillRect(x, y, width, height);
    else ctx.strokeRect(x, y, width, height);
    return;
  }
  if (tool === "circle") {
    ctx.beginPath();
    ctx.arc(start.x, start.y, distance(start, end), 0, Math.PI * 2);
    if (settings.fill) ctx.fill();
    else ctx.stroke();
    return;
  }
  if (tool === "triangle") {
    const [a, b, c] = triangleVertices(start, end);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    if (settings.fill) ctx.fill();
    else ctx.stroke();
  }
}
