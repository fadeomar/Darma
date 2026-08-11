import type { ButtonGeneratorConfig } from "./types";
import { sanitizeCustomCssOverrides } from "./studio-tools";

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

export function getReadableTextColorForBackgrounds(backgrounds: string[]): string {
  const candidates: string[] = ["#ffffff", "#111827"];
  const normalizedBackgrounds = backgrounds.length ? backgrounds : ["#ffffff"];
  return candidates.reduce((best, candidate) => {
    const candidateScore = Math.min(...normalizedBackgrounds.map((background) => getContrastRatio(candidate, background)));
    const bestScore = Math.min(...normalizedBackgrounds.map((background) => getContrastRatio(best, background)));
    return candidateScore > bestScore ? candidate : best;
  }, candidates[0]);
}

export function getReadableTextColor(background: string) {
  return getReadableTextColorForBackgrounds([background]);
}

export function safeClassName(value: string) {
  const cleaned = value.trim().replace(/^\./, "").replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
  if (!cleaned) return "darma-button";
  if (/^[a-zA-Z_]/.test(cleaned)) return cleaned;
  return `darma-${cleaned.replace(/^-+/, "") || "button"}`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function jsxText(value: string) {
  return `{${JSON.stringify(value)}}`;
}

function radiusValue(config: ButtonGeneratorConfig) {
  if (config.shape === "square") return 0;
  if (config.shape === "pill") return 999;
  return config.radius;
}

function borderValue(config: ButtonGeneratorConfig) {
  if (!config.borderEnabled && config.style !== "outline") return "0 solid transparent";
  const width = Math.max(1, config.borderWidth);
  return `${width}px ${config.borderStyle} ${config.borderColor}`;
}

function shadowValue(config: ButtonGeneratorConfig) {
  if (!config.shadowEnabled) return "none";
  const inset = config.shadowInset ? "inset " : "";
  return `${inset}${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px ${config.shadowSpread}px rgba(${hexToRgb(config.shadowColor)}, ${config.shadowOpacity})`;
}

function baseStyles(config: ButtonGeneratorConfig) {
  const width = config.fullWidth ? "width: 100%;" : config.minWidth > 0 ? `min-width: ${config.minWidth}px;` : "";
  const opacity = "cursor: pointer;";
  const transform = config.uppercase ? "text-transform: uppercase;" : "";
  const letterSpacing = config.letterSpacing ? `letter-spacing: ${config.letterSpacing}px;` : "letter-spacing: normal;";
  const iconOnlySize = config.contentMode === "icon-only" ? `width: ${config.paddingY * 2 + config.fontSize}px; aspect-ratio: 1; padding: 0;` : "";
  return `position: relative;
  isolation: isolate;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: ${config.paddingY * 2 + config.fontSize * config.lineHeight}px;
  padding: ${config.paddingY}px ${config.paddingX}px;
  border-radius: ${radiusValue(config)}px;
  border: ${borderValue(config)};
  font-size: ${config.fontSize}px;
  font-weight: ${config.fontWeight};
  line-height: ${config.lineHeight};
  text-decoration: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform ${config.motionDuration}ms ${config.motionEasing}, box-shadow ${config.motionDuration}ms ${config.motionEasing}, filter ${config.motionDuration}ms ${config.motionEasing}, background ${config.motionDuration}ms ${config.motionEasing}, color ${config.motionDuration}ms ${config.motionEasing}, border-color ${config.motionDuration}ms ${config.motionEasing};
  ${letterSpacing}
  ${transform}
  ${iconOnlySize}
  ${width}
  ${opacity}`;
}

function variantStyles(config: ButtonGeneratorConfig) {
  const shadow = shadowValue(config);
  switch (config.style) {
    case "outline":
      return `background: transparent;
  color: ${config.textColor};
  box-shadow: ${shadow};`;
    case "ghost":
      return `background: transparent;
  color: ${config.textColor};
  border-color: transparent;
  box-shadow: none;`;
    case "gradient":
      return `background: linear-gradient(${config.gradientAngle}deg, ${config.background}, ${config.background2});
  color: ${config.textColor};
  border-color: transparent;
  box-shadow: ${shadow};`;
    case "glass":
      return `background: rgba(${hexToRgb(config.background)}, 0.28);
  color: ${config.textColor};
  box-shadow: ${shadow};
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);`;
    case "neumorphic":
      return `background: ${config.background};
  color: ${config.textColor};
  border-color: transparent;
  box-shadow: ${config.shadowEnabled ? `${Math.max(4, Math.abs(config.shadowX || Math.round(config.shadowBlur / 2)))}px ${Math.max(4, Math.abs(config.shadowY || Math.round(config.shadowBlur / 2)))}px ${config.shadowBlur}px rgba(${hexToRgb(config.shadowColor)}, ${Math.min(config.shadowOpacity, 0.28)}), -${Math.max(4, Math.abs(config.shadowX || Math.round(config.shadowBlur / 2)))}px -${Math.max(4, Math.abs(config.shadowY || Math.round(config.shadowBlur / 2)))}px ${config.shadowBlur}px rgba(255, 255, 255, 0.72)` : "none"};`;
    case "three-d":
      return `background: ${config.background};
  color: ${config.textColor};
  box-shadow: ${config.shadowEnabled ? `0 ${Math.max(3, config.shadowY)}px 0 rgba(${hexToRgb(config.shadowColor)}, ${Math.max(config.shadowOpacity, 0.32)}), ${config.shadowX}px ${Math.max(config.shadowY + 6, 8)}px ${Math.max(config.shadowBlur, 16)}px rgba(${hexToRgb(config.shadowColor)}, ${Math.min(config.shadowOpacity, 0.32)})` : "none"};`;
    case "solid":
    default:
      return `background: ${config.background};
  color: ${config.textColor};
  box-shadow: ${shadow};`;
  }
}

function hoverStyles(config: ButtonGeneratorConfig, selector: string) {
  if (config.disabled || config.loading) return "";

  if (config.customizeHoverState) {
    const customShadow = config.shadowEnabled
      ? `box-shadow: ${config.shadowX}px ${config.hoverShadowY}px ${config.hoverShadowBlur}px ${config.shadowSpread}px rgba(${hexToRgb(config.shadowColor)}, ${Math.min(1, config.shadowOpacity + 0.12)});`
      : "";
    return `${selector}:hover,
${selector}.is-preview-hover {
  background: ${config.hoverBackground};
  color: ${config.hoverTextColor};
  border-color: ${config.hoverBorderColor};
  transform: translateY(${config.hoverTranslateY}px) scale(${config.hoverScale});
  ${customShadow}
}`;
  }

  if (config.hoverEffect === "none") return "";
  const effect = {
    lift: "transform: translateY(-2px);",
    glow: `box-shadow: 0 ${Math.max(6, config.shadowY)}px ${Math.max(24, config.shadowBlur * 1.7)}px rgba(${hexToRgb(config.shadowColor)}, ${Math.max(0.32, Math.min(config.shadowOpacity + 0.18, 0.62))});`,
    darken: "filter: brightness(0.92);",
    scale: "transform: scale(1.04);",
    slide: "transform: translateX(3px);",
    shine: "filter: brightness(1.04);",
    fill: `background: ${config.background}; color: ${getReadableTextColor(config.background)};`,
    pulse: `box-shadow: 0 0 0 7px rgba(${hexToRgb(config.shadowColor)}, ${Math.min(0.2, Math.max(0.1, config.shadowOpacity))});`,
    bounce: "transform: translateY(-4px) scale(1.02);",
    "icon-shift": "filter: brightness(1.02);",
    none: "",
  }[config.hoverEffect];
  return `${selector}:hover,
${selector}.is-preview-hover {
  ${effect}
}`;
}

function decorativeEffectStyles(config: ButtonGeneratorConfig, selector: string) {
  if (config.disabled || config.loading || config.customizeHoverState) return "";
  if (config.hoverEffect === "shine") {
    return `

${selector}::after {
  content: "";
  position: absolute;
  inset: -45% auto -45% -35%;
  width: 28%;
  transform: rotate(18deg) translateX(-220%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.72), transparent);
  transition: transform ${Math.max(320, config.motionDuration * 2)}ms ${config.motionEasing};
  pointer-events: none;
}

${selector}:hover::after,
${selector}.is-preview-hover::after {
  transform: rotate(18deg) translateX(560%);
}`;
  }
  if (config.hoverEffect === "fill" && config.style === "outline") {
    return `

${selector} {
  background-image: linear-gradient(${config.background}, ${config.background});
  background-repeat: no-repeat;
  background-size: 0 100%;
  background-position: left center;
  transition: background-size ${config.motionDuration}ms ${config.motionEasing}, color ${config.motionDuration}ms ${config.motionEasing}, transform ${config.motionDuration}ms ${config.motionEasing}, box-shadow ${config.motionDuration}ms ${config.motionEasing};
}

${selector}:hover,
${selector}.is-preview-hover {
  background-size: 100% 100%;
}`;
  }
  if (config.hoverEffect === "icon-shift") {
    return `

${selector}__icon {
  transition: transform ${config.motionDuration}ms ${config.motionEasing};
}

${selector}:hover ${selector}__icon,
${selector}.is-preview-hover ${selector}__icon {
  transform: translateX(${config.iconPosition === "right" ? 3 : -3}px);
}`;
  }
  return "";
}
export function generateButtonCss(config: ButtonGeneratorConfig) {
  const selector = `.${safeClassName(config.className)}`;
  const focus = config.includeFocusRing
    ? `\n\n${selector}:focus-visible,\n${selector}.is-preview-focus {\n  outline: ${config.focusRingWidth}px solid ${config.focusRingColor};\n  outline-offset: ${config.focusRingOffset}px;\n}`
    : "";
  const active = config.activeEffect && !config.disabled && !config.loading
    ? config.customizeActiveState
      ? `\n\n${selector}:active,\n${selector}.is-preview-active {\n  background: ${config.activeBackground};\n  color: ${config.activeTextColor};\n  border-color: ${config.activeBorderColor};\n  transform: translateY(${config.activeTranslateY}px) scale(${config.activeScale});\n}`
      : `\n\n${selector}:active,\n${selector}.is-preview-active {\n  transform: translateY(1px) scale(0.99);\n}`
    : "";
  const reducedMotion = config.includeReducedMotion
    ? `\n\n@media (prefers-reduced-motion: reduce) {\n  ${selector},\n  ${selector}::after,\n  ${selector}__icon {\n    transition: none;\n    transform: none;\n  }\n\n  ${selector}__spinner {\n    animation: none;\n  }\n}`
    : "";

  const disabled = `\n\n${selector}:disabled,\n${selector}[aria-disabled="true"] {\n  opacity: ${config.disabledOpacity};\n  cursor: not-allowed;\n  pointer-events: none;\n}`;
  const responsiveWidth = config.mobileFullWidth && !config.fullWidth
    ? `\n\n@media (max-width: 640px) {\n  ${selector} {\n    width: 100%;\n  }\n}`
    : "";

  return `${selector} {
  ${baseStyles(config)}
  ${variantStyles(config)}
  ${sanitizeCustomCssOverrides(config.customCss)}
}

${hoverStyles(config, selector)}${decorativeEffectStyles(config, selector)}${active}${focus}${disabled}

${selector}__spinner {
  width: 1em;
  height: 1em;
  flex: 0 0 auto;
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
}${responsiveWidth}${reducedMotion}`;
}

export function generateButtonHtml(config: ButtonGeneratorConfig) {
  const className = safeClassName(config.className);
  const spinner = config.loading ? `<span class="${className}__spinner" aria-hidden="true"></span>` : "";
  const usesIcon = config.contentMode === "text-icon" || config.contentMode === "icon-only";
  const icon = usesIcon ? `<span class="${className}__icon" aria-hidden="true">${escapeHtml(config.iconSymbol || "→")}</span>` : "";
  const accessibleLabel = config.text.trim() || "Button";
  const label = config.contentMode === "icon-only" ? `<span class="${className}__sr-only">${escapeHtml(accessibleLabel)}</span>` : escapeHtml(accessibleLabel);
  const content = config.iconPosition === "left" ? `${icon}${spinner}${label}` : `${spinner}${label}${icon}`;
  const disabled = config.disabled || config.loading ? " disabled aria-disabled=\"true\"" : "";
  const busy = config.loading ? " aria-busy=\"true\"" : "";
  return `<button type="button" class="${className}"${disabled}${busy}>${content}</button>`;
}

export function generateButtonTailwind(config: ButtonGeneratorConfig) {
  const width = config.fullWidth ? "w-full" : config.mobileFullWidth ? "w-full sm:w-auto" : config.minWidth > 0 ? `min-w-[${config.minWidth}px]` : "";
  const iconOnlySize = config.contentMode === "icon-only" ? `h-[${config.paddingY * 2 + config.fontSize}px] w-[${config.paddingY * 2 + config.fontSize}px] p-0` : `px-[${config.paddingX}px] py-[${config.paddingY}px]`;
  const radius = config.shape === "pill" ? "rounded-full" : config.shape === "square" ? "rounded-none" : `rounded-[${config.radius}px]`;
  const focus = config.includeFocusRing
    ? `focus-visible:outline focus-visible:outline-[${config.focusRingWidth}px] focus-visible:outline-[${config.focusRingColor}] focus-visible:outline-offset-[${config.focusRingOffset}px]`
    : "focus-visible:outline-none";
  const active = config.activeEffect && !config.loading && !config.disabled
    ? `active:translate-y-[${config.customizeActiveState ? config.activeTranslateY : 1}px] active:scale-[${config.customizeActiveState ? config.activeScale : 0.99}]`
    : "";
  const hover = config.loading || config.disabled
    ? ""
    : config.customizeHoverState
      ? `hover:translate-y-[${config.hoverTranslateY}px] hover:scale-[${config.hoverScale}]`
      : config.hoverEffect === "none"
        ? ""
        : config.hoverEffect === "scale"
          ? "hover:scale-[1.04]"
          : config.hoverEffect === "slide"
            ? "hover:translate-x-[3px]"
            : config.hoverEffect === "darken"
              ? "hover:brightness-[0.92]"
              : "hover:-translate-y-0.5";
  const background = config.style === "gradient"
    ? `linear-gradient(${config.gradientAngle}deg, ${config.background}, ${config.background2})`
    : config.style === "outline" || config.style === "ghost"
      ? "transparent"
      : config.style === "glass"
        ? `rgba(${hexToRgb(config.background)}, 0.28)`
        : config.background;
  const backdrop = config.style === "glass" ? ', backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)"' : "";
  const disabledClasses = `disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-[${config.disabledOpacity}]`;
  const uppercase = config.uppercase ? "uppercase" : "";
  const accessibleLabel = config.text.trim() || "Button";
  const icon = config.contentMode === "text-icon" || config.contentMode === "icon-only"
    ? `<span aria-hidden="true">${jsxText(config.iconSymbol || "→")}</span>`
    : "";
  const spinner = config.loading
    ? '<span aria-hidden="true" className="h-[1em] w-[1em] shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent" />'
    : "";
  const label = config.contentMode === "icon-only" ? `<span className="sr-only">${jsxText(accessibleLabel)}</span>` : jsxText(accessibleLabel);
  const content = config.iconPosition === "left" ? `${icon}${spinner}${label}` : `${spinner}${label}${icon}`;
  const disabledAttrs = config.disabled || config.loading ? ' disabled aria-disabled="true"' : "";
  const busyAttr = config.loading ? ' aria-busy="true"' : "";

  return `<button type="button"${disabledAttrs}${busyAttr} className="relative isolate inline-flex min-h-[${config.paddingY * 2 + config.fontSize * config.lineHeight}px] items-center justify-center gap-2 overflow-hidden select-none ${width} ${iconOnlySize} ${radius} text-[${config.fontSize}px] font-[${config.fontWeight}] leading-[${config.lineHeight}] tracking-[${config.letterSpacing}px] ${uppercase} transition ${hover} ${active} ${focus} ${disabledClasses}" style={{ background: "${background}", color: "${config.textColor}", border: "${borderValue(config)}", boxShadow: "${shadowValue(config)}"${backdrop} }}>
  ${content}
</button>`;
}

export function generateButtonJsx(config: ButtonGeneratorConfig) {
  const className = safeClassName(config.className);
  const usesIcon = config.contentMode === "text-icon" || config.contentMode === "icon-only";
  const icon = usesIcon ? `<span className="${className}__icon" aria-hidden="true">${jsxText(config.iconSymbol || "→")}</span>` : "";
  const spinner = config.loading ? `<span className="${className}__spinner" aria-hidden="true" />` : "";
  const accessibleLabel = config.text.trim() || "Button";
  const label = config.contentMode === "icon-only"
    ? `<span className="${className}__sr-only">${jsxText(accessibleLabel)}</span>`
    : jsxText(accessibleLabel);
  const content = config.iconPosition === "left" ? `${icon}${spinner}${label}` : `${spinner}${label}${icon}`;
  const disabled = config.disabled || config.loading ? ' disabled aria-disabled="true"' : "";
  const busy = config.loading ? ' aria-busy="true"' : "";

  return `export function GeneratedButton() {
  return (
    <button type="button" className="${className}"${disabled}${busy}>${content}</button>
  );
}`;
}

export function generateButtonVariables(config: ButtonGeneratorConfig) {
  const selector = `.${safeClassName(config.className)}`;
  return `${selector} {
  --button-bg: ${config.background};
  --button-bg-2: ${config.background2};
  --button-gradient-angle: ${config.gradientAngle}deg;
  --button-text: ${config.textColor};
  --button-border: ${config.borderColor};
  --button-border-width: ${config.borderWidth}px;
  --button-radius: ${radiusValue(config)}px;
  --button-px: ${config.paddingX}px;
  --button-py: ${config.paddingY}px;
  --button-shadow-x: ${config.shadowX}px;
  --button-shadow-y: ${config.shadowY}px;
  --button-shadow-blur: ${config.shadowBlur}px;
  --button-shadow-spread: ${config.shadowSpread}px;
  --button-motion-duration: ${config.motionDuration}ms;
  --button-focus-ring: ${config.focusRingWidth}px;
  --button-focus-offset: ${config.focusRingOffset}px;
}`;
}

export function generateButtonReactStyle(config: ButtonGeneratorConfig) {
  const background = config.style === "gradient" ? `linear-gradient(${config.gradientAngle}deg, ${config.background}, ${config.background2})` : config.style === "outline" || config.style === "ghost" ? "transparent" : config.background;
  return `const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.55rem",
  minHeight: "${config.paddingY * 2 + config.fontSize * config.lineHeight}px",
  ${config.fullWidth ? 'width: "100%",' : config.minWidth > 0 ? `minWidth: "${config.minWidth}px",` : ''}
  padding: "${config.paddingY}px ${config.paddingX}px",
  borderRadius: "${radiusValue(config)}px",
  border: "${borderValue(config)}",
  background: "${background}",
  color: "${config.textColor}",
  fontSize: ${config.fontSize},
  fontWeight: ${config.fontWeight},
  lineHeight: ${config.lineHeight},
  letterSpacing: "${config.letterSpacing}px",
  textTransform: "${config.uppercase ? 'uppercase' : 'none'}",
  boxShadow: "${shadowValue(config)}",
  transition: "transform ${config.motionDuration}ms ${config.motionEasing}, box-shadow ${config.motionDuration}ms ${config.motionEasing}, background ${config.motionDuration}ms ${config.motionEasing}, color ${config.motionDuration}ms ${config.motionEasing}",
};${config.mobileFullWidth && !config.fullWidth ? `\n\n// Responsive companion CSS:\n// @media (max-width: 640px) { .${safeClassName(config.className)} { width: 100%; } }` : ""}`;
}

export function generateButtonTokenJson(config: ButtonGeneratorConfig) {
  return JSON.stringify(
    {
      button: {
        className: safeClassName(config.className),
        style: config.style,
        shape: config.shape,
        contentMode: config.contentMode,
        loading: config.loading,
        disabled: config.disabled,
        disabledWhileLoading: config.loading,
        text: config.text,
        colors: {
          background: config.background,
          background2: config.background2,
          text: config.textColor,
          border: config.borderColor,
          focusRing: config.focusRingColor,
        },
        typography: {
          fontSize: `${config.fontSize}px`,
          fontWeight: config.fontWeight,
          lineHeight: config.lineHeight,
          letterSpacing: `${config.letterSpacing}px`,
          uppercase: config.uppercase,
        },
        dimensions: {
          radius: `${radiusValue(config)}px`,
          paddingX: `${config.paddingX}px`,
          paddingY: `${config.paddingY}px`,
          minWidth: config.minWidth ? `${config.minWidth}px` : "auto",
          fullWidth: config.fullWidth,
          mobileFullWidth: config.mobileFullWidth,
        },
        border: {
          enabled: config.borderEnabled,
          width: `${config.borderWidth}px`,
          style: config.borderStyle,
          color: config.borderColor,
        },
        shadow: {
          enabled: config.shadowEnabled,
          x: `${config.shadowX}px`,
          y: `${config.shadowY}px`,
          blur: `${config.shadowBlur}px`,
          spread: `${config.shadowSpread}px`,
          color: config.shadowColor,
          opacity: config.shadowOpacity,
          inset: config.shadowInset,
        },
        interaction: {
          hoverEffect: config.hoverEffect,
          motionDuration: `${config.motionDuration}ms`,
          motionEasing: config.motionEasing,
          customHover: config.customizeHoverState
            ? {
                background: config.hoverBackground,
                text: config.hoverTextColor,
                border: config.hoverBorderColor,
                translateY: `${config.hoverTranslateY}px`,
                scale: config.hoverScale,
              }
            : null,
          activeEffect: config.activeEffect,
          customActive: config.customizeActiveState
            ? {
                background: config.activeBackground,
                text: config.activeTextColor,
                border: config.activeBorderColor,
                translateY: `${config.activeTranslateY}px`,
                scale: config.activeScale,
              }
            : null,
          focusRing: config.includeFocusRing
            ? { color: config.focusRingColor, width: `${config.focusRingWidth}px`, offset: `${config.focusRingOffset}px` }
            : null,
          disabledOpacity: config.disabledOpacity,
          reducedMotion: config.includeReducedMotion,
        },
        customCss: sanitizeCustomCssOverrides(config.customCss) || null,
      },
    },
    null,
    2,
  );
}
