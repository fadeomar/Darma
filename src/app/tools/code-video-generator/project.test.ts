import { describe, expect, it } from "vitest";
import { isSafeProjectPath, selectProjectSources } from "./project";

describe("code video project import", () => {
  it("rejects traversal and dependency paths", () => {
    expect(isSafeProjectPath("../secret.js")).toBe(false);
    expect(isSafeProjectPath("node_modules/pkg/index.js")).toBe(false);
    expect(isSafeProjectPath("src/index.html")).toBe(true);
  });
  it("prefers conventional entry filenames", () => {
    const project = selectProjectSources([
      { name: "demo/other.html", content: "other" },
      { name: "demo/index.html", content: "<title>Demo project</title>" },
      { name: "demo/styles.css", content: "body{}" },
      { name: "demo/app.js", content: "console.log('ready')" },
    ]);
    expect(project.title).toBe("Demo project");
    expect(project.css).toBe("body{}");
  });
});
