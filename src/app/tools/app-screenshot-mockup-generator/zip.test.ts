import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { createZipArchive } from "./zip";

describe("mockup ZIP writer", () => {
  it("creates a readable archive with text and binary entries", async () => {
    const archive = await createZipArchive([
      { filename: "nested/README.md", data: "hello" },
      { filename: "images/mockup.png", data: new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }) },
      { filename: "ملف.csv", data: "a,b\n1,2\n" },
    ]);
    const zip = await JSZip.loadAsync(await archive.arrayBuffer());
    expect(Object.keys(zip.files).sort()).toEqual(["images/mockup.png", "nested/README.md", "ملف.csv"].sort());
    expect(await zip.file("nested/README.md")?.async("string")).toBe("hello");
    expect(Array.from(await zip.file("images/mockup.png")!.async("uint8array"))).toEqual([1, 2, 3]);
  });
});
