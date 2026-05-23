import { downloadBlobFile } from "./downloadBlob";

export function downloadTextFile({ content, filename, mimeType = "text/plain;charset=utf-8" }: { content: string; filename: string; mimeType?: string }): void {
  downloadBlobFile({ blob: new Blob([content], { type: mimeType }), filename });
}
