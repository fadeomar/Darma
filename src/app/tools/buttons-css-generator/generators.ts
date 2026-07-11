import type { ButtonGeneratorConfig } from "./types";

function normalizeHex(hex: string) {
  const trimmed = hex.trim();
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed.slice(1).split("").map((char) => char + char).join("")}`;
  }
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  return "#4f46e5";
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex).replace("#", "");
  const value = parseInt(normalized, 16);
  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
}

function relativeLuminance(hex: string) {
  const normalized = normalizeHex(hex).replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const channels = [r, g, b].map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function getContrastRatio(foreground: string, background: string) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function getContrastRating(ratio: number) {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "Large text";
  return "Fail";
}

export function getReadableTextColor(background: string) {
  return getContrastRatio("#ffffff", background) >= getContrastRatio("#111827", background) ? "#ffffff" : "#111827";
}

export function safeClassName(value: string) {
  const cleaned = value.trim().replace(/^\./, "").replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
  return cleaned || "darma-button";
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function baseStyles(config: ButtonGeneratorConfig) {
  const width = config.fullWidth ? "width: 100%;" : config.minWidth > 0 ? `min-width: ${config.minWidth}px;` : "";
  const opacity = config.disabled ? "opacity: 0.55; cursor: not-allowed; pointer-events: none;" : "cursor: pointer;";
  const transform = config.uppercase ? "text-transform: uppercase;" : "";
  const letterSpacing = config.letterSpacing ? `letter-spacing: ${config.letterSpacing}px;` : "letter-spacing: normal;";
  return `display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: ${config.paddingY * 2 + config.fontSize}px;
  padding: ${config.paddingY}px ${config.paddingX}px;
  border-radius: ${config.variant === "pill" ? 999 : config.radius}px;
  border: 1px solid ${config.borderColor};
  font-size: ${config.fontSize}px;
  font-weight: ${config.fontWeight};
  line-height: 1;
  text-decoration: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease, background 180ms ease, border-color 180ms ease;
  ${letterSpacing}
  ${transform}
  ${width}
  ${opacity}`;
}

function variantStyles(config: ButtonGeneratorConfig) {
  switch (config.variant) {
    case "outline":
      return `background: transparent;
  color: ${config.textColor};
  border-color: ${config.borderColor};
  box-shadow: 0 ${Math.round(config.shadow / 3)}px ${config.shadow}px rgba(${hexToRgb(config.borderColor)}, 0.14);`;
    case "ghost":
      return `background: transparent;
  color: ${config.textColor};
  border-color: transparent;
  box-shadow: none;`;
    case "gradient":
      return `background: linear-gradient(135deg, ${config.background}, ${config.background2});
  color: ${config.textColor};
  border-color: transparent;
  box-shadow: 0 ${Math.round(config.shadow / 2)}px ${config.shadow}px rgba(${hexToRgb(config.background)}, 0.32);`;
    case "glass":
      return `background: rgba(255, 255, 255, 0.32);
  color: ${config.textColor};
  border-color: rgba(255, 255, 255, 0.55);
  box-shadow: 0 ${Math.round(config.shadow / 2)}px ${config.shadow}px rgba(15, 23, 42, 0.16);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);`;
    case "neumorphic":
      return `background: ${config.background};
  color: ${config.textColor};
  border-color: transparent;
  box-shadow: ${Math.round(config.shadow / 2)}px ${Math.round(config.shadow / 2)}px ${config.shadow}px rgba(15, 23, 42, 0.18), -${Math.round(config.shadow / 2)}px -${Math.round(config.shadow / 2)}px ${config.shadow}px rgba(255, 255, 255, 0.72);`;
    case "three-d":
      return `background: ${config.background};
  color: ${config.textColor};
  box-shadow: 0 ${Math.max(3, Math.round(config.shadow / 3))}px 0 rgba(0, 0, 0, 0.28), 0 ${config.shadow}px ${Math.round(config.shadow * 1.6)}px rgba(${hexToRgb(config.background)}, 0.22);`;
    case "icon":
      return `width: ${config.paddingX * 2 + config.fontSize}px;
  aspect-ratio: 1;
  padding: 0;
  background: ${config.background};
  color: ${config.textColor};
  box-shadow: 0 ${Math.round(config.shadow / 2)}px ${config.shadow}px rgba(${hexToRgb(config.background)}, 0.24);`;
    case "loading":
      return `background: ${config.background};
  color: ${config.textColor};
  box-shadow: 0 ${Math.round(config.shadow / 2)}px ${config.shadow}px rgba(${hexToRgb(config.background)}, 0.24);`;
    case "pill":
    case "solid":
    default:
      return `background: ${config.background};
  color: ${config.textColor};
  box-shadow: 0 ${Math.round(config.shadow / 2)}px ${config.shadow}px rgba(${hexToRgb(config.background)}, 0.24);`;
  }
}

function hoverStyles(config: ButtonGeneratorConfig, selector: string) {
  if (config.disabled || config.hoverEffect === "none") return "";
  const effect = {
    lift: "transform: translateY(-2px);",
    glow: `box-shadow: 0 ${Math.round(config.shadow / 2)}px ${config.shadow * 2}px rgba(${hexToRgb(config.background)}, 0.42);`,
    darken: "filter: brightness(0.92);",
    scale: "transform: scale(1.04);",
    slide: "transform: translateX(2px);",
    none: "",
  }[config.hoverEffect];
  return `${selector}:hover,
