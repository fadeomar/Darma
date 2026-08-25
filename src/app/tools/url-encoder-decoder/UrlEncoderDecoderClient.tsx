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
  Link2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button, CopyButton, Input, Select, Textarea } from "@/components/ui";
import { SegmentedControl } from "@/features/tools/components";
import { downloadText } from "../_shared/clientUtils";
import { URL_PRESETS } from "./presets";
import {
  buildUrlChecks,
  buildUrlCodeSnippets,
  buildUrlReport,
  computeUrlStats,
  inspectUrlInput,
  processUrlText,
  rebuildInputWithQueryRows,
} from "./url";
import type {
  QueryParamRow,
  UrlCheckLevel,
  UrlEncodingType,
  UrlMode,
} from "./types";

type OutputTab = "result" | "inspector" | "code";
type CodeTab = "javascript" | "queryApi" | "curl";

const CHECK_STYLES: Record<UrlCheckLevel, string> = {
  success:
    "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning:
    "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger:
    "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

const INPUT_KIND_LABELS = {
  empty: "Waiting",
  "absolute-url": "Absolute URL",
  "relative-url": "Relative URL",
  "query-string": "Query string",
  text: "Plain text",
} as const;

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="truncate font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        {label}
      </div>
      <div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]" title={value}>
        {value}
      </div>
      <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div>
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
    <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
      {children}
    </span>
  );
}

