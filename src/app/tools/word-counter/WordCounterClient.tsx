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
  MessageSquareText,
  Search,
  Settings2,
  Sparkles,
  Target,
  TextCursorInput,
} from "lucide-react";
import { Button, CopyButton, Input, Select, Textarea } from "@/components/ui";
import { downloadText } from "../_shared/clientUtils";
import {
  buildJsonReport,
  buildKeywordCsv,
  buildMarkdownReport,
  buildSentenceCsv,
  computeWordStats,
  formatDuration,
} from "./stats";
import { getWordCounterGoal, WORD_COUNTER_GOALS, WORD_COUNTER_PRESETS } from "./presets";
import type {
  WordCounterCheckLevel,
  WordCounterGoal,
  WordCounterMetric,
} from "./types";

const INITIAL_PRESET = WORD_COUNTER_PRESETS[0]!;

type WorkspaceView = "overview" | "keywords" | "structure" | "checks";

const CHECK_STYLES: Record<WordCounterCheckLevel, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

const FLAG_LABELS = {
  long: "Long",
  "very-long": "Very long",
  fragment: "Possible fragment",
  "all-caps": "All caps",
  dense: "Dense",
  "single-sentence": "Single sentence",
} as const;

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="truncate font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]">{value}</div>
      <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div>
    </div>
  );
}

function goalMetricLabel(metric: WordCounterMetric): string {
  if (metric === "characters-no-spaces") return "characters without spaces";
  return metric;
}

function goalStatusLabel(status: "empty" | "below" | "within" | "above"): string {
  if (status === "within") return "On target";
  if (status === "below") return "Below target";
  if (status === "above") return "Above limit";
  return "Waiting for text";
}

function goalHint(goal: WordCounterGoal): string {
  const unit = goalMetricLabel(goal.metric);
  if (goal.min !== undefined && goal.max !== undefined) return `${goal.min.toLocaleString()}–${goal.max.toLocaleString()} ${unit}`;
  if (goal.max !== undefined) return `Maximum ${goal.max.toLocaleString()} ${unit}`;
  if (goal.min !== undefined) return `Minimum ${goal.min.toLocaleString()} ${unit}`;
  return `Custom ${unit} target`;
}

function percentageWidth(value: number): string {
  return `${Math.min(100, Math.max(0, value))}%`;
}

