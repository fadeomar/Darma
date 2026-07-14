import {
  ALL_TRANSFORMS,
  computeStats,
  getTransformById,
  runPipeline,
  type TextStats,
} from "./transforms";
import type { TextActionGroup, TransformContext } from "./types";

export type TextCleanerAuditSeverity = "error" | "warning" | "info" | "pass";

export type TextCleanerAuditCheck = {
  id: string;
  title: string;
  message: string;
  severity: TextCleanerAuditSeverity;
};

export type TextCleanerSummaryCard = {
  label: string;
  value: string;
  detail: string;
};

export type TextCleanerWorkflow = {
  actionIds: string[];
  prefixText: string;
  suffixText: string;
};

export type TextCleanerMetrics = {
  inputCharacters: number;
  outputCharacters: number;
  characterDelta: number;
  inputWords: number;
  outputWords: number;
  wordDelta: number;
  inputLines: number;
  outputLines: number;
  lineDelta: number;
  matchedLines: number;
  changedLines: number;
  changedPercent: number;
};

export type TextCleanerSnapshot = {
  input: string;
  output: string;
  workflow: TextCleanerWorkflow;
  inputStats: TextStats;
  outputStats: TextStats;
  metrics: TextCleanerMetrics;
  hasRun: boolean;
  isCurrent: boolean;
};

export type TextCleanerProjectFile = {
  schema: "darma.text-cleaner-workflow";
  version: 1;
  exportedAt: string;
  workflow: TextCleanerWorkflow;
  note: string;
};

export const DEFAULT_TEXT_CLEANER_WORKFLOW: TextCleanerWorkflow = {
  actionIds: ["trim-lines", "extra-spaces", "collapse-blank-lines"],
  prefixText: "> ",
  suffixText: ".",
};

const VALID_ACTION_IDS = new Set(
  ALL_TRANSFORMS.map((transform) => transform.id),
);
const EXTRACTION_ACTION_IDS = new Set(
  ALL_TRANSFORMS.filter((transform) => transform.group === "extract").map(
    (transform) => transform.id,
  ),
);
const CASE_ACTION_IDS = new Set(
  ALL_TRANSFORMS.filter((transform) => transform.group === "case").map(
    (transform) => transform.id,
  ),
);
const DESTRUCTIVE_ACTION_IDS = new Set([
  "empty-lines",
  "dedupe-lines",
  "extract-urls",
  "extract-emails",
  "extract-urls-emails",
  "extract-phone-numbers",
  "extract-hashtags",
  "extract-mentions",
  "extract-numbers",
]);

const PROJECT_NOTE =
  "This workflow file stores transform settings only. It intentionally excludes pasted input and generated output text.";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanTextSetting(
  value: unknown,
  fallback: string,
  maxLength: number,
): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/\u0000/g, "").slice(0, maxLength);
}

function normalizeActionIds(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];
  const normalized: string[] = [];
  for (const item of value) {
    if (
      typeof item !== "string" ||
      !VALID_ACTION_IDS.has(item) ||
      normalized.includes(item)
    )
      continue;
    normalized.push(item);
    if (normalized.length >= 40) break;
  }
  return normalized;
}

export function normalizeTextCleanerWorkflow(
  input: unknown,
  fallback: TextCleanerWorkflow = DEFAULT_TEXT_CLEANER_WORKFLOW,
): TextCleanerWorkflow {
  const source = isRecord(input) ? input : {};
  return {
    actionIds: normalizeActionIds(source.actionIds, fallback.actionIds),
    prefixText: cleanTextSetting(source.prefixText, fallback.prefixText, 500),
    suffixText: cleanTextSetting(source.suffixText, fallback.suffixText, 500),
  };
}

export function createTextCleanerProject(
  workflow: TextCleanerWorkflow,
  exportedAt = new Date().toISOString(),
): TextCleanerProjectFile {
  return {
    schema: "darma.text-cleaner-workflow",
    version: 1,
    exportedAt,
    workflow: normalizeTextCleanerWorkflow(workflow),
    note: PROJECT_NOTE,
  };
}

