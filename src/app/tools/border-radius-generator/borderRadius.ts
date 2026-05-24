import type {
  AdvancedRadiusValues,
  BorderRadiusState,
  BorderRadiusValidationMessage,
  CornerLocks,
  RadiusCornerValues,
  ShapeStyle,
} from "./types";

const corners = ["topLeft", "topRight", "bottomRight", "bottomLeft"] as const;

const DEFAULT_ADVANCED_VALUES: AdvancedRadiusValues = {
  horizontal: { topLeft: 30, topRight: 70, bottomRight: 70, bottomLeft: 30 },
  vertical: { topLeft: 30, topRight: 30, bottomRight: 70, bottomLeft: 70 },
};

type CornerKey = (typeof corners)[number];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function cornerValues(values: RadiusCornerValues, unit: string) {
  return `${values.topLeft}${unit} ${values.topRight}${unit} ${values.bottomRight}${unit} ${values.bottomLeft}${unit}`;
}

function normalizeClassName(value: string) {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9_-]/g, "-").replace(/^-+/, "");
  return sanitized || "blob-shape";
}

function normalizeComponentName(value: string) {
  const safe = value.trim().replace(/[^a-zA-Z0-9]/g, "");
  if (!safe) return "BlobShape";
  return `${safe.charAt(0).toUpperCase()}${safe.slice(1)}`;
}

function shadowValue(style: ShapeStyle) {
  if (style.shadowPreset === "none") return "none";
  if (style.shadowPreset === "soft") return "0 18px 50px rgb(15 23 42 / 0.16)";
  if (style.shadowPreset === "medium") return "0 24px 80px rgb(15 23 42 / 0.22)";
  if (style.shadowPreset === "strong") return "0 34px 110px rgb(15 23 42 / 0.32)";
  return style.customShadow.trim() || "0 24px 80px rgb(15 23 42 / 0.22)";
}

export function createDefaultBorderRadiusState(): BorderRadiusState {
  const advancedValues = DEFAULT_ADVANCED_VALUES;

  return {
    mode: "blob",
    previewContext: "blob",
    simpleUnit: "px",
    simpleValues: { topLeft: 28, topRight: 28, bottomRight: 28, bottomLeft: 28 },
    advancedUnit: "%",
    advancedValues,
    locks: { topLeft: false, topRight: false, bottomRight: false, bottomLeft: false },
    style: {
      width: 320,
      height: 320,
      sizeUnit: "px",
      backgroundType: "linear-gradient",
      backgroundColor: "#7c3aed",
      gradientFrom: "#7c3aed",
      gradientTo: "#06b6d4",
      gradientAngle: 135,
      imageUrl: "/images/profile.jpg",
      objectFit: "cover",
      borderWidth: 0,
      borderColor: "#ffffff",
      borderStyle: "none",
      shadowPreset: "medium",
      customShadow: "0 24px 80px rgb(15 23 42 / 0.22)",
    },
    animation: {
      enabled: false,
      duration: 8,
      timingFunction: "ease-in-out",
      direction: "alternate",
      infinite: true,
      includeReducedMotion: true,
      keyframes: [advancedValues, generateAnimationKeyframes(1, { topLeft: false, topRight: false, bottomRight: false, bottomLeft: false })[0]],
    },
    showGrid: false,
    showCornerLabels: true,
    exportOptions: {
      className: "blob-shape",
      includeComments: true,
      includeDemoStyles: true,
      includeReducedMotion: true,
      componentName: "BlobShape",
    },
  };
}

export function formatSimpleBorderRadius(values: RadiusCornerValues, unit: string): string {
  const unique = new Set(corners.map((corner) => values[corner]));
  if (unique.size === 1) return `${values.topLeft}${unit}`;
  return cornerValues(values, unit);
}

export function formatAdvancedBorderRadius(values: AdvancedRadiusValues, unit: string): string {
  return `${cornerValues(values.horizontal, unit)} / ${cornerValues(values.vertical, unit)}`;
}

