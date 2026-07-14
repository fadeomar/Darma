import { DEFAULT_FAKE_SCREEN_STATE, MODE_LABELS } from "../presets";
import type {
  CanvasTemplate,
  ColorMode,
  ErrorTemplate,
  FakeScreenMode,
  FakeScreenState,
  ScreensaverSpeed,
  ScreensaverTemplate,
  UpdateProgressMode,
  UpdateTemplate,
} from "../types";

export type FakeScreenAuditSeverity = "error" | "warning" | "info" | "pass";

export type FakeScreenAuditCheck = {
  id: string;
  title: string;
  message: string;
  severity: FakeScreenAuditSeverity;
};

export type FakeScreenSummaryCard = {
  label: string;
  value: string;
  detail: string;
};

export type FakeScreenConfigFile = {
  schema: "darma.fake-screen";
  version: 1;
  exportedAt: string;
  state: FakeScreenState;
};

type QueryReader = { get(key: string): string | null };
type JsonRecord = Record<string, unknown>;

const MODES: readonly FakeScreenMode[] = ["color", "update", "error", "screensaver", "canvas"];
const COLOR_MODES: readonly ColorMode[] = ["solid", "dead-pixel", "cleaning", "soft-light"];
const UPDATE_TEMPLATES: readonly UpdateTemplate[] = ["win10", "winxp", "mac", "ubuntu", "chrome", "win11", "android", "terminal"];
const UPDATE_PROGRESS_MODES: readonly UpdateProgressMode[] = ["linear", "realistic", "stuck-99", "loop", "manual"];
const ERROR_TEMPLATES: readonly ErrorTemplate[] = ["blue-modern", "blue-classic", "developer", "kernel", "no-signal", "radar", "broken", "hacker"];
const SCREENSAVER_TEMPLATES: readonly ScreensaverTemplate[] = ["dvd", "flip-clock", "quote", "no-signal", "matrix", "floating-text"];
const CANVAS_TEMPLATES: readonly CanvasTemplate[] = ["interactive-circles", "starfield", "network", "waves", "aurora", "fireflies", "bubbles", "snow", "plasma", "confetti"];
const SPEEDS: readonly ScreensaverSpeed[] = ["slow", "medium", "fast"];
const DEAD_PIXEL_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Black", value: "#000000" },
  { label: "Red", value: "#ef4444" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#2563eb" },
] as const;

const UPDATE_LABELS: Record<UpdateTemplate, string> = {
  win10: "Windows 10-inspired update",
  winxp: "Windows XP-inspired update",
  mac: "Mac-inspired update",
  ubuntu: "Ubuntu-inspired update",
  chrome: "Chrome OS-inspired update",
  win11: "Windows 11-inspired update",
  android: "Android-inspired update",
  terminal: "Terminal update",
};

const ERROR_LABELS: Record<ErrorTemplate, string> = {
  "blue-modern": "Modern blue error",
  "blue-classic": "Classic blue error",
  developer: "Developer panic",
  kernel: "Kernel panic",
  "no-signal": "No signal",
  radar: "Radar screen",
  broken: "Broken-screen simulation",
  hacker: "Hacker terminal",
};

const SCREENSAVER_LABELS: Record<ScreensaverTemplate, string> = {
  dvd: "DVD bounce",
  "flip-clock": "Flip clock",
  quote: "Quote screen",
  "no-signal": "No-signal bars",
  matrix: "Matrix rain",
  "floating-text": "Floating text",
};

const CANVAS_LABELS: Record<CanvasTemplate, string> = {
  "interactive-circles": "Interactive circles",
  starfield: "Starfield",
  network: "Particle network",
  waves: "Wave lines",
  aurora: "Aurora glow",
  fireflies: "Fireflies",
  bubbles: "Bubbles",
  snow: "Snowfall",
  plasma: "Plasma field",
  confetti: "Confetti",
};

const COLOR_LABELS: Record<ColorMode, string> = {
  solid: "Solid color",
  "dead-pixel": "Dead-pixel test",
  cleaning: "Screen cleaner",
  "soft-light": "Soft light",
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clamp(value: unknown, fallback: number, min: number, max: number): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function choice<T extends string>(value: unknown, fallback: T, allowed: readonly T[]): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function cleanText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/\u0000/g, "").trim().slice(0, maxLength);
}