${selector}.is-preview-hover {
  ${effect}
}`;
}

export function generateButtonCss(config: ButtonGeneratorConfig) {
  const selector = `.${safeClassName(config.className)}`;
  const focus = config.includeFocusRing
    ? `\n\n${selector}:focus-visible {\n  outline: 3px solid rgba(${hexToRgb(config.background)}, 0.34);\n  outline-offset: 3px;\n}`
    : "";
  const active = config.activeEffect && !config.disabled
    ? `\n\n${selector}:active,\n${selector}.is-preview-active {\n  transform: translateY(1px) scale(0.99);\n}`
    : "";
  const reducedMotion = config.includeReducedMotion
    ? `\n\n@media (prefers-reduced-motion: reduce) {\n  ${selector} {\n    transition: none;\n  }\n\n  ${selector}__spinner {\n    animation: none;\n  }\n}`
    : "";

  return `${selector} {
  ${baseStyles(config)}
  ${variantStyles(config)}
}

${hoverStyles(config, selector)}${active}${focus}

${selector}__spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 999px;
  animation: darma-button-spin 800ms linear infinite;
}

${selector}__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes darma-button-spin {
  to { transform: rotate(360deg); }
}${reducedMotion}`;
}

export function generateButtonHtml(config: ButtonGeneratorConfig) {
  const className = safeClassName(config.className);
  const spinner = config.variant === "loading" ? `<span class="${className}__spinner" aria-hidden="true"></span>` : "";
  const icon = config.variant === "icon" ? `<span aria-hidden="true">${escapeHtml(config.iconSymbol || "→")}</span>` : "";
  const label = config.variant === "icon" ? `<span class="${className}__sr-only">${escapeHtml(config.text)}</span>` : escapeHtml(config.text);
  const content = config.iconPosition === "left" ? `${icon}${spinner}${label}` : `${spinner}${label}${icon}`;
  const disabled = config.disabled ? " disabled aria-disabled=\"true\"" : "";
  const busy = config.variant === "loading" ? " aria-busy=\"true\"" : "";
  return `<button class="${className}"${disabled}${busy}>${content}</button>`;
}

export function generateButtonTailwind(config: ButtonGeneratorConfig) {
  const width = config.fullWidth ? "w-full" : config.minWidth > 0 ? `min-w-[${config.minWidth}px]` : "";
  const radius = config.variant === "pill" ? "rounded-full" : `rounded-[${config.radius}px]`;
  const background = config.variant === "gradient" ? `linear-gradient(135deg, ${config.background}, ${config.background2})` : config.variant === "outline" || config.variant === "ghost" ? "transparent" : config.background;
  return `<button className="inline-flex items-center justify-center gap-2 ${width} ${radius} border px-[${config.paddingX}px] py-[${config.paddingY}px] text-[${config.fontSize}px] font-[${config.fontWeight}] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ background: "${background}", color: "${config.textColor}", borderColor: "${config.variant === "ghost" ? "transparent" : config.borderColor}" }}>
  ${config.text}
</button>`;
}

export function generateButtonJsx(config: ButtonGeneratorConfig) {
  return `export function GeneratedButton() {
  return (
    ${generateButtonHtml(config).replace(/class=/g, "className=")}
  );
}`;
}

export function generateButtonVariables(config: ButtonGeneratorConfig) {
  const selector = `.${safeClassName(config.className)}`;
  return `${selector} {
  --button-bg: ${config.background};
  --button-bg-2: ${config.background2};
  --button-text: ${config.textColor};
  --button-border: ${config.borderColor};
  --button-radius: ${config.variant === "pill" ? 999 : config.radius}px;
  --button-px: ${config.paddingX}px;
  --button-py: ${config.paddingY}px;
  --button-shadow: ${config.shadow}px;
}`;
}

export function generateButtonReactStyle(config: ButtonGeneratorConfig) {
  const background = config.variant === "gradient" ? `linear-gradient(135deg, ${config.background}, ${config.background2})` : config.variant === "outline" || config.variant === "ghost" ? "transparent" : config.background;
  return `const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.55rem",
  padding: "${config.paddingY}px ${config.paddingX}px",
  borderRadius: "${config.variant === "pill" ? 999 : config.radius}px",
  border: "1px solid ${config.variant === "ghost" ? "transparent" : config.borderColor}",
  background: "${background}",
  color: "${config.textColor}",
  fontSize: ${config.fontSize},
  fontWeight: ${config.fontWeight},
  boxShadow: "0 ${Math.round(config.shadow / 2)}px ${config.shadow}px rgba(${hexToRgb(config.background)}, 0.24)",
};`;
}

export function generateButtonTokenJson(config: ButtonGeneratorConfig) {
  return JSON.stringify(
    {
      button: {
        className: safeClassName(config.className),
        variant: config.variant,
        text: config.text,
        colors: {
          background: config.background,
          background2: config.background2,
          text: config.textColor,
          border: config.borderColor,
        },
        typography: {
          fontSize: `${config.fontSize}px`,
          fontWeight: config.fontWeight,
          letterSpacing: `${config.letterSpacing}px`,
          uppercase: config.uppercase,
        },
        shape: {
          radius: config.variant === "pill" ? "999px" : `${config.radius}px`,
          paddingX: `${config.paddingX}px`,
          paddingY: `${config.paddingY}px`,
          minWidth: config.minWidth ? `${config.minWidth}px` : "auto",
        },
        interaction: {
          hoverEffect: config.hoverEffect,
          activeEffect: config.activeEffect,
          focusRing: config.includeFocusRing,
          reducedMotion: config.includeReducedMotion,
        },
      },
    },
    null,
    2,
  );
}
