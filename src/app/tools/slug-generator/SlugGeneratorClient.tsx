"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  GitBranch,
  Link2,
  PackageCheck,
  RefreshCcw,
  Route,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Button, CopyButton, Input, Select, Textarea } from "@/components/ui";
import { downloadText } from "../_shared/clientUtils";
import {
  buildNextRedirectsSnippet,
  buildRedirectsJson,
  buildRoutesCsv,
  buildSlugBatch,
  buildSlugReport,
  buildSlugSummaryMarkdown,
  buildSlugUtilitySnippet,
  DEFAULT_RESERVED_WORDS,
  DEFAULT_SLUG_BATCH_CONFIG,
  DEFAULT_SLUG_OPTIONS,
} from "./slug";
import { DEFAULT_SLUG_PRESET_ID, SLUG_PRESETS } from "./presets";
import type {
  SlugCaseMode,
  SlugCheckLevel,
  SlugCollisionMode,
  SlugMode,
  SlugOptions,
  SlugSeparator,
  SlugTab,
} from "./types";

const SINGLE_SAMPLE = "How to Build Better Browser-Only Developer Tools in 2026";

const CHECK_STYLES: Record<SlugCheckLevel, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function SummaryCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between gap-2 text-[var(--color-text-tertiary)]">
        <span className="truncate text-xs font-black uppercase tracking-[0.08em]">{label}</span>
        {icon}
      </div>
      <div className="mt-1 truncate text-lg font-black text-[var(--color-text-primary)]">{value}</div>
      <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div>
    </div>
  );
}

function ToggleButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <Button size="sm" variant={active ? "primary" : "secondary"} onClick={onClick}>{children}</Button>;
}

function FieldLabel({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0 text-xs font-bold text-[var(--color-text-secondary)]">
      <span className="block truncate">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs font-normal leading-4 text-[var(--color-text-tertiary)]">{hint}</span> : null}
    </label>
  );
}

