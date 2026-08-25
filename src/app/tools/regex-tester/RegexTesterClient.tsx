"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Braces,
  CheckCircle2,
  Code2,
  Download,
  FileArchive,
  FileJson,
  FileText,
  FileUp,
  Highlighter,
  ListChecks,
  RefreshCcw,
  Replace,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button, CopyButton, Input, Tabs, Textarea } from "@/components/ui";
import { downloadText } from "../_shared/clientUtils";
import {
  buildHighlightSegments,
  buildJavaScriptSnippet,
  buildTypeScriptSnippet,
  getPatternStats,
  REGEX_INPUT_LIMIT,
} from "./regex";
import {
  CHEATSHEET,
  DEFAULT_FLAGS,
  DEFAULT_PATTERN,
  DEFAULT_REPLACEMENT,
  FLAG_OPTIONS,
  REGEX_EXAMPLES,
  SAMPLE_TEXT,
} from "./presets";
import type { RegexExample, RegexProductionCheck, RegexTab } from "./types";
import {
  analyzeRegexStudio,
  buildRegexJavaScriptModule,
  buildRegexMarkdownReport,
  buildRegexMatchesCsv,
  buildRegexProductionPack,
  buildRegexProjectJson,
  buildRegexTypeScriptModule,
  parseRegexProjectJson,
  REGEX_PROJECT_FILE_LIMIT,
  type RegexStudioState,
} from "./studio";

const CHECK_STYLES: Record<RegexProductionCheck["severity"], string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function countLines(value: string) {
  return value ? value.split(/\r\n|\r|\n/).length : 0;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="truncate font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]">{value}</div>
      <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div>
    </div>
  );
}

function CheckIcon({ severity }: { severity: RegexProductionCheck["severity"] }) {
  if (severity === "success") return <CheckCircle2 className="h-4 w-4" aria-hidden />;
  if (severity === "danger") return <XCircle className="h-4 w-4" aria-hidden />;
  if (severity === "warning") return <AlertTriangle className="h-4 w-4" aria-hidden />;
  return <ShieldCheck className="h-4 w-4" aria-hidden />;
}