export default function UrlEncoderDecoderClient() {
  const firstPreset = URL_PRESETS[0]!;
  const [input, setInput] = useState(firstPreset.value);
  const [mode, setMode] = useState<UrlMode>(firstPreset.mode);
  const [type, setType] = useState<UrlEncodingType>(firstPreset.type);
  const [outputTab, setOutputTab] = useState<OutputTab>("result");
  const [codeTab, setCodeTab] = useState<CodeTab>("javascript");

  const result = useMemo(() => processUrlText(input, mode, type), [input, mode, type]);
  const inspection = useMemo(() => inspectUrlInput(input), [input]);
  const stats = useMemo(
    () => computeUrlStats(input, result.output, inspection),
    [input, result.output, inspection],
  );
  const checks = useMemo(
    () => buildUrlChecks({ input, mode, type, result, inspection }),
    [input, mode, type, result, inspection],
  );
  const snippets = useMemo(
    () => buildUrlCodeSnippets({ input, mode, type, inspection }),
    [input, mode, type, inspection],
  );
  const report = useMemo(
    () => buildUrlReport({ input, mode, type, result, inspection, stats, checks }),
    [input, mode, type, result, inspection, stats, checks],
  );
  const reportJson = useMemo(() => `${JSON.stringify(report, null, 2)}\n`, [report]);
  const reviewCount = checks.filter((check) => check.level === "warning" || check.level === "danger").length;
  const activeCode = snippets[codeTab];
  const queryRows = inspection.queryParams;

  function applyPreset(id: string) {
    const preset = URL_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setInput(preset.value);
    setMode(preset.mode);
    setType(preset.type);
    setOutputTab("result");
  }

  function swapDirection() {
    if (!result.output) return;
    setInput(result.output);
    setMode((current) => (current === "encode" ? "decode" : "encode"));
    setOutputTab("result");
  }

  function updateQueryRow(index: number, patch: Partial<Pick<QueryParamRow, "key" | "value">>) {
    const rows = queryRows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch } : row,
    );
    setInput(rebuildInputWithQueryRows(input, rows));
  }

  function addQueryRow() {
    const rows = [...queryRows, { key: "parameter", value: "value" }];
    setInput(rebuildInputWithQueryRows(input, rows));
  }

  function removeQueryRow(index: number) {
    setInput(rebuildInputWithQueryRows(input, queryRows.filter((_, rowIndex) => rowIndex !== index)));
  }

  async function downloadPack() {
    const zip = new JSZip();
    zip.file("input.txt", input);
    zip.file("output.txt", result.output);
    zip.file("url-audit-report.json", reportJson);
    zip.file("browser-conversion.js", snippets.javascript);
    zip.file("url-search-params.js", snippets.queryApi);
    zip.file("curl-example.sh", snippets.curl);
    zip.file(
      "README.md",
      "# Darma URL production pack\n\nThis pack was generated locally in the browser. It contains the source, transformed output, a redacted audit report, and implementation examples.\n\nURL encoding is formatting, not encryption. Review tokens, credentials, and other sensitive values before sharing links or reports.\n",
    );
    const blob = await zip.generateAsync({ type: "blob" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "url-production-pack.zip";
    anchor.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[var(--color-primary)]/25 bg-[var(--color-primary-soft)] px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-primary-text-strong)]">
                Step 1 · Transform setup
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-2 py-1 text-xs font-bold text-[var(--color-success-text)]">
                <ShieldCheck className="h-3 w-3" />
                Local only
              </span>
            </div>
            <h2 className="mt-2 text-base font-black tracking-tight text-[var(--color-text-primary)]">
              Choose how this value should be encoded or decoded
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--color-text-tertiary)]">
              Pick a conversion direction and encoding strategy first, then work through the source, result, inspection, and production checks below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl<UrlMode>
              ariaLabel="URL conversion mode"
              value={mode}
              onChange={(nextMode) => {
                setMode(nextMode);
                setOutputTab("result");
              }}
              options={[
                { value: "encode", label: "Encode" },
                { value: "decode", label: "Decode" },
              ]}
            />
            <SegmentedControl<UrlEncodingType>
              ariaLabel="URL encoding type"
              value={type}
              onChange={setType}
              options={[
                { value: "full", label: "Full URL" },
                { value: "component", label: "Component" },
                { value: "form", label: "Form value" },
              ]}
            />
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={swapDirection}
              disabled={!result.output}
            >
              Swap
            </Button>
          </div>
        </div>

        <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <MiniLabel>Quick starts</MiniLabel>
            <span className="text-xs text-[var(--color-text-tertiary)]">Presets keep their matching mode and encoding type.</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
          {URL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="min-w-[180px] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-2 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
              onClick={() => applyPreset(preset.id)}
            >
              <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.label}</span>
              <span className="mt-0.5 block line-clamp-2 text-xs leading-4 text-[var(--color-text-tertiary)]">
                {preset.description}
              </span>
            </button>
          ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Card className="min-w-0">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
                <h2 className="text-sm font-black text-[var(--color-text-primary)]">Step 2 · Source input</h2>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                Paste a full URL, path, query string, or individual value.
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setInput("")} disabled={!input}>
              Clear
            </Button>
          </div>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            variant="editor"
            minRows={12}
            spellCheck={false}
            placeholder="https://example.com/search?q=hello world"
            aria-invalid={!result.ok && Boolean(input)}
            className="resize-y break-all"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-tertiary)]">
            <span>{stats.inputCharacters.toLocaleString()} characters</span>
            <span>
              {type === "full"
                ? "Preserves URL separators"
                : type === "component"
                  ? "Encodes reserved separators"
                  : "Spaces use + form encoding"}
            </span>
          </div>
        </Card>

        <Card className="min-w-0">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
                <h2 className="text-sm font-black text-[var(--color-text-primary)]">Step 3 · Result &amp; inspector</h2>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                Review the transformed value, parsed URL components, or implementation code.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton text={result.output} size="sm" variant="secondary" disabled={!result.output}>
                Copy output
              </CopyButton>
              <div className="flex rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-0.5">
              {([
                ["result", "Result"],
                ["inspector", "Inspector"],
                ["code", "Code"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOutputTab(value)}
                  className={`rounded-[var(--radius-xs)] px-2.5 py-1.5 text-xs font-bold transition ${
                    outputTab === value
                      ? "bg-[var(--color-surface-base)] text-[var(--color-text-primary)] shadow-[var(--shadow-xs)]"
                      : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {label}
                </button>
              ))}
              </div>
            </div>
          </div>

          {outputTab === "result" ? (
            <>
              <Textarea
                value={result.output}
                readOnly
                variant="output"
                minRows={12}
                spellCheck={false}
                placeholder="Encoded or decoded output appears here."
                aria-invalid={!result.ok && Boolean(input)}
                className="resize-y break-all"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-tertiary)]">
                <span>{stats.outputCharacters.toLocaleString()} characters · {stats.percentSequences.toLocaleString()} percent escapes</span>
                <span>{stats.expansionPercent > 0 ? "+" : ""}{stats.expansionPercent}% length change</span>
              </div>
              {"error" in result ? (
                <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-3 text-xs text-[var(--color-danger-text)]">
                  {result.error}
                </div>
              ) : null}
            </>
          ) : null}

          {outputTab === "inspector" ? (
            <div className="grid min-h-[318px] content-start gap-2 sm:grid-cols-2">
              {[
                ["Kind", INPUT_KIND_LABELS[inspection.kind]],
                ["Protocol", inspection.protocol || "—"],
                ["Host", inspection.host || "—"],
                ["Port", inspection.port || "—"],
                ["Path", inspection.pathname || "—"],
                ["Query", inspection.search || "—"],
                ["Fragment", inspection.hash || "—"],
                ["Origin", inspection.origin || "—"],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
                  <MiniLabel>{label}</MiniLabel>
                  <div className="mt-1 break-all font-mono text-xs font-semibold text-[var(--color-text-primary)]" title={value}>
                    {value}
                  </div>
                </div>
              ))}
              {!inspection.parseable ? (
                <div className="sm:col-span-2 rounded-[var(--radius-md)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-xs text-[var(--color-info-text)]">
                  This value is being treated as plain text. URL component inspection becomes available for absolute URLs, relative paths, and query strings.
                </div>
              ) : null}
            </div>
          ) : null}

          {outputTab === "code" ? (
            <div className="min-h-[318px]">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <Select
                  size="sm"
                  width="medium"
                  value={codeTab}
                  onChange={(event) => setCodeTab(event.target.value as CodeTab)}
                >
                  <option value="javascript">JavaScript conversion</option>
                  <option value="queryApi">URLSearchParams API</option>
                  <option value="curl">cURL query example</option>
                </Select>
                <CopyButton text={activeCode} size="sm" variant="secondary">
                  Copy code
                </CopyButton>
              </div>
              <Textarea value={activeCode} readOnly variant="output" minRows={11} spellCheck={false} />
            </div>
          ) : null}
        </Card>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <div>
            <MiniLabel>Step 4 · Analysis summary</MiniLabel>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">A compact readout after the conversion, not before it.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Conversion"
            value={result.status}
            hint={`${mode} · ${type}`}
          />
          <SummaryCard
            label="Input type"
            value={INPUT_KIND_LABELS[inspection.kind]}
            hint={inspection.parseable ? "Structured inspection available" : "Processed as text"}
          />
          <SummaryCard
            label="Query params"
            value={stats.queryParameters.toLocaleString()}
            hint={`${stats.uniqueQueryKeys.toLocaleString()} unique key${stats.uniqueQueryKeys === 1 ? "" : "s"}`}
          />
          <SummaryCard
            label="Production review"
            value={reviewCount ? `${reviewCount} to review` : "Clear"}
            hint={`${stats.outputCharacters.toLocaleString()} output characters`}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className="min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
                <h2 className="text-sm font-black text-[var(--color-text-primary)]">Step 5 · Query parameter editor</h2>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                Edit decoded keys and values. The source URL is rebuilt with URLSearchParams encoding.
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={addQueryRow}
              disabled={inspection.kind === "text" || inspection.kind === "empty"}
            >
              Add parameter
            </Button>
          </div>

          {queryRows.length ? (
            <div className="mt-3 max-h-[292px] space-y-2 overflow-y-auto pr-1">
              {queryRows.map((row, index) => (
                <div
                  key={row.id}
                  className={`grid gap-2 rounded-[var(--radius-md)] border p-2 sm:grid-cols-[minmax(120px,0.8fr)_minmax(180px,1.2fr)_auto] ${
                    row.sensitive
                      ? "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]"
                      : row.duplicate
                        ? "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)]"
                        : "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]"
                  }`}
                >
                  <label className="min-w-0">
                    <MiniLabel>Key {index + 1}</MiniLabel>
                    <Input
                      size="sm"
                      className="mt-1 font-mono"
                      value={row.key}
                      onChange={(event) => updateQueryRow(index, { key: event.target.value })}
                    />
                  </label>
                  <label className="min-w-0">
                    <MiniLabel>Decoded value</MiniLabel>
                    <Input
                      size="sm"
                      className="mt-1 font-mono"
                      value={row.value}
                      onChange={(event) => updateQueryRow(index, { value: event.target.value })}
                    />
                  </label>
                  <div className="flex items-end justify-end gap-2">
                    {row.sensitive ? (
                      <span className="mb-1 text-xs font-bold uppercase text-[var(--color-danger-text)]">Sensitive</span>
                    ) : row.duplicate ? (
                      <span className="mb-1 text-xs font-bold uppercase text-[var(--color-warning-text)]">Duplicate</span>
                    ) : null}
                    <Button
                      size="icon"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => removeQueryRow(index)}
                    >
                      Remove parameter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-5 text-center text-xs text-[var(--color-text-tertiary)]">
              {inspection.kind === "text" || inspection.kind === "empty"
                ? "Enter a URL, relative path, or query string to activate the parameter editor."
                : "No query parameters yet. Add one to the current URL or path."}
            </div>
          )}
        </Card>

        <Card className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
                <h2 className="text-sm font-black text-[var(--color-text-primary)]">Step 6 · Production checks</h2>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Compatibility, parsing, and leakage risks.</p>
            </div>
            <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-2 py-1 text-xs font-bold text-[var(--color-text-secondary)]">
              {checks.length} checks
            </span>
          </div>

          <div className="mt-3 max-h-[292px] space-y-2 overflow-y-auto pr-1">
            {checks.map((check) => (
              <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}>
                <div className="flex items-start gap-2">
                  {check.level === "danger" || check.level === "warning" ? (
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-black">{check.title}</div>
                    <p className="mt-1 text-xs leading-5 opacity-90">{check.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileArchive className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
              <h2 className="text-sm font-black text-[var(--color-text-primary)]">Step 7 · Production handoff</h2>
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              Export the transformed value, redacted audit report, or a complete local production pack.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              disabled={!result.output}
              onClick={() => downloadText("url-output.txt", result.output)}
            >
              Output
            </Button>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Braces className="h-3.5 w-3.5" />}
              onClick={() => downloadText("url-audit-report.json", reportJson, "application/json;charset=utf-8")}
            >
              JSON report
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
    </div>
  );
}
