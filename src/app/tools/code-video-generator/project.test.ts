import { describe, expect, it } from "vitest";
import { CODE_VIDEO_MAX_FILE_BYTES, isSafeProjectPath, selectProjectSources } from "./project";

describe("code video project import", () => {
  it("rejects traversal and dependency paths", () => {
    expect(isSafeProjectPath("../secret.js")).toBe(false);
    expect(isSafeProjectPath("demo/../secret.js")).toBe(false);
    expect(isSafeProjectPath("demo/..")).toBe(false);
    expect(isSafeProjectPath("NODE_MODULES/pkg/index.js")).toBe(false);
    expect(isSafeProjectPath("src/index.html")).toBe(true);
  });

  it("prefers conventional root entry filenames", () => {
    const project = selectProjectSources([
      { name: "examples/nested/index.html", content: "nested" },
      { name: "demo/index.html", content: "<title>Demo project</title>" },
      { name: "demo/styles.css", content: "body{}" },
      { name: "demo/app.js", content: "console.log('ready')" },
    ]);
    expect(project.title).toBe("Demo project");
    expect(project.html).toContain("Demo project");
    expect(project.css).toBe("body{}");
  });

  it("enforces the file limit inside the source selector", () => {
    expect(() => selectProjectSources([
      { name: "index.html", content: "x".repeat(CODE_VIDEO_MAX_FILE_BYTES + 1) },
    ])).toThrow("exceeds the 700 KB file limit");
  });
});
