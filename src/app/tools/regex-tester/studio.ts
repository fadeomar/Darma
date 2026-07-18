import JSZip from "jszip";
import {
  assessRegexRisk,
  buildJavaScriptSnippet,
  buildProductionChecks,
  buildRegex,
  buildTypeScriptSnippet,
  calculateCoverage,
  findMatches,
  getPatternStats,
  normalizeFlags,
  REGEX_INPUT_LIMIT,
  REGEX_PATTERN_LIMIT,
  REGEX_REPLACEMENT_LIMIT,
  replaceMatches,
} from "./regex";
import type {
  RegexBuildError,
  RegexMatchResult,
  RegexProductionCheck,
  RegexRiskAssessment,
} from "./types";

export const REGEX_PROJECT_TOOL = "regex-tester";
export const REGEX_PROJECT_VERSION = 1;
export const REGEX_PROJECT_FILE_LIMIT = 1_000_000;

export type RegexProject = {
  tool: typeof REGEX_PROJECT_TOOL;
  version: typeof REGEX_PROJECT_VERSION;
  savedAt: string;
  pattern: string;
  flags: string;
  text: string;
  replacement: string;
};

export type RegexStudioState = Pick<RegexProject, "pattern" | "flags" | "text" | "replacement">;

export type RegexStudioMetrics = {
  valid: boolean;
  matches: number;
  captureGroups: number;
  namedGroups: number;
  coveragePercent: number;
  inputCharacters: number;
  inputLines: number;
  outputCharacters: number;
  riskLevel: RegexRiskAssessment["level"];
  executionBlocked: boolean;
  readinessScore: number;
  dangerChecks: number;
  warningChecks: number;
  infoChecks: number;
  passingChecks: number;
};

export type RegexStudioResult = {
  built: RegExp | RegexBuildError;
  risk: RegexRiskAssessment;
  executionBlocked: boolean;
  matches: RegexMatchResult[];
  output: string;
  checks: RegexProductionCheck[];
  metrics: RegexStudioMetrics;
};

const ALLOWED_FLAGS = new Set(["g", "i", "m", "s", "u", "y", "d"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, field: string, limit: number): string {
  if (typeof value !== "string") throw new Error(`${field} must be a string.`);
  const cleaned = value.replace(/\0/g, "");
  if (cleaned.length > limit) {
    throw new Error(`${field} exceeds the ${limit.toLocaleString()} character limit.`);
  }
  return cleaned;
}

function validateFlags(value: unknown): string {
  if (typeof value !== "string") throw new Error("flags must be a string.");
  const invalid = [...value].filter((flag) => !ALLOWED_FLAGS.has(flag));
  if (invalid.length) throw new Error(`Unsupported JavaScript regex flag: ${Array.from(new Set(invalid)).join(", ")}.`);
  const normalized = normalizeFlags(value);
  if (normalized.length !== value.length) throw new Error("Regex flags must not contain duplicates.");
  return normalized;
}

export function normalizeRegexProject(value: unknown): RegexProject {
  if (!isRecord(value)) throw new Error("Project must be a JSON object.");
  if (value.tool !== REGEX_PROJECT_TOOL) throw new Error(`Expected tool to be ${REGEX_PROJECT_TOOL}.`);
  if (value.version !== REGEX_PROJECT_VERSION) throw new Error(`Unsupported project version: ${String(value.version)}.`);

  return {
    tool: REGEX_PROJECT_TOOL,
    version: REGEX_PROJECT_VERSION,
    savedAt: typeof value.savedAt === "string" && !Number.isNaN(Date.parse(value.savedAt))
      ? value.savedAt
      : new Date().toISOString(),
    pattern: cleanText(value.pattern, "pattern", REGEX_PATTERN_LIMIT),
    flags: validateFlags(value.flags),
    text: cleanText(value.text, "text", REGEX_INPUT_LIMIT),
    replacement: cleanText(value.replacement, "replacement", REGEX_REPLACEMENT_LIMIT),
  };
}

export function parseRegexProjectJson(raw: string): RegexProject {
  if (!raw.trim()) throw new Error("Project file is empty.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Project file is not valid JSON.");
  }
  return normalizeRegexProject(parsed);
}

export function buildRegexProject(state: RegexStudioState, now = new Date()): RegexProject {
  return normalizeRegexProject({
    tool: REGEX_PROJECT_TOOL,
    version: REGEX_PROJECT_VERSION,
    savedAt: now.toISOString(),
    ...state,
  });
}

export function buildRegexProjectJson(state: RegexStudioState): string {
  return `${JSON.stringify(buildRegexProject(state), null, 2)}\n`;
}

export function shouldBlockRegexExecution(risk: RegexRiskAssessment, inputLength: number): boolean {
  if (inputLength > REGEX_INPUT_LIMIT) return true;
  if (risk.level === "high") return true;
  if (risk.level === "medium" && inputLength > 128) return true;
  return false;
}

