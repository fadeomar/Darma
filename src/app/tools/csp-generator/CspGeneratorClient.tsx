"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download, FileInput, Plus, RefreshCcw, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import {
  applyCspIntegration,
  calculateCspRiskLevel,
  classifySourceRisk,
  createCspDirective,
  createDefaultCspState,
  createSource,
  generateApacheHeader,
  generateCloudflareWorkerSnippet,
  generateCspExplanation,
  generateCspHeader,
  generateCspMetaTag,
  generateCspPolicy,
  generateExpressMiddleware,
  generateNetlifyHeaders,
  generateNextJsHeadersConfig,
  generateNginxHeader,
  generateVercelConfig,
  parseCspPolicy,
  validateCspState,
} from "./csp";
import { CSP_PRESETS } from "./presets";
import type { CspDirective, CspExportTarget, CspGeneratorState, CspIntegrationId, CspPolicyMode, CspRiskLevel } from "./types";

type BuilderTab = "core" | "embedding" | "workers" | "navigation" | "reporting" | "integrations" | "import";

const BUILDER_TABS: readonly TabItem<BuilderTab>[] = [
  { value: "core", label: "Core" },
  { value: "embedding", label: "Embedding" },
  { value: "workers", label: "Workers" },
  { value: "navigation", label: "Navigation" },
  { value: "reporting", label: "Reporting" },
  { value: "integrations", label: "Integrations" },
  { value: "import", label: "Import" },
];

const OUTPUT_TABS: readonly TabItem<CspExportTarget>[] = [
  { value: "header", label: "Header" },
  { value: "report-only-header", label: "Report-only" },
  { value: "meta", label: "Meta" },
  { value: "nextjs", label: "Next.js" },
  { value: "vercel", label: "Vercel" },
  { value: "netlify", label: "Netlify" },
  { value: "nginx", label: "Nginx" },
  { value: "apache", label: "Apache" },
  { value: "express", label: "Express" },
  { value: "cloudflare-worker", label: "Cloudflare" },
  { value: "explanation", label: "Explanation" },
];

const POLICY_MODES: readonly { value: CspPolicyMode; label: string }[] = [
  { value: "basic", label: "Basic allowlist" },
  { value: "strict-nonce", label: "Strict nonce" },
  { value: "hash", label: "Hash-based" },
  { value: "report-only", label: "Report-only" },
  { value: "custom", label: "Custom advanced" },
];

const GROUPS: Record<BuilderTab, string[]> = {
  core: ["default-src", "script-src", "style-src", "img-src", "connect-src", "font-src"],
  embedding: ["frame-src", "child-src", "frame-ancestors", "object-src", "media-src"],
  workers: ["worker-src", "manifest-src"],
  navigation: ["form-action", "base-uri", "navigate-to"],
  reporting: ["upgrade-insecure-requests", "require-trusted-types-for", "trusted-types", "report-uri", "report-to"],
  integrations: [],
  import: [],
};

const QUICK_SOURCES = ["'self'", "'none'", "https:", "data:", "blob:", "'unsafe-inline'", "'unsafe-eval'", "'nonce-{RANDOM_NONCE}'", "'strict-dynamic'", "*"];

const INTEGRATIONS: readonly { id: CspIntegrationId; name: string; description: string }[] = [
  { id: "google-fonts", name: "Google Fonts", description: "Adds fonts.googleapis.com and fonts.gstatic.com." },
  { id: "google-analytics", name: "Google Analytics", description: "Adds Tag Manager script and Analytics connect source." },
  { id: "youtube", name: "YouTube embeds", description: "Adds YouTube frame sources and thumbnail images." },
  { id: "stripe", name: "Stripe", description: "Adds Stripe script and frame sources." },
  { id: "sentry", name: "Sentry", description: "Adds Sentry ingest endpoint pattern." },
  { id: "cloudflare-cdn", name: "Cloudflare CDN", description: "Adds cdnjs script/style source." },
];

