import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(__dirname, "ImageCompressorClient.tsx"), "utf8");

describe("ImageCompressorClient source smoke checks", () => {
  it("keeps one shared file input mounted outside the dropzone", () => {
    expect(source).toContain("const fileInput = (");
    expect(source).toContain("{fileInput}");
    expect(source).toContain("onBrowse={openAddPicker}");

    const dropzoneBody = source.slice(source.indexOf("function UploadDropzone"));
    expect(dropzoneBody).not.toContain('type="file"');
    expect(dropzoneBody).not.toContain("inputRef");
  });

  it("uses the proper multiplication symbol in labels", () => {
    expect(source).toContain(" × ");
    expect(source).not.toContain("Ãƒâ€”");
    expect(source).not.toContain("Ã—");
  });
});