export function parseTextCleanerProject(input: string): TextCleanerWorkflow {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!isRecord(parsed))
    throw new Error("The workflow file must contain a JSON object.");
  if (parsed.schema !== "darma.text-cleaner-workflow") {
    throw new Error("This is not a Darma Text Cleaner workflow file.");
  }
  if (parsed.version !== 1)
    throw new Error("This Text Cleaner workflow version is not supported.");
  if (!isRecord(parsed.workflow))
    throw new Error("The workflow file does not contain valid settings.");

  return normalizeTextCleanerWorkflow(parsed.workflow, {
    actionIds: [],
    prefixText: DEFAULT_TEXT_CLEANER_WORKFLOW.prefixText,
    suffixText: DEFAULT_TEXT_CLEANER_WORKFLOW.suffixText,
  });
}

function lineFrequency(text: string): Map<string, number> {
  const values = text ? text.split("\n") : [];
  const frequency = new Map<string, number>();
  for (const value of values)
    frequency.set(value, (frequency.get(value) ?? 0) + 1);
  return frequency;
}

export function computeTextCleanerMetrics(
  input: string,
  output: string,
): TextCleanerMetrics {
  const inputStats = computeStats(input);
  const outputStats = computeStats(output);
  const inputFrequency = lineFrequency(input);
  const outputFrequency = lineFrequency(output);
  let matchedLines = 0;

  for (const [line, count] of inputFrequency) {
    matchedLines += Math.min(count, outputFrequency.get(line) ?? 0);
  }

  const lineBase = Math.max(inputStats.lines, outputStats.lines);
  const changedLines = Math.max(0, lineBase - matchedLines);
  const changedPercent = lineBase
    ? Math.round((changedLines / lineBase) * 100)
    : 0;

  return {
    inputCharacters: inputStats.characters,
    outputCharacters: outputStats.characters,
    characterDelta: outputStats.characters - inputStats.characters,
    inputWords: inputStats.words,
    outputWords: outputStats.words,
    wordDelta: outputStats.words - inputStats.words,
    inputLines: inputStats.lines,
    outputLines: outputStats.lines,
    lineDelta: outputStats.lines - inputStats.lines,
    matchedLines,
    changedLines,
    changedPercent,
  };
}

export function buildTextCleanerSnapshot({
  input,
  output,
  workflow,
  hasRun,
  isCurrent,
}: {
  input: string;
  output: string;
  workflow: TextCleanerWorkflow;
  hasRun: boolean;
  isCurrent: boolean;
}): TextCleanerSnapshot {
  const normalizedWorkflow = normalizeTextCleanerWorkflow(workflow, {
    actionIds: [],
    prefixText: DEFAULT_TEXT_CLEANER_WORKFLOW.prefixText,
    suffixText: DEFAULT_TEXT_CLEANER_WORKFLOW.suffixText,
  });
  return {
    input,
    output,
    workflow: normalizedWorkflow,
    inputStats: computeStats(input),
    outputStats: computeStats(output),
    metrics: computeTextCleanerMetrics(input, output),
    hasRun,
    isCurrent,
  };
}

function actionGroup(actionId: string): TextActionGroup | null {
  return getTransformById(actionId)?.group ?? null;
}

function countSensitiveSignals(text: string): number {
  const emailCount =
    text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi)?.length ?? 0;
  const phoneCount =
    text.match(/(?<!\w)(?:\+?\d[\d\s().-]{6,}\d)(?!\w)/g)?.length ?? 0;
  return emailCount + phoneCount;
}

