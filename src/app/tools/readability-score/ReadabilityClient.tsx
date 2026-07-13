"use client";

import { useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Files,
  Gauge,
  Import,
  ListChecks,
  Sparkles,
  Target,
} from "lucide-react";
import { Button, CopyButton, Select, Textarea } from "@/components/ui";
import { downloadText } from "../_shared/clientUtils";
import {
  buildMarkdownReport,
  buildReadabilityJson,
  buildSentenceCsv,
  computeReadability,
  extractWords,
} from "./readability";
import { getReadabilityTarget, READABILITY_PRESETS, READABILITY_TARGETS } from "./presets";
import type {
  ReadabilityCheckLevel,
  ReadabilityResult,
  ReadabilityTargetId,
  SentenceIssue,
} from "./types";

const INITIAL_PRESET = READABILITY_PRESETS[0]!;

type WorkspaceView = "overview" | "sentences" | "words" | "checks";

const CHECK_STYLES: Record<ReadabilityCheckLevel, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

const ISSUE_LABELS: Record<SentenceIssue, string> = {
  long: "Long",
  "very-long": "Very long",
  complex: "Complex words",
  "possible-passive": "Possible passive",
};

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]"><div className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div><div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]">{value}</div><div className="mt-0.5 truncate text-[11px] text-[var(--color-text-tertiary)]">{hint}</div></div>;
}

function scoreTone(value: number, target: number, higherIsBetter = false): string {
  const met = higherIsBetter ? value >= target : value <= target;
  return met ? "text-[var(--color-success-text)]" : "text-[var(--color-warning-text)]";
}

function formatMinutes(minutes: number): string {
  if (minutes < 1) return "< 1 min";
  return `${Math.max(1, Math.round(minutes))} min`;
}

function metricRange(result: ReadabilityResult): { min: number; max: number } {
  const grades = [result.fleschKincaidGrade, result.gunningFog, result.smogIndex, result.colemanLiauIndex];
  return { min: Math.min(...grades), max: Math.max(...grades) };
}

