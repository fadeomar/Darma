"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Download,
  FileCode2,
  FileJson,
  FileSearch,
  Files,
  Globe2,
  Import,
  ListChecks,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button, CopyButton, Input, Select, Textarea } from "@/components/ui";
import { downloadText } from "../_shared/clientUtils";
import {
  buildNextJsRobots,
  buildRobotsConfig,
  buildRobotsReport,
  createGroup,
  createRule,
  parseRobotsTxt,
  testRobotsRoute,
} from "./robotsTxt";
import { CRAWLER_TEST_PRESETS, DEFAULT_ROBOTS_CONFIG, ROBOTS_PRESETS } from "./presets";
import type { RobotsCheckSeverity, RobotsConfig, RobotsDirective, RobotsGroup, RobotsRule } from "./types";

const CHECK_STYLES: Record<RobotsCheckSeverity, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]"><div className="truncate font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div><div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]">{value}</div><div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div></div>;
}

function cloneConfig(config: RobotsConfig): RobotsConfig {
  return JSON.parse(JSON.stringify(config)) as RobotsConfig;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function inputClass(): string {
  return "h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-accent)]";
}

function groupLabel(group: RobotsGroup, index: number): string {
  const agents = group.userAgents.map((agent) => agent.trim()).filter(Boolean);
  return agents.length > 0 ? agents.join(", ") : `Crawler group ${index + 1}`;
}

export default function RobotsTxtClient() {
  const [config, setConfig] = useState<RobotsConfig>(() => cloneConfig(DEFAULT_ROBOTS_CONFIG));
  const [view, setView] = useState<"rules" | "preview" | "checks" | "import">("rules");
  const [importText, setImportText] = useState("");
  const [importNotices, setImportNotices] = useState<string[]>([]);
  const [testCrawler, setTestCrawler] = useState("Googlebot");
  const [testPath, setTestPath] = useState("/admin/settings?tab=profile");
  const [showAllPresets, setShowAllPresets] = useState(false);

  const result = useMemo(() => buildRobotsConfig(config), [config]);
  const nextJsCode = useMemo(() => buildNextJsRobots(config), [config]);
  const routeTest = useMemo(() => testRobotsRoute(config, testCrawler, testPath), [config, testCrawler, testPath]);
  const reviewCount = result.checks.filter((check) => check.level === "warning" || check.level === "danger").length;

  function patchConfig(patch: Partial<RobotsConfig>) {
    setConfig((current) => ({ ...current, ...patch }));
  }

  function updateGroup(groupId: string, patch: Partial<RobotsGroup>) {
    setConfig((current) => ({
      ...current,
      groups: current.groups.map((group) => group.id === groupId ? { ...group, ...patch } : group),
    }));
  }

  function updateRule(groupId: string, ruleId: string, patch: Partial<RobotsRule>) {
    setConfig((current) => ({
      ...current,
      groups: current.groups.map((group) => group.id === groupId
        ? { ...group, rules: group.rules.map((rule) => rule.id === ruleId ? { ...rule, ...patch } : rule) }
        : group),
    }));
  }

  function removeRule(groupId: string, ruleId: string) {
    setConfig((current) => ({
      ...current,
      groups: current.groups.map((group) => group.id === groupId
        ? { ...group, rules: group.rules.filter((rule) => rule.id !== ruleId) }
        : group),
    }));
  }

  function applyPreset(presetId: string) {
    const preset = ROBOTS_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setConfig(cloneConfig(preset.config));
    setImportNotices([]);
    setView("rules");
  }

  function importExisting() {
    const parsed = parseRobotsTxt(importText, config.siteUrl);
    setConfig(parsed.config);
    setImportNotices(parsed.notices);
    setView("rules");
  }

  async function downloadPack() {
    const zip = new JSZip();
    zip.file("robots.txt", result.output);
    zip.file("app-robots.ts", nextJsCode);
    zip.file("robots-report.json", buildRobotsReport(result, config));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "robots-production-pack.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <div className="space-y-4">
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Crawler policy" value={`${result.stats.groups} group${result.stats.groups === 1 ? "" : "s"}`} hint={`${result.stats.userAgents} user-agent token${result.stats.userAgents === 1 ? "" : "s"}`} />
      <SummaryCard label="Rules" value={result.stats.rules.toLocaleString()} hint={`${result.stats.allowRules} allow · ${result.stats.disallowRules} disallow`} />
      <SummaryCard label="Output" value={formatBytes(result.stats.bytes)} hint={`${result.stats.sitemaps} sitemap reference${result.stats.sitemaps === 1 ? "" : "s"}`} />
      <SummaryCard label="Production review" value={reviewCount.toLocaleString()} hint={reviewCount === 0 ? "No warnings detected" : `${result.stats.blockAllGroups} block-all group${result.stats.blockAllGroups === 1 ? "" : "s"}`} />
    </div>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
      <section className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3">
          <div><h2 className="font-bold text-[var(--color-text-primary)]">Crawler policy workspace</h2><p className="text-xs text-[var(--color-text-tertiary)]">Edit every user-agent group, inspect output, and validate before deployment.</p></div>
          <div className="flex flex-wrap gap-1.5">
            {(["rules", "preview", "checks", "import"] as const).map((item) => <Button key={item} size="sm" variant={view === item ? "primary" : "ghost"} onClick={() => setView(item)}>{item === "rules" ? "Groups & rules" : item === "preview" ? "Output preview" : item === "checks" ? "Production checks" : "Import existing"}</Button>)}
          </div>
        </div>

        {view === "rules" && <div className="space-y-4 p-4">
          {importNotices.length > 0 && <div className="rounded-[var(--radius-md)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-xs text-[var(--color-info-text)]"><div className="mb-1 font-bold">Import notes</div><ul className="list-disc space-y-1 pl-4">{importNotices.map((notice) => <li key={notice}>{notice}</li>)}</ul></div>}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold text-[var(--color-text-muted)]">Production site URL<Input className="mt-1" value={config.siteUrl} onChange={(event) => patchConfig({ siteUrl: event.target.value })} placeholder="https://example.com" /></label>
            <label className="text-xs font-semibold text-[var(--color-text-muted)]">Sitemap URLs · one per line<Textarea className="mt-1 font-mono text-xs" rows={3} value={config.sitemapUrls.join("\n")} onChange={(event) => patchConfig({ sitemapUrls: event.target.value.split(/\r?\n/) })} placeholder="https://example.com/sitemap.xml" /></label>
          </div>

          <div className="space-y-3">
            {config.groups.map((group, groupIndex) => <article key={group.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] px-3 py-2.5">
                <div className="min-w-0"><div className="truncate text-sm font-bold text-[var(--color-text-primary)]">Group {groupIndex + 1} · {groupLabel(group, groupIndex)}</div><div className="text-xs text-[var(--color-text-tertiary)]">Matching agents share the rules below.</div></div>
                <Button size="sm" variant="ghost" disabled={config.groups.length === 1} onClick={() => setConfig((current) => ({ ...current, groups: current.groups.filter((item) => item.id !== group.id) }))}><Trash2 className="mr-1 h-4 w-4" />Remove group</Button>
              </div>
              <div className="space-y-3 p-3">
                <label className="block text-xs font-semibold text-[var(--color-text-muted)]">User-agent tokens · comma separated<input className={`${inputClass()} mt-1`} value={group.userAgents.join(", ")} onChange={(event) => updateGroup(group.id, { userAgents: event.target.value.split(",") })} placeholder="*, Googlebot, Bingbot" /></label>
                <div className="space-y-2">
                  {group.rules.map((rule) => <div key={rule.id} className="grid gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-2 sm:grid-cols-[138px_minmax(0,1fr)_auto]">
                    <Select size="sm" value={rule.directive} onChange={(event) => updateRule(group.id, rule.id, { directive: event.target.value as RobotsDirective })}><option value="Allow">Allow</option><option value="Disallow">Disallow</option></Select>
                    <Input size="sm" className="min-w-0 font-mono" value={rule.path} onChange={(event) => updateRule(group.id, rule.id, { path: event.target.value })} placeholder="/private/ or /*?*sort=" />
                    <Button size="sm" variant="ghost" onClick={() => removeRule(group.id, rule.id)} aria-label="Remove rule"><Trash2 className="h-4 w-4" /></Button>
                  </div>)}
                </div>
                <Button size="sm" variant="secondary" onClick={() => updateGroup(group.id, { rules: [...group.rules, createRule(`rule-${Date.now()}-${groupIndex}`)] })}><Plus className="mr-1 h-4 w-4" />Add rule</Button>
              </div>
            </article>)}
          </div>
          <Button size="sm" variant="secondary" onClick={() => setConfig((current) => ({ ...current, groups: [...current.groups, createGroup(`group-${Date.now()}`)] }))}><Plus className="mr-1 h-4 w-4" />Add crawler group</Button>
        </div>}

        {view === "preview" && <div className="grid gap-4 p-4 lg:grid-cols-2">
          <div className="min-w-0"><div className="mb-2 flex items-center justify-between gap-2"><div><h3 className="text-sm font-bold text-[var(--color-text-primary)]">robots.txt</h3><p className="text-xs text-[var(--color-text-tertiary)]">Upload at the exact site root.</p></div><CopyButton text={result.output} size="sm" variant="secondary">Copy</CopyButton></div><pre className="max-h-[590px] overflow-auto rounded-[var(--radius-md)] bg-slate-950 p-4 text-xs leading-6 text-slate-100"><code>{result.output}</code></pre></div>
          <div className="min-w-0"><div className="mb-2 flex items-center justify-between gap-2"><div><h3 className="text-sm font-bold text-[var(--color-text-primary)]">Next.js app/robots.ts</h3><p className="text-xs text-[var(--color-text-tertiary)]">MetadataRoute starter generated from the same policy.</p></div><CopyButton text={nextJsCode} size="sm" variant="secondary">Copy</CopyButton></div><pre className="max-h-[590px] overflow-auto rounded-[var(--radius-md)] bg-slate-950 p-4 text-xs leading-6 text-slate-100"><code>{nextJsCode}</code></pre></div>
        </div>}

        {view === "checks" && <div className="grid gap-2 p-4 md:grid-cols-2">{result.checks.map((check) => <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.level]}`}><div className="flex items-start gap-2">{check.level === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : check.level === "warning" || check.level === "danger" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />}<div><div className="font-bold">{check.title}</div><p className="mt-1 text-xs leading-5 opacity-90">{check.message}</p></div></div></div>)}</div>}

        {view === "import" && <div className="space-y-3 p-4"><div className="rounded-[var(--radius-md)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-xs leading-5 text-[var(--color-info-text)]">Paste an existing file to rebuild editable groups. Comments and unsupported directives such as crawl-delay or noindex are reported but not imported.</div><Textarea value={importText} onChange={(event) => setImportText(event.target.value)} rows={18} className="font-mono text-xs" placeholder={'User-agent: *\nDisallow: /admin/\n\nSitemap: https://example.com/sitemap.xml'} /><div className="flex flex-wrap gap-2"><Button onClick={importExisting} disabled={!importText.trim()}><Import className="mr-2 h-4 w-4" />Import into editor</Button><Button variant="secondary" onClick={() => setImportText(result.output)}>Load current output</Button><Button variant="ghost" onClick={() => setImportText("")}>Clear</Button></div></div>}
      </section>

      <aside className="space-y-3">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]"><div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><ListChecks className="h-4 w-4" />Practical presets</div><div className="space-y-2">{(showAllPresets ? ROBOTS_PRESETS : ROBOTS_PRESETS.slice(0, 6)).map((preset) => <button key={preset.id} onClick={() => applyPreset(preset.id)} className={`w-full rounded-[var(--radius-sm)] border p-2.5 text-left transition hover:border-[var(--color-accent)] ${preset.destructive ? "border-[var(--color-danger-border)]" : "border-[var(--color-border-subtle)]"}`}><div className="text-sm font-bold text-[var(--color-text-primary)]">{preset.label}</div><div className="mt-0.5 text-xs leading-4 text-[var(--color-text-tertiary)]">{preset.description}</div></button>)}</div>{ROBOTS_PRESETS.length > 6 ? <Button className="mt-2 w-full" size="sm" variant="ghost" onClick={() => setShowAllPresets((value) => !value)}>{showAllPresets ? "Show fewer presets" : `Show all ${ROBOTS_PRESETS.length} presets`}</Button> : null}</section>

        <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]"><div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><FileSearch className="h-4 w-4" />Local route tester</div><label className="block text-xs font-semibold text-[var(--color-text-muted)]">Crawler product token<Input size="sm" className="mt-1 font-mono" value={testCrawler} onChange={(event) => setTestCrawler(event.target.value)} placeholder="Googlebot" /></label><div className="flex flex-wrap gap-1">{CRAWLER_TEST_PRESETS.map((crawler) => <button key={crawler} type="button" onClick={() => setTestCrawler(crawler)} className="rounded-full border border-[var(--color-border-subtle)] px-2 py-1 text-xs text-[var(--color-text-tertiary)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]">{crawler}</button>)}</div><label className="block text-xs font-semibold text-[var(--color-text-muted)]">URL or path<Input size="sm" className="mt-1 font-mono" value={testPath} onChange={(event) => setTestPath(event.target.value)} /></label><div className={`rounded-[var(--radius-md)] border p-3 ${routeTest.allowed ? CHECK_STYLES.success : CHECK_STYLES.danger}`}><div className="flex items-center gap-2 font-bold">{routeTest.allowed ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}{routeTest.allowed ? "Allowed to crawl" : "Blocked from crawling"}</div><div className="mt-1 break-all font-mono text-xs">{routeTest.normalizedPath}</div><p className="mt-2 text-xs leading-5 opacity-90">{routeTest.reason}</p>{routeTest.matchedAgents.length > 0 && <div className="mt-2 text-xs opacity-80">Matched agent: {routeTest.matchedAgents.join(", ")}</div>}</div><p className="text-xs leading-4 text-[var(--color-text-tertiary)]">This is a local policy preview for common matching behavior. Confirm critical changes with the target search engine’s tester and production logs.</p></section>

        <section className="space-y-2 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)]"><div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Files className="h-4 w-4" />Exports</div><CopyButton text={result.output} className="w-full">Copy robots.txt</CopyButton><Button className="w-full" variant="secondary" onClick={() => downloadText("robots.txt", result.output)}><FileCode2 className="mr-2 h-4 w-4" />Download robots.txt</Button><Button className="w-full" variant="secondary" onClick={() => downloadText("app-robots.ts", nextJsCode, "text/typescript;charset=utf-8")}><Bot className="mr-2 h-4 w-4" />Download Next.js file</Button><Button className="w-full" variant="secondary" onClick={() => downloadText("robots-report.json", buildRobotsReport(result, config), "application/json;charset=utf-8")}><FileJson className="mr-2 h-4 w-4" />Download JSON report</Button><Button className="w-full" onClick={downloadPack}><Download className="mr-2 h-4 w-4" />Download production pack</Button></section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-xs leading-5 text-[var(--color-warning-text)]"><div className="flex items-center gap-2 font-bold"><Globe2 className="h-4 w-4" />Deployment reminder</div><p className="mt-1">The file must be reachable at <span className="font-mono">/robots.txt</span> on the exact protocol, host, and port it controls. It does not make a private route secure.</p></section>
      </aside>
    </div>
  </div>;
}
