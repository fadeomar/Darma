import JSZip from "jszip";
import {
  calculateScrollStats,
  formatNumber,
  modeLabel,
  scoreLabel,
  scrollGaps,
  smoothnessLabel,
} from "./scrollMetrics";
import type {
  ScrollAttempt,
  ScrollInputMethod,
  ScrollSample,
  ScrollSampleSource,
  ScrollStats,
  ScrollTestMode,
} from "./types";

export type ScrollAuditSeverity = "error" | "warning" | "info" | "pass";

export type ScrollAuditCheck = {
  id: string;
  title: string;
  message: string;
  severity: ScrollAuditSeverity;
};

export type ScrollSummaryCard = {
  label: string;
  value: string;
  detail: string;
};

export type ScrollSessionSettings = {
  mode: ScrollTestMode;
};

export type ScrollBackupFile = {
  schema: "darma.mouse-scroll-session";
  version: 1;
  exportedAt: string;
  settings: ScrollSessionSettings;
  attempts: ScrollAttempt[];
  note: string;
};

export type ScrollAttemptAnalysis = {
  medianGapMs: number;
  spreadGapMs: number;
  interruptedGaps: number;
  extremeDeltaEvents: number;
  directionChanges: number;
  confidence: "No result" | "Low" | "Moderate" | "Strong";
};

export const SCROLL_IMPORT_MAX_BYTES = 1024 * 1024;
export const SCROLL_HISTORY_LIMIT = 10;
export const SCROLL_SAMPLE_LIMIT = 120_000;

const PROJECT_NOTE =
  "This local backup contains scroll-test settings and relative wheel or touch movement samples. It does not contain account data, network identifiers, or browser fingerprints.";

const MODES = new Set<ScrollTestMode>([5, 10, 30, 60, "manual"]);
const SOURCES = new Set<ScrollSampleSource>(["wheel", "touch"]);
const INPUT_METHODS = new Set<ScrollInputMethod>([
  "Wheel",
  "Touch",
  "Mixed",
  "None",
]);

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown, fallback: string, maxLength = 120) {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/\u0000/g, "").trim().slice(0, maxLength);
  return cleaned || fallback;
}

function finiteNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function normalizeMode(
  value: unknown,
  fallback: ScrollTestMode = 10,
): ScrollTestMode {
  return (typeof value === "number" || value === "manual") &&
    MODES.has(value as ScrollTestMode)
    ? (value as ScrollTestMode)
    : fallback;
}

function normalizeSource(value: unknown): ScrollSampleSource | null {
  return typeof value === "string" && SOURCES.has(value as ScrollSampleSource)
    ? (value as ScrollSampleSource)
    : null;
}

function normalizeInputMethod(value: unknown): ScrollInputMethod {
  return typeof value === "string" &&
    INPUT_METHODS.has(value as ScrollInputMethod)
    ? (value as ScrollInputMethod)
    : "None";
}

function normalizeCreatedAt(value: unknown) {
  if (typeof value !== "string") return new Date(0).toISOString();
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString()
    : new Date(0).toISOString();
}

function normalizeStats(value: unknown): ScrollStats {
  const source = isRecord(value) ? value : {};
  const directionValues = new Set([
    "Down",
    "Up",
    "Right",
    "Left",
    "Mixed",
    "None",
  ]);
  const direction =
    typeof source.direction === "string" &&
    directionValues.has(source.direction)
      ? (source.direction as ScrollStats["direction"])
      : "None";

  return {
    totalDistance: finiteNumber(source.totalDistance, 0, 0, 1_000_000_000),
    netVertical: finiteNumber(
      source.netVertical,
      0,
      -1_000_000_000,
      1_000_000_000,
    ),
    netHorizontal: finiteNumber(
      source.netHorizontal,
      0,
      -1_000_000_000,
      1_000_000_000,
    ),
    eventsCount: Math.floor(
      finiteNumber(source.eventsCount, 0, 0, SCROLL_SAMPLE_LIMIT),
    ),
    elapsedSeconds: finiteNumber(source.elapsedSeconds, 0, 0, 86_400),
    pixelsPerSecond: finiteNumber(
      source.pixelsPerSecond,
      0,
      0,
      100_000_000,
    ),
    eventsPerSecond: finiteNumber(source.eventsPerSecond, 0, 0, 100_000),
    bestBurst: finiteNumber(source.bestBurst, 0, 0, 100_000_000),
    smoothnessScore: Math.round(
      finiteNumber(source.smoothnessScore, 0, 0, 100),
    ),
    direction,
    inputMethod: normalizeInputMethod(source.inputMethod),
  };
}