function cleanStopCode(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const sanitized = value.toUpperCase().replace(/[^A-Z0-9_]/g, "").slice(0, 48);
  return sanitized || fallback;
}

export function normalizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

export function normalizeFakeScreenState(
  input: unknown,
  fallback: FakeScreenState = DEFAULT_FAKE_SCREEN_STATE,
): FakeScreenState {
  const source = isRecord(input) ? input : {};
  return {
    mode: choice(source.mode, fallback.mode, MODES),
    color: normalizeHexColor(source.color, fallback.color),
    colorMode: choice(source.colorMode, fallback.colorMode, COLOR_MODES),
    brightness: clamp(source.brightness, fallback.brightness, 10, 100),
    timerMinutes: clamp(source.timerMinutes, fallback.timerMinutes, 1, 30),
    deadPixelIndex: clamp(source.deadPixelIndex, fallback.deadPixelIndex, 0, 4),
    updateTemplate: choice(source.updateTemplate, fallback.updateTemplate, UPDATE_TEMPLATES),
    updateDurationMinutes: clamp(source.updateDurationMinutes, fallback.updateDurationMinutes, 1, 90),
    updateStartPercent: clamp(source.updateStartPercent, fallback.updateStartPercent, 0, 99),
    updateProgressMode: choice(source.updateProgressMode, fallback.updateProgressMode, UPDATE_PROGRESS_MODES),
    updateTitle: cleanText(source.updateTitle, fallback.updateTitle, 120),
    updateSubtitle: cleanText(source.updateSubtitle, fallback.updateSubtitle, 260),
    updateCompletionText: cleanText(source.updateCompletionText, fallback.updateCompletionText, 100),
    manualProgress: clamp(source.manualProgress, fallback.manualProgress, 0, 100),
    errorTemplate: choice(source.errorTemplate, fallback.errorTemplate, ERROR_TEMPLATES),
    errorTitle: cleanText(source.errorTitle, fallback.errorTitle, 180),
    errorMessage: cleanText(source.errorMessage, fallback.errorMessage, 320),
    errorStopCode: cleanStopCode(source.errorStopCode, fallback.errorStopCode),
    errorProgress: clamp(source.errorProgress, fallback.errorProgress, 0, 100),
    screensaverTemplate: choice(source.screensaverTemplate, fallback.screensaverTemplate, SCREENSAVER_TEMPLATES),
    screensaverText: cleanText(source.screensaverText, fallback.screensaverText, 120),
    screensaverSpeed: choice(source.screensaverSpeed, fallback.screensaverSpeed, SPEEDS),
    screensaverSize: clamp(source.screensaverSize, fallback.screensaverSize, 24, 110),
    screensaverBackground: normalizeHexColor(source.screensaverBackground, fallback.screensaverBackground),
    screensaverColor: normalizeHexColor(source.screensaverColor, fallback.screensaverColor),
    showCornerCounter: typeof source.showCornerCounter === "boolean" ? source.showCornerCounter : fallback.showCornerCounter,
    canvasTemplate: choice(source.canvasTemplate, fallback.canvasTemplate, CANVAS_TEMPLATES),
    canvasDensity: clamp(source.canvasDensity, fallback.canvasDensity, 12, 1300),
    canvasSpeed: choice(source.canvasSpeed, fallback.canvasSpeed, SPEEDS),
    canvasPrimaryColor: normalizeHexColor(source.canvasPrimaryColor, fallback.canvasPrimaryColor),
    canvasBackground: normalizeHexColor(source.canvasBackground, fallback.canvasBackground),
  };
}

function queryValue(params: QueryReader, key: string): string | undefined {
  const value = params.get(key);
  return value === null ? undefined : value;
}

function queryBoolean(params: QueryReader, key: string): boolean | undefined {
  const value = params.get(key);
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return undefined;
}

function queryText(params: QueryReader, key: string, emptyKey: string): string | undefined {
  if (queryBoolean(params, emptyKey)) return "";
  return queryValue(params, key);
}

