"use client";

import { useMemo, useState } from "react";
import { Download, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge, Button, CopyButton, Field, Input, Select, Tabs, Textarea } from "@/components/ui";
import { generateSitemapXml, parseUrlList, validateSitemapEntries } from "./sitemap";
import {
  CHANGEFREQ_OPTIONS,
  DEFAULT_SITEMAP_OPTIONS,
  ENTRY_CHANGEFREQ_OPTIONS,
  LASTMOD_OPTIONS,
  MAX_MANUAL_INPUT_LENGTH,
  MAX_SITEMAP_URLS,
  MAX_URL_LENGTH,
  PRIORITY_OPTIONS,
  SITEMAP_PRESETS,
  SITEMAP_SAMPLE_INPUT,
} from "./presets";
import type { ChangeFrequency, SitemapOptions, SitemapUrlEntry, SitemapWarningLevel } from "./types";

type InputMode = "manual" | "table";

const INPUT_TABS = [
  { value: "manual" as const, label: "Manual URL list" },
  { value: "table" as const, label: "Table editor" },
];

function makeId() {
  return `url-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newEntry(): SitemapUrlEntry {
  return { id: makeId(), loc: "https://example.com/new-page", lastmod: "", changefreq: "", priority: "" };
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function warningClass(level: SitemapWarningLevel) {
  if (level === "danger") return "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200";
  if (level === "warning") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200";
  return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200";
}

function entriesToManual(entries: SitemapUrlEntry[]) {
  return entries.map((entry) => entry.loc).join("\n");
}

export default function SitemapXmlClient() {
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [manualInput, setManualInput] = useState(SITEMAP_SAMPLE_INPUT);
  const [entries, setEntries] = useState<SitemapUrlEntry[]>(() => parseUrlList(SITEMAP_SAMPLE_INPUT));
  const [options, setOptions] = useState<SitemapOptions>(DEFAULT_SITEMAP_OPTIONS);

  const xml = useMemo(() => generateSitemapXml(entries, options), [entries, options]);
  const warnings = useMemo(() => validateSitemapEntries(entries, MAX_SITEMAP_URLS), [entries]);
  const dangerCount = warnings.filter((warning) => warning.level === "danger").length;

  function parseManualInput() {
    const parsed = parseUrlList(manualInput.slice(0, MAX_MANUAL_INPUT_LENGTH));
    setEntries(parsed.slice(0, MAX_SITEMAP_URLS));
    setInputMode("table");
  }

  function loadPreset(id: string) {
    const preset = SITEMAP_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setManualInput(preset.input);
    setEntries(parseUrlList(preset.input));
    setOptions(preset.options);
  }

  function updateEntry(id: string, patch: Partial<SitemapUrlEntry>) {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function addEntry() {
    setEntries((current) => (current.length >= MAX_SITEMAP_URLS ? current : [...current, newEntry()]));
    setInputMode("table");
  }

  function removeEntry(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  function clearAll() {
    setManualInput("");
    setEntries([]);
  }

  function formatManualFromTable() {
    const nextInput = entriesToManual(entries);
    setManualInput(nextInput);
    setInputMode("manual");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-[var(--color-text)]">Sitemap XML Generator</h2>
            <Badge variant="success">Browser-only</Badge>
            {dangerCount > 0 ? <Badge variant="danger">Fix {dangerCount} issue{dangerCount === 1 ? "" : "s"}</Badge> : <Badge variant="success">Ready</Badge>}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Create a UTF-8 XML sitemap from a URL list or table, with optional lastmod, changefreq, and priority metadata.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => loadPreset("small-site")} leftIcon={<RefreshCw className="h-4 w-4" />}>Load sample</Button>
          <Button variant="secondary" onClick={clearAll}>Clear</Button>
        </div>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Default lastmod">
            <Select value={options.defaultLastmodMode} onChange={(event) => setOptions((current) => ({ ...current, defaultLastmodMode: event.target.value as SitemapOptions["defaultLastmodMode"] }))}>
              {LASTMOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </Field>
          <Field label="Custom date" description="YYYY-MM-DD">
            <Input type="date" value={options.customLastmod} onChange={(event) => setOptions((current) => ({ ...current, customLastmod: event.target.value }))} disabled={options.defaultLastmodMode !== "custom"} />
          </Field>
          <Field label="Default changefreq">
            <Select value={options.defaultChangefreq} onChange={(event) => setOptions((current) => ({ ...current, defaultChangefreq: event.target.value as SitemapOptions["defaultChangefreq"] }))}>
              {CHANGEFREQ_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </Field>
          <Field label="Default priority">
            <Select value={options.defaultPriority} onChange={(event) => setOptions((current) => ({ ...current, defaultPriority: event.target.value as SitemapOptions["defaultPriority"] }))}>
              {PRIORITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {SITEMAP_PRESETS.map((preset) => (
            <Button key={preset.id} variant="secondary" onClick={() => loadPreset(preset.id)} title={preset.description}>{preset.label}</Button>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs items={INPUT_TABS} value={inputMode} onChange={setInputMode} ariaLabel="Sitemap input mode" />
            <div className="flex flex-wrap gap-2">
              {inputMode === "manual" ? <Button onClick={parseManualInput}>Parse URLs</Button> : <Button variant="secondary" onClick={formatManualFromTable}>Back to list</Button>}
              <Button variant="secondary" onClick={addEntry} disabled={entries.length >= MAX_SITEMAP_URLS} leftIcon={<Plus className="h-4 w-4" />}>Add row</Button>
            </div>
          </div>

          {inputMode === "manual" ? (
            <Field label="Manual URL list" description={`One absolute http(s) URL per line. Max ${MAX_SITEMAP_URLS} URLs and ${MAX_MANUAL_INPUT_LENGTH.toLocaleString()} characters.`}>
              <Textarea
                value={manualInput}
                maxLength={MAX_MANUAL_INPUT_LENGTH}
                onChange={(event) => setManualInput(event.target.value)}
                className="min-h-[430px] font-mono text-sm"
                placeholder="https://example.com/\nhttps://example.com/about"
              />
            </Field>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-sm text-[var(--color-text-muted)]">
                <span>{entries.length} URL{entries.length === 1 ? "" : "s"}</span>
                <span>Per-row values override defaults.</span>
              </div>
              <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
                {entries.map((entry, index) => (
                  <div key={entry.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">URL {index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeEntry(entry.id)} aria-label="Remove URL" leftIcon={<Trash2 className="h-4 w-4" />}>Remove</Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="URL" className="md:col-span-2">
                        <Input value={entry.loc} maxLength={MAX_URL_LENGTH} onChange={(event) => updateEntry(entry.id, { loc: event.target.value })} placeholder="https://example.com/page" />
                      </Field>
                      <Field label="lastmod">
                        <Input type="date" value={entry.lastmod ?? ""} onChange={(event) => updateEntry(entry.id, { lastmod: event.target.value })} />
                      </Field>
                      <Field label="changefreq">
                        <Select value={entry.changefreq ?? ""} onChange={(event) => updateEntry(entry.id, { changefreq: event.target.value as ChangeFrequency | "" })}>
                          {ENTRY_CHANGEFREQ_OPTIONS.map((option) => <option key={option.value || "none"} value={option.value}>{option.label}</option>)}
                        </Select>
                      </Field>
                      <Field label="priority" description="0.0 to 1.0">
                        <Input inputMode="decimal" value={entry.priority ?? ""} onChange={(event) => updateEntry(entry.id, { priority: event.target.value })} placeholder="0.8" />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-[var(--color-text)]">XML preview</h3>
              <p className="text-sm text-[var(--color-text-muted)]">{entries.length} URLs · {warnings.length} warning{warnings.length === 1 ? "" : "s"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton value={xml}>Copy XML</CopyButton>
              <Button variant="secondary" onClick={() => downloadFile("sitemap.xml", xml)} leftIcon={<Download className="h-4 w-4" />}>Download</Button>
            </div>
          </div>
          <Textarea readOnly value={xml} className="min-h-[460px] font-mono text-xs" />
          <div className="space-y-2">
            {warnings.slice(0, 8).map((warning) => (
              <div key={warning.id} className={`rounded-[var(--radius-md)] border p-3 text-sm ${warningClass(warning.level)}`}>{warning.message}</div>
            ))}
            {warnings.length > 8 && <p className="text-sm text-[var(--color-text-muted)]">Showing 8 of {warnings.length} warnings. Fix rows to reduce the list.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
