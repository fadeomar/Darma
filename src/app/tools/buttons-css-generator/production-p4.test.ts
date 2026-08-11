import { describe, expect, it } from "vitest";
import { defaultButtonConfig } from "./presets";
import { generateButtonCss, generateButtonHtml, generateButtonReactStyle, generateButtonTailwind, generateButtonTokenJson } from "./generators";
import { decodeButtonStudioState, encodeButtonStudioState } from "./studio-tools";

describe("button studio P4 production behavior", () => {
  it("exports mobile full-width rules without forcing desktop width", () => {
    const config = { ...defaultButtonConfig, fullWidth: false, mobileFullWidth: true };
    const css = generateButtonCss(config);
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).toContain("width: 100%");
    expect(generateButtonTailwind(config)).toContain("w-full sm:w-auto");
    expect(JSON.parse(generateButtonTokenJson(config)).button.dimensions.mobileFullWidth).toBe(true);
  });

  it("keeps basic HTML semantics explicit", () => {
    expect(generateButtonHtml(defaultButtonConfig)).toContain('<button type="button"');
  });

  it("improves React style parity for typography and motion", () => {
    const output = generateButtonReactStyle({ ...defaultButtonConfig, uppercase: true, letterSpacing: 0.4, motionDuration: 240 });
    expect(output).toContain('letterSpacing: "0.4px"');
    expect(output).toContain('textTransform: "uppercase"');
    expect(output).toContain("240ms");
  });

  it("normalizes untrusted share fields before returning CSS-ready config", () => {
    const token = encodeButtonStudioState({
      version: 2,
      config: {
        ...defaultButtonConfig,
        background: "url(https://tracker.invalid/a.png)" as never,
        className: "x}body{display:none",
        fontSize: 9999,
        customCss: "filter: saturate(1.1); background:url(https://tracker.invalid/a.png)",
      },
      previewBackground: "custom",
      customPreviewBackground: "url(https://tracker.invalid/bg.png)",
      previewContext: "canvas",
      previewDevice: "desktop",
      previewInput: "mouse",
      motionPreview: "normal",
    });
    const decoded = decodeButtonStudioState(token);
    expect(decoded?.config.background).toBe(defaultButtonConfig.background);
    expect(decoded?.config.className).not.toContain("{");
    expect(decoded?.config.fontSize).toBe(40);
    expect(decoded?.config.customCss).not.toContain("url(");
    expect(decoded?.customPreviewBackground).toBe("#f8fafc");
  });
});