function normalizeSamples(
  value: unknown,
  mode: ScrollTestMode,
  elapsedMs: number,
) {
  if (!Array.isArray(value)) return [];
  const maxTime =
    typeof mode === "number"
      ? Math.min(elapsedMs + 250, mode * 1000 + 250)
      : Math.min(elapsedMs + 250, 86_400_000);
  const normalized: ScrollSample[] = [];
  let previousTime = -1;

  for (const item of value.slice(0, SCROLL_SAMPLE_LIMIT)) {
    if (!isRecord(item)) continue;
    const source = normalizeSource(item.source);
    if (!source) continue;
    if (
      typeof item.time !== "number" ||
      !Number.isFinite(item.time) ||
      item.time < 0 ||
      item.time > maxTime ||
      item.time <= previousTime
    ) {
      continue;
    }
    if (
      typeof item.dx !== "number" ||
      !Number.isFinite(item.dx) ||
      typeof item.dy !== "number" ||
      !Number.isFinite(item.dy)
    ) {
      continue;
    }
    const dx = Math.max(-1_000_000, Math.min(1_000_000, item.dx));
    const dy = Math.max(-1_000_000, Math.min(1_000_000, item.dy));
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) continue;

    normalized.push({ time: item.time, dx, dy, source });
    previousTime = item.time;
  }

  return normalized;
}

export function normalizeScrollAttempt(value: unknown): ScrollAttempt | null {
  if (!isRecord(value) || typeof value.id !== "string" || !value.id.trim()) {
    return null;
  }

  const mode = normalizeMode(value.mode);
  const rawStats = normalizeStats(value.stats);
  const fallbackElapsed =
    rawStats.elapsedSeconds > 0
      ? rawStats.elapsedSeconds * 1000
      : typeof mode === "number"
        ? mode * 1000
        : 0;
  const elapsedMs = Math.max(
    1,
    finiteNumber(value.elapsedMs, fallbackElapsed, 0, 86_400_000),
  );
  const samples = normalizeSamples(value.samples, mode, elapsedMs);
  const stats = samples.length
    ? calculateScrollStats(samples, elapsedMs)
    : rawStats;

  return {
    id: cleanString(value.id, "scroll-attempt"),
    createdAt: normalizeCreatedAt(value.createdAt),
    mode,
    elapsedMs,
    stats,
    samples,
  };
}

export function createScrollAttempt({
  id,
  createdAt,
  mode,
  elapsedMs,
  samples,
}: {
  id: string;
  createdAt: string;
  mode: ScrollTestMode;
  elapsedMs: number;
  samples: ScrollSample[];
}): ScrollAttempt {
  const normalized = normalizeScrollAttempt({
    id,
    createdAt,
    mode,
    elapsedMs,
    samples,
    stats: calculateScrollStats(samples, elapsedMs),
  });
  if (!normalized) throw new Error("Unable to create a valid scroll attempt.");
  return normalized;
}

export function normalizeScrollSettings(value: unknown): ScrollSessionSettings {
  const source = isRecord(value) ? value : {};
  return { mode: normalizeMode(source.mode) };
}

export function createScrollBackup(
  settings: ScrollSessionSettings,
  attempts: ScrollAttempt[],
  exportedAt = new Date().toISOString(),
): ScrollBackupFile {
  const normalizedAttempts = attempts
    .map(normalizeScrollAttempt)
    .filter((attempt): attempt is ScrollAttempt => Boolean(attempt))
    .slice(0, SCROLL_HISTORY_LIMIT);

  return {
    schema: "darma.mouse-scroll-session",
    version: 1,
    exportedAt,
    settings: normalizeScrollSettings(settings),
    attempts: normalizedAttempts,
    note: PROJECT_NOTE,
  };
}

