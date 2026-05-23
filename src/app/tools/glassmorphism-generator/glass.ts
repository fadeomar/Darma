import type { CSSProperties } from "react";
import type { GlassComponentType, GlassmorphismState, GlassScenePreset, GlassValidationMessage, ShadowPreset } from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").trim();
  const value = clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean;
  const parsed = Number.parseInt(value || "ffffff", 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function alphaColor(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r} ${g} ${b} / ${clamp(alpha, 0, 1).toFixed(2)})`;
}

function shadowValue(preset: ShadowPreset, customShadow: string) {
  if (preset === "none") return "none";
  if (preset === "soft") return "0 16px 48px rgb(15 23 42 / 0.16)";
  if (preset === "medium") return "0 24px 80px rgb(15 23 42 / 0.22)";
  if (preset === "strong") return "0 34px 110px rgb(15 23 42 / 0.32)";
  return customShadow || "0 24px 80px rgb(15 23 42 / 0.22)";
}

function componentTag(type: GlassComponentType) {
  if (type === "navbar") return "nav";
  if (type === "button") return "button";
  if (type === "sidebar") return "aside";
  if (type === "modal") return "section";
  return "article";
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

function jsxText(value: string) {
  return value.replace(/`/g, "\\`").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
}

export function createDefaultGlassmorphismState(): GlassmorphismState {
  return {
    presetId: "frosted-card",
    effect: {
      tintColor: "#ffffff",
      opacity: 0.16,
      blur: 18,
      saturation: 160,
      brightness: 105,
      contrast: 105,
      borderColor: "#ffffff",
      borderOpacity: 0.28,
      borderWidth: 1,
      shadowPreset: "medium",
      customShadow: "0 24px 80px rgb(15 23 42 / 0.22)",
    },
    shape: {
      componentType: "card",
      width: 380,
      minHeight: 260,
      padding: 32,
      borderRadius: 28,
    },
    scene: {
      preset: "aurora",
      colorA: "#7c3aed",
      colorB: "#06b6d4",
      colorC: "#f97316",
      animated: true,
      noiseEnabled: true,
      noiseOpacity: 0.07,
    },
    content: {
      eyebrow: "Glass UI",
      title: "Frosted interface panel",
      description: "A translucent component with backdrop blur, subtle borders, and soft depth for modern interfaces.",
      actionLabel: "View details",
      textColor: "#ffffff",
      accentColor: "#67e8f9",
    },
    fallback: {
      includeWebkitPrefix: true,
      includeSupportsFallback: true,
      includeReducedTransparency: true,
      includeReducedMotion: true,
      includePerformanceComment: true,
    },
    exportOptions: {
      className: "glass-card",
      componentName: "GlassCard",
      includeComments: true,
      includeDemoScene: true,
      includeNoisePseudoElement: true,
      quoteStyle: "double",
    },
    showBeforeAfter: false,
    showReadabilityHints: true,
  };
}

export function generateSceneBackground(preset: GlassScenePreset, state: GlassmorphismState) {
  const { colorA, colorB, colorC } = state.scene;
  if (preset === "mesh") return `radial-gradient(circle at 15% 20%, ${colorA}, transparent 32%), radial-gradient(circle at 85% 15%, ${colorB}, transparent 30%), radial-gradient(circle at 55% 85%, ${colorC}, transparent 34%), linear-gradient(135deg, #0f172a, #312e81)`;
  if (preset === "dark-dashboard") return `radial-gradient(circle at 15% 20%, rgb(59 130 246 / 0.35), transparent 28%), linear-gradient(135deg, #020617, #111827 48%, #172554)`;
  if (preset === "light-pastel") return `radial-gradient(circle at 20% 20%, #fbcfe8, transparent 32%), radial-gradient(circle at 80% 35%, #bfdbfe, transparent 28%), linear-gradient(135deg, #f8fafc, #e0f2fe)`;
  if (preset === "neon") return `radial-gradient(circle at 20% 20%, #22d3ee, transparent 30%), radial-gradient(circle at 70% 25%, #e879f9, transparent 32%), radial-gradient(circle at 45% 85%, #a3e635, transparent 26%), #020617`;
  if (preset === "abstract-blobs") return `radial-gradient(circle at 25% 30%, ${colorA}, transparent 30%), radial-gradient(circle at 75% 25%, ${colorB}, transparent 28%), radial-gradient(circle at 60% 80%, ${colorC}, transparent 30%), #0f172a`;
  if (preset === "grid") return `linear-gradient(135deg, rgb(15 23 42 / 0.98), rgb(30 41 59 / 0.94)), linear-gradient(to right, rgb(255 255 255 / 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.12) 1px, transparent 1px)`;
  if (preset === "custom-gradient") return `linear-gradient(135deg, ${colorA}, ${colorB} 50%, ${colorC})`;
  return `radial-gradient(circle at 18% 18%, ${colorA}, transparent 34%), radial-gradient(circle at 78% 20%, ${colorB}, transparent 30%), radial-gradient(circle at 45% 92%, ${colorC}, transparent 36%), linear-gradient(135deg, #0f172a, #1e1b4b 52%, #164e63)`;
}

