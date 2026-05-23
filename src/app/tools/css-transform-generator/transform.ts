import type { CSSProperties } from "react";
import type {
  Transform2DSettings,
  Transform3DSettings,
  TransformGeneratorState,
  TransformValidationMessage,
} from "./types";

const default2d: Transform2DSettings = {
  translateX: 0,
  translateY: -4,
  translateUnit: "px",
  rotate: 0,
  scaleX: 1,
  scaleY: 1,
  skewX: 0,
  skewY: 0,
  order: ["translate", "rotate", "scale", "skew"],
};

export function createDefaultTransformState(): TransformGeneratorState {
  return {
    presetId: "product-card-tilt",
    mode: "card-tilt",
    transform2d: { ...default2d },
    transform3d: {
      perspective: 900,
      rotateX: 8,
      rotateY: -12,
      rotateZ: 0,
      translateZ: 0,
      transformStyle: "preserve-3d",
      backfaceVisibility: "hidden",
      perspectiveOriginX: 50,
      perspectiveOriginY: 50,
    },
    hover2d: { ...default2d, translateY: -10, scaleX: 1.04, scaleY: 1.04 },
    hover3d: {
      perspective: 900,
      rotateX: 10,
      rotateY: -16,
      rotateZ: 0,
      translateZ: 24,
      transformStyle: "preserve-3d",
      backfaceVisibility: "hidden",
      perspectiveOriginX: 50,
      perspectiveOriginY: 50,
    },
    origin: { preset: "center center", x: "50%", y: "50%", z: "0px" },
    transition: { enabled: true, duration: 220, delay: 0, timingFunction: "ease", includeOpacity: false, includeBoxShadow: true },
    animation: { enabled: true, name: "transform-enter", duration: 480, timingFunction: "ease-out", fillMode: "both", includeReducedMotion: true },
    style: {
      previewObject: "card",
      width: 320,
      height: 220,
      borderRadius: 28,
      padding: 28,
      background: "linear-gradient(135deg, #312e81, #7c3aed 45%, #06b6d4)",
      textColor: "#ffffff",
      shadow: "strong",
    },
    exportOptions: {
      className: "transform-card",
      componentName: "TransformCard",
      includeComments: true,
      includeDemoStyles: true,
      includeReducedMotion: true,
      useTransformGpuHint: true,
      quoteStyle: "double",
    },
    showOriginMarker: true,
    showBeforeOutline: true,
    showAxisOverlay: true,
    show3dGrid: true,
    previewState: "base",
  };
}

function n(value: number, digits = 2): string {
  return Number(value.toFixed(digits)).toString();
}

export function generateTransform2D(settings: Transform2DSettings): string {
  const entries: Record<string, string> = {
    translate: `translate(${n(settings.translateX)}${settings.translateUnit}, ${n(settings.translateY)}${settings.translateUnit})`,
    rotate: `rotate(${n(settings.rotate)}deg)`,
    scale: settings.scaleX === settings.scaleY ? `scale(${n(settings.scaleX)})` : `scale(${n(settings.scaleX)}, ${n(settings.scaleY)})`,
    skew: `skew(${n(settings.skewX)}deg, ${n(settings.skewY)}deg)`,
  };
  return settings.order.map((key) => entries[key]).filter(Boolean).join(" ");
}

export function generateTransform3D(settings: Transform3DSettings): string {
  return [
    `perspective(${settings.perspective}px)`,
    `rotateX(${n(settings.rotateX)}deg)`,
    `rotateY(${n(settings.rotateY)}deg)`,
    `rotateZ(${n(settings.rotateZ)}deg)`,
    `translateZ(${n(settings.translateZ)}px)`,
  ].join(" ");
}

export function generateTransformOrigin(state: TransformGeneratorState): string {
  if (state.origin.preset !== "custom") return state.origin.preset;
  return `${state.origin.x} ${state.origin.y}${state.origin.z.trim() ? ` ${state.origin.z}` : ""}`;
}

function activeTransform(state: TransformGeneratorState, hover = false): string {
  if (state.mode === "3d" || state.mode === "card-tilt") return generateTransform3D(hover ? state.hover3d : state.transform3d);
  if (state.mode === "hover") return generateTransform2D(hover ? state.hover2d : state.transform2d);
  if (state.mode === "entrance") return generateTransform2D(state.transform2d);
  return generateTransform2D(state.transform2d);
}