export function readFakeScreenQuery(
  params: QueryReader,
  fallback: FakeScreenState = DEFAULT_FAKE_SCREEN_STATE,
): FakeScreenState {
  return normalizeFakeScreenState(
    {
      mode: queryValue(params, "mode"),
      colorMode: queryValue(params, "colorMode"),
      color: queryValue(params, "color"),
      brightness: queryValue(params, "brightness"),
      timerMinutes: queryValue(params, "timer"),
      deadPixelIndex: queryValue(params, "test"),
      updateTemplate: queryValue(params, "update"),
      updateDurationMinutes: queryValue(params, "duration"),
      updateStartPercent: queryValue(params, "start"),
      updateProgressMode: queryValue(params, "progress"),
      updateTitle: queryText(params, "updateTitle", "emptyUpdateTitle"),
      updateSubtitle: queryText(params, "updateSubtitle", "emptyUpdateSubtitle"),
      updateCompletionText: queryText(params, "completion", "emptyCompletion"),
      manualProgress: queryValue(params, "manual"),
      errorTemplate: queryValue(params, "error"),
      errorTitle: queryText(params, "errorTitle", "emptyErrorTitle"),
      errorMessage: queryText(params, "errorMessage", "emptyErrorMessage"),
      errorStopCode: queryValue(params, "stop"),
      errorProgress: queryValue(params, "errorProgress"),
      screensaverTemplate: queryValue(params, "saver"),
      screensaverText: queryText(params, "text", "emptyText"),
      screensaverSpeed: queryValue(params, "speed"),
      screensaverSize: queryValue(params, "size"),
      screensaverBackground: queryValue(params, "saverBg"),
      screensaverColor: queryValue(params, "saverColor"),
      showCornerCounter: queryBoolean(params, "counter"),
      canvasTemplate: queryValue(params, "canvas"),
      canvasDensity: queryValue(params, "density"),
      canvasSpeed: queryValue(params, "canvasSpeed"),
      canvasPrimaryColor: queryValue(params, "canvasColor"),
      canvasBackground: queryValue(params, "canvasBg"),
    },
    fallback,
  );
}

export function buildFakeScreenQuery(state: FakeScreenState): Record<string, string | number | boolean> {
  return {
    mode: state.mode,
    colorMode: state.colorMode,
    color: state.color,
    brightness: state.brightness,
    timer: state.timerMinutes,
    test: state.deadPixelIndex,
    update: state.updateTemplate,
    duration: state.updateDurationMinutes,
    start: state.updateStartPercent,
    progress: state.updateProgressMode,
    updateTitle: state.updateTitle,
    emptyUpdateTitle: state.updateTitle === "",
    updateSubtitle: state.updateSubtitle,
    emptyUpdateSubtitle: state.updateSubtitle === "",
    completion: state.updateCompletionText,
    emptyCompletion: state.updateCompletionText === "",
    manual: state.manualProgress,
    error: state.errorTemplate,
    errorTitle: state.errorTitle,
    emptyErrorTitle: state.errorTitle === "",
    errorMessage: state.errorMessage,
    emptyErrorMessage: state.errorMessage === "",
    stop: state.errorStopCode,
    errorProgress: state.errorProgress,
    saver: state.screensaverTemplate,
    text: state.screensaverText,
    emptyText: state.screensaverText === "",
    speed: state.screensaverSpeed,
    size: state.screensaverSize,
    saverBg: state.screensaverBackground,
    saverColor: state.screensaverColor,
    counter: state.showCornerCounter,
    canvas: state.canvasTemplate,
    density: state.canvasDensity,
    canvasSpeed: state.canvasSpeed,
    canvasColor: state.canvasPrimaryColor,
    canvasBg: state.canvasBackground,
  };
}

export function calculateFakeScreenProgress(
  state: FakeScreenState,
  startedAt: number,
  now: number,
): number {
  if (state.updateProgressMode === "manual") return state.manualProgress;
  const durationMs = Math.max(1, state.updateDurationMinutes) * 60 * 1000;
  const elapsedRatio = Math.max(0, (now - startedAt) / durationMs);
  const start = Math.min(99, Math.max(0, state.updateStartPercent));
  if (state.updateProgressMode === "loop") return Math.round(start + (100 - start) * (elapsedRatio % 1));
  const capped = Math.min(1, elapsedRatio);
  if (state.updateProgressMode === "linear") return Math.round(start + (100 - start) * capped);
  if (state.updateProgressMode === "stuck-99") {
    return Math.min(99, Math.round(start + (99 - start) * Math.min(1, capped * 1.7)));
  }
  if (capped >= 1) return 100;
  const realistic = capped < 0.55
    ? capped * 1.25
    : 0.69 + (1 - Math.exp(-(capped - 0.55) * 4.1)) * 0.3;
  return Math.min(99, Math.round(start + (99 - start) * realistic));
}

