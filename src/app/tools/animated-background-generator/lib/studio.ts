import type {
  AnimatedBackgroundState,
  BackgroundShape,
  BlendMode,
  GradientStyle,
  ForegroundMode,
  PreviewMode,
} from "@/types/animatedBackgroundTypes";
import { generateParticleData } from "./generateParticleData";
import { generateCss } from "./generateCss";
import { generateHtml } from "./generateHtml";
import { presetToState, presets } from "./presets";
import { getAnimatedBackgroundReadability } from "./readability";

export const ANIMATED_BACKGROUND_PROJECT_TOOL = "darma-animated-background-generator" as const;
export const ANIMATED_BACKGROUND_PROJECT_VERSION = 1 as const;
export const ANIMATED_BACKGROUND_IMPORT_MAX_BYTES = 1024 * 1024;

export type AnimatedBackgroundAuditSeverity = "error" | "warning" | "info" | "pass";

export type AnimatedBackgroundFixId =
  | "normalize-size-range"
  | "reduce-density"
  | "reduce-large-blur"
  | "reduce-glow"
  | "reduce-render-cost"
  | "reduce-motion"
  | "enable-content-preview"
  | "enable-readability-protection"
  | "use-auto-foreground";

export type AnimatedBackgroundAuditCheck = {
  id: string;
  title: string;
  message: string;
  severity: AnimatedBackgroundAuditSeverity;
  fixId?: AnimatedBackgroundFixId;
};

export type AnimatedBackgroundAuditCounts = Record<AnimatedBackgroundAuditSeverity, number>;

export type AnimatedBackgroundSummaryCard = {
  label: string;
  value: string;
  detail: string;
  targetId?: string;
  actionLabel?: string;
};

export type AnimatedBackgroundMetrics = {
  particleCount: number;
  cssBytes: number;
  htmlBytes: number;
  totalBytes: number;
  performanceScore: number;
  motionScore: number;
  readinessScore: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  passCount: number;
  contrastRatio: number;
  foregroundTone: string;
  readabilityProtection: boolean;
};

export type AnimatedBackgroundProject = {
  tool: typeof ANIMATED_BACKGROUND_PROJECT_TOOL;
  schemaVersion: typeof ANIMATED_BACKGROUND_PROJECT_VERSION;
  exportedAt: string;
  state: AnimatedBackgroundState;
};

const DEFAULT_STATE = presetToState(presets[0]);
const SHAPES: readonly BackgroundShape[] = ["circle", "soft-square", "diamond"];
const BLEND_MODES: readonly BlendMode[] = ["screen", "plus-lighter", "overlay", "normal", "multiply"];
const GRADIENT_STYLES: readonly GradientStyle[] = ["mesh", "linear", "radial"];
const PREVIEW_MODES: readonly PreviewMode[] = ["hero", "cards", "dashboard", "empty"];
const FOREGROUND_MODES: readonly ForegroundMode[] = ["auto", "light", "dark"];
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/\0/g, "").trim().slice(0, maxLength);
  return cleaned || fallback;
}

function cleanColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim();
  return HEX_COLOR.test(cleaned) ? cleaned.toLowerCase() : fallback;
}

function cleanNumber(value: unknown, fallback: number, min: number, max: number, integer = false): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const clamped = Math.min(max, Math.max(min, parsed));
  return integer ? Math.round(clamped) : Number(clamped.toFixed(3));
}

function cleanBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function cleanChoice<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function normalizeAnimatedBackgroundState(value: unknown): AnimatedBackgroundState {
  if (!isRecord(value)) throw new Error("Project state must be an object.");

  const colors = Array.isArray(value.colors)
    ? value.colors.slice(0, 6).map((color, index) => cleanColor(color, DEFAULT_STATE.colors[index % DEFAULT_STATE.colors.length] ?? DEFAULT_STATE.colors[0]))
    : [...DEFAULT_STATE.colors];

  while (colors.length < 2) colors.push(DEFAULT_STATE.colors[colors.length % DEFAULT_STATE.colors.length] ?? DEFAULT_STATE.colors[0]);

  const minSize = cleanNumber(value.minSize, DEFAULT_STATE.minSize, 4, 320, true);
  const maxSize = cleanNumber(value.maxSize, DEFAULT_STATE.maxSize, minSize + 4, 720, true);

  const shape = cleanChoice(value.shape, SHAPES, DEFAULT_STATE.shape);

  return {
    presetId: cleanText(value.presetId, DEFAULT_STATE.presetId, 80),
    seed: cleanNumber(value.seed, DEFAULT_STATE.seed, 1, 2_147_483_646, true),
    colors,
    background: cleanColor(value.background, DEFAULT_STATE.background),
    shape,
    particleCount: cleanNumber(value.particleCount, DEFAULT_STATE.particleCount, 1, 44, true),
    minSize,
    maxSize,
    blur: cleanNumber(value.blur, DEFAULT_STATE.blur, 0, 120),
    opacity: cleanNumber(value.opacity, DEFAULT_STATE.opacity, 0.1, 0.95),
    speed: cleanNumber(value.speed, DEFAULT_STATE.speed, 0.3, 1.8),
    intensity: cleanNumber(value.intensity, DEFAULT_STATE.intensity, 0.1, 1.4),
    glow: cleanNumber(value.glow, DEFAULT_STATE.glow, 0, 110),
    blendMode: cleanChoice(value.blendMode, BLEND_MODES, DEFAULT_STATE.blendMode),
    borderRadius: shape === "circle" ? 999 : cleanNumber(value.borderRadius, Math.min(50, DEFAULT_STATE.borderRadius), 0, 50, true),
    gradientStyle: cleanChoice(value.gradientStyle, GRADIENT_STYLES, DEFAULT_STATE.gradientStyle),
    foregroundMode: cleanChoice(value.foregroundMode, FOREGROUND_MODES, DEFAULT_STATE.foregroundMode),
    readabilityProtection: cleanBoolean(value.readabilityProtection, DEFAULT_STATE.readabilityProtection),
    isPaused: false,
    showContent: cleanBoolean(value.showContent, true),
    previewMode: cleanChoice(value.previewMode, PREVIEW_MODES, DEFAULT_STATE.previewMode),
  };
}

export function createAnimatedBackgroundProject(
  state: AnimatedBackgroundState,
  exportedAt = new Date().toISOString(),
): AnimatedBackgroundProject {
  return {
    tool: ANIMATED_BACKGROUND_PROJECT_TOOL,
    schemaVersion: ANIMATED_BACKGROUND_PROJECT_VERSION,
    exportedAt,
    state: normalizeAnimatedBackgroundState({ ...state, isPaused: false }),
  };
}

export function parseAnimatedBackgroundProject(text: string): AnimatedBackgroundProject {
  if (!text.trim()) throw new Error("The selected project file is empty.");

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!isRecord(value)) throw new Error("Project root must be an object.");
  if (value.tool !== ANIMATED_BACKGROUND_PROJECT_TOOL) {
    throw new Error("This JSON file was not created by the Darma animated background generator.");
  }
  if (value.schemaVersion !== ANIMATED_BACKGROUND_PROJECT_VERSION) {
    throw new Error(`Unsupported project version. Expected version ${ANIMATED_BACKGROUND_PROJECT_VERSION}.`);
  }

  return {
    tool: ANIMATED_BACKGROUND_PROJECT_TOOL,
    schemaVersion: ANIMATED_BACKGROUND_PROJECT_VERSION,
    exportedAt: cleanText(value.exportedAt, new Date().toISOString(), 80),
    state: normalizeAnimatedBackgroundState(value.state),
  };
}

export function getAnimatedBackgroundPerformanceScore(state: AnimatedBackgroundState): number {
  const particleCost = state.particleCount * 1.35;
  const blurCost = state.blur * 0.28;
  const glowCost = state.glow * 0.16;
  const sizeCost = state.maxSize * 0.035;
  const blendCost = state.blendMode === "plus-lighter" || state.blendMode === "overlay" ? 8 : 2;
  return Math.round(Math.min(100, particleCost + blurCost + glowCost + sizeCost + blendCost));
}

export function getAnimatedBackgroundMotionScore(state: AnimatedBackgroundState): number {
  return Math.round(Math.min(100, state.speed * 34 + state.intensity * 38 + state.particleCount * 0.55));
}

