import { describe, expect, it } from "vitest";
import { defaultButtonConfig } from "./presets";
import {
  generateButtonCss,
  generateButtonHtml,
  generateButtonJsx,
  generateButtonTailwind,
  getContrastRatio,
  getReadableTextColorForBackgrounds,
  safeClassName,
} from "./generators";

describe("button studio P5 production hardening", () => {
  it("treats loading as a non-interactive busy state", () => {
    const config = { ...defaultButtonConfig, loading: true, hoverEffect: "shine" as const };
    const html = generateButtonHtml(config);
    const css = generateButtonCss(config);
    expect(html).toContain(" disabled");
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('aria-busy="true"');
    expect(css).not.toContain(".darma-button:hover");
    expect(css).toContain(".darma-button:disabled");
  });

  it("keeps icon-only exports named when the visible label is empty", () => {
    const html = generateButtonHtml({ ...defaultButtonConfig, contentMode: "icon-only", text: "" });
    expect(html).toContain("darma-button__sr-only");
    expect(html).toContain(">Button</span>");
  });

  it("chooses readable text by the weakest gradient endpoint", () => {
    const backgrounds = ["#f8fafc", "#334155"];
    const chosen = getReadableTextColorForBackgrounds(backgrounds);
    const chosenMin = Math.min(...backgrounds.map((background) => getContrastRatio(chosen, background)));
    const alternative = chosen === "#ffffff" ? "#111827" : "#ffffff";
    const alternativeMin = Math.min(...backgrounds.map((background) => getContrastRatio(alternative, background)));
    expect(chosenMin).toBeGreaterThanOrEqual(alternativeMin);
  });

  it("keeps Tailwind loading output semantically disabled and visibly busy", () => {
    const output = generateButtonTailwind({ ...defaultButtonConfig, loading: true });
    expect(output).toContain(" disabled");
    expect(output).toContain('aria-busy="true"');
    expect(output).toContain("animate-spin");
    expect(output).toContain("disabled:pointer-events-none");
  });

  it("keeps generated JSX valid for labels with JSX metacharacters", () => {
    const output = generateButtonJsx({ ...defaultButtonConfig, text: "Save {draft} & continue", iconSymbol: "{" });
    expect(output).toContain('{"Save {draft} & continue"}');
    expect(output).toContain('{"{"}');
    expect(output).not.toContain(">Save {draft}");
  });

  it("normalizes class names that would be invalid CSS identifiers", () => {
    expect(safeClassName("123 button")).toBe("darma-123-button");
    expect(safeClassName(".good_button")).toBe("good_button");
  });

  it("does not duplicate spinner dimensions in generated CSS", () => {
    const css = generateButtonCss(defaultButtonConfig);
    const spinner = css.split(".darma-button__spinner {")[1]?.split("}")[0] ?? "";
    expect(spinner.match(/height: 1em;/g)?.length ?? 0).toBe(1);
  });
});
