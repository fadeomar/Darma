import type { Canvas as FabricCanvas } from "fabric";
import { getStroke } from "perfect-freehand";
import type { PaintSettings } from "../types";
import { getBrushStrokeOptions } from "./brushPresets";
import type { FabricRuntime } from "./fabricHelpers";

type StrokePoint = [number, number, number];

type PencilBrushInstance = InstanceType<FabricRuntime["PencilBrush"]>;
type BrushPointer = Parameters<PencilBrushInstance["onMouseDown"]>[0];
type BrushEvent = Parameters<PencilBrushInstance["onMouseDown"]>[1];

function clampPressure(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0.05, value));
}

export function getSvgPathFromStroke(points: number[][]): string {
  if (points.length < 4) return "";
  const average = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const first = points[0];
  const second = points[1];
  const third = points[2];
  const firstMid = average(second, third);
  let path = `M${first[0].toFixed(2)},${first[1].toFixed(2)} Q${second[0].toFixed(2)},${second[1].toFixed(2)} ${firstMid[0].toFixed(2)},${firstMid[1].toFixed(2)} T`;
  for (let index = 2; index < points.length - 1; index += 1) {
    const midpoint = average(points[index], points[index + 1]);
    path += `${midpoint[0].toFixed(2)},${midpoint[1].toFixed(2)} `;
  }
  return `${path}Z`;
}

function getPointerPressure(event: Event): { pressure: number; real: boolean } {
  if (typeof PointerEvent !== "undefined" && event instanceof PointerEvent && event.pointerType === "pen") {
    return { pressure: clampPressure(event.pressure || 0.5), real: event.pressure > 0 };
  }
  return { pressure: 0.5, real: false };
}

export function createPerfectFreehandBrush(
  fabric: FabricRuntime,
  canvas: FabricCanvas,
  getSettings: () => PaintSettings,
): PencilBrushInstance {
  class PerfectFreehandBrush extends fabric.PencilBrush {
    private pressurePoints: StrokePoint[] = [];
    private hasRealPressure = false;

    onMouseDown(pointer: BrushPointer, event: BrushEvent) {
      this.pressurePoints = [];
      this.hasRealPressure = false;
      this.capturePoint(pointer, event.e);
      super.onMouseDown(pointer, event);
    }

    onMouseMove(pointer: BrushPointer, event: BrushEvent) {
      if (this.limitedToCanvasSize && this._isOutSideCanvas(pointer)) {
        super.onMouseMove(pointer, event);
        return;
      }
      this.capturePoint(pointer, event.e);
      super.onMouseMove(pointer, event);
    }

    needsFullRender() {
      return true;
    }

    _render(ctx: CanvasRenderingContext2D = this.canvas.contextTop) {
      if (typeof Path2D === "undefined") {
        super._render(ctx);
        return;
      }
      const settings = getSettings();
      const outline = getStroke(this.pressurePoints, {
        ...getBrushStrokeOptions(settings, this.hasRealPressure),
        last: false,
      });
      const pathData = getSvgPathFromStroke(outline);
      if (!pathData) {
        super._render(ctx);
        return;
      }
      this._saveAndTransform(ctx);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = settings.opacity;
      ctx.fill(new Path2D(pathData));
      ctx.restore();
    }

    _finalizeAndAddPath() {
      const settings = getSettings();
      const outline = getStroke(this.pressurePoints, getBrushStrokeOptions(settings, this.hasRealPressure));
      const pathData = getSvgPathFromStroke(outline);
      this.canvas.clearContext(this.canvas.contextTop);
      if (!pathData) {
        this.canvas.requestRenderAll();
        this.pressurePoints = [];
        return;
      }

      const path = new fabric.Path(pathData, {
        fill: this.color,
        stroke: null,
        opacity: 1,
      });
      this.canvas.fire("before:path:created", { path });
      this.canvas.add(path);
      path.setCoords();
      this.canvas.requestRenderAll();
      this.canvas.fire("path:created", { path });
      this.pressurePoints = [];
    }

    private capturePoint(pointer: BrushPointer, event: Event) {
      const pressure = getPointerPressure(event);
      this.hasRealPressure ||= pressure.real;
      const last = this.pressurePoints[this.pressurePoints.length - 1];
      if (last && last[0] === pointer.x && last[1] === pointer.y) {
        last[2] = pressure.pressure;
        return;
      }
      this.pressurePoints.push([pointer.x, pointer.y, pressure.pressure]);
    }
  }

  const brush = new PerfectFreehandBrush(canvas);
  brush.limitedToCanvasSize = true;
  brush.straightLineKey = null;
  return brush;
}