export function summarizeAnimatedBackgroundAudit(
  checks: AnimatedBackgroundAuditCheck[],
): AnimatedBackgroundAuditCounts {
  return checks.reduce<AnimatedBackgroundAuditCounts>(
    (counts, check) => {
      counts[check.severity] += 1;
      return counts;
    },
    { error: 0, warning: 0, info: 0, pass: 0 },
  );
}

export function buildAnimatedBackgroundAudit(
  state: AnimatedBackgroundState,
  css: string,
  html: string,
): AnimatedBackgroundAuditCheck[] {
  const checks: AnimatedBackgroundAuditCheck[] = [];
  const performanceScore = getAnimatedBackgroundPerformanceScore(state);
  const motionScore = getAnimatedBackgroundMotionScore(state);
  const cssBytes = byteLength(css);
  const readability = getAnimatedBackgroundReadability(state);

  if (!HEX_COLOR.test(state.background) || state.colors.some((color) => !HEX_COLOR.test(color))) {
    checks.push({ id: "colors-invalid", title: "Color values", message: "Use six-digit hex colors before exporting this background.", severity: "error" });
  } else {
    checks.push({ id: "colors-valid", title: "Color values", message: "Background and accent colors use portable six-digit hex values.", severity: "pass" });
  }

  if (state.minSize >= state.maxSize) {
    checks.push({ id: "size-order", title: "Particle size range", message: "Maximum particle size must be greater than the minimum size.", severity: "error", fixId: "normalize-size-range" });
  } else {
    checks.push({ id: "size-order", title: "Particle size range", message: `Particles range from ${state.minSize}px to ${state.maxSize}px.`, severity: "pass" });
  }

  if (state.particleCount > 34) {
    checks.push({ id: "particle-density", title: "Particle density", message: `${state.particleCount} animated elements can be expensive on low-end mobile devices.`, severity: "warning", fixId: "reduce-density" });
  } else if (state.particleCount > 24) {
    checks.push({ id: "particle-density", title: "Particle density", message: `${state.particleCount} elements are reasonable for a hero but should be tested on mobile.`, severity: "info" });
  } else {
    checks.push({ id: "particle-density", title: "Particle density", message: `${state.particleCount} elements keep DOM and animation work controlled.`, severity: "pass" });
  }

  if (state.maxSize > 620 && state.blur > 90) {
    checks.push({ id: "large-blur", title: "Large blurred layers", message: "Very large elements combined with heavy blur can trigger expensive repaints.", severity: "warning", fixId: "reduce-large-blur" });
  }

  if (state.glow > 80) {
    checks.push({ id: "heavy-glow", title: "Glow intensity", message: "Heavy drop-shadow glow can be expensive when many elements overlap.", severity: "warning", fixId: "reduce-glow" });
  }

  if (performanceScore >= 85) {
    checks.push({ id: "performance-score", title: "Performance budget", message: `Estimated visual cost is ${performanceScore}/100. Limit this design to a short section and test on a low-end phone.`, severity: "warning", fixId: "reduce-render-cost" });
  } else if (performanceScore >= 60) {
    checks.push({ id: "performance-score", title: "Performance budget", message: `Estimated visual cost is ${performanceScore}/100. Suitable for a hero after device testing.`, severity: "info" });
  } else {
    checks.push({ id: "performance-score", title: "Performance budget", message: `Estimated visual cost is ${performanceScore}/100 and remains within a light budget.`, severity: "pass" });
  }

  if (motionScore >= 78) {
    checks.push({ id: "motion-level", title: "Motion intensity", message: `Motion score is ${motionScore}/100. Verify readability and avoid placing dense copy directly over the busiest area.`, severity: "warning", fixId: "reduce-motion" });
  } else if (motionScore >= 52) {
    checks.push({ id: "motion-level", title: "Motion intensity", message: `Motion score is ${motionScore}/100. Motion is visible but controlled.`, severity: "info" });
  } else {
    checks.push({ id: "motion-level", title: "Motion intensity", message: `Motion score is ${motionScore}/100 and should remain subtle behind interface content.`, severity: "pass" });
  }

  if (state.blendMode === "plus-lighter") {
    checks.push({ id: "blend-support", title: "Blend-mode fallback", message: "plus-lighter support and brightness can vary. Test the exported background in all target browsers.", severity: "info" });
  }

  if (css.includes("prefers-reduced-motion") && css.includes("animation: none !important")) {
    checks.push({ id: "reduced-motion", title: "Reduced motion", message: "The exported CSS includes a prefers-reduced-motion fallback.", severity: "pass" });
  } else {
    checks.push({ id: "reduced-motion", title: "Reduced motion", message: "The exported CSS must disable continuous animation for reduced-motion users.", severity: "error" });
  }

  if (!state.showContent || state.previewMode === "empty") {
    checks.push({ id: "content-preview", title: "Readability preview", message: "Preview the background behind real copy and controls before shipping.", severity: "warning", fixId: "enable-content-preview" });
  } else {
    checks.push({ id: "content-preview", title: "Readability preview", message: `The ${state.previewMode} content preview is enabled for visual review.`, severity: "pass" });
  }

  if (readability.meetsNormalTextAA) {
    checks.push({
      id: "contrast-estimate",
      title: "Estimated text contrast",
      message: `${readability.resolvedTone === "light" ? "Light" : "Dark"} foreground reaches an estimated minimum ${readability.protectedMinContrast.toFixed(2)}:1 contrast across ${readability.sampleCount} generated color samples (${readability.status}).`,
      severity: "pass",
    });
  } else {
    checks.push({
      id: "contrast-estimate",
      title: "Estimated text contrast",
      message: `${readability.resolvedTone === "light" ? "Light" : "Dark"} foreground reaches only ${readability.protectedMinContrast.toFixed(2)}:1 across generated color samples. Normal-size text should reach at least 4.5:1.`,
      severity: readability.protectedMinContrast < 3 ? "error" : "warning",
      fixId: state.readabilityProtection ? "use-auto-foreground" : "enable-readability-protection",
    });
  }

  if (readability.needsProtection && readability.protectionApplied) {
    checks.push({
      id: "readability-protection",
      title: "Readability protection",
      message: `A ${Math.round(readability.scrimOpacity * 100)}% ${readability.resolvedTone === "light" ? "dark" : "light"} scrim raises estimated contrast from ${readability.rawMinContrast.toFixed(2)}:1 to ${readability.protectedMinContrast.toFixed(2)}:1.`,
      severity: "pass",
    });
  } else if (readability.needsProtection) {
    checks.push({
      id: "readability-protection",
      title: "Readability protection",
      message: `The selected foreground falls to ${readability.rawMinContrast.toFixed(2)}:1 on the busiest estimated color sample. Enable the protective scrim before export.`,
      severity: "warning",
      fixId: "enable-readability-protection",
    });
  } else {
    checks.push({ id: "readability-protection", title: "Readability protection", message: "The selected foreground meets the estimated normal-text contrast target without a protective scrim.", severity: "pass" });
  }

  if (state.foregroundMode === "auto") {
    checks.push({ id: "foreground-mode", title: "Foreground selection", message: `Auto selected ${readability.resolvedTone} content for the strongest conservative contrast result.`, severity: "pass" });
  } else if (readability.alternateMinContrast >= readability.rawMinContrast + 0.75) {
    checks.push({ id: "foreground-mode", title: "Foreground selection", message: `The alternate foreground has a stronger estimated minimum contrast (${readability.alternateMinContrast.toFixed(2)}:1).`, severity: "info", fixId: "use-auto-foreground" });
  }

  if (state.isPaused) {
    checks.push({ id: "paused-preview", title: "Paused preview", message: "The editor preview is paused, but exported code still uses a running animation.", severity: "info" });
  }

  checks.push({
    id: "payload-size",
    title: "Export payload",
    message: `${cssBytes.toLocaleString()} CSS bytes and ${byteLength(html).toLocaleString()} HTML bytes will be exported.`,
    severity: cssBytes > 55_000 ? "warning" : "info",
  });

  checks.push({ id: "manual-device-test", title: "Device verification", message: "Test the final section on low-end mobile hardware, with real content, and with browser reduced-motion settings enabled.", severity: "info" });

  return checks;
}