export function getBorderRadiusValue(state: BorderRadiusState): string {
  if (state.mode === "simple") return formatSimpleBorderRadius(state.simpleValues, state.simpleUnit);
  return formatAdvancedBorderRadius(state.advancedValues, state.advancedUnit);
}

export function randomizeBlobValues(
  current: AdvancedRadiusValues,
  locks: CornerLocks,
  options: { min?: number; max?: number; symmetry?: boolean } = {},
): AdvancedRadiusValues {
  const min = options.min ?? 22;
  const max = options.max ?? 78;
  const next: AdvancedRadiusValues = {
    horizontal: { ...current.horizontal },
    vertical: { ...current.vertical },
  };

  function nextValue() {
    return Math.round(min + Math.random() * (max - min));
  }

  corners.forEach((corner) => {
    if (locks[corner]) return;
    next.horizontal[corner] = nextValue();
    next.vertical[corner] = nextValue();
  });

  if (options.symmetry) {
    if (!locks.topRight) {
      next.horizontal.topRight = 100 - next.horizontal.topLeft;
      next.vertical.topRight = next.vertical.topLeft;
    }
    if (!locks.bottomLeft) {
      next.horizontal.bottomLeft = 100 - next.horizontal.bottomRight;
      next.vertical.bottomLeft = next.vertical.bottomRight;
    }
  }

  return next;
}

export function generateAnimationKeyframes(count: number, locks: CornerLocks): AdvancedRadiusValues[] {
  const base = DEFAULT_ADVANCED_VALUES;
  const total = clamp(count, 1, 5);
  return Array.from({ length: total }, (_, index) =>
    randomizeBlobValues(base, locks, {
      min: 24 + index * 2,
      max: 76 - index,
      symmetry: false,
    }),
  );
}

function backgroundCss(style: ShapeStyle) {
  if (style.backgroundType === "solid") return style.backgroundColor;
  if (style.backgroundType === "radial-gradient") return `radial-gradient(circle at 30% 25%, ${style.gradientFrom}, ${style.gradientTo})`;
  if (style.backgroundType === "image") return `url("${style.imageUrl}") center / ${style.objectFit} no-repeat`;
  return `linear-gradient(${style.gradientAngle}deg, ${style.gradientFrom}, ${style.gradientTo})`;
}

export function generateBorderRadiusCss(state: BorderRadiusState): string {
  const className = normalizeClassName(state.exportOptions.className);
  const radius = getBorderRadiusValue(state);
  const style = state.style;
  const lines: string[] = [];

  if (state.exportOptions.includeComments) lines.push("/* Generated with Darma CSS Border Radius Generator */");
  lines.push(`.${className} {`);
  lines.push(`  width: ${style.width}${style.sizeUnit};`);
  lines.push(`  height: ${style.height}${style.sizeUnit};`);
  lines.push(`  border-radius: ${radius};`);
  lines.push(`  background: ${backgroundCss(style)};`);
  if (style.backgroundType === "image") lines.push(`  object-fit: ${style.objectFit};`);
  if (style.borderStyle !== "none" && style.borderWidth > 0) lines.push(`  border: ${style.borderWidth}px ${style.borderStyle} ${style.borderColor};`);
  const shadow = shadowValue(style);
  if (shadow !== "none") lines.push(`  box-shadow: ${shadow};`);
  if (state.exportOptions.includeDemoStyles) {
    lines.push("  display: inline-flex;");
    lines.push("  align-items: center;");
    lines.push("  justify-content: center;");
    lines.push("  overflow: hidden;");
  }
  if (state.mode === "animated" || state.animation.enabled) {
    const iteration = state.animation.infinite ? "infinite" : "1";
    lines.push(`  animation: ${className}-morph ${state.animation.duration}s ${state.animation.timingFunction} ${iteration} ${state.animation.direction};`);
  }
  lines.push("}");

  if (state.mode === "animated" || state.animation.enabled) {
    const frames = state.animation.keyframes.length >= 2 ? state.animation.keyframes : generateAnimationKeyframes(2, state.locks);
    lines.push("");
    lines.push(`@keyframes ${className}-morph {`);
    frames.forEach((frame, index) => {
      const percent = frames.length === 1 ? 100 : Math.round((index / (frames.length - 1)) * 100);
      lines.push(`  ${percent}% {`);
      lines.push(`    border-radius: ${formatAdvancedBorderRadius(frame, state.advancedUnit)};`);
      lines.push("  }");
    });
    lines.push("}");

    if (state.exportOptions.includeReducedMotion || state.animation.includeReducedMotion) {
      lines.push("");
      lines.push("@media (prefers-reduced-motion: reduce) {");
      lines.push(`  .${className} {`);
      lines.push("    animation: none;");
      lines.push("  }");
      lines.push("}");
    }
  }

  return lines.join("\n");
}

