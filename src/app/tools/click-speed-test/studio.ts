import JSZip from "jszip";
import {
  calculateClickStats,
  clickGaps,
  consistencyLabel,
  formatNumber,
  modeLabel,
  scoreLabel,
} from "./clickMetrics";
import type {
  ClickAttempt,
  ClickInputMethod,
  ClickSample,
  ClickSampleSource,
  ClickStats,
  ClickTestMode,
} from "./types";

export type ClickAuditSeverity = "error" | "warning" | "info" | "pass";

export type ClickAuditCheck = {
  id: string;
  title: string;
  message: string;
  severity: ClickAuditSeverity;
};

export type ClickSummaryCard = {
  label: string;
  value: string;
  detail: string;
};

export type ClickSessionSettings = {
  mode: ClickTestMode;
};

export type ClickBackupFile = {
  schema: "darma.click-speed-session";
  version: 1;
  exportedAt: string;
  settings: ClickSessionSettings;
  attempts: ClickAttempt[];
  note: string;
};

export type ClickAttemptAnalysis = {
  medianGapMs: number;
  spreadGapMs: number;
  suspiciousFastGaps: number;
  interruptedGaps: number;
  confidence: "No result" | "Low" | "Moderate" | "Strong";
};

export const CLICK_IMPORT_MAX_BYTES = 1024 * 1024;
export const CLICK_HISTORY_LIMIT = 10;
export const CLICK_SAMPLE_LIMIT = 120_000;

const PROJECT_NOTE =
  "This local backup contains click-test settings and recorded relative pointer timings. It does not contain account data, network identifiers, or browser fingerprints.";

const MODES = new Set<ClickTestMode>([5, 10, 30, 60, "manual"]);
const SOURCES = new Set<ClickSampleSource>(["mouse", "touch", "pen"]);
const INPUT_METHODS = new Set<ClickInputMethod>([
  "Mouse",
  "Touch",
  "Pen",
  "Mixed",
  "None",
]);

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown, fallback: string, maxLength = 120) {
  if (typeof value !== "string") return fallback;
  const cleaned = value
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
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
  fallback: ClickTestMode = 10,
): ClickTestMode {
  return (typeof value === "number" || value === "manual") &&
    MODES.has(value as ClickTestMode)
    ? (value as ClickTestMode)
    : fallback;
}

function normalizeSource(value: unknown): ClickSampleSource | null {
  return typeof value === "string" && SOURCES.has(value as ClickSampleSource)
    ? (value as ClickSampleSource)
    : null;
}

function normalizeInputMethod(value: unknown): ClickInputMethod {
  return typeof value === "string" &&
    INPUT_METHODS.has(value as ClickInputMethod)
    ? (value as ClickInputMethod)
    : "None";
}

function normalizeCreatedAt(value: unknown) {
  if (typeof value !== "string") return new Date(0).toISOString();
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString()
    : new Date(0).toISOString();
}

function normalizeStats(value: unknown): ClickStats {
  const source = isRecord(value) ? value : {};
  return {
    totalClicks: Math.floor(
      finiteNumber(source.totalClicks, 0, 0, CLICK_SAMPLE_LIMIT),
    ),
    elapsedSeconds: finiteNumber(source.elapsedSeconds, 0, 0, 86_400),
    clicksPerSecond: finiteNumber(source.clicksPerSecond, 0, 0, 1000),
    bestBurst: Math.floor(finiteNumber(source.bestBurst, 0, 0, 1000)),
    averageGapMs: finiteNumber(source.averageGapMs, 0, 0, 86_400_000),
    fastestGapMs: finiteNumber(source.fastestGapMs, 0, 0, 86_400_000),
    consistencyScore: Math.round(
      finiteNumber(source.consistencyScore, 0, 0, 100),
    ),
    inputMethod: normalizeInputMethod(source.inputMethod),
  };
}

function normalizeSamples(
  value: unknown,
  mode: ClickTestMode,
  elapsedMs: number,
) {
  if (!Array.isArray(value)) return [];
  const maxTime =
    typeof mode === "number"
      ? Math.min(elapsedMs + 250, mode * 1000 + 250)
      : Math.min(elapsedMs + 250, 86_400_000);
  const normalized: ClickSample[] = [];
  let previousTime = -1;

  for (const item of value.slice(0, CLICK_SAMPLE_LIMIT)) {
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
    const time = item.time;
    normalized.push({ time, source });
    previousTime = time;
  }

  return normalized;
}

export function normalizeClickAttempt(value: unknown): ClickAttempt | null {
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
    ? calculateClickStats(samples, elapsedMs)
    : rawStats;

  return {
    id: cleanString(value.id, "click-attempt"),
    createdAt: normalizeCreatedAt(value.createdAt),
    mode,
    elapsedMs,
    stats,
    samples,
  };
}

