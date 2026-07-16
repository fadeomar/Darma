import { describe, expect, it } from "vitest";
import { createZipArchive, readZipEntries } from "./zip";
import type { GeneratedAsset } from "./types";

function asset(filename: string, text: string): GeneratedAsset {
  const blob = new Blob([text], { type: "text/plain" });
  return { filename, mimeType: "text/plain", blob, kind: "config", size: blob.size, text };
}

describe("favicon ZIP utilities", () => {
  it("round-trips nested and Unicode filenames", async () => {
    const zip = await createZipArchive([
      asset("public/icons/icon-192.png", "png-bytes"),
      asset("docs/تعليمات.md", "local instructions"),
    ]);
    const file = new File([zip], "favicon-pack.zip", { type: "application/zip" });
    const entries = await readZipEntries(file);
    expect(entries.map((entry) => entry.name)).toEqual(["public/icons/icon-192.png", "docs/تعليمات.md"]);
    expect(entries[1].text).toBe("local instructions");
  });

  it("creates a non-empty ZIP blob", async () => {
    const zip = await createZipArchive([asset("README.md", "# Ready")]);
    expect(zip.type).toBe("application/zip");
    expect(zip.size).toBeGreaterThan(40);
  });
});