export function buildTextCleanerAudit(
  snapshot: TextCleanerSnapshot,
): TextCleanerAuditCheck[] {
  const checks: TextCleanerAuditCheck[] = [];
  const { input, output, workflow, hasRun, isCurrent } = snapshot;
  const actionIds = workflow.actionIds;

  if (!input.trim()) {
    checks.push({
      id: "input-empty",
      title: "Input required",
      message: "Paste or load text before running a cleanup workflow.",
      severity: "error",
    });
  } else if (input.length > 2_000_000) {
    checks.push({
      id: "input-size",
      title: "Very large input",
      message:
        "This input exceeds 2 MB. Split it into smaller sections to avoid blocking the browser during complex extraction or sorting steps.",
      severity: "error",
    });
  } else if (input.length > 500_000) {
    checks.push({
      id: "input-size",
      title: "Large input",
      message:
        "The input is larger than 500,000 characters. The workflow remains local, but sorting and regex extraction may briefly block slower devices.",
      severity: "warning",
    });
  } else if (input.trim()) {
    checks.push({
      id: "input-ready",
      title: "Input available",
      message: `${snapshot.inputStats.words.toLocaleString()} words and ${snapshot.inputStats.lines.toLocaleString()} lines are ready for local processing.`,
      severity: "pass",
    });
  }

  if (!actionIds.length) {
    checks.push({
      id: "pipeline-empty",
      title: "No workflow steps selected",
      message:
        "Add at least one action or choose a preset before running or exporting a reusable workflow.",
      severity: "error",
    });
  } else if (actionIds.length > 12) {
    checks.push({
      id: "pipeline-length",
      title: "Long workflow",
      message: `${actionIds.length} steps are selected. Review the order and remove redundant actions before reusing this workflow.`,
      severity: "warning",
    });
  } else {
    checks.push({
      id: "pipeline-ready",
      title: "Workflow configured",
      message: `${actionIds.length} ordered ${actionIds.length === 1 ? "step is" : "steps are"} ready to run.`,
      severity: "pass",
    });
  }

  const extractionIndex = actionIds.findIndex((id) =>
    EXTRACTION_ACTION_IDS.has(id),
  );
  if (extractionIndex >= 0 && extractionIndex < actionIds.length - 1) {
    checks.push({
      id: "extraction-order",
      title: "Extraction should usually be last",
      message:
        "A later action will transform the extracted values. Move extraction to the end unless that behavior is intentional.",
      severity: "warning",
    });
  }

  const selectedCaseActions = actionIds.filter((id) => CASE_ACTION_IDS.has(id));
  if (selectedCaseActions.length > 1) {
    checks.push({
      id: "multiple-case-actions",
      title: "Competing case conversions",
      message:
        "Multiple case conversions are selected. Only the last one will define the final naming style, so earlier case steps are probably redundant.",
      severity: "warning",
    });
  }

  if (actionIds.includes("sort-az") && actionIds.includes("sort-za")) {
    checks.push({
      id: "opposite-sort",
      title: "Opposite sorting steps",
      message:
        "Both A–Z and Z–A sorting are selected. Keep only the final direction you need.",
      severity: "warning",
    });
  }

  if (
    actionIds.includes("lines-to-comma-list") &&
    actionIds.includes("comma-list-to-lines")
  ) {
    checks.push({
      id: "round-trip-format",
      title: "Round-trip list conversion",
      message:
        "The workflow converts lines to commas and back to lines. Remove one step unless this is deliberately normalizing separators.",
      severity: "warning",
    });
  }

  const emptyLinesIndex = actionIds.indexOf("empty-lines");
  const collapseLinesIndex = actionIds.indexOf("collapse-blank-lines");
  if (emptyLinesIndex >= 0 && collapseLinesIndex > emptyLinesIndex) {
    checks.push({
      id: "blank-line-order",
      title: "Redundant blank-line step",
      message:
        "Remove empty lines runs before collapse blank lines, so the later collapse step has nothing left to change.",
      severity: "info",
    });
  }

  const arabicPdfIndex = actionIds.indexOf("clean-arabic-pdf");
  if (arabicPdfIndex >= 0) {
    const redundantArabicActions = actionIds.filter(
      (id) =>
        id !== "clean-arabic-pdf" &&
        [
          "trim-lines",
          "extra-spaces",
          "collapse-blank-lines",
          "empty-lines",
          "remove-tashkeel",
          "remove-tatweel",
          "normalize-arabic-alef",
          "normalize-arabic-yaa",
          "arabic-punctuation-spacing",
        ].includes(id),
    );
    if (redundantArabicActions.length) {
      checks.push({
        id: "arabic-pdf-overlap",
        title: "Arabic PDF preset overlaps other steps",
        message:
          "Clean copied Arabic PDF text already includes several selected cleanup actions. Remove duplicate steps unless you need a deliberate second pass.",
        severity: "info",
      });
    }
  }

  if (
    actionIds.includes("prefix-lines") &&
    (workflow.prefixText.length === 0 || workflow.prefixText.length > 100)
  ) {
    checks.push({
      id: "prefix-setting",
      title: workflow.prefixText.length
        ? "Long line prefix"
        : "Empty line prefix",
      message: workflow.prefixText.length
        ? "The configured prefix is longer than 100 characters and may create unexpectedly large output."
        : "Add a prefix value or remove the Add prefix to each line step.",
      severity: "warning",
    });
  }

  if (
    actionIds.includes("suffix-lines") &&
    (workflow.suffixText.length === 0 || workflow.suffixText.length > 100)
  ) {
    checks.push({
      id: "suffix-setting",
      title: workflow.suffixText.length
        ? "Long line suffix"
        : "Empty line suffix",
      message: workflow.suffixText.length
        ? "The configured suffix is longer than 100 characters and may create unexpectedly large output."
        : "Add a suffix value or remove the Add suffix to each line step.",
      severity: "warning",
    });
  }

  const sensitiveSignals = countSensitiveSignals(input);
  if (sensitiveSignals) {
    checks.push({
      id: "sensitive-content",
      title: "Potential personal data detected",
      message: `${sensitiveSignals} email or phone-like ${sensitiveSignals === 1 ? "value was" : "values were"} detected. Processing is local, but downloaded reports and ZIP files can contain the cleaned text.`,
      severity: "info",
    });
  } else if (input.trim()) {
    checks.push({
      id: "local-processing",
      title: "Browser-local processing",
      message:
        "Transforms run locally and workflow JSON files exclude both input and output text.",
      severity: "pass",
    });
  }

  if (hasRun && !isCurrent) {
    checks.push({
      id: "stale-output",
      title: "Output is out of date",
      message:
        "The input or workflow changed after the last run. Run the current workflow again before exporting the production pack.",
      severity: "warning",
    });
  } else if (hasRun && isCurrent && input.trim()) {
    const extractionOnly =
      actionIds.length > 0 &&
      actionIds.every((id) => EXTRACTION_ACTION_IDS.has(id));
    if (!output) {
      checks.push({
        id: "empty-output",
        title: extractionOnly
          ? "No matches found"
          : "Workflow produced empty output",
        message: extractionOnly
          ? "The extraction steps did not find matching values in the current input."
          : "Review destructive steps such as extraction, empty-line removal, or custom formatting before exporting.",
        severity: extractionOnly ? "info" : "error",
      });
    } else if (output === input) {
      checks.push({
        id: "unchanged-output",
        title: "No text changes detected",
        message:
          "The workflow completed, but the output matches the input exactly. This can be correct when the source was already clean.",
        severity: "info",
      });
    } else {
      checks.push({
        id: "output-ready",
        title: "Current output ready",
        message: `${snapshot.metrics.changedLines.toLocaleString()} lines changed and the result is ready to copy or export.`,
        severity: "pass",
      });
    }
  } else if (!hasRun && input.trim() && actionIds.length) {
    checks.push({
      id: "run-required",
      title: "Run the workflow",
      message:
        "Generate output before downloading reports or a production pack.",
      severity: "info",
    });
  }

  if (actionIds.some((id) => DESTRUCTIVE_ACTION_IDS.has(id))) {
    checks.push({
      id: "destructive-steps",
      title: "Review destructive steps",
      message:
        "This workflow can remove or extract content. Compare the input and output before replacing source material.",
      severity: "info",
    });
  }

  return checks;
}

