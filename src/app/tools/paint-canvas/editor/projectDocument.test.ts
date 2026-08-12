import { describe, expect, it } from "vitest";
import { DEFAULT_BACKGROUND, DEFAULT_CANVAS_SIZE, PAINT_PROJECT_VERSION } from "../constants";
import { assertLocalProjectResources, makeProjectFile, PAINT_PROJECT_KIND, parseProjectFile } from "./projectDocument";

describe("Paint project files", () => {
  it("round-trips the editable document envelope", () => {
    const project = makeProjectFile({
      canvas: { version: "test", objects: [] },
      background: { ...DEFAULT_BACKGROUND },
      size: { ...DEFAULT_CANVAS_SIZE },
    });

    expect(parseProjectFile(JSON.parse(JSON.stringify(project)))).toMatchObject({
      kind: PAINT_PROJECT_KIND,
      version: PAINT_PROJECT_VERSION,
      document: {
        background: DEFAULT_BACKGROUND,
        size: DEFAULT_CANVAS_SIZE,
      },
    });
  });

  it("rejects unrelated or future project files", () => {
    expect(() => parseProjectFile({ kind: "other", version: 1 })).toThrow();
    expect(() => parseProjectFile({
      kind: PAINT_PROJECT_KIND,
      version: PAINT_PROJECT_VERSION + 1,
      document: {},
    })).toThrow();
  });
  it("rejects project resources that could trigger a network request", () => {
    expect(() => assertLocalProjectResources({ objects: [{ type: "image", src: "https://example.com/private.png" }] })).toThrow(/External project resource/);
    expect(() => assertLocalProjectResources({ backgroundImage: { source: "/remote-pattern.png" } })).toThrow(/External project resource/);
  });

  it("allows embedded data resources and ordinary URL text", () => {
    expect(() => assertLocalProjectResources({
      objects: [
        { type: "image", src: "data:image/png;base64,AAAA" },
        { type: "i-text", text: "https://example.com is only text" },
      ],
    })).not.toThrow();
  });

});
