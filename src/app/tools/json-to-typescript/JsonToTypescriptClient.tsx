"use client";

import { useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import {
  AlertTriangle,
  Braces,
  CheckCircle2,
  Download,
  FileCode2,
  FileJson,
  Import,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button, CopyButton, Input, Select } from "@/components/ui";
import { EditorPanel } from "@/features/tools/components";
import { downloadText } from "../_shared/clientUtils";
import {
  analyzeJsonStructure,
  buildInferenceReport,
  buildProductionChecks,
  generateArtifacts,
  inferTypeScript,
  JSON_TO_TS_INPUT_LIMIT,
  parseJsonInput,
} from "./infer";
import { DEFAULT_OPTIONS, JSON_EXAMPLES, OPTION_HELP } from "./presets";
import type {
  ArrayHandling,
  GeneratedArtifactId,
  InferOptions,
  JsonCheckLevel,
  NullHandling,
  OutputStyle,
} from "./types";

const CHECK_STYLES: Record<JsonCheckLevel, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

const ARTIFACTS: Array<{ id: GeneratedArtifactId; label: string; language: string; filename: string }> = [
  { id: "typescript", label: "TypeScript", language: "TypeScript", filename: "types.ts" },
  { id: "zod", label: "Zod starter", language: "TypeScript", filename: "schema.zod.ts" },
  { id: "json-schema", label: "JSON Schema", language: "JSON", filename: "schema.json" },
  { id: "report", label: "Audit report", language: "JSON", filename: "inference-report.json" },
];

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]"><div className="truncate font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div><div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]">{value}</div><div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div></div>;
}

function artifactCode(id: GeneratedArtifactId, artifacts: ReturnType<typeof generateArtifacts> | null): string {
  if (!artifacts) return "";
  if (id === "typescript") return artifacts.typescript;
  if (id === "zod") return artifacts.zod;
  if (id === "json-schema") return artifacts.jsonSchema;
  return artifacts.report;
}