export function summarizeTextCleanerAudit(checks: TextCleanerAuditCheck[]) {
  const counts = checks.reduce(
    (result, check) => {
      result[check.severity] += 1;
      return result;
    },
    { error: 0, warning: 0, info: 0, pass: 0 },
  );

  const status = counts.error
    ? "Blocked"
    : counts.warning
      ? "Review"
      : counts.pass
        ? "Ready"
        : "Not run";

  return { counts, status };
}

function signed(value: number, suffix = ""): string {
  if (!value) return `0${suffix}`;
  return `${value > 0 ? "+" : ""}${value.toLocaleString()}${suffix}`;
}

export function buildTextCleanerSummaryCards(
  snapshot: TextCleanerSnapshot,
  checks = buildTextCleanerAudit(snapshot),
): TextCleanerSummaryCard[] {
  const audit = summarizeTextCleanerAudit(checks);
  const actionCount = snapshot.workflow.actionIds.length;
  const lastAction = actionCount
    ? (getTransformById(snapshot.workflow.actionIds[actionCount - 1])?.label ??
      "Unknown step")
    : "No steps";

  return [
    {
      label: "Workflow",
      value: `${actionCount} ${actionCount === 1 ? "step" : "steps"}`,
      detail: actionCount
        ? `Final step: ${lastAction}`
        : "Choose a preset or add actions.",
    },
    {
      label: "Characters",
      value: snapshot.hasRun
        ? snapshot.outputStats.characters.toLocaleString()
        : "—",
      detail: snapshot.hasRun
        ? `${signed(snapshot.metrics.characterDelta)} versus input`
        : `${snapshot.inputStats.characters.toLocaleString()} currently in input`,
    },
    {
      label: "Changed lines",
      value: snapshot.hasRun
        ? snapshot.metrics.changedLines.toLocaleString()
        : "—",
      detail: snapshot.hasRun
        ? `${snapshot.metrics.changedPercent}% of compared lines`
        : `${snapshot.inputStats.lines.toLocaleString()} input lines`,
    },
    {
      label: "Readiness",
      value: audit.status,
      detail: audit.counts.error
        ? `${audit.counts.error} blocking ${audit.counts.error === 1 ? "issue" : "issues"}`
        : audit.counts.warning
          ? `${audit.counts.warning} ${audit.counts.warning === 1 ? "warning" : "warnings"} to review`
          : `${audit.counts.pass} checks passed`,
    },
  ];
}