export function createClickAttempt({
  id,
  createdAt,
  mode,
  elapsedMs,
  samples,
}: {
  id: string;
  createdAt: string;
  mode: ClickTestMode;
  elapsedMs: number;
  samples: ClickSample[];
}): ClickAttempt {
  const normalized = normalizeClickAttempt({
    id,
    createdAt,
    mode,
    elapsedMs,
    samples,
    stats: calculateClickStats(samples, elapsedMs),
  });
  if (!normalized) throw new Error("Unable to create a valid click attempt.");
  return normalized;
}

export function normalizeClickSettings(value: unknown): ClickSessionSettings {
  const source = isRecord(value) ? value : {};
  return { mode: normalizeMode(source.mode) };
}

export function createClickBackup(
  settings: ClickSessionSettings,
  attempts: ClickAttempt[],
  exportedAt = new Date().toISOString(),
): ClickBackupFile {
  const normalizedAttempts = attempts
    .map(normalizeClickAttempt)
    .filter((attempt): attempt is ClickAttempt => Boolean(attempt))
    .slice(0, CLICK_HISTORY_LIMIT);

  return {
    schema: "darma.click-speed-session",
    version: 1,
    exportedAt,
    settings: normalizeClickSettings(settings),
    attempts: normalizedAttempts,
    note: PROJECT_NOTE,
  };
}

