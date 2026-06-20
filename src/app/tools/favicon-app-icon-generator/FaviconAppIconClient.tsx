"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Copy, Download, FileArchive, FileCheck2, ImageIcon, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { CodeOutputPanel, ColorField, CompactField, ControlSection, SegmentedControl, SliderNumberField, WarningPanel, type WarningMessage } from "@/features/tools/components";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { cn } from "@/lib/cn";
import { fileToDataUrl, isSafeSvgMarkup, readSourceImageMeta } from "./canvas";
import { generateFaviconAssets, revokeGeneratedAssetUrls } from "./generator";
import { createManifest, manifestToJson } from "./manifest";
import { DEFAULT_FAVICON_INPUT, DISPLAY_MODE_OPTIONS, EXPORT_PACKS, FAVICON_QUICK_PRESETS, FONT_OPTIONS, MAX_UPLOAD_BYTES, ORIENTATION_OPTIONS, SHAPE_OPTIONS, SOURCE_MODE_OPTIONS } from "./presets";
import { createHtmlHeadSnippet, createInstallReadme, createNextJsSnippet } from "./snippets";
import type { ExportPackId, FaviconInput, FaviconSourceMode, FileValidationIssue, GeneratedAsset, IconShape } from "./types";
import { createReadinessChecks, scoreReadiness, validateExistingFiles, validateFaviconInput, validateGeneratedAssets } from "./validation";
import { createZipArchive } from "./zip";

type Status = "idle" | "generating" | "ready" | "error";

function formatBytes(bytes?: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function updateInput(setInput: React.Dispatch<React.SetStateAction<FaviconInput>>, patch: Partial<FaviconInput>) {
  setInput((current) => ({ ...current, ...patch }));
}

function FieldGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-3 sm:grid-cols-2", className)}>{children}</div>;
}

function MiniLabel({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{children}</span>;
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <Button size="sm" variant="ghost" leftIcon={<Copy className="h-3.5 w-3.5" />} onClick={copyValue}>
      {copied ? "Copied" : label}
    </Button>
  );
}

