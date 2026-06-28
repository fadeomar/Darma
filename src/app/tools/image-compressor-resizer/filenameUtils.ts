import type { OutputMimeType } from "./types";
import { getExtension } from "./formatUtils";

export type RenameMode = "keep" | "suffix" | "custom";

function safeBaseName(originalName: string): string {
  const withoutExt = originalName.replace(/\.[^.]+$/, "").trim();
  return withoutExt.replace(/[<>:"/\\|?*\x00-\x1f]/g, "").trim() || "image";
}

function safeSuffix(raw: string): string {
  return raw.replace(/[<>:"/\\|?*\x00-\x1f]/g, "").trim();
}

export function buildBatchFilename(
  originalName: string,
  mimeType: OutputMimeType,
  mode: RenameMode,
  customSuffix: string,
): string {
  const base = safeBaseName(originalName);
  const ext = getExtension(mimeType);

  switch (mode) {
    case "keep":
      return `${base}.${ext}`;
    case "custom": {
      const s = safeSuffix(customSuffix) || "-optimized";
      return `${base}${s}.${ext}`;
    }
    default:
      return `${base}-optimized.${ext}`;
  }
}
