"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui";
import {
  calculateCspRiskLevel,
  generateCspHeader,
  generateCspMetaTag,
  generateNextJsHeadersConfig,
  generateNginxHeader,
  generateVercelConfig,
  validateCspState,
} from "./csp";
import {
  buildCspState,
  createCustomSource,
  createDefaultBuilderState,
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

const HOW_IT_WORKS = ["Pick a mode", "Choose services", "Add domains", "Copy output"];

export default function CspGeneratorClient() {
  const [builder, setBuilder] = useState<CspBuilderState>(() => createDefaultBuilderState());

  const state = useMemo(() => buildCspState(builder), [builder]);
  const risk = useMemo(() => calculateCspRiskLevel(state), [state]);
  const messages = useMemo(() => validateCspState(state), [state]);
  const header = useMemo(() => generateCspHeader(state), [state]);
  const meta = useMemo(() => generateCspMetaTag(state), [state]);
  const nextjs = useMemo(() => generateNextJsHeadersConfig(state), [state]);
  const nginx = useMemo(() => generateNginxHeader(state), [state]);
  const vercel = useMemo(() => generateVercelConfig(state), [state]);

  function patch(next: Partial<CspBuilderState>) {
    setBuilder((current) => ({ ...current, ...next }));
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
      disabledDirectives: enabled
        ? current.disabledDirectives.filter((value) => value !== name)
        : [...current.disabledDirectives, name],
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
        <Badge variant="accent">Advanced developer tool</Badge>
        <Badge variant="warning">Beta</Badge>
        <ol className="ml-auto flex flex-wrap items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          {HOW_IT_WORKS.map((label, index) => (
            <li key={label} className="flex items-center gap-1.5">
              <span className="text-[var(--color-text-secondary)]">{index + 1}. {label}</span>
              {index < HOW_IT_WORKS.length - 1 ? <span aria-hidden className="text-[var(--color-border-strong)]">→</span> : null}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] xl:items-start">
        <div className="order-2 min-w-0 space-y-4 xl:order-1">
          <CspStepCard step={1} title="Choose policy mode" description="How strict should the policy be? Standard works for most apps.">
            <CspModeStep mode={builder.mode} onChange={setMode} />
          </CspStepCard>

          <CspStepCard step={2} title="Select common services" description="Tick the third-party tools your site uses. We add the right domains for you.">
            <CspServicesStep enabled={builder.services} onToggle={toggleService} />
          </CspStepCard>

          <CspStepCard step={3} title="Add custom domains" description="Allow your own APIs, CDNs, or sockets that aren't covered above.">
            <CspCustomStep sources={builder.added} onAdd={addCustom} onRemove={removeCustom} />
          </CspStepCard>

          <CspAdvanced
            state={state}
            onToggleDirective={toggleDirective}
            onAddSource={addSource}
            onRemoveSource={removeSource}
          />
        </div>

        <aside className="order-1 min-w-0 space-y-4 xl:order-2 xl:sticky xl:top-24">
          <CspOutput
            risk={risk}
            reportOnly={builder.reportOnly}
            onToggleReportOnly={(reportOnly) => patch({ reportOnly })}
            header={header}
            meta={meta}
            nextjs={nextjs}
            nginx={nginx}
            vercel={vercel}
          />
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
            <CspWarnings messages={messages} />
          </div>
        </aside>
      </div>
    </div>
  );
}
