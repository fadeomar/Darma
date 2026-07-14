import JSZip from "jszip";
import {
  REACTION_DELAY_PROFILES,
  calculateReactionStats,
  consistencyLabel,
  formatNumber,
  modeLabel,
  scoreLabel,
} from "./reactionMetrics";
import type {
  ReactionAttempt,
  ReactionDelayProfile,
  ReactionInputMethod,
  ReactionSample,
  ReactionSampleSource,
  ReactionTestMode,
} from "./types";

export type ReactionAuditSeverity = "error" | "warning" | "info" | "pass";

export type ReactionAuditCheck = {
  id: string;
  title: string;
  message: string;
  severity: ReactionAuditSeverity;
};

export type ReactionSummaryCard = {
  label: string;
  value: string;
  detail: string;
};

export type ReactionSessionSettings = {
  mode: ReactionTestMode;
  delayProfile: ReactionDelayProfile;
};

export type ReactionBackupFile = {
  schema: "darma.reaction-time-session";
  version: 1;
  exportedAt: string;
  settings: ReactionSessionSettings;
  attempts: ReactionAttempt[];
  note: string;
};

export type ReactionAttemptAnalysis = {
  medianReactionMs: number;
  spreadReactionMs: number;
  suspiciousFastRounds: number;
  interruptedRounds: number;
  confidence: "No result" | "Low" | "Moderate" | "Strong";
};

export const REACTION_IMPORT_MAX_BYTES = 1024 * 1024;
export const REACTION_HISTORY_LIMIT = 10;

const PROJECT_NOTE =
  "This local backup contains reaction-test settings and recorded round timings. It does not contain account data, network identifiers, or browser fingerprints.";