export default function SlugGeneratorClient() {
  const defaultPreset = SLUG_PRESETS.find((preset) => preset.id === DEFAULT_SLUG_PRESET_ID) ?? SLUG_PRESETS[0];
  const [mode, setMode] = useState<SlugMode>(defaultPreset.mode);
  const [input, setInput] = useState(defaultPreset.input);
  const [previousPath, setPreviousPath] = useState("");
  const [pathPrefix, setPathPrefix] = useState(defaultPreset.pathPrefix);
  const [collisionMode, setCollisionMode] = useState<SlugCollisionMode>(defaultPreset.collisionMode);
  const [collisionStart, setCollisionStart] = useState(2);
  const [reservedInput, setReservedInput] = useState(DEFAULT_RESERVED_WORDS.join(", "));
  const [options, setOptions] = useState<SlugOptions>({ ...DEFAULT_SLUG_OPTIONS, ...defaultPreset.options });
  const [activeTab, setActiveTab] = useState<SlugTab>("routes");
  const [showAllPresets, setShowAllPresets] = useState(false);

  const reservedWords = useMemo(() => reservedInput.split(",").map((value) => value.trim()).filter(Boolean), [reservedInput]);
  const effectiveInput = mode === "single" && previousPath.trim() ? `${input}\t${previousPath}` : input;
  const config = useMemo(() => ({ ...DEFAULT_SLUG_BATCH_CONFIG, mode, pathPrefix, collisionMode, collisionStart, reservedWords }), [mode, pathPrefix, collisionMode, collisionStart, reservedWords]);
  const batch = useMemo(() => buildSlugBatch(effectiveInput, options, config), [effectiveInput, options, config]);
  const routesCsv = useMemo(() => buildRoutesCsv(batch.rows), [batch.rows]);
  const redirectsJson = useMemo(() => buildRedirectsJson(batch.rows), [batch.rows]);
  const nextRedirects = useMemo(() => buildNextRedirectsSnippet(batch.rows), [batch.rows]);
  const utilitySnippet = useMemo(() => buildSlugUtilitySnippet(options), [options]);
  const reportJson = useMemo(() => JSON.stringify(buildSlugReport(batch, options, config), null, 2), [batch, options, config]);
  const markdown = useMemo(() => buildSlugSummaryMarkdown(batch, options, config), [batch, options, config]);
  const reviewCount = batch.checks.filter((check) => check.level === "warning" || check.level === "danger").length;
  const blockedCount = batch.rows.filter((row) => !row.valid).length;
  const allPaths = batch.rows.filter((row) => row.valid).map((row) => row.path).join("\n");

  function patchOptions(next: Partial<SlugOptions>) {
    setOptions((current) => ({ ...current, ...next }));
  }

  function applyPreset(id: string) {
    const preset = SLUG_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setMode(preset.mode);
    setInput(preset.input);
    setPreviousPath("");
    setPathPrefix(preset.pathPrefix);
    setCollisionMode(preset.collisionMode);
    setCollisionStart(2);
    setOptions({ ...DEFAULT_SLUG_OPTIONS, ...preset.options });
    setActiveTab("routes");
  }

  function reset() {
    setMode("single");
    setInput(SINGLE_SAMPLE);
    setPreviousPath("");
    setPathPrefix("/blog");
    setCollisionMode("suffix");
    setCollisionStart(2);
    setReservedInput(DEFAULT_RESERVED_WORDS.join(", "));
    setOptions(DEFAULT_SLUG_OPTIONS);
    setActiveTab("routes");
  }

  async function downloadPack() {
    const zip = new JSZip();
    zip.file("route-manifest.csv", routesCsv);
    zip.file("slug-report.json", reportJson);
    zip.file("slug-analysis.md", markdown);
    zip.file("redirects.json", redirectsJson);
    zip.file("next.config.redirects.js", nextRedirects);
    zip.file("slugify.ts", utilitySnippet);
    zip.file("README.md", "# Darma slug route pack\n\n- `route-manifest.csv`: generated routes, source titles, previous paths, and warnings\n- `redirects.json`: redirect objects for migration tooling\n- `next.config.redirects.js`: Next.js redirects starter\n- `slugify.ts`: lightweight implementation starter using the selected settings\n- `slug-report.json`: full configuration, routes, and production checks\n\nReview reserved routes, collisions, and existing production URLs before deployment.\n");
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "slug-route-production-pack.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const tabs: Array<{ id: SlugTab; label: string }> = [
    { id: "routes", label: "Route manifest" },
    { id: "checks", label: `Checks${reviewCount ? ` (${reviewCount})` : ""}` },
    { id: "exports", label: "Exports" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <SummaryCard label="Ready routes" value={`${batch.stats.validRoutes}/${batch.stats.inputRows}`} hint={blockedCount ? `${blockedCount} blocked` : "all inputs resolved"} icon={<Route className="h-4 w-4" />} />
        <SummaryCard label="Redirects" value={String(batch.stats.redirects)} hint="previous paths mapped" icon={<GitBranch className="h-4 w-4" />} />
        <SummaryCard label="Collisions" value={String(batch.stats.collisions)} hint={collisionMode === "suffix" ? "deterministic suffixing" : `${collisionMode} policy`} icon={<Link2 className="h-4 w-4" />} />
        <SummaryCard label="Production review" value={blockedCount ? "Blocked" : reviewCount ? `${reviewCount} review` : "Ready"} hint={`${batch.checks.length} checks completed`} icon={blockedCount || reviewCount ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><Sparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" />Practical presets</h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Load a route workflow and edit it.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={reset} leftIcon={<RefreshCcw className="h-3.5 w-3.5" />}>Reset</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(showAllPresets ? SLUG_PRESETS : SLUG_PRESETS.slice(0, 6)).map((preset) => (
                <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-2.5 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-control-hover)]">
                  <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">{preset.name}</span>
                  <span className="mt-1 block line-clamp-2 text-xs leading-4 text-[var(--color-text-tertiary)]">{preset.description}</span>
                </button>
              ))}
            </div>
            {SLUG_PRESETS.length > 6 ? (
              <Button type="button" size="sm" variant="ghost" className="mt-3 w-full" onClick={() => setShowAllPresets((value) => !value)}>
                {showAllPresets ? "Show fewer workflows" : `Show all ${SLUG_PRESETS.length} workflows`}
              </Button>
            ) : null}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-black text-[var(--color-text-primary)]">Source titles</h2>
                <p className="text-xs text-[var(--color-text-tertiary)]">Bulk rows may include a tab then the previous path.</p>
              </div>
              <div className="flex gap-1">
                <ToggleButton active={mode === "single"} onClick={() => setMode("single")}>Single</ToggleButton>
                <ToggleButton active={mode === "bulk"} onClick={() => setMode("bulk")}>Bulk</ToggleButton>
              </div>
            </div>
            <Textarea variant="editor" rows={mode === "bulk" ? 8 : 5} value={input} onChange={(event) => setInput(event.target.value)} placeholder={mode === "bulk" ? "One title per line\nTitle<TAB>/previous-path" : "Enter a page title"} aria-label="Slug source input" />
            {mode === "single" ? <div className="mt-3"><FieldLabel label="Previous path (optional)" hint="Used to generate a redirect when the route changes."><Input className="mt-1" value={previousPath} onChange={(event) => setPreviousPath(event.target.value)} placeholder="/old-page-path" /></FieldLabel></div> : null}
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[var(--color-text-tertiary)]"><span>{batch.stats.inputRows} source row{batch.stats.inputRows === 1 ? "" : "s"}</span><span>Longest path: {batch.stats.longestPath} chars</span></div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-3 flex items-center gap-2"><WandSparkles className="h-4 w-4 text-[var(--color-primary-text-strong)]" /><div><h2 className="text-sm font-black text-[var(--color-text-primary)]">Route policy</h2><p className="text-xs text-[var(--color-text-tertiary)]">Control format, collisions, and route scope.</p></div></div>
            <div className="grid grid-cols-2 gap-3">
              <FieldLabel label="Path prefix" hint="Applied before every generated slug."><Input className="mt-1" value={pathPrefix} onChange={(event) => setPathPrefix(event.target.value)} placeholder="/blog" /></FieldLabel>
              <FieldLabel label="Collision policy"><Select size="sm" className="mt-1" value={collisionMode} onChange={(event) => setCollisionMode(event.target.value as SlugCollisionMode)}><option value="suffix">Append number</option><option value="error">Block duplicates</option><option value="allow">Allow duplicates</option></Select></FieldLabel>
              <FieldLabel label="Separator"><Select size="sm" className="mt-1" value={options.separator} onChange={(event) => patchOptions({ separator: event.target.value as SlugSeparator })}><option value="-">Hyphen</option><option value="_">Underscore</option></Select></FieldLabel>
              <FieldLabel label="Case"><Select size="sm" className="mt-1" value={options.caseMode} onChange={(event) => patchOptions({ caseMode: event.target.value as SlugCaseMode })}><option value="lower">lowercase</option><option value="keep">Keep source case</option><option value="upper">UPPERCASE</option></Select></FieldLabel>
              <FieldLabel label="Max length"><Input className="mt-1" type="number" min={16} max={180} value={options.maxLength} disabled={!options.maxLengthEnabled} onChange={(event) => patchOptions({ maxLength: Math.max(1, Number(event.target.value) || 1) })} /></FieldLabel>
              <FieldLabel label="Collision suffix starts"><Input className="mt-1" type="number" min={2} max={99} value={collisionStart} disabled={collisionMode !== "suffix"} onChange={(event) => setCollisionStart(Math.max(2, Number(event.target.value) || 2))} /></FieldLabel>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ToggleButton active={options.keepNumbers} onClick={() => patchOptions({ keepNumbers: !options.keepNumbers })}>Keep numbers</ToggleButton>
              <ToggleButton active={options.removeStopWords} onClick={() => patchOptions({ removeStopWords: !options.removeStopWords })}>Remove stop words</ToggleButton>
              <ToggleButton active={options.preserveSlashes} onClick={() => patchOptions({ preserveSlashes: !options.preserveSlashes })}>Nested paths</ToggleButton>
              <ToggleButton active={options.asciiOnly} onClick={() => patchOptions({ asciiOnly: !options.asciiOnly })}>ASCII only</ToggleButton>
              <ToggleButton active={options.maxLengthEnabled} onClick={() => patchOptions({ maxLengthEnabled: !options.maxLengthEnabled })}>Limit length</ToggleButton>
              <ToggleButton active={options.trimAtWordBoundary} onClick={() => patchOptions({ trimAtWordBoundary: !options.trimAtWordBoundary })}>Whole-word trim</ToggleButton>
            </div>
            <div className="mt-3"><FieldLabel label="Reserved final segments" hint="Comma-separated application or infrastructure paths."><Textarea rows={2} value={reservedInput} onChange={(event) => setReservedInput(event.target.value)} /></FieldLabel></div>
          </section>
        </aside>

        <main className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-[var(--shadow-sm)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] px-4 py-3">
              <div><h2 className="text-sm font-black text-[var(--color-text-primary)]">Generated route workspace</h2><p className="text-xs text-[var(--color-text-tertiary)]">Inspect every route before exporting it to a CMS or router.</p></div>
              <div className="flex gap-2"><CopyButton text={allPaths} size="sm" variant="secondary" disabled={!allPaths}>Copy paths</CopyButton><Button size="sm" variant="primary" onClick={downloadPack} disabled={!batch.rows.length} leftIcon={<PackageCheck className="h-4 w-4" />}>Download pack</Button></div>
            </div>
            <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-2">
              {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-bold transition ${activeTab === tab.id ? "bg-[var(--color-surface-base)] text-[var(--color-primary-text-strong)] shadow-[var(--shadow-xs)]" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"}`}>{tab.label}</button>)}
            </div>

            {activeTab === "routes" ? (
              <div className="p-4">
                {!batch.rows.length ? <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] p-8 text-center text-sm text-[var(--color-text-tertiary)]">Enter at least one title to generate a route manifest.</div> : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-xs">
                      <thead><tr className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]"><th className="border-b border-[var(--color-border-subtle)] px-3 py-2">Source</th><th className="border-b border-[var(--color-border-subtle)] px-3 py-2">Generated route</th><th className="border-b border-[var(--color-border-subtle)] px-3 py-2">Redirect</th><th className="border-b border-[var(--color-border-subtle)] px-3 py-2">Status</th><th className="border-b border-[var(--color-border-subtle)] px-3 py-2 text-right">Copy</th></tr></thead>
                      <tbody>{batch.rows.map((row) => (
                        <tr key={row.id} className="align-top">
                          <td className="max-w-[240px] border-b border-[var(--color-border-subtle)] px-3 py-3"><div className="truncate font-bold text-[var(--color-text-primary)]" title={row.title}>{row.title}</div><div className="mt-1 text-xs text-[var(--color-text-tertiary)]">Line {row.sourceLine}</div></td>
                          <td className="border-b border-[var(--color-border-subtle)] px-3 py-3"><code className="break-all rounded bg-[var(--color-code-surface)] px-1.5 py-1 text-xs text-[var(--color-code-text)]">{row.path}</code>{row.collisionIndex > 1 ? <div className="mt-1 text-xs font-bold text-[var(--color-info-text)]">Collision #{row.collisionIndex}</div> : null}</td>
                          <td className="border-b border-[var(--color-border-subtle)] px-3 py-3 text-xs text-[var(--color-text-secondary)]">{row.redirectFrom ? <code className="break-all">{row.redirectFrom}</code> : "—"}</td>
                          <td className="border-b border-[var(--color-border-subtle)] px-3 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-black ${row.valid ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]" : "bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]"}`}>{row.valid ? "Ready" : "Blocked"}</span>{row.warnings.length ? <div className="mt-1 max-w-[180px] text-xs leading-4 text-[var(--color-text-tertiary)]">{row.warnings.join(", ")}</div> : null}</td>
                          <td className="border-b border-[var(--color-border-subtle)] px-3 py-3 text-right"><CopyButton text={row.path} size="sm" variant="ghost" aria-label={`Copy ${row.path}`}><Copy className="h-3.5 w-3.5" /></CopyButton></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === "checks" ? (
              <div className="grid gap-3 p-4 md:grid-cols-2">
                {batch.checks.length ? batch.checks.map((check) => <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}><div className="flex items-start gap-2">{check.level === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}<div><div className="text-xs font-black">{check.title}</div><p className="mt-1 text-xs leading-5 opacity-90">{check.message}</p></div></div></div>) : <div className="col-span-full p-8 text-center text-sm text-[var(--color-text-tertiary)]">Generate routes to run production checks.</div>}
              </div>
            ) : null}

            {activeTab === "exports" ? (
              <div className="space-y-4 p-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <Button variant="secondary" disabled={!batch.rows.length} onClick={() => downloadText("route-manifest.csv", routesCsv, "text/csv;charset=utf-8")} leftIcon={<FileSpreadsheet className="h-4 w-4" />}>Route CSV</Button>
                  <Button variant="secondary" disabled={!batch.rows.length} onClick={() => downloadText("slug-report.json", reportJson, "application/json;charset=utf-8")} leftIcon={<FileJson className="h-4 w-4" />}>JSON audit</Button>
                  <Button variant="secondary" disabled={!batch.rows.length} onClick={() => downloadText("slug-analysis.md", markdown, "text/markdown;charset=utf-8")} leftIcon={<Download className="h-4 w-4" />}>Markdown</Button>
                  <Button variant="secondary" onClick={() => downloadText("slugify.ts", utilitySnippet, "text/typescript;charset=utf-8")} leftIcon={<Code2 className="h-4 w-4" />}>TypeScript utility</Button>
                  <Button variant="secondary" disabled={!batch.stats.redirects} onClick={() => downloadText("redirects.json", redirectsJson, "application/json;charset=utf-8")} leftIcon={<GitBranch className="h-4 w-4" />}>Redirect JSON</Button>
                  <Button variant="secondary" disabled={!batch.stats.redirects} onClick={() => downloadText("next.config.redirects.js", nextRedirects, "text/javascript;charset=utf-8")} leftIcon={<Code2 className="h-4 w-4" />}>Next.js redirects</Button>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-code-surface)] p-3"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-black text-[var(--color-code-text)]">Route JSON preview</span><CopyButton text={reportJson} size="sm" variant="ghost">Copy</CopyButton></div><pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[var(--color-code-text)]">{reportJson}</pre></div>
                  <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-code-surface)] p-3"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-black text-[var(--color-code-text)]">Next.js redirect preview</span><CopyButton text={nextRedirects} size="sm" variant="ghost">Copy</CopyButton></div><pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[var(--color-code-text)]">{nextRedirects}</pre></div>
                </div>
              </div>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}
