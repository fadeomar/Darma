import { describe, expect, it } from "vitest";
import powershellLoader from "./generated/loaders/uiverse-powershell-download-panel.json";
import { validateGeneratedCssLoaderDefinition } from "./validateGeneratedLoaders";

describe("validateGeneratedCssLoaderDefinition", () => {
  it("catches leaked HTML in CSS fields", () => {
    const issues = validateGeneratedCssLoaderDefinition({
      id: "bad-loader",
      name: "Bad Loader",
      category: "dots",
      tags: ["bad"],
      formats: ["html", "css", "react"],
      previewHtml: "<div></div>",
      previewCss: ".loader { color: red; }</div>",
      code: {
        html: "<div></div>",
        css: "<p>not css</p>",
        react: "export default function Loader() {\n  return <div></div>;\n}",
      },
    });

    expect(issues.filter((issue) => issue.message.includes("leaked HTML"))).toHaveLength(2);
  });

  it("catches obviously truncated React output", () => {
    const issues = validateGeneratedCssLoaderDefinition({
      id: "truncated-loader",
      name: "Truncated Loader",
      category: "dots",
      tags: ["bad"],
      formats: ["html", "css", "react"],
      previewHtml: "<div></div>",
      previewCss: ".loader { color: red; }",
      code: {
        html: "<div></div>",
        css: ".loader { color: red; }",
        react: "export default function Loader() {\n  return (\n    <div><span>\n  );\n}",
      },
    });

    expect(issues.some((issue) => issue.field === "code.react")).toBe(true);
  });

  it("accepts the repaired PowerShell loader", () => {
    expect(validateGeneratedCssLoaderDefinition(powershellLoader)).toEqual([]);
  });
});
