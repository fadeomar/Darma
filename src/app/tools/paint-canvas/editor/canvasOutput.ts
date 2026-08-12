import type { Canvas as FabricCanvas } from "fabric";
import type { CanvasBackground, CanvasSize, ExportFormat } from "../types";
import { clampZoom } from "./geometry";

export function applyCssZoom(canvas: FabricCanvas, value: number, size: CanvasSize): number {
  const zoom = clampZoom(value);
  canvas.setDimensions(
    { width: `${Math.round(size.width * zoom)}px`, height: `${Math.round(size.height * zoom)}px` },
    { cssOnly: true },
  );
  canvas.calcOffset();
  return zoom;
}

export function buildExportDataUrl(
  canvas: FabricCanvas,
  format: ExportFormat,
  background: CanvasBackground,
  size: CanvasSize,
): string {
  const source = canvas.toCanvasElement(1);
  const output = document.createElement("canvas");
  output.width = size.width;
  output.height = size.height;
  const context = output.getContext("2d");
  if (!context) throw new Error("Canvas export context unavailable");

  if (background.mode === "solid" || format === "jpeg") {
    context.fillStyle = background.mode === "solid" ? background.color : "#ffffff";
    context.fillRect(0, 0, size.width, size.height);
  }
  context.drawImage(source, 0, 0, size.width, size.height);

  const mime = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
  const quality = format === "png" ? undefined : 0.92;
  return output.toDataURL(mime, quality);
}
