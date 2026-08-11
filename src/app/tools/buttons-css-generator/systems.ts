import type { ButtonGeneratorConfig } from "./types";
import { generateButtonCss, generateButtonHtml, getContrastRatio, getReadableTextColor, safeClassName } from "./generators";

export type ButtonFamilyRole = "primary" | "secondary" | "outline" | "ghost" | "success" | "danger";

export type ButtonFamilyMember = {
  role: ButtonFamilyRole;
  label: string;
  description: string;
  config: ButtonGeneratorConfig;
};

function normalizeHex(hex: string) {
  const trimmed = hex.trim();
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed.slice(1).split("").map((char) => char + char).join("")}`;
  }
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toLowerCase();
  return "#4f46e5";
}

function hexToRgbTuple(hex: string) {
  const normalized = normalizeHex(hex).slice(1);
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ] as const;
}

function rgbToHex(red: number, green: number, blue: number) {
  const channel = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

export function mixHexColors(color: string, target: string, targetWeight: number) {
  const sourceRgb = hexToRgbTuple(color);
  const targetRgb = hexToRgbTuple(target);
  const weight = Math.max(0, Math.min(1, targetWeight));
  return rgbToHex(
    sourceRgb[0] * (1 - weight) + targetRgb[0] * weight,
    sourceRgb[1] * (1 - weight) + targetRgb[1] * weight,
    sourceRgb[2] * (1 - weight) + targetRgb[2] * weight,
  );
}

function ensureContrast(color: string, surface: string, minimum = 4.5) {
  const normalized = normalizeHex(color);
  if (getContrastRatio(normalized, surface) >= minimum) return normalized;
  const target = getContrastRatio("#0f172a", surface) >= getContrastRatio("#ffffff", surface) ? "#0f172a" : "#ffffff";
  for (const weight of [0.18, 0.3, 0.42, 0.54, 0.68, 0.82]) {
    const candidate = mixHexColors(normalized, target, weight);
    if (getContrastRatio(candidate, surface) >= minimum) return candidate;
  }
  return target;
}

function readableAcrossSurfaces(colors: string[]) {
  const whiteScore = Math.min(...colors.map((color) => getContrastRatio("#ffffff", color)));
  const darkScore = Math.min(...colors.map((color) => getContrastRatio("#111827", color)));
  return whiteScore >= darkScore ? "#ffffff" : "#111827";
}

function tuneSurfaceForText(surface: string, text: string, minimum = 4.5) {
  if (getContrastRatio(text, surface) >= minimum) return surface;
  const target = text === "#ffffff" ? "#000000" : "#ffffff";
  for (const weight of [0.08, 0.14, 0.2, 0.28, 0.36, 0.46]) {
    const candidate = mixHexColors(surface, target, weight);
    if (getContrastRatio(text, candidate) >= minimum) return candidate;
  }
  return target;
}

function visibleAccentOnDark(color: string) {
  const surface = "#0f172a";
  const normalized = normalizeHex(color);
  if (getContrastRatio(normalized, surface) >= 2.2) return normalized;
  for (const weight of [0.16, 0.26, 0.36, 0.48]) {
    const candidate = mixHexColors(normalized, "#ffffff", weight);
    if (getContrastRatio(candidate, surface) >= 2.2) return candidate;
  }
  return mixHexColors(normalized, "#ffffff", 0.58);
}

function familyClassName(config: ButtonGeneratorConfig, role: ButtonFamilyRole) {
  return `${safeClassName(config.className)}--${role}`;
}

function neutralizeStateOverrides(): Partial<ButtonGeneratorConfig> {
  return {
    customizeHoverState: false,
    customizeActiveState: false,
    disabled: false,
    loading: false,
  };
}

export function generateButtonFamily(config: ButtonGeneratorConfig): ButtonFamilyMember[] {
  const accent = normalizeHex(config.background);
  const lightSurface = "#ffffff";
  const outlineAccent = ensureContrast(accent, lightSurface, 4.5);
  const secondaryBackground = mixHexColors(accent, "#ffffff", 0.9);
  const secondaryText = getReadableTextColor(secondaryBackground);

  const shared = {
    ...config,
    ...neutralizeStateOverrides(),
  };

  const members: ButtonFamilyMember[] = [
    {
      role: "primary",
      label: "Primary",
      description: "Main action using your current visual language.",
      config: { ...shared, className: familyClassName(config, "primary") },
    },
    {
      role: "secondary",
      label: "Secondary",
      description: "Lower-emphasis companion with the same radius and typography.",
      config: {
        ...shared,
        className: familyClassName(config, "secondary"),
        style: "solid",
        contentMode: "text",
        text: "Secondary",
        background: secondaryBackground,
        background2: secondaryBackground,
        textColor: secondaryText,
        borderEnabled: true,
        borderColor: mixHexColors(accent, "#ffffff", 0.78),
        shadowEnabled: false,
        hoverEffect: "darken",
      },
    },
    {
      role: "outline",
      label: "Outline",
      description: "Transparent supporting action tuned for a light surface.",
      config: {
        ...shared,
        className: familyClassName(config, "outline"),
        style: "outline",
        contentMode: "text",
        text: "Learn more",
        background: outlineAccent,
        textColor: outlineAccent,
        borderEnabled: true,
        borderColor: outlineAccent,
        shadowEnabled: false,
        hoverEffect: "fill",
      },
    },
    {
      role: "ghost",
      label: "Ghost",
      description: "Minimal tertiary action for toolbars and quiet flows.",
      config: {
        ...shared,
        className: familyClassName(config, "ghost"),
        style: "ghost",
        contentMode: "text",
        text: "Skip",
        textColor: outlineAccent,
        borderEnabled: false,
        shadowEnabled: false,
        hoverEffect: "darken",
      },
    },
    {
      role: "success",
      label: "Success",
      description: "Positive confirmation role aligned to the same component geometry.",
      config: {
        ...shared,
        className: familyClassName(config, "success"),
        style: "solid",
        contentMode: "text-icon",
        text: "Confirm",
        iconPosition: "left",
        iconSymbol: "✓",
        background: "#15803d",
        background2: "#16a34a",
        textColor: "#ffffff",
        borderEnabled: false,
        borderColor: "#15803d",
        shadowColor: "#15803d",
        hoverEffect: "lift",
      },
    },
    {
      role: "danger",
      label: "Danger",
      description: "Destructive role with clear contrast and preserved spacing.",
      config: {
        ...shared,
        className: familyClassName(config, "danger"),
        style: "solid",
        contentMode: "text",
        text: "Delete",
        background: "#b91c1c",
        background2: "#dc2626",
        textColor: "#ffffff",
        borderEnabled: false,
        borderColor: "#b91c1c",
        shadowColor: "#b91c1c",
        hoverEffect: "darken",
      },
    },
  ];

  return members;
}

export function generateDarkModeConfig(config: ButtonGeneratorConfig): ButtonGeneratorConfig {
  const darkSurface = "#0f172a";
  let accent = visibleAccentOnDark(config.background);
  let accent2 = visibleAccentOnDark(config.background2);
  const transparentStyle = config.style === "outline" || config.style === "ghost";
  const outlineAccent = ensureContrast(accent, darkSurface, 4.5);

  let background = accent;
  let textColor = getReadableTextColor(accent);
  if (config.style === "gradient") {
    textColor = readableAcrossSurfaces([accent, accent2]);
    accent = tuneSurfaceForText(accent, textColor);
    accent2 = tuneSurfaceForText(accent2, textColor);
    background = accent;
  }
  let borderColor = visibleAccentOnDark(config.borderColor || accent);

  if (transparentStyle) {
    textColor = outlineAccent;
    borderColor = outlineAccent;
  } else if (config.style === "glass") {
    background = mixHexColors(accent, "#ffffff", 0.12);
    textColor = "#ffffff";
    borderColor = mixHexColors(accent, "#ffffff", 0.44);
  } else if (config.style === "neumorphic") {
    background = "#1e293b";
    textColor = "#f8fafc";
    borderColor = "#334155";
  }

  const hoverBackground = visibleAccentOnDark(config.customizeHoverState ? config.hoverBackground : mixHexColors(background, "#ffffff", 0.08));
  const activeBackground = visibleAccentOnDark(config.customizeActiveState ? config.activeBackground : mixHexColors(background, "#000000", 0.12));

  return {
    ...config,
    background,
    background2: accent2,
    textColor,
    borderColor,
    shadowColor: transparentStyle ? "#020617" : accent,
    shadowOpacity: Math.min(Math.max(config.shadowOpacity, 0.22), 0.46),
    hoverBackground,
    hoverTextColor: config.customizeHoverState ? getReadableTextColor(hoverBackground) : textColor,
    hoverBorderColor: transparentStyle ? outlineAccent : visibleAccentOnDark(config.hoverBorderColor),
    activeBackground,
    activeTextColor: config.customizeActiveState ? getReadableTextColor(activeBackground) : textColor,
    activeBorderColor: transparentStyle ? outlineAccent : visibleAccentOnDark(config.activeBorderColor),
    focusRingColor: ensureContrast(visibleAccentOnDark(config.focusRingColor || accent), darkSurface, 3),
  };
}

export function generateButtonFamilyCss(config: ButtonGeneratorConfig) {
  return generateButtonFamily(config)
    .map((member) => `/* ${member.label} */\n${generateButtonCss(member.config)}`)
    .join("\n\n");
}

export function generateButtonFamilyHtml(config: ButtonGeneratorConfig) {
  return generateButtonFamily(config)
    .map((member) => `<!-- ${member.label} -->\n${generateButtonHtml(member.config)}`)
    .join("\n\n");
}

export function generateButtonThemeCss(config: ButtonGeneratorConfig) {
  const base = safeClassName(config.className);
  const light = { ...config, className: `${base}--light` };
  const dark = { ...generateDarkModeConfig(config), className: `${base}--dark` };
  return `/* Light theme variant */\n${generateButtonCss(light)}\n\n/* Dark theme variant */\n${generateButtonCss(dark)}`;
}

export function generateButtonThemeHtml(config: ButtonGeneratorConfig) {
  const base = safeClassName(config.className);
  const light = { ...config, className: `${base}--light` };
  const dark = { ...generateDarkModeConfig(config), className: `${base}--dark` };
  return `<!-- Light theme -->\n${generateButtonHtml(light)}\n\n<!-- Dark theme -->\n${generateButtonHtml(dark)}`;
}