export function generateBorderRadiusHtml(state: BorderRadiusState): string {
  const className = normalizeClassName(state.exportOptions.className);
  if (state.mode === "image" || state.previewContext === "image" || state.previewContext === "avatar") {
    return `<img\n  class="${className}"\n  src="${state.style.imageUrl}"\n  alt="Decorative shaped image"\n/>`;
  }
  return `<div class="${className}" aria-hidden="true"></div>`;
}

export function generateBorderRadiusJsx(state: BorderRadiusState): string {
  const className = normalizeClassName(state.exportOptions.className);
  const componentName = normalizeComponentName(state.exportOptions.componentName);
  if (state.mode === "image" || state.previewContext === "image" || state.previewContext === "avatar") {
    return `export function ${componentName}() {\n  return (\n    <img\n      className="${className}"\n      src="${state.style.imageUrl}"\n      alt="Decorative shaped image"\n    />\n  );\n}`;
  }
  return `export function ${componentName}() {\n  return <div className="${className}" aria-hidden="true" />;\n}`;
}

export function generateTailwindStarter(state: BorderRadiusState): string {
  const radius = getBorderRadiusValue(state).replace(/\s+/g, "_").replace("/_", "/");
  const widthClass = state.style.sizeUnit === "px" ? `w-[${state.style.width}px]` : `w-[${state.style.width}rem]`;
  const heightClass = state.style.sizeUnit === "px" ? `h-[${state.style.height}px]` : `h-[${state.style.height}rem]`;
  const background = state.style.backgroundType === "linear-gradient" ? "bg-gradient-to-br from-violet-600 to-cyan-500" : "bg-violet-600";
  return `<div className="${heightClass} ${widthClass} rounded-[${radius}] ${background} shadow-2xl" aria-hidden="true" />`;
}

export function validateBorderRadiusState(state: BorderRadiusState): BorderRadiusValidationMessage[] {
  const messages: BorderRadiusValidationMessage[] = [];
  const radius = getBorderRadiusValue(state);

  if (state.advancedUnit === "%") {
    messages.push({ type: "info", message: "Percentage radii depend on the element width and height, so the same values can look different on rectangles." });
  }
  if (radius.includes("/")) {
    messages.push({ type: "info", message: "The slash syntax separates horizontal and vertical radii for elliptical corners." });
  }
  if (state.mode === "animated" && !state.exportOptions.includeReducedMotion && !state.animation.includeReducedMotion) {
    messages.push({ type: "warning", message: "Animated blobs should include reduced-motion CSS for accessibility.", field: "animation" });
  }
  if ((state.mode === "image" || state.style.backgroundType === "image") && state.style.imageUrl.trim().length === 0) {
    messages.push({ type: "warning", message: "Image mode needs an image URL or a decorative fallback gradient.", field: "imageUrl" });
  }
  if (state.style.width < 80 || state.style.height < 80) {
    messages.push({ type: "warning", message: "Very small shapes can hide the organic curve details.", field: "size" });
  }
  if ([...Object.values(state.advancedValues.horizontal), ...Object.values(state.advancedValues.vertical)].some((value) => value < 10 || value > 90)) {
    messages.push({ type: "warning", message: "Extreme radius values may create sharp or unexpected curves." });
  }
  messages.push({ type: "info", message: "Use SVG Path Editor if you need precise complex shapes beyond what border-radius can create." });
  return messages;
}