export function parseClickBackup(input: string): ClickBackupFile {
  if (new TextEncoder().encode(input).byteLength > CLICK_IMPORT_MAX_BYTES) {
    throw new Error(
      "The selected backup is larger than the 1 MB import limit.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!isRecord(parsed))
    throw new Error("The backup must contain a JSON object.");
  if (parsed.schema !== "darma.click-speed-session") {
    throw new Error("This is not a Darma Click Speed backup.");
  }
  if (parsed.version !== 1) {
    throw new Error("This Click Speed backup version is not supported.");
  }
  if (!Array.isArray(parsed.attempts)) {
    throw new Error("The backup does not contain a valid attempts array.");
  }

  const attempts = parsed.attempts
    .slice(0, CLICK_HISTORY_LIMIT)
    .map(normalizeClickAttempt)
    .filter((attempt): attempt is ClickAttempt => Boolean(attempt));
  const ids = new Set<string>();
  for (const attempt of attempts) {
    if (ids.has(attempt.id)) {
      throw new Error("The backup contains duplicate attempt IDs.");
    }
    ids.add(attempt.id);
  }

  return {
    schema: "darma.click-speed-session",
    version: 1,
    exportedAt: normalizeCreatedAt(parsed.exportedAt),
    settings: normalizeClickSettings(parsed.settings),
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

export function analyzeClickAttempt(
  attempt: ClickAttempt | null,
): ClickAttemptAnalysis {
  if (!attempt) {
    return {
      medianGapMs: 0,
      spreadGapMs: 0,
      suspiciousFastGaps: 0,
      interruptedGaps: 0,
      confidence: "No result",
    };
  }

  const gaps = clickGaps(attempt.samples);
  const medianGapMs = median(gaps);
  const fastest = gaps.length ? Math.min(...gaps) : 0;
  const slowest = gaps.length ? Math.max(...gaps) : 0;
  const suspiciousFastGaps = gaps.filter((gap) => gap < 8).length;
  const interruptedGaps = gaps.filter((gap) => gap > 1500).length;
  let confidence: ClickAttemptAnalysis["confidence"] = "Low";

  const usefulDuration = attempt.elapsedMs >= 5000;
  if (
    usefulDuration &&
    attempt.stats.totalClicks >= 20 &&
    attempt.stats.consistencyScore >= 62 &&
    suspiciousFastGaps === 0 &&
    interruptedGaps === 0 &&
    attempt.stats.inputMethod !== "Mixed"
  ) {
    confidence = "Strong";
  } else if (
    usefulDuration &&
    attempt.stats.totalClicks >= 10 &&
    suspiciousFastGaps === 0
  ) {
    confidence = "Moderate";
  }

  return {
    medianGapMs: Math.round(medianGapMs),
    spreadGapMs: Math.round(Math.max(0, slowest - fastest)),
    suspiciousFastGaps,
    interruptedGaps,
    confidence,
  };
}

export function buildClickAudit(
  attempt: ClickAttempt | null,
): ClickAuditCheck[] {
  if (!attempt) {
    return [
      {
        id: "run-missing",
        title: "Complete a run",
        message:
          "Finish at least one click sprint before exporting a production report.",
        severity: "error",
      },
      {
        id: "local-only",
        title: "Local processing",
        message:
          "Click timings and history stay in this browser unless you explicitly download a backup.",
        severity: "pass",
      },
    ];
  }

  const analysis = analyzeClickAttempt(attempt);
  const checks: ClickAuditCheck[] = [];

  if (!attempt.samples.length && attempt.stats.totalClicks > 0) {
    checks.push({
      id: "legacy-evidence",
      title: "Legacy aggregate only",
      message:
        "This saved run predates per-click evidence. Its aggregate score is preserved, but CSV and timing validation are unavailable.",
      severity: "warning",
    });
  } else if (attempt.stats.totalClicks === attempt.samples.length) {
    checks.push({
      id: "evidence-complete",
      title: "Click evidence is complete",
      message: `All ${attempt.samples.length} counted clicks contain a relative timestamp and input source.`,
      severity: "pass",
    });
  }

  if (attempt.stats.totalClicks < 10) {
    checks.push({
      id: "sample-size",
      title: "Very small click sample",
      message:
        "Fewer than ten clicks produce an unstable CPS and consistency estimate. Run a longer sprint for comparison.",
      severity: "warning",
    });
  } else if (attempt.elapsedMs >= 5000) {
    checks.push({
      id: "sample-size",
      title: "Useful sprint duration",
      message: `${formatNumber(attempt.elapsedMs / 1000, 1)} seconds and ${attempt.stats.totalClicks} clicks provide a useful browser comparison.`,
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

  if (analysis.suspiciousFastGaps > 0) {
    checks.push({
      id: "fast-gaps",
      title: "Extremely short click gaps",
      message: `${analysis.suspiciousFastGaps} gap${analysis.suspiciousFastGaps === 1 ? " is" : "s are"} below 8 ms. Treat the result as an input-event diagnostic rather than a reliable human-speed comparison.`,
      severity: "warning",
    });
  } else if (attempt.samples.length > 1) {
    checks.push({
      id: "fast-gaps",
      title: "No extreme event bursts",
      message:
        "No recorded click gap is below the conservative 8 ms event-quality flag.",
      severity: "pass",
    });
  }

  if (analysis.interruptedGaps > 0) {
    checks.push({
      id: "interruptions",
      title: "Possible interrupted rhythm",
      message: `${analysis.interruptedGaps} gap${analysis.interruptedGaps === 1 ? " is" : "s are"} above 1.5 seconds and may include a pause, distraction, or pointer leaving the target.`,
      severity: "warning",
    });
  }

  if (attempt.stats.inputMethod === "Mixed") {
    checks.push({
      id: "input-method",
      title: "Mixed input methods",
      message:
        "Mouse, touch, and pen paths can have different event timing. Use one method when comparing runs.",
      severity: "warning",
    });
  } else if (attempt.stats.inputMethod === "None") {
    checks.push({
      id: "input-method",
      title: "Input evidence unavailable",
      message:
        "This legacy result does not include the pointer source used for each click.",
      severity: "info",
    });
  } else {
    checks.push({
      id: "input-method",
      title: "Consistent input path",
      message: `All recorded clicks use ${attempt.stats.inputMethod.toLowerCase()} input.`,
      severity: "pass",
    });
  }

  if (attempt.stats.totalClicks >= 5 && attempt.stats.consistencyScore < 36) {
    checks.push({
      id: "consistency",
      title: "Highly variable rhythm",
      message: `Consistency is ${attempt.stats.consistencyScore}%. Repeat the sprint with the same device, posture, and grip.`,
      severity: "warning",
    });
  } else if (attempt.stats.totalClicks >= 5) {
    checks.push({
      id: "consistency",
      title: "Rhythm consistency measured",
      message: `${attempt.stats.consistencyScore}% consistency is classified as ${consistencyLabel(attempt.stats.consistencyScore).toLowerCase()}.`,
      severity: "pass",
    });
  }

  checks.push({
    id: "device-effects",
    title: "Device and browser effects",
    message:
      "Mouse debounce, touch sampling, browser scheduling, operating-system settings, and display refresh can change CPS results.",
    severity: "info",
  });
  checks.push({
    id: "not-certified",
    title: "Entertainment measurement",
    message:
      "This browser challenge is not a certified hardware benchmark, accessibility assessment, or medical test.",
    severity: "info",
  });
  checks.push({
    id: "local-only",
    title: "Local processing",
    message:
      "Click timings and history stay in this browser unless you explicitly download a backup.",
    severity: "pass",
  });

  return checks;
}

export function buildClickSummaryCards(
  attempt: ClickAttempt | null,
): ClickSummaryCard[] {
  const analysis = analyzeClickAttempt(attempt);
  return [
    {
      label: "Click speed",
      value: attempt
        ? `${formatNumber(attempt.stats.clicksPerSecond, 2)} CPS`
        : "—",
      detail: attempt
        ? `${attempt.stats.totalClicks} clicks over ${formatNumber(attempt.elapsedMs / 1000, 1)} seconds`
        : "Complete a sprint to calculate CPS.",
    },
    {
      label: "Median gap",
      value: attempt?.samples.length
        ? `${formatNumber(analysis.medianGapMs)} ms`
        : "—",
      detail: "Middle interval between consecutive recorded clicks.",
    },
    {
      label: "Confidence",
      value: analysis.confidence,
      detail: attempt
        ? `${attempt.stats.consistencyScore}% consistency · ${analysis.suspiciousFastGaps} extreme gaps`
        : "Complete a run to evaluate comparison quality.",
    },
    {
      label: "Input path",
      value: attempt?.stats.inputMethod ?? "None",
      detail: attempt
        ? `${modeLabel(attempt.mode)} · ${scoreLabel(attempt.stats.clicksPerSecond)}`
        : "Keep one pointer method for fair comparisons.",
    },
  ];
}

export function clickBackupJson(backup: ClickBackupFile) {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function clickAttemptCsv(attempt: ClickAttempt) {
  const rows: Array<Array<string | number>> = [
    ["click_number", "time_ms", "gap_ms", "input_source"],
  ];
  attempt.samples.forEach((sample, index) => {
    const previous = attempt.samples[index - 1];
    rows.push([
      index + 1,
      Math.round(sample.time),
      previous ? Math.round(sample.time - previous.time) : "",
      sample.source,
    ]);
  });
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export function clickAttemptMarkdown(attempt: ClickAttempt) {
  const analysis = analyzeClickAttempt(attempt);
  const checks = buildClickAudit(attempt);
  const checkLines = checks.map(
    (check) =>
      `- **${check.severity.toUpperCase()} — ${check.title}:** ${check.message}`,
  );
  const sampleRows = attempt.samples.map((sample, index) => {
    const previous = attempt.samples[index - 1];
    const gap = previous ? Math.round(sample.time - previous.time) : "—";
    return `| ${index + 1} | ${Math.round(sample.time)} | ${gap} | ${sample.source} |`;
  });

  return [
    "# Click Speed Test report",
    "",
    `- Created: ${attempt.createdAt}`,
    `- Mode: ${modeLabel(attempt.mode)}`,
    `- Duration: ${formatNumber(attempt.elapsedMs / 1000, 2)} seconds`,
    `- Total clicks: ${attempt.stats.totalClicks}`,
    `- Click speed: ${formatNumber(attempt.stats.clicksPerSecond, 2)} CPS`,
    `- Best one-second burst: ${attempt.stats.bestBurst}`,
    `- Average gap: ${formatNumber(attempt.stats.averageGapMs)} ms`,
    `- Median gap: ${formatNumber(analysis.medianGapMs)} ms`,
    `- Fastest gap: ${formatNumber(attempt.stats.fastestGapMs)} ms`,
    `- Gap spread: ${formatNumber(analysis.spreadGapMs)} ms`,
    `- Consistency: ${attempt.stats.consistencyScore}%`,
    `- Input: ${attempt.stats.inputMethod}`,
    `- Result label: ${scoreLabel(attempt.stats.clicksPerSecond)}`,
    `- Comparison confidence: ${analysis.confidence}`,
    "",
    "## Production checks",
    "",
    ...checkLines,
    "",
    "## Per-click evidence",
    "",
    "| Click | Time from start (ms) | Gap (ms) | Input |",
    "| ---: | ---: | ---: | --- |",
    ...sampleRows,
    "",
    "> Browser CPS includes device and software effects. Use this report for entertainment and same-device comparisons, not certified hardware or medical assessment.",
    "",
  ].join("\n");
}

export function clickPackReadme(attempt: ClickAttempt) {
  return [
    "# Darma Click Speed production pack",
    "",
    "Files:",
    "- `click-session.json`: settings and local attempt backup for re-import.",
    "- `click-report.md`: human-readable result and production audit.",
    "- `click-events.csv`: per-click relative timings and pointer sources.",
    "- `README.md`: this handoff note.",
    "",
    `Latest run: ${modeLabel(attempt.mode)}, ${formatNumber(attempt.stats.clicksPerSecond, 2)} CPS, ${attempt.stats.totalClicks} clicks, ${attempt.stats.inputMethod} input.`,
    "",
    "Keep comparisons on the same device, browser, input method, and timer mode. This browser challenge is not a certified hardware or medical assessment.",
    "",
  ].join("\n");
}

export async function createClickProductionPack(
  backup: ClickBackupFile,
  attempt: ClickAttempt,
) {
  const zip = new JSZip();
  zip.file("click-session.json", clickBackupJson(backup));
  zip.file("click-report.md", clickAttemptMarkdown(attempt));
  zip.file("click-events.csv", clickAttemptCsv(attempt));
  zip.file("README.md", clickPackReadme(attempt));
  return zip.generateAsync({ type: "uint8array" });
}