export default function JsonToTypescriptClient() {
  const initialPreset = JSON_EXAMPLES[0]!;
  const [input, setInput] = useState(initialPreset.value);
  const [options, setOptions] = useState<InferOptions>({ ...DEFAULT_OPTIONS, rootName: initialPreset.rootName });
  const [activeArtifact, setActiveArtifact] = useState<GeneratedArtifactId>("typescript");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseJsonInput(input), [input]);
  const output = useMemo(() => parsed.ok ? inferTypeScript(parsed.value, options) : null, [parsed, options]);
  const stats = useMemo(() => parsed.ok ? analyzeJsonStructure(parsed.value) : null, [parsed]);
  const checks = useMemo(() => stats ? buildProductionChecks(stats, input.length) : [], [stats, input.length]);
  const report = useMemo(() => parsed.ok && output ? buildInferenceReport(parsed.value, input.length, output, options) : null, [parsed, input.length, output, options]);
  const artifacts = useMemo(() => parsed.ok ? generateArtifacts(parsed.value, input.length, options) : null, [parsed, input.length, options]);
  const currentArtifact = ARTIFACTS.find((item) => item.id === activeArtifact) ?? ARTIFACTS[0]!;
  const currentCode = artifactCode(activeArtifact, artifacts);
  const reviewCount = checks.filter((check) => check.level === "warning" || check.level === "danger").length;

  function updateOption<K extends keyof InferOptions>(key: K, value: InferOptions[K]) {
    setOptions((current) => ({ ...current, [key]: value }));
  }

  function applyPreset(id: string) {
    const preset = JSON_EXAMPLES.find((item) => item.id === id);
    if (!preset) return;
    setInput(preset.value);
    setOptions({ ...DEFAULT_OPTIONS, ...preset.options, rootName: preset.rootName });
    setActiveArtifact("typescript");
  }

  function importJson(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setInput(reader.result);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      if (baseName) updateOption("rootName", baseName);
    };
    reader.readAsText(file);
  }

  function formatInput() {
    if (!parsed.ok) return;
    setInput(JSON.stringify(parsed.value, null, 2));
  }

  async function downloadPack() {
    if (!artifacts || !output || !report) return;
    const zip = new JSZip();
    zip.file("input.json", parsed.ok ? `${JSON.stringify(parsed.value, null, 2)}\n` : input);
    zip.file(`${output.rootName}.ts`, artifacts.typescript);
    zip.file(`${output.rootName}.schema.ts`, artifacts.zod);
    zip.file(`${output.rootName}.schema.json`, artifacts.jsonSchema);
    zip.file("inference-report.json", artifacts.report);
    zip.file("README.md", `# ${output.rootName} generated contract\n\n- \`${output.rootName}.ts\`: inferred compile-time declarations\n- \`${output.rootName}.schema.ts\`: Zod runtime-validation starter (install Zod in the consuming project)\n- \`${output.rootName}.schema.json\`: JSON Schema Draft 2020-12 starter\n- \`inference-report.json\`: structure metrics, warnings, and production checks\n\nGenerated locally by Darma. Review inferred contracts against real API documentation before production use.\n`);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${output.rootName}-contract-pack.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const parseError = "error" in parsed
    ? `${parsed.error}${parsed.line ? ` (line ${parsed.line}${parsed.column ? `, column ${parsed.column}` : ""})` : ""}`
    : undefined;

  return <div className="space-y-4">
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Root contract" value={output?.rootName ?? "—"} hint={stats ? `${stats.rootKind} root` : "Waiting for valid JSON"} />
      <SummaryCard label="Declarations" value={output ? String(output.declarationCount) : "—"} hint={output ? `${options.outputStyle} output` : "Nested types appear here"} />
      <SummaryCard label="Structure" value={stats ? `${stats.nodeCount} nodes` : "—"} hint={stats ? `Depth ${stats.maxDepth} · ${stats.propertyCount} properties` : "Local structural analysis"} />
      <SummaryCard label="Production review" value={parsed.ok ? (reviewCount ? `${reviewCount} flag${reviewCount === 1 ? "" : "s"}` : "Ready") : "Invalid"} hint={parsed.ok ? `${checks.length} checks · ${output?.warnings.length ?? 0} inference notes` : "Fix JSON syntax first"} />
    </div>

    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_350px]">
      <main className="min-w-0 space-y-4">
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <EditorPanel
            title="Input JSON"
            language="JSON"
            value={input}
            onChange={setInput}
            minRows={22}
            placeholder="Paste a representative JSON response…"
            error={parseError}
            actions={<>
              <input ref={fileInputRef} type="file" accept=".json,application/json,text/json" className="hidden" onChange={(event) => { importJson(event.target.files?.[0]); event.currentTarget.value = ""; }} />
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}><Import className="h-4 w-4" />Import</Button>
              <Button size="sm" variant="secondary" onClick={formatInput} disabled={!parsed.ok}>Format</Button>
              <Button size="sm" variant="ghost" onClick={() => setInput("")} disabled={!input}>Clear</Button>
            </>}
            footer={`${input.length.toLocaleString()} / ${JSON_TO_TS_INPUT_LIMIT.toLocaleString()} characters · browser-only parsing`}
          />

          <div className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-3 py-2.5">
              <div className="flex flex-wrap gap-1">
                {ARTIFACTS.map((artifact) => <Button key={artifact.id} size="sm" variant={activeArtifact === artifact.id ? "primary" : "ghost"} onClick={() => setActiveArtifact(artifact.id)}>{artifact.label}</Button>)}
              </div>
              <div className="flex gap-2"><CopyButton text={currentCode} size="sm" variant="secondary" disabled={!currentCode}>Copy</CopyButton><Button size="sm" variant="secondary" disabled={!currentCode} onClick={() => downloadText(currentArtifact.filename, currentCode, activeArtifact === "json-schema" || activeArtifact === "report" ? "application/json;charset=utf-8" : "text/typescript;charset=utf-8")}><Download className="h-4 w-4" />Download</Button></div>
            </div>
            <EditorPanel
              title={currentArtifact.label}
              language={currentArtifact.language}
              value={currentCode}
              readOnly
              minRows={19}
              placeholder="Generated artifacts will appear after valid JSON is parsed."
              error={!parsed.ok ? parseError : undefined}
              footer={activeArtifact === "zod" ? "Zod runtime-validation starter; review refinements and API error shapes." : activeArtifact === "json-schema" ? "Draft 2020-12 starter; review required fields and formats." : activeArtifact === "report" ? "No secrets are transmitted; the report is generated in this tab." : `${output?.declarationCount ?? 0} generated declaration${output?.declarationCount === 1 ? "" : "s"}.`}
              className="rounded-none border-0 shadow-none"
            />
          </div>
        </div>

        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] px-4 py-3"><div><h2 className="font-bold text-[var(--color-text-primary)]">Production checks</h2><p className="text-xs text-[var(--color-text-tertiary)]">Inference is a starting point—not proof that every production response follows the same shape.</p></div><span className="rounded-full border border-[var(--color-border-subtle)] px-2.5 py-1 font-mono text-xs text-[var(--color-text-tertiary)]">{checks.length} checks</span></div>
          {!parsed.ok ? <div className="p-5 text-sm text-[var(--color-danger-text)]">Fix the JSON syntax to run structural checks.</div> : <div className="grid gap-2 p-4 md:grid-cols-2">{checks.map((check) => <article key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}><div className="flex items-start gap-2">{check.level === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : check.level === "warning" || check.level === "danger" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />}<div><h3 className="font-bold">{check.title}</h3><p className="mt-1 text-xs leading-5 opacity-90">{check.message}</p></div></div></article>)}</div>}
        </section>
      </main>

      <aside className="space-y-3">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
          <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Sparkles className="h-4 w-4" />Practical presets</div>
          <div className="space-y-2">{JSON_EXAMPLES.map((preset) => <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-2.5 text-left transition hover:border-[var(--color-accent)]"><div className="text-sm font-bold text-[var(--color-text-primary)]">{preset.label}</div><div className="mt-0.5 text-xs leading-4 text-[var(--color-text-tertiary)]">{preset.description}</div></button>)}</div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
          <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Braces className="h-4 w-4" />Type options</div>
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
            <label className="text-xs font-semibold text-[var(--color-text-muted)]">Root name<Input size="sm" className="mt-1" value={options.rootName} onChange={(event) => updateOption("rootName", event.target.value)} placeholder="ApiResponse" /></label>
            <label className="text-xs font-semibold text-[var(--color-text-muted)]">Declaration style<Select size="sm" className="mt-1" value={options.outputStyle} onChange={(event) => updateOption("outputStyle", event.target.value as OutputStyle)}><option value="interface">interface</option><option value="type">type alias</option></Select></label>
            <label className="text-xs font-semibold text-[var(--color-text-muted)]">Null handling<Select size="sm" className="mt-1" value={options.nullHandling} onChange={(event) => updateOption("nullHandling", event.target.value as NullHandling)}><option value="include-null">include null unions</option><option value="null-as-optional">treat null as optional</option></Select></label>
            <label className="text-xs font-semibold text-[var(--color-text-muted)]">Array sampling<Select size="sm" className="mt-1" value={options.arrayHandling} onChange={(event) => updateOption("arrayHandling", event.target.value as ArrayHandling)}><option value="all-items">inspect all items</option><option value="first-item">first item only</option></Select></label>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">{([
            ["exportTypes", "Export declarations"],
            ["optionalProperties", "All optional"],
            ["readonlyProperties", "Readonly fields"],
            ["useSemicolons", "Semicolons"],
          ] as const).map(([key, label]) => <Button key={key} size="sm" variant={options[key] ? "primary" : "secondary"} aria-pressed={options[key]} onClick={() => updateOption(key, !options[key])}>{label}</Button>)}</div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
          <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><PackageCheck className="h-4 w-4" />Production exports</div>
          <div className="space-y-2">
            <CopyButton className="w-full" text={artifacts?.typescript ?? ""} disabled={!artifacts}>Copy TypeScript</CopyButton>
            <Button className="w-full" variant="secondary" disabled={!artifacts} onClick={() => artifacts && downloadText(`${output?.rootName ?? "types"}.schema.json`, artifacts.jsonSchema, "application/json;charset=utf-8")}><FileJson className="h-4 w-4" />Download JSON Schema</Button>
            <Button className="w-full" variant="secondary" disabled={!artifacts} onClick={() => artifacts && downloadText(`${output?.rootName ?? "types"}.schema.ts`, artifacts.zod, "text/typescript;charset=utf-8")}><FileCode2 className="h-4 w-4" />Download Zod starter</Button>
            <Button className="w-full" disabled={!artifacts} onClick={downloadPack}><Download className="h-4 w-4" />Download contract pack</Button>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-xs leading-5 text-[var(--color-info-text)]">
          <div className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />Compile-time vs runtime</div>
          <p className="mt-1">TypeScript types do not validate network responses. Use the generated runtime-schema starter and test it against documented success and error payloads.</p>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-xs text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]"><ShieldCheck className="h-4 w-4" />Private browser processing</div>
          <p className="mt-1 leading-5">Parsing, inference, schema generation, and ZIP creation happen locally. Still remove real credentials before sharing exported fixtures.</p>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
          <div className="text-xs font-bold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">Inference guidance</div>
          <div className="mt-2 space-y-2">{OPTION_HELP.map((item) => <div key={item.title}><div className="text-xs font-bold text-[var(--color-text-primary)]">{item.title}</div><p className="text-xs leading-4 text-[var(--color-text-tertiary)]">{item.description}</p></div>)}</div>
        </section>
      </aside>
    </div>
  </div>;
}