function shadowValue(shadow: TransformGeneratorState["style"]["shadow"]): string {
  return {
    none: "none",
    soft: "0 12px 36px rgb(15 23 42 / 0.14)",
    medium: "0 18px 56px rgb(15 23 42 / 0.2)",
    strong: "0 26px 90px rgb(15 23 42 / 0.3)",
  }[shadow];
}

function transitionValue(state: TransformGeneratorState): string {
  const parts = [`transform ${state.transition.duration}ms ${state.transition.timingFunction}`];
  if (state.transition.includeOpacity) parts.push(`opacity ${state.transition.duration}ms ${state.transition.timingFunction}`);
  if (state.transition.includeBoxShadow) parts.push(`box-shadow ${state.transition.duration}ms ${state.transition.timingFunction}`);
  const value = parts.join(", ");
  return state.transition.delay > 0 ? `${value};\n  transition-delay: ${state.transition.delay}ms` : value;
}

export function generateReducedMotionCss(state: TransformGeneratorState): string {
  if (!state.exportOptions.includeReducedMotion && !state.animation.includeReducedMotion) return "";
  return `@media (prefers-reduced-motion: reduce) {\n  .${state.exportOptions.className} {\n    transition: none;\n    animation: none;\n  }\n}`;
}

export function generateTransformCss(state: TransformGeneratorState): string {
  const className = state.exportOptions.className || "transform-card";
  const baseTransform = activeTransform(state, false);
  const hoverTransform = activeTransform(state, true);
  const comments = state.exportOptions.includeComments;
  const demo = state.exportOptions.includeDemoStyles;
  const lines: string[] = [];
  if (comments) lines.push("/* Generated with Darma CSS Transform Generator */");
  lines.push(`.${className} {`);
  if (demo) {
    lines.push("  display: grid;");
    lines.push("  place-content: center;");
    lines.push(`  width: ${state.style.width}px;`);
    lines.push(`  min-height: ${state.style.height}px;`);
    lines.push(`  padding: ${state.style.padding}px;`);
    lines.push(`  border-radius: ${state.style.borderRadius}px;`);
    lines.push(`  color: ${state.style.textColor};`);
    lines.push(`  background: ${state.style.background};`);
    lines.push(`  box-shadow: ${shadowValue(state.style.shadow)};`);
  }
  lines.push(`  transform-origin: ${generateTransformOrigin(state)};`);
  if (state.exportOptions.useTransformGpuHint) lines.push("  will-change: transform;");
  lines.push(`  transform: ${baseTransform};`);
  if (state.mode === "3d" || state.mode === "card-tilt") {
    lines.push(`  transform-style: ${state.transform3d.transformStyle};`);
    lines.push(`  backface-visibility: ${state.transform3d.backfaceVisibility};`);
  }
  if (state.transition.enabled && state.mode !== "entrance") lines.push(`  transition: ${transitionValue(state)};`);
  if (state.mode === "entrance" && state.animation.enabled) lines.push(`  animation: ${state.animation.name} ${state.animation.duration}ms ${state.animation.timingFunction} ${state.animation.fillMode};`);
  lines.push("}");
  if (state.mode === "hover" || state.mode === "card-tilt") {
    lines.push("", `.${className}:hover {`, `  transform: ${hoverTransform};`, "}");
  }
  if (state.mode === "entrance" && state.animation.enabled) {
    lines.push("", `@keyframes ${state.animation.name} {`, "  from {", "    opacity: 0;", "    transform: translateY(24px) scale(0.96);", "  }", "", "  to {", "    opacity: 1;", "    transform: translateY(0) scale(1);", "  }", "}");
  }
  const reduced = generateReducedMotionCss(state);
  if (reduced) lines.push("", reduced);
  return lines.join("\n");
}

export function generateTransformHtml(state: TransformGeneratorState): string {
  const className = state.exportOptions.className || "transform-card";
  const q = state.exportOptions.quoteStyle === "single" ? "'" : '"';
  if (state.style.previewObject === "button") return `<button class=${q}${className}${q}>Transform button</button>`;
  return `<article class=${q}${className}${q}>\n  <p class=${q}${className}__eyebrow${q}>Transform UI</p>\n  <h3 class=${q}${className}__title${q}>Interactive transform effect</h3>\n  <p class=${q}${className}__description${q}>\n    A transformed component with origin, perspective, transition, and reduced-motion-ready CSS.\n  </p>\n</article>`;
}

