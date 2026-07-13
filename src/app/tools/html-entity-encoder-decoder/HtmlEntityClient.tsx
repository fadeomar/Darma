"use client";

import { useMemo, useState, type ReactNode } from "react";
import JSZip from "jszip";
import {
  AlertTriangle,
  Braces,
  CheckCircle2,
  Code2,
  Download,
  FileArchive,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button, CopyButton, Select, Textarea } from "@/components/ui";
import { SegmentedControl } from "@/features/tools/components";
import { downloadText } from "../_shared/clientUtils";
import {
  buildEntityChecks,
  buildEntityCodeSnippets,
  buildEntityCsv,
  buildEntityReport,
  decodeHtmlEntities,
  encodeHtmlEntities,
  getEntityStats,
  inspectHtmlEntities,
} from "./entities";
import { DEFAULT_OPTIONS, ENTITY_PRESETS, QUICK_REFERENCE } from "./presets";
import type {
  EncodeOptions,
  EntityCheckLevel,
  EntityContext,
  EntityFormat,
  EntityMode,
  EncodeScope,
} from "./types";

type DetailTab = "inspector" | "checks" | "code";
type CodeTab = "javascript" | "react";

const CHECK_STYLES: Record<EntityCheckLevel, string> = {
  success:
    "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning:
    "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger:
    "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        {label}
      </div>
      <div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]" title={value}>
        {value}
      </div>
      <div className="mt-0.5 truncate text-[11px] text-[var(--color-text-tertiary)]">{hint}</div>
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)] ${className}`}
    >
      {children}
    </section>
  );
}

function MiniLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
      {children}
    </span>
  );
}

export default function HtmlEntityClient() {
  const firstPreset = ENTITY_PRESETS[0]!;
  const [input, setInput] = useState(firstPreset.value);
  const [mode, setMode] = useState<EntityMode>(firstPreset.mode);
  const [options, setOptions] = useState<EncodeOptions>({ ...DEFAULT_OPTIONS, ...firstPreset.options });
  const [decodePasses, setDecodePasses] = useState<1 | 2>(firstPreset.decodePasses ?? 1);
  const [detailTab, setDetailTab] = useState<DetailTab>("inspector");
  const [codeTab, setCodeTab] = useState<CodeTab>("javascript");

  const output = useMemo(
    () => mode === "encode" ? encodeHtmlEntities(input, options) : decodeHtmlEntities(input, decodePasses),
    [decodePasses, input, mode, options],
  );
  const stats = useMemo(() => getEntityStats(input, output), [input, output]);
  const inspectedSource = mode === "encode" ? output : input;
  const occurrences = useMemo(() => inspectHtmlEntities(inspectedSource), [inspectedSource]);
  const checks = useMemo(
    () => buildEntityChecks({ input, output, mode, options, decodePasses }),
    [decodePasses, input, mode, options, output],
  );
  const snippets = useMemo(() => buildEntityCodeSnippets(options), [options]);
  const report = useMemo(
    () => buildEntityReport({ input, output, mode, options, decodePasses, checks, occurrences }),
    [checks, decodePasses, input, mode, occurrences, options, output],
  );
  const reportJson = useMemo(() => `${JSON.stringify(report, null, 2)}\n`, [report]);
  const entityCsv = useMemo(() => buildEntityCsv(occurrences), [occurrences]);
  const reviewCount = checks.filter((check) => check.level === "warning" || check.level === "danger").length;
  const invalidCount = occurrences.filter((occurrence) => !occurrence.valid).length;
  const activeCode = snippets[codeTab];

  function patchOptions(patch: Partial<EncodeOptions>) {
    setOptions((current) => ({ ...current, ...patch }));
  }

  function applyPreset(id: string) {
    const preset = ENTITY_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setInput(preset.value);
    setMode(preset.mode);
    setOptions({ ...DEFAULT_OPTIONS, ...preset.options });
    setDecodePasses(preset.decodePasses ?? 1);
    setDetailTab("inspector");
  }

  function swapDirection() {
    if (!output) return;
    setInput(output);
    setMode((current) => current === "encode" ? "decode" : "encode");
    setDecodePasses(1);
    setDetailTab("inspector");
  }

  async function downloadPack() {
    const zip = new JSZip();
    zip.file("input.txt", input);
    zip.file("output.txt", output);
    zip.file("entity-audit-report.json", reportJson);
    zip.file("entity-inspector.csv", entityCsv);
    zip.file("html-entity-helper.js", snippets.javascript);
    zip.file("react-safe-text.tsx", snippets.react);
    zip.file(
      "README.md",
      "# Darma HTML entity production pack\n\nGenerated locally in the browser. The pack contains the source, converted output, entity inventory, audit report, and implementation starters.\n\nHTML entity encoding is context-specific and is not a replacement for HTML sanitization. Avoid inserting decoded or untrusted strings with `dangerouslySetInnerHTML`.\n",
    );
    const blob = await zip.generateAsync({ type: "blob" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "html-entity-production-pack.zip";
    anchor.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Conversion"
          value={input ? (mode === "encode" ? "Encoded" : "Decoded") : "Waiting"}
          hint={`${mode}${mode === "decode" ? ` · ${decodePasses} pass${decodePasses === 1 ? "" : "es"}` : ` · ${options.context}`}`}
        />
        <SummaryCard
          label="Entities"
          value={occurrences.length.toLocaleString()}
          hint={`${invalidCount.toLocaleString()} unknown or invalid`}
        />
        <SummaryCard
          label="Output size"
          value={`${stats.outputCharacters.toLocaleString()} chars`}
          hint={stats.expansionRatio ? `${stats.expansionRatio.toFixed(2)}× input size` : "No input yet"}
        />
        <SummaryCard
          label="Production review"
          value={reviewCount ? `${reviewCount} to review` : "Clear"}
          hint={`${stats.nonAsciiCharacters.toLocaleString()} non-ASCII input characters`}
        />
      </div>

      <Card>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl<EntityMode>
              ariaLabel="HTML entity conversion mode"
              value={mode}
              onChange={(nextMode) => {
                setMode(nextMode);
                setDetailTab("inspector");
              }}
              options={[
                { value: "encode", label: "Encode" },
                { value: "decode", label: "Decode" },
              ]}
            />
            {mode === "decode" ? (
              <SegmentedControl<"1" | "2">
                ariaLabel="Decode passes"
                value={String(decodePasses) as "1" | "2"}
                onChange={(value) => setDecodePasses(value === "2" ? 2 : 1)}
                options={[
                  { value: "1", label: "1 pass" },
                  { value: "2", label: "2 passes" },
                ]}
              />
            ) : null}
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={swapDirection}
              disabled={!output}
            >
              Swap
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <CopyButton text={output} size="sm" variant="secondary" disabled={!output}>
              Copy output
            </CopyButton>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              disabled={!output}
              onClick={() => downloadText("html-entity-output.txt", output)}
            >
              Output
            </Button>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Braces className="h-3.5 w-3.5" />}
              onClick={() => downloadText("html-entity-audit.json", reportJson, "application/json;charset=utf-8")}
            >
              JSON
            </Button>
            <Button
              size="sm"
              leftIcon={<FileArchive className="h-3.5 w-3.5" />}
              onClick={downloadPack}
            >
              ZIP pack
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <MiniLabel>Source</MiniLabel>
              <h2 className="mt-1 text-base font-black text-[var(--color-text-primary)]">Input text</h2>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setInput("")}>Clear</Button>
          </div>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            variant="editor"
            minRows={13}
            spellCheck={false}
            placeholder="Paste HTML, text, or encoded entities..."
          />
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-[var(--color-text-tertiary)]">
            <span>{stats.inputCharacters.toLocaleString()} characters · {stats.lines.toLocaleString()} lines</span>
            <span>Browser-local processing</span>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <MiniLabel>Converted result</MiniLabel>
              <h2 className="mt-1 text-base font-black text-[var(--color-text-primary)]">Output</h2>
            </div>
            <CopyButton text={output} size="sm" variant="secondary" disabled={!output}>Copy</CopyButton>
          </div>
          <Textarea
            value={output}
            readOnly
            variant="output"
            minRows={13}
            spellCheck={false}
            placeholder="Converted output appears here."
          />
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-[var(--color-text-tertiary)]">
            <span>{stats.outputCharacters.toLocaleString()} characters · {stats.entityCount.toLocaleString()} complete entities</span>
            <span>{stats.namedEntities.toLocaleString()} named · {stats.numericEntities.toLocaleString()} numeric</span>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
            <h2 className="text-base font-black text-[var(--color-text-primary)]">Presets & controls</h2>
          </div>

          <label className="mt-4 block text-xs font-semibold text-[var(--color-text-muted)]">
            Practical preset
            <Select
              size="sm"
              className="mt-1"
              value=""
              onChange={(event) => {
                applyPreset(event.target.value);
                event.currentTarget.value = "";
              }}
            >
              <option value="">Choose a workflow…</option>
              {ENTITY_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
            </Select>
          </label>

          {mode === "encode" ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Context
                  <Select size="sm" className="mt-1" value={options.context} onChange={(event) => patchOptions({ context: event.target.value as EntityContext })}>
                    <option value="text">Text content</option>
                    <option value="double-attribute">Double-quoted attribute</option>
                    <option value="single-attribute">Single-quoted attribute</option>
                  </Select>
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Entity format
                  <Select size="sm" className="mt-1" value={options.format} onChange={(event) => patchOptions({ format: event.target.value as EntityFormat })}>
                    <option value="named">Named when known</option>
                    <option value="decimal">Decimal numeric</option>
                    <option value="hex">Hex numeric</option>
                  </Select>
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Encoding scope
                  <Select size="sm" className="mt-1" value={options.scope} onChange={(event) => patchOptions({ scope: event.target.value as EncodeScope })}>
                    <option value="essential">Essential only</option>
                    <option value="special">Known symbols</option>
                    <option value="nonAscii">All non-ASCII</option>
                  </Select>
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={options.convertQuotes ? "primary" : "secondary"} onClick={() => patchOptions({ convertQuotes: !options.convertQuotes })}>
                  Quotes in text
                </Button>
                <Button size="sm" variant={options.preserveLineBreaks ? "primary" : "secondary"} onClick={() => patchOptions({ preserveLineBreaks: !options.preserveLineBreaks })}>
                  Preserve line breaks
                </Button>
                <Button size="sm" variant={options.preserveExistingEntities ? "primary" : "secondary"} onClick={() => patchOptions({ preserveExistingEntities: !options.preserveExistingEntities })}>
                  Preserve valid entities
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-xs leading-5 text-[var(--color-info-text)]">
              Two-pass decoding is useful only for confirmed double-encoded input. It can reveal markup or other characters that were intentionally escaped, so review the output before rendering it.
            </div>
          )}

          <div className="mt-5">
            <MiniLabel>Quick reference</MiniLabel>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
              {QUICK_REFERENCE.map((item) => (
                <button
                  key={item.entity}
                  type="button"
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-2.5 py-2 text-left transition hover:border-[var(--color-border-strong)]"
                  title={item.use}
                  onClick={() => setInput((current) => `${current}${current ? " " : ""}${mode === "encode" ? item.character : item.entity}`)}
                >
                  <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">{item.entity}</span>
                  <span className="ml-2 text-sm text-[var(--color-text-secondary)]">{item.character}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {detailTab === "inspector" ? <Search className="h-4 w-4 text-[var(--color-primary)]" /> : detailTab === "checks" ? <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" /> : <Code2 className="h-4 w-4 text-[var(--color-primary)]" />}
              <h2 className="text-base font-black text-[var(--color-text-primary)]">Entity workbench</h2>
            </div>
            <SegmentedControl<DetailTab>
              ariaLabel="Entity detail view"
              value={detailTab}
              onChange={setDetailTab}
              options={[
                { value: "inspector", label: "Inspector" },
                { value: "checks", label: "Checks" },
                { value: "code", label: "Code" },
              ]}
            />
          </div>

          {detailTab === "inspector" ? (
            <div className="mt-4">
              {occurrences.length ? (
                <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
                  <div className="max-h-[390px] overflow-auto">
                    <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                      <thead className="sticky top-0 bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)]">
                        <tr>
                          <th className="px-3 py-2 font-bold">Offset</th>
                          <th className="px-3 py-2 font-bold">Entity</th>
                          <th className="px-3 py-2 font-bold">Character</th>
                          <th className="px-3 py-2 font-bold">Kind</th>
                          <th className="px-3 py-2 font-bold">Code point</th>
                          <th className="px-3 py-2 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {occurrences.slice(0, 150).map((occurrence, index) => (
                          <tr key={`${occurrence.index}-${occurrence.raw}-${index}`} className="border-t border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                            <td className="px-3 py-2 font-mono tabular-nums">{occurrence.index}</td>
                            <td className="px-3 py-2 font-mono font-bold text-[var(--color-text-primary)]">{occurrence.raw}</td>
                            <td className="max-w-40 truncate px-3 py-2 text-base" title={occurrence.decoded}>{occurrence.decoded || "—"}</td>
                            <td className="px-3 py-2 capitalize">{occurrence.kind}</td>
                            <td className="px-3 py-2 font-mono">{occurrence.codePoints}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${occurrence.valid ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]" : "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]"}`}>
                                {occurrence.valid ? "Valid" : occurrence.issue ?? "Review"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {occurrences.length > 150 ? <div className="border-t border-[var(--color-border-subtle)] px-3 py-2 text-[11px] text-[var(--color-text-tertiary)]">Showing the first 150 of {occurrences.length.toLocaleString()} entities. The CSV export includes all rows.</div> : null}
                </div>
              ) : (
                <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] p-8 text-center text-sm text-[var(--color-text-tertiary)]">
                  No complete entities are available to inspect in the active source.
                </div>
              )}
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="secondary" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={() => downloadText("entity-inspector.csv", entityCsv, "text/csv;charset=utf-8")}>
                  Inspector CSV
                </Button>
              </div>
            </div>
          ) : null}

          {detailTab === "checks" ? (
            <div className="mt-4 grid gap-2">
              {checks.map((check) => (
                <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}>
                  <div className="flex items-start gap-2">
                    {check.level === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                    <div>
                      <div className="text-xs font-black">{check.title}</div>
                      <div className="mt-1 text-xs leading-5 opacity-90">{check.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {detailTab === "code" ? (
            <div className="mt-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <SegmentedControl<CodeTab>
                  ariaLabel="Code example"
                  value={codeTab}
                  onChange={setCodeTab}
                  options={[
                    { value: "javascript", label: "JavaScript" },
                    { value: "react", label: "React" },
                  ]}
                />
                <div className="flex gap-2">
                  <CopyButton text={activeCode} size="sm" variant="secondary">Copy code</CopyButton>
                  <Button size="sm" variant="secondary" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={() => downloadText(codeTab === "react" ? "safe-text.tsx" : "html-entity-helper.js", activeCode)}>
                    Download
                  </Button>
                </div>
              </div>
              <pre className="max-h-[390px] overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-inset)] p-4 text-xs leading-6 text-[var(--color-text-primary)]"><code>{activeCode}</code></pre>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
