import { describe, expect, it } from "vitest";
import { buttonPresets, defaultButtonConfig } from "./presets";
import {
  generateButtonCss,
  generateButtonHtml,
  generateButtonJsx,
  generateButtonReactStyle,
  generateButtonTailwind,
  generateButtonTokenJson,
  generateButtonVariables,
  getContrastRatio,
} from "./generators";
import { generateButtonFamilyCss, generateButtonFamilyHtml, generateButtonThemeCss, generateButtonThemeHtml, mixHexColors } from "./systems";
import { importButtonCss } from "./studio-tools";

function previewSurface(preset: (typeof buttonPresets)[number]) {
  if (preset.recommendedBackground === "dark") return "#0f172a";
  if (preset.recommendedBackground === "gradient") return "#312e81";
  return "#ffffff";
}

function presetContrast(preset: (typeof buttonPresets)[number]) {
  const config = preset.config;
  if (config.style === "gradient") {
    return Math.min(getContrastRatio(config.textColor, config.background), getContrastRatio(config.textColor, config.background2));
  }
  if (config.style === "outline" || config.style === "ghost") {
    return getContrastRatio(config.textColor, previewSurface(preset));
  }
  if (config.style === "glass") {
    return getContrastRatio(config.textColor, mixHexColors(previewSurface(preset), config.background, 0.28));
  }
  return getContrastRatio(config.textColor, config.background);
}

describe("button studio final preset quality", () => {
  it("keeps every curated preset unique and output-safe", () => {
    expect(buttonPresets).toHaveLength(35);
    expect(new Set(buttonPresets.map((preset) => preset.id)).size).toBe(buttonPresets.length);
    expect(new Set(buttonPresets.map((preset) => preset.name)).size).toBe(buttonPresets.length);

    for (const preset of buttonPresets) {
      const outputs = [
        generateButtonCss(preset.config),
        generateButtonHtml(preset.config),
        generateButtonJsx(preset.config),
        generateButtonReactStyle(preset.config),
        generateButtonTailwind(preset.config),
        generateButtonVariables(preset.config),
        generateButtonTokenJson(preset.config),
        generateButtonFamilyCss(preset.config),
        generateButtonFamilyHtml(preset.config),
        generateButtonThemeCss(preset.config),
        generateButtonThemeHtml(preset.config),
      ].join("\n");
      expect(outputs).not.toMatch(/undefined|NaN|\[object Object\]/);
      expect(() => JSON.parse(generateButtonTokenJson(preset.config))).not.toThrow();
      expect(importButtonCss(generateButtonCss(preset.config), defaultButtonConfig).matchedProperties).toBeGreaterThanOrEqual(10);
    }
  });

  it("ships curated text presets at normal-text AA contrast", () => {
    for (const preset of buttonPresets.filter((preset) => preset.config.contentMode !== "icon-only")) {
      expect(presetContrast(preset)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps curated focus rings visible on their recommended surfaces", () => {
    for (const preset of buttonPresets.filter((preset) => preset.config.includeFocusRing)) {
      expect(getContrastRatio(preset.config.focusRingColor, previewSurface(preset))).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps intentional compact sizing isolated to the compact-toolbar example", () => {
    for (const preset of buttonPresets.filter((preset) => preset.id !== "compact-toolbar")) {
      const height = preset.config.paddingY * 2 + preset.config.fontSize * preset.config.lineHeight;
      expect(height).toBeGreaterThanOrEqual(44);
    }
  });

  it("keeps the default medium button at the studio 44px comfort target", () => {
    const height = defaultButtonConfig.paddingY * 2 + defaultButtonConfig.fontSize * defaultButtonConfig.lineHeight;
    expect(height).toBeGreaterThanOrEqual(44);
  });

  it("keeps the default focus ring visible on common light, dark, and gradient surfaces", () => {
    for (const surface of ["#ffffff", "#0f172a", "#312e81"]) {
      expect(getContrastRatio(defaultButtonConfig.focusRingColor, surface)).toBeGreaterThanOrEqual(3);
    }
  });
});
