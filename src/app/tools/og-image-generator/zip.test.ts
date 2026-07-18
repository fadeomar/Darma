import { describe, expect, it } from "vitest";
import type { OgGeneratedAsset } from "./types";
import { createZipArchive, listZipFileNames } from "./zip";

function asset(filename: string, content: string): OgGeneratedAsset {
  const blob = new Blob([content], { type: "text/plain" });
  return { filename, mimeType: blob.type, blob, kind: "snippet", size: blob.size };
}

describe("OG ZIP archive", () => {
  it("creates a readable archive with Unicode-safe paths", async () => {
    const blob = await createZipArchive([
      asset("opengraph-image.png", "image"),
      asset("reports/production-audit.md", "audit"),
      asset("نسخة/README.md", "readme"),
    ]);
    const file = new File([blob], "package.zip", { type: "application/zip" });
    expect(blob.type).toBe("application/zip");
    expect(blob.size).toBeGreaterThan(100);
    expect(await listZipFileNames(file)).toEqual([
      "opengraph-image.png",
      "reports/production-audit.md",
      "نسخة/README.md",
    ]);
  });

  it("creates an empty but valid archive", async () => {
    const blob = await createZipArchive([]);
    const file = new File([blob], "empty.zip", { type: "application/zip" });
    expect(blob.size).toBe(22);
    expect(await listZipFileNames(file)).toEqual([]);
  });
});