function QuickStartPresets({ setInput }: { setInput: React.Dispatch<React.SetStateAction<FaviconInput>> }) {
  return (
    <ControlSection title="Quick setup presets" description="Pick the target platform first, then fine-tune the design below.">
      <div className="grid gap-2">
        {FAVICON_QUICK_PRESETS.map((preset) => (
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

function LegibilityStrip({ assets }: { assets: GeneratedAsset[] }) {
  const previews = [
    { label: "16", asset: assets.find((asset) => asset.filename.endsWith("favicon-16x16.png")) },
    { label: "32", asset: assets.find((asset) => asset.filename.endsWith("favicon-32x32.png")) },
    { label: "48", asset: assets.find((asset) => asset.filename.endsWith("favicon-48x48.png") || asset.filename.endsWith("icon-48x48.png")) },
    { label: "180", asset: assets.find((asset) => asset.filename.endsWith("apple-touch-icon.png") || asset.filename.endsWith("apple-touch-icon-180x180.png") || asset.filename.endsWith("apple-icon.png")) },
    { label: "512", asset: assets.find((asset) => asset.filename.endsWith("android-chrome-512x512.png") || asset.filename.endsWith("icon-512x512.png") || asset.filename.endsWith("src/app/icon.png")) },
  ];

  return (
    <PreviewTile title="Small-size legibility" meta="real output sizes">
      <div className="grid gap-3 sm:grid-cols-5">
        {previews.map((item) => (
          <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-center">
            <div className="grid min-h-16 place-items-center rounded-[var(--radius-sm)] bg-white shadow-[var(--shadow-xs)] dark:bg-slate-950">
              {item.asset?.previewUrl ? <img src={item.asset.previewUrl} alt={`${item.label}px preview`} style={{ width: `${Math.min(Number(item.label), 48)}px`, height: `${Math.min(Number(item.label), 48)}px` }} /> : <span className="h-5 w-5 rounded bg-[var(--color-border-default)]" />}
            </div>
            <div className="mt-2 font-mono text-[10px] font-bold text-[var(--color-text-tertiary)]">{item.label}px</div>
          </div>
        ))}
      </div>
    </PreviewTile>
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

function SafeAreaIconPreview({ previewUrl, backgroundColor }: { previewUrl?: string; backgroundColor: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: "Circle", className: "rounded-full" },
        { label: "Rounded", className: "rounded-[26%]" },
        { label: "Squircle", className: "rounded-[34%]" },
        { label: "Teardrop", className: "rounded-[50%_50%_50%_12%] rotate-[-8deg]" },
      ].map((mask) => (
        <div key={mask.label} className="space-y-2 text-center">
          <div className={cn("relative mx-auto grid h-20 w-20 place-items-center overflow-hidden border border-[var(--color-border-default)] shadow-[var(--shadow-md)]", mask.className)} style={{ backgroundColor }}>
            {previewUrl ? <img src={previewUrl} alt="Maskable icon preview" className="h-full w-full object-cover" /> : null}
            <div className="pointer-events-none absolute inset-[10%] rounded-full border border-dashed border-white/70 mix-blend-difference" />
          </div>
          <div className="text-[11px] font-semibold text-[var(--color-text-secondary)]">{mask.label}</div>
        </div>
      ))}
    </div>
  );
}

function SourceControls({ input, setInput, uploadError, setUploadError }: { input: FaviconInput; setInput: React.Dispatch<React.SetStateAction<FaviconInput>>; uploadError: string; setUploadError: (value: string) => void }) {
  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError("");

    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("Please choose an image below 8 MB.");
      return;
    }

    try {
      if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
        const svg = await file.text();
        updateInput(setInput, { sourceMode: "svg", svgText: svg, imageDataUrl: "", imageMeta: null });
        return;
      }
      const dataUrl = await fileToDataUrl(file);
      const imageMeta = await readSourceImageMeta(dataUrl, file);
      updateInput(setInput, { sourceMode: "image", imageDataUrl: dataUrl, imageMeta });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Unable to load that image.");
    }
  }

  return (
    <ControlSection title="Start from" description="Upload artwork, paste SVG, type initials, or generate from emoji.">
      <SegmentedControl<FaviconSourceMode>
        ariaLabel="Favicon source mode"
        fullWidth
        size="md"
        value={input.sourceMode}
        onChange={(sourceMode) => updateInput(setInput, { sourceMode })}
        options={SOURCE_MODE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
      />

      {input.sourceMode === "image" ? (
        <div className="space-y-3">
          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-4 text-center transition hover:border-[var(--color-primary)] hover:bg-[var(--color-control-hover)]">
            <UploadCloud className="h-7 w-7 text-[var(--color-primary)]" />
            <span className="text-sm font-bold text-[var(--color-text-primary)]">Upload PNG, JPG, WebP, or SVG</span>
            <span className="text-xs leading-5 text-[var(--color-text-tertiary)]">Best result: square 512×512 or larger logo.</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={handleImageUpload} />
          </label>
          {uploadError ? <p className="text-xs font-semibold text-[var(--color-danger-text)]">{uploadError}</p> : null}
          {input.imageMeta ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
              <strong>{input.imageMeta.name ?? "Image"}</strong> · {input.imageMeta.width}×{input.imageMeta.height} · {input.imageMeta.type || "image"}
            </div>
          ) : null}
        </div>
      ) : null}

      {input.sourceMode === "svg" ? (
        <CompactField label="SVG markup" hint="Scripts and inline event handlers are rejected before rendering.">
          <Textarea
            variant="editor"
            minRows={8}
            value={input.svgText}
            aria-invalid={Boolean(input.svgText.trim()) && !isSafeSvgMarkup(input.svgText)}
            onChange={(event) => updateInput(setInput, { svgText: event.target.value })}
            spellCheck={false}
          />
          {input.svgText.trim() && !isSafeSvgMarkup(input.svgText) ? (
            <p className="text-xs font-semibold text-[var(--color-danger-text)]">SVG must start with &lt;svg and cannot include scripts, javascript: URLs, or inline event handlers.</p>
          ) : null}
        </CompactField>
      ) : null}

      {input.sourceMode === "text" ? (
        <FieldGroup>
          <CompactField label="Initials/text">
            <Input value={input.text} maxLength={4} onChange={(event) => updateInput(setInput, { text: event.target.value })} />
          </CompactField>
          <CompactField label="Font">
            <Select value={input.fontFamily} onChange={(event) => updateInput(setInput, { fontFamily: event.target.value })}>
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </Select>
          </CompactField>
          <CompactField label="Weight">
            <Select value={String(input.fontWeight)} onChange={(event) => updateInput(setInput, { fontWeight: Number(event.target.value) })}>
              <option value="500">Medium</option>
              <option value="600">Semi bold</option>
              <option value="700">Bold</option>
              <option value="800">Extra bold</option>
              <option value="900">Black</option>
            </Select>
          </CompactField>
        </FieldGroup>
      ) : null}

      {input.sourceMode === "emoji" ? (
        <CompactField label="Emoji" hint="Use one emoji for the clearest small icon.">
          <Input value={input.emoji} maxLength={4} onChange={(event) => updateInput(setInput, { emoji: event.target.value })} className="text-xl" />
        </CompactField>
      ) : null}
    </ControlSection>
  );
}

function DesignControls({ input, setInput }: { input: FaviconInput; setInput: React.Dispatch<React.SetStateAction<FaviconInput>> }) {
  return (
    <ControlSection title="Icon design" description="Tune the artwork before generating every icon size.">
      <FieldGroup>
        <ColorField label="Background" value={input.backgroundColor} disabled={input.transparentBackground} onChange={(backgroundColor) => updateInput(setInput, { backgroundColor })} />
        <ColorField label="Foreground" value={input.foregroundColor} onChange={(foregroundColor) => updateInput(setInput, { foregroundColor })} />
      </FieldGroup>

      <label className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-sm shadow-[var(--shadow-xs)]">
        <input type="checkbox" checked={input.transparentBackground} onChange={(event) => updateInput(setInput, { transparentBackground: event.target.checked })} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
        <span className="space-y-1">
          <span className="block font-semibold text-[var(--color-text-primary)]">Transparent background</span>
          <span className="block text-xs leading-5 text-[var(--color-text-tertiary)]">Useful for some web favicons, less predictable for mobile/PWA icons.</span>
        </span>
      </label>

      <SliderNumberField label="Padding" value={input.padding} min={0} max={45} unit="%" onChange={(padding) => updateInput(setInput, { padding })} />
      <SliderNumberField label="Scale" value={input.scale} min={50} max={150} unit="%" onChange={(scale) => updateInput(setInput, { scale })} />
      <SliderNumberField label="Border radius" value={input.borderRadius} min={0} max={50} unit="%" disabled={input.shape === "circle" || input.shape === "squircle"} onChange={(borderRadius) => updateInput(setInput, { borderRadius })} />

      <FieldGroup>
        <CompactField label="Shape">
          <Select value={input.shape} onChange={(event) => updateInput(setInput, { shape: event.target.value as IconShape })}>
            {SHAPE_OPTIONS.map((shape) => <option key={shape.value} value={shape.value}>{shape.label}</option>)}
          </Select>
        </CompactField>
        <CompactField label="Crop mode">
          <Select value={input.cropMode} onChange={(event) => updateInput(setInput, { cropMode: event.target.value as FaviconInput["cropMode"] })}>
            <option value="contain">Contain</option>
            <option value="cover">Cover</option>
          </Select>
        </CompactField>
      </FieldGroup>
    </ControlSection>
  );
}

function AppSettingsControls({ input, setInput }: { input: FaviconInput; setInput: React.Dispatch<React.SetStateAction<FaviconInput>> }) {
  return (
    <ControlSection title="Web app settings" description="Used in the manifest, install snippets, and previews.">
      <FieldGroup>
        <CompactField label="Site name">
          <Input value={input.siteName} onChange={(event) => updateInput(setInput, { siteName: event.target.value })} />
        </CompactField>
        <CompactField label="Short name">
          <Input value={input.shortName} maxLength={18} onChange={(event) => updateInput(setInput, { shortName: event.target.value })} />
        </CompactField>
      </FieldGroup>

      <FieldGroup>
        <ColorField label="Theme color" value={input.themeColor} onChange={(themeColor) => updateInput(setInput, { themeColor })} />
        <ColorField label="Manifest bg" value={input.manifestBackgroundColor} onChange={(manifestBackgroundColor) => updateInput(setInput, { manifestBackgroundColor })} />
      </FieldGroup>

      <FieldGroup>
        <CompactField label="Display mode">
          <Select value={input.display} onChange={(event) => updateInput(setInput, { display: event.target.value as FaviconInput["display"] })}>
            {DISPLAY_MODE_OPTIONS.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
          </Select>
        </CompactField>
        <CompactField label="Orientation">
          <Select value={input.orientation} onChange={(event) => updateInput(setInput, { orientation: event.target.value as FaviconInput["orientation"] })}>
            {ORIENTATION_OPTIONS.map((orientation) => <option key={orientation.value} value={orientation.value}>{orientation.label}</option>)}
          </Select>
        </CompactField>
      </FieldGroup>

      <CompactField label="Path prefix" hint="Examples: /, /icons/, /assets/favicons/">
        <Input value={input.pathPrefix} onChange={(event) => updateInput(setInput, { pathPrefix: event.target.value })} />
      </CompactField>
    </ControlSection>
  );
}

function ExportControls({ input, setInput }: { input: FaviconInput; setInput: React.Dispatch<React.SetStateAction<FaviconInput>> }) {
  return (
    <ControlSection title="Export pack" description="Choose the package structure you want to download.">
      <div className="grid gap-2">
        {EXPORT_PACKS.map((pack) => {
          const active = input.exportPack === pack.id;
          return (
            <button
              key={pack.id}
              type="button"
              onClick={() => updateInput(setInput, { exportPack: pack.id })}
              className={cn(
                "rounded-[var(--radius-md)] border p-3 text-left transition",
                active ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-text-primary)]" : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]",
              )}
            >
              <span className="block text-sm font-bold text-[var(--color-text-primary)]">{pack.title}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">{pack.description}</span>
            </button>
          );
        })}
      </div>
      <div className="grid gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
          <input type="checkbox" checked={input.includeMaskable} onChange={(event) => updateInput(setInput, { includeMaskable: event.target.checked })} className="h-4 w-4 accent-[var(--color-primary)]" />
          Include maskable icons
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
          <input type="checkbox" checked={input.includeMonochrome} onChange={(event) => updateInput(setInput, { includeMonochrome: event.target.checked })} className="h-4 w-4 accent-[var(--color-primary)]" />
          Include monochrome icon
        </label>
      </div>
    </ControlSection>
  );
}

