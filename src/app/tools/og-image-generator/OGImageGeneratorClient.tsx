"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Copy, Download, FileArchive, ImageIcon, Loader2, Sparkles, UploadCloud, XCircle } from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { CodeOutputPanel, ColorField, CompactField, ControlSection, SegmentedControl, SliderNumberField, WarningPanel, type WarningMessage } from "@/features/tools/components";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { cn } from "@/lib/cn";
import { fileToDataUrl } from "./canvas";
import { generateOgAssets, revokeOgAssetUrls } from "./generator";
import { BACKGROUND_OPTIONS, DEFAULT_OG_INPUT, EXPORT_PACKS, LOGO_POSITION_OPTIONS, MAX_UPLOAD_BYTES, QUICK_PRESETS, TEMPLATE_OPTIONS, TEXT_ALIGN_OPTIONS } from "./presets";
import { createHtmlMetaSnippet, createNextMetadataSnippet } from "./snippets";
import type { OgBackgroundMode, OgGeneratedAsset, OgImageInput, OgLogoPosition, OgTextAlign, OgTemplateId, OgWarning } from "./types";
import { createReadinessChecks, scoreReadiness, validateExistingPackage, validateGeneratedAssets, validateOgInput } from "./validation";
import { createZipArchive } from "./zip";

type Status = "idle" | "generating" | "ready" | "error";

function updateInput(setInput: React.Dispatch<React.SetStateAction<OgImageInput>>, patch: Partial<OgImageInput>) {
  setInput((current) => ({ ...current, ...patch }));
}

function formatBytes(bytes?: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FieldGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-3 sm:grid-cols-2", className)}>{children}</div>;
}

function MiniLabel({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{children}</span>;
}

function mapWarnings(warnings: OgWarning[]): WarningMessage[] {
  return warnings.map((warning) => ({
    id: warning.id,
    severity: warning.level === "error" ? "danger" : warning.level,
    title: warning.title,
    message: warning.message,
  }));
}

function CopyInlineButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  async function copyValue() {
    const copied = await copyTextToClipboard(value);
    setCopyStatus(copied ? "copied" : "failed");
    window.setTimeout(() => setCopyStatus("idle"), copied ? 1300 : 2200);
  }
  return (
    <Button size="sm" variant="ghost" leftIcon={<Copy className="h-3.5 w-3.5" />} onClick={copyValue}>
      {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : label}
    </Button>
  );
}

function PreviewTile({ title, children, meta }: { title: string; children: ReactNode; meta?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3 shadow-[var(--shadow-xs)]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <MiniLabel>{title}</MiniLabel>
        {meta ? <span className="text-[11px] text-[var(--color-text-tertiary)]">{meta}</span> : null}
      </div>
      {children}
    </div>
  );
}

function QuickPresets({ setInput }: { setInput: React.Dispatch<React.SetStateAction<OgImageInput>> }) {
  return (
    <ControlSection title="Quick social presets" description="Pick a target use case first, then customize copy, colors, and export pack.">
      <div className="grid gap-2">
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setInput((current) => ({ ...current, ...preset.patch }))}
            className="group rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
              <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
              {preset.title}
            </span>
            <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">{preset.description}</span>
          </button>
        ))}
      </div>
    </ControlSection>
  );
}

function UploadBox({ label, hint, accept, onChange, previewUrl }: { label: string; hint: string; accept: string; onChange: (file: File) => void; previewUrl?: string }) {
  return (
    <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-3 text-center transition hover:border-[var(--color-primary)] hover:bg-[var(--color-control-hover)]">
      {previewUrl ? <img src={previewUrl} alt="Uploaded preview" className="h-14 w-20 rounded-[var(--radius-sm)] object-cover shadow-[var(--shadow-xs)]" /> : <UploadCloud className="h-6 w-6 text-[var(--color-primary)]" />}
      <span className="text-xs font-bold text-[var(--color-text-primary)]">{label}</span>
      <span className="text-[11px] leading-4 text-[var(--color-text-tertiary)]">{hint}</span>
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onChange(file);
          event.target.value = "";
        }}
      />
    </label>
  );
}

