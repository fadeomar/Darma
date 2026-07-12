"use client";

import { useMemo, useState } from "react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  calculateCspRiskLevel,
  generateApacheHeader,
  generateCloudflareWorkerSnippet,
  generateCspExplanation,
  generateCspHeader,
  generateCspMetaTag,
  generateExpressMiddleware,
  generateNetlifyHeaders,
  generateNextJsHeadersConfig,
  generateNextJsStrictSnippet,
  generateNginxHeader,
  generateVercelConfig,
  validateCspSourceValue,
  validateCspState,
} from "./csp";
import {
  applyQuickPreset,
  buildCspState,
  countBuilderSelections,
  createCustomSource,
  createDefaultBuilderState,
  CSP_QUICK_PRESETS,
  type CspBuilderState,
  type CspPolicyMode,
} from "./builder";
import { CspStepCard } from "./components/CspStepCard";
import { CspModeStep } from "./components/CspModeStep";
import { CspServicesStep } from "./components/CspServicesStep";
import { CspCustomStep } from "./components/CspCustomStep";
import { CspAdvanced } from "./components/CspAdvanced";
import { CspWarnings } from "./components/CspWarnings";
import { CspOutput } from "./components/CspOutput";

const HOW_IT_WORKS = ["Preset", "Services", "Domains", "Copy"];

const META_REPORT_ONLY_NOTICE = [
  "<!--",
  "  CSP <meta> tags cannot be Report-Only.",
  "  A meta tag ALWAYS enforces the policy and would block resources.",
  "  For report-only testing, use the HTTP Header, Next.js, Nginx,",
  "  Vercel, Netlify, Apache, Express, or Worker output instead.",
  "-->",
].join("\n");

function getPolicyStats(state: ReturnType<typeof buildCspState>) {
  const enabled = state.directives.filter((directive) => directive.enabled);
  const sources = enabled.flatMap((directive) => directive.sources);
  const risky = sources.filter((source) => source.risk === "risky").length;
  const contextual = sources.filter((source) => source.risk === "contextual").length;
  return {
    directives: enabled.length,
    sources: sources.length,
    risky,
    contextual,
  };
}

function SummaryCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">{value}</p>
      <p className="mt-0.5 text-[11px] leading-4 text-[var(--color-text-tertiary)]">{hint}</p>
    </div>
  );
}

