"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FileText,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  CopyButton,
  Field,
  Tabs,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  DEFAULT_MARKDOWN_OPTIONS,
  MARKDOWN_INPUT_LIMIT,
  QUICK_EXAMPLES,
  SAMPLE_MARKDOWN,
} from "./presets";
import { getMarkdownStats, renderMarkdownToHtml } from "./markdown";
import type { MarkdownOptions, MarkdownTab } from "./types";

const TAB_ITEMS: { value: MarkdownTab; label: string }[] = [
  { value: "write", label: "Write" },
  { value: "preview", label: "Preview" },
  { value: "html", label: "HTML" },
];

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3",
        disabled && "cursor-not-allowed opacity-70",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
      />
      <span>
        <span className="block text-sm font-bold text-[var(--color-text)]">
          {label}
        </span>
        <span className="block text-xs leading-5 text-[var(--color-text-muted)]">
          {description}
        </span>
      </span>
    </label>
  );
}

export default function MarkdownPreviewerClient() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [renderedMarkdown, setRenderedMarkdown] = useState(SAMPLE_MARKDOWN);
  const [options, setOptions] = useState<MarkdownOptions>(
    DEFAULT_MARKDOWN_OPTIONS,
  );
  const [activeTab, setActiveTab] = useState<MarkdownTab>("write");
  const [showHtmlOutput, setShowHtmlOutput] = useState(true);

  const isTooLarge = markdown.length > MARKDOWN_INPUT_LIMIT;
  const renderedIsTooLarge = renderedMarkdown.length > MARKDOWN_INPUT_LIMIT;
  const stats = useMemo(() => getMarkdownStats(markdown), [markdown]);
  const renderResult = useMemo(() => {
    if (renderedIsTooLarge) {
      return {
        html: "",
        sanitizedHtml: "",
        warnings: [
          `Markdown input is too large. Keep it under ${MARKDOWN_INPUT_LIMIT.toLocaleString()} characters.`,
        ],
      };
    }

    return renderMarkdownToHtml(renderedMarkdown, options);
  }, [renderedIsTooLarge, renderedMarkdown, options]);

  const previewHtml = renderResult.sanitizedHtml;

  function updateOption<Key extends keyof MarkdownOptions>(
    key: Key,
    value: MarkdownOptions[Key],
  ) {
    if (key === "sanitizeHtml" && value === false) return;
    setOptions((current) => ({ ...current, [key]: value }));
  }

  function handleMarkdownChange(value: string) {
    const nextValue = value.slice(0, MARKDOWN_INPUT_LIMIT + 1);
    setMarkdown(nextValue);
    if (options.livePreview) setRenderedMarkdown(nextValue);
  }

  function handleClear() {
    setMarkdown("");
    if (options.livePreview) setRenderedMarkdown("");
  }

  function handleLoadSample() {
    setMarkdown(SAMPLE_MARKDOWN);
    setRenderedMarkdown(SAMPLE_MARKDOWN);
  }

  const editor = (
    <Field
      label="Markdown input"
      description={`${stats.words} words · ${stats.characters.toLocaleString()} characters · about ${stats.readingTimeMinutes} min read`}
    >
      <Textarea
        value={markdown}
        onChange={(event) => handleMarkdownChange(event.target.value)}
        placeholder="Paste or write Markdown here..."
        className="min-h-[520px] font-mono text-sm leading-6"
      />
    </Field>
  );

  const preview = (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text-soft)]">
            Rendered preview
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Sanitized HTML rendered as readable content.
          </p>
        </div>
        <Badge variant="success" className="gap-1">
          <ShieldCheck className="h-3 w-3" aria-hidden /> Sanitized
        </Badge>
      </div>
      <div
        className="markdown-preview min-h-[520px] overflow-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-5 text-[var(--color-text)] shadow-[var(--shadow-soft)]"
        dangerouslySetInnerHTML={{
          __html: previewHtml || "<p>Preview will appear here.</p>",
        }}
      />
    </div>
  );

  const htmlOutput = (
    <Field
      label="HTML output"
      description="Copy the sanitized HTML output for docs, CMS blocks, or static pages."
    >
      <Textarea
        readOnly
        value={previewHtml}
        placeholder="Generated HTML will appear here."
        className="min-h-[300px] font-mono text-xs leading-5"
      />
    </Field>
  );

  return (
    <div className="space-y-6">
      <style jsx global>{`
        .markdown-preview h1 {
          font-size: 2rem;
          line-height: 1.2;
          font-weight: 900;
          margin: 0 0 1rem;
        }
        .markdown-preview h2 {
          font-size: 1.5rem;
          line-height: 1.25;
          font-weight: 850;
          margin: 1.4rem 0 0.75rem;
        }
        .markdown-preview h3 {
          font-size: 1.2rem;
          line-height: 1.3;
          font-weight: 800;
          margin: 1.2rem 0 0.6rem;
        }
        .markdown-preview h4,
        .markdown-preview h5,
        .markdown-preview h6 {
          font-weight: 800;
          margin: 1rem 0 0.5rem;
        }
        .markdown-preview p {
          margin: 0.75rem 0;
          line-height: 1.75;
        }
        .markdown-preview a {
          color: var(--color-primary);
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .markdown-preview ul,
        .markdown-preview ol {
          margin: 0.75rem 0 0.75rem 1.25rem;
          padding-left: 1rem;
        }
        .markdown-preview ul {
          list-style: disc;
        }
        .markdown-preview ol {
          list-style: decimal;
        }
        .markdown-preview li {
          margin: 0.35rem 0;
          line-height: 1.65;
        }
        .markdown-preview blockquote {
          margin: 1rem 0;
          border-left: 4px solid var(--color-primary);
          background: var(--color-bg-soft);
          border-radius: var(--radius-md);
          padding: 0.7rem 1rem;
          color: var(--color-text-muted);
        }
        .markdown-preview pre {
          margin: 1rem 0;
          overflow: auto;
          border-radius: var(--radius-md);
          background: #0f172a;
          padding: 1rem;
          color: #e2e8f0;
        }
        .markdown-preview code {
          border-radius: 0.35rem;
          background: var(--color-bg-soft);
          padding: 0.1rem 0.35rem;
          font-family:
            ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", monospace;
          font-size: 0.9em;
        }
        .markdown-preview pre code {
          background: transparent;
          padding: 0;
          color: inherit;
        }
        .markdown-preview table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          overflow: hidden;
          border-radius: var(--radius-md);
          font-size: 0.9rem;
        }
        .markdown-preview th,
        .markdown-preview td {
          border: 1px solid var(--color-border);
          padding: 0.65rem 0.75rem;
          text-align: left;
        }
        .markdown-preview th {
          background: var(--color-bg-soft);
          font-weight: 800;
        }
        .markdown-preview img {
          max-width: 100%;
          border-radius: var(--radius-md);
        }
        .markdown-preview hr {
          margin: 1.5rem 0;
          border: 0;
          border-top: 1px solid var(--color-border);
        }
      `}</style>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-[var(--color-text)]">
              Markdown Previewer
            </h2>
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="h-3 w-3" aria-hidden /> Browser-only
            </Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Write Markdown, preview rendered content, and copy sanitized HTML
            without uploading your notes or documentation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!options.livePreview ? (
            <Button
              onClick={() => setRenderedMarkdown(markdown)}
              disabled={isTooLarge}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Render preview
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onClick={handleLoadSample}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Load sample
          </Button>
          <Button
            variant="secondary"
            onClick={handleClear}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Clear
          </Button>
          <CopyButton text={markdown} disabled={!markdown} variant="secondary">
            Copy Markdown
          </CopyButton>
          <CopyButton
            text={previewHtml}
            disabled={!previewHtml}
            variant="secondary"
          >
            Copy HTML
          </CopyButton>
          <Button
            variant="secondary"
            onClick={() =>
              downloadFile("darma-markdown.md", markdown, "text/markdown")
            }
            disabled={!markdown}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Download .md
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              downloadFile("darma-markdown.html", previewHtml, "text/html")
            }
            disabled={!previewHtml}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Download .html
          </Button>
        </div>
      </div>

      {isTooLarge ? (
        <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          This input is over the {MARKDOWN_INPUT_LIMIT.toLocaleString()}{" "}
          character limit. Shorten it to resume preview generation.
        </div>
      ) : null}

      {renderResult.warnings.length ? (
        <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {renderResult.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <ToggleRow
          label="Live preview"
          description="Update the preview as you type."
          checked={options.livePreview}
          onChange={(value) => {
            updateOption("livePreview", value);
            if (value) setRenderedMarkdown(markdown);
          }}
        />
        <ToggleRow
          label="GitHub-style line breaks"
          description="Single line breaks render visibly."
          checked={options.githubLineBreaks}
          onChange={(value) => updateOption("githubLineBreaks", value)}
        />
        <ToggleRow
          label="Open links in new tab"
          description="Add target and safe rel attributes."
          checked={options.openLinksInNewTab}
          onChange={(value) => updateOption("openLinksInNewTab", value)}
        />
        <ToggleRow
          label="Sanitize HTML"
          description="Locked on to avoid unsafe preview output."
          checked={options.sanitizeHtml}
          disabled
          onChange={() => undefined}
        />
      </div>

      <div className="block lg:hidden">
        <Tabs
          items={TAB_ITEMS}
          value={activeTab}
          onChange={setActiveTab}
          ariaLabel="Markdown previewer panels"
        />
        <div className="mt-4">
          {activeTab === "write" ? editor : null}
          {activeTab === "preview" ? preview : null}
          {activeTab === "html" ? htmlOutput : null}
        </div>
      </div>

      <div className="hidden gap-5 lg:grid lg:grid-cols-2">
        {editor}
        {preview}
      </div>

      {showHtmlOutput ? (
        <div className="hidden lg:block">{htmlOutput}</div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-black text-[var(--color-text)]">
            <FileText className="h-4 w-4" aria-hidden /> Markdown quick examples
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Click any example to append it to the editor.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowHtmlOutput((value) => !value)}
        >
          {showHtmlOutput ? "Hide HTML output" : "Show HTML output"}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {QUICK_EXAMPLES.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => {
              const nextValue = `${markdown.trimEnd()}\n\n${example.syntax}\n`;
              setMarkdown(nextValue);
              if (options.livePreview) setRenderedMarkdown(nextValue);
            }}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-soft)]"
          >
            <span className="block text-sm font-black text-[var(--color-text)]">
              {example.label}
            </span>
            <code className="mt-2 block whitespace-pre-wrap rounded-[var(--radius-sm)] bg-[var(--color-bg-soft)] p-2 font-mono text-xs leading-5 text-[var(--color-text-muted)]">
              {example.syntax}
            </code>
            <span className="mt-2 block text-xs leading-5 text-[var(--color-text-muted)]">
              {example.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