export function getScenePreviewStyle(state: GlassmorphismState): CSSProperties {
  return {
    background: generateSceneBackground(state.scene.preset, state),
    backgroundSize: state.scene.preset === "grid" ? "auto, 36px 36px, 36px 36px" : "cover",
  };
}

export function getGlassPreviewStyle(state: GlassmorphismState): CSSProperties {
  const { effect, shape, content } = state;
  return {
    width: `${shape.width}px`,
    minHeight: `${shape.minHeight}px`,
    maxWidth: "100%",
    padding: `${shape.padding}px`,
    borderRadius: `${shape.borderRadius}px`,
    color: content.textColor,
    background: alphaColor(effect.tintColor, effect.opacity),
    border: effect.borderWidth > 0 ? `${effect.borderWidth}px solid ${alphaColor(effect.borderColor, effect.borderOpacity)}` : "none",
    boxShadow: shadowValue(effect.shadowPreset, effect.customShadow),
    backdropFilter: state.showBeforeAfter ? "none" : `blur(${effect.blur}px) saturate(${effect.saturation}%) brightness(${effect.brightness}%) contrast(${effect.contrast}%)`,
    WebkitBackdropFilter: state.showBeforeAfter ? "none" : `blur(${effect.blur}px) saturate(${effect.saturation}%) brightness(${effect.brightness}%) contrast(${effect.contrast}%)`,
  };
}

export function generateNoiseCss(state: GlassmorphismState): string {
  if (!state.exportOptions.includeNoisePseudoElement || !state.scene.noiseEnabled) return "";
  const className = state.exportOptions.className;
  return `\n.${className}::before {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n  border-radius: inherit;\n  opacity: ${state.scene.noiseOpacity.toFixed(2)};\n  background-image: radial-gradient(rgb(255 255 255 / 0.6) 1px, transparent 1px);\n  background-size: 6px 6px;\n}\n`;
}

export function generateFallbackCss(state: GlassmorphismState): string {
  const className = state.exportOptions.className;
  const filter = `blur(${state.effect.blur}px) saturate(${state.effect.saturation}%) brightness(${state.effect.brightness}%) contrast(${state.effect.contrast}%)`;
  const lines: string[] = [];
  if (state.fallback.includeSupportsFallback) {
    lines.push(`@supports ((backdrop-filter: ${filter}) or (-webkit-backdrop-filter: ${filter})) {`);
    lines.push(`  .${className} {`);
    lines.push(`    backdrop-filter: ${filter};`);
    if (state.fallback.includeWebkitPrefix) lines.push(`    -webkit-backdrop-filter: ${filter};`);
    lines.push("  }");
    lines.push("}");
  }
  if (state.fallback.includeReducedTransparency) {
    lines.push(`\n@media (prefers-reduced-transparency: reduce) {`);
    lines.push(`  .${className} {`);
    lines.push("    backdrop-filter: none;");
    if (state.fallback.includeWebkitPrefix) lines.push("    -webkit-backdrop-filter: none;");
    lines.push(`    background: ${alphaColor(state.effect.tintColor, 0.92)};`);
    lines.push("  }");
    lines.push("}");
  }
  if (state.fallback.includeReducedMotion && state.scene.animated) {
    lines.push(`\n@media (prefers-reduced-motion: reduce) {`);
    lines.push("  .glass-scene {");
    lines.push("    animation: none;");
    lines.push("  }");
    lines.push("}");
  }
  return lines.join("\n");
}

