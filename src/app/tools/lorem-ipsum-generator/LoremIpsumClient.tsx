"use client";

import { useMemo, useState, type ReactNode } from "react";
import JSZip from "jszip";
import {
  AlertTriangle,
  Blocks,
  BookOpenText,
  Braces,
  CheckCircle2,
  Code2,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Monitor,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Button, CopyButton, Input, Select } from "@/components/ui";
import { downloadText, formatBytes } from "../_shared/clientUtils";
import {
  buildBlocksCsv,
  buildLoremReport,
  buildMarkdownReport,
  buildPreviewDocument,
  buildReactStarter,
  computeStats,
  formatReadingTime,
  generate,
} from "./generator";
import { FEATURED_PRESETS } from "./presets";
import type {
  BlockLength,
  GenerationMode,
  LoremCheckLevel,
  LoremConfig,
  LoremResultTab,
  OutputFormat,
  PreviewViewport,
  StructuredBlock,
  TextStyle,
} from "./types";

const DEFAULT_CONFIG: LoremConfig = {
  mode: "paragraphs",
  style: "readable",
  amount: 3,
  blockLength: "medium",
  outputFormat: "plain",
  startWithLorem: false,
  includeHeadings: false,
  includeLists: false,
  structuredBlock: "hero",
  seed: "darma-preview-01",
};

const MODE_LIMITS: Record<GenerationMode, { min: number; max: number; label: string }> = {
  words: { min: 1, max: 500, label: "Words" },
  sentences: { min: 1, max: 50, label: "Sentences" },
  paragraphs: { min: 1, max: 20, label: "Paragraphs" },
  structured: { min: 1, max: 8, label: "Blocks" },
};