export default function CspGeneratorClient() {
  const [builder, setBuilder] = useState<CspBuilderState>(() => createDefaultBuilderState());

  const state = useMemo(() => buildCspState(builder), [builder]);
  const risk = useMemo(() => calculateCspRiskLevel(state), [state]);
  const messages = useMemo(() => validateCspState(state), [state]);
  const header = useMemo(() => generateCspHeader(state), [state]);
  const meta = useMemo(() => generateCspMetaTag(state), [state]);
  const nginx = useMemo(() => generateNginxHeader(state), [state]);
  const vercel = useMemo(() => generateVercelConfig(state), [state]);
  const netlify = useMemo(() => generateNetlifyHeaders(state), [state]);
  const apache = useMemo(() => generateApacheHeader(state), [state]);
  const express = useMemo(() => generateExpressMiddleware(state), [state]);
  const cloudflare = useMemo(() => generateCloudflareWorkerSnippet(state), [state]);
  const explanation = useMemo(() => generateCspExplanation(state), [state]);
  const policyStats = useMemo(() => getPolicyStats(state), [state]);
  const builderStats = useMemo(() => countBuilderSelections(builder), [builder]);

  // Strict CSP can't be served from a static next.config header — show the
  // middleware variant instead. Meta tags can never be report-only.
  const nextjs = useMemo(
    () => (builder.mode === "strict" ? generateNextJsStrictSnippet(state) : generateNextJsHeadersConfig(state)),
    [builder.mode, state],
  );
  const metaOutput = builder.reportOnly ? META_REPORT_ONLY_NOTICE : meta;

  function patch(next: Partial<CspBuilderState>) {
    setBuilder((current) => ({ ...current, ...next }));
  }

  /** Format + duplicate validation for a custom/advanced source. */
  function sourceError(directive: string, value: string): string | null {
    const formatError = validateCspSourceValue(value);
    if (formatError) return formatError;
    const existing = state.directives.find((item) => item.name === directive);
    if (existing?.sources.some((source) => source.value === value.trim())) {
      return "That source is already in this directive.";
    }
    return null;
  }

  function setMode(mode: CspPolicyMode) {
    patch({ mode });
  }

  function toggleService(id: string) {
    setBuilder((current) => ({
      ...current,
      services: current.services.includes(id)
        ? current.services.filter((value) => value !== id)
        : [...current.services, id],
    }));
  }

  function addCustom(directive: string, value: string) {
    setBuilder((current) => ({ ...current, added: [...current.added, createCustomSource(directive, value)] }));
  }

  function removeCustom(id: string) {
    setBuilder((current) => ({ ...current, added: current.added.filter((source) => source.id !== id) }));
  }

  function toggleDirective(name: string, enabled: boolean) {
    setBuilder((current) => ({
      ...current,
      directiveOverrides: { ...current.directiveOverrides, [name]: enabled },
    }));
  }

  function addSource(name: string, value: string) {
    setBuilder((current) => {
      const wasRemoved = current.removed.some((item) => item.directive === name && item.value === value);
      return {
        ...current,
        removed: wasRemoved ? current.removed.filter((item) => !(item.directive === name && item.value === value)) : current.removed,
        added: wasRemoved || current.added.some((item) => item.directive === name && item.value === value)
          ? current.added
          : [...current.added, createCustomSource(name, value)],
      };
    });
  }

  function removeSource(name: string, value: string) {
    setBuilder((current) => {
      const inAdded = current.added.some((item) => item.directive === name && item.value === value);
      if (inAdded) {
        return { ...current, added: current.added.filter((item) => !(item.directive === name && item.value === value)) };
      }
      if (current.removed.some((item) => item.directive === name && item.value === value)) return current;
      return { ...current, removed: [...current.removed, { directive: name, value }] };
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">Security builder</Badge>
        <Badge variant="success">Client-side</Badge>
        <ol className="ml-auto flex flex-wrap items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          {HOW_IT_WORKS.map((label, index) => (
            <li key={label} className="flex items-center gap-1.5">
              <span className="text-[var(--color-text-secondary)]">{index + 1}. {label}</span>
              {index < HOW_IT_WORKS.length - 1 ? <span aria-hidden className="text-[var(--color-border-strong)]">→</span> : null}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Directives" value={policyStats.directives} hint="Enabled in output" />
        <SummaryCard label="Sources" value={policyStats.sources} hint="Allowed source tokens" />
        <SummaryCard label="Services" value={builderStats.services} hint="Third-party presets" />
        <SummaryCard label="Review" value={policyStats.risky || policyStats.contextual ? `${policyStats.risky}/${policyStats.contextual}` : "0"} hint="Risky / contextual" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] xl:items-start">
        <div className="order-2 min-w-0 space-y-4 xl:order-1">
          <CspStepCard
            step={1}
            title="Quick start"
            description="Start from a real deployment scenario, then adjust services and domains below."
            action={<Button type="button" size="sm" variant="ghost" onClick={() => setBuilder(createDefaultBuilderState())}>Reset</Button>}
          >
            <div className="grid gap-2.5 md:grid-cols-2 2xl:grid-cols-5">
              {CSP_QUICK_PRESETS.map((preset) => {
                const active =
                  builder.mode === preset.mode &&
                  builder.reportOnly === Boolean(preset.reportOnly) &&
                  preset.services.every((service) => builder.services.includes(service)) &&
                  builder.services.length === preset.services.length &&
                  builder.added.length === (preset.added?.length ?? 0);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setBuilder(applyQuickPreset(preset))}
                    className={cn(
                      "rounded-[var(--radius-md)] border p-3 text-left transition focus:outline-none focus:shadow-[var(--focus-ring)]",
                      active
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-[var(--shadow-xs)]"
                        : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]",
                    )}
                  >
                    <span className="block text-sm font-black text-[var(--color-text-primary)]">{preset.label}</span>
                    <span className="mt-0.5 block font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{preset.tagline}</span>
                    <span className="mt-2 block text-xs leading-5 text-[var(--color-text-secondary)]">{preset.description}</span>
                  </button>
                );
              })}
            </div>
          </CspStepCard>

          <CspStepCard step={2} title="Choose policy mode" description="Use Standard for most apps. Strict requires nonce wiring, so test before enforcing.">
            <CspModeStep mode={builder.mode} onChange={setMode} />
          </CspStepCard>

          <CspStepCard step={3} title="Select common services" description="Filter by category and tick the third-party tools your site actually uses.">
            <CspServicesStep enabled={builder.services} onToggle={toggleService} />
          </CspStepCard>

          <CspStepCard step={4} title="Add custom domains" description="Allow your own APIs, CDNs, sockets, or exact SaaS tenant domains that are not covered above.">
            <CspCustomStep sources={builder.added} onAdd={addCustom} onRemove={removeCustom} getError={sourceError} />
          </CspStepCard>

          <CspAdvanced
            state={state}
            onToggleDirective={toggleDirective}
            onAddSource={addSource}
            onRemoveSource={removeSource}
            getError={sourceError}
          />
        </div>

        <aside className="order-1 min-w-0 space-y-4 xl:order-2 xl:sticky xl:top-24">
          <CspOutput
            mode={builder.mode}
            risk={risk}
            reportOnly={builder.reportOnly}
            onToggleReportOnly={(reportOnly) => patch({ reportOnly })}
            header={header}
            meta={metaOutput}
            nextjs={nextjs}
            nginx={nginx}
            vercel={vercel}
            netlify={netlify}
            apache={apache}
            express={express}
            cloudflare={cloudflare}
            explanation={explanation}
          />
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
            <CspWarnings messages={messages} />
          </div>
        </aside>
      </div>
    </div>
  );
}
