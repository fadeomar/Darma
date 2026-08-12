import { PAINT_PROJECT_VERSION } from "../constants";
import type { CanvasBackground, CanvasSize } from "../types";

export const PAINT_PROJECT_KIND = "darma-paint-project" as const;

export type PaintDocumentSnapshot = {
  canvas: unknown;
  background: CanvasBackground;
  size: CanvasSize;
};

export type PaintProjectFile = {
  kind: typeof PAINT_PROJECT_KIND;
  version: number;
  savedAt: string;
  document: PaintDocumentSnapshot;
};

export function makeProjectFile(document: PaintDocumentSnapshot): PaintProjectFile {
  return {
    kind: PAINT_PROJECT_KIND,
    version: PAINT_PROJECT_VERSION,
    savedAt: new Date().toISOString(),
    document,
  };
}

export function parseProjectFile(value: unknown): PaintProjectFile {
  if (!value || typeof value !== "object") throw new Error("Invalid project file");
  const candidate = value as Partial<PaintProjectFile>;
  if (candidate.kind !== PAINT_PROJECT_KIND || candidate.version !== PAINT_PROJECT_VERSION || !candidate.document) {
    throw new Error("Unsupported project file");
  }
  const document = candidate.document as Partial<PaintDocumentSnapshot>;
  if (!document.canvas || !document.background || !document.size) throw new Error("Incomplete project file");
  if (!Number.isFinite(document.size.width) || !Number.isFinite(document.size.height)) throw new Error("Invalid canvas size");
  assertLocalProjectResources(document.canvas);
  return candidate as PaintProjectFile;
}

const RESOURCE_KEYS = new Set(["src", "href", "source"]);

export function assertLocalProjectResources(value: unknown, path = "canvas"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertLocalProjectResources(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (RESOURCE_KEYS.has(key) && typeof child === "string" && child.trim()) {
      const resource = child.trim().toLowerCase();
      if (!resource.startsWith("data:")) {
        throw new Error(`External project resource is not allowed at ${path}.${key}`);
      }
    }
    assertLocalProjectResources(child, `${path}.${key}`);
  }
}

export function downloadTextFile(contents: string, filename: string, mime = "application/json"): void {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadDataUrl(url: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}
