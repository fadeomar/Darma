"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Eye,
  FileCode2,
  FileJson,
  FileText,
  FolderOpen,
  Gauge,
  Heading,
  ListTree,
  Play,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button, CopyButton, Tabs, Textarea } from "@/components/ui";
import { downloadText } from "../_shared/clientUtils";
import { ToolMobileActions } from "@/features/tools/components/ToolMobileActions";
import {
  analyzeMarkdown,
  buildMarkdownReport,
  buildStandaloneHtml,
  renderMarkdownToHtml,
} from "./markdown";
import {
  DEFAULT_MARKDOWN_OPTIONS,
  MARKDOWN_INPUT_LIMIT,
  MARKDOWN_PRESETS,
  QUICK_EXAMPLES,
  SAMPLE_MARKDOWN,
} from "./presets";
import type {
  MarkdownCheckSeverity,
  MarkdownOptions,
  MarkdownPreset,
  MarkdownPreviewTheme,
  MarkdownPreviewWidth,
  MarkdownProductionCheck,
  MarkdownTab,
} from "./types";

const CHECK_STYLES: Record<MarkdownCheckSeverity, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

const PREVIEW_THEME_CLASSES: Record<MarkdownPreviewTheme, string> = {
  github: "prose prose-sm max-w-none dark:prose-invert prose-headings:scroll-mt-28 [&_h1]:border-b [&_h1]:border-[var(--color-border-subtle)] [&_h1]:pb-3 [&_.markdown-table-wrap]:overflow-x-auto [&_.markdown-task]:list-none",
  document: "prose max-w-none dark:prose-invert prose-headings:font-serif prose-headings:scroll-mt-28 prose-p:leading-8 [&_.markdown-table-wrap]:overflow-x-auto [&_.markdown-task]:list-none",
  compact: "prose prose-sm max-w-none dark:prose-invert prose-headings:scroll-mt-28 prose-headings:mb-2 prose-headings:mt-5 prose-p:my-2 prose-li:my-0 [&_.markdown-table-wrap]:overflow-x-auto [&_.markdown-task]:list-none",
};

const PREVIEW_WIDTH_CLASSES: Record<MarkdownPreviewWidth, string> = {
  full: "max-w-none",
  reading: "mx-auto max-w-3xl",
  mobile: "mx-auto max-w-[420px]",
};

function SummaryCard({ label, value, hint, tone = "neutral" }: { label: string; value: string; hint: string; tone?: "neutral" | "good" | "warning" | "danger" }) {
  const valueClass = tone === "good"
    ? "text-[var(--color-success-text)]"
    : tone === "warning"
      ? "text-[var(--color-warning-text)]"
      : tone === "danger"
        ? "text-[var(--color-danger-text)]"
        : "text-[var(--color-text-primary)]";

  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="truncate font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className={`mt-1 truncate text-xl font-black tracking-tight ${valueClass}`}>{value}</div>
      <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div>
    </div>
  );
}

function CheckIcon({ severity }: { severity: MarkdownCheckSeverity }) {
  if (severity === "success") return <CheckCircle2 className="h-4 w-4" aria-hidden />;
  if (severity === "danger") return <XCircle className="h-4 w-4" aria-hidden />;
  if (severity === "warning") return <AlertTriangle className="h-4 w-4" aria-hidden />;
  return <ShieldCheck className="h-4 w-4" aria-hidden />;
}

function qualityTone(score: number): "good" | "warning" | "danger" {
  if (score >= 85) return "good";
  if (score >= 60) return "warning";
  return "danger";
}

function safeFilename(title: string, extension: string) {
  const base = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "markdown-document";
  return `${base}.${extension}`;
}

