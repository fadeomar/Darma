"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download, GripVertical, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Badge, Button, CopyButton, Field, Input, Select, Tabs, Textarea } from "@/components/ui";
import { generateRobotsTxt, normalizeRobotsPath, validateRobotsConfig } from "./robots";
import { DEFAULT_ROBOTS_CONFIG, DIRECTIVE_OPTIONS, ROBOTS_PRESETS } from "./presets";
import type { RobotsConfig, RobotsDirective, RobotsGroup, RobotsPresetId, RobotsRule, RobotsWarningLevel } from "./types";

type OutputTab = "preview" | "help";

const MAX_GROUPS = 10;
const MAX_RULES_PER_GROUP = 50;
const MAX_URL_LENGTH = 2048;
const MAX_PATH_LENGTH = 512;
const MAX_USER_AGENT_LENGTH = 120;

function cloneConfig(config: RobotsConfig): RobotsConfig {
  return JSON.parse(JSON.stringify(config)) as RobotsConfig;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function downloadRobotsTxt(content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "robots.txt";
  link.click();
  URL.revokeObjectURL(url);
}

function warningClass(level: RobotsWarningLevel) {
  if (level === "danger") return "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200";
  if (level === "warning") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200";
  return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200";
}

function newRule(): RobotsRule {
  return { id: makeId("rule"), directive: "Disallow", path: "/admin/" };
}

function newGroup(): RobotsGroup {
  return { id: makeId("group"), userAgent: "*", rules: [newRule()] };
}

export default function RobotsTxtClient() {
  const [config, setConfig] = useState<RobotsConfig>(() => cloneConfig(DEFAULT_ROBOTS_CONFIG));
  const [presetId, setPresetId] = useState<RobotsPresetId>("allow-all");
  const [outputTab, setOutputTab] = useState<OutputTab>("preview");

  const robotsTxt = useMemo(() => generateRobotsTxt(config), [config]);
  const warnings = useMemo(() => validateRobotsConfig(config), [config]);
  const hasDanger = warnings.some((warning) => warning.level === "danger");

  function updateConfig(patch: Partial<RobotsConfig>) {
    setConfig((current) => ({ ...current, ...patch }));
    setPresetId("custom");
  }

  function loadPreset(nextPresetId: RobotsPresetId) {
    const preset = ROBOTS_PRESETS.find((item) => item.id === nextPresetId);
    if (!preset) return;
    setPresetId(nextPresetId);
    setConfig(cloneConfig(preset.config));
  }

  function updateGroup(groupId: string, patch: Partial<RobotsGroup>) {
    setConfig((current) => ({
      ...current,
      groups: current.groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
    }));
    setPresetId("custom");
  }

  function addGroup() {
    setConfig((current) => current.groups.length >= MAX_GROUPS ? current : ({ ...current, groups: [...current.groups, newGroup()] }));
    setPresetId("custom");
  }

  function removeGroup(groupId: string) {
    setConfig((current) => ({ ...current, groups: current.groups.filter((group) => group.id !== groupId) }));
    setPresetId("custom");
  }

  function moveGroup(groupId: string, direction: -1 | 1) {
    setConfig((current) => {
      const index = current.groups.findIndex((group) => group.id === groupId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.groups.length) return current;
      const groups = [...current.groups];
      const [group] = groups.splice(index, 1);
      groups.splice(nextIndex, 0, group);
      return { ...current, groups };
    });
    setPresetId("custom");
  }

  function updateRule(groupId: string, ruleId: string, patch: Partial<RobotsRule>) {
    setConfig((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === groupId
          ? { ...group, rules: group.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)) }
          : group,
      ),
    }));
    setPresetId("custom");
  }

  function addRule(groupId: string) {
    setConfig((current) => ({
      ...current,
      groups: current.groups.map((group) => (group.id === groupId && group.rules.length < MAX_RULES_PER_GROUP ? { ...group, rules: [...group.rules, newRule()] } : group)),
    }));
    setPresetId("custom");
  }

  function removeRule(groupId: string, ruleId: string) {
    setConfig((current) => ({
      ...current,
      groups: current.groups.map((group) => (group.id === groupId ? { ...group, rules: group.rules.filter((rule) => rule.id !== ruleId) } : group)),
    }));
    setPresetId("custom");
  }

  function moveRule(groupId: string, ruleId: string, direction: -1 | 1) {
    setConfig((current) => ({
      ...current,
      groups: current.groups.map((group) => {
        if (group.id !== groupId) return group;
        const index = group.rules.findIndex((rule) => rule.id === ruleId);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= group.rules.length) return group;
        const rules = [...group.rules];
        const [rule] = rules.splice(index, 1);
        rules.splice(nextIndex, 0, rule);
        return { ...group, rules };
      }),
    }));
    setPresetId("custom");
  }

  function clearAll() {
    setConfig({ siteUrl: "", sitemapUrl: "", groups: [newGroup()] });
    setPresetId("custom");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-[var(--color-text)]">Robots.txt Generator</h2>
            <Badge variant="success">Browser-only</Badge>
            {hasDanger ? <Badge variant="danger">Check blocking rules</Badge> : <Badge variant="success">Ready</Badge>}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Build a UTF-8 robots.txt file with user-agent groups, Allow and Disallow paths, and sitemap references without sending your rules to a server.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => loadPreset("allow-all")} leftIcon={<RotateCcw className="h-4 w-4" />}>Reset</Button>
          <Button variant="secondary" onClick={clearAll}>Clear</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.45fr)]">
        <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Site URL" description="Used for reminders only. Robots rules apply to the host where /robots.txt is served.">
              <Input value={config.siteUrl} maxLength={MAX_URL_LENGTH} placeholder="https://example.com" onChange={(event) => updateConfig({ siteUrl: event.target.value })} />
            </Field>
            <Field label="Sitemap URL" description="Optional absolute URL added as a Sitemap directive.">
              <Input value={config.sitemapUrl} maxLength={MAX_URL_LENGTH} placeholder="https://example.com/sitemap.xml" onChange={(event) => updateConfig({ sitemapUrl: event.target.value })} />
            </Field>
          </div>

          <Field label="Preset" description={ROBOTS_PRESETS.find((preset) => preset.id === presetId)?.description}>
            <Select value={presetId} onChange={(event) => loadPreset(event.target.value as RobotsPresetId)}>
              {ROBOTS_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.label}{preset.destructive ? " — careful" : ""}</option>
              ))}
            </Select>
          </Field>

          {ROBOTS_PRESETS.find((preset) => preset.id === presetId)?.destructive && (
            <div className="flex gap-2 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              This preset generates <code>Disallow: /</code>, which tells matching crawlers not to crawl the site.
            </div>
          )}
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="font-black text-[var(--color-text)]">Placement reminder</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            Save the generated file as <code>robots.txt</code> and upload it to your site root, for example <code>{config.siteUrl || "https://example.com"}/robots.txt</code>.
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            The rules only apply to that exact protocol, host, and port. A subdomain needs its own robots.txt file.
          </p>
        </section>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-[var(--color-text)]">Rules builder</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Create crawler groups, then add Allow or Disallow path rules in the order you want to display them. Limit: 10 groups and 50 rules per group.</p>
          </div>
          <Button onClick={addGroup} disabled={config.groups.length >= MAX_GROUPS} leftIcon={<Plus className="h-4 w-4" />}>Add crawler group</Button>
        </div>

        <div className="space-y-4">
          {config.groups.map((group, groupIndex) => (
            <div key={group.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <Field label={`Crawler group ${groupIndex + 1}`} description="Use * for all crawlers, or a specific bot name like Googlebot.">
                  <Input value={group.userAgent} maxLength={MAX_USER_AGENT_LENGTH} placeholder="*" onChange={(event) => updateGroup(group.id, { userAgent: event.target.value })} />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => moveGroup(group.id, -1)} disabled={groupIndex === 0}>Move up</Button>
                  <Button variant="ghost" size="sm" onClick={() => moveGroup(group.id, 1)} disabled={groupIndex === config.groups.length - 1}>Move down</Button>
                  <Button variant="danger" size="sm" onClick={() => removeGroup(group.id)} disabled={config.groups.length === 1} leftIcon={<Trash2 className="h-4 w-4" />}>Delete group</Button>
                </div>
              </div>

              <div className="space-y-2">
                {group.rules.map((rule, ruleIndex) => (
                  <div key={rule.id} className="grid gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3 md:grid-cols-[42px_150px_minmax(0,1fr)_auto]">
                    <div className="flex items-center justify-center text-[var(--color-text-soft)]"><GripVertical className="h-4 w-4" /></div>
                    <Select value={rule.directive} onChange={(event) => updateRule(group.id, rule.id, { directive: event.target.value as RobotsDirective })}>
                      {DIRECTIVE_OPTIONS.map((directive) => <option key={directive} value={directive}>{directive}</option>)}
                    </Select>
                    <Input value={rule.path} maxLength={MAX_PATH_LENGTH} placeholder="/admin/" onChange={(event) => updateRule(group.id, rule.id, { path: event.target.value })} onBlur={() => updateRule(group.id, rule.id, { path: normalizeRobotsPath(rule.path) })} />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" onClick={() => moveRule(group.id, rule.id, -1)} disabled={ruleIndex === 0}>Up</Button>
                      <Button variant="ghost" size="sm" onClick={() => moveRule(group.id, rule.id, 1)} disabled={ruleIndex === group.rules.length - 1}>Down</Button>
                      <Button variant="danger" size="sm" onClick={() => removeRule(group.id, rule.id)} leftIcon={<Trash2 className="h-4 w-4" />}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="mt-3" variant="secondary" size="sm" onClick={() => addRule(group.id)} disabled={group.rules.length >= MAX_RULES_PER_GROUP} leftIcon={<Plus className="h-4 w-4" />}>Add rule</Button>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.55fr)]">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-[var(--color-text)]">robots.txt preview</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Copy or download this as a plain UTF-8 robots.txt file.</p>
            </div>
            <Tabs
              value={outputTab}
              onChange={(value) => setOutputTab(value)}
              ariaLabel="Robots output tabs"
              items={[{ value: "preview", label: "Preview" }, { value: "help", label: "Directives" }]}
            />
          </div>

          {outputTab === "preview" ? (
            <>
              <Textarea value={robotsTxt} readOnly rows={14} className="font-mono text-sm" />
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton text={robotsTxt}>Copy robots.txt</CopyButton>
                <Button variant="secondary" onClick={() => downloadRobotsTxt(robotsTxt)} leftIcon={<Download className="h-4 w-4" />}>Download robots.txt</Button>
              </div>
            </>
          ) : (
            <div className="grid gap-3 text-sm leading-6 text-[var(--color-text-muted)] md:grid-cols-2">
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-soft)] p-3"><strong className="text-[var(--color-text)]">User-agent</strong><br />Selects the crawler group the following rules apply to.</div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-soft)] p-3"><strong className="text-[var(--color-text)]">Disallow</strong><br />Tells matching crawlers not to crawl a path.</div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-soft)] p-3"><strong className="text-[var(--color-text)]">Allow</strong><br />Allows a path, often used to override a broader disallow rule.</div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-soft)] p-3"><strong className="text-[var(--color-text)]">Sitemap</strong><br />Points crawlers to an absolute sitemap URL.</div>
            </div>
          )}
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="font-black text-[var(--color-text)]">Validation and reminders</h3>
          <div className="mt-4 space-y-2">
            {warnings.map((warning) => (
              <div key={warning.id} className={`rounded-[var(--radius-sm)] border p-3 text-sm leading-6 ${warningClass(warning.level)}`}>
                {warning.message}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