export function getAnimatedBackgroundReadinessScore(checks: AnimatedBackgroundAuditCheck[]): number {
  const counts = summarizeAnimatedBackgroundAudit(checks);
  return Math.max(0, Math.min(100, 100 - counts.error * 35 - counts.warning * 10 - counts.info * 2));
}

export function buildAnimatedBackgroundMetrics(
  state: AnimatedBackgroundState,
  css: string,
  html: string,
  checks: AnimatedBackgroundAuditCheck[],
): AnimatedBackgroundMetrics {
  const counts = summarizeAnimatedBackgroundAudit(checks);
  const cssBytes = byteLength(css);
  const htmlBytes = byteLength(html);
  const readability = getAnimatedBackgroundReadability(state);

  return {
    particleCount: state.particleCount,
    cssBytes,
    htmlBytes,
    totalBytes: cssBytes + htmlBytes,
    performanceScore: getAnimatedBackgroundPerformanceScore(state),
    motionScore: getAnimatedBackgroundMotionScore(state),
    readinessScore: getAnimatedBackgroundReadinessScore(checks),
    errorCount: counts.error,
    warningCount: counts.warning,
    infoCount: counts.info,
    passCount: counts.pass,
    contrastRatio: readability.protectedMinContrast,
    foregroundTone: readability.resolvedTone,
    readabilityProtection: readability.protectionApplied,
  };
}