export default function RegexTesterClient() {
  const [pattern, setPattern] = useState(DEFAULT_PATTERN);
  const [flags, setFlags] = useState(DEFAULT_FLAGS);
  const [text, setText] = useState(SAMPLE_TEXT);
  const [replacement, setReplacement] = useState(DEFAULT_REPLACEMENT);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [activeTab, setActiveTab] = useState<RegexTab>("highlight");
  const [selectedMatch, setSelectedMatch] = useState(0);
  const [importStatus, setImportStatus] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [packBusy, setPackBusy] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const studioState = useMemo<RegexStudioState>(() => ({ pattern, flags, text, replacement }), [flags, pattern, replacement, text]);
  const analysis = useMemo(() => analyzeRegexStudio(studioState), [studioState]);
  const { built, risk, executionBlocked, matches, output: replaced, checks, metrics } = analysis;
  const segments = useMemo(() => buildHighlightSegments(text, matches), [matches, text]);
  const patternStats = useMemo(() => getPatternStats(pattern), [pattern]);
  const coverage = metrics.coveragePercent;
  const javascriptSnippet = useMemo(() => buildJavaScriptSnippet(pattern, flags, replacement), [flags, pattern, replacement]);
  const typescriptSnippet = useMemo(() => buildTypeScriptSnippet(pattern, flags, replacement), [flags, pattern, replacement]);
  const projectJson = useMemo(() => buildRegexProjectJson(studioState), [studioState]);
  const markdownReport = useMemo(() => buildRegexMarkdownReport(studioState, analysis), [analysis, studioState]);
  const matchesCsv = useMemo(() => buildRegexMatchesCsv(studioState, analysis), [analysis, studioState]);
  const javascriptModule = useMemo(() => buildRegexJavaScriptModule(studioState), [studioState]);
  const typescriptModule = useMemo(() => buildRegexTypeScriptModule(studioState), [studioState]);
  const reportJson = useMemo(
    () => JSON.stringify({
      engine: "JavaScript RegExp",
      pattern,
      flags,
      replacement,
      summary: {
        valid: built instanceof RegExp,
        matches: matches.length,
        captureGroups: patternStats.captureGroups,
        namedGroups: patternStats.namedGroups,
        coveragePercent: coverage,
        inputCharacters: text.length,
        riskLevel: risk.level,
        executionBlocked,
      },
      matches,
      replacedText: replaced,
      productionChecks: checks,
    }, null, 2),
    [built, checks, coverage, executionBlocked, flags, matches, pattern, patternStats, replaced, replacement, risk.level, text.length],
  );

  const activeMatch = matches[selectedMatch] ?? matches[0];
  const status = !(built instanceof RegExp)
    ? "Invalid"
    : executionBlocked
      ? "Paused"
      : matches.length
        ? "Matching"
        : "No match";
  const statusHint = !(built instanceof RegExp)
    ? "Fix the pattern syntax"
    : executionBlocked
      ? risk.level === "high" ? "High-risk preview blocked" : "Risky pattern + long sample"
      : risk.level === "low"
        ? "JavaScript RegExp ready"
        : `${risk.level} backtracking risk`;

  function updatePattern(value: string) {
    setPattern(value);
    setSelectedPreset("");
    setSelectedMatch(0);
  }

  function updateText(value: string) {
    setText(value);
    setSelectedPreset("");
    setSelectedMatch(0);
  }

  function updateReplacement(value: string) {
    setReplacement(value);
    setSelectedPreset("");
  }

  function toggleFlag(flag: string) {
    setFlags((current) => current.includes(flag) ? current.replace(flag, "") : `${current}${flag}`);
    setSelectedPreset("");
    setSelectedMatch(0);
  }

  function applyPreset(preset: RegexExample) {
    setPattern(preset.pattern);
    setFlags(preset.flags);
    setText(preset.text);
    setReplacement(preset.replacement);
    setSelectedPreset(preset.id);
    setSelectedMatch(0);
    setActiveTab("highlight");
  }

  function resetTool() {
    setPattern(DEFAULT_PATTERN);
    setFlags(DEFAULT_FLAGS);
    setText(SAMPLE_TEXT);
    setReplacement(DEFAULT_REPLACEMENT);
    setSelectedPreset("");
    setSelectedMatch(0);
    setActiveTab("highlight");
    setImportStatus(null);
  }

  async function importProject(file: File) {
    if (file.size > REGEX_PROJECT_FILE_LIMIT) {
      setImportStatus({ tone: "danger", message: `Project files must be smaller than ${(REGEX_PROJECT_FILE_LIMIT / 1_000_000).toFixed(0)} MB.` });
      return;
    }

    try {
      const project = parseRegexProjectJson(await file.text());
      setPattern(project.pattern);
      setFlags(project.flags);
      setText(project.text);
      setReplacement(project.replacement);
      setSelectedPreset("");
      setSelectedMatch(0);
      setActiveTab("highlight");
      setImportStatus({ tone: "success", message: `Imported ${file.name}. Review the production checks before exporting.` });
    } catch (error) {
      setImportStatus({ tone: "danger", message: error instanceof Error ? error.message : "Could not import this regex project." });
    }
  }

  async function downloadProductionPack() {
    setPackBusy(true);
    try {
      const bytes = await buildRegexProductionPack(studioState);
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      downloadBlob("darma-regex-production-pack.zip", new Blob([buffer], { type: "application/zip" }));
    } finally {
      setPackBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Quick starts</h2>
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Start from a real extraction, cleanup, validation, or transform pattern, then refine it in the workbench below.</p>
          </div>
          <Button size="sm" variant="ghost" leftIcon={<RefreshCcw className="h-3.5 w-3.5" />} onClick={resetTool}>Reset</Button>
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {REGEX_EXAMPLES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={selectedPreset === preset.id}
              onClick={() => applyPreset(preset)}
              className={`min-w-0 rounded-[var(--radius-md)] border p-2.5 text-left transition focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ${selectedPreset === preset.id ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-raised)]"}`}
            >
              <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.label}</span>
              <span className="mt-1 block truncate font-mono text-xs uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">{preset.category}</span>
              <span className="mt-1 line-clamp-2 block text-xs leading-4 text-[var(--color-text-secondary)]">{preset.description}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:items-stretch">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">1. Pattern and test input</h2>
                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Uses the native JavaScript RegExp engine.</p>
              </div>
              <CopyButton text={`/${pattern}/${flags}`} size="sm" variant="secondary">Copy regex</CopyButton>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="space-y-2">
              <label htmlFor="regex-pattern" className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Pattern</label>
              <div className="flex min-w-0 items-center rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-control-bg)] shadow-[var(--shadow-xs)] focus-within:border-[var(--color-primary)] focus-within:shadow-[var(--focus-ring)]">
                <span className="shrink-0 px-3 font-mono text-sm font-bold text-[var(--color-text-tertiary)]">/</span>
                <input
                  id="regex-pattern"
                  value={pattern}
                  onChange={(event) => updatePattern(event.target.value)}
                  aria-invalid={!(built instanceof RegExp)}
                  spellCheck={false}
                  className="min-h-[42px] min-w-0 flex-1 border-0 bg-transparent py-2 font-mono text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
                  placeholder="Enter a JavaScript regular expression"
                />
                <span className="shrink-0 px-3 font-mono text-sm font-bold text-[var(--color-text-tertiary)]">/{flags}</span>
              </div>
              {!(built instanceof RegExp) ? <p className="text-xs font-semibold text-[var(--color-danger-text)]">{built.message}</p> : null}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Flags</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">Click a flag to toggle it</span>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Regular expression flags">
                {FLAG_OPTIONS.map((option) => (
                  <button
                    key={option.flag}
                    type="button"
                    title={option.description}
                    aria-label={`${option.label}: ${option.description}`}
                    aria-pressed={flags.includes(option.flag)}
                    onClick={() => toggleFlag(option.flag)}
                    className={`h-9 min-w-9 rounded-[var(--radius-sm)] border px-2 font-mono text-xs font-black transition focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ${flags.includes(option.flag) ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]" : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="regex-replacement" className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Replacement</label>
              <Input id="regex-replacement" value={replacement} onChange={(event) => updateReplacement(event.target.value)} className="font-mono" placeholder="Use $&, $1, or $<name>" />
            </div>

            <div className="flex min-h-0 flex-1 flex-col space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="regex-test-text" className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Test text</label>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                  <span>{countLines(text)} line(s)</span>
                  <span aria-hidden>·</span>
                  <span className={text.length > REGEX_INPUT_LIMIT ? "font-bold text-[var(--color-danger-text)]" : ""}>{text.length.toLocaleString()} / {REGEX_INPUT_LIMIT.toLocaleString()}</span>
                  <Button size="sm" variant="ghost" onClick={() => updateText("")}>Clear</Button>
                </div>
              </div>
              <Textarea
                id="regex-test-text"
                value={text}
                onChange={(event) => updateText(event.target.value)}
                variant="editor"
                minRows={12}
                spellCheck={false}
                aria-invalid={text.length > REGEX_INPUT_LIMIT}
                className="min-h-[300px] flex-1 font-mono text-xs leading-6"
                placeholder="Paste text to test against the pattern…"
              />
            </div>

            <details className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2">
              <summary className="cursor-pointer text-xs font-bold text-[var(--color-text-primary)]">Regex quick reference</summary>
              <div className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                {CHEATSHEET.map((item) => (
                  <div key={item.token} className="flex min-w-0 gap-2 text-xs leading-5">
                    <code className="shrink-0 font-bold text-[var(--color-primary-text-strong)]">{item.token}</code>
                    <span className="text-[var(--color-text-secondary)]">{item.meaning}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </section>

        <section className="flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-code-border)] [border-top:2px_solid_var(--color-primary)] bg-[var(--color-code-bg)] shadow-[var(--shadow-md)]" aria-live="polite">
          <div className="flex flex-col gap-3 border-b border-[var(--color-code-border)] bg-[var(--color-code-surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--color-code-text)]">2. Live regex inspector</h2>
              <p className="mt-1 text-xs text-[var(--color-code-muted)]">Highlight matches, inspect captures, preview replacement, or export code.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={reportJson} size="sm" variant="soft">Copy JSON</CopyButton>
              <Button size="sm" variant="secondary" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={() => downloadText("regex-report.json", reportJson, "application/json;charset=utf-8")}>Report</Button>
            </div>
          </div>

          <div className="overflow-x-auto border-b border-[var(--color-code-border)] bg-[var(--color-code-surface)]/80 px-4 py-3">
            <Tabs<RegexTab>
              ariaLabel="Regex result views"
              value={activeTab}
              onChange={setActiveTab}
              items={[
                { value: "highlight", label: <span className="inline-flex items-center gap-1.5"><Highlighter className="h-3.5 w-3.5" />Highlight</span> },
                { value: "matches", label: <span className="inline-flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5" />Matches</span> },
                { value: "replace", label: <span className="inline-flex items-center gap-1.5"><Replace className="h-3.5 w-3.5" />Replace</span> },
                { value: "code", label: <span className="inline-flex items-center gap-1.5"><Code2 className="h-3.5 w-3.5" />Code</span> },
              ]}
              className="whitespace-nowrap border-[var(--color-code-border)] bg-[rgba(244,241,234,0.06)] [&_button]:text-slate-300 [&_button[aria-selected='true']]:bg-white [&_button[aria-selected='true']]:text-slate-950"
            />
          </div>

          <div className="flex min-h-[520px] flex-1 flex-col p-3.5 sm:p-4">
            {executionBlocked ? (
              <div className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-xs leading-5 text-[var(--color-warning-text)]">
                {risk.level === "high"
                  ? "Preview execution is blocked because multiple backtracking-risk heuristics were detected. Simplify the expression before running it in the browser."
                  : "Preview execution is paused because a risky pattern is being tested against more than 128 characters. Shorten the sample or simplify the expression."}
              </div>
            ) : null}

            {activeTab === "highlight" ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div className="min-h-[320px] flex-1 overflow-auto rounded-[var(--radius-md)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)] p-4">
                  {text ? (
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-[var(--color-code-text)]">
                      {segments.map((segment) => segment.highlighted ? (
                        <button
                          key={segment.id}
                          type="button"
                          title={`Match ${(segment.matchIndex ?? 0) + 1}`}
                          onClick={() => setSelectedMatch(segment.matchIndex ?? 0)}
                          className={`rounded-[2px] px-0.5 [font:inherit] text-inherit outline-none transition focus-visible:ring-2 focus-visible:ring-white ${selectedMatch === segment.matchIndex ? "bg-[var(--color-primary)] text-[var(--color-primary-text)]" : "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] hover:brightness-95"} ${segment.zeroLength ? "mx-0.5" : ""}`}
                        >
                          {segment.text}
                        </button>
                      ) : <span key={segment.id}>{segment.text}</span>)}
                    </pre>
                  ) : <div className="flex min-h-[280px] items-center justify-center text-center text-sm text-[var(--color-code-muted)]">Add test text to see highlighted matches.</div>}
                </div>

                {activeMatch ? (
                  <div className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-code-border)] bg-[var(--color-code-surface)] p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-code-muted)]">Selected match #{(matches.indexOf(activeMatch) + 1).toLocaleString()}</div>
                      <code className="mt-1 block truncate text-xs font-bold text-[var(--color-code-text)]">{activeMatch.match || "Zero-length match"}</code>
                    </div>
                    <div className="text-xs text-[var(--color-code-muted)]">Line {activeMatch.line}, column {activeMatch.column}</div>
                    <div className="text-xs text-[var(--color-code-muted)]">Index {activeMatch.index}–{activeMatch.endIndex}</div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === "matches" ? (
              <div className="min-h-[420px] flex-1 overflow-auto rounded-[var(--radius-md)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)] p-3">
                {matches.length ? (
                  <div className="space-y-2">
                    {matches.slice(0, 200).map((match, index) => (
                      <button
                        key={`${match.index}-${index}`}
                        type="button"
                        onClick={() => { setSelectedMatch(index); setActiveTab("highlight"); }}
                        className="w-full min-w-0 rounded-[var(--radius-sm)] border border-[var(--color-code-border)] bg-[var(--color-code-surface)] p-3 text-left transition hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-code-muted)]">Match #{index + 1}</span>
                          <span className="font-mono text-xs text-[var(--color-code-muted)]">L{match.line}:C{match.column} · {match.index}–{match.endIndex}</span>
                        </div>
                        <code className="mt-2 block break-all text-xs font-bold leading-5 text-[var(--color-code-text)]">{match.match || "Zero-length match"}</code>
                        {match.captures.length || match.namedGroups.length ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {match.captures.map((capture) => <span key={`capture-${capture.index}`} className="rounded-full border border-[var(--color-code-border)] px-2 py-0.5 font-mono text-xs text-[var(--color-code-muted)]">${capture.index}: {capture.value ?? "undefined"}</span>)}
                            {match.namedGroups.map((group) => <span key={`named-${group.name}`} className="rounded-full border border-[var(--color-primary)] px-2 py-0.5 font-mono text-xs text-[var(--color-code-text)]">{group.name}: {group.value ?? "undefined"}</span>)}
                          </div>
                        ) : null}
                      </button>
                    ))}
                    {matches.length > 200 ? <p className="py-2 text-center text-xs text-[var(--color-code-muted)]">Showing the first 200 matches in the inspector. The JSON report includes all previewed matches.</p> : null}
                  </div>
                ) : <div className="flex min-h-[390px] items-center justify-center text-center text-sm text-[var(--color-code-muted)]">No matches to inspect.</div>}
              </div>
            ) : null}

            {activeTab === "replace" ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-[var(--color-code-muted)]">JavaScript replacement preview using <code className="text-[var(--color-code-text)]">String.replace()</code>.</div>
                  <CopyButton text={replaced} size="sm" variant="soft" disabled={!replaced}>Copy output</CopyButton>
                </div>
                <pre className="min-h-[420px] flex-1 overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-md)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)] p-4 font-mono text-xs leading-6 text-[var(--color-code-text)]">{replaced || "Replacement output will appear here."}</pre>
              </div>
            ) : null}

            {activeTab === "code" ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)]">
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--color-code-border)] bg-[var(--color-code-surface)] px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-code-text)]"><Braces className="h-3.5 w-3.5" />JavaScript</span>
                    <CopyButton text={javascriptSnippet} size="sm" variant="soft">Copy JS</CopyButton>
                  </div>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-6 text-[var(--color-code-text)]"><code>{javascriptSnippet}</code></pre>
                </div>
                <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)]">
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--color-code-border)] bg-[var(--color-code-surface)] px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-code-text)]"><Code2 className="h-3.5 w-3.5" />TypeScript utility</span>
                    <CopyButton text={typescriptSnippet} size="sm" variant="soft">Copy TS</CopyButton>
                  </div>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-6 text-[var(--color-code-text)]"><code>{typescriptSnippet}</code></pre>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} disabled={!metrics.valid} onClick={() => downloadText("regex.mjs", javascriptModule, "text/javascript;charset=utf-8")}>Download JavaScript</Button>
                  <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} disabled={!metrics.valid} onClick={() => downloadText("regex.ts", typescriptModule, "text/typescript;charset=utf-8")}>Download TypeScript</Button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="space-y-2" aria-label="Regex analysis summary">
        <div className="flex flex-wrap items-end justify-between gap-2 px-1">
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">3. Analysis summary</h2>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Review match coverage, backtracking risk, and readiness after testing the pattern.</p>
          </div>
          <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">JavaScript RegExp · browser-local</span>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <SummaryCard label="Status" value={status} hint={statusHint} />
          <SummaryCard label="Matches" value={matches.length.toLocaleString()} hint={`${patternStats.captureGroups} capture group(s) · ${coverage.toFixed(1)}% coverage`} />
          <SummaryCard label="Backtracking" value={risk.level[0].toUpperCase() + risk.level.slice(1)} hint={executionBlocked ? "Browser preview guarded" : "Preview within guardrails"} />
          <SummaryCard label="Readiness" value={`${metrics.readinessScore}/100`} hint={`${metrics.dangerChecks} blocking · ${metrics.warningChecks} warning(s)`} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">4. Production checks</h2>
          </div>
          <span className="text-xs text-[var(--color-text-tertiary)]">Heuristics supplement tests; they do not prove a regex is ReDoS-safe.</span>
        </div>
        <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-3">
          {checks.map((check) => (
            <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.severity]}`}>
              <div className="flex items-center gap-2">
                <CheckIcon severity={check.severity} />
                <h3 className="text-xs font-bold">{check.title}</h3>
              </div>
              <p className="mt-1.5 text-xs leading-5 opacity-90">{check.message}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileArchive className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">5. Project and production handoff</h2>
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Reopen the exact pattern later or export code, evidence, and audit files together.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importProject(file);
                event.target.value = "";
              }}
            />
            <Button size="sm" variant="secondary" leftIcon={<FileUp className="h-3.5 w-3.5" />} onClick={() => importInputRef.current?.click()}>Import project</Button>
            <Button size="sm" variant="secondary" leftIcon={<FileJson className="h-3.5 w-3.5" />} onClick={() => downloadText("regex-project.json", projectJson, "application/json;charset=utf-8")}>Project JSON</Button>
            <Button size="sm" variant="secondary" leftIcon={<FileText className="h-3.5 w-3.5" />} onClick={() => downloadText("regex-report.md", markdownReport, "text/markdown;charset=utf-8")}>Audit</Button>
            <Button size="sm" variant="secondary" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={() => downloadText("regex-matches.csv", matchesCsv, "text/csv;charset=utf-8")}>CSV</Button>
            <Button size="sm" variant="primary" leftIcon={<FileArchive className="h-3.5 w-3.5" />} loading={packBusy} disabled={!metrics.valid} onClick={() => void downloadProductionPack()}>Production ZIP</Button>
          </div>
        </div>
        {importStatus ? (
          <div role="status" className={`border-b px-4 py-2 text-xs font-semibold ${importStatus.tone === "success" ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]" : "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]"}`}>
            {importStatus.message}
          </div>
        ) : null}
        <div className="grid gap-2 p-3 text-xs text-[var(--color-text-secondary)] sm:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3"><strong className="block text-[var(--color-text-primary)]">Portable project</strong><span className="mt-1 block leading-5">Includes pattern, flags, replacement, and test text. Maximum import size: 1 MB.</span></div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3"><strong className="block text-[var(--color-text-primary)]">Developer modules</strong><span className="mt-1 block leading-5">The ZIP includes standalone JavaScript and typed TypeScript modules.</span></div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3"><strong className="block text-[var(--color-text-primary)]">Privacy review</strong><span className="mt-1 block leading-5">Exports contain the sample input and replacement output. Remove real credentials first.</span></div>
        </div>
      </section>
    </div>
  );
}
