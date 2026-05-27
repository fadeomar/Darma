"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Input, Select } from "@/components/ui";
import { CodeOutputPanel, ControlSection, ToolControlPanel, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { downloadText } from "../_shared/clientUtils";
import { createRule, generateRobotsTxt, validateRobotsConfig } from "./robotsTxt";
import { DEFAULT_ROBOTS_CONFIG, ROBOTS_PRESETS } from "./presets";
import type { RobotsConfig, RobotsDirective } from "./types";

export default function RobotsTxtClient() {
  const [config, setConfig] = useState<RobotsConfig>(DEFAULT_ROBOTS_CONFIG);
  const output = useMemo(() => generateRobotsTxt(config), [config]);
  const warnings = useMemo(() => validateRobotsConfig(config), [config]);
  const group = config.groups[0];
  function patch(next: Partial<RobotsConfig>) { setConfig((current) => ({ ...current, ...next })); }
  function updateRule(id: string, field: "directive" | "path", value: string) { setConfig((current) => ({ ...current, groups: current.groups.map((g, index) => index === 0 ? { ...g, rules: g.rules.map((r) => r.id === id ? { ...r, [field]: value } : r) } : g) })); }
  return <ToolLayoutTextWorkbench
    inputSlot={<ToolControlPanel title="Rules" description="Build a cautious robots.txt file with readable warnings."><ControlSection title="Site"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-[var(--color-text-muted)]">Site URL<Input className="mt-1" value={config.siteUrl} onChange={(e) => patch({ siteUrl: e.target.value })} /></label><label className="text-xs font-semibold text-[var(--color-text-muted)]">Sitemap URL<Input className="mt-1" value={config.sitemapUrl} onChange={(e) => patch({ sitemapUrl: e.target.value })} /></label></div></ControlSection><ControlSection title="Presets"><div className="flex flex-wrap gap-2">{ROBOTS_PRESETS.map((preset) => <Button key={preset.id} size="sm" variant={preset.destructive ? "danger" : "secondary"} onClick={() => setConfig(preset.config)}>{preset.label}</Button>)}</div></ControlSection><ControlSection title="Crawler group"><label className="text-xs font-semibold text-[var(--color-text-muted)]">User agent<Input className="mt-1" value={group?.userAgent ?? "*"} onChange={(e) => setConfig((current) => ({ ...current, groups: current.groups.map((g, index) => index === 0 ? { ...g, userAgent: e.target.value } : g) }))} /></label><div className="mt-3 space-y-2">{group?.rules.map((rule) => <div key={rule.id} className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2 sm:grid-cols-[140px_1fr_auto]"><Select size="sm" value={rule.directive} onChange={(e) => updateRule(rule.id, "directive", e.target.value as RobotsDirective)}><option value="Allow">Allow</option><option value="Disallow">Disallow</option></Select><Input size="sm" value={rule.path} onChange={(e) => updateRule(rule.id, "path", e.target.value)} placeholder="/admin/" /><Button size="sm" variant="ghost" onClick={() => setConfig((current) => ({ ...current, groups: current.groups.map((g, index) => index === 0 ? { ...g, rules: g.rules.filter((r) => r.id !== rule.id) } : g) }))}>Remove</Button></div>)}</div><Button className="mt-3" size="sm" variant="secondary" onClick={() => setConfig((current) => ({ ...current, groups: current.groups.map((g, index) => index === 0 ? { ...g, rules: [...g.rules, createRule(`rule-${Date.now()}`)] } : g) }))}>Add rule</Button></ControlSection></ToolControlPanel>}
    outputSlot={<CodeOutputPanel title="Generated robots.txt" tabs={[{ id: "robots", label: "robots.txt", code: output, language: "txt", filename: "robots.txt" }]} onDownload={(tab) => downloadText(tab.filename ?? "robots.txt", tab.code)} />}
    actionsSlot={<><CopyButton text={output} size="sm">Copy robots.txt</CopyButton><Button size="sm" variant="secondary" onClick={() => downloadText("robots.txt", output)}>Download robots.txt</Button></>}
    statsSlot={<WarningPanel messages={warnings.length ? warnings.map((w) => ({ id: w.id, severity: w.level, title: "Robots.txt warning", message: w.message })) : [{ id: "ok", severity: "info", title: "Review before publishing", message: "Crawler rules are suggestions for compliant bots. Test before production." }]} />}
  />;
}