export function buildAnimatedBackgroundSummary(
  state: AnimatedBackgroundState,
  css: string,
  html: string,
  checks: AnimatedBackgroundAuditCheck[],
): AnimatedBackgroundSummaryCard[] {
  const metrics = buildAnimatedBackgroundMetrics(state, css, html, checks);
  const readiness = metrics.errorCount ? "Blocked" : metrics.warningCount ? "Review" : "Ready";

  const motionLevel = metrics.motionScore >= 78 ? "High" : metrics.motionScore >= 52 ? "Moderate" : "Low";
  const renderLevel = metrics.performanceScore >= 85 ? "High" : metrics.performanceScore >= 60 ? "Moderate" : "Low";

  return [
    {
      label: "Motion intensity",
      value: motionLevel,
      detail: `${metrics.motionScore}/100 · ${state.speed.toFixed(2)}x speed${state.isPaused ? " · preview paused" : ""}`,
    },
    {
      label: "Render cost",
      value: renderLevel,
      detail: `${metrics.performanceScore}/100 cost · ${state.particleCount} elements · ${state.blur}px blur`,
    },
    {
      label: "Export size",
      value: formatBytes(metrics.totalBytes),
      detail: `${formatBytes(metrics.cssBytes)} CSS · ${formatBytes(metrics.htmlBytes)} HTML`,
    },
    {
      label: "Production status",
      value: readiness,
      detail: `${metrics.contrastRatio.toFixed(2)}:1 contrast · ${metrics.errorCount ? `${metrics.errorCount} blocking error${metrics.errorCount === 1 ? "" : "s"}` : metrics.warningCount ? `${metrics.warningCount} warning${metrics.warningCount === 1 ? "" : "s"}` : `${metrics.passCount} checks passed`}`,
      targetId: "animated-background-production",
      actionLabel: "Review checks",
    },
  ];
}