function hasSensitiveSample(text: string): boolean {
  return [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
    /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*\S+/i,
    /\bsk-[A-Za-z0-9_-]{16,}\b/,
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
  ].some((pattern) => pattern.test(text));
}

function buildStudioChecks({
  state,
  built,
  risk,
  executionBlocked,
  matches,
}: {
  state: RegexStudioState;
  built: RegExp | RegexBuildError;
  risk: RegexRiskAssessment;
  executionBlocked: boolean;
  matches: RegexMatchResult[];
}): RegexProductionCheck[] {
  const checks = buildProductionChecks({
    ...state,
    built,
    matches,
    risk,
  });

  if (built instanceof RegExp && executionBlocked) {
    checks.push({
      id: "execution-guard",
      title: "Preview execution guard",
      message: risk.level === "high"
        ? "Preview execution is blocked because the pattern triggered multiple backtracking-risk heuristics. Review or simplify it before testing."
        : "Preview execution is paused because a risky pattern is being tested against more than 128 characters.",
      severity: "danger",
    });
  } else if (built instanceof RegExp) {
    checks.push({
      id: "execution-guard",
      title: "Preview execution guard",
      message: "The current pattern and sample are within the browser preview guardrails.",
      severity: "success",
    });
  }

  if (built instanceof RegExp && !executionBlocked && state.text && matches.length === 0) {
    checks.push({
      id: "sample-match",
      title: "Sample coverage",
      message: "The current sample produces no matches. Add at least one expected positive case before shipping the pattern.",
      severity: "warning",
    });
  } else if (matches.length > 0) {
    checks.push({
      id: "sample-match",
      title: "Sample coverage",
      message: `${matches.length.toLocaleString()} preview match${matches.length === 1 ? "" : "es"} provide a positive test case. Add negative and malformed cases in application tests too.`,
      severity: "success",
    });
  }

  if (!state.text.trim()) {
    checks.push({
      id: "sample-input",
      title: "Test sample",
      message: "Add representative positive, negative, empty, and malformed input before relying on the generated code.",
      severity: "warning",
    });
  } else if (hasSensitiveSample(state.text)) {
    checks.push({
      id: "sample-privacy",
      title: "Sensitive sample data",
      message: "The sample resembles a secret or credential. Replace it with synthetic data before exporting a project or production pack.",
      severity: "danger",
    });
  } else {
    checks.push({
      id: "sample-privacy",
      title: "Export privacy",
      message: "Project, report, CSV, and ZIP exports include the current sample and replacement output. Review them before sharing.",
      severity: "info",
    });
  }

  return checks;
}

function readinessScore(checks: RegexProductionCheck[]): number {
  const deductions = checks.reduce((total, check) => {
    if (check.severity === "danger") return total + 34;
    if (check.severity === "warning") return total + 11;
    if (check.severity === "info") return total + 2;
    return total;
  }, 0);
  return Math.max(0, Math.min(100, 100 - deductions));
}

export function analyzeRegexStudio(state: RegexStudioState): RegexStudioResult {
  const built = buildRegex(state.pattern, state.flags);
  const risk = assessRegexRisk(state.pattern);
  const executionBlocked = !(built instanceof RegExp) || shouldBlockRegexExecution(risk, state.text.length);
  const matches = built instanceof RegExp && !executionBlocked
    ? findMatches(state.pattern, state.flags, state.text)
    : [];
  const output = built instanceof RegExp && !executionBlocked
    ? replaceMatches(state.pattern, state.flags, state.text, state.replacement)
    : state.text;
  const checks = buildStudioChecks({ state, built, risk, executionBlocked, matches });
  const stats = getPatternStats(state.pattern);
  const count = (severity: RegexProductionCheck["severity"]) => checks.filter((check) => check.severity === severity).length;

  return {
    built,
    risk,
    executionBlocked,
    matches,
    output,
    checks,
    metrics: {
      valid: built instanceof RegExp,
      matches: matches.length,
      captureGroups: stats.captureGroups,
      namedGroups: stats.namedGroups.length,
      coveragePercent: Number(calculateCoverage(matches, state.text.length).toFixed(2)),
      inputCharacters: state.text.length,
      inputLines: state.text ? state.text.split(/\r\n|\r|\n/).length : 0,
      outputCharacters: output.length,
      riskLevel: risk.level,
      executionBlocked,
      readinessScore: readinessScore(checks),
      dangerChecks: count("danger"),
      warningChecks: count("warning"),
      infoChecks: count("info"),
      passingChecks: count("success"),
    },
  };
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function escapeCsvCell(value: string | number | boolean): string {
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildRegexMarkdownReport(state: RegexStudioState, result = analyzeRegexStudio(state)): string {
  const generatedAt = new Date().toISOString();
  const checkRows = result.checks
    .map((check) => `| ${check.severity.toUpperCase()} | ${escapeMarkdownCell(check.title)} | ${escapeMarkdownCell(check.message)} |`)
    .join("\n");

  return `# Regex production report

Generated: ${generatedAt}
Engine: JavaScript RegExp

## Pattern

\`/${state.pattern.replace(/`/g, "\\`")}/${state.flags}\`

## Summary

- Valid syntax: ${result.metrics.valid ? "Yes" : "No"}
- Preview execution: ${result.executionBlocked ? "Blocked" : "Allowed"}
- Backtracking risk: ${result.metrics.riskLevel}
- Matches: ${result.metrics.matches}
- Capture groups: ${result.metrics.captureGroups}
- Named groups: ${result.metrics.namedGroups}
- Coverage: ${result.metrics.coveragePercent}%
- Readiness: ${result.metrics.readinessScore}/100

## Production checks

| Severity | Check | Details |
| --- | --- | --- |
${checkRows}

## Replacement

\`\`\`text
${state.replacement}
\`\`\`

## Sample input

\`\`\`text
${state.text}
\`\`\`

## Replacement output

\`\`\`text
${result.output}
\`\`\`

## Limits

This report records browser-local JavaScript RegExp behavior. Heuristics cannot prove ReDoS safety, and the sample text may contain sensitive data. Add automated positive, negative, malformed, and worst-case tests in the target runtime.
`;
}