function PreviewPanel({ input, assets, status, error }: { input: FaviconInput; assets: GeneratedAsset[]; status: Status; error: string }) {
  const icon512 = assets.find((asset) => asset.filename.endsWith("android-chrome-512x512.png") || asset.filename.endsWith("icon-512x512.png") || asset.filename.endsWith("src/app/icon.png"));
  const icon32 = assets.find((asset) => asset.filename.endsWith("favicon-32x32.png"));
  const apple = assets.find((asset) => asset.filename.endsWith("apple-touch-icon.png") || asset.filename.endsWith("apple-icon.png"));
  const maskable = assets.find((asset) => asset.filename.includes("maskable") && asset.filename.includes("512"));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[radial-gradient(circle_at_top_left,var(--color-primary-soft),transparent_38%),var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Favicon & App Icon Studio</h2>
            <span className="rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[var(--color-text-tertiary)]">Client-only</span>
          </div>
          <p className="text-xs leading-5 text-[var(--color-text-secondary)]">Generate, preview, score, validate, and export full favicon packages without uploading files.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-3 py-2 text-xs font-bold text-[var(--color-text-secondary)]">
          {status === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : status === "ready" ? <CheckCircle2 className="h-4 w-4 text-[var(--color-success-text)]" /> : <AlertTriangle className="h-4 w-4 text-[var(--color-warning-text)]" />}
          {status === "generating" ? "Generating" : status === "ready" ? `${assets.length} files ready` : "Needs input"}
        </div>
      </div>

      {error ? <div className="rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-3 text-sm font-semibold text-[var(--color-danger-text)]">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <PreviewTile title="Large icon" meta="512×512">
          <div className="grid min-h-72 place-items-center rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[linear-gradient(45deg,rgba(148,163,184,0.15)_25%,transparent_25%),linear-gradient(-45deg,rgba(148,163,184,0.15)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,rgba(148,163,184,0.15)_75%),linear-gradient(-45deg,transparent_75%,rgba(148,163,184,0.15)_75%)] bg-[length:22px_22px] bg-[position:0_0,0_11px,11px_-11px,-11px_0] p-6">
            {icon512?.previewUrl ? <img src={icon512.previewUrl} alt="Generated icon preview" className="h-48 w-48 rounded-[24%] object-cover shadow-[0_28px_80px_rgba(15,23,42,0.22)]" /> : <ImageIcon className="h-16 w-16 text-[var(--color-text-tertiary)]" />}
          </div>
        </PreviewTile>

        <div className="space-y-4">
          <PreviewTile title="Browser tab">
            <div className="flex items-center gap-2 rounded-t-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-2">
              {icon32?.previewUrl ? <img src={icon32.previewUrl} alt="Tab favicon" className="h-4 w-4" /> : <span className="h-4 w-4 rounded-sm bg-[var(--color-border-default)]" />}
              <span className="truncate text-xs font-semibold text-[var(--color-text-secondary)]">{input.siteName || "My Website"}</span>
            </div>
            <div className="rounded-b-[var(--radius-md)] border-x border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 text-[11px] text-[var(--color-text-tertiary)]">https://example.com</div>
          </PreviewTile>

          <PreviewTile title="Google result">
            <div className="space-y-2 rounded-[var(--radius-md)] bg-white p-3 text-slate-900 shadow-[var(--shadow-xs)] dark:bg-slate-950 dark:text-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                {icon32?.previewUrl ? <img src={icon32.previewUrl} alt="Search favicon" className="h-5 w-5 rounded-full" /> : null}
                <span>{input.siteName || "My Website"}</span>
              </div>
              <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">{input.siteName || "My Website"} - useful tools</div>
              <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">A search preview to make sure the small icon has enough contrast and simple detail.</p>
            </div>
          </PreviewTile>
        </div>
      </div>

      <LegibilityStrip assets={assets} />

      <div className="grid gap-4 lg:grid-cols-2">
        <PreviewTile title="iOS home screen" meta="Apple touch icon">
          <div className="grid grid-cols-[5rem_1fr] items-center gap-4 rounded-[var(--radius-lg)] bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-white">
            {apple?.previewUrl ? <img src={apple.previewUrl} alt="Apple touch icon preview" className="h-20 w-20 rounded-[22%] shadow-2xl" /> : <span className="h-20 w-20 rounded-[22%] bg-white/20" />}
            <div>
              <div className="text-sm font-bold">{input.shortName || input.siteName || "App"}</div>
              <div className="mt-1 text-xs leading-5 text-white/70">Home screen shortcut preview</div>
            </div>
          </div>
        </PreviewTile>

        <PreviewTile title="Maskable safe-area" meta="Phase 3">
          <SafeAreaIconPreview previewUrl={maskable?.previewUrl || icon512?.previewUrl} backgroundColor={input.manifestBackgroundColor} />
        </PreviewTile>
      </div>
    </div>
  );
}

function FileChecklist({ assets }: { assets: GeneratedAsset[] }) {
  const groups = useMemo(() => {
    const image = assets.filter((asset) => asset.kind === "image");
    const code = assets.filter((asset) => asset.kind !== "image");
    return { image, code };
  }, [assets]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
        <h3 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Generated image files</h3>
        <div className="max-h-80 space-y-2 overflow-auto pr-1">
          {groups.image.map((asset) => (
            <div key={asset.filename} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-3 py-2">
              <div className="min-w-0">
                <div className="truncate font-mono text-xs font-bold text-[var(--color-text-primary)]">{asset.filename}</div>
                <div className="text-[11px] text-[var(--color-text-tertiary)]">{asset.width ? `${asset.width}×${asset.height}` : "ICO"} · {formatBytes(asset.size)}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => downloadBlobFile({ blob: asset.blob, filename: asset.filename })}>Download</Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
        <h3 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Generated docs & snippets</h3>
        <div className="max-h-80 space-y-2 overflow-auto pr-1">
          {groups.code.map((asset) => (
            <div key={asset.filename} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-3 py-2">
              <div className="min-w-0">
                <div className="truncate font-mono text-xs font-bold text-[var(--color-text-primary)]">{asset.filename}</div>
                <div className="text-[11px] text-[var(--color-text-tertiary)]">{asset.mimeType} · {formatBytes(asset.size)}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => downloadBlobFile({ blob: asset.blob, filename: asset.filename })}>Download</Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReadinessPanel({ input, assets }: { input: FaviconInput; assets: GeneratedAsset[] }) {
  const checks = useMemo(() => createReadinessChecks(input, assets), [input, assets]);
  const score = scoreReadiness(checks);

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-black text-[var(--color-text-primary)]">Icon readiness score</h3>
          <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">Phase 3 scoring for browser, search, Apple, PWA, maskable, and setup readiness.</p>
        </div>
        <div className="rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-4 py-2 font-mono text-lg font-black text-[var(--color-text-primary)]">{score}/100</div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((check) => (
          <div key={check.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3">
            <div className="flex items-center gap-2">
              {check.passed ? <CheckCircle2 className="h-4 w-4 text-[var(--color-success-text)]" /> : <AlertTriangle className="h-4 w-4 text-[var(--color-warning-text)]" />}
              <span className="text-xs font-bold text-[var(--color-text-primary)]">{check.label}</span>
              <span className="ml-auto font-mono text-[10px] text-[var(--color-text-tertiary)]">{check.points}/{check.maxPoints}</span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[var(--color-text-secondary)]">{check.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


function GeneratedSelfCheckPanel({ input, assets }: { input: FaviconInput; assets: GeneratedAsset[] }) {
  const issues = useMemo(() => validateGeneratedAssets(input, assets), [input, assets]);
  const messages: WarningMessage[] = issues.map((issue) => ({
    id: issue.id,
    severity: issue.level === "error" ? "danger" : issue.level,
    title: issue.title,
    message: issue.message,
  }));
  const failedCount = issues.filter((issue) => issue.level === "error" || issue.level === "warning").length;

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-black text-[var(--color-text-primary)]">Generated package self-check</h3>
          <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">Checks the current generated assets before you download the ZIP: manifest references, snippet paths, duplicates, and pack structure.</p>
        </div>
        <div className={cn(
          "rounded-[var(--radius-full)] border px-3 py-1.5 font-mono text-xs font-black uppercase",
          failedCount ? "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]" : "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
        )}>
          {failedCount ? `${failedCount} item${failedCount === 1 ? "" : "s"} to review` : "Package clean"}
        </div>
      </div>
      <WarningPanel messages={messages} />
    </section>
  );
}

function installStepsForPack(input: FaviconInput): Array<{ title: string; detail: string; copy?: string }> {
  if (input.exportPack === "nextjs") {
    return [
      { title: "Copy App Router icons", detail: "Place the generated favicon.ico, icon.png, and apple-icon.png inside src/app/.", copy: `src/app/favicon.ico\nsrc/app/icon.png\nsrc/app/apple-icon.png` },
      { title: "Copy manifest", detail: "Move public/site.webmanifest into your public folder.", copy: "public/site.webmanifest" },
      { title: "Do not duplicate app icon links", detail: "Next.js adds app/favicon.ico, app/icon.png, and app/apple-icon.png metadata automatically. Only link the manifest manually when needed." },
      { title: "Run a production build", detail: "Check the generated metadata and inspect the browser tab, mobile shortcut, and manifest URL after deployment." },
    ];
  }

  if (input.exportPack === "pwa") {
    return [
      { title: "Upload the icons folder", detail: "Keep the generated icons folder structure unchanged so manifest paths continue to work.", copy: "public/icons/" },
      { title: "Link the manifest", detail: "Add the generated manifest.webmanifest link to your HTML head.", copy: '<link rel="manifest" href="/manifest.webmanifest">' },
      { title: "Verify install prompt", detail: "Open DevTools Application > Manifest and confirm 192×192, 512×512, and maskable icons are detected." },
      { title: "Check safe area", detail: "Use the maskable preview and keep important artwork inside the dashed center safe zone." },
    ];
  }

  if (input.exportPack === "legacy") {
    return [
      { title: "Upload root favicon files", detail: "Place favicon.ico and PNG fallbacks at your configured path prefix.", copy: input.pathPrefix },
      { title: "Add Apple links", detail: "Use the generated HTML snippet for Apple touch icons and common browser fallbacks." },
      { title: "Optional Windows tile", detail: "Upload browserconfig.xml and mstile-150x150.png when you still support older Microsoft tile integrations." },
      { title: "Clear favicon cache", detail: "Browsers aggressively cache favicons, so test in a new profile or with a cache-busting deploy." },
    ];
  }

  return [
    { title: "Upload generated files", detail: "Copy favicon.ico, PNG icons, site.webmanifest, and snippets to your website/public asset folder.", copy: input.pathPrefix },
    { title: "Paste HTML snippet", detail: "Add the generated HTML head snippet to your document head, layout, or template." },
    { title: "Verify manifest paths", detail: "Open site.webmanifest in the browser and confirm every icon src returns a real PNG file." },
    { title: "Test real surfaces", detail: "Check browser tab, Google/search preview, iOS shortcut, Android/PWA install, and dark/light backgrounds." },
  ];
}

function InstallChecklistPanel({ input, assets }: { input: FaviconInput; assets: GeneratedAsset[] }) {
  const selectedPack = EXPORT_PACKS.find((pack) => pack.id === input.exportPack);
  const imageCount = assets.filter((asset) => asset.kind === "image").length;
  const docsCount = assets.length - imageCount;
  const totalSize = assets.reduce((sum, asset) => sum + (asset.size ?? asset.blob.size), 0);
  const steps = installStepsForPack(input);

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-black text-[var(--color-text-primary)]">Install assistant</h3>
          <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">A handoff checklist for the selected export pack so users know exactly where files should go.</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-3 py-2 text-right text-xs text-[var(--color-text-secondary)]">
          <div className="font-bold text-[var(--color-text-primary)]">{selectedPack?.title ?? input.exportPack}</div>
          <div>{assets.length} files · {imageCount} images · {docsCount} docs · {formatBytes(totalSize)}</div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {steps.map((step, index) => (
          <div key={`${step.title}-${index}`} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3">
            <div className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--radius-full)] bg-[var(--color-primary-soft)] font-mono text-xs font-black text-[var(--color-primary)]">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-[var(--color-text-primary)]">{step.title}</div>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{step.detail}</p>
                {step.copy ? (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-2 py-1.5">
                    <code className="min-w-0 whitespace-pre-wrap break-all font-mono text-[11px] text-[var(--color-text-secondary)]">{step.copy}</code>
                    <CopyButton value={step.copy} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ValidatorPanel() {
  const [issues, setIssues] = useState<FileValidationIssue[]>([]);
  const [checking, setChecking] = useState(false);

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setChecking(true);
    try {
      setIssues(await validateExistingFiles(files));
    } finally {
      setChecking(false);
    }
  }

  const messages: WarningMessage[] = issues.map((issue) => ({
    id: issue.id,
    severity: issue.level === "error" ? "danger" : issue.level,
    title: issue.title,
    message: issue.message,
  }));

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-black text-[var(--color-text-primary)]">Existing favicon package checker</h3>
          <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">Phase 4 local checker: upload extracted files or a ZIP to inspect common favicon and manifest gaps.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-3 py-2 text-xs font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] hover:bg-[var(--color-surface-subtle)]">
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
          Upload files / ZIP
          <input type="file" multiple accept=".ico,.png,.svg,.json,.webmanifest,.xml,.txt,.md,.zip" className="sr-only" onChange={handleFiles} />
        </label>
      </div>
      {messages.length ? <WarningPanel messages={messages} /> : <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] p-5 text-center text-sm text-[var(--color-text-tertiary)]">Upload a favicon package to check filenames, manifest JSON, PWA icon sizes, Apple icons, and maskable support.</div>}
    </section>
  );
}

export default function FaviconAppIconClient() {
  const [input, setInput] = useState<FaviconInput>(DEFAULT_FAVICON_INPUT);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [generationError, setGenerationError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const warnings = useMemo(() => validateFaviconInput(input), [input]);
  const hasBlockingError = warnings.some((warning) => warning.level === "error");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (hasBlockingError) {
        setStatus("error");
        setGenerationError("Fix the highlighted errors before generating the icon pack.");
        setAssets((previous) => {
          revokeGeneratedAssetUrls(previous);
          return [];
        });
        return;
      }

      setStatus("generating");
      setGenerationError("");

      try {
        const generated = await generateFaviconAssets(input, input.exportPack);
        if (cancelled) {
          revokeGeneratedAssetUrls(generated);
          return;
        }
        setAssets((previous) => {
          revokeGeneratedAssetUrls(previous);
          return generated;
        });
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setGenerationError(error instanceof Error ? error.message : "Could not generate the icon pack.");
        setAssets((previous) => {
          revokeGeneratedAssetUrls(previous);
          return [];
        });
      }
    }

    const timeout = window.setTimeout(() => void run(), 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [input, hasBlockingError]);

  useEffect(() => () => revokeGeneratedAssetUrls(assets), [assets]);

  const warningMessages: WarningMessage[] = warnings.length
    ? warnings.map((warning) => ({
        id: warning.id,
        severity: warning.level === "error" ? "danger" : warning.level,
        title: warning.title,
        message: warning.message,
      }))
    : [{ id: "ready", severity: "success", title: "Looks ready", message: "The current icon settings are valid and ready to export." }];

  const snippets = useMemo(() => [
    { id: "html", label: "HTML", language: "html", filename: "html-head-snippet.txt", code: createHtmlHeadSnippet(input) },
    { id: "manifest", label: "Manifest", language: "json", filename: "site.webmanifest", code: manifestToJson(createManifest(input)) },
    { id: "next", label: "Next.js", language: "txt", filename: "nextjs-app-router-snippet.txt", code: createNextJsSnippet(input) },
    { id: "readme", label: "README", language: "md", filename: "README.md", code: createInstallReadme(input) },
  ], [input]);

  async function downloadZip() {
    if (!assets.length) return;
    const zip = await createZipArchive(assets);
    downloadBlobFile({ blob: zip, filename: `darma-favicon-${input.exportPack}-pack.zip` });
  }

  return (
    <ToolLayoutVisualGenerator
      previewSlot={<PreviewPanel input={input} assets={assets} status={status} error={generationError} />}
      controlsSlot={
        <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-sm)]">
          <QuickStartPresets setInput={setInput} />
          <SourceControls input={input} setInput={setInput} uploadError={uploadError} setUploadError={setUploadError} />
          <DesignControls input={input} setInput={setInput} />
          <AppSettingsControls input={input} setInput={setInput} />
          <ExportControls input={input} setInput={setInput} />
        </div>
      }
      actionsSlot={
        <>
          <div className="flex min-w-0 items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
            <FileArchive className="h-4 w-4" />
            <span>{assets.length ? `${assets.length} files in ${EXPORT_PACKS.find((pack) => pack.id === input.exportPack)?.title ?? input.exportPack}` : "No files generated yet"}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} disabled={!assets.length || status === "generating"} onClick={downloadZip}>Download ZIP</Button>
            <Button variant="ghost" onClick={() => setInput(DEFAULT_FAVICON_INPUT)}>Reset</Button>
          </div>
        </>
      }
      codeSlot={
        <div className="space-y-5">
          <CodeOutputPanel
            title="Generated install code"
            description="Copy snippets for a standard HTML site, manifest, or Next.js App Router setup."
            tabs={snippets}
            defaultTab="html"
            onDownload={(tab) => downloadBlobFile({ blob: new Blob([tab.code], { type: "text/plain;charset=utf-8" }), filename: tab.filename ?? `${tab.id}.txt` })}
          />
          <FileChecklist assets={assets} />
          <InstallChecklistPanel input={input} assets={assets} />
          <ReadinessPanel input={input} assets={assets} />
          <GeneratedSelfCheckPanel input={input} assets={assets} />
          <ValidatorPanel />
        </div>
      }
      presetsSlot={<WarningPanel title="Readiness warnings" messages={warningMessages} />}
    />
  );
}
