"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import JSZip from "jszip";
import {
  Braces,
  CheckCircle2,
  Clock3,
  Copy,
  Database,
  Download,
  FileJson,
  Fingerprint,
  Gauge,
  KeyRound,
  ListChecks,
  PackageCheck,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button, CopyButton, Input, Select } from "@/components/ui";
import { CodeOutputPanel, type CodeOutputTab } from "@/features/tools/components";
import { downloadText } from "../_shared/clientUtils";
import {
  approximateCollisionProbability,
  buildUuidAuditReport,
  buildUuidChecks,
  buildUuidSql,
  buildUuidTypeScript,
  formatProbability,
  generateUuidBatch,
  hasSecureRandomSupport,
  inspectUuid,
  normalizeUuidCount,
  serializeUuids,
  UUID_MAX_BATCH_SIZE,
} from "./uuid";
import {
  DEFAULT_UUID_PRESET,
  FORMAT_OPTIONS,
  OUTPUT_STYLE_OPTIONS,
  UUID_PRESETS,
  VERSION_OPTIONS,
} from "./presets";
import type {
  UuidCheckLevel,
  UuidFormat,
  UuidGenerationConfig,
  UuidOutputStyle,
  UuidTab,
  UuidVersion,
} from "./types";

const CHECK_STYLES: Record<UuidCheckLevel, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function SummaryCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: ReactNode }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</span>
        <span className="text-[var(--color-primary-text-strong)]">{icon}</span>
      </div>
      <div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]" title={value}>{value}</div>
      <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="truncate text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 break-words font-mono text-sm font-black text-[var(--color-text-primary)]" title={value}>{value}</div>
      {hint ? <div className="mt-1 text-xs leading-4 text-[var(--color-text-tertiary)]">{hint}</div> : null}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
        <span>{label}</span>
        {hint ? <span className="font-normal text-[var(--color-text-tertiary)]">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function filenameForStyle(style: UuidOutputStyle): string {
  if (style === "json") return "uuids.json";
  if (style === "csv") return "uuids.csv";
  return "uuids.txt";
}

export default function UuidGeneratorClient() {
  const [version, setVersion] = useState<UuidVersion>(DEFAULT_UUID_PRESET.version);
  const [count, setCount] = useState(DEFAULT_UUID_PRESET.count);
  const [format, setFormat] = useState<UuidFormat>(DEFAULT_UUID_PRESET.format);
  const [outputStyle, setOutputStyle] = useState<UuidOutputStyle>(DEFAULT_UUID_PRESET.outputStyle);
  const [values, setValues] = useState<string[]>([]);
  const [inspectorInput, setInspectorInput] = useState("");
  const [activeTab, setActiveTab] = useState<UuidTab>("generator");
  const [error, setError] = useState<string | null>(null);

  const config = useMemo<UuidGenerationConfig>(() => ({ version, count, format, outputStyle }), [version, count, format, outputStyle]);
  const current = values[0] ?? "";
  const serialized = useMemo(() => serializeUuids(values, outputStyle), [values, outputStyle]);
  const inspection = useMemo(() => inspectUuid(inspectorInput || current), [inspectorInput, current]);
  const checks = useMemo(() => buildUuidChecks(config, values, inspectorInput.trim() || current ? inspection : null), [config, values, inspection, inspectorInput, current]);
  const report = useMemo(() => buildUuidAuditReport(config, values, inspectorInput.trim() || current ? inspection : null, checks), [config, values, inspection, checks, inspectorInput, current]);
  const reportJson = useMemo(() => `${JSON.stringify(report, null, 2)}\n`, [report]);
  const sql = useMemo(() => buildUuidSql(values), [values]);
  const typeScript = useMemo(() => buildUuidTypeScript(values), [values]);
  const reviewCount = checks.filter((check) => check.level === "warning" || check.level === "danger").length;
  const collisionProbability = formatProbability(approximateCollisionProbability(values.length || count, version));

  function generate(nextConfig: UuidGenerationConfig = config, amount = nextConfig.count) {
    try {
      const generated = generateUuidBatch(amount, nextConfig.format, nextConfig.version);
      setValues(generated);
      setInspectorInput(generated[0] ?? "");
      setError(null);
    } catch (generationError) {
      setValues([]);
      setError(generationError instanceof Error ? generationError.message : "Unable to generate UUIDs in this browser context.");
    }
  }

  useEffect(() => {
    try {
      const generated = generateUuidBatch(
        DEFAULT_UUID_PRESET.count,
        DEFAULT_UUID_PRESET.format,
        DEFAULT_UUID_PRESET.version,
      );
      setValues(generated);
      setInspectorInput(generated[0] ?? "");
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Unable to generate UUIDs in this browser context.");
    }
  }, []);

  function applyPreset(id: string) {
    const preset = UUID_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setVersion(preset.version);
    setCount(preset.count);
    setFormat(preset.format);
    setOutputStyle(preset.outputStyle);
    generate({ version: preset.version, count: preset.count, format: preset.format, outputStyle: preset.outputStyle });
    setActiveTab("generator");
  }

  function reset() {
    applyPreset(DEFAULT_UUID_PRESET.id);
  }

  async function downloadPack() {
    const zip = new JSZip();
    zip.file(filenameForStyle(outputStyle), serialized);
    zip.file("uuids.json", `${JSON.stringify(values, null, 2)}\n`);
    zip.file("uuid-seed.sql", sql);
    zip.file("uuids.ts", typeScript);
    zip.file("uuid-audit.json", reportJson);
    zip.file("README.md", `# Darma UUID production pack\n\n- \`${filenameForStyle(outputStyle)}\`: selected batch output\n- \`uuids.json\`: JSON array\n- \`uuid-seed.sql\`: starter SQL insert\n- \`uuids.ts\`: typed constant array\n- \`uuid-audit.json\`: generation settings, inspection, and checks\n\nGenerated locally in the browser. UUIDs are identifiers, not secrets.\n`);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "uuid-production-pack.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const tabs: Array<{ id: UuidTab; label: string; icon: ReactNode }> = [
    { id: "generator", label: "Generator", icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: "inspector", label: "Inspector", icon: <SearchCheck className="h-3.5 w-3.5" /> },
    { id: "exports", label: "Checks & exports", icon: <PackageCheck className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <SummaryCard label="Version" value={version.toUpperCase()} hint={version === "v7" ? "Time-ordered prefix" : "Random identifier"} icon={<Fingerprint className="h-4 w-4" />} />
        <SummaryCard label="Generated" value={String(values.length)} hint={`${new Set(values).size} unique in batch`} icon={<Database className="h-4 w-4" />} />
        <SummaryCard label="Collision estimate" value={collisionProbability} hint={`Approximation for ${values.length || count} values`} icon={<Gauge className="h-4 w-4" />} />
        <SummaryCard label="Production review" value={reviewCount ? `${reviewCount} to review` : "Ready"} hint={hasSecureRandomSupport() ? "Secure random available" : "Generation blocked"} icon={reviewCount ? <ListChecks className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />} />
      </div>

      <div className="flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-xs font-bold transition ${activeTab === tab.id ? "bg-[var(--color-surface-base)] text-[var(--color-text-primary)] shadow-[var(--shadow-xs)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)]"}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "generator" ? (
        <div className="space-y-4">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3 shadow-[var(--shadow-xs)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-[var(--color-text-primary)]">Practical presets</h2>
                <p className="text-xs text-[var(--color-text-tertiary)]">Apply a workflow-ready version, quantity, format, and output.</p>
              </div>
              <Sparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {UUID_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-left transition hover:border-[var(--color-primary-border)] hover:bg-[var(--color-primary-soft)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-black text-[var(--color-text-primary)]">{preset.name}</span>
                    <span className="rounded-full border border-[var(--color-border-subtle)] px-2 py-0.5 font-mono text-xs font-bold uppercase text-[var(--color-text-tertiary)]">{preset.version} · {preset.count}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-4 text-[var(--color-text-tertiary)]">{preset.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3 shadow-[var(--shadow-xs)]">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="UUID version" hint="RFC 9562">
                <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-subtle)] p-1">
                  {VERSION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setVersion(option.value)}
                      title={option.description}
                      className={`min-h-8 rounded-[var(--radius-sm)] px-2 text-xs font-bold ${version === option.value ? "bg-[var(--color-surface-base)] text-[var(--color-primary-text-strong)] shadow-[var(--shadow-xs)]" : "text-[var(--color-text-secondary)]"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Batch count" hint={`1–${UUID_MAX_BATCH_SIZE}`}>
                <Input type="number" min={1} max={UUID_MAX_BATCH_SIZE} value={count} onChange={(event: ChangeEvent<HTMLInputElement>) => setCount(normalizeUuidCount(Number(event.target.value)))} />
              </Field>
              <Field label="Representation">
                <Select value={format} onChange={(event: ChangeEvent<HTMLSelectElement>) => setFormat(event.target.value as UuidFormat)}>
                  {FORMAT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              </Field>
              <Field label="Batch output">
                <Select value={outputStyle} onChange={(event: ChangeEvent<HTMLSelectElement>) => setOutputStyle(event.target.value as UuidOutputStyle)}>
                  {OUTPUT_STYLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              </Field>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" leftIcon={<Sparkles className="h-3.5 w-3.5" />} onClick={() => generate(config)}>Generate batch</Button>
              <Button size="sm" variant="secondary" leftIcon={<KeyRound className="h-3.5 w-3.5" />} onClick={() => generate(config, 1)}>Generate one</Button>
              <Button size="sm" variant="ghost" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={reset}>Reset</Button>
              <CopyButton text={serialized} size="sm" variant="soft">Copy batch</CopyButton>
              <Button size="sm" variant="outline" leftIcon={<Download className="h-3.5 w-3.5" />} disabled={!serialized} onClick={() => downloadText(filenameForStyle(outputStyle), serialized, outputStyle === "json" ? "application/json;charset=utf-8" : "text/plain;charset=utf-8")}>Download</Button>
            </div>
            {error ? <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-3 text-xs text-[var(--color-danger-text)]">{error}</div> : null}
          </section>

          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Current UUID</div>
                  <div className="mt-2 break-all font-mono text-lg font-black leading-7 text-[var(--color-text-primary)]">{current || "Generate a value"}</div>
                </div>
                {current ? <CopyButton text={current} size="sm">Copy</CopyButton> : null}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <MetricCard label="Version" value={inspection.valid ? inspection.versionLabel : "—"} />
                <MetricCard label="Variant" value={inspection.valid ? inspection.variant : "—"} />
              </div>
            </section>

            <section className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)] shadow-[var(--shadow-md)]">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--color-code-border)] bg-[var(--color-code-surface)] px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-[var(--color-code-text)]">Batch output</h2>
                  <p className="text-xs text-[var(--color-code-muted)]">{values.length} value(s) · {outputStyle.toUpperCase()}</p>
                </div>
                <CopyButton text={serialized} size="sm" variant="soft">Copy</CopyButton>
              </div>
              <pre className="max-h-72 min-h-44 overflow-auto whitespace-pre-wrap break-all p-4 font-mono text-xs leading-6 text-[var(--color-code-text)]"><code>{serialized || "No generated values."}</code></pre>
            </section>
          </div>
        </div>
      ) : null}

      {activeTab === "inspector" ? (
        <div className="space-y-4">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-xs)]">
            <Field label="UUID to inspect" hint="Standard, compact, URN, or braces">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input className="font-mono" value={inspectorInput} onChange={(event: ChangeEvent<HTMLInputElement>) => setInspectorInput(event.target.value)} placeholder="018f3f60-4f35-7d2a-8c91-5f4a7c8d9e10" />
                {inspection.normalized ? <CopyButton text={inspection.normalized} size="sm" variant="secondary">Copy canonical</CopyButton> : null}
              </div>
            </Field>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Validation" value={inspection.valid ? "Valid UUID" : "Invalid"} hint={inspection.error ?? (inspection.canonical ? "Canonical lowercase form" : "Accepted alternative form")} />
            <MetricCard label="Version" value={inspection.versionLabel} hint={inspection.isNil || inspection.isMax ? "Sentinel value" : undefined} />
            <MetricCard label="Variant" value={inspection.variant} hint={inspection.variantCompatible ? "RFC-compatible bit layout" : "Review compatibility"} />
            <MetricCard label="Embedded time" value={inspection.timestampIso ?? "Not present"} hint={inspection.timestampMs === null ? "Only decoded for UUID v7" : `${inspection.timestampMs} ms since Unix epoch`} />
          </div>

          {inspection.normalized ? (
            <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><Braces className="h-4 w-4 text-[var(--color-primary-text-strong)]" /> UUID field map</div>
              <div className="grid gap-2 font-mono text-xs sm:grid-cols-[8fr_4fr_4fr_4fr_12fr]">
                {inspection.normalized.split("-").map((part, index) => (
                  <div key={`${part}-${index}`} className="min-w-0 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-2 text-center text-[var(--color-text-primary)]">
                    <div className="break-all font-bold">{part}</div>
                    <div className="mt-1 text-xs uppercase text-[var(--color-text-tertiary)]">{["time / random", "time / random", "version", "variant", "random"][index]}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><ListChecks className="h-4 w-4 text-[var(--color-primary-text-strong)]" /> Production checks</div>
            <div className="grid gap-2 lg:grid-cols-2">
              {checks.map((check) => (
                <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <div><div className="text-xs font-black">{check.title}</div><p className="mt-1 text-xs leading-4 opacity-90">{check.message}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "exports" ? (
        <div className="space-y-4">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Values" value={String(values.length)} hint="Included in every pack" />
            <MetricCard label="Format" value={format} hint="Selected representation" />
            <MetricCard label="Secure random" value={hasSecureRandomSupport() ? "Available" : "Unavailable"} hint="No Math.random fallback" />
            <MetricCard label="Audit checks" value={String(checks.length)} hint={`${reviewCount} warning/danger`} />
          </section>

          <CodeOutputPanel
            title="Production exports"
            description="Copy or download the selected batch, SQL seed starter, TypeScript constants, or redacted audit report."
            tabs={[
              { id: "batch", label: "Batch", code: serialized, language: outputStyle === "json" ? "json" : outputStyle, filename: filenameForStyle(outputStyle) },
              { id: "sql", label: "SQL", code: sql, language: "sql", filename: "uuid-seed.sql" },
              { id: "typescript", label: "TypeScript", code: typeScript, language: "typescript", filename: "uuids.ts" },
              { id: "report", label: "Audit JSON", code: reportJson, language: "json", filename: "uuid-audit.json" },
            ]}
            actions={<Button size="sm" variant="soft" leftIcon={<PackageCheck className="h-3.5 w-3.5" />} onClick={downloadPack}>Download ZIP</Button>}
            onDownload={(tab: CodeOutputTab) => downloadText(tab.filename ?? "uuid-export.txt", tab.code, tab.language === "json" ? "application/json;charset=utf-8" : "text/plain;charset=utf-8")}
          />

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
              <FileJson className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
              <div className="mt-2 text-xs font-black text-[var(--color-text-primary)]">Structured outputs</div>
              <p className="mt-1 text-xs leading-4 text-[var(--color-text-tertiary)]">JSON, CSV, SQL, and typed constants cover common fixture and seed workflows.</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
              <Clock3 className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
              <div className="mt-2 text-xs font-black text-[var(--color-text-primary)]">UUID v7 inspection</div>
              <p className="mt-1 text-xs leading-4 text-[var(--color-text-tertiary)]">The audit includes the embedded Unix-millisecond timestamp when the current value is v7.</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
              <Copy className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
              <div className="mt-2 text-xs font-black text-[var(--color-text-primary)]">Local-only workflow</div>
              <p className="mt-1 text-xs leading-4 text-[var(--color-text-tertiary)]">Generation, validation, packaging, and downloads happen in the browser.</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