function actionRows(workflow: TextCleanerWorkflow): string[] {
  return workflow.actionIds.map((id, index) => {
    const transform = getTransformById(id);
    return `${index + 1}. ${transform?.label ?? id}${transform ? ` — ${transform.title}` : ""}`;
  });
}

export function buildTextCleanerMarkdownReport(
  snapshot: TextCleanerSnapshot,
  checks = buildTextCleanerAudit(snapshot),
): string {
  const audit = summarizeTextCleanerAudit(checks);
  const rows = actionRows(snapshot.workflow);
  return [
    "# Darma Text Cleaner report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Status: ${audit.status}`,
    "",
    "## Workflow",
    "",
    ...(rows.length ? rows : ["No workflow steps selected."]),
    "",
    "## Metrics",
    "",
    `- Input characters: ${snapshot.metrics.inputCharacters}`,
    `- Output characters: ${snapshot.metrics.outputCharacters}`,
    `- Character delta: ${snapshot.metrics.characterDelta}`,
    `- Input words: ${snapshot.metrics.inputWords}`,
    `- Output words: ${snapshot.metrics.outputWords}`,
    `- Word delta: ${snapshot.metrics.wordDelta}`,
    `- Input lines: ${snapshot.metrics.inputLines}`,
    `- Output lines: ${snapshot.metrics.outputLines}`,
    `- Changed lines: ${snapshot.metrics.changedLines}`,
    `- Changed lines percentage: ${snapshot.metrics.changedPercent}%`,
    "",
    "## Production checks",
    "",
    ...checks.map(
      (check) =>
        `- **${check.severity.toUpperCase()} — ${check.title}:** ${check.message}`,
    ),
    "",
    "## Privacy",
    "",
    "Transforms run locally in the browser. This report describes the workflow and metrics but intentionally excludes the pasted input and cleaned output.",
    "",
  ].join("\n");
}

