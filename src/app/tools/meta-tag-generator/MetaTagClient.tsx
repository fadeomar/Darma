"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  Archive,
  Code2,
  Download,
  FileJson,
  FileText,
  RotateCcw,
  Search,
  Share2,
  Upload,
} from "lucide-react";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui";
import {
  CodeOutputPanel,
  ControlGrid,
  ControlSection,
  ToolControlPanel,
  WarningPanel,
} from "@/features/tools/components";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { downloadTextFile } from "@/features/tools/export/downloadText";
import { ToolLayoutSingleUtility } from "@/features/tools/layouts";
import { generateMetaTags, getPreviewModel } from "./meta";
import {
  DEFAULT_META_INPUT,
  DESCRIPTION_LIMIT,
  EMPTY_META_INPUT,
  META_PRESETS,
  OG_TYPE_OPTIONS,
  TEXT_LIMIT,
  TITLE_LIMIT,
  TWITTER_CARD_OPTIONS,
  URL_LIMIT,
} from "./presets";
import {
  META_IMPORT_MAX_BYTES,
  buildCompleteHeadDocument,
  buildMetaAudit,
  buildMetaMarkdownReport,
  buildMetaMetricsCsv,
  buildMetaProductionFiles,
  buildMetaSummary,
  buildNextMetadataModule,
  createMetaProject,
  parseMetaProject,
  summarizeMetaAudit,
  type MetaAuditSeverity,
} from "./studio";
import type { MetaTagInput, OgType, TwitterCardType } from "./types";

function Field({ label, hint, count, children }: { label: string; hint?: string; count?: string; children: ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {count ? <span className="font-mono text-[10px] font-normal text-[var(--color-text-tertiary)]">{count}</span> : null}
      </span>
      {children}
      {hint ? <span className="font-normal leading-5 text-[var(--color-text-tertiary)]">{hint}</span> : null}
    </label>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card padding="sm" className="min-w-0">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</p>
      <p className="mt-2 truncate text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]" title={value}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{detail}</p>
    </Card>
  );
}

function auditVariant(severity: MetaAuditSeverity): "danger" | "warning" | "info" | "success" {
  if (severity === "error") return "danger";
  if (severity === "pass") return "success";
  return severity;
}

function PreviewImageStatus({ configured, alt }: { configured: boolean; alt: string }) {
  return (
    <div className="grid min-h-36 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[linear-gradient(145deg,var(--color-surface-subtle),var(--color-surface-base))] p-5 text-center">
      <div>
        <Share2 className="mx-auto h-7 w-7 text-[var(--color-primary)]" aria-hidden />
        <p className="mt-2 text-sm font-black text-[var(--color-text-primary)]">{configured ? "Social image URL configured" : "No social image configured"}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
          {configured ? (alt || "Add image alt text before handoff.") : "Add an absolute image URL for richer cards."}
        </p>
      </div>
    </div>
  );
}