export function buildStandaloneAnimatedBackgroundHtml(html: string, css: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Animated background</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; background: #020617; }
    body { min-height: 100vh; font-family: system-ui, sans-serif; }
${css.split("\n").map((line) => `    ${line}`).join("\n")}
  </style>
</head>
<body>
${html.split("\n").map((line) => `  ${line}`).join("\n")}
</body>
</html>
`;
}

export function buildAnimatedBackgroundReactComponent(css: string, particleCount: number): string {
  const escapedCss = css.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  return `export function AnimatedBackground() {
  return (
    <div className="darma-animated-bg" aria-hidden="true">
      <style>{\`${escapedCss}\`}</style>
      {Array.from({ length: ${particleCount} }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}
`;
}

export function buildAnimatedBackgroundTokens(state: AnimatedBackgroundState): string {
  return JSON.stringify(
    {
      preset: state.presetId,
      seed: state.seed,
      background: state.background,
      colors: state.colors,
      gradientStyle: state.gradientStyle,
      shape: state.shape,
      particleCount: state.particleCount,
      size: { min: state.minSize, max: state.maxSize },
      motion: { speed: state.speed, intensity: state.intensity, reducedMotion: true },
      effects: { blur: state.blur, glow: state.glow, opacity: state.opacity, blendMode: state.blendMode },
      readability: { foregroundMode: state.foregroundMode, protection: state.readabilityProtection, analysis: getAnimatedBackgroundReadability(state) },
    },
    null,
    2,
  );
}

function escapeCsv(value: string | number | boolean): string {
  const text = String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildAnimatedBackgroundMetricsCsv(
  state: AnimatedBackgroundState,
  css: string,
  html: string,
  checks: AnimatedBackgroundAuditCheck[],
): string {
  const metrics = buildAnimatedBackgroundMetrics(state, css, html, checks);
  const headers = Object.keys(metrics);
  const values = headers.map((key) => metrics[key as keyof AnimatedBackgroundMetrics]);
  return `${headers.map(escapeCsv).join(",")}\n${values.map(escapeCsv).join(",")}\n`;
}

export function buildAnimatedBackgroundMarkdownReport(
  state: AnimatedBackgroundState,
  css: string,
  html: string,
  checks: AnimatedBackgroundAuditCheck[],
): string {
  const metrics = buildAnimatedBackgroundMetrics(state, css, html, checks);
  const checkLines = checks.map((check) => `- **${check.severity.toUpperCase()} — ${check.title}:** ${check.message}`).join("\n");

  return `# Animated Background Production Report

## Configuration

- Preset: \`${state.presetId}\`
- Seed: \`${state.seed}\`
- Gradient: \`${state.gradientStyle}\`
- Shape: \`${state.shape}\`
- Particles: ${state.particleCount}
- Size range: ${state.minSize}px–${state.maxSize}px
- Speed: ${state.speed.toFixed(2)}x
- Intensity: ${state.intensity.toFixed(2)}
- Blur: ${state.blur}px
- Glow: ${state.glow}px
- Blend mode: \`${state.blendMode}\`
- Foreground mode: \`${state.foregroundMode}\`
- Readability protection: ${state.readabilityProtection ? "enabled" : "disabled"}

## Metrics

- Readiness score: ${metrics.readinessScore}/100
- Performance score: ${metrics.performanceScore}/100
- Motion score: ${metrics.motionScore}/100
- Estimated minimum contrast: ${metrics.contrastRatio.toFixed(2)}:1
- Resolved foreground: ${metrics.foregroundTone}
- CSS size: ${formatBytes(metrics.cssBytes)}
- HTML size: ${formatBytes(metrics.htmlBytes)}

## Production checks

${checkLines}

## Final verification

Test the exported background on low-end mobile hardware, behind real content, and with the operating system reduced-motion preference enabled.
`;
}

export function buildAnimatedBackgroundProductionFiles(
  state: AnimatedBackgroundState,
  css?: string,
  html?: string,
  checks?: AnimatedBackgroundAuditCheck[],
): Record<string, string> {
  const normalized = normalizeAnimatedBackgroundState(state);
  const particles = generateParticleData(normalized);
  const generatedCss = css ?? generateCss(normalized, particles);
  const generatedHtml = html ?? generateHtml(particles);
  const audit = checks ?? buildAnimatedBackgroundAudit(normalized, generatedCss, generatedHtml);

  return {
    "index.html": buildStandaloneAnimatedBackgroundHtml(generatedHtml, generatedCss),
    "animated-background.css": generatedCss,
    "AnimatedBackground.tsx": buildAnimatedBackgroundReactComponent(generatedCss, normalized.particleCount),
    "animated-background.tokens.json": buildAnimatedBackgroundTokens(normalized),
    "animated-background-project.json": JSON.stringify(createAnimatedBackgroundProject(normalized), null, 2),
    "production-report.md": buildAnimatedBackgroundMarkdownReport(normalized, generatedCss, generatedHtml, audit),
    "production-metrics.csv": buildAnimatedBackgroundMetricsCsv(normalized, generatedCss, generatedHtml, audit),
    "README.md": `# Animated Background Production Pack

This package was generated locally by Darma Tools.

## Files

- \`index.html\`: standalone preview
- \`animated-background.css\`: scoped production CSS
- \`AnimatedBackground.tsx\`: React component
- \`animated-background.tokens.json\`: design and motion tokens
- \`animated-background-project.json\`: reopenable Darma project
- \`production-report.md\`: severity-based production audit
- \`production-metrics.csv\`: one-row metrics snapshot

Review contrast behind real content and test reduced motion plus low-end mobile performance before deployment.
`,
  };
}

export function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}