function csvCell(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildTextCleanerMetricsCsv(
  snapshot: TextCleanerSnapshot,
): string {
  const headers = [
    "input_characters",
    "output_characters",
    "character_delta",
    "input_words",
    "output_words",
    "word_delta",
    "input_lines",
    "output_lines",
    "line_delta",
    "matched_lines",
    "changed_lines",
    "changed_percent",
    "workflow_steps",
    "is_current",
  ];
  const values = [
    snapshot.metrics.inputCharacters,
    snapshot.metrics.outputCharacters,
    snapshot.metrics.characterDelta,
    snapshot.metrics.inputWords,
    snapshot.metrics.outputWords,
    snapshot.metrics.wordDelta,
    snapshot.metrics.inputLines,
    snapshot.metrics.outputLines,
    snapshot.metrics.lineDelta,
    snapshot.metrics.matchedLines,
    snapshot.metrics.changedLines,
    snapshot.metrics.changedPercent,
    snapshot.workflow.actionIds.length,
    snapshot.isCurrent,
  ];
  return `${headers.join(",")}\n${values.map(csvCell).join(",")}\n`;
}

function safeJson(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/[\u2028\u2029]/g, (char) =>
    char === "\u2028" ? "\\u2028" : "\\u2029",
  );
}

export function buildTextCleanerJavaScript(
  workflow: TextCleanerWorkflow,
): string {
  const normalized = normalizeTextCleanerWorkflow(workflow, {
    actionIds: [],
    prefixText: DEFAULT_TEXT_CLEANER_WORKFLOW.prefixText,
    suffixText: DEFAULT_TEXT_CLEANER_WORKFLOW.suffixText,
  });
  const config = safeJson(normalized);

  return `"use strict";

const workflow = ${config};

function splitWords(text) {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9\\u0600-\\u06FF\\s]/g, " ")
    .split(/\\s+/)
    .filter(Boolean);
}

function extractMatches(text, pattern) {
  return Array.from(text.matchAll(pattern), (match) => match[0]).join("\\n");
}

function cleanCopiedArabicPdfText(text) {
  return text
    .replace(/\\r\\n/g, "\\n")
    .replace(/\\r/g, "\\n")
    .split("\\n")
    .map((line) => line.trim().replace(/[ \\t]+/g, " "))
    .join("\\n")
    .replace(/[\\u064B-\\u065F\\u0670]/g, "")
    .replace(/\\u0640/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\\s+([،؛؟])/g, "$1")
    .replace(/([،؛؟])(?=\\S)/g, "$1 ")
    .replace(/[ \\t]+/g, " ")
    .replace(/\\n{3,}/g, "\\n\\n")
    .split("\\n")
    .filter((line) => line.trim() !== "")
    .join("\\n");
}

function applyStep(text, actionId, context) {
  switch (actionId) {
    case "trim": return text.trim();
    case "trim-lines": return text.split("\\n").map((line) => line.trim()).join("\\n");
    case "extra-spaces": return text.split("\\n").map((line) => line.replace(/[ \\t]+/g, " ").trim()).join("\\n");
    case "empty-lines": return text.split("\\n").filter((line) => line.trim() !== "").join("\\n");
    case "collapse-blank-lines": return text.replace(/\\n{3,}/g, "\\n\\n");
    case "dedupe-lines": {
      const seen = new Set();
      return text.split("\\n").filter((line) => {
        const key = line.trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).join("\\n");
    }
    case "sort-az": return text.split("\\n").sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })).join("\\n");
    case "sort-za": return text.split("\\n").sort((a, b) => b.localeCompare(a, undefined, { sensitivity: "base" })).join("\\n");
    case "remove-tashkeel": return text.replace(/[\\u064B-\\u065F\\u0670]/g, "");
    case "remove-tatweel": return text.replace(/\\u0640/g, "");
    case "normalize-arabic-alef": return text.replace(/[إأآٱ]/g, "ا");
    case "normalize-arabic-yaa": return text.replace(/ى/g, "ي");
    case "arabic-punctuation-spacing": return text.replace(/\\s+([،؛؟])/g, "$1").replace(/([،؛؟])(?=\\S)/g, "$1 ").replace(/[ \\t]+/g, " ");
    case "clean-arabic-pdf": return cleanCopiedArabicPdfText(text);
    case "extract-urls": return extractMatches(text, /\\bhttps?:\\/\\/[^\\s<>"')\\]]+/gi).replace(/[.,;:!?]+$/gm, "");
    case "extract-emails": return extractMatches(text, /\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b/gi);
    case "extract-urls-emails": return [
      extractMatches(text, /\\bhttps?:\\/\\/[^\\s<>"')\\]]+/gi).replace(/[.,;:!?]+$/gm, ""),
      extractMatches(text, /\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b/gi),
    ].filter(Boolean).join("\\n");
    case "extract-phone-numbers": return extractMatches(text, /(?<!\\w)(?:\\+?\\d[\\d\\s().-]{6,}\\d)(?!\\w)/g);
    case "extract-hashtags": return extractMatches(text, /#[\\p{L}\\p{N}_-]+/gu);
    case "extract-mentions": return extractMatches(text, /@[\\p{L}\\p{N}_-]+/gu);
    case "extract-numbers": return extractMatches(text, /-?\\d+(?:[.,]\\d+)?/g);
    case "number-lines": return text.split("\\n").map((line, index) => \`\${index + 1}. \${line}\`).join("\\n");
    case "bullet-points": return text.split("\\n").map((line) => \`- \${line}\`).join("\\n");
    case "lines-to-comma-list": return text.split("\\n").map((line) => line.trim()).filter(Boolean).join(", ");
    case "comma-list-to-lines": return text.split(",").map((item) => item.trim()).filter(Boolean).join("\\n");
    case "prefix-lines": return text.split("\\n").map((line) => \`\${context.prefixText}\${line}\`).join("\\n");
    case "suffix-lines": return text.split("\\n").map((line) => \`\${line}\${context.suffixText}\`).join("\\n");
    case "quote-lines": return text.split("\\n").map((line) => \`"\${line.replace(/"/g, '\\\\"')}"\`).join("\\n");
    case "uppercase": return text.toUpperCase();
    case "lowercase": return text.toLowerCase();
    case "title-case": return text.replace(/\\w\\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    case "sentence-case": return text.toLowerCase().replace(/(^\\s*\\w|[.!?]\\s+\\w)/g, (match) => match.toUpperCase());
    case "camel-case": return splitWords(text).map((word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("");
    case "pascal-case": return splitWords(text).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("");
    case "snake-case": return splitWords(text).map((word) => word.toLowerCase()).join("_");
    case "kebab-case": return splitWords(text).map((word) => word.toLowerCase()).join("-");
    default: return text;
  }
}

function cleanText(input, overrides = {}) {
  const activeWorkflow = {
    ...workflow,
    ...overrides,
    actionIds: Array.isArray(overrides.actionIds) ? overrides.actionIds : workflow.actionIds,
  };
  return activeWorkflow.actionIds.reduce(
    (value, actionId) => applyStep(value, actionId, activeWorkflow),
    String(input ?? ""),
  );
}

module.exports = { workflow, cleanText };
`;
}