const RISK_VARIANT: Record<CspRiskLevel, "success" | "warning" | "danger" | "outline"> = {
  strong: "success",
  moderate: "outline",
  permissive: "warning",
  risky: "danger",
  invalid: "danger",
};

function downloadFile(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function normalizeSource(value: string) {
  return value.trim().slice(0, 200);
}

function outputFor(target: CspExportTarget, state: CspGeneratorState) {
  if (target === "header") return generateCspHeader({ ...state, reportOnly: false });
  if (target === "report-only-header") return generateCspHeader({ ...state, reportOnly: true });
  if (target === "meta") return generateCspMetaTag(state);
  if (target === "nextjs") return generateNextJsHeadersConfig(state);
  if (target === "vercel") return generateVercelConfig(state);
  if (target === "netlify") return generateNetlifyHeaders(state);
  if (target === "nginx") return generateNginxHeader(state);
  if (target === "apache") return generateApacheHeader(state);
  if (target === "express") return generateExpressMiddleware(state);
  if (target === "cloudflare-worker") return generateCloudflareWorkerSnippet(state);
  return generateCspExplanation(state);
}

export default function CspGeneratorClient() {
  const [state, setState] = useState<CspGeneratorState>(() => createDefaultCspState());
  const [builderTab, setBuilderTab] = useState<BuilderTab>("core");
  const [outputTab, setOutputTab] = useState<CspExportTarget>("header");
  const [sourceInputs, setSourceInputs] = useState<Record<string, string>>({});
  const [importText, setImportText] = useState("");
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  const policy = useMemo(() => generateCspPolicy(state), [state]);
  const warnings = useMemo(() => validateCspState(state), [state]);
  const risk = useMemo(() => calculateCspRiskLevel(state), [state]);
  const output = useMemo(() => outputFor(outputTab, state), [outputTab, state]);
  const visibleDirectives = useMemo(() => state.directives.filter((directive) => GROUPS[builderTab]?.includes(directive.name)), [builderTab, state.directives]);

  function patch(patchState: Partial<CspGeneratorState>) {
    setState((current) => ({ ...current, ...patchState }));
  }

  function applyPreset(id: string) {
    const preset = CSP_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setState(structuredClone(preset.state));
  }

  function updateDirective(id: string, patchDirective: Partial<CspDirective>) {
    setState((current) => ({
      ...current,
      directives: current.directives.map((directive) => (directive.id === id ? { ...directive, ...patchDirective } : directive)),
    }));
  }

  function addDirective(name = "custom-src") {
    setState((current) => {
      const directive = createCspDirective({ name, sources: [] });
      return { ...current, directives: [...current.directives.slice(0, 39), directive], selectedDirectiveId: directive.id };
    });
  }

  function removeDirective(id: string) {
    setState((current) => ({ ...current, directives: current.directives.filter((directive) => directive.id !== id) }));
  }

  function addSource(directive: CspDirective, rawValue: string) {
    const value = normalizeSource(rawValue);
    if (!value) return;
    setState((current) => ({
      ...current,
      directives: current.directives.map((item) => {
        if (item.id !== directive.id) return item;
        if (item.sources.some((source) => source.value === value) || item.sources.length >= 30) return item;
        return { ...item, sources: [...item.sources, createSource(value, item.name)] };
      }),
    }));
    setSourceInputs((current) => ({ ...current, [directive.id]: "" }));
  }

  function removeSource(directiveId: string, sourceId: string) {
    setState((current) => ({
      ...current,
      directives: current.directives.map((directive) =>
        directive.id === directiveId ? { ...directive, sources: directive.sources.filter((source) => source.id !== sourceId) } : directive,
      ),
    }));
  }

  function importPolicy() {
    const parsed = parseCspPolicy(importText);
    if (parsed.directives.length > 0) {
      setState((current) => ({ ...current, presetId: "imported", policyMode: "custom", directives: parsed.directives.slice(0, 40) }));
    }
    setImportWarnings(parsed.warnings.map((warning) => warning.message));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Preset">
            <Select value={state.presetId} onChange={(event) => applyPreset(event.target.value)}>
              {CSP_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Policy mode">
            <Select value={state.policyMode} onChange={(event) => patch({ policyMode: event.target.value as CspPolicyMode, reportOnly: event.target.value === "report-only" })}>
              {POLICY_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
            </Select>
          </Field>
          <Field label="Report endpoint">
            <Input value={state.exportOptions.reportEndpoint} onChange={(event) => patch({ exportOptions: { ...state.exportOptions, reportEndpoint: event.target.value.slice(0, 300) } })} />
          </Field>
          <Field label="Risk score">
            <div className="flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3">
              <Badge variant={RISK_VARIANT[risk]}>{risk}</Badge>
              <span className="text-xs text-[var(--color-text-soft)]">{warnings.length} hints</span>
            </div>
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={generateCspHeader(state)} size="sm">Copy header</CopyButton>
          <Button size="sm" variant="secondary" leftIcon={<RefreshCcw className="h-4 w-4" />} onClick={() => setState(createDefaultCspState())}>Reset</Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-bold text-[var(--color-text)]">Directive builder</h3>
              <p className="text-sm text-[var(--color-text-soft)]">Add trusted sources by directive, or import an existing policy.</p>
            </div>
            <Tabs<BuilderTab> items={BUILDER_TABS} value={builderTab} onChange={setBuilderTab} ariaLabel="CSP builder sections" />
          </div>

          {builderTab !== "integrations" && builderTab !== "import" ? (
            <div className="space-y-3">
              {visibleDirectives.map((directive) => (
                <DirectiveCard
                  key={directive.id}
                  directive={directive}
                  inputValue={sourceInputs[directive.id] ?? ""}
                  onInputChange={(value) => setSourceInputs((current) => ({ ...current, [directive.id]: value }))}
                  onAddSource={(value) => addSource(directive, value)}
                  onRemoveSource={(sourceId) => removeSource(directive.id, sourceId)}
                  onToggle={(enabled) => updateDirective(directive.id, { enabled })}
                  onNameChange={(name) => updateDirective(directive.id, { name, sources: directive.sources.map((source) => ({ ...source, risk: classifySourceRisk(name, source.value) })) })}
                  onDelete={() => removeDirective(directive.id)}
                />
              ))}
              <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => addDirective()}>Add custom directive</Button>
            </div>
          ) : null}

          {builderTab === "integrations" ? (
            <div className="grid gap-3 md:grid-cols-2">
              {INTEGRATIONS.map((integration) => (
                <div key={integration.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-[var(--color-text)]">{integration.name}</h4>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-text-soft)]">{integration.description}</p>
                    </div>
                    {state.enabledIntegrations.includes(integration.id) ? <Badge variant="success">Added</Badge> : null}
                  </div>
                  <Button className="mt-4" variant="secondary" size="sm" onClick={() => setState((current) => applyCspIntegration(current, integration.id))}>Add sources</Button>
                </div>
              ))}
              <p className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                Vendor CSP needs vary by product settings. Use these as starter suggestions and check vendor documentation before production.
              </p>
            </div>
          ) : null}

          {builderTab === "import" ? (
            <div className="space-y-4">
              <Field label="Paste existing CSP" description="The parser splits directives by semicolon and imports source values as editable chips.">
                <Textarea value={importText} onChange={(event) => setImportText(event.target.value.slice(0, 10000))} placeholder="default-src 'self'; script-src 'self' https://cdn.example.com; img-src 'self' data:;" />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button leftIcon={<FileInput className="h-4 w-4" />} onClick={importPolicy}>Import policy</Button>
                <Button variant="secondary" onClick={() => setImportText(policy)}>Load current policy</Button>
              </div>
              {importWarnings.length ? (
                <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                  {importWarnings.map((warning) => <p key={warning}>• {warning}</p>)}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text)]">Policy health</h3>
                <p className="text-sm text-[var(--color-text-soft)]">Live risk and best-practice guidance.</p>
              </div>
              <Badge variant={RISK_VARIANT[risk]}>{risk}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {warnings.slice(0, 8).map((warning, index) => (
                <div key={`${warning.message}-${index}`} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`mt-0.5 h-4 w-4 ${warning.severity === "high" ? "text-red-500" : warning.severity === "medium" ? "text-amber-500" : "text-blue-500"}`} />
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{warning.message}</p>
                      {warning.directiveName ? <p className="mt-1 text-xs text-[var(--color-text-soft)]">{warning.directiveName}{warning.source ? ` · ${warning.source}` : ""}</p> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--color-text)]">Current policy</h3>
            <pre className="mt-3 max-h-64 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100"><code>{policy}</code></pre>
          </div>
        </aside>
      </div>

      <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text)]">Deployment output</h3>
            <p className="text-sm text-[var(--color-text-soft)]">Copy headers and platform snippets for real deployments.</p>
          </div>
          <Tabs<CspExportTarget> items={OUTPUT_TABS} value={outputTab} onChange={setOutputTab} ariaLabel="CSP output formats" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <CopyButton text={output} size="sm">Copy output</CopyButton>
          <Button size="sm" variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={() => downloadFile(`darma-csp-${outputTab}.txt`, output)}>Download</Button>
        </div>
        <pre className="mt-4 max-h-[520px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100"><code>{output}</code></pre>
        {outputTab === "meta" ? <p className="mt-3 text-sm text-amber-700 dark:text-amber-200">Prefer HTTP headers for production when possible. Some CSP features are not available or are less appropriate through meta tags.</p> : null}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Best for" text="Next.js apps, dashboards, static sites, e-commerce projects, SaaS panels, and teams improving browser security headers." />
        <InfoCard title="Security concept" text="CSP restricts what the browser can load or execute. It helps mitigate XSS, but it does not replace secure coding." />
        <InfoCard title="Export formats" text="HTTP header, report-only header, meta tag, Next.js, Vercel, Netlify, Nginx, Apache, Express, and Cloudflare Workers." />
      </div>
    </div>
  );
}

function DirectiveCard({ directive, inputValue, onInputChange, onAddSource, onRemoveSource, onToggle, onNameChange, onDelete }: {
  directive: CspDirective;
  inputValue: string;
  onInputChange: (value: string) => void;
  onAddSource: (value: string) => void;
  onRemoveSource: (sourceId: string) => void;
  onToggle: (enabled: boolean) => void;
  onNameChange: (name: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Input value={directive.name} onChange={(event) => onNameChange(event.target.value.slice(0, 64))} className="max-w-56 font-mono" />
            <Badge variant={directive.enabled ? "success" : "outline"}>{directive.enabled ? "Enabled" : "Disabled"}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{directive.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={directive.enabled ? "secondary" : "primary"} size="sm" onClick={() => onToggle(!directive.enabled)}>{directive.enabled ? "Disable" : "Enable"}</Button>
          <Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={onDelete}>Delete</Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {directive.sources.length ? directive.sources.map((source) => (
          <button
            key={source.id}
            type="button"
            onClick={() => onRemoveSource(source.id)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition hover:opacity-80 ${source.risk === "risky" ? "border-red-200 bg-red-50 text-red-700" : source.risk === "contextual" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-[var(--color-border)] bg-[var(--color-bg-soft)] text-[var(--color-text)]"}`}
            title="Click to remove"
          >
            {source.value} ×
          </button>
        )) : <span className="text-sm text-[var(--color-text-soft)]">No source values. This directive may be keyword-only or still incomplete.</span>}
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_auto]">
        <Input value={inputValue} onChange={(event) => onInputChange(event.target.value)} placeholder="https://cdn.example.com or 'self'" onKeyDown={(event) => { if (event.key === "Enter") onAddSource(inputValue); }} />
        <Button variant="secondary" onClick={() => onAddSource(inputValue)}>Add source</Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_SOURCES.map((source) => (
          <Button key={source} size="sm" variant="soft" onClick={() => onAddSource(source)}>{source}</Button>
        ))}
      </div>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-bg-soft)] text-[var(--color-primary)]">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <h3 className="font-bold text-[var(--color-text)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{text}</p>
    </div>
  );
}