export default function WordCounterClient() {
  const [text, setText] = useState(INITIAL_PRESET.text);
  const [goalId, setGoalId] = useState(INITIAL_PRESET.goalId);
  const [customMetric, setCustomMetric] = useState<WordCounterMetric>("words");
  const [customMin, setCustomMin] = useState("0");
  const [customMax, setCustomMax] = useState("1000");
  const [readingWpm, setReadingWpm] = useState("200");
  const [speakingWpm, setSpeakingWpm] = useState("130");
  const [includeStopWords, setIncludeStopWords] = useState(false);
  const [view, setView] = useState<WorkspaceView>("overview");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const goal = useMemo<WordCounterGoal>(() => {
    if (goalId !== "custom") return getWordCounterGoal(goalId);
    const min = customMin.trim() === "" ? undefined : Number(customMin);
    const max = customMax.trim() === "" ? undefined : Number(customMax);
    return {
      id: "custom",
      label: "Custom target",
      description: "A custom writing target configured in this workspace.",
      metric: customMetric,
      min: Number.isFinite(min) && min! >= 0 ? min : undefined,
      max: Number.isFinite(max) && max! >= 0 ? max : undefined,
    };
  }, [customMax, customMetric, customMin, goalId]);

  const options = useMemo(() => ({
    readingWpm: Math.max(1, Number(readingWpm) || 200),
    speakingWpm: Math.max(1, Number(speakingWpm) || 130),
    includeStopWords,
    goal,
  }), [goal, includeStopWords, readingWpm, speakingWpm]);

  const stats = useMemo(() => computeWordStats(text, options), [options, text]);
  const markdownReport = useMemo(() => buildMarkdownReport(stats, goal), [goal, stats]);
  const jsonReport = useMemo(() => buildJsonReport(stats, goal), [goal, stats]);
  const keywordCsv = useMemo(() => buildKeywordCsv(stats), [stats]);
  const sentenceCsv = useMemo(() => buildSentenceCsv(stats), [stats]);
  const reviewCount = stats.checks.filter((check) => check.level === "warning" || check.level === "danger").length;
  const flaggedSentences = stats.sentenceAnalysis.filter((sentence) => sentence.flags.length > 0);
  const flaggedParagraphs = stats.paragraphAnalysis.filter((paragraph) => paragraph.flags.length > 0);
  const maxKeywordCount = stats.topWords[0]?.count ?? 0;
  const maxBucketCount = Math.max(1, ...stats.sentenceBuckets.map((bucket) => bucket.count));

  function applyPreset(id: string) {
    const preset = WORD_COUNTER_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setText(preset.text);
    setGoalId(preset.goalId);
    setView("overview");
  }

  function importFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(typeof reader.result === "string" ? reader.result : "");
    reader.readAsText(file);
  }

  async function downloadAuditPack() {
    const zip = new JSZip();
    zip.file("source-text.txt", text);
    zip.file("word-count-report.md", markdownReport);
    zip.file("word-count-report.json", jsonReport);
    zip.file("keyword-density.csv", keywordCsv);
    zip.file("sentence-review.csv", sentenceCsv);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "word-counter-audit-pack.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]"><TextCursorInput className="h-4 w-4 text-[var(--color-primary-text-strong)]" />Write, measure, then review</div>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">Paste or import a draft first. Live counts stay beside the writing task; deeper keyword, structure, goal, and production review come after the text is in place.</p>
          </div>
          <div className="rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-3 py-1 text-xs font-bold text-[var(--color-success-text)]">Local only · no upload</div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3">
            <div>
              <h2 className="font-bold text-[var(--color-text-primary)]">1. Write or paste text</h2>
              <p className="text-xs text-[var(--color-text-tertiary)]">Start with the draft. Counts update immediately, then use the inspector below for repetition, structure, and readiness.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.markdown,text/plain,text/markdown"
                className="hidden"
                onChange={(event) => {
                  importFile(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}><Import className="h-4 w-4" />Import</Button>
              <Button size="sm" variant="ghost" onClick={() => setText("")} disabled={!text}>Clear</Button>
            </div>
          </div>

          <div className="p-4">
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={10}
              aria-label="Text to count and analyze"
              placeholder="Paste an essay, article, caption, speech, description, or documentation draft…"
              className="min-h-[250px] resize-y leading-7"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-tertiary)]">
              <span>{stats.characters.toLocaleString()} characters · {stats.words.toLocaleString()} words · {stats.sentences.toLocaleString()} sentences</span>
              <span>Calculated locally · multilingual word detection</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 border-y border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-2">
            {([
              ["overview", "Overview"],
              ["keywords", `Keywords${stats.topWords.length ? ` (${stats.topWords.length})` : ""}`],
              ["structure", `Structure${flaggedSentences.length + flaggedParagraphs.length ? ` (${flaggedSentences.length + flaggedParagraphs.length})` : ""}`],
              ["checks", `Production checks (${reviewCount})`],
            ] as const).map(([id, label]) => <Button key={id} size="sm" variant={view === id ? "primary" : "ghost"} onClick={() => setView(id)}>{label}</Button>)}
          </div>

          {view === "overview" && (
            <div className="space-y-4 p-4">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]"><Target className="h-4 w-4 text-[var(--color-primary-text-strong)]" />{goal.label}</div>
                    <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{goal.description}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stats.goal.status === "within" ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]" : stats.goal.status === "above" ? "bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]" : "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]"}`}>{goalStatusLabel(stats.goal.status)}</span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-base)]">
                  <div className={`h-full rounded-full ${stats.goal.status === "above" ? "bg-[var(--color-danger)]" : stats.goal.status === "within" ? "bg-[var(--color-success)]" : "bg-[var(--color-primary)]"}`} style={{ width: percentageWidth(stats.goal.percent) }} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--color-text-tertiary)]">
                  <span>Current: {stats.goal.current.toLocaleString()} {goalMetricLabel(goal.metric)}</span>
                  <span>{goalHint(goal)}</span>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ["Words", stats.words],
                  ["Characters", stats.characters],
                  ["No spaces", stats.charactersNoSpaces],
                  ["Sentences", stats.sentences],
                  ["Paragraphs", stats.paragraphs],
                  ["Lines", stats.lines],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3 text-center">
                    <div className="font-mono text-xl font-black text-[var(--color-text-primary)]">{Number(value).toLocaleString()}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">{label}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-4">
                  <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><BarChart3 className="h-4 w-4 text-[var(--color-primary-text-strong)]" />Sentence length distribution</div>
                  <div className="mt-4 space-y-3">
                    {stats.sentenceBuckets.map((bucket) => (
                      <div key={bucket.id}>
                        <div className="flex items-center justify-between gap-3 text-xs"><span className="font-medium text-[var(--color-text-secondary)]">{bucket.label}</span><span className="font-mono text-[var(--color-text-tertiary)]">{bucket.count} · {bucket.percent.toFixed(1)}%</span></div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${(bucket.count / maxBucketCount) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-4">
                  <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Gauge className="h-4 w-4 text-[var(--color-primary-text-strong)]" />Writing profile</div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    {[
                      ["Unique words", stats.uniqueWords.toLocaleString()],
                      ["Lexical diversity", `${stats.lexicalDiversity.toFixed(1)}%`],
                      ["Avg. word length", `${stats.averageWordLength.toFixed(1)} chars`],
                      ["Avg. sentence", `${stats.averageSentenceWords.toFixed(1)} words`],
                      ["Avg. paragraph", `${stats.averageParagraphWords.toFixed(1)} words`],
                      ["Longest word", stats.longestWord || "—"],
                    ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-[var(--color-text-tertiary)]">{label}</dt><dd className="truncate font-mono font-semibold text-[var(--color-text-primary)]" title={value}>{value}</dd></div>)}
                  </dl>
                </div>
              </div>
            </div>
          )}

          {view === "keywords" && (
            <div className="grid gap-4 p-4 lg:grid-cols-2">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-4">
                <div className="flex items-center justify-between gap-3"><div><h3 className="font-bold text-[var(--color-text-primary)]">Top words</h3><p className="text-xs text-[var(--color-text-tertiary)]">Density uses the full document word count.</p></div><Search className="h-5 w-5 text-[var(--color-primary-text-strong)]" /></div>
                {stats.topWords.length ? <div className="mt-4 space-y-3">{stats.topWords.map((item) => <div key={item.word}><div className="flex items-center justify-between gap-3 text-sm"><span className="truncate font-semibold text-[var(--color-text-secondary)]">{item.word}</span><span className="font-mono text-xs text-[var(--color-text-tertiary)]">{item.count} · {item.density.toFixed(1)}%</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${maxKeywordCount ? (item.count / maxKeywordCount) * 100 : 0}%` }} /></div></div>)}</div> : <div className="mt-8 text-center text-sm text-[var(--color-text-tertiary)]">No meaningful keywords detected.</div>}
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-4">
                <div className="flex items-center justify-between gap-3"><div><h3 className="font-bold text-[var(--color-text-primary)]">Repeated phrases</h3><p className="text-xs text-[var(--color-text-tertiary)]">Two-word sequences that appear more than once.</p></div><MessageSquareText className="h-5 w-5 text-[var(--color-primary-text-strong)]" /></div>
                {stats.topPhrases.length ? <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]"><table className="w-full text-left text-sm"><thead className="bg-[var(--color-surface-subtle)] text-xs uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]"><tr><th className="px-3 py-2">Phrase</th><th className="px-3 py-2 text-right">Count</th><th className="px-3 py-2 text-right">Density</th></tr></thead><tbody>{stats.topPhrases.map((item) => <tr key={item.phrase} className="border-t border-[var(--color-border-subtle)]"><td className="max-w-0 truncate px-3 py-2 font-medium text-[var(--color-text-secondary)]">{item.phrase}</td><td className="px-3 py-2 text-right font-mono">{item.count}</td><td className="px-3 py-2 text-right font-mono">{item.density.toFixed(1)}%</td></tr>)}</tbody></table></div> : <div className="mt-8 text-center text-sm text-[var(--color-text-tertiary)]">No repeated two-word phrases detected.</div>}
              </div>
            </div>
          )}

          {view === "structure" && (
            <div className="grid gap-4 p-4 lg:grid-cols-2">
              <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-4">
                <div className="flex items-center justify-between gap-3"><div><h3 className="font-bold text-[var(--color-text-primary)]">Sentence review</h3><p className="text-xs text-[var(--color-text-tertiary)]">Fragments, long sentences, and all-caps text.</p></div><TextCursorInput className="h-5 w-5 text-[var(--color-primary-text-strong)]" /></div>
                <div className="mt-4 max-h-[420px] space-y-2 overflow-auto pr-1">
                  {(flaggedSentences.length ? flaggedSentences : stats.sentenceAnalysis.slice(0, 10)).map((sentence) => <div key={sentence.index} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">Sentence {sentence.index + 1} · {sentence.words} words</span><div className="flex flex-wrap gap-1">{sentence.flags.map((flag) => <span key={flag} className="rounded-full bg-[var(--color-warning-bg)] px-2 py-0.5 text-xs font-bold text-[var(--color-warning-text)]">{FLAG_LABELS[flag]}</span>)}</div></div><p className="mt-2 line-clamp-4 text-sm leading-6 text-[var(--color-text-secondary)]">{sentence.text}</p></div>)}
                  {!stats.sentenceAnalysis.length && <div className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">Add text to inspect sentence structure.</div>}
                </div>
              </div>

              <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-4">
                <div className="flex items-center justify-between gap-3"><div><h3 className="font-bold text-[var(--color-text-primary)]">Paragraph review</h3><p className="text-xs text-[var(--color-text-tertiary)]">Scan density and paragraph length.</p></div><BookOpen className="h-5 w-5 text-[var(--color-primary-text-strong)]" /></div>
                <div className="mt-4 max-h-[420px] space-y-2 overflow-auto pr-1">
                  {(flaggedParagraphs.length ? flaggedParagraphs : stats.paragraphAnalysis.slice(0, 10)).map((paragraph) => <div key={paragraph.index} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">Paragraph {paragraph.index + 1} · {paragraph.words} words · {paragraph.sentences} sentences</span><div className="flex flex-wrap gap-1">{paragraph.flags.map((flag) => <span key={flag} className="rounded-full bg-[var(--color-warning-bg)] px-2 py-0.5 text-xs font-bold text-[var(--color-warning-text)]">{FLAG_LABELS[flag]}</span>)}</div></div><p className="mt-2 line-clamp-5 text-sm leading-6 text-[var(--color-text-secondary)]">{paragraph.text}</p></div>)}
                  {!stats.paragraphAnalysis.length && <div className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">Add text to inspect paragraph structure.</div>}
                </div>
              </div>
            </div>
          )}

          {view === "checks" && (
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {stats.checks.map((check) => <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}><div className="flex items-start gap-2">{check.level === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}<div><h3 className="text-sm font-bold">{check.title}</h3><p className="mt-1 text-xs leading-5 opacity-90">{check.message}</p></div></div></div>)}
            </div>
          )}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Sparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" />Quick starts</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {WORD_COUNTER_PRESETS.map((preset) => <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-2.5 text-left transition hover:border-[var(--color-primary)]"><span className="block text-xs font-bold text-[var(--color-text-primary)]">{preset.label}</span><span className="mt-1 block line-clamp-2 text-xs leading-4 text-[var(--color-text-tertiary)]">{preset.description}</span></button>)}
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Target className="h-4 w-4 text-[var(--color-primary-text-strong)]" />2. Set a writing target</div>
            <label className="mt-3 block text-xs font-semibold text-[var(--color-text-muted)]">Target preset<Select className="mt-1" value={goalId} onChange={(event) => setGoalId(event.target.value)}>{WORD_COUNTER_GOALS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></label>
            <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">{goal.description}</p>
            {goalId === "custom" && <div className="mt-3 space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3"><label className="block text-xs font-semibold text-[var(--color-text-muted)]">Metric<Select className="mt-1" value={customMetric} onChange={(event) => setCustomMetric(event.target.value as WordCounterMetric)}><option value="words">Words</option><option value="characters">Characters</option><option value="characters-no-spaces">Characters without spaces</option></Select></label><div className="grid grid-cols-2 gap-2"><label className="text-xs font-semibold text-[var(--color-text-muted)]">Minimum<Input className="mt-1" type="number" min="0" value={customMin} onChange={(event) => setCustomMin(event.target.value)} /></label><label className="text-xs font-semibold text-[var(--color-text-muted)]">Maximum<Input className="mt-1" type="number" min="0" value={customMax} onChange={(event) => setCustomMax(event.target.value)} /></label></div></div>}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Settings2 className="h-4 w-4 text-[var(--color-primary-text-strong)]" />Analysis settings</div>
            <div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs font-semibold text-[var(--color-text-muted)]">Reading WPM<Input className="mt-1" type="number" min="1" max="1000" value={readingWpm} onChange={(event) => setReadingWpm(event.target.value)} /></label><label className="text-xs font-semibold text-[var(--color-text-muted)]">Speaking WPM<Input className="mt-1" type="number" min="1" max="1000" value={speakingWpm} onChange={(event) => setSpeakingWpm(event.target.value)} /></label></div>
            <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3"><input type="checkbox" checked={includeStopWords} onChange={(event) => setIncludeStopWords(event.target.checked)} className="mt-0.5" /><span><span className="block text-xs font-bold text-[var(--color-text-primary)]">Include common stop words</span><span className="mt-0.5 block text-xs leading-4 text-[var(--color-text-tertiary)]">Show words such as “the”, “and”, “في”, and “من” in keyword rankings.</span></span></label>
          </section>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-xs leading-5 text-[var(--color-info-text)]">
            <div className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" /><p>Reading and speaking times are estimates based on your selected words-per-minute rates. All analysis stays in your browser.</p></div>
          </div>
        </aside>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><BarChart3 className="h-4 w-4 text-[var(--color-primary-text-strong)]" />3. Document snapshot</div>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Review the main writing, timing, target, and production signals after the draft workspace.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setView("checks")}><ListChecks className="h-4 w-4" />Open production checks</Button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Writing goal" value={goalStatusLabel(stats.goal.status)} hint={`${stats.goal.current.toLocaleString()} · ${goalHint(goal)}`} />
          <SummaryCard label="Document size" value={`${stats.words.toLocaleString()} words`} hint={`${stats.characters.toLocaleString()} characters · ${stats.paragraphs} paragraphs`} />
          <SummaryCard label="Delivery time" value={formatDuration(stats.readingTimeSec)} hint={`${formatDuration(stats.speakingTimeSec)} spoken · ${stats.estimatedPages.toFixed(1)} pages`} />
          <SummaryCard label="Production review" value={reviewCount ? `${reviewCount} flag${reviewCount === 1 ? "" : "s"}` : "Ready"} hint={`${stats.uniqueWords.toLocaleString()} unique words · ${stats.lexicalDiversity.toFixed(1)}% diversity`} />
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Files className="h-4 w-4 text-[var(--color-primary-text-strong)]" />4. Production handoff</div>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Export the source evidence and the analysis separately, or package the complete local audit for handoff.</p>
          </div>
          <span className="text-xs text-[var(--color-text-tertiary)]">The ZIP includes source text, reports, keywords, and sentence review.</span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <CopyButton text={markdownReport} size="sm" variant="secondary"><FileText className="h-4 w-4" />Copy report</CopyButton>
          <Button size="sm" variant="secondary" onClick={() => downloadText("word-count-report.md", markdownReport)}><FileText className="h-4 w-4" />Markdown</Button>
          <Button size="sm" variant="secondary" onClick={() => downloadText("word-count-report.json", jsonReport)}><FileJson className="h-4 w-4" />JSON</Button>
          <Button size="sm" variant="secondary" onClick={() => downloadText("keyword-density.csv", keywordCsv)}><FileSpreadsheet className="h-4 w-4" />Keywords CSV</Button>
          <Button size="sm" variant="secondary" onClick={() => downloadText("sentence-review.csv", sentenceCsv)}><ListChecks className="h-4 w-4" />Sentences CSV</Button>
          <Button size="sm" variant="primary" onClick={downloadAuditPack}><Download className="h-4 w-4" />ZIP pack</Button>
        </div>
      </section>
    </div>
  );
}