export function getSceneLabel(state: FakeScreenState): string {
  if (state.mode === "color") return COLOR_LABELS[state.colorMode];
  if (state.mode === "update") return UPDATE_LABELS[state.updateTemplate];
  if (state.mode === "error") return ERROR_LABELS[state.errorTemplate];
  if (state.mode === "screensaver") return SCREENSAVER_LABELS[state.screensaverTemplate];
  return CANVAS_LABELS[state.canvasTemplate];
}

function getMotionLabel(state: FakeScreenState): string {
  if (state.mode === "update") return state.updateProgressMode === "manual" ? "Manual progress" : `${state.updateProgressMode} progress`;
  if (state.mode === "screensaver") return `${state.screensaverSpeed} animation`;
  if (state.mode === "canvas") return `${state.canvasSpeed} animation`;
  if (state.mode === "color" && state.colorMode === "cleaning") return `${state.timerMinutes} min timer`;
  return "Static scene";
}

function getComplexityLabel(state: FakeScreenState): string {
  if (state.mode === "canvas") {
    if (state.canvasDensity >= 900) return "High render load";
    if (state.canvasDensity >= 300) return "Medium render load";
    return "Light render load";
  }
  if (state.mode === "screensaver" || state.mode === "update") return "Light animation";
  return "Minimal render load";
}

export function summarizeAudit(checks: FakeScreenAuditCheck[]) {
  return checks.reduce(
    (summary, check) => {
      summary[check.severity] += 1;
      return summary;
    },
    { error: 0, warning: 0, info: 0, pass: 0 },
  );
}

