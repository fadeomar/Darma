import type { Canvas as FabricCanvas, FabricObject } from "fabric";
import type { CanvasObjectSummary, CanvasSize, PaintSettings, PaintTool, Point } from "../types";
import { isPrivacyTool } from "../types";
import { arrowPath, normalizeRegion } from "./geometry";

export type FabricRuntime = typeof import("fabric");
export type FilterableImage = FabricObject & { filters: unknown[]; applyFilters: () => void };
export type PaintFabricObject = FabricObject & {
  paintId?: string;
  paintName?: string;
  paintLocked?: boolean;
};

export const PAINT_OBJECT_PROPERTIES = ["paintId", "paintName", "paintLocked"];

function createObjectId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `paint-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getObjectLabel(object: FabricObject | undefined): string {
  if (!object) return "Nothing selected";
  const metadata = object as PaintFabricObject;
  if (metadata.paintName) return metadata.paintName;
  return getObjectTypeLabel(object);
}

// Fabric ships a pre-minified browser bundle, so `constructor.name` is mangled at
// runtime. The static `type` string survives minification, and `isType` compares it.
function getFabricType(object: FabricObject): string {
  const staticType = (object.constructor as unknown as { type?: unknown }).type;
  return typeof staticType === "string" && staticType ? staticType : "Object";
}

export function getObjectTypeLabel(object: FabricObject): string {
  if (object.isType("IText", "Textbox", "Text", "FabricText")) return "Text";
  if (object.isType("Image", "FabricImage")) return "Image";
  if (object.isType("ActiveSelection")) return "Multiple objects";
  if (object.isType("Group")) return "Group";
  if (object.isType("Path")) return object.globalCompositeOperation === "destination-out" ? "Eraser stroke" : "Drawing";
  return getFabricType(object).replace(/^Fabric/, "");
}

export function ensureObjectMetadata(object: FabricObject, preferredName?: string): PaintFabricObject {
  const target = object as PaintFabricObject;
  if (!target.paintId) target.paintId = createObjectId();
  if (!target.paintName) target.paintName = preferredName || getObjectTypeLabel(object);
  if (typeof target.paintLocked !== "boolean") target.paintLocked = false;
  return target;
}


export function refreshClonedObjectMetadata(object: FabricObject, preferredName?: string): void {
  const target = object as PaintFabricObject;
  target.paintId = undefined;
  if (preferredName) target.paintName = preferredName;
  ensureObjectMetadata(object);

  const collection = object as FabricObject & { getObjects?: () => FabricObject[] };
  collection.getObjects?.().forEach((child) => refreshClonedObjectMetadata(child));
}

export function ensureCanvasObjectMetadata(canvas: FabricCanvas): void {
  const counts = new Map<string, number>();
  canvas.getObjects().forEach((object) => {
    const label = getObjectTypeLabel(object);
    const count = (counts.get(label) ?? 0) + 1;
    counts.set(label, count);
    ensureObjectMetadata(object, count === 1 ? label : `${label} ${count}`);
    applyObjectLockState(object);
  });
}

export function applyObjectLockState(object: FabricObject): void {
  const target = object as PaintFabricObject;
  const locked = Boolean(target.paintLocked);
  object.set({
    selectable: !locked && object.visible !== false,
    evented: !locked && object.visible !== false,
    lockMovementX: locked,
    lockMovementY: locked,
    lockScalingX: locked,
    lockScalingY: locked,
    lockRotation: locked,
    snapAngle: 15,
    snapThreshold: 4,
    touchCornerSize: 36,
    cornerSize: 12,
    padding: 4,
  });
}

export function getCanvasObjectSummaries(canvas: FabricCanvas): CanvasObjectSummary[] {
  const selectedIds = new Set(
    canvas.getActiveObjects().map((object) => ensureObjectMetadata(object).paintId).filter(Boolean),
  );
  return [...canvas.getObjects()].reverse().map((object) => {
    const target = ensureObjectMetadata(object);
    return {
      id: target.paintId!,
      name: target.paintName || getObjectTypeLabel(object),
      type: getObjectTypeLabel(object),
      visible: object.visible !== false,
      locked: Boolean(target.paintLocked),
      selected: selectedIds.has(target.paintId),
    };
  });
}

export function findCanvasObject(canvas: FabricCanvas, id: string): PaintFabricObject | undefined {
  return canvas.getObjects().find((object) => (object as PaintFabricObject).paintId === id) as PaintFabricObject | undefined;
}

export function isFilterableImage(object: FabricObject | undefined): object is FilterableImage {
  if (!object) return false;
  return object.isType("Image", "FabricImage") && "applyFilters" in object;
}

export function createShape(
  fabric: FabricRuntime,
  tool: PaintTool,
  start: Point,
  end: Point,
  current: PaintSettings,
): FabricObject | null {
  const shared = {
    stroke: current.color,
    strokeWidth: current.size,
    opacity: current.opacity,
    strokeUniform: true,
    selectable: true,
  };

  let shape: FabricObject | null = null;
  if (tool === "line") {
    shape = new fabric.Line([start.x, start.y, end.x, end.y], { ...shared, fill: "transparent" });
  } else if (tool === "arrow") {
    shape = new fabric.Path(arrowPath(start, end), {
      ...shared,
      fill: "transparent",
      strokeLineCap: "round",
      strokeLineJoin: "round",
    });
  } else if (tool === "rectangle") {
    shape = new fabric.Rect({
      ...shared,
      left: Math.min(start.x, end.x),
      top: Math.min(start.y, end.y),
      width: Math.max(1, Math.abs(end.x - start.x)),
      height: Math.max(1, Math.abs(end.y - start.y)),
      fill: current.fill ? current.color : "transparent",
      originX: "left",
      originY: "top",
    });
  } else if (tool === "circle") {
    const radius = Math.max(1, Math.hypot(end.x - start.x, end.y - start.y));
    shape = new fabric.Circle({
      ...shared,
      left: start.x - radius,
      top: start.y - radius,
      radius,
      fill: current.fill ? current.color : "transparent",
      originX: "left",
      originY: "top",
    });
  } else if (tool === "triangle") {
    shape = new fabric.Triangle({
      ...shared,
      left: Math.min(start.x, end.x),
      top: Math.min(start.y, end.y),
      width: Math.max(1, Math.abs(end.x - start.x)),
      height: Math.max(1, Math.abs(end.y - start.y)),
      fill: current.fill ? current.color : "transparent",
      originX: "left",
      originY: "top",
    });
  }

  if (shape) ensureObjectMetadata(shape, tool === "arrow" ? "Arrow" : undefined);
  return shape;
}

export function createPrivacyDraft(fabric: FabricRuntime, start: Point, end: Point): FabricObject {
  const region = normalizeRegion(start, end);
  return new fabric.Rect({
    left: region.left,
    top: region.top,
    width: Math.max(1, region.width),
    height: Math.max(1, region.height),
    fill: "rgba(37, 99, 235, 0.12)",
    stroke: "#2563eb",
    strokeWidth: 2,
    strokeDashArray: [8, 6],
    strokeUniform: true,
    selectable: false,
    evented: false,
    excludeFromExport: true,
    originX: "left",
    originY: "top",
  });
}

export function createPrivacyRegionImage(
  canvas: FabricCanvas,
  fabric: FabricRuntime,
  tool: PaintTool,
  start: Point,
  end: Point,
): FilterableImage | null {
  if (!isPrivacyTool(tool)) return null;
  const region = normalizeRegion(start, end);
  if (region.width < 6 || region.height < 6) return null;

  const cropped = canvas.toCanvasElement(1, region);
  const image = new fabric.FabricImage(cropped, {
    left: region.left,
    top: region.top,
    originX: "left",
    originY: "top",
    selectable: true,
  }) as FilterableImage;
  ensureObjectMetadata(image, tool === "blur-region" ? "Blur region" : "Pixelated region");
  setImageEffect(image, fabric, tool === "blur-region" ? "blur" : "pixelate");
  return image;
}

export function setImageEffect(
  image: FilterableImage,
  fabric: FabricRuntime,
  effect: "blur" | "pixelate" | "none",
): void {
  image.filters = effect === "blur"
    ? [new fabric.filters.Blur({ blur: 0.35 })]
    : effect === "pixelate"
      ? [new fabric.filters.Pixelate({ blocksize: 12 })]
      : [];
  image.applyFilters();
}

export async function createImportedImage(
  fabric: FabricRuntime,
  file: File,
  canvasSize: CanvasSize,
): Promise<FabricObject> {
  const dataUrl = await fileToDataUrl(file);
  const image = await fabric.FabricImage.fromURL(dataUrl);
  const naturalWidth = image.width || canvasSize.width;
  const naturalHeight = image.height || canvasSize.height;
  const scale = Math.min(1, (canvasSize.width * 0.8) / naturalWidth, (canvasSize.height * 0.8) / naturalHeight);
  image.set({
    left: canvasSize.width / 2,
    top: canvasSize.height / 2,
    originX: "center",
    originY: "center",
    opacity: 1,
  });
  image.scale(scale);
  ensureObjectMetadata(image, file.name.replace(/\.[^.]+$/, "") || "Image");
  return image;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid image result"));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}