export function generateSceneCss(state: GlassmorphismState): string {
  if (!state.exportOptions.includeDemoScene) return "";
  const animation = state.scene.animated ? "\n  animation: glass-scene-shift 12s ease-in-out infinite alternate;" : "";
  const keyframes = state.scene.animated
    ? `\n\n@keyframes glass-scene-shift {\n  from { background-position: 0% 50%; }\n  to { background-position: 100% 50%; }\n}`
    : "";
  return `.glass-scene {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  padding: 2rem;\n  background: ${generateSceneBackground(state.scene.preset, state)};\n  background-size: 160% 160%;${animation}\n}${keyframes}\n`;
}

export function generateGlassCss(state: GlassmorphismState): string {
  const { effect, shape, content, exportOptions, fallback } = state;
  const className = exportOptions.className || "glass-card";
  const filter = `blur(${effect.blur}px) saturate(${effect.saturation}%) brightness(${effect.brightness}%) contrast(${effect.contrast}%)`;
  const lines: string[] = [];
  if (exportOptions.includeComments) lines.push("/* Generated with Darma Glassmorphism CSS Generator */");
  if (fallback.includePerformanceComment) lines.push("/* Test backdrop-filter performance over your real production background. */");
  lines.push(`.${className} {`);
  lines.push("  position: relative;");
  lines.push("  overflow: hidden;");
  lines.push(`  width: min(100%, ${shape.width}px);`);
  lines.push(`  min-height: ${shape.minHeight}px;`);
  lines.push(`  padding: ${shape.padding}px;`);
  lines.push(`  border-radius: ${shape.borderRadius}px;`);
  lines.push(`  color: ${content.textColor};`);
  lines.push(`  background: ${alphaColor(effect.tintColor, effect.opacity)};`);
  lines.push(effect.borderWidth > 0 ? `  border: ${effect.borderWidth}px solid ${alphaColor(effect.borderColor, effect.borderOpacity)};` : "  border: 0;");
  lines.push(`  box-shadow: ${shadowValue(effect.shadowPreset, effect.customShadow)};`);
  if (!fallback.includeSupportsFallback) {
    lines.push(`  backdrop-filter: ${filter};`);
    if (fallback.includeWebkitPrefix) lines.push(`  -webkit-backdrop-filter: ${filter};`);
  }
  lines.push("}");
  lines.push(`\n.${className}__eyebrow {\n  margin: 0 0 0.75rem;\n  color: ${content.accentColor};\n  font-size: 0.75rem;\n  font-weight: 800;\n  letter-spacing: 0.16em;\n  text-transform: uppercase;\n}`);
  lines.push(`\n.${className}__title {\n  margin: 0;\n  font-size: clamp(1.5rem, 5vw, 2.35rem);\n  line-height: 1.05;\n}`);
  lines.push(`\n.${className}__description {\n  margin: 1rem 0 0;\n  max-width: 36rem;\n  line-height: 1.7;\n  color: color-mix(in srgb, ${content.textColor} 82%, transparent);\n}`);
  lines.push(`\n.${className}__action {\n  display: inline-flex;\n  margin-top: 1.5rem;\n  color: ${content.accentColor};\n  font-weight: 800;\n  text-decoration: none;\n}`);
  const noise = generateNoiseCss(state);
  if (noise) lines.push(noise.trimEnd());
  const fallbackCss = generateFallbackCss(state);
  if (fallbackCss) lines.push(`\n${fallbackCss}`);
  const sceneCss = generateSceneCss(state);
  if (sceneCss) lines.push(`\n${sceneCss}`);
  return lines.join("\n");
}

export function generateGlassHtml(state: GlassmorphismState): string {
  const tag = componentTag(state.shape.componentType);
  const className = state.exportOptions.className;
  const buttonAttrs = tag === "button" ? " type=\"button\"" : "";
  const inner = `  <p class=\"${className}__eyebrow\">${escapeHtml(state.content.eyebrow)}</p>\n  <h3 class=\"${className}__title\">${escapeHtml(state.content.title)}</h3>\n  <p class=\"${className}__description\">\n    ${escapeHtml(state.content.description)}\n  </p>\n  <a class=\"${className}__action\" href=\"#\">${escapeHtml(state.content.actionLabel)}</a>`;
  const component = `<${tag} class=\"${className}\"${buttonAttrs}>\n${inner}\n</${tag}>`;
  if (!state.exportOptions.includeDemoScene) return component;
  return `<div class=\"glass-scene\">\n${component.replace(/^/gm, "  ")}\n</div>`;
}