const MODES = new Set<ReactionTestMode>([1, 3, 5, 10]);
const DELAY_PROFILES = new Set<ReactionDelayProfile>([
  "quick",
  "standard",
  "focus",
]);
const SOURCES = new Set<ReactionSampleSource>([
  "keyboard",
  "mouse",
  "touch",
  "pen",
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
  fallback: ReactionTestMode = 5,
): ReactionTestMode {
  return typeof value === "number" && MODES.has(value as ReactionTestMode)
    ? (value as ReactionTestMode)
    : fallback;
}

function normalizeDelayProfile(
  value: unknown,
  fallback: ReactionDelayProfile = "standard",
): ReactionDelayProfile {
  return typeof value === "string" &&
    DELAY_PROFILES.has(value as ReactionDelayProfile)
    ? (value as ReactionDelayProfile)
    : fallback;
}

function normalizeSource(value: unknown): ReactionSampleSource | null {
  return typeof value === "string" && SOURCES.has(value as ReactionSampleSource)
    ? (value as ReactionSampleSource)
    : null;
}

const INPUT_METHODS = new Set<ReactionInputMethod>([
  "Keyboard",
  "Mouse",
  "Touch",
  "Pen",
  "Mixed",
  "None",
]);

function normalizeInputMethod(value: unknown): ReactionInputMethod {
  return typeof value === "string" &&
    INPUT_METHODS.has(value as ReactionInputMethod)
    ? (value as ReactionInputMethod)
    : "None";
}

function normalizeSample(
  value: unknown,
  expectedRound: number,
): ReactionSample | null {
  if (!isRecord(value)) return null;
  const source = normalizeSource(value.source);
  if (!source) return null;

  if (
    typeof value.reactionMs !== "number" ||
    !Number.isFinite(value.reactionMs) ||
    value.reactionMs <= 0
  ) {
    return null;
  }
  const reactionMs = Math.min(10_000, value.reactionMs);

  return {
    round: Math.max(
      1,
      Math.floor(finiteNumber(value.round, expectedRound, 1, 100)),
    ),
    reactionMs,
    source,
    waitMs: Math.round(finiteNumber(value.waitMs, 0, 0, 30_000)),
  };
}

function normalizeCreatedAt(value: unknown) {
  if (typeof value !== "string") return new Date(0).toISOString();
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString()
    : new Date(0).toISOString();
}

function normalizeFalseStarts(value: unknown) {
  return Math.floor(finiteNumber(value, 0, 0, 100));
}

export function normalizeReactionAttempt(
  value: unknown,
): ReactionAttempt | null {
  if (!isRecord(value) || typeof value.id !== "string" || !value.id.trim())
    return null;
  const mode = normalizeMode(value.mode);
  const delayProfile = normalizeDelayProfile(value.delayProfile);
  const rawSamples = Array.isArray(value.samples) ? value.samples : [];
  const samples = rawSamples
    .slice(0, mode)
    .map((sample, index) => normalizeSample(sample, index + 1))
    .filter((sample): sample is ReactionSample => Boolean(sample))
    .map((sample, index) => ({ ...sample, round: index + 1 }));

  const rawStats = isRecord(value.stats) ? value.stats : {};
  const falseStarts = normalizeFalseStarts(rawStats.falseStarts);
  const calculated = calculateReactionStats(samples, mode, falseStarts);
  const legacyAverage = finiteNumber(rawStats.averageReactionMs, 0, 0, 10_000);
  const legacyBest = finiteNumber(rawStats.bestReactionMs, 0, 0, 10_000);
  const legacySlowest = finiteNumber(rawStats.slowestReactionMs, 0, 0, 10_000);
  const legacyStats = {
    roundsCompleted: Math.floor(
      finiteNumber(rawStats.roundsCompleted, 0, 0, mode),
    ),
    totalRounds: mode,
    averageReactionMs: Math.round(legacyAverage),
    medianReactionMs: Math.round(
      finiteNumber(rawStats.medianReactionMs, legacyAverage, 0, 10_000),
    ),
    bestReactionMs: Math.round(legacyBest),
    slowestReactionMs: Math.round(legacySlowest),
    spreadReactionMs: Math.round(
      finiteNumber(
        rawStats.spreadReactionMs,
        Math.max(0, legacySlowest - legacyBest),
        0,
        10_000,
      ),
    ),
    consistencyScore: Math.round(
      finiteNumber(rawStats.consistencyScore, 0, 0, 100),
    ),
    falseStarts,
    inputMethod: normalizeInputMethod(rawStats.inputMethod),
  };

  return {
    id: cleanString(value.id, "reaction-attempt"),
    createdAt: normalizeCreatedAt(value.createdAt),
    mode,
    delayProfile,
    samples,
    stats: samples.length ? calculated : legacyStats,
  };
}

export function createReactionAttempt({
  id,
  createdAt,
  mode,
  delayProfile,
  samples,
  falseStarts,
}: {
  id: string;
  createdAt: string;
  mode: ReactionTestMode;
  delayProfile: ReactionDelayProfile;
  samples: ReactionSample[];
  falseStarts: number;
}): ReactionAttempt {
  const normalized = normalizeReactionAttempt({
    id,
    createdAt,
    mode,
    delayProfile,
    samples,
    stats: { falseStarts },
  });
  if (!normalized)
    throw new Error("Unable to create a valid reaction attempt.");
  return normalized;
}

export function normalizeReactionSettings(
  value: unknown,
): ReactionSessionSettings {
  const source = isRecord(value) ? value : {};
  return {
    mode: normalizeMode(source.mode),
    delayProfile: normalizeDelayProfile(source.delayProfile),
  };
}

export function createReactionBackup(
  settings: ReactionSessionSettings,
  attempts: ReactionAttempt[],
  exportedAt = new Date().toISOString(),
): ReactionBackupFile {
  const normalizedAttempts = attempts
    .map(normalizeReactionAttempt)
    .filter((attempt): attempt is ReactionAttempt => Boolean(attempt))
    .slice(0, REACTION_HISTORY_LIMIT);

  return {
    schema: "darma.reaction-time-session",
    version: 1,
    exportedAt,
    settings: normalizeReactionSettings(settings),
    attempts: normalizedAttempts,
    note: PROJECT_NOTE,
  };
}

export function parseReactionBackup(input: string): ReactionBackupFile {
  if (new TextEncoder().encode(input).byteLength > REACTION_IMPORT_MAX_BYTES) {
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
  if (parsed.schema !== "darma.reaction-time-session") {
    throw new Error("This is not a Darma Reaction Time backup.");
  }
  if (parsed.version !== 1) {
    throw new Error("This Reaction Time backup version is not supported.");
  }
  if (!Array.isArray(parsed.attempts)) {
    throw new Error("The backup does not contain a valid attempts array.");
  }

  const attempts = parsed.attempts
    .slice(0, REACTION_HISTORY_LIMIT)
    .map(normalizeReactionAttempt)
    .filter((attempt): attempt is ReactionAttempt => Boolean(attempt));
  const ids = new Set<string>();
  for (const attempt of attempts) {
    if (ids.has(attempt.id))
      throw new Error("The backup contains duplicate attempt IDs.");
    ids.add(attempt.id);
  }

  return {
    schema: "darma.reaction-time-session",
    version: 1,
    exportedAt: normalizeCreatedAt(parsed.exportedAt),
    settings: normalizeReactionSettings(parsed.settings),
    attempts,
    note: PROJECT_NOTE,
  };
}

function countSuspiciousFastRounds(attempt: ReactionAttempt) {
  return attempt.samples.filter((sample) => sample.reactionMs < 100).length;
}

function countInterruptedRounds(attempt: ReactionAttempt) {
  return attempt.samples.filter((sample) => sample.reactionMs > 1500).length;
}

export function analyzeReactionAttempt(
  attempt: ReactionAttempt | null,
): ReactionAttemptAnalysis {
  if (!attempt) {
    return {
      medianReactionMs: 0,
      spreadReactionMs: 0,
      suspiciousFastRounds: 0,
      interruptedRounds: 0,
      confidence: "No result",
    };
  }

  const suspiciousFastRounds = countSuspiciousFastRounds(attempt);
  const interruptedRounds = countInterruptedRounds(attempt);
  let confidence: ReactionAttemptAnalysis["confidence"] = "Low";

  if (
    attempt.stats.roundsCompleted >= 5 &&
    attempt.stats.consistencyScore >= 68 &&
    attempt.stats.falseStarts === 0 &&
    suspiciousFastRounds === 0 &&
    interruptedRounds === 0 &&
    attempt.stats.inputMethod !== "Mixed"
  ) {
    confidence = "Strong";
  } else if (
    attempt.stats.roundsCompleted >= 3 &&
    suspiciousFastRounds === 0 &&
    interruptedRounds === 0
  ) {
    confidence = "Moderate";
  }

  return {
    medianReactionMs: attempt.stats.medianReactionMs,
    spreadReactionMs: attempt.stats.spreadReactionMs,
    suspiciousFastRounds,
    interruptedRounds,
    confidence,
  };
}

export function buildReactionAudit(
  attempt: ReactionAttempt | null,
): ReactionAuditCheck[] {
  if (!attempt) {
    return [
      {
        id: "run-missing",
        title: "Complete a run",
        message:
          "Finish at least one reaction test before exporting a production report.",
        severity: "error",
      },
      {
        id: "local-only",
        title: "Local processing",
        message:
          "Timing and history stay in this browser unless you explicitly download a backup.",
        severity: "pass",
      },
    ];
  }

  const analysis = analyzeReactionAttempt(attempt);
  const checks: ReactionAuditCheck[] = [];

  if (!attempt.samples.length && attempt.stats.roundsCompleted > 0) {
    checks.push({
      id: "legacy-evidence",
      title: "Legacy aggregate only",
      message:
        "This saved run predates round-level evidence. Its aggregate score is preserved, but CSV and per-round validation are unavailable.",
      severity: "warning",
    });
  } else {
    checks.push(
      attempt.stats.roundsCompleted === attempt.mode
        ? {
            id: "rounds-complete",
            title: "Run is complete",
            message: `All ${attempt.mode} configured rounds contain a valid timing sample.`,
            severity: "pass",
          }
        : {
            id: "rounds-incomplete",
            title: "Run is incomplete",
            message: `${attempt.stats.roundsCompleted} of ${attempt.mode} rounds contain valid timing samples.`,
            severity: "error",
          },
    );
  }

  if (attempt.mode === 1) {
    checks.push({
      id: "single-round",
      title: "Single-round result",
      message:
        "One reaction can be lucky or delayed. Use at least 5 rounds for a more stable comparison.",
      severity: "warning",
    });
  } else if (attempt.mode >= 5) {
    checks.push({
      id: "sample-size",
      title: "Useful sample size",
      message: `${attempt.mode} rounds provide a more useful comparison than a single reaction.`,
      severity: "pass",
    });
  } else {
    checks.push({
      id: "sample-size",
      title: "Short sample",
      message:
        "Three rounds are useful for practice, but five or ten rounds produce a stronger comparison.",
      severity: "info",
    });
  }

  if (analysis.suspiciousFastRounds > 0) {
    checks.push({
      id: "anticipation",
      title: "Possible anticipation",
      message: `${analysis.suspiciousFastRounds} round${analysis.suspiciousFastRounds === 1 ? " is" : "s are"} below 100 ms. Treat the run as practice rather than a reliable comparison.`,
      severity: "warning",
    });
  } else {
    checks.push({
      id: "anticipation",
      title: "No extreme early timings",
      message:
        "No valid round is below the conservative 100 ms anticipation flag.",
      severity: "pass",
    });
  }

  if (analysis.interruptedRounds > 0) {
    checks.push({
      id: "interruption",
      title: "Possible interrupted round",
      message: `${analysis.interruptedRounds} round${analysis.interruptedRounds === 1 ? " is" : "s are"} above 1,500 ms and may include distraction or tab interruption.`,
      severity: "warning",
    });
  }

  if (attempt.stats.falseStarts > 0) {
    checks.push({
      id: "false-starts",
      title: "False starts recorded",
      message: `${attempt.stats.falseStarts} early input${attempt.stats.falseStarts === 1 ? " was" : "s were"} detected. The early inputs were not included as fast reaction samples.`,
      severity: attempt.stats.falseStarts >= attempt.mode ? "warning" : "info",
    });
  } else {
    checks.push({
      id: "false-starts",
      title: "No false starts",
      message: "The run contains no input before the visual signal.",
      severity: "pass",
    });
  }

  if (attempt.stats.inputMethod === "Mixed") {
    checks.push({
      id: "input-method",
      title: "Mixed input methods",
      message:
        "Keyboard, mouse, touch, and pen paths can have different latency. Use one method when comparing runs.",
      severity: "warning",
    });
  } else if (attempt.stats.inputMethod === "None") {
    checks.push({
      id: "input-method",
      title: "Input evidence unavailable",
      message:
        "This legacy result does not include the input path used for each round.",
      severity: "info",
    });
  } else {
    checks.push({
      id: "input-method",
      title: "Consistent input path",
      message: `All recorded rounds use ${attempt.stats.inputMethod.toLowerCase()} input.`,
      severity: "pass",
    });
  }

  if (
    attempt.stats.roundsCompleted >= 3 &&
    attempt.stats.consistencyScore < 42
  ) {
    checks.push({
      id: "consistency",
      title: "High round variation",
      message: `Consistency is ${attempt.stats.consistencyScore}%. Repeat the run while keeping the same posture, device, and input method.`,
      severity: "warning",
    });
  } else if (attempt.stats.roundsCompleted >= 3) {
    checks.push({
      id: "consistency",
      title: "Round consistency measured",
      message: `${attempt.stats.consistencyScore}% consistency is classified as ${consistencyLabel(attempt.stats.consistencyScore).toLowerCase()}.`,
      severity: "pass",
    });
  }

  checks.push({
    id: "device-latency",
    title: "Device latency applies",
    message:
      "Display refresh, browser scheduling, keyboard polling, pointer hardware, and operating-system load affect browser reaction scores.",
    severity: "info",
  });
  checks.push({
    id: "not-medical",
    title: "Entertainment measurement",
    message:
      "This browser challenge is not a medical, neurological, or laboratory assessment.",
    severity: "info",
  });
  checks.push({
    id: "local-only",
    title: "Local processing",
    message:
      "Timing and history stay in this browser unless you explicitly download a backup.",
    severity: "pass",
  });

  return checks;
}

export function buildReactionSummaryCards(
  attempt: ReactionAttempt | null,
): ReactionSummaryCard[] {
  const analysis = analyzeReactionAttempt(attempt);
  return [
    {
      label: "Median",
      value: attempt ? `${formatNumber(analysis.medianReactionMs)} ms` : "—",
      detail: "Middle round, less sensitive to one slow interruption.",
    },
    {
      label: "Spread",
      value: attempt ? `${formatNumber(analysis.spreadReactionMs)} ms` : "—",
      detail: "Difference between the fastest and slowest valid rounds.",
    },
    {
      label: "Confidence",
      value: analysis.confidence,
      detail: attempt
        ? `${attempt.stats.roundsCompleted} rounds · ${attempt.stats.consistencyScore}% consistency`
        : "Complete a run to evaluate result quality.",
    },
    {
      label: "Input path",
      value: attempt?.stats.inputMethod ?? "None",
      detail: attempt
        ? `${REACTION_DELAY_PROFILES[attempt.delayProfile].label} · ${modeLabel(attempt.mode)}`
        : "Keep one input method for fair comparisons.",
    },
  ];
}

export function reactionBackupJson(backup: ReactionBackupFile) {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function reactionAttemptCsv(attempt: ReactionAttempt) {
  const rows = [
    ["round", "reaction_ms", "wait_ms", "input_source"],
    ...attempt.samples.map((sample) => [
      sample.round,
      Math.round(sample.reactionMs),
      sample.waitMs,
      sample.source,
    ]),
  ];
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export function reactionAttemptMarkdown(attempt: ReactionAttempt) {
  const analysis = analyzeReactionAttempt(attempt);
  const checks = buildReactionAudit(attempt);
  const checkLines = checks.map(
    (check) =>
      `- **${check.severity.toUpperCase()} — ${check.title}:** ${check.message}`,
  );
  const sampleRows = attempt.samples.map(
    (sample) =>
      `| ${sample.round} | ${Math.round(sample.reactionMs)} | ${sample.waitMs} | ${sample.source} |`,
  );

  return [
    "# Reaction Time Test report",
    "",
    `- Created: ${attempt.createdAt}`,
    `- Mode: ${modeLabel(attempt.mode)}`,
    `- Delay profile: ${REACTION_DELAY_PROFILES[attempt.delayProfile].label}`,
    `- Average: ${formatNumber(attempt.stats.averageReactionMs)} ms`,
    `- Median: ${formatNumber(attempt.stats.medianReactionMs)} ms`,
    `- Best: ${formatNumber(attempt.stats.bestReactionMs)} ms`,
    `- Slowest: ${formatNumber(attempt.stats.slowestReactionMs)} ms`,
    `- Spread: ${formatNumber(attempt.stats.spreadReactionMs)} ms`,
    `- Consistency: ${attempt.stats.consistencyScore}%`,
    `- False starts: ${attempt.stats.falseStarts}`,
    `- Input: ${attempt.stats.inputMethod}`,
    `- Result label: ${scoreLabel(attempt.stats.averageReactionMs)}`,
    `- Comparison confidence: ${analysis.confidence}`,
    "",
    "## Production checks",
    "",
    ...checkLines,
    "",
    "## Round evidence",
    "",
    "| Round | Reaction (ms) | Wait (ms) | Input |",
    "| ---: | ---: | ---: | --- |",
    ...sampleRows,
    "",
    "> Browser reaction timings include device and software latency. Use this report for entertainment and same-device comparisons, not medical assessment.",
    "",
  ].join("\n");
}

export function reactionPackReadme(attempt: ReactionAttempt) {
  return [
    "# Darma Reaction Time production pack",
    "",
    "Files:",
    "- `reaction-session.json`: settings and local attempt backup for re-import.",
    "- `reaction-report.md`: human-readable result and production audit.",
    "- `reaction-rounds.csv`: per-round reaction and wait timings.",
    "- `README.md`: this handoff note.",
    "",
    `Latest run: ${modeLabel(attempt.mode)}, ${formatNumber(attempt.stats.averageReactionMs)} ms average, ${attempt.stats.inputMethod} input.`,
    "",
    "Keep comparisons on the same device, browser, display, and input method. This browser challenge is not a medical or laboratory assessment.",
    "",
  ].join("\n");
}

export async function createReactionProductionPack(
  backup: ReactionBackupFile,
  attempt: ReactionAttempt,
) {
  const zip = new JSZip();
  zip.file("reaction-session.json", reactionBackupJson(backup));
  zip.file("reaction-report.md", reactionAttemptMarkdown(attempt));
  zip.file("reaction-rounds.csv", reactionAttemptCsv(attempt));
  zip.file("README.md", reactionPackReadme(attempt));
  return zip.generateAsync({ type: "uint8array" });
}
