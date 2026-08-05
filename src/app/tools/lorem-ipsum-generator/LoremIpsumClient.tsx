"use client";

import { useMemo, useState, type ReactNode } from "react";
import JSZip from "jszip";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Braces,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
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
  words: { min: 1, max: 500, label: "Word count" },
  sentences: { min: 1, max: 50, label: "Sentence count" },
  paragraphs: { min: 1, max: 20, label: "Paragraph count" },
  structured: { min: 1, max: 8, label: "Block count" },
};

const CHECK_STYLES: Record<LoremCheckLevel, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

const TAB_LABELS: Record<LoremResultTab, string> = {
  preview: "Preview",
  plain: "Text",
  html: "HTML",
  react: "React",
  report: "Report",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-[var(--color-text-secondary)]">
        <span>{label}</span>
        {hint ? <span className="font-normal text-[var(--color-text-tertiary)]">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" aria-hidden />
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex min-h-12 items-start gap-3 border-b border-[var(--color-border-subtle)] py-3 last:border-b-0 ${
        disabled ? "opacity-45" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-primary)] focus-visible:shadow-[var(--focus-ring)]"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[var(--color-text-primary)]">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-[var(--color-text-tertiary)]">{description}</span>
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

function configsMatch(a: LoremConfig, b: LoremConfig) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function LoremIpsumClient() {
  const reduceMotion = useReducedMotion();
  const [draftConfig, setDraftConfig] = useState<LoremConfig>(DEFAULT_CONFIG);
  const [generatedConfig, setGeneratedConfig] = useState<LoremConfig>(DEFAULT_CONFIG);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generationVersion, setGenerationVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<LoremResultTab>("preview");
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [checksOpen, setChecksOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"settings" | "preview">("settings");
  const [zipBusy, setZipBusy] = useState(false);

  const output = useMemo(() => generate(generatedConfig), [generatedConfig]);
  const stats = useMemo(() => computeStats(output.plain), [output.plain]);
  const report = useMemo(() => buildLoremReport(generatedConfig, output), [generatedConfig, output]);
  const previewDocument = useMemo(() => buildPreviewDocument(output.html), [output.html]);
  const reactStarter = useMemo(() => buildReactStarter(output), [output]);
  const reportJson = useMemo(() => JSON.stringify(report, null, 2), [report]);
  const markdownReport = useMemo(() => buildMarkdownReport(report), [report]);
  const blocksCsv = useMemo(() => buildBlocksCsv(output), [output]);
  const reviewCount = report.checks.filter((check) => check.level === "warning" || check.level === "danger").length;
  const isDirty = hasGenerated && !configsMatch(draftConfig, generatedConfig);

  function patch(next: Partial<LoremConfig>) {
    setDraftConfig((current) => ({ ...current, ...next }));
  }

  function setMode(mode: GenerationMode) {
    const amount = clampAmount(mode, mode === "words" ? 60 : mode === "sentences" ? 4 : mode === "paragraphs" ? 3 : 1);
    patch({ mode, amount });
  }

  function applyPreset(configPatch: Partial<LoremConfig>) {
    setDraftConfig((current) => {
      const mode = configPatch.mode ?? current.mode;
      return { ...current, ...configPatch, amount: clampAmount(mode, configPatch.amount ?? current.amount) };
    });
    setActiveTab("preview");
  }

  function generateContent(nextConfig = draftConfig) {
    const normalized = { ...nextConfig, amount: clampAmount(nextConfig.mode, nextConfig.amount) };
    setDraftConfig(normalized);
    setGeneratedConfig(normalized);
    setHasGenerated(true);
    setGenerationVersion((version) => version + 1);
    setActiveTab("preview");
    setMobilePanel("preview");
  }

  function generateVariation() {
    const next = { ...draftConfig, seed: createSeed() };
    generateContent(next);
  }

  function resetSettings() {
    setDraftConfig(DEFAULT_CONFIG);
  }

  function downloadActive() {
    if (!hasGenerated) return;
    const payloads: Record<Exclude<LoremResultTab, "preview">, { name: string; content: string; type: string }> = {
      plain: { name: "placeholder-content.txt", content: output.plain, type: "text/plain;charset=utf-8" },
      html: { name: "placeholder-content.html", content: previewDocument, type: "text/html;charset=utf-8" },
      react: { name: "PlaceholderContent.tsx", content: reactStarter, type: "text/plain;charset=utf-8" },
      report: { name: "placeholder-report.json", content: reportJson, type: "application/json;charset=utf-8" },
    };
    const tab = activeTab === "preview" ? (generatedConfig.outputFormat === "html" ? "html" : "plain") : activeTab;
    const payload = payloads[tab];
    downloadText(payload.name, payload.content, payload.type);
  }

  async function downloadPack() {
    if (!hasGenerated) return;
    setZipBusy(true);
    try {
      const zip = new JSZip();
      zip.file("content.txt", output.plain);
      zip.file("content.html", previewDocument);
      zip.file("PlaceholderContent.tsx", reactStarter);
      zip.file("blocks.csv", blocksCsv);
      zip.file("report.json", reportJson);
      zip.file(
        "README.md",
        `${markdownReport}\n## Files\n\n- content.txt — plain placeholder copy\n- content.html — standalone styled preview\n- PlaceholderContent.tsx — safe React text starter\n- blocks.csv — one generated block per row\n- report.json — settings, metrics, and checks\n`,
      );
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

  const activeCode =
    activeTab === "plain"
      ? output.plain
      : activeTab === "html"
        ? previewDocument
        : activeTab === "react"
          ? reactStarter
          : reportJson;

  const copyValue = activeTab === "preview" ? output.plain : activeCode;

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[calc(var(--radius-lg)+4px)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]">
        <div
          className="border-b border-[var(--color-border-subtle)] px-4 py-4 sm:px-5"
          style={{
            background:
              "linear-gradient(120deg, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 46%, color-mix(in srgb, var(--color-accent, #13b8a6) 6%, transparent))",
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]">
                <WandSparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
                Start with a practical preset
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
                Pick a content shape, then fine-tune only the settings that matter.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-3 py-1.5 text-xs font-bold text-[var(--color-success-text)] lg:self-auto">
              <ShieldCheck className="h-3.5 w-3.5" />
              Local and private
            </div>
          </div>

          <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {FEATURED_PRESETS.map((preset) => {
              const selected = Object.entries(preset.config).every(
                ([key, value]) => draftConfig[key as keyof LoremConfig] === value,
              );
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.config)}
                  title={preset.description}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-xs font-bold outline-none transition focus-visible:shadow-[var(--focus-ring)] ${
                    selected
                      ? "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]"
                      : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <span aria-hidden>{preset.icon}</span>
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-b border-[var(--color-border-subtle)] p-2 lg:hidden">
          <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-1">
            {(["settings", "preview"] as const).map((panel) => (
              <button
                key={panel}
                type="button"
                onClick={() => setMobilePanel(panel)}
                className={`min-h-10 rounded-[var(--radius-sm)] px-3 text-sm font-bold capitalize outline-none transition focus-visible:shadow-[var(--focus-ring)] ${
                  mobilePanel === panel
                    ? "bg-[var(--color-surface-base)] text-[var(--color-primary-text-strong)] shadow-[var(--shadow-xs)]"
                    : "text-[var(--color-text-tertiary)]"
                }`}
              >
                {panel}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(340px,380px)_minmax(0,1fr)]">
          <aside
            className={`${mobilePanel === "settings" ? "block" : "hidden"} border-r-0 border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] lg:block lg:border-r`}
          >
            <div className="lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100vh-7rem)] lg:flex-col">
              <div className="space-y-6 px-4 py-5 sm:px-5 lg:overflow-y-auto">
                <section className="space-y-4">
                  <SectionLabel>Content</SectionLabel>
                  <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-1">
                    {(["words", "sentences", "paragraphs", "structured"] as GenerationMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setMode(mode)}
                        className={`min-h-10 rounded-[var(--radius-sm)] px-2 text-xs font-bold capitalize outline-none transition focus-visible:shadow-[var(--focus-ring)] ${
                          draftConfig.mode === mode
                            ? "border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]"
                            : "border border-transparent text-[var(--color-text-tertiary)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  <Field label={MODE_LIMITS[draftConfig.mode].label} hint={`${MODE_LIMITS[draftConfig.mode].min}–${MODE_LIMITS[draftConfig.mode].max}`}>
                    <Input
                      type="number"
                      className="w-full"
                      min={MODE_LIMITS[draftConfig.mode].min}
                      max={MODE_LIMITS[draftConfig.mode].max}
                      value={draftConfig.amount}
                      onChange={(event) => patch({ amount: clampAmount(draftConfig.mode, Number(event.target.value)) })}
                    />
                  </Field>

                  {draftConfig.mode === "structured" ? (
                    <Field label="Structured block">
                      <Select className="w-full" value={draftConfig.structuredBlock} onChange={(event) => patch({ structuredBlock: event.target.value as StructuredBlock })}>
                        <option value="hero">Hero section</option>
                        <option value="card">Feature card</option>
                        <option value="testimonial">Testimonial</option>
                        <option value="faq">FAQ</option>
                        <option value="product">Product card</option>
                        <option value="about">About / bio</option>
                        <option value="onboarding">Onboarding step</option>
                        <option value="pricing">Pricing tier</option>
                      </Select>
                    </Field>
                  ) : null}
                </section>

                <section className="space-y-4 border-t border-[var(--color-border-default)] pt-6">
                  <SectionLabel>Style</SectionLabel>
                  <Field label="Content style">
                    <Select className="w-full" value={draftConfig.style} onChange={(event) => patch({ style: event.target.value as TextStyle })}>
                      <option value="classic">Classic Latin</option>
                      <option value="readable">Readable neutral</option>
                      <option value="startup">Startup / SaaS</option>
                      <option value="ecommerce">Ecommerce</option>
                      <option value="blog">Editorial blog</option>
                      <option value="profile">Profile / bio</option>
                    </Select>
                  </Field>

                  {draftConfig.mode === "paragraphs" ? (
                    <Field label="Paragraph length">
                      <Select className="w-full" value={draftConfig.blockLength} onChange={(event) => patch({ blockLength: event.target.value as BlockLength })}>
                        <option value="short">Short · 2–3 sentences</option>
                        <option value="medium">Medium · 3–5 sentences</option>
                        <option value="long">Long · 5–8 sentences</option>
                      </Select>
                    </Field>
                  ) : null}
                </section>

                <section className="space-y-4 border-t border-[var(--color-border-default)] pt-6">
                  <SectionLabel>Output</SectionLabel>
                  <Field label="Default export">
                    <Select className="w-full" value={draftConfig.outputFormat} onChange={(event) => patch({ outputFormat: event.target.value as OutputFormat })}>
                      <option value="plain">Plain text</option>
                      <option value="html">Standalone HTML</option>
                    </Select>
                  </Field>
                </section>

                <section className="border-t border-[var(--color-border-default)] pt-4">
                  <button
                    type="button"
                    onClick={() => setAdvancedOpen((open) => !open)}
                    aria-expanded={advancedOpen}
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-1 text-left text-sm font-black text-[var(--color-text-primary)] outline-none focus-visible:shadow-[var(--focus-ring)]"
                  >
                    <span>Advanced options</span>
                    <ChevronDown className={`h-4 w-4 text-[var(--color-text-tertiary)] transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {advancedOpen ? (
                      <motion.div
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2">
                          <Toggle
                            checked={draftConfig.startWithLorem}
                            onChange={(startWithLorem) => patch({ startWithLorem })}
                            label="Classic opening"
                            description="Begin with “Lorem ipsum dolor sit amet”."
                            disabled={draftConfig.style !== "classic" || !["sentences", "paragraphs"].includes(draftConfig.mode)}
                          />
                          <Toggle
                            checked={draftConfig.includeHeadings}
                            onChange={(includeHeadings) => patch({ includeHeadings })}
                            label="Section headings"
                            description="Insert headings every two or three paragraphs."
                            disabled={draftConfig.mode !== "paragraphs"}
                          />
                          <Toggle
                            checked={draftConfig.includeLists}
                            onChange={(includeLists) => patch({ includeLists })}
                            label="Example list"
                            description="Insert a practical list after longer sections."
                            disabled={draftConfig.mode !== "paragraphs"}
                          />

                          <div className="pt-4">
                            <Field label="Reproducible seed" hint="Same seed = same copy">
                              <div className="flex gap-2">
                                <Input
                                  className="min-w-0 flex-1 font-mono text-xs"
                                  value={draftConfig.seed}
                                  onChange={(event) => patch({ seed: event.target.value })}
                                  placeholder="campaign-homepage-v1"
                                />
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  leftIcon={<RefreshCw className="h-4 w-4" />}
                                  onClick={() => patch({ seed: createSeed() })}
                                  title="Create a new seed"
                                >
                                  Create a new seed
                                </Button>
                              </div>
                            </Field>
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </section>
              </div>

              <div className="sticky bottom-0 mt-auto border-t border-[var(--color-border-default)] bg-[color-mix(in_srgb,var(--color-surface-subtle)_94%,transparent)] p-4 shadow-[0_-10px_24px_rgba(20,18,16,0.06)] backdrop-blur sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3 text-xs">
                  <span className={`font-bold ${isDirty ? "text-[var(--color-primary-text-strong)]" : "text-[var(--color-text-tertiary)]"}`}>
                    {!hasGenerated ? "Ready to create your first result" : isDirty ? "Settings changed · preview not updated" : "Preview is up to date"}
                  </span>
                  {hasGenerated ? (
                    <button type="button" onClick={resetSettings} className="font-semibold text-[var(--color-text-tertiary)] underline-offset-4 hover:text-[var(--color-text-primary)] hover:underline">
                      Reset settings
                    </button>
                  ) : null}
                </div>
                <Button
                  size="lg"
                  fullWidth
                  leftIcon={<Sparkles className="h-4 w-4" />}
                  onClick={() => generateContent()}
                >
                  {!hasGenerated ? "Generate content" : isDirty ? "Update preview" : "Regenerate content"}
                </Button>
                {hasGenerated ? (
                  <Button
                    className="mt-2"
                    size="sm"
                    fullWidth
                    variant="ghost"
                    leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                    onClick={generateVariation}
                  >
                    New variation
                  </Button>
                ) : null}
              </div>
            </div>
          </aside>

          <section className={`${mobilePanel === "preview" ? "block" : "hidden"} min-w-0 bg-[var(--color-surface-overlay)] lg:block`}>
            <div className="flex min-h-full flex-col">
              <header className="border-b border-[var(--color-border-subtle)] px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-black text-[var(--color-text-primary)]">Generated content</h2>
                      {hasGenerated ? (
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-bold ${reviewCount === 0 ? CHECK_STYLES.success : CHECK_STYLES.warning}`}>
                          {reviewCount === 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                          {reviewCount === 0 ? "Ready" : `${reviewCount} review item${reviewCount === 1 ? "" : "s"}`}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
                      {hasGenerated
                        ? `${stats.words} words · ${stats.blocks} block${stats.blocks === 1 ? "" : "s"} · ${formatReadingTime(stats.readingTimeSeconds)}`
                        : "Configure the content, generate it, then copy or export the result."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <CopyButton size="sm" text={hasGenerated ? copyValue : ""} disabled={!hasGenerated}>
                      Copy content
                    </CopyButton>
                    <details className="group relative">
                      <summary className="inline-flex min-h-8 cursor-pointer list-none items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-3 text-xs font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] outline-none transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)] focus-visible:shadow-[var(--focus-ring)] [&::-webkit-details-marker]:hidden">
                        <Download className="h-3.5 w-3.5" />
                        Export
                        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="absolute right-0 z-20 mt-2 w-56 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-2 shadow-[var(--shadow-lg)]">
                        <button disabled={!hasGenerated} type="button" onClick={downloadActive} className="flex min-h-10 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-control-hover)] disabled:opacity-45">
                          <FileText className="h-4 w-4 text-[var(--color-primary-text-strong)]" /> Download current view
                        </button>
                        <button disabled={!hasGenerated || zipBusy} type="button" onClick={() => void downloadPack()} className="flex min-h-10 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-control-hover)] disabled:opacity-45">
                          <PackageCheck className="h-4 w-4 text-[var(--color-primary-text-strong)]" /> Complete ZIP pack
                        </button>
                      </div>
                    </details>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-[var(--color-border-subtle)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex max-w-full gap-1 overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-1">
                    {(["preview", "plain", "html", "react", "report"] as LoremResultTab[]).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        disabled={!hasGenerated}
                        className={`min-h-9 shrink-0 rounded-[var(--radius-sm)] px-3 text-xs font-bold outline-none transition focus-visible:shadow-[var(--focus-ring)] disabled:opacity-45 ${
                          activeTab === tab
                            ? "bg-[var(--color-surface-base)] text-[var(--color-primary-text-strong)] shadow-[var(--shadow-xs)]"
                            : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                        }`}
                      >
                        {TAB_LABELS[tab]}
                      </button>
                    ))}
                  </div>

                  {activeTab === "preview" ? (
                    <div className="flex gap-1 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-1">
                      <button
                        type="button"
                        onClick={() => setViewport("desktop")}
                        className={`inline-flex min-h-8 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-xs font-bold outline-none transition focus-visible:shadow-[var(--focus-ring)] ${
                          viewport === "desktop" ? "bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]" : "text-[var(--color-text-tertiary)]"
                        }`}
                      >
                        <Monitor className="h-3.5 w-3.5" /> Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewport("mobile")}
                        className={`inline-flex min-h-8 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-xs font-bold outline-none transition focus-visible:shadow-[var(--focus-ring)] ${
                          viewport === "mobile" ? "bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]" : "text-[var(--color-text-tertiary)]"
                        }`}
                      >
                        <Smartphone className="h-3.5 w-3.5" /> Mobile
                      </button>
                    </div>
                  ) : null}
                </div>
              </header>

              <div className="flex-1 bg-[color-mix(in_srgb,var(--color-surface-subtle)_82%,var(--color-border-subtle))] p-3 sm:p-5">
                {!hasGenerated ? (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative flex min-h-[500px] items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-base)] px-6 py-12 text-center"
                  >
                    <div className="absolute -left-12 top-12 h-44 w-44 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_9%,transparent)] blur-3xl" aria-hidden />
                    <div className="absolute -right-10 bottom-10 h-44 w-44 rounded-full bg-[rgba(19,184,166,0.08)] blur-3xl" aria-hidden />
                    <div className="relative max-w-sm">
                      <div className="mx-auto flex h-24 w-20 flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white p-4 shadow-[0_16px_36px_rgba(28,24,20,0.10)]">
                        <span className="h-2 w-8 rounded-full bg-[var(--color-primary-soft)]" />
                        <span className="h-1.5 w-full rounded-full bg-[var(--color-border-default)]" />
                        <span className="h-1.5 w-4/5 rounded-full bg-[var(--color-border-subtle)]" />
                        <span className="h-1.5 w-full rounded-full bg-[var(--color-border-subtle)]" />
                        <span className="mt-1 h-5 w-12 rounded-full bg-[var(--color-primary)]" />
                      </div>
                      <h3 className="mt-6 text-lg font-black text-[var(--color-text-primary)]">Your content will appear here</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                        Choose a preset or adjust the settings, then generate a stable preview for review and export.
                      </p>
                      <Button className="mt-5" leftIcon={<Sparkles className="h-4 w-4" />} onClick={() => generateContent()}>
                        Generate content
                      </Button>
                    </div>
                  </motion.div>
                ) : activeTab === "preview" ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${generationVersion}-${viewport}`}
                      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                      transition={{ duration: reduceMotion ? 0 : 0.24 }}
                      className={`mx-auto overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-white shadow-[0_16px_38px_rgba(28,24,20,0.10)] transition-[width] duration-300 ${
                        viewport === "mobile" ? "w-full max-w-[390px]" : "w-full"
                      }`}
                    >
                      <iframe title="Generated placeholder preview" className="h-[520px] w-full bg-white" sandbox="" srcDoc={previewDocument} />
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <motion.div
                    key={`${generationVersion}-${activeTab}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] shadow-[var(--shadow-sm)]"
                  >
                    <pre className="max-h-[600px] min-h-[520px] overflow-auto whitespace-pre-wrap break-words bg-[var(--color-code-bg)] p-5 font-mono text-xs leading-6 text-[var(--color-code-text)]">{activeCode}</pre>
                    <div className="absolute right-3 top-3">
                      <CopyButton size="sm" variant="secondary" text={activeCode}>Copy</CopyButton>
                    </div>
                  </motion.div>
                )}
              </div>

              <footer className="flex flex-col gap-3 border-t border-[var(--color-border-subtle)] px-4 py-3 text-xs text-[var(--color-text-tertiary)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-success-text)]" />
                  Generated locally · no content leaves your browser
                </span>
                {hasGenerated ? (
                  <span className="font-mono">
                    Seed: <span className="text-[var(--color-text-secondary)]">{generatedConfig.seed || "darma-placeholder"}</span>
                  </span>
                ) : null}
              </footer>
            </div>
          </section>
        </div>
      </section>

      {hasGenerated ? (
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)]">
          <button
            type="button"
            onClick={() => setChecksOpen((open) => !open)}
            aria-expanded={checksOpen}
            className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left outline-none focus-visible:shadow-[var(--focus-ring)] sm:px-5"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${reviewCount === 0 ? CHECK_STYLES.success : CHECK_STYLES.warning}`}>
                {reviewCount === 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-[var(--color-text-primary)]">Production checks</span>
                <span className="mt-0.5 block text-xs text-[var(--color-text-tertiary)]">
                  {reviewCount === 0 ? "All placeholder checks passed." : `${reviewCount} item${reviewCount === 1 ? "" : "s"} need review before handoff.`}
                </span>
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-2 text-xs font-bold text-[var(--color-primary-text-strong)]">
              {checksOpen ? "Hide checks" : "View checks"}
              <ChevronRight className={`h-4 w-4 transition-transform ${checksOpen ? "rotate-90" : ""}`} />
            </span>
          </button>

          <AnimatePresence initial={false}>
            {checksOpen ? (
              <motion.div
                initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.22 }}
                className="overflow-hidden border-t border-[var(--color-border-subtle)]"
              >
                <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                  {report.checks.map((check) => (
                    <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}>
                      <div className="flex items-start gap-2">
                        {check.level === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                        <div className="min-w-0">
                          <div className="text-xs font-black">{check.title}</div>
                          <div className="mt-1 text-xs leading-5 opacity-90">{check.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>
      ) : null}

      {hasGenerated ? (
        <section className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
          {[
            ["Words", stats.words.toLocaleString(), `${stats.sentences} sentences`],
            ["Payload", formatBytes(stats.bytes), `${stats.characters.toLocaleString()} characters`],
            ["Reading", formatReadingTime(stats.readingTimeSeconds), `${Math.round(stats.uniqueWordRatio * 100)}% unique words`],
            ["Blocks", stats.blocks.toLocaleString(), `${stats.paragraphs} paragraphs`],
          ].map(([label, value, hint]) => (
            <div key={label} className="min-w-0 border-l-2 border-[var(--color-primary-border)] pl-3">
              <div className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
              <div className="mt-1 truncate text-lg font-black text-[var(--color-text-primary)]">{value}</div>
              <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div>
            </div>
          ))}
        </section>
      ) : null}

      {hasGenerated ? (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black text-[var(--color-text-primary)]">Quick exports</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">Download only the format needed for the current handoff.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" leftIcon={<FileText className="h-3.5 w-3.5" />} onClick={() => downloadText("placeholder-content.txt", output.plain)}>Plain text</Button>
              <Button size="sm" variant="secondary" leftIcon={<Code2 className="h-3.5 w-3.5" />} onClick={() => downloadText("placeholder-content.html", previewDocument, "text/html;charset=utf-8")}>HTML</Button>
              <Button size="sm" variant="secondary" leftIcon={<Braces className="h-3.5 w-3.5" />} onClick={() => downloadText("PlaceholderContent.tsx", reactStarter)}>React</Button>
              <Button size="sm" variant="secondary" leftIcon={<FileJson className="h-3.5 w-3.5" />} onClick={() => downloadText("placeholder-report.json", reportJson, "application/json;charset=utf-8")}>JSON</Button>
              <Button size="sm" variant="secondary" leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />} onClick={() => downloadText("placeholder-blocks.csv", blocksCsv, "text/csv;charset=utf-8")}>CSV</Button>
              <Button size="sm" variant="secondary" leftIcon={<PackageCheck className="h-3.5 w-3.5" />} loading={zipBusy} onClick={() => void downloadPack()}>ZIP pack</Button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