export function parseScrollBackup(input: string): ScrollBackupFile {
  if (new TextEncoder().encode(input).byteLength > SCROLL_IMPORT_MAX_BYTES) {
    throw new Error("The selected backup is larger than the 1 MB import limit.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!isRecord(parsed)) throw new Error("The backup must contain a JSON object.");
  if (parsed.schema !== "darma.mouse-scroll-session") {
    throw new Error("This is not a Darma Mouse Scroll backup.");
  }
  if (parsed.version !== 1) {
    throw new Error("This Mouse Scroll backup version is not supported.");
  }
  if (!Array.isArray(parsed.attempts)) {
    throw new Error("The backup does not contain a valid attempts array.");
  }

  const attempts = parsed.attempts
    .slice(0, SCROLL_HISTORY_LIMIT)
    .map(normalizeScrollAttempt)
    .filter((attempt): attempt is ScrollAttempt => Boolean(attempt));
  const ids = new Set<string>();
  for (const attempt of attempts) {
    if (ids.has(attempt.id)) {
      throw new Error("The backup contains duplicate attempt IDs.");
    }
    ids.add(attempt.id);
  }

  return {
    schema: "darma.mouse-scroll-session",
    version: 1,
    exportedAt: normalizeCreatedAt(parsed.exportedAt),
    settings: normalizeScrollSettings(parsed.settings),
    attempts,
    note: PROJECT_NOTE,
  };
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function directionChanges(samples: ScrollSample[]) {
  let changes = 0;
  let previousSign = 0;
  for (const sample of samples) {
    const dominant =
      Math.abs(sample.dy) >= Math.abs(sample.dx) ? sample.dy : sample.dx;
    const sign = Math.sign(dominant);
    if (!sign) continue;
    if (previousSign && sign !== previousSign) changes += 1;
    previousSign = sign;
  }
  return changes;
}

export function analyzeScrollAttempt(
  attempt: ScrollAttempt | null,
): ScrollAttemptAnalysis {
  if (!attempt) {
    return {
      medianGapMs: 0,
      spreadGapMs: 0,
      interruptedGaps: 0,
      extremeDeltaEvents: 0,
      directionChanges: 0,
      confidence: "No result",
    };
  }

  const gaps = scrollGaps(attempt.samples);
  const fastest = gaps.length ? Math.min(...gaps) : 0;
  const slowest = gaps.length ? Math.max(...gaps) : 0;
  const interruptedGaps = gaps.filter((gap) => gap > 1500).length;
  const extremeDeltaEvents = attempt.samples.filter(
    (sample) => Math.hypot(sample.dx, sample.dy) > 10_000,
  ).length;
  const reversals = directionChanges(attempt.samples);
  let confidence: ScrollAttemptAnalysis["confidence"] = "Low";

  const usefulDuration = attempt.elapsedMs >= 5000;
  if (
    usefulDuration &&
    attempt.stats.eventsCount >= 30 &&
    attempt.stats.smoothnessScore >= 55 &&
    interruptedGaps === 0 &&
    extremeDeltaEvents === 0 &&
    attempt.stats.inputMethod !== "Mixed"
  ) {
    confidence = "Strong";
  } else if (
    usefulDuration &&
    attempt.stats.eventsCount >= 12 &&
    extremeDeltaEvents === 0
  ) {
    confidence = "Moderate";
  }

  return {
    medianGapMs: Math.round(median(gaps)),
    spreadGapMs: Math.round(Math.max(0, slowest - fastest)),
    interruptedGaps,
    extremeDeltaEvents,
    directionChanges: reversals,
    confidence,
  };
}

export function buildScrollAudit(
  attempt: ScrollAttempt | null,
): ScrollAuditCheck[] {
  if (!attempt) {
    return [
      {
        id: "run-missing",
        title: "Complete a run",
        message:
          "Finish at least one scroll sprint before exporting a production report.",
        severity: "error",
      },
      {
        id: "local-only",
        title: "Local processing",
        message:
          "Scroll samples and history stay in this browser unless you explicitly download a backup.",
        severity: "pass",
      },
    ];
  }

  const analysis = analyzeScrollAttempt(attempt);
  const checks: ScrollAuditCheck[] = [];

  if (!attempt.samples.length && attempt.stats.eventsCount > 0) {
    checks.push({
      id: "legacy-evidence",
      title: "Legacy aggregate only",
      message:
        "This saved run predates per-event evidence. Its aggregate score is preserved, but CSV and timing validation are unavailable.",
      severity: "warning",
    });
  } else if (attempt.stats.eventsCount === attempt.samples.length) {
    checks.push({
      id: "evidence-complete",
      title: "Scroll evidence is complete",
      message: `All ${attempt.samples.length} counted events contain relative timing, movement deltas, and an input source.`,
      severity: "pass",
    });
  }

  if (attempt.stats.eventsCount < 12) {
    checks.push({
      id: "sample-size",
      title: "Very small event sample",
      message:
        "Fewer than twelve events produce unstable speed and smoothness estimates. Use a longer sprint for comparison.",
      severity: "warning",
    });
  } else if (attempt.elapsedMs >= 5000) {
    checks.push({
      id: "sample-size",
      title: "Useful sprint duration",
      message: `${formatNumber(attempt.elapsedMs / 1000, 1)} seconds and ${attempt.stats.eventsCount} events provide a useful same-device comparison.`,
      severity: "pass",
    });
  } else {
    checks.push({
      id: "sample-size",
      title: "Short manual run",
      message:
        "Runs below five seconds are highly sensitive to start and stop timing. Use a timed mode for fairer comparisons.",
      severity: "info",
    });
  }

  if (typeof attempt.mode === "number") {
    const expectedMs = attempt.mode * 1000;
    const drift = Math.abs(attempt.elapsedMs - expectedMs);
    checks.push(
      drift <= 250
        ? {
            id: "timer-complete",
            title: "Timed run completed",
            message: `The recorded duration matches the ${attempt.mode}-second mode within the accepted browser-timing tolerance.`,
            severity: "pass",
          }
        : {
            id: "timer-drift",
            title: "Timed duration mismatch",
            message: `The saved duration differs from the selected ${attempt.mode}-second mode by ${formatNumber(drift)} ms.`,
            severity: "warning",
          },
    );
  } else {
    checks.push({
      id: "manual-mode",
      title: "Manual timing",
      message:
        "Manual runs depend on when Stop is pressed. Use a fixed timed mode for repeatable comparisons.",
      severity: "info",
    });
  }

  if (analysis.extremeDeltaEvents > 0) {
    checks.push({
      id: "extreme-deltas",
      title: "Extreme movement deltas",
      message: `${analysis.extremeDeltaEvents} event${analysis.extremeDeltaEvents === 1 ? " exceeds" : "s exceed"} 10,000 px. Driver scaling or imported data may dominate the score.`,
      severity: "warning",
    });
  } else if (attempt.samples.length) {
    checks.push({
      id: "extreme-deltas",
      title: "No extreme movement deltas",
      message:
        "No recorded event exceeds the conservative 10,000 px quality flag.",
      severity: "pass",
    });
  }

  if (analysis.interruptedGaps > 0) {
    checks.push({
      id: "interruptions",
      title: "Possible interrupted rhythm",
      message: `${analysis.interruptedGaps} event gap${analysis.interruptedGaps === 1 ? " is" : "s are"} above 1.5 seconds and may include a pause or pointer leaving the arena.`,
      severity: "warning",
    });
  }

  if (attempt.stats.inputMethod === "Mixed") {
    checks.push({
      id: "input-method",
      title: "Mixed input methods",
      message:
        "Wheel and touch movement use different browser event paths. Use one method when comparing runs.",
      severity: "warning",
    });
  } else if (attempt.stats.inputMethod === "None") {
    checks.push({
      id: "input-method",
      title: "Input evidence unavailable",
      message:
        "This legacy result does not include the input source used for each event.",
      severity: "info",
    });
  } else {
    checks.push({
      id: "input-method",
      title: "Consistent input path",
      message: `All recorded events use ${attempt.stats.inputMethod.toLowerCase()} input.`,
      severity: "pass",
    });
  }

  if (attempt.stats.eventsCount >= 6 && attempt.stats.smoothnessScore < 36) {
    checks.push({
      id: "smoothness",
      title: "Highly variable rhythm",
      message: `Smoothness is ${attempt.stats.smoothnessScore}%. Repeat the sprint with the same device and operating-system scroll settings.`,
      severity: "warning",
    });
  } else if (attempt.stats.eventsCount >= 6) {
    checks.push({
      id: "smoothness",
      title: "Scroll rhythm measured",
      message: `${attempt.stats.smoothnessScore}% smoothness is classified as ${smoothnessLabel(attempt.stats.smoothnessScore).toLowerCase()}.`,
      severity: "pass",
    });
  }

  if (analysis.directionChanges > Math.max(8, attempt.stats.eventsCount * 0.45)) {
    checks.push({
      id: "direction-changes",
      title: "Frequent direction changes",
      message: `${analysis.directionChanges} dominant-axis reversals make the run less comparable with a single-direction sprint.`,
      severity: "info",
    });
  }

  checks.push({
    id: "device-effects",
    title: "Device and browser effects",
    message:
      "Wheel notch size, touchpad acceleration, delta mode, browser scheduling, and operating-system settings can change pixel-based results substantially.",
    severity: "info",
  });
  checks.push({
    id: "not-certified",
    title: "Entertainment measurement",
    message:
      "This browser challenge is not a certified mouse, touchpad, accessibility, or medical benchmark.",
    severity: "info",
  });
  checks.push({
    id: "local-only",
    title: "Local processing",
    message:
      "Scroll samples and history stay in this browser unless you explicitly download a backup.",
    severity: "pass",
  });

  return checks;
}

export function buildScrollSummaryCards(
  attempt: ScrollAttempt | null,
): ScrollSummaryCard[] {
  const analysis = analyzeScrollAttempt(attempt);
  return [
    {
      label: "Average speed",
      value: attempt
        ? `${formatNumber(attempt.stats.pixelsPerSecond)} px/s`
        : "—",
      detail: attempt
        ? `${formatNumber(attempt.stats.totalDistance)} px across ${attempt.stats.eventsCount} events`
        : "Complete a sprint to calculate speed.",
    },
    {
      label: "Median event gap",
      value: attempt?.samples.length
        ? `${formatNumber(analysis.medianGapMs)} ms`
        : "—",
      detail: "Middle interval between consecutive recorded events.",
    },
    {
      label: "Confidence",
      value: analysis.confidence,
      detail: attempt
        ? `${attempt.stats.smoothnessScore}% smoothness · ${analysis.interruptedGaps} long gaps`
        : "Complete a run to evaluate comparison quality.",
    },
    {
      label: "Input path",
      value: attempt?.stats.inputMethod ?? "None",
      detail: attempt
        ? `${modeLabel(attempt.mode)} · ${scoreLabel(attempt.stats.pixelsPerSecond)}`
        : "Keep one input method for fair comparisons.",
    },
  ];
}

export function scrollBackupJson(backup: ScrollBackupFile) {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function scrollAttemptCsv(attempt: ScrollAttempt) {
  const rows: Array<Array<string | number>> = [
    [
      "event_number",
      "time_ms",
      "gap_ms",
      "dx_px",
      "dy_px",
      "distance_px",
      "input_source",
    ],
  ];
  attempt.samples.forEach((sample, index) => {
    const previous = attempt.samples[index - 1];
    rows.push([
      index + 1,
      Math.round(sample.time),
      previous ? Math.round(sample.time - previous.time) : "",
      Number(sample.dx.toFixed(3)),
      Number(sample.dy.toFixed(3)),
      Number(Math.hypot(sample.dx, sample.dy).toFixed(3)),
      sample.source,
    ]);
  });
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export function scrollAttemptMarkdown(attempt: ScrollAttempt) {
  const analysis = analyzeScrollAttempt(attempt);
  const checks = buildScrollAudit(attempt);
  const checkLines = checks.map(
    (check) =>
      `- **${check.severity.toUpperCase()} — ${check.title}:** ${check.message}`,
  );
  const sampleRows = attempt.samples.map((sample, index) => {
    const previous = attempt.samples[index - 1];
    const gap = previous ? Math.round(sample.time - previous.time) : "—";
    return `| ${index + 1} | ${Math.round(sample.time)} | ${gap} | ${sample.dx.toFixed(2)} | ${sample.dy.toFixed(2)} | ${Math.hypot(sample.dx, sample.dy).toFixed(2)} | ${sample.source} |`;
  });

  return [
    "# Mouse Scroll Test report",
    "",
    `- Created: ${attempt.createdAt}`,
    `- Mode: ${modeLabel(attempt.mode)}`,
    `- Duration: ${formatNumber(attempt.elapsedMs / 1000, 2)} seconds`,
    `- Total distance: ${formatNumber(attempt.stats.totalDistance)} px`,
    `- Average speed: ${formatNumber(attempt.stats.pixelsPerSecond)} px/s`,
    `- Best half-second burst: ${formatNumber(attempt.stats.bestBurst)} px/s`,
    `- Events: ${attempt.stats.eventsCount}`,
    `- Events per second: ${formatNumber(attempt.stats.eventsPerSecond, 1)}`,
    `- Median event gap: ${formatNumber(analysis.medianGapMs)} ms`,
    `- Gap spread: ${formatNumber(analysis.spreadGapMs)} ms`,
    `- Smoothness: ${attempt.stats.smoothnessScore}%`,
    `- Direction: ${attempt.stats.direction}`,
    `- Input: ${attempt.stats.inputMethod}`,
    `- Result label: ${scoreLabel(attempt.stats.pixelsPerSecond)}`,
    `- Comparison confidence: ${analysis.confidence}`,
    "",
    "## Production checks",
    "",
    ...checkLines,
    "",
    "## Per-event evidence",
    "",
    "| Event | Time from start (ms) | Gap (ms) | dx (px) | dy (px) | Distance (px) | Input |",
    "| ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ...sampleRows,
    "",
    "> Pixel-based scroll speed is device and software dependent. Use this report for entertainment and same-device comparisons, not certified hardware, accessibility, or medical assessment.",
    "",
  ].join("\n");
}

export function scrollPackReadme(attempt: ScrollAttempt) {
  return [
    "# Darma Mouse Scroll production pack",
    "",
    "Files:",
    "- `scroll-session.json`: settings and local attempt backup for re-import.",
    "- `scroll-report.md`: human-readable result and production audit.",
    "- `scroll-events.csv`: per-event relative timings, deltas, distances, and input sources.",
    "- `README.md`: this handoff note.",
    "",
    `Latest run: ${modeLabel(attempt.mode)}, ${formatNumber(attempt.stats.pixelsPerSecond)} px/s, ${attempt.stats.eventsCount} events, ${attempt.stats.inputMethod} input.`,
    "",
    "Keep comparisons on the same device, browser, input method, wheel or touchpad settings, and timer mode. This browser challenge is not a certified hardware or medical assessment.",
    "",
  ].join("\n");
}

export async function createScrollProductionPack(
  backup: ScrollBackupFile,
  attempt: ScrollAttempt,
) {
  const zip = new JSZip();
  zip.file("scroll-session.json", scrollBackupJson(backup));
  zip.file("scroll-report.md", scrollAttemptMarkdown(attempt));
  zip.file("scroll-events.csv", scrollAttemptCsv(attempt));
  zip.file("README.md", scrollPackReadme(attempt));
  return zip.generateAsync({ type: "uint8array" });
}