export function generateTransformJsx(state: TransformGeneratorState): string {
  const component = state.exportOptions.componentName || "TransformCard";
  const className = state.exportOptions.className || "transform-card";
  return `export function ${component}() {\n  return (\n    <article className="${className}">\n      <p className="${className}__eyebrow">Transform UI</p>\n      <h3 className="${className}__title">Interactive transform effect</h3>\n      <p className="${className}__description">\n        A transformed component with origin, perspective, transition, and reduced-motion-ready CSS.\n      </p>\n    </article>\n  );\n}`;
}

export function generateTailwindStarter(state: TransformGeneratorState): string {
  if (state.mode === "3d" || state.mode === "card-tilt") {
    return `<div className="origin-center transform-gpu rounded-3xl p-8 text-white shadow-2xl [transform:${activeTransform(state).replaceAll(" ", "_")}] [transform-style:preserve-3d]">\n  3D transform card\n</div>`;
  }
  return `<div className="origin-center transform-gpu rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-2 hover:scale-105">\n  Transform card\n</div>`;
}

export function getPreviewTransform(state: TransformGeneratorState): string {
  if (state.previewState === "hover" || state.previewState === "active") return activeTransform(state, true);
  return activeTransform(state, false);
}

export function getPreviewStyle(state: TransformGeneratorState): CSSProperties {
  return {
    width: `${state.style.width}px`,
    minHeight: `${state.style.height}px`,
    padding: `${state.style.padding}px`,
    borderRadius: `${state.style.borderRadius}px`,
    color: state.style.textColor,
    background: state.style.background,
    boxShadow: shadowValue(state.style.shadow),
    transform: getPreviewTransform(state),
    transformOrigin: generateTransformOrigin(state),
    transformStyle: state.transform3d.transformStyle,
    backfaceVisibility: state.transform3d.backfaceVisibility,
    transition: state.transition.enabled ? transitionValue(state).replace(";\n  transition-delay:", " ") : undefined,
  };
}

export function validateTransformState(state: TransformGeneratorState): TransformValidationMessage[] {
  const messages: TransformValidationMessage[] = [
    { type: "info", message: "Transforms are visual effects and do not move surrounding document flow." },
    { type: "info", message: "Transform function order changes the final visual result." },
  ];
  if (Math.abs(state.transform3d.rotateX) > 55 || Math.abs(state.transform3d.rotateY) > 55) messages.push({ type: "warning", message: "Large 3D rotations can make text harder to read.", field: "rotate" });
  if (state.transform3d.perspective < 250) messages.push({ type: "warning", message: "Very low perspective values can create extreme distortion.", field: "perspective" });
  if (state.transform3d.perspective > 1600) messages.push({ type: "info", message: "Very high perspective values reduce visible 3D depth.", field: "perspective" });
  if (Math.abs(state.transform2d.skewX) > 30 || Math.abs(state.transform2d.skewY) > 30) messages.push({ type: "warning", message: "Skew above 30deg can make UI text difficult to read.", field: "skew" });
  if ((state.mode === "entrance" || state.mode === "hover") && !state.exportOptions.includeReducedMotion) messages.push({ type: "warning", message: "Include reduced-motion CSS for large movement or entrance animations.", field: "motion" });
  if (!state.exportOptions.className.trim()) messages.push({ type: "error", message: "Add a CSS class name before exporting.", field: "className" });
  return messages;
}

export function randomizeTransformState(state: TransformGeneratorState): TransformGeneratorState {
  const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
  return {
    ...state,
    transform2d: { ...state.transform2d, translateX: rand(-32, 32), translateY: rand(-32, 8), rotate: rand(-14, 14), scaleX: Number((0.9 + Math.random() * 0.28).toFixed(2)), scaleY: Number((0.9 + Math.random() * 0.28).toFixed(2)), skewX: rand(-10, 10), skewY: rand(-8, 8) },
    transform3d: { ...state.transform3d, rotateX: rand(-18, 18), rotateY: rand(-24, 24), rotateZ: rand(-8, 8), translateZ: rand(-20, 42), perspective: rand(600, 1200) },
  };
}