export function buildTextCleanerProductionFiles(
  snapshot: TextCleanerSnapshot,
): Record<string, string> {
  const checks = buildTextCleanerAudit(snapshot);
  return {
    "cleaned-text.txt": snapshot.output,
    "text-cleaner-workflow.json": `${safeJson(createTextCleanerProject(snapshot.workflow))}\n`,
    "text-cleaner-report.md": buildTextCleanerMarkdownReport(snapshot, checks),
    "text-cleaner-metrics.csv": buildTextCleanerMetricsCsv(snapshot),
    "text-cleaner-pipeline.js": buildTextCleanerJavaScript(snapshot.workflow),
  };
}

export function runTextCleanerWorkflow(
  input: string,
  workflow: TextCleanerWorkflow,
): string {
  const normalized = normalizeTextCleanerWorkflow(workflow, {
    actionIds: [],
    prefixText: DEFAULT_TEXT_CLEANER_WORKFLOW.prefixText,
    suffixText: DEFAULT_TEXT_CLEANER_WORKFLOW.suffixText,
  });
  const context: TransformContext = {
    prefixText: normalized.prefixText,
    suffixText: normalized.suffixText,
  };
  return runPipeline(input, normalized.actionIds, context);
}

export function firstWorkflowGroup(
  workflow: TextCleanerWorkflow,
): TextActionGroup {
  for (const actionId of workflow.actionIds) {
    const group = actionGroup(actionId);
    if (group) return group;
  }
  return "clean";
}
