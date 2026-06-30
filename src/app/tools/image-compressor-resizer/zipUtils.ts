import JSZip from "jszip";
import type { BatchImageItem } from "./types";

export async function downloadBatchAsZip(
  items: BatchImageItem[],
  getFilename: (item: BatchImageItem) => string,
  zipName = "darma-optimized-images.zip",
): Promise<void> {
  const successful = items.filter((item) => item.status === "done" && item.output);
  if (!successful.length) throw new Error("No successfully processed images to download.");

  const zip = new JSZip();
  // Track how many times each generated name has been used to deduplicate
  const seen = new Map<string, number>();

  for (const item of successful) {
    const base = getFilename(item);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);

    let filename = base;
    if (count > 1) {
      // Insert counter before the extension: photo-optimized.jpg → photo-optimized-2.jpg
      const dot = base.lastIndexOf(".");
      filename =
        dot > 0 ? `${base.slice(0, dot)}-${count}${base.slice(dot)}` : `${base}-${count}`;
    }

    zip.file(filename, item.output!.blob);
  }

  // level 1 = fast; images are already compressed so deep deflate won't help
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 1 } });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
