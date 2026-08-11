import { describe, expect, it } from "vitest";
import { buttonPresets, defaultButtonConfig } from "./presets";
import { getContrastRatio } from "./generators";
import {
  generateButtonFamily,
  generateButtonFamilyCss,
  generateButtonFamilyHtml,
  generateButtonThemeCss,
  generateButtonThemeHtml,
  generateDarkModeConfig,
} from "./systems";

describe("button system generation", () => {
  it("creates six unique family roles", () => {
    const family = generateButtonFamily(defaultButtonConfig);
    expect(family).toHaveLength(6);
    expect(new Set(family.map((member) => member.role)).size).toBe(6);
    expect(new Set(family.map((member) => member.config.className)).size).toBe(6);
  });

  it("generates copy-ready family CSS and HTML", () => {
    const css = generateButtonFamilyCss(defaultButtonConfig);
    const html = generateButtonFamilyHtml(defaultButtonConfig);
    expect(css).toContain("darma-button--primary");
    expect(css).toContain("darma-button--danger");
    expect(html).toContain("darma-button--secondary");
    expect(css).not.toMatch(/undefined|NaN/);
  });

  it("creates dark outline variants with readable text", () => {
    for (const preset of buttonPresets) {
      const outline = {
        ...preset.config,
        style: "outline" as const,
        textColor: preset.config.background,
        borderColor: preset.config.background,
      };
      const dark = generateDarkModeConfig(outline);
      expect(getContrastRatio(dark.textColor, "#0f172a")).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps generated gradient theme text readable across both endpoints", () => {
    for (const preset of buttonPresets.filter((item) => item.config.style === "gradient")) {
      const dark = generateDarkModeConfig(preset.config);
      expect(getContrastRatio(dark.textColor, dark.background)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(dark.textColor, dark.background2)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps family and theme exports free of invalid values for every preset", () => {
    for (const preset of buttonPresets) {
      const outputs = [
        generateButtonFamilyCss(preset.config),
        generateButtonFamilyHtml(preset.config),
        generateButtonThemeCss(preset.config),
        generateButtonThemeHtml(preset.config),
      ];
      expect(outputs.join("\n")).not.toMatch(/undefined|NaN/);
    }
  });
});
