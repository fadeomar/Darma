"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import { AlertTriangle, CheckCircle2, Download, FileCode2, FileJson, Files, Globe2, ListChecks, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Button, CopyButton, Select, Textarea } from "@/components/ui";
import { downloadText } from "../_shared/clientUtils";
import { buildSitemap, buildSitemapReport, parseUrlList } from "./sitemapXml";
import { CHANGEFREQ_OPTIONS, DEFAULT_SITEMAP_OPTIONS, ENTRY_CHANGEFREQ_OPTIONS, LASTMOD_OPTIONS, PRIORITY_OPTIONS, SITEMAP_PRESETS, SITEMAP_SAMPLE_INPUT } from "./presets";
import type { ChangeFrequency, SitemapCheckSeverity, SitemapOptions, SitemapUrlEntry } from "./types";

const CHECK_STYLES: Record<SitemapCheckSeverity, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]"><div className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div><div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]">{value}</div><div className="mt-0.5 truncate text-[11px] text-[var(--color-text-tertiary)]">{hint}</div></div>;
}

function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function inputClass() { return "h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"; }

export default function SitemapXmlClient() {
  const [input, setInput] = useState(SITEMAP_SAMPLE_INPUT);
  const [options, setOptions] = useState<SitemapOptions>(DEFAULT_SITEMAP_OPTIONS);
  const [entries, setEntries] = useState<SitemapUrlEntry[]>(() => parseUrlList(SITEMAP_SAMPLE_INPUT));
  const [activeFile, setActiveFile] = useState(0);
  const [view, setView] = useState<"table" | "xml" | "checks">("table");

  const result = useMemo(() => buildSitemap(entries, options), [entries, options]);
  const selectedFile = result.files[Math.min(activeFile, result.files.length - 1)];
  const currentXml = activeFile === result.files.length && result.indexXml ? result.indexXml : selectedFile.xml;
  const currentFilename = activeFile === result.files.length && result.indexXml ? "sitemap-index.xml" : selectedFile.filename;

  function parseInput(value = input) { const parsed = parseUrlList(value); setEntries(parsed); setActiveFile(0); }
  function updateEntry(id: string, patch: Partial<SitemapUrlEntry>) { setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, ...patch } : entry)); }
  function addEntry() { setEntries((current) => [...current, { id: `url-${Date.now()}`, loc: "https://example.com/new-page", lastmod: "", changefreq: "", priority: "" }]); }
  function applyPreset(id: string) { const preset = SITEMAP_PRESETS.find((item) => item.id === id); if (!preset) return; setInput(preset.input); setOptions(preset.options); setEntries(parseUrlList(preset.input)); setActiveFile(0); }
  async function downloadPack() { const zip = new JSZip(); result.files.forEach((file) => zip.file(file.filename, file.xml)); if (result.indexXml) zip.file("sitemap-index.xml", result.indexXml); zip.file("sitemap-report.json", buildSitemapReport(result, options)); const blob = await zip.generateAsync({ type: "blob" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "sitemap-pack.zip"; anchor.click(); URL.revokeObjectURL(url); }

  return <div className="space-y-4">
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="URLs" value={result.stats.valid.toLocaleString()} hint={`${result.stats.invalid} invalid · ${result.stats.duplicates} duplicate`} />
      <SummaryCard label="Hosts" value={result.stats.hosts.toLocaleString()} hint={result.stats.hosts === 1 ? "Single-host sitemap" : "Split by host recommended"} />
      <SummaryCard label="Output" value={`${result.stats.files} file${result.stats.files === 1 ? "" : "s"}`} hint={`${formatBytes(result.stats.xmlBytes)} total XML`} />
      <SummaryCard label="Checks" value={result.checks.filter((check) => check.level === "danger" || check.level === "warning").length.toLocaleString()} hint="Warnings requiring review" />
    </div>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] px-4 py-3">
          <div><h2 className="font-bold text-[var(--color-text-primary)]">URL workspace</h2><p className="text-xs text-[var(--color-text-tertiary)]">Paste plain URLs or CSV: loc,lastmod,changefreq,priority.</p></div>
          <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => { setInput(SITEMAP_SAMPLE_INPUT); parseInput(SITEMAP_SAMPLE_INPUT); }}>Sample</Button><Button size="sm" onClick={() => parseInput()}>Parse input</Button></div>
        </div>
        <div className="p-4"><Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={7} className="font-mono text-xs" placeholder="https://example.com/\nhttps://example.com/about" /></div>
        <div className="flex flex-wrap gap-2 border-y border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-2">
          {(["table", "xml", "checks"] as const).map((item) => <Button key={item} size="sm" variant={view === item ? "primary" : "ghost"} onClick={() => setView(item)}>{item === "table" ? "Editable rows" : item === "xml" ? "XML preview" : "Production checks"}</Button>)}
        </div>

        {view === "table" && <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]"><tr><th className="px-3 py-2">URL</th><th className="px-3 py-2">Last modified</th><th className="px-3 py-2">Changefreq</th><th className="px-3 py-2">Priority</th><th className="w-12 px-3 py-2" /></tr></thead><tbody>
            {entries.slice(0, 250).map((entry) => <tr key={entry.id} className="border-t border-[var(--color-border-subtle)]"><td className="p-2"><input className={inputClass()} value={entry.loc} onChange={(event) => updateEntry(entry.id, { loc: event.target.value })} /></td><td className="p-2"><input className={inputClass()} type="date" value={entry.lastmod ?? ""} onChange={(event) => updateEntry(entry.id, { lastmod: event.target.value })} /></td><td className="p-2"><select className={inputClass()} value={entry.changefreq ?? ""} onChange={(event) => updateEntry(entry.id, { changefreq: event.target.value as ChangeFrequency | "" })}>{ENTRY_CHANGEFREQ_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></td><td className="p-2"><input className={inputClass()} inputMode="decimal" value={entry.priority ?? ""} placeholder="Default" onChange={(event) => updateEntry(entry.id, { priority: event.target.value })} /></td><td className="p-2"><button className="rounded p-2 text-[var(--color-text-tertiary)] hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger-text)]" onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))} aria-label="Remove URL"><Trash2 className="h-4 w-4" /></button></td></tr>)}
          </tbody></table>
          <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] px-4 py-3"><span className="text-xs text-[var(--color-text-tertiary)]">{entries.length > 250 ? "Showing first 250 editable rows." : `${entries.length} row(s)`}</span><Button size="sm" variant="secondary" onClick={addEntry}><Plus className="mr-1 h-4 w-4" />Add row</Button></div>
        </div>}

        {view === "xml" && <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">{result.files.map((file, index) => <Button key={file.filename} size="sm" variant={activeFile === index ? "primary" : "secondary"} onClick={() => setActiveFile(index)}>{file.filename} · {file.count}</Button>)}{result.indexXml && <Button size="sm" variant={activeFile === result.files.length ? "primary" : "secondary"} onClick={() => setActiveFile(result.files.length)}>sitemap-index.xml</Button>}</div>
          <pre className="max-h-[560px] overflow-auto rounded-[var(--radius-md)] bg-slate-950 p-4 text-xs leading-6 text-slate-100"><code>{currentXml}</code></pre>
        </div>}

        {view === "checks" && <div className="grid gap-2 p-4 md:grid-cols-2">{result.checks.map((check) => <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}><div className="flex items-start gap-2">{check.level === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : check.level === "danger" || check.level === "warning" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />}<div><div className="font-bold">{check.title ?? "Sitemap check"}</div><p className="mt-1 text-xs leading-5 opacity-90">{check.message}</p></div></div></div>)}</div>}
      </section>

      <aside className="space-y-3">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]"><div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><ListChecks className="h-4 w-4" />Practical presets</div><div className="space-y-2">{SITEMAP_PRESETS.map((preset) => <button key={preset.id} onClick={() => applyPreset(preset.id)} className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-2.5 text-left hover:border-[var(--color-accent)]"><div className="text-sm font-bold text-[var(--color-text-primary)]">{preset.label}</div><div className="mt-0.5 text-[11px] leading-4 text-[var(--color-text-tertiary)]">{preset.description}</div></button>)}</div></section>

        <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]"><div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Globe2 className="h-4 w-4" />Defaults & splitting</div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)]">Last modified<Select size="sm" className="mt-1" value={options.defaultLastmodMode} onChange={(event) => setOptions((current) => ({ ...current, defaultLastmodMode: event.target.value as SitemapOptions["defaultLastmodMode"] }))}>{LASTMOD_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></label>
          {options.defaultLastmodMode === "custom" && <input className={inputClass()} type="date" value={options.customLastmod} onChange={(event) => setOptions((current) => ({ ...current, customLastmod: event.target.value }))} />}
          <label className="block text-xs font-semibold text-[var(--color-text-muted)]">Change frequency<Select size="sm" className="mt-1" value={options.defaultChangefreq} onChange={(event) => setOptions((current) => ({ ...current, defaultChangefreq: event.target.value as SitemapOptions["defaultChangefreq"] }))}>{CHANGEFREQ_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></label>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)]">Priority<Select size="sm" className="mt-1" value={options.defaultPriority} onChange={(event) => setOptions((current) => ({ ...current, defaultPriority: event.target.value as SitemapOptions["defaultPriority"] }))}>{PRIORITY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></label>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)]">URLs per file<input className={`${inputClass()} mt-1`} type="number" min={1} max={50000} value={options.urlsPerFile} onChange={(event) => setOptions((current) => ({ ...current, urlsPerFile: Number(event.target.value) }))} /></label>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)]">Sitemap public base URL<input className={`${inputClass()} mt-1`} value={options.sitemapBaseUrl} onChange={(event) => setOptions((current) => ({ ...current, sitemapBaseUrl: event.target.value }))} /></label>
        </section>

        <section className="space-y-2 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]"><div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Files className="h-4 w-4" />Exports</div><CopyButton text={currentXml} className="w-full">Copy current XML</CopyButton><Button className="w-full" variant="secondary" onClick={() => downloadText(currentFilename, currentXml, "application/xml;charset=utf-8")}><FileCode2 className="mr-2 h-4 w-4" />Download current XML</Button><Button className="w-full" variant="secondary" onClick={() => downloadText("sitemap-report.json", buildSitemapReport(result, options), "application/json;charset=utf-8")}><FileJson className="mr-2 h-4 w-4" />Download JSON report</Button><Button className="w-full" onClick={downloadPack}><Download className="mr-2 h-4 w-4" />Download sitemap pack</Button></section>
      </aside>
    </div>
  </div>;
}
