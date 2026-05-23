import type { ButtonGeneratorConfig } from "./types";

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized.length === 3 ? normalized.split("").map((x) => x + x).join("") : normalized, 16);
  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
}

function baseStyles(config: ButtonGeneratorConfig) {
  const width = config.fullWidth ? "width: 100%;" : "";
  const opacity = config.disabled ? "opacity: 0.55; cursor: not-allowed;" : "cursor: pointer;";
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
  transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease, background 180ms ease;
  ${width}
  ${opacity}`;
}

function variantStyles(config: ButtonGeneratorConfig) {
  switch (config.variant) {
    case "outline":
      return `background: transparent;
  color: ${config.textColor};
  box-shadow: 0 ${Math.round(config.shadow / 3)}px ${config.shadow}px rgba(${hexToRgb(config.borderColor)}, 0.16);`;
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
  backdrop-filter: blur(16px);`;
    case "neumorphic":
      return `background: ${config.background};
  color: ${config.textColor};
  border-color: transparent;
  box-shadow: ${Math.round(config.shadow / 2)}px ${Math.round(config.shadow / 2)}px ${config.shadow}px rgba(15, 23, 42, 0.18), -${Math.round(config.shadow / 2)}px -${Math.round(config.shadow / 2)}px ${config.shadow}px rgba(255, 255, 255, 0.72);`;
    case "three-d":
      return `background: ${config.background};
  color: ${config.textColor};
  box-shadow: 0 ${Math.max(3, Math.round(config.shadow / 3))}px 0 rgba(0, 0, 0, 0.28), 0 ${config.shadow}px ${config.shadow * 1.6}px rgba(${hexToRgb(config.background)}, 0.22);`;
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

function hoverStyles(config: ButtonGeneratorConfig) {
  if (config.disabled || config.hoverEffect === "none") return "";
  const effect = {
    lift: "transform: translateY(-2px);",
    glow: `box-shadow: 0 ${Math.round(config.shadow / 2)}px ${config.shadow * 2}px rgba(${hexToRgb(config.background)}, 0.42);`,
    darken: "filter: brightness(0.92);",
    scale: "transform: scale(1.04);",
    none: "",
  }[config.hoverEffect];
  return `.darma-button:hover {
  ${effect}
}`;
}

export function generateButtonCss(config: ButtonGeneratorConfig) {
  return `.darma-button {
  ${baseStyles(config)}
  ${variantStyles(config)}
}

${hoverStyles(config)}

${config.activeEffect && !config.disabled ? `.darma-button:active {
  transform: translateY(1px) scale(0.99);
}` : ""}

.darma-button:focus-visible {
  outline: 3px solid rgba(${hexToRgb(config.background)}, 0.32);
  outline-offset: 3px;
}

.darma-button__spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 999px;
  animation: darma-spin 800ms linear infinite;
}

@keyframes darma-spin {
  to { transform: rotate(360deg); }
}`;
}

export function generateButtonHtml(config: ButtonGeneratorConfig) {
  const icon = config.variant === "icon" ? "<span aria-hidden=\"true\">➜</span>" : "";
  const loading = config.variant === "loading" ? "<span class=\"darma-button__spinner\" aria-hidden=\"true\"></span>" : "";
  const label = config.variant === "icon" ? `<span class=\"sr-only\">${config.text}</span>` : config.text;
  const content = config.iconPosition === "left" ? `${icon}${loading}${label}` : `${loading}${label}${icon}`;
  return `<button class="darma-button"${config.disabled ? " disabled" : ""}>${content}</button>`;
}

export function generateButtonTailwind(config: ButtonGeneratorConfig) {
  const width = config.fullWidth ? "w-full" : "";
  const radius = config.variant === "pill" ? "rounded-full" : "rounded-[var(--button-radius)]";
  return `<button className="inline-flex items-center justify-center gap-2 ${width} ${radius} px-[${config.paddingX}px] py-[${config.paddingY}px] text-[${config.fontSize}px] font-bold transition hover:-translate-y-0.5" style={{ background: "${config.variant === "gradient" ? `linear-gradient(135deg, ${config.background}, ${config.background2})` : config.background}", color: "${config.textColor}" }}>
  ${config.text}
</button>`;
}

export function generateButtonJsx(config: ButtonGeneratorConfig) {
  return `export function GeneratedButton() {
  return (
    ${generateButtonHtml(config).replace("class=\"darma-button\"", "className=\"darma-button\"")}
  );
}`;
}