function DesignControls({ input, setInput }: { input: OgImageInput; setInput: React.Dispatch<React.SetStateAction<OgImageInput>> }) {
  return (
    <ControlSection title="Design system" description="Control the template, background, colors, and typography.">
      <CompactField label="Template">
        <Select value={input.templateId} onChange={(event) => updateInput(setInput, { templateId: event.target.value as OgTemplateId })}>
          {TEMPLATE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
      </CompactField>

      <SegmentedControl<OgBackgroundMode>
        ariaLabel="Background mode"
        fullWidth
        size="md"
        value={input.backgroundMode}
        onChange={(backgroundMode) => updateInput(setInput, { backgroundMode })}
        options={BACKGROUND_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
      />

      <FieldGroup>
        <ColorField label="Background" value={input.backgroundColor} onChange={(backgroundColor) => updateInput(setInput, { backgroundColor })} />
        <ColorField label="Text" value={input.foregroundColor} onChange={(foregroundColor) => updateInput(setInput, { foregroundColor })} />
        <ColorField label="Muted text" value={input.mutedColor} onChange={(mutedColor) => updateInput(setInput, { mutedColor })} />
        <ColorField label="Accent" value={input.accentColor} onChange={(accentColor) => updateInput(setInput, { accentColor })} />
      </FieldGroup>

      {input.backgroundMode === "gradient" ? (
        <FieldGroup>
          <ColorField label="Gradient from" value={input.gradientFrom} onChange={(gradientFrom) => updateInput(setInput, { gradientFrom })} />
          <ColorField label="Gradient to" value={input.gradientTo} onChange={(gradientTo) => updateInput(setInput, { gradientTo })} />
          <SliderNumberField label="Gradient angle" min={0} max={360} value={input.gradientAngle} unit="°" onChange={(gradientAngle) => updateInput(setInput, { gradientAngle })} />
        </FieldGroup>
      ) : null}

      {input.backgroundMode === "pattern" ? <SliderNumberField label="Pattern intensity" min={0} max={100} value={input.patternIntensity} unit="%" onChange={(patternIntensity) => updateInput(setInput, { patternIntensity })} /> : null}
      {input.backgroundMode === "image" ? <SliderNumberField label="Image overlay" min={0} max={95} value={input.imageOverlay} unit="%" onChange={(imageOverlay) => updateInput(setInput, { imageOverlay })} /> : null}

      <FieldGroup>
        <CompactField label="Text align">
          <Select value={input.textAlign} onChange={(event) => updateInput(setInput, { textAlign: event.target.value as OgTextAlign })}>
            {TEXT_ALIGN_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </CompactField>
        <CompactField label="Logo position">
          <Select value={input.logoPosition} onChange={(event) => updateInput(setInput, { logoPosition: event.target.value as OgLogoPosition })}>
            {LOGO_POSITION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </CompactField>
      </FieldGroup>

      <FieldGroup>
        <SliderNumberField label="Title size" min={42} max={104} value={input.titleSize} unit="px" onChange={(titleSize) => updateInput(setInput, { titleSize })} />
        <SliderNumberField label="Subtitle size" min={18} max={42} value={input.subtitleSize} unit="px" onChange={(subtitleSize) => updateInput(setInput, { subtitleSize })} />
        <SliderNumberField label="Badge size" min={14} max={30} value={input.badgeSize} unit="px" onChange={(badgeSize) => updateInput(setInput, { badgeSize })} />
        <SliderNumberField label="Frame radius" min={0} max={80} value={input.frameRadius} unit="px" onChange={(frameRadius) => updateInput(setInput, { frameRadius })} />
      </FieldGroup>

      <label className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
        <input type="checkbox" checked={input.safeArea} onChange={(event) => updateInput(setInput, { safeArea: event.target.checked })} className="mt-1" />
        Show safe-area guide in the generated preview image.
      </label>
    </ControlSection>
  );
}

function ContentControls({ input, setInput }: { input: OgImageInput; setInput: React.Dispatch<React.SetStateAction<OgImageInput>> }) {
  return (
    <ControlSection title="Content" description="Write the social preview copy and metadata content.">
      <CompactField label="Title" hint={`${input.title.length}/90 recommended`}>
        <Textarea minRows={3} value={input.title} onChange={(event) => updateInput(setInput, { title: event.target.value })} />
      </CompactField>
      <CompactField label="Subtitle / description" hint={`${input.subtitle.length}/200 recommended`}>
        <Textarea minRows={4} value={input.subtitle} onChange={(event) => updateInput(setInput, { subtitle: event.target.value })} />
      </CompactField>
      <FieldGroup>
        <CompactField label="Badge"><Input value={input.badge} onChange={(event) => updateInput(setInput, { badge: event.target.value })} /></CompactField>
        <CompactField label="Domain"><Input value={input.domain} onChange={(event) => updateInput(setInput, { domain: event.target.value })} /></CompactField>
        <CompactField label="Author / brand"><Input value={input.author} onChange={(event) => updateInput(setInput, { author: event.target.value })} /></CompactField>
        <CompactField label="Call to action"><Input value={input.callToAction} onChange={(event) => updateInput(setInput, { callToAction: event.target.value })} /></CompactField>
      </FieldGroup>
      <CompactField label="Alt text"><Input value={input.altText} onChange={(event) => updateInput(setInput, { altText: event.target.value })} /></CompactField>
      <CompactField label="Site URL"><Input value={input.siteUrl} onChange={(event) => updateInput(setInput, { siteUrl: event.target.value })} /></CompactField>
    </ControlSection>
  );
}

function AssetControls({ input, setInput, uploadError, setUploadError }: { input: OgImageInput; setInput: React.Dispatch<React.SetStateAction<OgImageInput>>; uploadError: string; setUploadError: (value: string) => void }) {
  async function handleUpload(file: File, target: "logo" | "background") {
    setUploadError("");
    const supportedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
    if (file.type && !supportedTypes.has(file.type)) {
      setUploadError("Please upload a PNG, JPG, WebP, or SVG image.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("Please choose an image below 8 MB.");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      updateInput(setInput, target === "logo" ? { logoDataUrl: dataUrl } : { backgroundImageDataUrl: dataUrl, backgroundMode: "image" });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Unable to load that image.");
    }
  }

  return (
    <ControlSection title="Brand assets" description="Upload a logo and optional background image. Everything stays local in your browser.">
      <FieldGroup>
        <UploadBox label="Upload logo" hint="PNG, JPG, WebP, or SVG image" accept="image/png,image/jpeg,image/webp,image/svg+xml" previewUrl={input.logoDataUrl} onChange={(file) => handleUpload(file, "logo")} />
        <UploadBox label="Upload background" hint="Best: 1600×900 or larger" accept="image/png,image/jpeg,image/webp,image/svg+xml" previewUrl={input.backgroundImageDataUrl} onChange={(file) => handleUpload(file, "background")} />
      </FieldGroup>
      {uploadError ? <p className="text-xs font-semibold text-[var(--color-danger-text)]">{uploadError}</p> : null}
    </ControlSection>
  );
}

function ExportControls({ input, setInput }: { input: OgImageInput; setInput: React.Dispatch<React.SetStateAction<OgImageInput>> }) {
  return (
    <ControlSection title="Export pack" description="Choose what the generated ZIP should contain.">
      <div className="grid gap-2">
        {EXPORT_PACKS.map((pack) => {
          const active = pack.id === input.exportPack;
          return (
            <button
              key={pack.id}
              type="button"
              onClick={() => updateInput(setInput, { exportPack: pack.id })}
              className={cn("rounded-[var(--radius-md)] border p-3 text-left transition", active ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]")}
            >
              <span className="block text-sm font-bold text-[var(--color-text-primary)]">{pack.label}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">{pack.description}</span>
            </button>
          );
        })}
      </div>
    </ControlSection>
  );
}

function MainPreview({ previewUrl, status, input }: { previewUrl?: string; status: Status; input: OgImageInput }) {
  return (
    <div className="flex min-h-[520px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Live canvas preview</div>
          <h3 className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">{input.title || "Social preview image"}</h3>
        </div>
        <span className="rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-3 py-1 font-mono text-xs font-bold text-[var(--color-text-secondary)]">1200×630</span>
      </div>
      <div className="grid flex-1 place-items-center rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-inner)]">
        {status === "generating" ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]"><Loader2 className="h-4 w-4 animate-spin" /> Generating preview…</div>
        ) : previewUrl ? (
          <img src={previewUrl} alt="Generated social preview" className="w-full rounded-[var(--radius-lg)] border border-black/10 object-contain shadow-[var(--shadow-lg)]" />
        ) : (
          <div className="text-center text-sm text-[var(--color-text-secondary)]"><ImageIcon className="mx-auto mb-2 h-8 w-8" /> Preview will appear here.</div>
        )}
      </div>
    </div>
  );
}

function PlatformPreview({ previewUrl, input }: { previewUrl?: string; input: OgImageInput }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <PreviewTile title="X / Twitter" meta="summary_large_image">
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
          {previewUrl ? <img src={previewUrl} alt="Twitter preview" className="aspect-[1.91/1] w-full object-cover" /> : null}
          <div className="space-y-1 p-3"><p className="text-xs text-[var(--color-text-tertiary)]">{input.domain}</p><p className="text-sm font-bold text-[var(--color-text-primary)]">{input.title}</p><p className="line-clamp-2 text-xs text-[var(--color-text-secondary)]">{input.subtitle}</p></div>
        </div>
      </PreviewTile>
      <PreviewTile title="LinkedIn" meta="feed card">
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
          {previewUrl ? <img src={previewUrl} alt="LinkedIn preview" className="aspect-[1.91/1] w-full object-cover" /> : null}
          <div className="space-y-1 p-3"><p className="text-sm font-bold text-[var(--color-text-primary)]">{input.title}</p><p className="text-xs text-[var(--color-text-tertiary)]">{input.domain}</p></div>
        </div>
      </PreviewTile>
      <PreviewTile title="Discord / Slack" meta="chat unfurl">
        <div className="rounded-[var(--radius-md)] border-l-4 border-[var(--color-primary)] bg-[var(--color-surface-base)] p-3">
          <p className="text-xs font-bold text-[var(--color-primary)]">{input.domain}</p>
          <p className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">{input.title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{input.subtitle}</p>
          {previewUrl ? <img src={previewUrl} alt="Chat preview" className="mt-3 rounded-[var(--radius-sm)]" /> : null}
        </div>
      </PreviewTile>
    </div>
  );
}

function ReadinessPanel({ input, assets }: { input: OgImageInput; assets: OgGeneratedAsset[] }) {
  const checks = createReadinessChecks(input, assets);
  const score = scoreReadiness(checks);
  return (
    <PreviewTile title="Readiness score" meta={`${score}/100`}>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
        <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${score}%` }} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {checks.map((check) => (
          <div key={check.id} className="flex gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-2.5">
            <CheckCircle2 className={cn("mt-0.5 h-4 w-4 shrink-0", check.passed ? "text-[var(--color-success-text)]" : "text-[var(--color-warning-text)]")} />
            <div className="min-w-0"><p className="text-xs font-bold text-[var(--color-text-primary)]">{check.label}</p><p className="text-[11px] leading-4 text-[var(--color-text-secondary)]">{check.detail}</p></div>
          </div>
        ))}
      </div>
    </PreviewTile>
  );
}

function GeneratedFiles({ assets }: { assets: OgGeneratedAsset[] }) {
  const total = assets.reduce((sum, asset) => sum + asset.size, 0);
  return (
    <PreviewTile title="Generated package" meta={`${assets.length} files · ${formatBytes(total)}`}>
      <div className="grid max-h-64 gap-2 overflow-auto pr-1 sm:grid-cols-2">
        {assets.map((asset) => (
          <button key={asset.filename} type="button" onClick={() => downloadBlobFile({ blob: asset.blob, filename: asset.filename.split("/").pop() ?? asset.filename })} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-2 text-left text-xs hover:border-[var(--color-primary)]">
            <span className="min-w-0 truncate font-mono text-[var(--color-text-primary)]">{asset.filename}</span>
            <span className="shrink-0 text-[var(--color-text-tertiary)]">{formatBytes(asset.size)}</span>
          </button>
        ))}
      </div>
    </PreviewTile>
  );
}

// ── Local HTML / Meta Checker ────────────────────────────────────────────

type MetaTagCheck = {
  id: string;
  tag: string;
  passed: boolean;
  level: "error" | "warning" | "info";
  detail: string;
};

function parseHtmlMetaTags(source: string) {
  const wrapped = source.trim().toLowerCase().startsWith("<html") ? source : `<!doctype html><html><head>${source}</head></html>`;
  const doc = new DOMParser().parseFromString(wrapped, "text/html");
  const meta = (attr: string, val: string) =>
    doc.querySelector(`meta[${attr}="${val}"]`)?.getAttribute("content")?.trim() ?? "";
  return {
    title: doc.querySelector("title")?.textContent?.trim() ?? "",
    description: meta("name", "description"),
    canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute("href")?.trim() ?? "",
    ogType: meta("property", "og:type"),
    ogTitle: meta("property", "og:title"),
    ogDescription: meta("property", "og:description"),
    ogUrl: meta("property", "og:url"),
    ogImage: meta("property", "og:image"),
    ogImageWidth: meta("property", "og:image:width"),
    ogImageHeight: meta("property", "og:image:height"),
    ogImageAlt: meta("property", "og:image:alt"),
    twitterCard: meta("name", "twitter:card"),
    twitterTitle: meta("name", "twitter:title"),
    twitterDescription: meta("name", "twitter:description"),
    twitterImage: meta("name", "twitter:image"),
    twitterImageAlt: meta("name", "twitter:image:alt"),
  };
}

function trunc(s: string, max = 52) {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function runHtmlMetaChecks(source: string): MetaTagCheck[] {
  if (!source.trim()) return [];
  const p = parseHtmlMetaTags(source);
  const isAbs = (s: string) => s.startsWith("http://") || s.startsWith("https://");

  return [
    !p.title
      ? { id: "title", tag: "<title>", level: "error", passed: false, detail: "Missing — required for all pages." }
      : p.title.length > 90
      ? { id: "title", tag: "<title>", level: "warning", passed: false, detail: `${p.title.length} chars — aim for ≤90.` }
      : { id: "title", tag: "<title>", level: "info", passed: true, detail: `"${trunc(p.title)}"` },

    !p.description
      ? { id: "meta-desc", tag: 'name="description"', level: "error", passed: false, detail: "Missing — important for search snippets." }
      : p.description.length > 200
      ? { id: "meta-desc", tag: 'name="description"', level: "warning", passed: false, detail: `${p.description.length} chars — aim for ≤160.` }
      : { id: "meta-desc", tag: 'name="description"', level: "info", passed: true, detail: `${p.description.length} chars` },

    !p.canonical
      ? { id: "canonical", tag: 'rel="canonical"', level: "warning", passed: false, detail: "Missing — recommended to avoid duplicate-content issues." }
      : !isAbs(p.canonical)
      ? { id: "canonical", tag: 'rel="canonical"', level: "warning", passed: false, detail: "Should be an absolute https:// URL." }
      : { id: "canonical", tag: 'rel="canonical"', level: "info", passed: true, detail: trunc(p.canonical) },

    !p.ogType
      ? { id: "og-type", tag: "og:type", level: "error", passed: false, detail: "Missing — add \"website\" or \"article\"." }
      : { id: "og-type", tag: "og:type", level: "info", passed: true, detail: p.ogType },

    !p.ogTitle
      ? { id: "og-title", tag: "og:title", level: "error", passed: false, detail: "Missing — used as headline on social cards." }
      : { id: "og-title", tag: "og:title", level: "info", passed: true, detail: `"${trunc(p.ogTitle)}"` },

    !p.ogDescription
      ? { id: "og-desc", tag: "og:description", level: "warning", passed: false, detail: "Missing — shown as subtitle on social cards." }
      : { id: "og-desc", tag: "og:description", level: "info", passed: true, detail: `${p.ogDescription.length} chars` },

    !p.ogUrl
      ? { id: "og-url", tag: "og:url", level: "warning", passed: false, detail: "Missing — helps platforms identify canonical page." }
      : !isAbs(p.ogUrl)
      ? { id: "og-url", tag: "og:url", level: "error", passed: false, detail: "Must be an absolute https:// URL." }
      : { id: "og-url", tag: "og:url", level: "info", passed: true, detail: trunc(p.ogUrl) },

    !p.ogImage
      ? { id: "og-image", tag: "og:image", level: "error", passed: false, detail: "Missing — required for social preview image." }
      : !isAbs(p.ogImage)
      ? { id: "og-image", tag: "og:image", level: "error", passed: false, detail: "Must be absolute — crawlers don't follow relative paths." }
      : { id: "og-image", tag: "og:image", level: "info", passed: true, detail: trunc(p.ogImage) },

    !p.ogImageWidth
      ? { id: "og-w", tag: "og:image:width", level: "warning", passed: false, detail: "Missing — add 1200 for broad compatibility." }
      : p.ogImageWidth !== "1200"
      ? { id: "og-w", tag: "og:image:width", level: "warning", passed: false, detail: `${p.ogImageWidth} — recommended 1200.` }
      : { id: "og-w", tag: "og:image:width", level: "info", passed: true, detail: `${p.ogImageWidth}px` },

    !p.ogImageHeight
      ? { id: "og-h", tag: "og:image:height", level: "warning", passed: false, detail: "Missing — add 630 for broad compatibility." }
      : p.ogImageHeight !== "630"
      ? { id: "og-h", tag: "og:image:height", level: "warning", passed: false, detail: `${p.ogImageHeight} — recommended 630.` }
      : { id: "og-h", tag: "og:image:height", level: "info", passed: true, detail: `${p.ogImageHeight}px` },

    !p.ogImageAlt
      ? { id: "og-alt", tag: "og:image:alt", level: "warning", passed: false, detail: "Missing — add alt text for accessibility." }
      : { id: "og-alt", tag: "og:image:alt", level: "info", passed: true, detail: `"${trunc(p.ogImageAlt)}"` },

    !p.twitterCard
      ? { id: "tw-card", tag: "twitter:card", level: "error", passed: false, detail: "Missing — required for Twitter/X card rendering." }
      : !["summary", "summary_large_image", "app", "player"].includes(p.twitterCard)
      ? { id: "tw-card", tag: "twitter:card", level: "warning", passed: false, detail: `Unknown value "${p.twitterCard}".` }
      : { id: "tw-card", tag: "twitter:card", level: "info", passed: true, detail: p.twitterCard },

    !p.twitterTitle
      ? { id: "tw-title", tag: "twitter:title", level: "warning", passed: false, detail: "Missing — Twitter falls back to og:title if absent." }
      : { id: "tw-title", tag: "twitter:title", level: "info", passed: true, detail: `"${trunc(p.twitterTitle)}"` },

    !p.twitterDescription
      ? { id: "tw-desc", tag: "twitter:description", level: "warning", passed: false, detail: "Missing — Twitter falls back to og:description." }
      : { id: "tw-desc", tag: "twitter:description", level: "info", passed: true, detail: `${p.twitterDescription.length} chars` },

    !p.twitterImage
      ? { id: "tw-image", tag: "twitter:image", level: "warning", passed: false, detail: "Missing — add a dedicated Twitter/X image." }
      : !isAbs(p.twitterImage)
      ? { id: "tw-image", tag: "twitter:image", level: "error", passed: false, detail: "Must be an absolute URL." }
      : { id: "tw-image", tag: "twitter:image", level: "info", passed: true, detail: trunc(p.twitterImage) },

    !p.twitterImageAlt
      ? { id: "tw-alt", tag: "twitter:image:alt", level: "warning", passed: false, detail: "Missing — add alt text for accessibility." }
      : { id: "tw-alt", tag: "twitter:image:alt", level: "info", passed: true, detail: `"${trunc(p.twitterImageAlt)}"` },
  ];
}

function LocalMetaChecker({ generatedHtmlSnippet }: { generatedHtmlSnippet: string }) {
  const [html, setHtml] = useState(generatedHtmlSnippet);
  const [userEdited, setUserEdited] = useState(false);

  useEffect(() => {
    if (!userEdited) setHtml(generatedHtmlSnippet);
  }, [generatedHtmlSnippet, userEdited]);

  const checks = useMemo(() => runHtmlMetaChecks(html), [html]);
  const total = checks.length;
  const passed = checks.filter((c) => c.passed).length;
  const critical = checks.filter((c) => !c.passed && c.level === "error").length;
  const warns = checks.filter((c) => !c.passed && c.level === "warning").length;
  const score = total ? Math.round((passed / total) * 100) : 0;
  const priorityFixes = checks.filter((c) => !c.passed && (c.level === "error" || c.level === "warning"));

  const scoreColor =
    score >= 80 ? "var(--color-success)" : score >= 50 ? "var(--color-warning)" : "var(--color-danger)";

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setHtml(await file.text());
    setUserEdited(true);
    event.target.value = "";
  }

  return (
    <PreviewTile title="Local HTML / Meta checker" meta={total ? `${score}/100` : undefined}>
      {/* score bar */}
      {total > 0 && (
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${score}%`, backgroundColor: scoreColor }} />
        </div>
      )}

      {/* stat chips */}
      {total > 0 && (
        <div className="mb-3 flex flex-wrap gap-3 text-[11px] font-semibold">
          <span className="text-[var(--color-success-text)]">✓ {passed}/{total} passed</span>
          {warns > 0 && <span className="text-[var(--color-warning-text)]">⚠ {warns} warning{warns !== 1 ? "s" : ""}</span>}
          {critical > 0 && <span className="text-[var(--color-danger-text)]">✕ {critical} critical</span>}
        </div>
      )}

      {/* toolbar */}
      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => { setHtml(generatedHtmlSnippet); setUserEdited(false); }}
        >
          Reset to generated snippet
        </Button>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-1.5 text-xs font-bold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)]">
          Upload HTML
          <input type="file" accept=".html,.htm,.txt,text/html,text/plain" className="sr-only" onChange={handleFile} />
        </label>
        {html.trim() && <CopyInlineButton value={html} label="Copy source" />}
      </div>

      {/* textarea */}
      <Textarea
        minRows={7}
        value={html}
        onChange={(event) => { setHtml(event.target.value); setUserEdited(true); }}
        placeholder={"Paste your full page HTML or just the <head> meta tags here.\nThe checker syncs with the generated snippet until you edit it."}
        className="font-mono text-xs"
      />

      {/* priority fixes */}
      {priorityFixes.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Priority fixes</p>
          <div className="grid gap-1.5">
            {priorityFixes.map((check) => (
              <div
                key={check.id}
                className={cn(
                  "flex items-start gap-2 rounded-[var(--radius-md)] border p-2.5",
                  check.level === "error"
                    ? "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]"
                    : "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)]",
                )}
              >
                {check.level === "error"
                  ? <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-danger-text)]" />
                  : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-warning-text)]" />}
                <div className="min-w-0">
                  <span className="font-mono text-[11px] font-bold text-[var(--color-text-primary)]">{check.tag}</span>
                  <span className="ml-2 text-[11px] text-[var(--color-text-secondary)]">{check.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* all checks grid */}
      {total > 0 && (
        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {checks.map((check) => (
            <div
              key={check.id}
              className={cn(
                "flex items-start gap-2 rounded-[var(--radius-md)] border p-2",
                check.passed
                  ? "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]"
                  : check.level === "error"
                  ? "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]"
                  : "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)]",
              )}
            >
              {check.passed
                ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-success-text)]" />
                : check.level === "error"
                ? <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-danger-text)]" />
                : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-warning-text)]" />}
              <div className="min-w-0">
                <p className="truncate font-mono text-[10px] font-bold text-[var(--color-text-primary)]">{check.tag}</p>
                <p className="break-all text-[10px] leading-4 text-[var(--color-text-secondary)]">{check.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PreviewTile>
  );
}

