"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Tabs } from "@/components/ui";
import { CodeOutputPanel, EditorPanel, PreviewToolbar, ToolControlPanel, ControlSection, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { downloadText } from "../_shared/clientUtils";
import { getMarkdownStats, renderMarkdownToHtml } from "./markdown";
import { DEFAULT_MARKDOWN_OPTIONS, SAMPLE_MARKDOWN } from "./presets";
import type { MarkdownTab } from "./types";

export default function MarkdownPreviewerClient() {
  const [input, setInput] = useState(SAMPLE_MARKDOWN);
  const [tab, setTab] = useState<MarkdownTab>("preview");
  const [options, setOptions] = useState(DEFAULT_MARKDOWN_OPTIONS);
  const rendered = useMemo(() => renderMarkdownToHtml(input, options), [input, options]);
  const stats = useMemo(() => getMarkdownStats(input), [input]);
  return <ToolLayoutTextWorkbench
    inputSlot={<EditorPanel title="Markdown" language="MD" value={input} onChange={setInput} minRows={18} placeholder="Write Markdown here..." actions={<><Button size="sm" variant="secondary" onClick={() => setInput(SAMPLE_MARKDOWN)}>Sample</Button><Button size="sm" variant="ghost" onClick={() => setInput("")}>Clear</Button></>} footer={`${stats.words.toLocaleString()} words · ${stats.characters.toLocaleString()} chars · ${stats.readingTimeMinutes} min read`} />}
    outputSlot={<section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"><PreviewToolbar title="Preview" description="Rendered locally from your Markdown" actions={<Tabs<MarkdownTab> ariaLabel="Markdown output" value={tab} onChange={setTab} items={[{ value: "preview", label: "Preview" }, { value: "html", label: "HTML" }, { value: "write", label: "Source" }]} />} />{tab === "preview" ? <div className="prose prose-sm max-w-none p-4 text-[var(--color-text)] dark:prose-invert" dangerouslySetInnerHTML={{ __html: rendered.sanitizedHtml }} /> : <CodeOutputPanel title={tab === "html" ? "Generated HTML" : "Markdown source"} tabs={[{ id: tab, label: tab === "html" ? "HTML" : "Markdown", code: tab === "html" ? rendered.sanitizedHtml : input, language: tab === "html" ? "html" : "markdown" }]} />}</section>}
    actionsSlot={<><CopyButton text={input} size="sm" variant="secondary">Copy Markdown</CopyButton><CopyButton text={rendered.sanitizedHtml} size="sm" variant="secondary">Copy HTML</CopyButton><Button size="sm" variant="secondary" onClick={() => downloadText("preview.html", rendered.sanitizedHtml, "text/html;charset=utf-8")}>Download HTML</Button></>}
    optionsSlot={<ToolControlPanel title="Preview options"><ControlSection title="Rendering"><div className="flex flex-wrap gap-2">{(["githubLineBreaks", "openLinksInNewTab", "sanitizeHtml"] as const).map((key) => <Button key={key} size="sm" variant={options[key] ? "primary" : "secondary"} onClick={() => setOptions((current) => ({ ...current, [key]: !current[key] }))}>{key.replace(/([A-Z])/g, " $1")}</Button>)}</div></ControlSection></ToolControlPanel>}
    statsSlot={<WarningPanel messages={rendered.warnings.length ? rendered.warnings.map((message, index) => ({ id: `warn-${index}`, severity: "warning", title: "Markdown note", message })) : [{ id: "safe", severity: "info", title: "Sanitized preview", message: options.sanitizeHtml ? "HTML output is sanitized before preview." : "Sanitization is disabled by option; review HTML carefully." }]} />}
  />;
}