export default function ReadabilityClient() {
  const [text, setText] = useState(INITIAL_PRESET.text);
  const [targetId, setTargetId] = useState<ReadabilityTargetId>(INITIAL_PRESET.targetId);
  const [view, setView] = useState<WorkspaceView>("overview");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const target = useMemo(() => getReadabilityTarget(targetId), [targetId]);
  const result = useMemo(() => computeReadability(text, target), [text, target]);
  const rawWordCount = useMemo(() => extractWords(text).length, [text]);
  const reportMarkdown = useMemo(() => result ? buildMarkdownReport(result) : "", [result]);
  const reportJson = useMemo(() => result ? buildReadabilityJson(result, text) : "", [result, text]);
  const sentenceCsv = useMemo(() => result ? buildSentenceCsv(result) : "", [result]);
  const reviewCount = result?.checks.filter((check) => check.level === "warning" || check.level === "danger").length ?? 0;
  const range = result ? metricRange(result) : null;
  const targetMet = Boolean(result && result.consensusGrade <= target.maxGrade && result.fleschReadingEase >= target.minReadingEase);

  function applyPreset(presetId: string) {
    const preset = READABILITY_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setText(preset.text);
    setTargetId(preset.targetId);
    setView("overview");
  }

  function importFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(typeof reader.result === "string" ? reader.result : "");
    reader.readAsText(file);
  }

  async function downloadAuditPack() {
    if (!result) return;
    const zip = new JSZip();
    zip.file("source-text.txt", text);
    zip.file("readability-report.md", reportMarkdown);
    zip.file("readability-report.json", reportJson);
    zip.file("sentence-review.csv", sentenceCsv);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "readability-audit-pack.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <div className="space-y-4">
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Consensus grade" value={result ? result.consensusGrade.toFixed(1) : "—"} hint={result ? `Target: grade ${target.maxGrade} or below` : "Add at least three words"} />
      <SummaryCard label="Reading ease" value={result ? result.fleschReadingEase.toFixed(1) : "—"} hint={result ? `${result.label} · target ${target.minReadingEase}+` : "English prose only"} />
      <SummaryCard label="Text structure" value={result ? `${result.wordCount} words` : `${rawWordCount} words`} hint={result ? `${result.sentenceCount} sentences · ${result.paragraphCount} paragraphs` : "Waiting for analyzable text"} />
      <SummaryCard label="Production review" value={result ? (targetMet ? "On target" : `${reviewCount} flag${reviewCount === 1 ? "" : "s"}`) : "—"} hint={result ? `${result.confidence} confidence · ${formatMinutes(result.estimatedReadingMinutes)} read` : "Choose an audience target"} />
    </div>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
      <section className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3">
          <div><h2 className="font-bold text-[var(--color-text-primary)]">Readability workspace</h2><p className="text-xs text-[var(--color-text-tertiary)]">Analyze English prose, inspect the exact problem sentences, and export an editorial audit.</p></div>
          <div className="flex flex-wrap gap-2">
            <input ref={fileInputRef} type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" className="hidden" onChange={(event) => { importFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
            <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}><Import className="h-4 w-4" />Import text</Button>
            <Button size="sm" variant="ghost" onClick={() => setText("")} disabled={!text}>Clear</Button>
          </div>
        </div>

        <div className="p-4">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={10}
            aria-label="English text to analyze"
            placeholder="Paste an article, support page, policy, essay, or documentation draft…"
            className="min-h-[250px] resize-y leading-7"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--color-text-tertiary)]">
            <span>{text.length.toLocaleString()} characters · {rawWordCount.toLocaleString()} detected words</span>
            <span>Calculated locally · English formulas</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 border-y border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-2">
          {([
            ["overview", "Overview"],
            ["sentences", `Sentence review${result ? ` (${result.longSentenceCount})` : ""}`],
            ["words", `Complex words${result ? ` (${result.uniqueComplexWordCount})` : ""}`],
            ["checks", `Production checks${result ? ` (${reviewCount})` : ""}`],
          ] as const).map(([id, label]) => <Button key={id} size="sm" variant={view === id ? "primary" : "ghost"} onClick={() => setView(id)}>{label}</Button>)}
        </div>

        {!result && <div className="flex min-h-48 items-center justify-center p-6 text-center text-sm text-[var(--color-text-tertiary)]">Enter at least three English words to generate an estimate. Longer samples produce more stable comparisons.</div>}

        {result && view === "overview" && <div className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Flesch-Kincaid", value: result.fleschKincaidGrade, hint: "Grade" },
              { label: "Gunning Fog", value: result.gunningFog, hint: "Grade" },
              { label: "SMOG", value: result.smogIndex, hint: "Grade" },
              { label: "Coleman-Liau", value: result.colemanLiauIndex, hint: "Grade" },
              { label: "Reading Ease", value: result.fleschReadingEase, hint: "0–100" },
            ].map((metric) => <div key={metric.label} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3 text-center"><div className="font-mono text-2xl font-black text-[var(--color-text-primary)]">{metric.value.toFixed(1)}</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">{metric.label}</div><div className="text-[10px] text-[var(--color-text-tertiary)]">{metric.hint}</div></div>)}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-4">
              <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Target className="h-4 w-4" />Audience target</div>
              <div className="space-y-3">
                <div><div className="mb-1 flex items-center justify-between text-xs"><span>Consensus grade</span><span className={`font-mono font-bold ${scoreTone(result.consensusGrade, target.maxGrade)}`}>{result.consensusGrade.toFixed(1)} / ≤ {target.maxGrade}</span></div><div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.min(100, (result.consensusGrade / Math.max(1, target.maxGrade * 1.5)) * 100)}%` }} /></div></div>
                <div><div className="mb-1 flex items-center justify-between text-xs"><span>Reading ease</span><span className={`font-mono font-bold ${scoreTone(result.fleschReadingEase, target.minReadingEase, true)}`}>{result.fleschReadingEase.toFixed(1)} / ≥ {target.minReadingEase}</span></div><div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${result.fleschReadingEase}%` }} /></div></div>
                <div className={`rounded-[var(--radius-sm)] border p-2.5 text-xs ${targetMet ? CHECK_STYLES.success : CHECK_STYLES.warning}`}>{targetMet ? "Both headline targets are currently met." : "At least one headline target needs editorial review."}</div>
              </div>
            </section>

            <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-4">
              <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><BarChart3 className="h-4 w-4" />Diagnostic profile</div>
              <dl className="space-y-2 text-sm">
                {[
                  ["Average sentence", `${result.averageWordsPerSentence.toFixed(1)} words`],
                  ["Complex-word density", `${result.complexWordPercent.toFixed(1)}%`],
                  ["Average word", `${result.averageSyllablesPerWord.toFixed(2)} syllables`],
                  ["Grade metric spread", range ? `${range.min.toFixed(1)}–${range.max.toFixed(1)}` : "—"],
                  ["Possible passive sentences", result.possiblePassiveSentenceCount.toLocaleString()],
                ].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-2 last:border-0 last:pb-0"><dt className="text-[var(--color-text-tertiary)]">{label}</dt><dd className="text-right font-mono font-semibold text-[var(--color-text-primary)]">{value}</dd></div>)}
              </dl>
            </section>
          </div>

          <section className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
            <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Sparkles className="h-4 w-4" />Recommended editing order</div>
            <ol className="space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">{result.recommendations.map((recommendation, index) => <li key={recommendation} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] font-mono text-[11px] font-bold text-[var(--color-primary)]">{index + 1}</span><span>{recommendation}</span></li>)}</ol>
          </section>
        </div>}

        {result && view === "sentences" && <div className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-bold text-[var(--color-text-primary)]">Sentence-level review</h3><p className="text-xs text-[var(--color-text-tertiary)]">Flagged sentences appear first. Threshold: {target.maxSentenceWords} words for {target.label.toLowerCase()}.</p></div><CopyButton text={sentenceCsv} size="sm" variant="secondary">Copy CSV</CopyButton></div>
          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {[...result.sentences].sort((a, b) => Number(b.issues.length > 0) - Number(a.issues.length > 0) || b.wordCount - a.wordCount).map((sentence) => <article key={sentence.id} className={`rounded-[var(--radius-md)] border p-3 ${sentence.issues.length > 0 ? "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)]" : "border-[var(--color-border-subtle)]"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">Sentence {sentence.index + 1}</div><div className="flex flex-wrap gap-1">{sentence.issues.length > 0 ? sentence.issues.map((issue) => <span key={issue} className="rounded-full border border-current px-2 py-0.5 text-[10px] font-semibold text-[var(--color-warning-text)]">{ISSUE_LABELS[issue]}</span>) : <span className="rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-success-text)]">No flag</span>}</div></div>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-primary)]">{sentence.text}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-[var(--color-text-tertiary)]"><span>{sentence.wordCount} words</span><span>{sentence.complexWordCount} complex</span><span>{sentence.complexWordPercent.toFixed(1)}% complex</span><span>{sentence.syllableCount} syllables</span></div>
            </article>)}
          </div>
        </div>}

        {result && view === "words" && <div className="p-4">
          <div className="mb-3"><h3 className="font-bold text-[var(--color-text-primary)]">Complex-word inventory</h3><p className="text-xs text-[var(--color-text-tertiary)]">Words with three or more estimated syllables. Review repeated terms first, but keep necessary technical language.</p></div>
          {result.complexWords.length === 0 ? <div className="rounded-[var(--radius-md)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-4 text-sm text-[var(--color-success-text)]">No complex words were detected by the syllable heuristic.</div> : <div className="max-h-[580px] overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]"><table className="w-full min-w-[560px] border-collapse text-left text-xs"><thead className="sticky top-0 bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]"><tr><th className="px-3 py-2 font-semibold">Word</th><th className="px-3 py-2 font-semibold">Syllables</th><th className="px-3 py-2 font-semibold">Occurrences</th><th className="px-3 py-2 font-semibold">Sentences</th><th className="px-3 py-2 font-semibold">Editorial action</th></tr></thead><tbody>{result.complexWords.map((word) => <tr key={word.normalized} className="border-t border-[var(--color-border-subtle)]"><td className="px-3 py-2 font-mono font-bold text-[var(--color-text-primary)]">{word.word}</td><td className="px-3 py-2 font-mono">{word.syllables}</td><td className="px-3 py-2 font-mono">{word.occurrences}</td><td className="px-3 py-2 font-mono">{word.sentenceIndexes.map((index) => index + 1).join(", ")}</td><td className="px-3 py-2 text-[var(--color-text-tertiary)]">{word.occurrences > 1 ? "Review repeated usage first" : "Keep if precision requires it"}</td></tr>)}</tbody></table></div>}
        </div>}

        {result && view === "checks" && <div className="grid gap-2 p-4 md:grid-cols-2">{result.checks.map((check) => <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}><div className="flex items-start gap-2">{check.level === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : check.level === "warning" || check.level === "danger" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <ListChecks className="mt-0.5 h-4 w-4 shrink-0" />}<div><div className="font-bold">{check.title}</div><p className="mt-1 text-xs leading-5 opacity-90">{check.message}</p></div></div></div>)}</div>}
      </section>

      <aside className="space-y-3">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
          <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Target className="h-4 w-4" />Audience target</div>
          <label className="text-xs font-semibold text-[var(--color-text-muted)]">Writing profile<Select className="mt-1" value={targetId} onChange={(event) => setTargetId(event.target.value as ReadabilityTargetId)}>{READABILITY_TARGETS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></label>
          <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">{target.description}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-center"><div className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-2"><dt className="text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">Max grade</dt><dd className="font-mono text-lg font-black text-[var(--color-text-primary)]">{target.maxGrade}</dd></div><div className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-2"><dt className="text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">Max sentence</dt><dd className="font-mono text-lg font-black text-[var(--color-text-primary)]">{target.maxSentenceWords}</dd></div></dl>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
          <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><BookOpen className="h-4 w-4" />Practical presets</div>
          <div className="space-y-2">{READABILITY_PRESETS.map((preset) => <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-2.5 text-left transition hover:border-[var(--color-accent)]"><div className="text-sm font-bold text-[var(--color-text-primary)]">{preset.label}</div><div className="mt-0.5 text-[11px] leading-4 text-[var(--color-text-tertiary)]">{preset.description}</div></button>)}</div>
        </section>

        <section className="space-y-2 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Files className="h-4 w-4" />Editorial exports</div>
          <CopyButton text={reportMarkdown} className="w-full" disabled={!result}>Copy audit summary</CopyButton>
          <Button className="w-full" variant="secondary" disabled={!result} onClick={() => downloadText("readability-report.md", reportMarkdown, "text/markdown;charset=utf-8")}><FileText className="h-4 w-4" />Download Markdown</Button>
          <Button className="w-full" variant="secondary" disabled={!result} onClick={() => downloadText("readability-report.json", reportJson, "application/json;charset=utf-8")}><FileJson className="h-4 w-4" />Download JSON</Button>
          <Button className="w-full" variant="secondary" disabled={!result} onClick={() => downloadText("sentence-review.csv", sentenceCsv, "text/csv;charset=utf-8")}><FileSpreadsheet className="h-4 w-4" />Download sentence CSV</Button>
          <Button className="w-full" disabled={!result} onClick={downloadAuditPack}><Download className="h-4 w-4" />Download audit pack</Button>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-xs leading-5 text-[var(--color-info-text)]">
          <div className="flex items-center gap-2 font-bold"><Gauge className="h-4 w-4" />Use scores as signals</div>
          <p className="mt-1">Formulas estimate sentence and word difficulty. They cannot judge factual accuracy, inclusive language, tone, or whether a technical term is necessary.</p>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-xs text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]"><Clock3 className="h-4 w-4" />Private browser analysis</div>
          <p className="mt-1 leading-5">Your text stays in this tab. Import and export actions use local browser APIs.</p>
        </section>
      </aside>
    </div>
  </div>;
}
