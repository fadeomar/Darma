import JSZip from "jszip";
import {
  calculateSpacebarStats,
  spacebarGaps,
  consistencyLabel,
  formatNumber,
  modeLabel,
  scoreLabel,
} from "./spacebarMetrics";
import type {
  SpacebarAttempt,
  SpacebarInputMethod,
  SpacebarSample,
  SpacebarSampleSource,
  SpacebarStats,
  SpacebarTestMode,
} from "./types";

export type SpacebarAuditSeverity = "error" | "warning" | "info" | "pass";

export type SpacebarAuditCheck = {
  id: string;
  title: string;
  message: string;
  severity: SpacebarAuditSeverity;
};

export type SpacebarSummaryCard = {
  label: string;
  value: string;
  detail: string;
};

export type SpacebarSessionSettings = {
  mode: SpacebarTestMode;
};

export type SpacebarBackupFile = {
  schema: "darma.spacebar-counter-session";
  version: 1;
  exportedAt: string;
  settings: SpacebarSessionSettings;
  attempts: SpacebarAttempt[];
  note: string;
};

export type SpacebarAttemptAnalysis = {
  medianGapMs: number;
  spreadGapMs: number;
  suspiciousFastGaps: number;
  interruptedGaps: number;
  confidence: "No result" | "Low" | "Moderate" | "Strong";
};

export const SPACEBAR_IMPORT_MAX_BYTES = 1024 * 1024;
export const SPACEBAR_HISTORY_LIMIT = 10;
export const SPACEBAR_SAMPLE_LIMIT = 120_000;

const PROJECT_NOTE =
  "This local backup contains spacebar-counter settings and recorded relative press timings. It does not contain account data, network identifiers, or browser fingerprints.";