export function buildFakeScreenSummary(
  state: FakeScreenState,
  progress: number,
  checks: FakeScreenAuditCheck[],
): FakeScreenSummaryCard[] {
  const counts = summarizeAudit(checks);
  const readiness = counts.error ? "Blocked" : counts.warning ? "Review" : "Ready";
  const readinessDetail = counts.error
    ? `${counts.error} error${counts.error === 1 ? "" : "s"} must be fixed`
    : counts.warning
      ? `${counts.warning} warning${counts.warning === 1 ? "" : "s"} to review`
      : `${counts.pass} checks passed`;

  return [
    { label: "Mode", value: MODE_LABELS[state.mode], detail: getSceneLabel(state) },
    {
      label: "Live state",
      value: state.mode === "update" ? `${progress}%` : getMotionLabel(state),
      detail: state.mode === "update" ? getMotionLabel(state) : "Preview updates immediately",
    },
    { label: "Render profile", value: getComplexityLabel(state), detail: state.mode === "canvas" ? `${state.canvasDensity} particles / units` : "Browser-only visual" },
    { label: "Production checks", value: readiness, detail: readinessDetail },
  ];
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHexColor(hex, "#000000").slice(1);
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function channelLuminance(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function getContrastRatio(foreground: string, background: string): number {
  const [fr, fg, fb] = hexToRgb(foreground).map(channelLuminance);
  const [br, bg, bb] = hexToRgb(background).map(channelLuminance);
  const foregroundLuminance = fr * 0.2126 + fg * 0.7152 + fb * 0.0722;
  const backgroundLuminance = br * 0.2126 + bg * 0.7152 + bb * 0.0722;
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function containsDisclosure(value: string): boolean {
  return /\b(demo|safe|simulation|visual|harmless|practice|mock|preview)\b/i.test(value);
}

export function buildFakeScreenAudit(state: FakeScreenState): FakeScreenAuditCheck[] {
  const checks: FakeScreenAuditCheck[] = [];

  if (state.mode === "update") {
    checks.push({
      id: "update-title",
      title: "Update title",
      message: state.updateTitle ? "The update screen has a visible primary message." : "Add a primary update message before sharing or exporting.",
      severity: state.updateTitle ? "pass" : "error",
    });
    checks.push({
      id: "update-disclosure",
      title: "Demo disclosure",
      message: containsDisclosure(`${state.updateTitle} ${state.updateSubtitle}`)
        ? "The content identifies the screen as a demo, visual, or simulation."
        : "Add words such as “demo” or “simulation” so viewers are not misled.",
      severity: containsDisclosure(`${state.updateTitle} ${state.updateSubtitle}`) ? "pass" : "warning",
    });
    if (state.updateDurationMinutes > 45) {
      checks.push({ id: "update-duration", title: "Long-running animation", message: "Durations above 45 minutes can keep a device awake and are difficult to review before use.", severity: "warning" });
    } else {
      checks.push({ id: "update-duration", title: "Animation duration", message: `${state.updateDurationMinutes} minutes is within the supported production range.`, severity: "pass" });
    }
    if (state.updateProgressMode === "loop" || state.updateProgressMode === "stuck-99") {
      checks.push({ id: "update-ending", title: "Non-terminating progress", message: "This progress mode is intentionally designed not to finish normally.", severity: "info" });
    } else {
      checks.push({
        id: "update-completion",
        title: "Completion message",
        message: state.updateCompletionText ? "A finishable update scene has a completion message." : "Add a completion message for the 100% state.",
        severity: state.updateCompletionText ? "pass" : "warning",
      });
    }
  }

  if (state.mode === "error") {
    checks.push({
      id: "error-title",
      title: "Error title",
      message: state.errorTitle ? "The error scene has a visible primary message." : "Add a primary error title before sharing or exporting.",
      severity: state.errorTitle ? "pass" : "error",
    });
    const disclosed = containsDisclosure(`${state.errorTitle} ${state.errorMessage} ${state.errorStopCode}`) || state.errorStopCode.includes("DARMA");
    checks.push({
      id: "error-disclosure",
      title: "Harmless-use disclosure",
      message: disclosed ? "The scene contains a visible demo or simulation cue." : "Add a visible demo cue so the screen cannot be mistaken for a real device failure.",
      severity: disclosed ? "pass" : "warning",
    });
  }

  if (state.mode === "screensaver") {
    const requiresText = state.screensaverTemplate !== "flip-clock";
    checks.push({
      id: "screensaver-text",
      title: "Screensaver content",
      message: !requiresText || state.screensaverText ? "The selected screensaver has usable display content." : "Add text for the selected screensaver.",
      severity: !requiresText || state.screensaverText ? "pass" : "error",
    });
    const contrast = getContrastRatio(state.screensaverColor, state.screensaverBackground);
    checks.push({
      id: "screensaver-contrast",
      title: "Foreground contrast",
      message: `Contrast ratio is ${contrast.toFixed(2)}:1.${contrast < 3 ? " Increase separation for large fullscreen text." : " Colors should remain distinguishable on most displays."}`,
      severity: contrast < 3 ? "warning" : "pass",
    });
  }

  if (state.mode === "canvas") {
    const contrast = getContrastRatio(state.canvasPrimaryColor, state.canvasBackground);
    checks.push({
      id: "canvas-contrast",
      title: "Canvas color separation",
      message: `Primary-to-background contrast is ${contrast.toFixed(2)}:1.`,
      severity: contrast < 1.8 ? "warning" : "pass",
    });
    checks.push({
      id: "canvas-density",
      title: "Canvas render load",
      message: state.canvasDensity > 1000
        ? "Very high density may drop frames on mobile devices or older laptops."
        : `${state.canvasDensity} drawing units is within the supported range.`,
      severity: state.canvasDensity > 1000 ? "warning" : "pass",
    });
  }

  if (state.mode === "color") {
    if (state.colorMode === "soft-light" && state.brightness > 85) {
      checks.push({ id: "soft-light-brightness", title: "Soft-light brightness", message: "Brightness above 85% may be uncomfortable in a dark room.", severity: "warning" });
    } else {
      checks.push({ id: "color-output", title: "Color output", message: "The selected color mode and brightness are valid.", severity: "pass" });
    }
    if (state.colorMode === "cleaning" && state.timerMinutes > 10) {
      checks.push({ id: "cleaning-timer", title: "Cleaning timer", message: "A screen-cleaning timer above 10 minutes is unusually long.", severity: "warning" });
    }
  }

  checks.push({
    id: "fullscreen-exit",
    title: "Fullscreen exit",
    message: "Fullscreen requires a user action and remains escapable with the browser’s standard controls.",
    severity: "pass",
  });
  checks.push({
    id: "local-processing",
    title: "Local processing",
    message: "Configuration, preview rendering, import, and export stay in the browser.",
    severity: "pass",
  });

  return checks;
}

export function buildFakeScreenConfig(
  state: FakeScreenState,
  exportedAt = new Date().toISOString(),
): FakeScreenConfigFile {
  return {
    schema: "darma.fake-screen",
    version: 1,
    exportedAt,
    state: normalizeFakeScreenState(state),
  };
}

export function serializeFakeScreenConfig(state: FakeScreenState, exportedAt?: string): string {
  return `${JSON.stringify(buildFakeScreenConfig(state, exportedAt), null, 2)}\n`;
}

export function parseFakeScreenConfig(text: string):
  | { ok: true; state: FakeScreenState }
  | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "The selected file is not valid JSON." };
  }

  if (!isRecord(parsed)) return { ok: false, error: "The JSON root must be an object." };
  if (typeof parsed.schema === "string" && parsed.schema !== "darma.fake-screen") {
    return { ok: false, error: "This JSON file belongs to a different Darma tool." };
  }
  if (typeof parsed.version === "number" && parsed.version > 1) {
    return { ok: false, error: "This configuration was created by a newer unsupported version." };
  }
  const candidate = isRecord(parsed.state) ? parsed.state : parsed;
  const normalized = normalizeFakeScreenState(candidate);
  const hasKnownField = ["mode", "colorMode", "updateTemplate", "errorTemplate", "screensaverTemplate", "canvasTemplate"]
    .some((field) => field in candidate);
  if (!hasKnownField) return { ok: false, error: "No Fake Screen configuration fields were found." };
  return { ok: true, state: normalized };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

function standalonePalette(state: FakeScreenState): { background: string; foreground: string } {
  if (state.mode === "color") {
    const selectedColor = state.colorMode === "dead-pixel"
      ? DEAD_PIXEL_COLORS[state.deadPixelIndex]?.value ?? DEAD_PIXEL_COLORS[0].value
      : state.color;
    return {
      background: selectedColor,
      foreground: getContrastRatio("#ffffff", selectedColor) >= 3 ? "#ffffff" : "#111827",
    };
  }
  if (state.mode === "screensaver") return { background: state.screensaverBackground, foreground: state.screensaverColor };
  if (state.mode === "canvas") return { background: state.canvasBackground, foreground: state.canvasPrimaryColor };
  if (state.mode === "error") {
    if (state.errorTemplate === "blue-modern") return { background: "#0877bd", foreground: "#ffffff" };
    if (state.errorTemplate === "blue-classic") return { background: "#0000aa", foreground: "#ffffff" };
    if (state.errorTemplate === "radar") return { background: "#022c22", foreground: "#6ee7b7" };
    return { background: "#050505", foreground: "#22c55e" };
  }
  if (state.updateTemplate === "win10") return { background: "#0078d7", foreground: "#ffffff" };
  if (state.updateTemplate === "ubuntu") return { background: "#2c001e", foreground: "#ffffff" };
  return { background: "#080b12", foreground: "#ffffff" };
}

function standaloneContent(state: FakeScreenState): string {
  if (state.mode === "color") {
    if (state.colorMode === "dead-pixel") {
      const selected = DEAD_PIXEL_COLORS[state.deadPixelIndex] ?? DEAD_PIXEL_COLORS[0];
      return `<p class="eyebrow">DISPLAY TEST</p><h1>${selected.label} test screen</h1><p>Selected fixed RGB screen for inspecting stuck or dead pixels.</p>`;
    }
    if (state.colorMode === "cleaning") return `<p class="eyebrow">SCREEN CLEANER</p><h1 id="cleaningTimer">${state.timerMinutes}:00</h1><p>Exit fullscreen before physically cleaning the display.</p>`;
    if (state.colorMode === "soft-light") return "<p class=\"eyebrow\">SOFT LIGHT</p><h1>Ambient light screen</h1>";
    return "<p class=\"eyebrow\">SOLID COLOR</p><h1>Fullscreen color scene</h1>";
  }
  if (state.mode === "update") {
    return `<p class="eyebrow">${escapeHtml(UPDATE_LABELS[state.updateTemplate])}</p><h1 id="updateTitle">${escapeHtml(state.updateTitle)}</h1><p>${escapeHtml(state.updateSubtitle)}</p><div class="progress"><i id="progressBar"></i></div><strong id="progressValue">${state.updateStartPercent}%</strong>`;
  }
  if (state.mode === "error") {
    return `<p class="eyebrow">${escapeHtml(ERROR_LABELS[state.errorTemplate])}</p><h1>${escapeHtml(state.errorTitle)}</h1><p>${escapeHtml(state.errorMessage)}</p><code>${escapeHtml(state.errorStopCode)}</code>`;
  }
  if (state.mode === "screensaver") {
    if (state.screensaverTemplate === "flip-clock") return "<time id=\"clock\">00:00:00</time>";
    return `<div class="moving">${escapeHtml(state.screensaverText || SCREENSAVER_LABELS[state.screensaverTemplate])}</div>`;
  }
  return `<p class="eyebrow">${escapeHtml(CANVAS_LABELS[state.canvasTemplate])}</p><h1>Animated canvas scene</h1><p>Portable CSS approximation generated from your Darma configuration.</p><div class="orbs"><i></i><i></i><i></i><i></i></div>`;
}

export function buildStandaloneHtml(state: FakeScreenState): string {
  const normalized = normalizeFakeScreenState(state);
  const palette = standalonePalette(normalized);
  const safeJson = (value: unknown) => JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  const config = safeJson(buildFakeScreenConfig(normalized));
  const stateJson = safeJson(normalized);
  const durationSeconds = Math.max(1, normalized.updateDurationMinutes * 60);
  const startProgress = normalized.updateProgressMode === "manual" ? normalized.manualProgress : normalized.updateStartPercent;
  const animationDuration = normalized.screensaverSpeed === "slow" ? 12 : normalized.screensaverSpeed === "fast" ? 4 : 7;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Darma Fake Screen — ${escapeHtml(getSceneLabel(normalized))}</title>
<style>
:root{color-scheme:dark;--bg:${palette.background};--fg:${palette.foreground};--duration:${durationSeconds}s;--motion:${animationDuration}s}*{box-sizing:border-box}html,body{height:100%;margin:0}body{overflow:hidden;background:var(--bg);color:var(--fg);font-family:Inter,ui-sans-serif,system-ui,sans-serif}.screen{position:relative;display:grid;min-height:100%;place-items:center;padding:clamp(24px,6vw,88px);filter:brightness(${normalized.mode === "color" ? normalized.brightness / 100 : 1})}.content{position:relative;z-index:2;width:min(900px,100%);text-align:center}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;opacity:.7}h1{margin:.35em 0;font-size:clamp(34px,8vw,88px);line-height:1.02}p{font-size:clamp(16px,2.3vw,24px);line-height:1.6;opacity:.82}code,strong,time{display:block;margin-top:24px;font-size:clamp(18px,3vw,34px)}.progress{height:10px;margin:30px auto 14px;overflow:hidden;border-radius:999px;background:color-mix(in srgb,var(--fg) 18%,transparent)}.progress i{display:block;height:100%;width:${startProgress}%;border-radius:inherit;background:var(--fg);transition:width .35s linear}.moving{display:inline-block;font-size:${normalized.screensaverSize}px;font-weight:900;animation:float var(--motion) ease-in-out infinite alternate}.orbs{position:absolute;inset:0;overflow:hidden}.orbs i{position:absolute;width:22vmin;height:22vmin;border:2px solid var(--fg);border-radius:50%;opacity:.22;animation:drift var(--motion) ease-in-out infinite alternate}.orbs i:nth-child(1){left:8%;top:12%}.orbs i:nth-child(2){right:10%;top:18%;animation-delay:-2s}.orbs i:nth-child(3){left:24%;bottom:8%;animation-delay:-4s}.orbs i:nth-child(4){right:20%;bottom:12%;animation-delay:-6s}.notice{position:fixed;right:16px;bottom:16px;z-index:5;max-width:min(520px,calc(100% - 32px));border:1px solid color-mix(in srgb,var(--fg) 28%,transparent);border-radius:999px;background:color-mix(in srgb,var(--bg) 82%,transparent);padding:10px 16px;font-size:12px;font-weight:700;backdrop-filter:blur(12px)}@keyframes float{to{transform:translate(18vw,-12vh) rotate(4deg)}}@keyframes drift{to{transform:translate(12vw,14vh) scale(1.35)}}@media(prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
</head>
<body>
<main class="screen" id="screen"><div class="content">${standaloneContent(normalized)}</div></main>
<div class="notice">Safe Darma visual demo. Click the scene to enter fullscreen; press Esc to exit.</div>
<script type="application/json" id="darma-config">${config}</script>
<script>
const state=${stateJson};
const screen=document.getElementById('screen');
screen.addEventListener('click',()=>screen.requestFullscreen?.());
const progressValue=document.getElementById('progressValue');
const progressBar=document.getElementById('progressBar');
const updateTitle=document.getElementById('updateTitle');
if(progressValue){
  const started=Date.now();
  const duration=Math.max(1,state.updateDurationMinutes)*60000;
  const start=Math.max(0,Math.min(99,state.updateStartPercent));
  const renderProgress=()=>{
    let value=state.manualProgress;
    if(state.updateProgressMode!=='manual'){
      const elapsed=Math.max(0,(Date.now()-started)/duration);
      if(state.updateProgressMode==='loop'){
        value=Math.round(start+(100-start)*(elapsed%1));
      }else if(state.updateProgressMode==='stuck-99'){
        value=Math.min(99,Math.round(start+(99-start)*Math.min(1,elapsed*1.7)));
      }else if(state.updateProgressMode==='realistic'){
        if(elapsed>=1){
          value=100;
        }else{
          const curve=elapsed<.55 ? elapsed*1.25 : .69+(1-Math.exp(-(elapsed-.55)*4.1))*.3;
          value=Math.min(99,Math.round(start+(99-start)*curve));
        }
      }else{
        value=Math.round(start+(100-start)*Math.min(1,elapsed));
      }
    }
    value=Math.max(0,Math.min(100,value));
    progressValue.textContent=value+'%';
    if(progressBar) progressBar.style.width=value+'%';
    if(value>=100&&updateTitle&&state.updateCompletionText) updateTitle.textContent=state.updateCompletionText;
  };
  renderProgress();
  if(state.updateProgressMode!=='manual') setInterval(renderProgress,500);
}
const cleaningTimer=document.getElementById('cleaningTimer');
if(cleaningTimer){
  const cleaningStarted=Date.now();
  const cleaningDuration=Math.max(1,state.timerMinutes)*60000;
  const tickCleaning=()=>{
    const remaining=Math.max(0,Math.ceil((cleaningDuration-(Date.now()-cleaningStarted))/1000));
    cleaningTimer.textContent=Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0');
  };
  tickCleaning(); setInterval(tickCleaning,1000);
}
const clock=document.getElementById('clock');
if(clock){const tick=()=>clock.textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});tick();setInterval(tick,1000);}
</script>
</body>
</html>
`;
}

export function buildFakeScreenMarkdown(
  state: FakeScreenState,
  checks: FakeScreenAuditCheck[] = buildFakeScreenAudit(state),
): string {
  const summary = summarizeAudit(checks);
  const lines = [
    "# Darma Fake Screen production report",
    "",
    `- Mode: ${MODE_LABELS[state.mode]}`,
    `- Scene: ${getSceneLabel(state)}`,
    `- Audit: ${summary.error} errors, ${summary.warning} warnings, ${summary.info} info, ${summary.pass} passed`,
    "- Processing: local in the browser",
    "",
    "## Production checks",
    "",
    ...checks.map((check) => `- **${check.severity.toUpperCase()} — ${check.title}:** ${check.message}`),
    "",
    "## Responsible-use note",
    "",
    "Fullscreen visual simulations should remain clearly identifiable as demos and must not be used to deceive, obstruct, or impersonate a real system state.",
    "",
  ];
  return lines.join("\n");
}