export function buildRegexMatchesCsv(state: RegexStudioState, result = analyzeRegexStudio(state)): string {
  const rows = [
    ["match_number", "match", "start_index", "end_index", "line", "column", "captures", "named_groups"],
    ...result.matches.map((match, index) => [
      index + 1,
      match.match,
      match.index,
      match.endIndex,
      match.line,
      match.column,
      JSON.stringify(match.captures),
      JSON.stringify(match.namedGroups),
    ]),
  ];
  return `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")}\n`;
}

export function buildRegexJavaScriptModule(state: RegexStudioState): string {
  return `export const regexSource = ${JSON.stringify(state.pattern)};
export const regexFlags = ${JSON.stringify(state.flags)};
export const replacement = ${JSON.stringify(state.replacement)};

export function createRegex() {
  return new RegExp(regexSource, regexFlags);
}

export function inspectInput(input) {
  const regex = createRegex();
  const matches = regex.global
    ? Array.from(input.matchAll(regex))
    : (() => {
        const match = regex.exec(input);
        return match ? [match] : [];
      })();

  return {
    matches,
    output: input.replace(createRegex(), replacement),
  };
}
`;
}

export function buildRegexTypeScriptModule(state: RegexStudioState): string {
  return `export const regexSource = ${JSON.stringify(state.pattern)} as const;
export const regexFlags = ${JSON.stringify(state.flags)} as const;
export const replacement = ${JSON.stringify(state.replacement)} as const;

export type RegexInspection = {
  matches: RegExpMatchArray[];
  output: string;
};

export function createRegex(): RegExp {
  return new RegExp(regexSource, regexFlags);
}

export function inspectInput(input: string): RegexInspection {
  const regex = createRegex();
  const matches: RegExpMatchArray[] = regex.global
    ? Array.from(input.matchAll(regex))
    : (() => {
        const match = regex.exec(input);
        return match ? [match] : [];
      })();

  return {
    matches,
    output: input.replace(createRegex(), replacement),
  };
}
`;
}

export function buildRegexReadme(state: RegexStudioState, result = analyzeRegexStudio(state)): string {
  return `# Darma Regex Production Pack

Pattern: /${state.pattern}/${state.flags}
Readiness: ${result.metrics.readinessScore}/100
Risk heuristic: ${result.metrics.riskLevel}
Preview execution: ${result.executionBlocked ? "blocked" : "allowed"}

Files:
- regex-project.json — reopenable Darma project
- regex-report.md — production audit and sample evidence
- regex-matches.csv — one row per preview match
- regex.mjs — standalone JavaScript module
- regex.ts — typed TypeScript module
- sample-input.txt — current browser-local test input
- replacement-output.txt — current replacement preview

Before deployment, add automated tests for expected matches, non-matches, malformed input, maximum input size, and realistic worst-case failures. The included backtracking checks are heuristics, not a formal ReDoS proof.
`;
}

export async function buildRegexProductionPack(state: RegexStudioState): Promise<Uint8Array> {
  const result = analyzeRegexStudio(state);
  const zip = new JSZip();
  zip.file("regex-project.json", buildRegexProjectJson(state));
  zip.file("regex-report.md", buildRegexMarkdownReport(state, result));
  zip.file("regex-matches.csv", buildRegexMatchesCsv(state, result));
  zip.file("regex.mjs", buildRegexJavaScriptModule(state));
  zip.file("regex.ts", buildRegexTypeScriptModule(state));
  zip.file("sample-input.txt", state.text);
  zip.file("replacement-output.txt", result.output);
  zip.file("README.md", buildRegexReadme(state, result));
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

export function buildLegacySnippets(state: RegexStudioState): string {
  return `JavaScript\n==========\n${buildJavaScriptSnippet(state.pattern, state.flags, state.replacement)}\n\nTypeScript\n==========\n${buildTypeScriptSnippet(state.pattern, state.flags, state.replacement)}`;
}