export default function MetaTagClient() {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState<MetaTagInput>(DEFAULT_META_INPUT);
  const [importMessage, setImportMessage] = useState("");
  const [isPacking, setIsPacking] = useState(false);

  const preview = useMemo(() => getPreviewModel(input), [input]);
  const auditChecks = useMemo(() => buildMetaAudit(input), [input]);
  const auditCounts = useMemo(() => summarizeMetaAudit(auditChecks), [auditChecks]);
  const summary = useMemo(() => buildMetaSummary(input, auditChecks), [auditChecks, input]);
  const projectJson = useMemo(() => JSON.stringify(createMetaProject(input), null, 2), [input]);
  const markdownReport = useMemo(() => buildMetaMarkdownReport(input, auditChecks), [auditChecks, input]);
  const metricsCsv = useMemo(() => buildMetaMetricsCsv(input, auditChecks), [auditChecks, input]);
  const completeDocument = useMemo(() => buildCompleteHeadDocument(input), [input]);
  const nextMetadata = useMemo(() => buildNextMetadataModule(input), [input]);
  const generatedTags = useMemo(() => generateMetaTags(input, "all"), [input]);

  const patch = (next: Partial<MetaTagInput>) => {
    setImportMessage("");
    setInput((current) => ({ ...current, ...next }));
  };

  const readinessVariant = auditCounts.error ? "danger" : auditCounts.warning ? "warning" : "success";

  async function importProject(file: File | undefined) {
    if (!file) return;
    if (file.size > META_IMPORT_MAX_BYTES) {
      setImportMessage("Import failed: JSON project files must be 1 MB or smaller.");
      return;
    }

    try {
      const project = parseMetaProject(await file.text());
      setInput(project.input);
      setImportMessage(`Imported ${file.name}. Review every URL and production check before publishing.`);
    } catch (error) {
      setImportMessage(`Import failed: ${error instanceof Error ? error.message : "Unknown project format."}`);
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  async function downloadPack() {
    if (auditCounts.error > 0 || isPacking) return;
    setIsPacking(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const files = buildMetaProductionFiles(input, auditChecks);
      Object.entries(files).forEach(([name, content]) => zip.file(name, content));
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlobFile({ blob, filename: "darma-meta-tag-production-pack.zip" });
    } finally {
      setIsPacking(false);
    }
  }

  const codeTabs = [
    { id: "all", label: "All tags", code: generatedTags, language: "html", filename: "meta-tags.html" },
    { id: "seo", label: "SEO", code: generateMetaTags(input, "seo"), language: "html", filename: "seo-tags.html" },
    { id: "og", label: "Open Graph", code: generateMetaTags(input, "openGraph"), language: "html", filename: "open-graph-tags.html" },
    { id: "twitter", label: "Twitter/X", code: generateMetaTags(input, "twitter"), language: "html", filename: "twitter-card-tags.html" },
    { id: "next", label: "Next.js", code: nextMetadata, language: "typescript", filename: "metadata.ts" },
  ];

  return (
    <ToolLayoutSingleUtility
      resultSlot={
        <div className="space-y-4">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Meta tag project summary">
            {summary.map((item) => <SummaryCard key={item.label} {...item} />)}
          </section>

          <Card padding="md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge variant="accent">Live previews</Badge>
                <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Search and social handoff</h2>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--color-text-secondary)]">These local previews estimate copy hierarchy. Deployed platforms can cache, crop, and truncate content differently.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setInput(DEFAULT_META_INPUT)}>Sample</Button>
                <Button size="sm" variant="ghost" onClick={() => setInput(EMPTY_META_INPUT)} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>Clear</Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-white p-5 text-slate-900 shadow-[var(--shadow-card)]" aria-label="Search result preview">
                <div className="flex items-center gap-2 text-xs text-slate-600"><Search className="h-4 w-4" aria-hidden /> Search preview</div>
                <p className="mt-4 truncate text-sm text-emerald-800">{preview.domain}</p>
                <h3 className="mt-1 max-h-14 overflow-hidden text-xl font-medium leading-7 text-blue-800">{preview.title}</h3>
                <p className="mt-2 max-h-[4.5rem] overflow-hidden text-sm leading-6 text-slate-700">{preview.description}</p>
              </section>

              <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-card)]" aria-label="Social card preview">
                <PreviewImageStatus configured={Boolean(preview.imageUrl)} alt={preview.imageAlt} />
                <div className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">{preview.siteName} · {preview.domain}</p>
                  <h3 className="mt-2 max-h-12 overflow-hidden text-base font-black leading-6 text-[var(--color-text-primary)]">{preview.title}</h3>
                  <p className="mt-1 max-h-10 overflow-hidden text-xs leading-5 text-[var(--color-text-secondary)]">{preview.description}</p>
                </div>
              </section>
            </div>
          </Card>

          <CodeOutputPanel
            title="Generated integration code"
            description="Switch between raw head tags and a framework-ready Next.js metadata module."
            tabs={codeTabs}
            onDownload={(tab) => downloadTextFile({
              content: tab.code,
              filename: tab.filename ?? "meta-tags.txt",
              mimeType: tab.language === "typescript" ? "text/plain;charset=utf-8" : "text/html;charset=utf-8",
            })}
          />
        </div>
      }
      controlsSlot={
        <div className="space-y-5">
          <ToolControlPanel title="SEO and canonical data" description="Write the copy and destination search engines should associate with this page." sticky={false}>
            <ControlSection title="Search snippet">
              <div className="grid gap-3">
                <Field label="Page title" count={`${input.title.length}/${TITLE_LIMIT}`} hint="Aim for concise, page-specific copy rather than repeating the site name everywhere.">
                  <Input maxLength={TITLE_LIMIT} value={input.title} onChange={(event) => patch({ title: event.target.value })} placeholder="Page title" />
                </Field>
                <Field label="Meta description" count={`${input.description.length}/${DESCRIPTION_LIMIT}`}>
                  <Textarea maxLength={DESCRIPTION_LIMIT} minRows={4} value={input.description} onChange={(event) => patch({ description: event.target.value })} placeholder="Describe the page clearly." />
                </Field>
                <Field label="Canonical URL" count={`${input.canonicalUrl.length}/${URL_LIMIT}`} hint="Use the final absolute URL, including https://.">
                  <Input maxLength={URL_LIMIT} inputMode="url" value={input.canonicalUrl} onChange={(event) => patch({ canonicalUrl: event.target.value })} placeholder="https://example.com/page" />
                </Field>
              </div>
            </ControlSection>
          </ToolControlPanel>

          <ToolControlPanel title="Open Graph and social cards" description="Configure publisher identity, image context, locale, and X/Twitter attribution." sticky={false}>
            <ControlSection title="Publisher and card type">
              <ControlGrid columns={2}>
                <Field label="Site name" count={`${input.siteName.length}/${TEXT_LIMIT}`}>
                  <Input maxLength={TEXT_LIMIT} value={input.siteName} onChange={(event) => patch({ siteName: event.target.value })} />
                </Field>
                <Field label="Open Graph type">
                  <Select size="sm" value={input.ogType} onChange={(event) => patch({ ogType: event.target.value as OgType })}>
                    {OG_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Select>
                </Field>
                <Field label="Locale" hint="Use language_REGION, for example en_US or ar_PS.">
                  <Input maxLength={20} value={input.locale} onChange={(event) => patch({ locale: event.target.value })} placeholder="en_US" />
                </Field>
                <Field label="Twitter/X card">
                  <Select size="sm" value={input.twitterCard} onChange={(event) => patch({ twitterCard: event.target.value as TwitterCardType })}>
                    {TWITTER_CARD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Select>
                </Field>
              </ControlGrid>
            </ControlSection>

            <ControlSection title="Social image">
              <div className="grid gap-3">
                <Field label="Image URL" count={`${input.imageUrl.length}/${URL_LIMIT}`} hint="The tool does not fetch the image; validate the deployed asset separately.">
                  <Input maxLength={URL_LIMIT} inputMode="url" value={input.imageUrl} onChange={(event) => patch({ imageUrl: event.target.value })} placeholder="https://example.com/social-card.jpg" />
                </Field>
                <Field label="Image alt text" count={`${input.imageAlt.length}/${TEXT_LIMIT}`}>
                  <Input maxLength={TEXT_LIMIT} value={input.imageAlt} onChange={(event) => patch({ imageAlt: event.target.value })} placeholder="Describe the social image." />
                </Field>
              </div>
            </ControlSection>

            <ControlSection title="Attribution">
              <ControlGrid columns={2}>
                <Field label="Site handle" hint="The @ prefix is added automatically when omitted.">
                  <Input maxLength={40} value={input.twitterSite} onChange={(event) => patch({ twitterSite: event.target.value })} placeholder="@example" />
                </Field>
                <Field label="Creator handle">
                  <Input maxLength={40} value={input.twitterCreator} onChange={(event) => patch({ twitterCreator: event.target.value })} placeholder="@creator" />
                </Field>
              </ControlGrid>
            </ControlSection>

            <ControlSection title="Practical presets">
              <div className="grid gap-2 sm:grid-cols-3">
                {META_PRESETS.map((preset) => (
                  <button key={preset.label} type="button" onClick={() => setInput(preset.input)} className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3 text-left transition hover:border-[var(--color-border-strong)] focus:outline-none focus:shadow-[var(--focus-ring)]">
                    <span className="block text-sm font-black text-[var(--color-text-primary)]">{preset.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">{preset.description}</span>
                  </button>
                ))}
              </div>
            </ControlSection>
          </ToolControlPanel>
        </div>
      }
      infoSlot={
        <div className="space-y-5">
          <Card padding="md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge variant="soft">Project portability</Badge>
                <p className="mt-2 text-sm font-bold text-[var(--color-text-primary)]">Save or reopen editable settings</p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">Project JSON contains metadata fields only. It does not fetch remote images or URLs.</p>
              </div>
              <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void importProject(event.target.files?.[0])} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => importInputRef.current?.click()} leftIcon={<Upload className="h-4 w-4" aria-hidden />}>Import JSON</Button>
              <Button size="sm" variant="secondary" onClick={() => downloadTextFile({ content: projectJson, filename: "darma-meta-project.json", mimeType: "application/json;charset=utf-8" })} leftIcon={<FileJson className="h-4 w-4" aria-hidden />}>Project JSON</Button>
            </div>
            {importMessage ? <p className={`mt-3 text-xs leading-5 ${importMessage.startsWith("Import failed") ? "text-[var(--color-danger-text)]" : "text-[var(--color-success-text)]"}`} role="status">{importMessage}</p> : null}
          </Card>

          <Card padding="md">
            <Badge variant={readinessVariant}>Production checks</Badge>
            <p className="mt-2 text-sm font-bold text-[var(--color-text-primary)]">{auditCounts.error} errors · {auditCounts.warning} warnings · {auditCounts.info} info · {auditCounts.pass} passes</p>
            <WarningPanel className="mt-4" messages={auditChecks.map((check) => ({ id: check.id, severity: auditVariant(check.severity), title: check.title, message: check.message }))} />
          </Card>

          <Card padding="md">
            <Badge variant="accent">Developer exports</Badge>
            <p className="mt-2 text-sm font-bold text-[var(--color-text-primary)]">Framework and handoff files</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">Download standalone head markup, Next.js metadata, reports, metrics, or the complete production pack.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" onClick={() => downloadTextFile({ content: completeDocument, filename: "head-example.html", mimeType: "text/html;charset=utf-8" })} leftIcon={<Code2 className="h-4 w-4" aria-hidden />}>HTML</Button>
              <Button size="sm" variant="secondary" onClick={() => downloadTextFile({ content: nextMetadata, filename: "metadata.ts", mimeType: "text/plain;charset=utf-8" })} leftIcon={<Code2 className="h-4 w-4" aria-hidden />}>Next.js</Button>
              <Button size="sm" variant="secondary" onClick={() => downloadTextFile({ content: markdownReport, filename: "meta-production-report.md", mimeType: "text/markdown;charset=utf-8" })} leftIcon={<FileText className="h-4 w-4" aria-hidden />}>Report</Button>
              <Button size="sm" variant="secondary" onClick={() => downloadTextFile({ content: metricsCsv, filename: "meta-production-metrics.csv", mimeType: "text/csv;charset=utf-8" })} leftIcon={<Download className="h-4 w-4" aria-hidden />}>CSV</Button>
              <Button className="col-span-2" size="sm" disabled={auditCounts.error > 0 || isPacking} loading={isPacking} onClick={() => void downloadPack()} leftIcon={<Archive className="h-4 w-4" aria-hidden />}>
                {isPacking ? "Packing…" : "ZIP production pack"}
              </Button>
            </div>
          </Card>
        </div>
      }
    />
  );
}