const CHECK_STYLES: Record<LoremCheckLevel, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function SummaryCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: ReactNode }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</span>
        <span className="text-[var(--color-primary)]">{icon}</span>
      </div>
      <div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]" title={value}>{value}</div>
      <div className="mt-0.5 truncate text-[11px] text-[var(--color-text-tertiary)]">{hint}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold text-[var(--color-text-secondary)]">
        <span>{label}</span>
        {hint ? <span className="font-normal text-[var(--color-text-tertiary)]">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label, description, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; label: string; description: string; disabled?: boolean }) {
  return (
    <label className={`flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="min-w-0">
        <span className="block text-xs font-bold text-[var(--color-text-primary)]">{label}</span>
        <span className="mt-0.5 block text-[10px] leading-4 text-[var(--color-text-tertiary)]">{description}</span>
      </span>
    </label>
  );
}

function createSeed() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const values = new Uint32Array(2);
    crypto.getRandomValues(values);
    return `darma-${values[0].toString(36)}-${values[1].toString(36)}`;
  }
  return `darma-${Date.now().toString(36)}`;
}

function clampAmount(mode: GenerationMode, amount: number) {
  const limits = MODE_LIMITS[mode];
  return Math.min(limits.max, Math.max(limits.min, Math.round(Number.isFinite(amount) ? amount : limits.min)));
}

export default function LoremIpsumClient() {
  const [config, setConfig] = useState<LoremConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<LoremResultTab>("preview");
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");
  const [zipBusy, setZipBusy] = useState(false);

  const output = useMemo(() => generate(config), [config]);
  const stats = useMemo(() => computeStats(output.plain), [output.plain]);
  const report = useMemo(() => buildLoremReport(config, output), [config, output]);
  const previewDocument = useMemo(() => buildPreviewDocument(output.html), [output.html]);
  const reactStarter = useMemo(() => buildReactStarter(output), [output]);
  const reportJson = useMemo(() => JSON.stringify(report, null, 2), [report]);
  const markdownReport = useMemo(() => buildMarkdownReport(report), [report]);
  const blocksCsv = useMemo(() => buildBlocksCsv(output), [output]);
  const reviewCount = report.checks.filter((check) => check.level === "warning" || check.level === "danger").length;

  function patch(next: Partial<LoremConfig>) {
    setConfig((current) => ({ ...current, ...next }));
  }

  function setMode(mode: GenerationMode) {
    const amount = clampAmount(mode, mode === "words" ? 60 : mode === "sentences" ? 4 : mode === "paragraphs" ? 3 : 1);
    patch({ mode, amount });
  }

  function applyPreset(configPatch: Partial<LoremConfig>) {
    setConfig((current) => {
      const mode = configPatch.mode ?? current.mode;
      return { ...current, ...configPatch, amount: clampAmount(mode, configPatch.amount ?? current.amount) };
    });
    setActiveTab("preview");
  }

  function downloadActive() {
    const payloads: Record<Exclude<LoremResultTab, "preview">, { name: string; content: string; type: string }> = {
      plain: { name: "placeholder-content.txt", content: output.plain, type: "text/plain;charset=utf-8" },
      html: { name: "placeholder-content.html", content: previewDocument, type: "text/html;charset=utf-8" },
      react: { name: "PlaceholderContent.tsx", content: reactStarter, type: "text/plain;charset=utf-8" },
      report: { name: "placeholder-report.json", content: reportJson, type: "application/json;charset=utf-8" },
    };
    const tab = activeTab === "preview" ? (config.outputFormat === "html" ? "html" : "plain") : activeTab;
    const payload = payloads[tab];
    downloadText(payload.name, payload.content, payload.type);
  }

  async function downloadPack() {
    setZipBusy(true);
    try {
      const zip = new JSZip();
      zip.file("content.txt", output.plain);
      zip.file("content.html", previewDocument);
      zip.file("PlaceholderContent.tsx", reactStarter);
      zip.file("blocks.csv", blocksCsv);
      zip.file("report.json", reportJson);
      zip.file("README.md", `${markdownReport}\n## Files\n\n- content.txt — plain placeholder copy\n- content.html — standalone styled preview\n- PlaceholderContent.tsx — safe React text starter\n- blocks.csv — one generated block per row\n- report.json — settings, metrics, and checks\n`);
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "darma-placeholder-content-pack.zip";
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipBusy(false);
    }
  }

  const activeCode = activeTab === "plain" ? output.plain : activeTab === "html" ? previewDocument : activeTab === "react" ? reactStarter : reportJson;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Output" value={`${stats.words} words`} hint={`${stats.blocks} blocks · ${stats.sentences} sentences`} icon={<BookOpenText className="h-4 w-4" />} />
        <SummaryCard label="Payload" value={formatBytes(stats.bytes)} hint={`${stats.characters.toLocaleString()} characters`} icon={<FileText className="h-4 w-4" />} />
        <SummaryCard label="Reading" value={formatReadingTime(stats.readingTimeSeconds)} hint={`${Math.round(stats.uniqueWordRatio * 100)}% unique-word ratio`} icon={<Blocks className="h-4 w-4" />} />
        <SummaryCard label="Review" value={reviewCount === 0 ? "Ready" : `${reviewCount} item${reviewCount === 1 ? "" : "s"}`} hint="Placeholder production checks" icon={reviewCount === 0 ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(310px,0.78fr)_minmax(0,1.45fr)] xl:items-start">
        <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)]">
          <div>
            <div className="flex items-center gap-2">
              <WandSparkles className="h-4 w-4 text-[var(--color-primary)]" />
              <h2 className="text-sm font-black text-[var(--color-text-primary)]">Practical presets</h2>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {FEATURED_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.config)}
                  className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 text-left transition hover:border-[var(--color-primary-border)] hover:bg-[var(--color-primary-soft)] focus:outline-none focus:shadow-[var(--focus-ring)]"
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]"><span aria-hidden>{preset.icon}</span>{preset.label}</span>
                  <span className="mt-1 line-clamp-2 block text-[10px] leading-4 text-[var(--color-text-tertiary)]">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--color-border-subtle)] pt-4">
            <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-1 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
              {(["words", "sentences", "paragraphs", "structured"] as GenerationMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMode(mode)}
                  className={`rounded-[var(--radius-sm)] px-2 py-2 text-[11px] font-bold capitalize transition ${config.mode === mode ? "bg-[var(--color-surface-base)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Field label="Content style">
              <Select size="sm" className="w-full" value={config.style} onChange={(event) => patch({ style: event.target.value as TextStyle })}>
                <option value="classic">Classic Latin</option>
                <option value="readable">Readable neutral</option>
                <option value="startup">Startup / SaaS</option>
                <option value="ecommerce">Ecommerce</option>
                <option value="blog">Editorial blog</option>
                <option value="profile">Profile / bio</option>
              </Select>
            </Field>
            <Field label={MODE_LIMITS[config.mode].label} hint={`${MODE_LIMITS[config.mode].min}–${MODE_LIMITS[config.mode].max}`}>
              <Input
                type="number"
                size="sm"
                className="w-full"
                min={MODE_LIMITS[config.mode].min}
                max={MODE_LIMITS[config.mode].max}
                value={config.amount}
                onChange={(event) => patch({ amount: clampAmount(config.mode, Number(event.target.value)) })}
              />
            </Field>
          </div>

          {config.mode === "paragraphs" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <Field label="Paragraph length">
                <Select size="sm" className="w-full" value={config.blockLength} onChange={(event) => patch({ blockLength: event.target.value as BlockLength })}>
                  <option value="short">Short · 2–3 sentences</option>
                  <option value="medium">Medium · 3–5 sentences</option>
                  <option value="long">Long · 5–8 sentences</option>
                </Select>
              </Field>
              <Field label="Default export">
                <Select size="sm" className="w-full" value={config.outputFormat} onChange={(event) => patch({ outputFormat: event.target.value as OutputFormat })}>
                  <option value="plain">Plain text</option>
                  <option value="html">Standalone HTML</option>
                </Select>
              </Field>
            </div>
          ) : config.mode === "structured" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <Field label="Structured block">
                <Select size="sm" className="w-full" value={config.structuredBlock} onChange={(event) => patch({ structuredBlock: event.target.value as StructuredBlock })}>
                  <option value="hero">Hero</option>
                  <option value="card">Feature card</option>
                  <option value="testimonial">Testimonial</option>
                  <option value="faq">FAQ</option>
                  <option value="product">Product card</option>
                  <option value="about">About / bio</option>
                  <option value="onboarding">Onboarding step</option>
                  <option value="pricing">Pricing tier</option>
                </Select>
              </Field>
              <Field label="Default export">
                <Select size="sm" className="w-full" value={config.outputFormat} onChange={(event) => patch({ outputFormat: event.target.value as OutputFormat })}>
                  <option value="plain">Plain text</option>
                  <option value="html">Standalone HTML</option>
                </Select>
              </Field>
            </div>
          ) : (
            <Field label="Default export">
              <Select size="sm" className="w-full" value={config.outputFormat} onChange={(event) => patch({ outputFormat: event.target.value as OutputFormat })}>
                <option value="plain">Plain text</option>
                <option value="html">Standalone HTML</option>
              </Select>
            </Field>
          )}

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Toggle
              checked={config.startWithLorem}
              onChange={(startWithLorem) => patch({ startWithLorem })}
              label="Classic opening"
              description="Begin with “Lorem ipsum dolor sit amet”."
              disabled={config.style !== "classic" || !["sentences", "paragraphs"].includes(config.mode)}
            />
            <Toggle checked={config.includeHeadings} onChange={(includeHeadings) => patch({ includeHeadings })} label="Section headings" description="Insert headings every two or three paragraphs." disabled={config.mode !== "paragraphs"} />
            <Toggle checked={config.includeLists} onChange={(includeLists) => patch({ includeLists })} label="Example list" description="Insert a practical list after longer sections." disabled={config.mode !== "paragraphs"} />
          </div>

          <Field label="Reproducible seed" hint="Same seed = same copy">
            <div className="flex gap-2">
              <Input size="sm" className="min-w-0 flex-1" value={config.seed} onChange={(event) => patch({ seed: event.target.value })} placeholder="campaign-homepage-v1" />
              <Button size="icon" variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => patch({ seed: createSeed() })} title="Generate a new seed">Generate a new seed</Button>
            </div>
          </Field>

          <div className="flex flex-wrap gap-2 border-t border-[var(--color-border-subtle)] pt-4">
            <Button size="sm" leftIcon={<Sparkles className="h-4 w-4" />} onClick={() => patch({ seed: createSeed() })}>Generate variation</Button>
            <Button size="sm" variant="secondary" onClick={() => setConfig(DEFAULT_CONFIG)}>Reset</Button>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-sm font-black text-[var(--color-text-primary)]">Generated content</h2>
              <p className="mt-0.5 truncate text-[10px] text-[var(--color-text-tertiary)]">Seed: {config.seed || "darma-placeholder"}</p>
            </div>
            <div className="flex flex-wrap gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-1">
              {(["preview", "plain", "html", "react", "report"] as LoremResultTab[]).map((tab) => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[10px] font-bold capitalize ${activeTab === tab ? "bg-[var(--color-surface-base)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"}`}>{tab}</button>
              ))}
            </div>
          </div>

          {activeTab === "preview" ? (
            <div className="bg-[var(--color-surface-subtle)] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Responsive preview</span>
                <div className="flex gap-1">
                  <Button size="sm" variant={viewport === "desktop" ? "soft" : "ghost"} leftIcon={<Monitor className="h-3.5 w-3.5" />} onClick={() => setViewport("desktop")}>Desktop</Button>
                  <Button size="sm" variant={viewport === "mobile" ? "soft" : "ghost"} leftIcon={<Smartphone className="h-3.5 w-3.5" />} onClick={() => setViewport("mobile")}>Mobile</Button>
                </div>
              </div>
              <div className={`mx-auto overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white shadow-[var(--shadow-sm)] transition-[width] ${viewport === "mobile" ? "w-full max-w-[390px]" : "w-full"}`}>
                <iframe title="Generated placeholder preview" className="h-[500px] w-full bg-white" sandbox="" srcDoc={previewDocument} />
              </div>
            </div>
          ) : (
            <div className="relative">
              <pre className="max-h-[570px] min-h-[500px] overflow-auto whitespace-pre-wrap break-words bg-[var(--color-code-bg)] p-4 font-mono text-xs leading-6 text-[var(--color-code-text)]">{activeCode}</pre>
              <div className="absolute right-3 top-3">
                <CopyButton size="sm" variant="secondary" text={activeCode}>Copy</CopyButton>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border-subtle)] px-4 py-3">
            <span className="text-[10px] text-[var(--color-text-tertiary)]">Generated locally · no content leaves your browser</span>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={downloadActive}>Download current</Button>
              <Button size="sm" leftIcon={<PackageCheck className="h-3.5 w-3.5" />} loading={zipBusy} onClick={() => void downloadPack()}>Export ZIP</Button>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[var(--color-text-primary)]">Production checks</h2>
              <p className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">Review placeholder-specific risks before handing off a mockup.</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {report.checks.map((check) => (
              <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}>
                <div className="flex items-start gap-2">
                  {check.level === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-xs font-black">{check.title}</div>
                    <div className="mt-1 text-[10px] leading-4 opacity-90">{check.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-black text-[var(--color-text-primary)]">Practical exports</h2>
          <p className="mt-1 text-[10px] leading-4 text-[var(--color-text-tertiary)]">Use only the format needed by the current design or development workflow.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button size="sm" variant="secondary" leftIcon={<FileText className="h-3.5 w-3.5" />} onClick={() => downloadText("placeholder-content.txt", output.plain)}>Plain text</Button>
            <Button size="sm" variant="secondary" leftIcon={<Code2 className="h-3.5 w-3.5" />} onClick={() => downloadText("placeholder-content.html", previewDocument, "text/html;charset=utf-8")}>HTML</Button>
            <Button size="sm" variant="secondary" leftIcon={<Braces className="h-3.5 w-3.5" />} onClick={() => downloadText("PlaceholderContent.tsx", reactStarter)}>React</Button>
            <Button size="sm" variant="secondary" leftIcon={<FileJson className="h-3.5 w-3.5" />} onClick={() => downloadText("placeholder-report.json", reportJson, "application/json;charset=utf-8")}>JSON report</Button>
            <Button size="sm" variant="secondary" leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />} onClick={() => downloadText("placeholder-blocks.csv", blocksCsv, "text/csv;charset=utf-8")}>Blocks CSV</Button>
            <Button size="sm" variant="secondary" leftIcon={<PackageCheck className="h-3.5 w-3.5" />} loading={zipBusy} onClick={() => void downloadPack()}>ZIP pack</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