function PackageChecker() {
  const [issues, setIssues] = useState<OgWarning[]>([]);
  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setIssues(await validateExistingPackage(files));
    event.target.value = "";
  }
  return (
    <PreviewTile title="Local package checker" meta="files or ZIP">
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-4 text-sm font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]">
        <UploadCloud className="h-4 w-4" /> Upload exported files or ZIP
        <input type="file" multiple accept=".zip,image/png,text/plain,text/html,.ts,.md,.json" className="sr-only" onChange={handleFiles} />
      </label>
      <WarningPanel className="mt-3" messages={mapWarnings(issues)} />
    </PreviewTile>
  );
}

export default function OGImageGeneratorClient() {
  const [input, setInput] = useState<OgImageInput>(DEFAULT_OG_INPUT);
  const [assets, setAssets] = useState<OgGeneratedAsset[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("generating");
    setError("");
    generateOgAssets(input)
      .then((nextAssets) => {
        if (cancelled) {
          revokeOgAssetUrls(nextAssets);
          return;
        }
        setAssets((current) => {
          revokeOgAssetUrls(current);
          return nextAssets;
        });
        setStatus("ready");
      })
      .catch((generationError) => {
        if (cancelled) return;
        setAssets((current) => {
          revokeOgAssetUrls(current);
          return [];
        });
        setError(generationError instanceof Error ? generationError.message : "Unable to generate preview.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [input]);

  useEffect(() => () => revokeOgAssetUrls(assets), [assets]);

  const primaryPreview = assets.find((asset) => asset.filename.endsWith("opengraph-image.png") || asset.filename.endsWith("og-image.png") || asset.kind === "image")?.previewUrl;
  const htmlSnippet = useMemo(() => createHtmlMetaSnippet(input), [input]);
  const nextSnippet = useMemo(() => createNextMetadataSnippet(input), [input]);
  const inputWarnings = validateOgInput(input);
  const generatedWarnings = validateGeneratedAssets(assets);

  async function downloadZip() {
    const zip = await createZipArchive(assets);
    downloadBlobFile({ blob: zip, filename: `darma-og-image-${input.exportPack}.zip` });
  }

  function downloadPrimary() {
    if (!assets.length || status !== "ready") return;
    const primary = assets.find((asset) => asset.filename.endsWith("opengraph-image.png") || asset.filename.endsWith("og-image.png")) ?? assets.find((asset) => asset.kind === "image");
    if (primary) downloadBlobFile({ blob: primary.blob, filename: primary.filename.split("/").pop() ?? primary.filename });
  }

  const controls = (
    <div className="space-y-4">
      <QuickPresets setInput={setInput} />
      <ContentControls input={input} setInput={setInput} />
      <AssetControls input={input} setInput={setInput} uploadError={uploadError} setUploadError={setUploadError} />
      <DesignControls input={input} setInput={setInput} />
      <ExportControls input={input} setInput={setInput} />
      <WarningPanel title="Input checks" messages={mapWarnings(inputWarnings)} />
    </div>
  );

  const preview = (
    <div className="space-y-4">
      <MainPreview previewUrl={primaryPreview} status={status} input={input} />
      {error ? <WarningPanel messages={[{ id: "generation-error", severity: "danger", title: "Generation failed", message: error }]} /> : null}
      <PlatformPreview previewUrl={primaryPreview} input={input} />
      <ReadinessPanel input={input} assets={assets} />
      <GeneratedFiles assets={assets} />
      <WarningPanel title="Export self-check" messages={mapWarnings(generatedWarnings)} />
      <LocalMetaChecker generatedHtmlSnippet={htmlSnippet} />
      <PackageChecker />
    </div>
  );

  const code = (
    <CodeOutputPanel
      title="Install snippets"
      description="Copy HTML meta tags or Next.js metadata code after exporting the images."
      tabs={[
        { id: "html", label: "HTML", code: htmlSnippet, language: "html", filename: "html-meta-tags.txt" },
        { id: "next", label: "Next.js", code: nextSnippet, language: "ts", filename: "metadata-snippet.ts" },
      ]}
      actions={(
        <div className="flex flex-wrap gap-2">
          <CopyInlineButton value={htmlSnippet} label="Copy HTML" />
          <CopyInlineButton value={nextSnippet} label="Copy Next.js" />
          <CopyInlineButton value={input.siteUrl} label="Copy URL" />
        </div>
      )}
      onDownload={(tab) => downloadBlobFile({ blob: new Blob([tab.code], { type: "text/plain;charset=utf-8" }), filename: tab.filename ?? `${tab.id}.txt` })}
    />
  );

  const actions = (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs leading-5 text-[var(--color-text-secondary)]">
        Current pack: <strong className="text-[var(--color-text-primary)]">{EXPORT_PACKS.find((pack) => pack.id === input.exportPack)?.label}</strong> · {assets.length} files
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={downloadPrimary} disabled={!assets.length || status !== "ready"}>Download PNG</Button>
        <Button variant="primary" leftIcon={<FileArchive className="h-4 w-4" />} onClick={downloadZip} disabled={!assets.length || status !== "ready"}>Download ZIP</Button>
      </div>
    </div>
  );

  return <ToolLayoutVisualGenerator previewSlot={preview} controlsSlot={controls} codeSlot={code} actionsSlot={actions} />;
}