export default function MarkdownPreviewerClient() {
  const [input, setInput] = useState(SAMPLE_MARKDOWN);
  const [committedInput, setCommittedInput] = useState(SAMPLE_MARKDOWN);
  const [tab, setTab] = useState<MarkdownTab>("preview");
  const [options, setOptions] = useState<MarkdownOptions>(DEFAULT_MARKDOWN_OPTIONS);
  const [previewWidth, setPreviewWidth] = useState<MarkdownPreviewWidth>("reading");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [fileError, setFileError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (options.livePreview) setCommittedInput(input);
  }, [input, options.livePreview]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        setCommittedInput(input);
        setTab("preview");
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [input]);

  const rendered = useMemo(() => renderMarkdownToHtml(committedInput, options), [committedInput, options]);
  const analysis = useMemo(() => analyzeMarkdown(input), [input]);
  const previewAnalysis = useMemo(() => analyzeMarkdown(committedInput), [committedInput]);
  const previewStale = !options.livePreview && input !== committedInput;
  const problemCount = analysis.checks.filter((check) => check.severity === "warning" || check.severity === "danger").length;
  const qualityLabel = analysis.score >= 85 ? "Ready" : analysis.score >= 60 ? "Review" : "Needs work";

  function updateInput(value: string) {
    setInput(value.slice(0, MARKDOWN_INPUT_LIMIT));
    setSelectedPreset("");
    setFileError(value.length > MARKDOWN_INPUT_LIMIT ? `Input was limited to ${MARKDOWN_INPUT_LIMIT.toLocaleString()} characters.` : "");
  }

  function applyPreset(preset: MarkdownPreset) {
    setInput(preset.content);
    setCommittedInput(preset.content);
    setSelectedPreset(preset.id);
    setTab("preview");
    setFileError("");
  }

  function resetTool() {
    setInput(SAMPLE_MARKDOWN);
    setCommittedInput(SAMPLE_MARKDOWN);
    setSelectedPreset("");
    setOptions(DEFAULT_MARKDOWN_OPTIONS);
    setPreviewWidth("reading");
    setTab("preview");
    setFileError("");
  }

  function renderNow() {
    setCommittedInput(input);
    setTab("preview");
  }

  function toggleOption(key: "livePreview" | "githubLineBreaks" | "openLinksInNewTab") {
    setOptions((current) => {
      const next = { ...current, [key]: !current[key] };
      if (key === "livePreview" && next.livePreview) setCommittedInput(input);
      return next;
    });
  }

  function setPreviewTheme(previewTheme: MarkdownPreviewTheme) {
    setOptions((current) => ({ ...current, previewTheme }));
  }

  function insertSyntax(syntax: string) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? input.length;
    const end = textarea?.selectionEnd ?? input.length;
    const prefix = start > 0 && input[start - 1] !== "\n" ? "\n" : "";
    const suffix = end < input.length && input[end] !== "\n" ? "\n" : "";
    const insertion = `${prefix}${syntax}${suffix}`;
    const next = `${input.slice(0, start)}${insertion}${input.slice(end)}`.slice(0, MARKDOWN_INPUT_LIMIT);
    setInput(next);
    setSelectedPreset("");
    window.requestAnimationFrame(() => {
      textarea?.focus();
      const cursor = Math.min(start + insertion.length, next.length);
      textarea?.setSelectionRange(cursor, cursor);
    });
  }

  async function importMarkdown(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 500_000) {
      setFileError("Choose a Markdown or text file smaller than 500 KB.");
      return;
    }
    try {
      const content = await file.text();
      if (content.length > MARKDOWN_INPUT_LIMIT) {
        setFileError(`The file exceeds the ${MARKDOWN_INPUT_LIMIT.toLocaleString()} character editor limit.`);
        return;
      }
      setInput(content);
      setCommittedInput(content);
      setSelectedPreset("");
      setTab("preview");
      setFileError("");
    } catch {
      setFileError("The selected file could not be read as text.");
    }
  }

  function getLatestExport() {
    const latestRendered = renderMarkdownToHtml(input, options);
    const latestAnalysis = analyzeMarkdown(input);
    return { latestRendered, latestAnalysis };
  }

  function downloadMarkdown() {
    downloadText(safeFilename(analysis.title, "md"), input, "text/markdown;charset=utf-8");
  }

  function downloadHtml() {
    const { latestRendered, latestAnalysis } = getLatestExport();
    downloadText(safeFilename(latestAnalysis.title, "html"), buildStandaloneHtml(latestRendered.sanitizedHtml, latestAnalysis.title), "text/html;charset=utf-8");
  }

  function downloadReport() {
    const { latestRendered, latestAnalysis } = getLatestExport();
    downloadText(safeFilename(latestAnalysis.title, "report.json"), buildMarkdownReport(input, latestRendered, latestAnalysis), "application/json;charset=utf-8");
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Start with a document or preset</h2>
              <span className="rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-[var(--color-success-text)]">Local only</span>
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Choose a practical starting point, then write, preview, inspect, and export without sending Markdown to a server.</p>
          </div>
          <Button size="sm" variant="ghost" leftIcon={<RefreshCcw className="h-3.5 w-3.5" />} onClick={resetTool}>Reset</Button>
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {MARKDOWN_PRESETS.map((preset) => (
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

      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section data-tool-region="input" className="order-1 flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-tool-input-border)] bg-[var(--color-tool-input-bg)] shadow-[var(--shadow-tool-controls)] lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
          <div className="flex flex-col gap-3 border-b border-[var(--color-tool-input-border)] bg-[var(--color-tool-input-header)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">1. Write Markdown</h2>
                <span className={`rounded-full border px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] ${options.livePreview ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]" : "border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]"}`}>{options.livePreview ? "Live" : "Manual"}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Edit locally, import a file, or insert common syntax. Press Ctrl/⌘ + Enter to refresh when live preview is off.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input ref={fileInputRef} type="file" accept=".md,.markdown,.mdown,.mkd,.txt,text/markdown,text/plain" className="hidden" onChange={importMarkdown} />
              <Button size="sm" variant="secondary" leftIcon={<FolderOpen className="h-3.5 w-3.5" />} onClick={() => fileInputRef.current?.click()}>Open file</Button>
              <Button size="sm" variant="secondary" onClick={() => applyPreset({ id: "sample", label: "Sample", category: "Sample", description: "", content: SAMPLE_MARKDOWN })}>Sample</Button>
              <Button size="sm" variant="ghost" onClick={() => { setInput(""); if (options.livePreview) setCommittedInput(""); setSelectedPreset(""); }}>Clear</Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 p-3.5 sm:p-4">
            <Textarea
              ref={textareaRef}
              variant="editor"
              value={input}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateInput(event.target.value)}
              minRows={19}
              spellCheck={false}
              placeholder="# Start your document"
              aria-invalid={Boolean(fileError) || undefined}
              className="min-h-[340px] flex-1 resize-y lg:min-h-[390px]"
            />
            <div className="flex flex-col gap-2 text-xs text-[var(--color-text-tertiary)] sm:flex-row sm:items-center sm:justify-between">
              <span className="font-mono">{input.length.toLocaleString()} / {MARKDOWN_INPUT_LIMIT.toLocaleString()} chars · {analysis.stats.words.toLocaleString()} words</span>
              {previewStale ? <span className="font-semibold text-[var(--color-warning-text)]">Preview has unpublished edits</span> : <span>Preview is synchronized</span>}
            </div>
            {fileError ? <p className="rounded-[var(--radius-sm)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-3 py-2 text-xs text-[var(--color-danger-text)]">{fileError}</p> : null}

            <div className="border-t border-[var(--color-border-subtle)] pt-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Quick syntax</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">Insert at cursor</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_EXAMPLES.map((example) => (
                  <button key={example.label} type="button" title={example.description} onClick={() => insertSyntax(example.syntax)} className="rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]">
                    {example.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="markdown-result" data-tool-region="preview" className="order-2 flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-tool-preview-border)] bg-[var(--color-tool-preview-bg)] shadow-[var(--shadow-tool-preview)]">
          <div className="flex flex-col gap-3 border-b border-[var(--color-tool-preview-border)] bg-[var(--color-tool-preview-header)] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Eye className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">2. Preview &amp; inspect</h2>
                {previewStale ? <span className="rounded-full border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-[var(--color-warning-text)]">Stale</span> : null}
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Always sanitized before rendering. Raw HTML never executes.</p>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Tabs<MarkdownTab>
                ariaLabel="Markdown output"
                value={tab}
                onChange={setTab}
                items={[
                  { value: "preview", label: "Preview" },
                  { value: "html", label: "HTML" },
                  { value: "source", label: "Source" },
                ]}
              />
              {!options.livePreview ? <Button size="sm" variant={previewStale ? "primary" : "secondary"} leftIcon={<Play className="h-3.5 w-3.5" />} onClick={renderNow}>Render</Button> : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/45 px-3 py-2.5">
            <div className="flex flex-wrap gap-1.5" aria-label="Preview width">
              {(["full", "reading", "mobile"] as MarkdownPreviewWidth[]).map((width) => (
                <Button key={width} size="sm" variant={previewWidth === width ? "soft" : "ghost"} onClick={() => setPreviewWidth(width)}>{width}</Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5" aria-label="Preview theme">
              {(["github", "document", "compact"] as MarkdownPreviewTheme[]).map((theme) => (
                <Button key={theme} size="sm" variant={options.previewTheme === theme ? "soft" : "ghost"} onClick={() => setPreviewTheme(theme)}>{theme}</Button>
              ))}
            </div>
          </div>

          <div className="min-h-[420px] flex-1 overflow-auto bg-[var(--color-tool-preview-bg)] p-3 sm:p-4">
            {tab === "preview" ? (
              <div className={`min-h-[380px] rounded-[var(--radius-md)] border border-[var(--color-preview-border)] bg-[var(--color-surface-base)] p-5 shadow-[var(--shadow-xs)] sm:p-7 ${PREVIEW_WIDTH_CLASSES[previewWidth]}`}>
                {rendered.warnings.length ? (
                  <div className="mb-4 space-y-2">
                    {rendered.warnings.map((warning) => <div key={warning} className="rounded-[var(--radius-sm)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-3 py-2 text-xs text-[var(--color-warning-text)]">{warning}</div>)}
                  </div>
                ) : null}
                {committedInput.trim() ? (
                  <div className={PREVIEW_THEME_CLASSES[options.previewTheme]} dangerouslySetInnerHTML={{ __html: rendered.sanitizedHtml }} />
                ) : (
                  <div className="flex min-h-[330px] items-center justify-center text-center text-sm text-[var(--color-text-tertiary)]">Add Markdown to see a sanitized preview.</div>
                )}
              </div>
            ) : (
              <div className="min-h-[380px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)]">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--color-code-border)] bg-[var(--color-code-surface)] px-3 py-2.5">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-code-text)]">{tab === "html" ? <Code2 className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}{tab === "html" ? "Sanitized HTML fragment" : "Previewed Markdown source"}</span>
                  <CopyButton text={tab === "html" ? rendered.sanitizedHtml : committedInput} size="sm" variant="soft">Copy</CopyButton>
                </div>
                <pre className="max-h-[460px] min-h-[335px] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-6 text-[var(--color-code-text)]"><code>{tab === "html" ? rendered.sanitizedHtml : committedInput}</code></pre>
              </div>
            )}
          </div>
        </section>
      </div>

      <ToolMobileActions
        primary={<a href="#markdown-result" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-bold text-[var(--color-text-inverse)]">View preview</a>}
        secondary={!options.livePreview ? <Button size="sm" variant="secondary" onClick={renderNow}>Render</Button> : <CopyButton text={rendered.sanitizedHtml} size="sm" variant="secondary">Copy HTML</CopyButton>}
      />

      <section className="space-y-3" aria-label="Markdown analysis summary">
        <div className="flex flex-wrap items-end justify-between gap-2 px-1">
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">3. Document snapshot</h2>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Review quality and structure after you have seen the rendered document.</p>
          </div>
          <span className="text-xs text-[var(--color-text-tertiary)]">Analysis follows the latest editor content.</span>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <SummaryCard label="Quality" value={`${analysis.score}/100`} hint={`${qualityLabel} · ${problemCount} review item${problemCount === 1 ? "" : "s"}`} tone={qualityTone(analysis.score)} />
        <SummaryCard label="Document" value={`${analysis.stats.words.toLocaleString()} words`} hint={`${analysis.stats.readingTimeMinutes} min read · ${analysis.stats.lines} lines`} />
        <SummaryCard label="Structure" value={`${analysis.stats.headings} headings`} hint={`${analysis.stats.listItems} list items · ${analysis.stats.tables} tables`} />
        <SummaryCard label="Assets" value={`${analysis.stats.links} links`} hint={`${analysis.stats.codeBlocks} code blocks · ${analysis.stats.images} images`} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">4. Preview behavior &amp; document outline</h2>
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Tune refresh and link behavior, then use the generated outline to inspect document structure.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={input} size="sm" variant="secondary">Copy Markdown</CopyButton>
            <CopyButton text={rendered.sanitizedHtml} size="sm" variant="secondary">Copy preview HTML</CopyButton>
          </div>
        </div>
        <div className="grid gap-4 p-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)] sm:p-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <button type="button" aria-pressed={options.livePreview} onClick={() => toggleOption("livePreview")} className={`rounded-[var(--radius-md)] border p-3 text-left transition focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ${options.livePreview ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-border-default)] bg-[var(--color-surface-base)]"}`}>
              <span className="block text-xs font-bold text-[var(--color-text-primary)]">Live preview</span>
              <span className="mt-1 block text-xs leading-4 text-[var(--color-text-tertiary)]">{options.livePreview ? "Refreshes while typing" : "Refresh only on command"}</span>
            </button>
            <button type="button" aria-pressed={options.githubLineBreaks} onClick={() => toggleOption("githubLineBreaks")} className={`rounded-[var(--radius-md)] border p-3 text-left transition focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ${options.githubLineBreaks ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-border-default)] bg-[var(--color-surface-base)]"}`}>
              <span className="block text-xs font-bold text-[var(--color-text-primary)]">GitHub line breaks</span>
              <span className="mt-1 block text-xs leading-4 text-[var(--color-text-tertiary)]">{options.githubLineBreaks ? "Single newlines render" : "Paragraphs wrap normally"}</span>
            </button>
            <button type="button" aria-pressed={options.openLinksInNewTab} onClick={() => toggleOption("openLinksInNewTab")} className={`rounded-[var(--radius-md)] border p-3 text-left transition focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ${options.openLinksInNewTab ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-border-default)] bg-[var(--color-surface-base)]"}`}>
              <span className="block text-xs font-bold text-[var(--color-text-primary)]">External link tabs</span>
              <span className="mt-1 block text-xs leading-4 text-[var(--color-text-tertiary)]">{options.openLinksInNewTab ? "Adds noopener + noreferrer" : "Links use the same tab"}</span>
            </button>
          </div>

          <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ListTree className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
                <h3 className="text-xs font-bold text-[var(--color-text-primary)]">Document outline</h3>
              </div>
              <span className="text-xs text-[var(--color-text-tertiary)]">{previewAnalysis.headings.length} sections</span>
            </div>
            <div className="mt-3 max-h-44 space-y-1 overflow-auto pr-1">
              {previewAnalysis.headings.length ? previewAnalysis.headings.map((item) => (
                <button key={`${item.slug}-${item.line}`} type="button" onClick={() => document.getElementById(item.slug)?.scrollIntoView({ behavior: "smooth", block: "start" })} className="flex w-full min-w-0 items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs text-[var(--color-text-secondary)] transition hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]" style={{ paddingInlineStart: `${Math.min(item.level, 4) * 0.5}rem` }}>
                  <Heading className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{item.text}</span>
                  <span className="ml-auto shrink-0 font-mono text-xs text-[var(--color-text-tertiary)]">H{item.level}</span>
                </button>
              )) : <p className="py-5 text-center text-xs text-[var(--color-text-tertiary)]">Add headings to create a navigable outline.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">5. Production checks</h2>
          </div>
          <span className="text-xs text-[var(--color-text-tertiary)]">Structure, safety, portability, links, accessibility, and editor size.</span>
        </div>
        <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-3">
          {analysis.checks.map((check: MarkdownProductionCheck) => (
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
              <FileCode2 className="h-4 w-4 text-[var(--color-primary-text-strong)]" aria-hidden />
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">6. Production handoff</h2>
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Download the source, a portable sanitized HTML document, or a structured analysis report.</p>
          </div>
          <span className="rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-[var(--color-success-text)]">Safe local export</span>
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-3">
          <Button variant="secondary" leftIcon={<FileText className="h-4 w-4" />} onClick={downloadMarkdown}>Download .md</Button>
          <Button variant="secondary" leftIcon={<FileCode2 className="h-4 w-4" />} onClick={downloadHtml}>Standalone HTML</Button>
          <Button variant="secondary" leftIcon={<FileJson className="h-4 w-4" />} onClick={downloadReport}>JSON report</Button>
        </div>
      </section>
    </div>
  );
}