export function generateGlassJsx(state: GlassmorphismState): string {
  const tag = componentTag(state.shape.componentType);
  const className = state.exportOptions.className;
  const componentName = state.exportOptions.componentName || "GlassCard";
  const buttonAttrs = tag === "button" ? " type=\"button\"" : "";
  const component = `<${tag} className=\"${className}\"${buttonAttrs}>\n      <p className=\"${className}__eyebrow\">${jsxText(state.content.eyebrow)}</p>\n      <h3 className=\"${className}__title\">${jsxText(state.content.title)}</h3>\n      <p className=\"${className}__description\">\n        ${jsxText(state.content.description)}\n      </p>\n      <a className=\"${className}__action\" href=\"#\">\n        ${jsxText(state.content.actionLabel)}\n      </a>\n    </${tag}>`;
  const wrapped = state.exportOptions.includeDemoScene ? `<div className=\"glass-scene\">\n    ${component}\n  </div>` : component;
  return `export function ${componentName}() {\n  return (\n    ${wrapped}\n  );\n}`;
}

export function generateTailwindStarter(state: GlassmorphismState): string {
  const radius = state.shape.borderRadius >= 32 ? "rounded-[2rem]" : state.shape.borderRadius >= 24 ? "rounded-3xl" : "rounded-2xl";
  const blur = state.effect.blur >= 28 ? "backdrop-blur-3xl" : state.effect.blur >= 18 ? "backdrop-blur-xl" : state.effect.blur >= 8 ? "backdrop-blur-md" : "backdrop-blur-sm";
  return `<div className=\"${radius} border border-white/30 bg-white/15 p-8 text-white shadow-2xl ${blur} backdrop-saturate-150\">\n  <p className=\"text-xs font-bold uppercase tracking-widest text-cyan-200\">${state.content.eyebrow}</p>\n  <h3 className=\"mt-3 text-3xl font-black\">${state.content.title}</h3>\n  <p className=\"mt-4 text-white/80\">${state.content.description}</p>\n</div>`;
}

export function randomizeGlassState(state: GlassmorphismState): GlassmorphismState {
  const colors = ["#ffffff", "#e0f2fe", "#f5d0fe", "#ccfbf1", "#111827"];
  const scenes: GlassScenePreset[] = ["aurora", "mesh", "neon", "abstract-blobs", "light-pastel", "dark-dashboard"];
  const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)] ?? items[0];
  return {
    ...state,
    effect: {
      ...state.effect,
      tintColor: pick(colors),
      opacity: Number((0.10 + Math.random() * 0.22).toFixed(2)),
      blur: Math.round(10 + Math.random() * 26),
      saturation: Math.round(120 + Math.random() * 90),
      borderOpacity: Number((0.18 + Math.random() * 0.28).toFixed(2)),
      shadowPreset: pick(["soft", "medium", "strong"]),
    },
    shape: {
      ...state.shape,
      borderRadius: Math.round(16 + Math.random() * 44),
      padding: Math.round(20 + Math.random() * 36),
    },
    scene: {
      ...state.scene,
      preset: pick(scenes),
      noiseEnabled: Math.random() > 0.25,
    },
  };
}

export function validateGlassmorphismState(state: GlassmorphismState): GlassValidationMessage[] {
  const messages: GlassValidationMessage[] = [];
  if (state.effect.opacity > 0.85) {
    messages.push({ type: "warning", message: "Backdrop blur becomes hard to see when the glass background is nearly opaque.", field: "opacity" });
  }
  if (state.effect.opacity < 0.09) {
    messages.push({ type: "warning", message: "Very low tint opacity can make text hard to read on busy backgrounds.", field: "opacity" });
  }
  if (state.effect.blur > 32) {
    messages.push({ type: "warning", message: "High backdrop blur can affect performance on complex or animated backgrounds.", field: "blur" });
  }
  if (!state.fallback.includeWebkitPrefix) {
    messages.push({ type: "info", message: "Consider including -webkit-backdrop-filter for broader Safari compatibility.", field: "fallback" });
  }
  if (!state.fallback.includeSupportsFallback) {
    messages.push({ type: "info", message: "A @supports fallback helps browsers that do not apply backdrop-filter.", field: "fallback" });
  }
  if (state.scene.animated && state.effect.blur > 20) {
    messages.push({ type: "info", message: "Animated backgrounds behind blurred glass should be tested on low-power devices.", field: "scene" });
  }
  messages.push({ type: "info", message: "Glass effects respond to what is behind the element, so test over your real production background." });
  return messages;
}