const MODES = new Set<SpacebarTestMode>([5, 10, 30, 60, "manual"]);
const SOURCES = new Set<SpacebarSampleSource>(["keyboard", "touch", "mouse"]);
const INPUT_METHODS = new Set<SpacebarInputMethod>([
  "Keyboard",
  "Touch",
  "Mouse",
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
  fallback: SpacebarTestMode = 10,
): SpacebarTestMode {
  return (typeof value === "number" || value === "manual") &&
    MODES.has(value as SpacebarTestMode)
    ? (value as SpacebarTestMode)
    : fallback;
}

function normalizeSource(value: unknown): SpacebarSampleSource | null {
  return typeof value === "string" && SOURCES.has(value as SpacebarSampleSource)
    ? (value as SpacebarSampleSource)
    : null;
}

function normalizeInputMethod(value: unknown): SpacebarInputMethod {
  return typeof value === "string" &&
    INPUT_METHODS.has(value as SpacebarInputMethod)
    ? (value as SpacebarInputMethod)
    : "None";
}

function normalizeCreatedAt(value: unknown) {
  if (typeof value !== "string") return new Date(0).toISOString();
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString()
    : new Date(0).toISOString();
}

function normalizeStats(value: unknown): SpacebarStats {
  const source = isRecord(value) ? value : {};
  return {
    totalPresses: Math.floor(
      finiteNumber(source.totalPresses, 0, 0, SPACEBAR_SAMPLE_LIMIT),
    ),
    elapsedSeconds: finiteNumber(source.elapsedSeconds, 0, 0, 86_400),
    pressesPerSecond: finiteNumber(source.pressesPerSecond, 0, 0, 1000),
    bestBurst: Math.floor(finiteNumber(source.bestBurst, 0, 0, 1000)),
    averageGapMs: finiteNumber(source.averageGapMs, 0, 0, 86_400_000),
    fastestGapMs: finiteNumber(source.fastestGapMs, 0, 0, 86_400_000),
    consistencyScore: Math.round(
      finiteNumber(source.consistencyScore, 0, 0, 100),
    ),
    ignoredRepeats: Math.floor(
      finiteNumber(source.ignoredRepeats, 0, 0, SPACEBAR_SAMPLE_LIMIT),
    ),
    inputMethod: normalizeInputMethod(source.inputMethod),
  };
}

function normalizeSamples(
  value: unknown,
  mode: SpacebarTestMode,
  elapsedMs: number,
) {
  if (!Array.isArray(value)) return [];
  const maxTime =
    typeof mode === "number"
      ? Math.min(elapsedMs + 250, mode * 1000 + 250)
      : Math.min(elapsedMs + 250, 86_400_000);
  const normalized: SpacebarSample[] = [];
  let previousTime = -1;

  for (const item of value.slice(0, SPACEBAR_SAMPLE_LIMIT)) {
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

export function normalizeSpacebarAttempt(
  value: unknown,
): SpacebarAttempt | null {
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
  const ignoredRepeats = Math.floor(
    finiteNumber(
      value.ignoredRepeats,
      rawStats.ignoredRepeats,
      0,
      SPACEBAR_SAMPLE_LIMIT,
    ),
  );
  const stats = samples.length
    ? calculateSpacebarStats(samples, elapsedMs, ignoredRepeats)
    : { ...rawStats, ignoredRepeats };

  return {
    id: cleanString(value.id, "spacebar-attempt"),
    createdAt: normalizeCreatedAt(value.createdAt),
    mode,
    elapsedMs,
    stats,
    samples,
    ignoredRepeats,
  };
}

export function createSpacebarAttempt({
  id,
  createdAt,
  mode,
  elapsedMs,
  samples,
  ignoredRepeats = 0,
}: {
  id: string;
  createdAt: string;
  mode: SpacebarTestMode;
  elapsedMs: number;
  samples: SpacebarSample[];
  ignoredRepeats?: number;
}): SpacebarAttempt {
  const normalized = normalizeSpacebarAttempt({
    id,
    createdAt,
    mode,
    elapsedMs,
    samples,
    ignoredRepeats,
    stats: calculateSpacebarStats(samples, elapsedMs, ignoredRepeats),
  });
  if (!normalized) throw new Error("Unable to create a valid press attempt.");
  return normalized;
}

export function normalizeSpacebarSettings(
  value: unknown,
): SpacebarSessionSettings {
  const source = isRecord(value) ? value : {};
  return { mode: normalizeMode(source.mode) };
}

export function createSpacebarBackup(
  settings: SpacebarSessionSettings,
  attempts: SpacebarAttempt[],
  exportedAt = new Date().toISOString(),
): SpacebarBackupFile {
  const normalizedAttempts = attempts
    .map(normalizeSpacebarAttempt)
    .filter((attempt): attempt is SpacebarAttempt => Boolean(attempt))
    .slice(0, SPACEBAR_HISTORY_LIMIT);

  return {
    schema: "darma.spacebar-counter-session",
    version: 1,
    exportedAt,
    settings: normalizeSpacebarSettings(settings),
    attempts: normalizedAttempts,
    note: PROJECT_NOTE,
  };
}

export function parseSpacebarBackup(input: string): SpacebarBackupFile {
  if (new TextEncoder().encode(input).byteLength > SPACEBAR_IMPORT_MAX_BYTES) {
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
  if (parsed.schema !== "darma.spacebar-counter-session") {
    throw new Error("This is not a Darma Spacebar Counter backup.");
  }
  if (parsed.version !== 1) {
    throw new Error("This Spacebar Counter backup version is not supported.");
  }
  if (!Array.isArray(parsed.attempts)) {
    throw new Error("The backup does not contain a valid attempts array.");
  }

  const attempts = parsed.attempts
    .slice(0, SPACEBAR_HISTORY_LIMIT)
    .map(normalizeSpacebarAttempt)
    .filter((attempt): attempt is SpacebarAttempt => Boolean(attempt));
  const ids = new Set<string>();
  for (const attempt of attempts) {
    if (ids.has(attempt.id)) {
      throw new Error("The backup contains duplicate attempt IDs.");
    }
    ids.add(attempt.id);
  }

  return {
    schema: "darma.spacebar-counter-session",
    version: 1,
    exportedAt: normalizeCreatedAt(parsed.exportedAt),
    settings: normalizeSpacebarSettings(parsed.settings),
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

export function analyzeSpacebarAttempt(
  attempt: SpacebarAttempt | null,
): SpacebarAttemptAnalysis {
  if (!attempt) {
    return {
      medianGapMs: 0,
      spreadGapMs: 0,
      suspiciousFastGaps: 0,
      interruptedGaps: 0,
      confidence: "No result",
    };
  }

  const gaps = spacebarGaps(attempt.samples);
  const medianGapMs = median(gaps);
  const fastest = gaps.length ? Math.min(...gaps) : 0;
  const slowest = gaps.length ? Math.max(...gaps) : 0;
  const suspiciousFastGaps = gaps.filter((gap) => gap < 20).length;
  const interruptedGaps = gaps.filter((gap) => gap > 1500).length;
  let confidence: SpacebarAttemptAnalysis["confidence"] = "Low";

  const usefulDuration = attempt.elapsedMs >= 5000;
  if (
    usefulDuration &&
    attempt.stats.totalPresses >= 20 &&
    attempt.stats.consistencyScore >= 62 &&
    suspiciousFastGaps === 0 &&
    interruptedGaps === 0 &&
    attempt.stats.inputMethod !== "Mixed"
  ) {
    confidence = "Strong";
  } else if (
    usefulDuration &&
    attempt.stats.totalPresses >= 10 &&
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

export function buildSpacebarAudit(
  attempt: SpacebarAttempt | null,
): SpacebarAuditCheck[] {
  if (!attempt) {
    return [
      {
        id: "run-missing",
        title: "Complete a run",
        message:
          "Finish at least one press sprint before exporting a production report.",
        severity: "error",
      },
      {
        id: "local-only",
        title: "Local processing",
        message:
          "Press timings and history stay in this browser unless you explicitly download a backup.",
        severity: "pass",
      },
    ];
  }

  const analysis = analyzeSpacebarAttempt(attempt);
  const checks: SpacebarAuditCheck[] = [];

  if (!attempt.samples.length && attempt.stats.totalPresses > 0) {
    checks.push({
      id: "legacy-evidence",
      title: "Legacy aggregate only",
      message:
        "This saved run predates per-press evidence. Its aggregate score is preserved, but CSV and timing validation are unavailable.",
      severity: "warning",
    });
  } else if (attempt.stats.totalPresses === attempt.samples.length) {
    checks.push({
      id: "evidence-complete",
      title: "Press evidence is complete",
      message: `All ${attempt.samples.length} counted presses contain a relative timestamp and input source.`,
      severity: "pass",
    });
  }

  if (attempt.stats.totalPresses < 10) {
    checks.push({
      id: "sample-size",
      title: "Very small press sample",
      message:
        "Fewer than ten presses produce an unstable PPS and consistency estimate. Run a longer sprint for comparison.",
      severity: "warning",
    });
  } else if (attempt.elapsedMs >= 5000) {
    checks.push({
      id: "sample-size",
      title: "Useful sprint duration",
      message: `${formatNumber(attempt.elapsedMs / 1000, 1)} seconds and ${attempt.stats.totalPresses} presses provide a useful browser comparison.`,
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
      title: "Extremely short press gaps",
      message: `${analysis.suspiciousFastGaps} gap${analysis.suspiciousFastGaps === 1 ? " is" : "s are"} below 20 ms. Treat the result as an input-event diagnostic rather than a reliable human-speed comparison.`,
      severity: "warning",
    });
  } else if (attempt.samples.length > 1) {
    checks.push({
      id: "fast-gaps",
      title: "No extreme event bursts",
      message:
        "No recorded press gap is below the conservative 20 ms event-quality flag.",
      severity: "pass",
    });
  }

  if (analysis.interruptedGaps > 0) {
    checks.push({
      id: "interruptions",
      title: "Possible interrupted rhythm",
      message: `${analysis.interruptedGaps} gap${analysis.interruptedGaps === 1 ? " is" : "s are"} above 1.5 seconds and may include a pause, distraction, or the user pausing or leaving the arena.`,
      severity: "warning",
    });
  }

  if (attempt.stats.inputMethod === "Mixed") {
    checks.push({
      id: "input-method",
      title: "Mixed input methods",
      message:
        "Keyboard, touch, and mouse paths can have different event timing. Use one method when comparing runs.",
      severity: "warning",
    });
  } else if (attempt.stats.inputMethod === "None") {
    checks.push({
      id: "input-method",
      title: "Input evidence unavailable",
      message:
        "This legacy result does not include the input source used for each press.",
      severity: "info",
    });
  } else {
    checks.push({
      id: "input-method",
      title: "Consistent input path",
      message: `All recorded presses use ${attempt.stats.inputMethod.toLowerCase()} input.`,
      severity: "pass",
    });
  }

  if (attempt.stats.totalPresses >= 5 && attempt.stats.consistencyScore < 36) {
    checks.push({
      id: "consistency",
      title: "Highly variable rhythm",
      message: `Consistency is ${attempt.stats.consistencyScore}%. Repeat the sprint with the same device, posture, and grip.`,
      severity: "warning",
    });
  } else if (attempt.stats.totalPresses >= 5) {
    checks.push({
      id: "consistency",
      title: "Rhythm consistency measured",
      message: `${attempt.stats.consistencyScore}% consistency is classified as ${consistencyLabel(attempt.stats.consistencyScore).toLowerCase()}.`,
      severity: "pass",
    });
  }

  if (attempt.stats.ignoredRepeats > 0) {
    checks.push({
      id: "hold-repeats",
      title: "Held-key repeats ignored",
      message: `${attempt.stats.ignoredRepeats} repeated keydown event${attempt.stats.ignoredRepeats === 1 ? " was" : "s were"} excluded. Use separate taps for a fair keyboard result.`,
      severity:
        attempt.stats.ignoredRepeats > attempt.stats.totalPresses
          ? "warning"
          : "info",
    });
  } else if (
    attempt.stats.inputMethod === "Keyboard" &&
    attempt.stats.totalPresses > 0
  ) {
    checks.push({
      id: "hold-repeats",
      title: "No held-key repeats",
      message:
        "The browser did not report any auto-repeat keydown events during this run.",
      severity: "pass",
    });
  }

  checks.push({
    id: "device-effects",
    title: "Device and browser effects",
    message:
      "Keyboard firmware, key switch behavior, touch sampling, browser scheduling, operating-system settings, and display refresh can change PPS results.",
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
      "Press timings and history stay in this browser unless you explicitly download a backup.",
    severity: "pass",
  });

  return checks;
}

export function buildSpacebarSummaryCards(
  attempt: SpacebarAttempt | null,
): SpacebarSummaryCard[] {
  const analysis = analyzeSpacebarAttempt(attempt);
  return [
    {
      label: "Press speed",
      value: attempt
        ? `${formatNumber(attempt.stats.pressesPerSecond, 2)} PPS`
        : "—",
      detail: attempt
        ? `${attempt.stats.totalPresses} presses over ${formatNumber(attempt.elapsedMs / 1000, 1)} seconds`
        : "Complete a sprint to calculate PPS.",
    },
    {
      label: "Median gap",
      value: attempt?.samples.length
        ? `${formatNumber(analysis.medianGapMs)} ms`
        : "—",
      detail: "Middle interval between consecutive recorded presses.",
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
        ? `${modeLabel(attempt.mode)} · ${scoreLabel(attempt.stats.pressesPerSecond)}`
        : "Keep one input method for fair comparisons.",
    },
  ];
}

export function spacebarBackupJson(backup: SpacebarBackupFile) {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function spacebarAttemptCsv(attempt: SpacebarAttempt) {
  const rows: Array<Array<string | number>> = [
    ["press_number", "time_ms", "gap_ms", "input_source"],
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

export function spacebarAttemptMarkdown(attempt: SpacebarAttempt) {
  const analysis = analyzeSpacebarAttempt(attempt);
  const checks = buildSpacebarAudit(attempt);
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
    "# Spacebar Counter Test report",
    "",
    `- Created: ${attempt.createdAt}`,
    `- Mode: ${modeLabel(attempt.mode)}`,
    `- Duration: ${formatNumber(attempt.elapsedMs / 1000, 2)} seconds`,
    `- Total presses: ${attempt.stats.totalPresses}`,
    `- Press speed: ${formatNumber(attempt.stats.pressesPerSecond, 2)} PPS`,
    `- Best one-second burst: ${attempt.stats.bestBurst}`,
    `- Average gap: ${formatNumber(attempt.stats.averageGapMs)} ms`,
    `- Median gap: ${formatNumber(analysis.medianGapMs)} ms`,
    `- Fastest gap: ${formatNumber(attempt.stats.fastestGapMs)} ms`,
    `- Gap spread: ${formatNumber(analysis.spreadGapMs)} ms`,
    `- Consistency: ${attempt.stats.consistencyScore}%`,
    `- Input: ${attempt.stats.inputMethod}`,
    `- Ignored hold repeats: ${attempt.stats.ignoredRepeats}`,
    `- Result label: ${scoreLabel(attempt.stats.pressesPerSecond)}`,
    `- Comparison confidence: ${analysis.confidence}`,
    "",
    "## Production checks",
    "",
    ...checkLines,
    "",
    "## Per-press evidence",
    "",
    "| Press | Time from start (ms) | Gap (ms) | Input |",
    "| ---: | ---: | ---: | --- |",
    ...sampleRows,
    "",
    "> Browser PPS includes device and software effects. Use this report for entertainment and same-device comparisons, not certified hardware or medical assessment.",
    "",
  ].join("\n");
}

export function spacebarPackReadme(attempt: SpacebarAttempt) {
  return [
    "# Darma Spacebar Counter production pack",
    "",
    "Files:",
    "- `spacebar-session.json`: settings and local attempt backup for re-import.",
    "- `spacebar-report.md`: human-readable result and production audit.",
    "- `spacebar-presses.csv`: per-press relative timings and input sources.",
    "- `README.md`: this handoff note.",
    "",
    `Latest run: ${modeLabel(attempt.mode)}, ${formatNumber(attempt.stats.pressesPerSecond, 2)} PPS, ${attempt.stats.totalPresses} presses, ${attempt.stats.ignoredRepeats} repeats ignored, ${attempt.stats.inputMethod} input.`,
    "",
    "Keep comparisons on the same device, browser, input method, and timer mode. This browser challenge is not a certified hardware or medical assessment.",
    "",
  ].join("\n");
}

export async function createSpacebarProductionPack(
  backup: SpacebarBackupFile,
  attempt: SpacebarAttempt,
) {
  const zip = new JSZip();
  zip.file("spacebar-session.json", spacebarBackupJson(backup));
  zip.file("spacebar-report.md", spacebarAttemptMarkdown(attempt));
  zip.file("spacebar-presses.csv", spacebarAttemptCsv(attempt));
  zip.file("README.md", spacebarPackReadme(attempt));
  return zip.generateAsync({ type: "uint8array" });
}
