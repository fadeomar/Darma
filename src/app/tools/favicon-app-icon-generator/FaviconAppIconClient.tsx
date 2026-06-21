"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import type { Theme as EmojiPickerTheme } from "emoji-picker-react";
import { AlertTriangle, CheckCircle2, Copy, Download, FileArchive, FileCheck2, ImageIcon, Loader2, UploadCloud } from "lucide-react";
import { ActionBar, Button, Input, Select, Textarea } from "@/components/ui";
import { CodeOutputPanel, ColorField, CompactField, ControlSection, SegmentedControl, SliderNumberField, WarningPanel, type WarningMessage } from "@/features/tools/components";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { cn } from "@/lib/cn";
import { fileToDataUrl, isSafeSvgMarkup, readSourceImageMeta, svgToDataUrl, trimTransparentImageDataUrl } from "./canvas";
import { generateFaviconAssets, revokeGeneratedAssetUrls } from "./generator";
import { DEFAULT_FAVICON_INPUT, DISPLAY_MODE_OPTIONS, EXPORT_PACKS, FAVICON_QUICK_PRESETS, FONT_OPTIONS, MAX_UPLOAD_BYTES, ORIENTATION_OPTIONS, PROJECT_PROFILES, SHAPE_OPTIONS, SOURCE_MODE_OPTIONS } from "./presets";
import { createHtmlHeadSnippet, createInstallReadme, createManifestSnippet, createProjectInstallSnippet } from "./snippets";
import type { ExportPackId, FaviconInput, FaviconSourceMode, FileValidationIssue, GeneratedAsset, IconShape, ProjectProfileId, QualityIssueActionId, QualityIssueSeverity, ReadinessCategory, SmartQualityIssue } from "./types";
import { bestReadableColor, createReadinessChecks, createSmartQualityIssues, scoreReadiness, validateExistingFiles, validateFaviconInput, validateGeneratedAssets, validateHtmlHeadText, validateManifestText, validateWebsiteUrlInput } from "./validation";
import { createZipArchive } from "./zip";

type Status = "idle" | "generating" | "ready" | "error";
type PreviewMode = "essential" | "platform" | "advanced";

const DEFAULT_SOURCE_TRANSFORM: FaviconInput["sourceTransform"] = { zoom: 100, offsetX: 0, offsetY: 0, rotation: 0, fitMode: "contain" };

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

function formatBytes(bytes?: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function updateInput(setInput: React.Dispatch<React.SetStateAction<FaviconInput>>, patch: Partial<FaviconInput>) {
  setInput((current) => ({ ...current, ...patch }));
}

function updateSourceTransform(setInput: React.Dispatch<React.SetStateAction<FaviconInput>>, patch: Partial<FaviconInput["sourceTransform"]>) {
  setInput((current) => {
    const nextTransform = { ...DEFAULT_SOURCE_TRANSFORM, ...(current.sourceTransform ?? { fitMode: current.cropMode }), ...patch };
    return { ...current, cropMode: nextTransform.fitMode, sourceTransform: nextTransform };
  });
}

function resetSourceTransform(setInput: React.Dispatch<React.SetStateAction<FaviconInput>>) {
  setInput((current) => ({ ...current, cropMode: "contain", sourceTransform: DEFAULT_SOURCE_TRANSFORM }));
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
  const [showAll, setShowAll] = useState(false);
  const visiblePresets = showAll ? FAVICON_QUICK_PRESETS : FAVICON_QUICK_PRESETS.slice(0, 4);
  const badges: Record<string, string> = { "website-launch": "Minimal", "nextjs-app": "Next.js", "installable-pwa": "PWA", "ios-heavy": "iOS", "brand-kit": "Brand" };

  return (
    <ControlSection title="Quick setup" description="Apply a sensible platform preset, then fine-tune it.">
      <div className="grid grid-cols-2 gap-2">
        {visiblePresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setInput((current) => ({ ...current, ...preset.patch }))}
            className="group rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-2.5 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
          >
            <span className="flex flex-wrap items-start justify-between gap-2 text-xs font-bold text-[var(--color-text-primary)]">
              <span>{preset.title}</span>
              <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--color-primary)]">{badges[preset.id]}</span>
            </span>
            <span className="mt-1 line-clamp-2 block text-[11px] leading-4 text-[var(--color-text-secondary)]">{preset.description}</span>
          </button>
        ))}
      </div>
      {FAVICON_QUICK_PRESETS.length > 4 ? (
        <button type="button" className="text-xs font-bold text-[var(--color-primary)] hover:underline" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Show less" : "Show more presets"}
        </button>
      ) : null}
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
  const masks = [
    { label: "Circle", className: "rounded-full" },
    { label: "Squircle", className: "rounded-[34%]" },
    { label: "Rounded square", className: "rounded-[24%]" },
    { label: "Teardrop", className: "rounded-[50%_50%_50%_12%] rotate-[-8deg]" },
    { label: "Android adaptive", className: "rounded-[32%_42%_28%_38%]" },
    { label: "Pill launcher", className: "rounded-[38%] scale-x-95" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {masks.map((mask) => (
        <div key={mask.label} className="space-y-2 text-center">
          <div className={cn("relative mx-auto grid h-20 w-20 place-items-center overflow-hidden border border-[var(--color-border-default)] shadow-[var(--shadow-md)]", mask.className)} style={{ backgroundColor }}>
            {previewUrl ? <img src={previewUrl} alt={`${mask.label} maskable icon preview`} className="h-full w-full object-cover" /> : null}
            <div className="pointer-events-none absolute inset-[10%] rounded-full border border-dashed border-white/70 mix-blend-difference" />
          </div>
          <div className="text-[11px] font-semibold text-[var(--color-text-secondary)]">{mask.label}</div>
        </div>
      ))}
    </div>
  );
}

function EmojiSourceControl({ input, setInput }: { input: FaviconInput; setInput: React.Dispatch<React.SetStateAction<FaviconInput>> }) {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.classList.contains("dark") || root.dataset.theme === "dark" || root.dataset.mode === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class", "data-theme", "data-mode"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={popoverRef} className="relative space-y-2">
      <CompactField label="Emoji" hint="Pick one emoji. Simple, bold emojis work best at small favicon sizes.">
        <div className="flex items-center gap-2">
          <Input value={input.emoji} maxLength={16} onChange={(event) => updateInput(setInput, { emoji: event.target.value })} className="min-w-0 text-xl" />
          <Button type="button" size="sm" variant="secondary" aria-label="Choose emoji" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            Choose emoji
          </Button>
          {input.emoji ? <Button type="button" size="sm" variant="ghost" aria-label="Clear emoji" onClick={() => updateInput(setInput, { emoji: "" })}>Clear</Button> : null}
        </div>
      </CompactField>
      {open ? (
        <div className="relative z-30 w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-2 shadow-[var(--shadow-lg)]" role="dialog" aria-label="Choose an emoji">
          <EmojiPicker
            width="100%"
            height={400}
            lazyLoadEmojis
            searchPlaceHolder="Search emojis"
            theme={(isDark ? "dark" : "light") as EmojiPickerTheme}
            onEmojiClick={(emojiData) => {
              updateInput(setInput, { emoji: emojiData.emoji });
              setOpen(false);
            }}
          />
        </div>
      ) : null}
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
        updateInput(setInput, { sourceMode: "svg", svgText: svg, imageDataUrl: "", imageMeta: null, cropMode: "contain", sourceTransform: DEFAULT_SOURCE_TRANSFORM });
        return;
      }
      const dataUrl = await fileToDataUrl(file);
      const imageMeta = await readSourceImageMeta(dataUrl, file);
      updateInput(setInput, { sourceMode: "image", imageDataUrl: dataUrl, imageMeta, cropMode: "contain", sourceTransform: DEFAULT_SOURCE_TRANSFORM });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Unable to load that image.");
    }
  }

  return (
    <ControlSection title="Step 1 · Start" description="Start with an uploaded image, SVG, initials, or emoji.">
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
        <EmojiSourceControl input={input} setInput={setInput} />
      ) : null}
    </ControlSection>
  );
}

function SourceFramingControls({ input, setInput }: { input: FaviconInput; setInput: React.Dispatch<React.SetStateAction<FaviconInput>> }) {
  const [trimStatus, setTrimStatus] = useState<"idle" | "working" | "done" | "none" | "error">("idle");
  const transform = { ...DEFAULT_SOURCE_TRANSFORM, ...(input.sourceTransform ?? { fitMode: input.cropMode }) };
  const isImageSource = input.sourceMode === "image" && Boolean(input.imageDataUrl);
  const isSvgSource = input.sourceMode === "svg" && isSafeSvgMarkup(input.svgText);
  const sourceUrl = isImageSource ? input.imageDataUrl : isSvgSource ? svgToDataUrl(input.svgText) : "";
  const previewText = input.sourceMode === "emoji" ? input.emoji || "✨" : input.text || "D";
  const objectFit = transform.fitMode === "fill" ? "fill" : transform.fitMode === "cover" ? "cover" : "contain";

  async function trimTransparentEdges() {
    if (!input.imageDataUrl) return;
    setTrimStatus("working");
    try {
      const trimmed = await trimTransparentImageDataUrl(input.imageDataUrl);
      if (!trimmed) {
        setTrimStatus("none");
        window.setTimeout(() => setTrimStatus("idle"), 1800);
        return;
      }
      const imageMeta = await readSourceImageMeta(trimmed);
      setInput((current) => ({ ...current, imageDataUrl: trimmed, imageMeta: { ...imageMeta, name: current.imageMeta?.name ? `${current.imageMeta.name} · trimmed` : "Trimmed image" }, cropMode: "contain", sourceTransform: DEFAULT_SOURCE_TRANSFORM }));
      setTrimStatus("done");
      window.setTimeout(() => setTrimStatus("idle"), 1800);
    } catch {
      setTrimStatus("error");
      window.setTimeout(() => setTrimStatus("idle"), 2200);
    }
  }

  return (
    <ControlSection title="Source framing" description="Prepare the source before export: zoom, move, rotate, fit, and trim transparent edges.">
      <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-xs)]">
        <div className="relative mx-auto grid aspect-square w-32 place-items-center overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)]" style={{ backgroundColor: input.transparentBackground ? undefined : input.backgroundColor }}>
          {input.transparentBackground ? (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: "#f8fafc",
                backgroundImage: "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
              }}
            />
          ) : null}
          <div className="pointer-events-none absolute inset-[14%] rounded-full border border-dashed border-white/70 mix-blend-difference" />
          {sourceUrl ? (
            <img
              src={sourceUrl}
              alt="Source framing preview"
              className="relative z-10 h-full w-full"
              style={{ objectFit, transform: `translate(${transform.offsetX}%, ${transform.offsetY}%) rotate(${transform.rotation}deg) scale(${(input.scale / 100) * (transform.zoom / 100)})` }}
            />
          ) : (
            <span
              className="relative z-10 select-none text-5xl font-black"
              style={{ color: input.foregroundColor, fontFamily: input.fontFamily, transform: `translate(${transform.offsetX}%, ${transform.offsetY}%) rotate(${transform.rotation}deg) scale(${(input.scale / 100) * (transform.zoom / 100)})` }}
            >
              {previewText}
            </span>
          )}
        </div>
        <p className="text-center text-[11px] leading-4 text-[var(--color-text-tertiary)]">Keep important artwork inside the dashed safe area before downloading the package.</p>
      </div>

      <FieldGroup>
        <CompactField label="Fit mode" hint="Contain keeps the full source visible. Cover fills the box. Fill stretches into the square.">
          <Select value={transform.fitMode} onChange={(event) => updateSourceTransform(setInput, { fitMode: event.target.value as FaviconInput["sourceTransform"]["fitMode"] })}>
            <option value="contain">Contain</option>
            <option value="cover">Cover / crop</option>
            <option value="fill">Fill / stretch</option>
          </Select>
        </CompactField>
        <CompactField label="Background fill" hint="Use a solid canvas for iOS and app icons.">
          <button
            type="button"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 text-left text-xs font-bold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text-primary)]"
            onClick={() => updateInput(setInput, { transparentBackground: false })}
          >
            {input.transparentBackground ? "Use solid background" : `Solid: ${input.backgroundColor}`}
          </button>
        </CompactField>
      </FieldGroup>

      <SliderNumberField label="Source zoom" hint="Zooms the original artwork before icon export." value={transform.zoom} min={25} max={250} unit="%" onChange={(zoom) => updateSourceTransform(setInput, { zoom })} />
      <FieldGroup>
        <SliderNumberField label="Move X" value={transform.offsetX} min={-50} max={50} unit="%" onChange={(offsetX) => updateSourceTransform(setInput, { offsetX })} />
        <SliderNumberField label="Move Y" value={transform.offsetY} min={-50} max={50} unit="%" onChange={(offsetY) => updateSourceTransform(setInput, { offsetY })} />
      </FieldGroup>
      <SliderNumberField label="Rotate" hint="Straighten or angle the source before generating every size." value={transform.rotation} min={-180} max={180} unit="°" onChange={(rotation) => updateSourceTransform(setInput, { rotation })} />

      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => resetSourceTransform(setInput)}>Reset framing</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => updateSourceTransform(setInput, { offsetX: 0, offsetY: 0, rotation: 0 })}>Auto center</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setInput((current) => ({ ...current, padding: Math.max(current.padding, 22), scale: Math.min(current.scale, 96), sourceTransform: { ...DEFAULT_SOURCE_TRANSFORM, ...(current.sourceTransform ?? { fitMode: current.cropMode }), zoom: Math.min(current.sourceTransform?.zoom ?? 100, 105) } }))}>Safe padding</Button>
        <Button type="button" size="sm" variant="ghost" disabled={!isImageSource || trimStatus === "working"} onClick={trimTransparentEdges}>{trimStatus === "working" ? "Trimming..." : "Trim transparent edges"}</Button>
      </div>
      {trimStatus === "done" ? <p className="text-xs font-semibold text-[var(--color-success-text)]">Transparent edges were trimmed and framing was reset.</p> : null}
      {trimStatus === "none" ? <p className="text-xs font-semibold text-[var(--color-info-text)]">No transparent edges were detected.</p> : null}
      {trimStatus === "error" ? <p className="text-xs font-semibold text-[var(--color-danger-text)]">Could not trim this source in the browser.</p> : null}
    </ControlSection>
  );
}

function ColorControls({ input, setInput }: { input: FaviconInput; setInput: React.Dispatch<React.SetStateAction<FaviconInput>> }) {
  return (
    <ControlSection title="Step 2 · Design" description="Set the icon canvas and artwork colors.">
      <FieldGroup>
        <ColorField label="Background" value={input.backgroundColor} disabled={input.transparentBackground} onChange={(backgroundColor) => updateInput(setInput, { backgroundColor })} />
        <ColorField label="Foreground" value={input.foregroundColor} onChange={(foregroundColor) => updateInput(setInput, { foregroundColor })} />
      </FieldGroup>

      <label className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-sm shadow-[var(--shadow-xs)]">
        <input type="checkbox" checked={input.transparentBackground} onChange={(event) => updateInput(setInput, { transparentBackground: event.target.checked })} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
        <span className="space-y-1">
          <span className="block font-semibold text-[var(--color-text-primary)]">Transparent background</span>
          <span className="block text-xs leading-5 text-[var(--color-text-tertiary)]">Best for simple web favicons. Not recommended for all mobile/PWA icons.</span>
        </span>
      </label>
    </ControlSection>
  );
}

function ShapeSpacingControls({ input, setInput }: { input: FaviconInput; setInput: React.Dispatch<React.SetStateAction<FaviconInput>> }) {
  return (
    <ControlSection title="Shape & spacing" description="Control how the artwork fits inside the icon.">
      <SliderNumberField label="Padding" hint="Controls breathing room around the artwork." value={input.padding} min={0} max={45} unit="%" onChange={(padding) => updateInput(setInput, { padding })} />
      <SliderNumberField label="Scale" hint="Changes artwork size inside the icon box." value={input.scale} min={50} max={150} unit="%" onChange={(scale) => updateInput(setInput, { scale })} />
      <SliderNumberField label="Border radius" hint="Controls rounded corners for generated previews." value={input.borderRadius} min={0} max={50} unit="%" disabled={input.shape === "circle" || input.shape === "squircle"} onChange={(borderRadius) => updateInput(setInput, { borderRadius })} />

      <CompactField label="Shape">
        <Select value={input.shape} onChange={(event) => updateInput(setInput, { shape: event.target.value as IconShape })}>
          {SHAPE_OPTIONS.map((shape) => <option key={shape.value} value={shape.value}>{shape.label}</option>)}
        </Select>
      </CompactField>
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
  const selectedPack = EXPORT_PACKS.find((pack) => pack.id === input.exportPack);
  const selectedProject = PROJECT_PROFILES.find((profile) => profile.id === input.projectProfile);
  const recommendedPack = selectedProject ? EXPORT_PACKS.find((pack) => pack.id === selectedProject.recommendedPack) : null;
  const usesRecommendedPack = !selectedProject || selectedProject.recommendedPack === input.exportPack;

  return (
    <ControlSection title="Step 3 · Export" description="Choose the project type and package structure to download.">
      <CompactField label="Project type" hint={selectedProject ? `${selectedProject.description} Target: ${selectedProject.targetFolder}.` : undefined}>
        <Select value={input.projectProfile} onChange={(event) => updateInput(setInput, { projectProfile: event.target.value as ProjectProfileId })}>
          {PROJECT_PROFILES.map((profile) => <option key={profile.id} value={profile.id}>{profile.title}</option>)}
        </Select>
      </CompactField>

      <CompactField label="Export pack" hint={selectedPack?.description}>
        <Select value={input.exportPack} onChange={(event) => updateInput(setInput, { exportPack: event.target.value as ExportPackId })}>
          {EXPORT_PACKS.map((pack) => <option key={pack.id} value={pack.id}>{pack.title}</option>)}
        </Select>
      </CompactField>

      {!usesRecommendedPack && recommendedPack ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-xs leading-5 text-[var(--color-warning-text)]">
          Recommended for {selectedProject?.title}: <strong>{recommendedPack.title}</strong>.
          <button type="button" className="ml-1 font-bold underline underline-offset-2" onClick={() => updateInput(setInput, { exportPack: recommendedPack.id })}>
            Apply recommended pack
          </button>
        </div>
      ) : null}

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

function getAssetBySuffix(assets: GeneratedAsset[], suffixes: string[]) {
  return assets.find((asset) => suffixes.some((suffix) => asset.filename.endsWith(suffix)));
}

function getBestIconAsset(assets: GeneratedAsset[]) {
  return getAssetBySuffix(assets, ["android-chrome-512x512.png", "icon-512x512.png", "src/app/icon.png", "icons/icon-512x512.png"]);
}

function PreviewModeSwitch({ mode, setMode }: { mode: PreviewMode; setMode: (mode: PreviewMode) => void }) {
  const options: Array<{ id: PreviewMode; label: string; detail: string }> = [
    { id: "essential", label: "Essential", detail: "tab, search, small sizes" },
    { id: "platform", label: "Platform", detail: "iOS, Android, PWA" },
    { id: "advanced", label: "Advanced", detail: "bookmarks, masks, launcher" },
  ];

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Preview mode">
      {options.map((option) => {
        const active = option.id === mode;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setMode(option.id)}
            className={cn(
              "rounded-[var(--radius-md)] border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-base)]",
              active
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                : "border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-text-primary)]",
            )}
          >
            <span className="block text-xs font-black">{option.label}</span>
            <span className="block text-[10px] font-semibold text-[var(--color-text-tertiary)]">{option.detail}</span>
          </button>
        );
      })}
    </div>
  );
}

function BrowserTabPreview({ iconUrl, siteName, tone }: { iconUrl?: string; siteName: string; tone: "light" | "dark" }) {
  const isDark = tone === "dark";
  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-md)] border shadow-[var(--shadow-xs)]", isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-white")}>
      <div className={cn("flex items-center gap-2 px-3 py-2", isDark ? "bg-slate-900 text-slate-100" : "bg-slate-100 text-slate-700")}>
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </span>
        <span className={cn("flex min-w-0 flex-1 items-center gap-2 rounded-t-[var(--radius-sm)] px-2 py-1 text-xs font-semibold", isDark ? "bg-slate-800" : "bg-white")}>
          {iconUrl ? <img src={iconUrl} alt={`${tone} browser tab favicon`} className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0 rounded-sm bg-slate-400" />}
          <span className="truncate">{siteName}</span>
        </span>
      </div>
      <div className={cn("px-3 py-2 font-mono text-[11px]", isDark ? "text-slate-400" : "text-slate-500")}>https://example.com</div>
    </div>
  );
}

function SearchResultPreview({ iconUrl, siteName }: { iconUrl?: string; siteName: string }) {
  return (
    <div className="space-y-2 rounded-[var(--radius-md)] bg-white p-3 text-slate-900 shadow-[var(--shadow-xs)] dark:bg-slate-950 dark:text-slate-100">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        {iconUrl ? <img src={iconUrl} alt="Search favicon" className="h-5 w-5 rounded-full" /> : <span className="h-5 w-5 rounded-full bg-slate-300" />}
        <span>{siteName}</span>
      </div>
      <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">{siteName} - useful tools</div>
      <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">A search preview to make sure the small icon has enough contrast and simple detail.</p>
    </div>
  );
}

function BookmarkPreview({ iconUrl, siteName }: { iconUrl?: string; siteName: string }) {
  return (
    <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      {["Bookmarks bar", "Mobile bookmark", "Pinned shortcut"].map((label, index) => (
        <div key={label} className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-raised)] px-3 py-2">
          {iconUrl ? <img src={iconUrl} alt={`${label} favicon preview`} className={cn("shrink-0", index === 0 ? "h-4 w-4" : "h-6 w-6 rounded-[20%]")} /> : <span className="h-5 w-5 shrink-0 rounded bg-[var(--color-border-default)]" />}
          <span className="truncate text-xs font-semibold text-[var(--color-text-secondary)]">{index === 2 ? `${siteName} shortcut` : siteName}</span>
        </div>
      ))}
    </div>
  );
}

function IosHomeScreenPreview({ iconUrl, label }: { iconUrl?: string; label: string }) {
  return (
    <div className="grid grid-cols-[5rem_1fr] items-center gap-4 rounded-[var(--radius-lg)] bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-white">
      {iconUrl ? <img src={iconUrl} alt="Apple touch icon preview" className="h-20 w-20 rounded-[22%] shadow-2xl" /> : <span className="h-20 w-20 rounded-[22%] bg-white/20" />}
      <div>
        <div className="text-sm font-bold">{label}</div>
        <div className="mt-1 text-xs leading-5 text-white/70">Home screen shortcut preview</div>
      </div>
    </div>
  );
}

function AndroidHomeScreenPreview({ iconUrl, label, backgroundColor }: { iconUrl?: string; label: string; backgroundColor: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-gradient-to-br from-emerald-950 via-slate-900 to-cyan-950 p-4 text-white">
      <div className="grid grid-cols-4 gap-3">
        {["Mail", "Maps", label, "Photos", "Clock", "Files", "Store", "Notes"].map((item, index) => (
          <div key={`${item}-${index}`} className="space-y-1 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-[28%] bg-white/10 shadow-lg" style={item === label ? { backgroundColor } : undefined}>
              {item === label && iconUrl ? <img src={iconUrl} alt="Android launcher icon preview" className="h-12 w-12 rounded-[28%] object-cover" /> : <span className="h-5 w-5 rounded-full bg-white/30" />}
            </div>
            <div className="truncate text-[10px] font-medium text-white/75">{item}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-4 text-white/70">Android launchers can crop adaptive icons differently, so keep the logo centered and padded.</p>
    </div>
  );
}

function PwaInstallPromptPreview({ iconUrl, input }: { iconUrl?: string; input: FaviconInput }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-slate-200 bg-white p-4 text-slate-900 shadow-[var(--shadow-md)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex items-start gap-3">
        {iconUrl ? <img src={iconUrl} alt="PWA install prompt icon" className="h-14 w-14 rounded-[22%] shadow" /> : <span className="h-14 w-14 rounded-[22%] bg-slate-300" />}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black">Install {input.shortName || input.siteName || "App"}?</div>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">Add this app to your home screen for quick access and standalone display.</p>
          <div className="mt-3 flex justify-end gap-2">
            <span className="rounded-full px-3 py-1 text-xs font-bold text-slate-500 dark:text-slate-400">Cancel</span>
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">Install</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManifestAppCardPreview({ iconUrl, input }: { iconUrl?: string; input: FaviconInput }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
      <div className="flex items-center gap-3">
        {iconUrl ? <img src={iconUrl} alt="Manifest app icon preview" className="h-16 w-16 rounded-[24%] object-cover shadow-[var(--shadow-md)]" /> : <span className="h-16 w-16 rounded-[24%] bg-[var(--color-border-default)]" />}
        <div className="min-w-0">
          <div className="truncate text-sm font-black text-[var(--color-text-primary)]">{input.siteName || "My Website"}</div>
          <div className="truncate text-xs font-semibold text-[var(--color-text-secondary)]">short_name: {input.shortName || "App"}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[var(--color-primary)]">{input.display}</span>
            <span className="rounded-full bg-[var(--color-surface-raised)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[var(--color-text-tertiary)]">{input.orientation}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-[var(--color-text-secondary)]">
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-raised)] p-2">theme_color<br /><span className="font-mono font-bold">{input.themeColor}</span></div>
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-raised)] p-2">background_color<br /><span className="font-mono font-bold">{input.manifestBackgroundColor}</span></div>
      </div>
    </div>
  );
}

function AppLauncherGridPreview({ iconUrl, label }: { iconUrl?: string; label: string }) {
  const apps = ["Calendar", "Camera", label, "Music", "Tasks", "Weather", "Shop", "Chat", "Docs", "Wallet", "News", "Tools"];
  return (
    <div className="rounded-[var(--radius-lg)] bg-[radial-gradient(circle_at_top,var(--color-primary-soft),transparent_45%),var(--color-surface-base)] p-4">
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
        {apps.map((app, index) => {
          const current = app === label && index === 2;
          return (
            <div key={`${app}-${index}`} className="space-y-1 text-center">
              <div className={cn("mx-auto grid h-12 w-12 place-items-center rounded-[24%] shadow-[var(--shadow-xs)]", current ? "bg-transparent" : "bg-[var(--color-surface-raised)]")}>
                {current && iconUrl ? <img src={iconUrl} alt="App launcher grid icon preview" className="h-12 w-12 rounded-[24%] object-cover" /> : <span className="h-5 w-5 rounded-full bg-[var(--color-border-default)]" />}
              </div>
              <div className="truncate text-[10px] font-semibold text-[var(--color-text-secondary)]">{app}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PreviewPanel({ input, assets, status, error }: { input: FaviconInput; assets: GeneratedAsset[]; status: Status; error: string }) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("essential");
  const icon512 = getBestIconAsset(assets);
  const icon192 = getAssetBySuffix(assets, ["android-chrome-192x192.png", "icon-192x192.png", "icons/icon-192x192.png", "public/android-chrome-192x192.png"]);
  const icon32 = getAssetBySuffix(assets, ["favicon-32x32.png"]);
  const apple = getAssetBySuffix(assets, ["apple-touch-icon.png", "apple-icon.png", "apple-touch-icon-180x180.png", "src/app/apple-icon.png"]);
  const maskable = assets.find((asset) => asset.filename.includes("maskable") && asset.filename.includes("512"));
  const siteName = input.siteName || "My Website";
  const appLabel = input.shortName || input.siteName || "App";
  const bestPreviewUrl = icon512?.previewUrl || icon192?.previewUrl || apple?.previewUrl;

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

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-black text-[var(--color-text-primary)]">Live platform previews</h3>
            <p className="text-xs leading-5 text-[var(--color-text-secondary)]">Switch surfaces to inspect tiny favicons, mobile shortcuts, PWA install prompts, bookmarks, and maskable launcher crops.</p>
          </div>
          <PreviewModeSwitch mode={previewMode} setMode={setPreviewMode} />
        </div>
      </section>

      {previewMode === "essential" ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
            <PreviewTile title="Large icon" meta="actual 512×512 output">
              <div className="grid min-h-64 place-items-center rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[linear-gradient(45deg,rgba(148,163,184,0.15)_25%,transparent_25%),linear-gradient(-45deg,rgba(148,163,184,0.15)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,rgba(148,163,184,0.15)_75%),linear-gradient(-45deg,transparent_75%,rgba(148,163,184,0.15)_75%)] bg-[length:22px_22px] bg-[position:0_0,0_11px,11px_-11px,-11px_0] p-6">
                {icon512?.previewUrl ? <img src={icon512.previewUrl} alt="Generated icon preview" className="h-44 w-44 rounded-[24%] object-cover shadow-[0_28px_80px_rgba(15,23,42,0.22)]" /> : <ImageIcon className="h-16 w-16 text-[var(--color-text-tertiary)]" />}
              </div>
            </PreviewTile>

            <div className="space-y-4">
              <PreviewTile title="Light browser tab" meta="favicon-32">
                <BrowserTabPreview iconUrl={icon32?.previewUrl} siteName={siteName} tone="light" />
              </PreviewTile>
              <PreviewTile title="Dark browser tab" meta="favicon-32">
                <BrowserTabPreview iconUrl={icon32?.previewUrl} siteName={siteName} tone="dark" />
              </PreviewTile>
              <PreviewTile title="Google result">
                <SearchResultPreview iconUrl={icon32?.previewUrl} siteName={siteName} />
              </PreviewTile>
            </div>
          </div>

          <LegibilityStrip assets={assets} />
        </>
      ) : null}

      {previewMode === "platform" ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <PreviewTile title="iOS home screen" meta="Apple touch icon">
              <IosHomeScreenPreview iconUrl={apple?.previewUrl} label={appLabel} />
            </PreviewTile>
            <PreviewTile title="Android home screen" meta="launcher icon">
              <AndroidHomeScreenPreview iconUrl={icon192?.previewUrl || icon512?.previewUrl} label={appLabel} backgroundColor={input.manifestBackgroundColor} />
            </PreviewTile>
            <PreviewTile title="PWA install prompt" meta="manifest install surface">
              <PwaInstallPromptPreview iconUrl={icon192?.previewUrl || icon512?.previewUrl} input={input} />
            </PreviewTile>
            <PreviewTile title="Manifest app card" meta="name, colors, display">
              <ManifestAppCardPreview iconUrl={bestPreviewUrl} input={input} />
            </PreviewTile>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
            PWA and mobile launchers may crop icons differently. Use maskable icons and keep important artwork centered with enough padding.
          </div>
        </>
      ) : null}

      {previewMode === "advanced" ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <PreviewTile title="Browser bookmark preview" meta="saved links">
              <BookmarkPreview iconUrl={icon32?.previewUrl || bestPreviewUrl} siteName={siteName} />
            </PreviewTile>
            <PreviewTile title="App launcher grid" meta="crowded home screen">
              <AppLauncherGridPreview iconUrl={bestPreviewUrl} label={appLabel} />
            </PreviewTile>
          </div>
          <PreviewTile title="Maskable shape comparison" meta="circle, squircle, rounded, adaptive">
            <SafeAreaIconPreview previewUrl={maskable?.previewUrl || bestPreviewUrl} backgroundColor={input.manifestBackgroundColor} />
            <p className="mt-3 text-center text-[11px] leading-4 text-[var(--color-text-tertiary)]">The dashed circle is the safe area. Keep logos, initials, and emoji details inside it to avoid launcher cropping.</p>
          </PreviewTile>
        </>
      ) : null}
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
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Generated image files</h3>
        <p className="mb-3 mt-1 text-xs text-[var(--color-text-secondary)]">Ready-to-use favicon and app icon images.</p>
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
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Generated docs & snippets</h3>
        <p className="mb-3 mt-1 text-xs text-[var(--color-text-secondary)]">Manifest, setup code, and handoff notes.</p>
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

const READINESS_CATEGORY_LABELS: Record<ReadinessCategory, string> = {
  source: "Source quality",
  legibility: "Small-size legibility",
  "edge-safety": "Edge safety",
  contrast: "Contrast",
  apple: "Apple/iOS",
  pwa: "PWA",
  maskable: "Maskable",
  install: "Install",
  cache: "Cache",
};

const QUALITY_SEVERITY_CLASS: Record<QualityIssueSeverity, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function pathPrefixForProfile(input: FaviconInput) {
  if (input.projectProfile === "pwa-complete" || input.exportPack === "pwa") return "/icons/";
  return "/";
}

function firstGraphemes(value: string, count: number) {
  return Array.from(value.trim()).slice(0, count).join("");
}

function applyQualityFix(setInput: React.Dispatch<React.SetStateAction<FaviconInput>>, actionId: QualityIssueActionId) {
  setInput((current) => {
    switch (actionId) {
      case "add-safe-padding":
        return { ...current, padding: Math.max(current.padding, current.shape === "circle" ? 24 : 22), scale: Math.min(current.scale, 96), sourceTransform: { ...DEFAULT_SOURCE_TRANSFORM, ...(current.sourceTransform ?? { fitMode: current.cropMode }), zoom: Math.min(current.sourceTransform?.zoom ?? 100, 105) } };
      case "center-artwork":
        return { ...current, cropMode: "contain", padding: Math.max(current.padding, 20), scale: Math.min(current.scale, 96), sourceTransform: { ...DEFAULT_SOURCE_TRANSFORM, ...(current.sourceTransform ?? { fitMode: current.cropMode }), fitMode: "contain", offsetX: 0, offsetY: 0, rotation: 0 } };
      case "use-solid-background":
        return { ...current, transparentBackground: false, backgroundColor: current.backgroundColor || current.manifestBackgroundColor || "#0f172a" };
      case "enable-maskable":
        return { ...current, includeMaskable: true, padding: Math.max(current.padding, 22), scale: Math.min(current.scale, 96), sourceTransform: { ...DEFAULT_SOURCE_TRANSFORM, ...(current.sourceTransform ?? { fitMode: current.cropMode }), zoom: Math.min(current.sourceTransform?.zoom ?? 100, 105) } };
      case "use-recommended-pwa-pair":
        return { ...current, exportPack: "pwa", projectProfile: "pwa-complete", includeMaskable: true, includeMonochrome: true, display: "standalone", pathPrefix: "/icons/", padding: Math.max(current.padding, 22), scale: Math.min(current.scale, 96), sourceTransform: { ...DEFAULT_SOURCE_TRANSFORM, ...(current.sourceTransform ?? { fitMode: current.cropMode }), zoom: Math.min(current.sourceTransform?.zoom ?? 100, 105) } };
      case "reset-path-prefix":
        return { ...current, pathPrefix: pathPrefixForProfile(current) };
      case "simplify-text":
        return current.sourceMode === "emoji" ? { ...current, emoji: firstGraphemes(current.emoji || "✨", 1) || "✨" } : { ...current, text: firstGraphemes(current.text || "D", 2).toUpperCase() || "D" };
      case "increase-contrast":
        return { ...current, transparentBackground: false, foregroundColor: bestReadableColor(current.backgroundColor) };
      case "fill-app-names": {
        const nextSiteName = current.siteName.trim() || "My App";
        return { ...current, siteName: nextSiteName, shortName: current.shortName.trim() || firstGraphemes(nextSiteName, 12) || "App" };
      }
      case "make-installable":
        return { ...current, display: "standalone", includeMaskable: true, padding: Math.max(current.padding, 22), sourceTransform: { ...DEFAULT_SOURCE_TRANSFORM, ...(current.sourceTransform ?? { fitMode: current.cropMode }), zoom: Math.min(current.sourceTransform?.zoom ?? 100, 105) } };
      default:
        return current;
    }
  });
}

function QualityIssueCard({ issue, setInput }: { issue: SmartQualityIssue; setInput: React.Dispatch<React.SetStateAction<FaviconInput>> }) {
  return (
    <div className={cn("rounded-[var(--radius-md)] border p-3 shadow-[var(--shadow-xs)]", QUALITY_SEVERITY_CLASS[issue.severity])}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-[var(--radius-full)] border border-current px-2 py-0.5 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.08em] opacity-75">{issue.severity}</span>
        <span className="text-xs font-bold leading-5">{READINESS_CATEGORY_LABELS[issue.category]}</span>
      </div>
      <h4 className="mt-2 text-sm font-black leading-5">{issue.title}</h4>
      <p className="mt-1 text-xs leading-5 opacity-90">{issue.message}</p>
      {issue.action ? (
        <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => applyQualityFix(setInput, issue.action!.id)}>
          {issue.action.label}
        </Button>
      ) : issue.severity === "warning" || issue.severity === "danger" ? (
        <span className="mt-3 inline-flex rounded-[var(--radius-full)] border border-current px-2 py-1 font-mono text-[10px] font-bold uppercase opacity-75">Manual check</span>
      ) : null}
    </div>
  );
}

function ReadinessPanel({ input, assets, setInput }: { input: FaviconInput; assets: GeneratedAsset[]; setInput: React.Dispatch<React.SetStateAction<FaviconInput>> }) {
  const checks = useMemo(() => createReadinessChecks(input, assets), [input, assets]);
  const issues = useMemo(() => createSmartQualityIssues(input, assets), [input, assets]);
  const score = scoreReadiness(checks);
  const actionCount = issues.filter((issue) => issue.action).length;
  const reviewCount = issues.filter((issue) => issue.severity === "danger" || issue.severity === "warning").length;

  const groupedIssues = useMemo(() => {
    return issues.reduce<Record<ReadinessCategory, SmartQualityIssue[]>>((groups, issue) => {
      groups[issue.category] = [...(groups[issue.category] ?? []), issue];
      return groups;
    }, {} as Record<ReadinessCategory, SmartQualityIssue[]>);
  }, [issues]);

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-black text-[var(--color-text-primary)]">Smart icon quality score</h3>
          <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">Actionable checks for source quality, small-size readability, edge safety, contrast, Apple, PWA, maskable, install, and cache readiness.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-4 py-2 font-mono text-lg font-black text-[var(--color-text-primary)]">{score}/100</div>
          <div className={cn("rounded-[var(--radius-full)] border px-3 py-1.5 font-mono text-[11px] font-black uppercase", reviewCount ? "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]" : "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]")}>
            {reviewCount ? `${reviewCount} to review` : "Looks strong"}
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((check) => (
          <div key={check.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3">
            <div className="flex items-center gap-2">
              {check.passed ? <CheckCircle2 className="h-4 w-4 text-[var(--color-success-text)]" /> : <AlertTriangle className="h-4 w-4 text-[var(--color-warning-text)]" />}
              <span className="text-xs font-bold text-[var(--color-text-primary)]">{check.label}</span>
              <span className="ml-auto font-mono text-[10px] text-[var(--color-text-tertiary)]">{check.points}/{check.maxPoints}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
              <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.round((check.points / check.maxPoints) * 100)}%` }} />
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[var(--color-text-secondary)]">{check.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-black text-[var(--color-text-primary)]">Actionable quality issues</h4>
            <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">Every button below updates the actual generator state, then previews and files regenerate automatically.</p>
          </div>
          <span className="self-start rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-1 font-mono text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] sm:self-auto">
            {actionCount} auto-fix{actionCount === 1 ? "" : "es"} available
          </span>
        </div>

        <div className="mt-3 space-y-4">
          {(Object.keys(READINESS_CATEGORY_LABELS) as ReadinessCategory[]).map((category) => {
            const categoryIssues = groupedIssues[category] ?? [];
            if (!categoryIssues.length) return null;
            return (
              <div key={category}>
                <MiniLabel>{READINESS_CATEGORY_LABELS[category]}</MiniLabel>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {categoryIssues.map((issue) => <QualityIssueCard key={issue.id} issue={issue} setInput={setInput} />)}
                </div>
              </div>
            );
          })}
        </div>
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
          failedCount ? "self-start border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] sm:self-auto" : "self-start border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)] sm:self-auto",
        )}>
          {failedCount ? `${failedCount} item${failedCount === 1 ? "" : "s"} to review` : "Package clean"}
        </div>
      </div>
      <WarningPanel messages={messages} />
    </section>
  );
}

function installStepsForPack(input: FaviconInput): Array<{ title: string; detail: string; copy?: string }> {
  switch (input.projectProfile) {
    case "next-app":
      return [
        { title: "Copy App Router icons", detail: "Place favicon.ico, icon.png, and apple-icon.png inside src/app so Next.js can auto-detect them.", copy: "src/app/favicon.ico\nsrc/app/icon.png\nsrc/app/apple-icon.png" },
        { title: "Copy public manifest", detail: "Place site.webmanifest in public and keep manifest icon paths reachable from the deployed root.", copy: "public/site.webmanifest" },
        { title: "Use the setup tab", detail: "Copy the Project setup tab if your app needs an explicit manifest link or theme-color metadata." },
        { title: "Build and inspect", detail: "Run a production build, then inspect the browser tab and DevTools Application > Manifest." },
      ];
    case "next-pages":
      return [
        { title: "Copy files to public", detail: "Pages Router projects usually serve favicon assets from the public folder.", copy: "public/" },
        { title: "Paste in Head", detail: "Use next/head, pages/_document, or your shared Head component for the generated links." },
        { title: "Avoid duplicate tags", detail: "If another layout or SEO plugin already outputs favicon links, replace it instead of duplicating." },
        { title: "Clear favicon cache", detail: "Browsers cache favicon files heavily; test with a new profile or cache-busting deploy." },
      ];
    case "vite-react":
      return [
        { title: "Copy files to public", detail: "Vite copies public files to the production root unchanged.", copy: "public/" },
        { title: "Update index.html", detail: "Paste the generated HTML snippet before the closing </head> tag." },
        { title: "Check base path", detail: "If your Vite app deploys under a subpath, update Path prefix before exporting." },
        { title: "Verify manifest", detail: "Open the manifest URL in the browser and confirm all icon URLs return PNG files." },
      ];
    case "astro":
      return [
        { title: "Copy files to public", detail: "Astro serves public files from the site root.", copy: "public/" },
        { title: "Add links to layout", detail: "Paste the setup code in BaseHead.astro, Layout.astro, or your shared head component." },
        { title: "Use centered artwork", detail: "Astro sites often use favicons in SEO/share contexts, so test the 16px and Google previews." },
        { title: "Verify after build", detail: "Run the production build and confirm /favicon.ico and /site.webmanifest resolve." },
      ];
    case "nuxt":
      return [
        { title: "Copy files to public", detail: "Nuxt serves public assets from the root path.", copy: "public/" },
        { title: "Register head links", detail: "Use app.vue with useHead or app.head in nuxt.config for the generated links." },
        { title: "Check duplicate favicon config", detail: "Remove old favicon settings if your Nuxt config already has them." },
        { title: "Validate manifest", detail: "Open DevTools Application > Manifest to confirm PWA icons are recognized." },
      ];
    case "sveltekit":
      return [
        { title: "Copy files to static", detail: "SvelteKit serves static files from the deployed root.", copy: "static/" },
        { title: "Update app.html", detail: "Paste the generated links inside src/app.html head." },
        { title: "Keep root paths", detail: "static/favicon.ico is referenced as /favicon.ico, not /static/favicon.ico." },
        { title: "Test installed app", detail: "For PWA support, verify manifest icons and maskable entries after deployment." },
      ];
    case "wordpress":
      return [
        { title: "Prefer Site Icon", detail: "Use Appearance > Customize > Site Identity for the safest WordPress favicon setup." },
        { title: "Use a child theme for manual tags", detail: "If you paste code manually, do it through wp_head hooks or a child theme." },
        { title: "Avoid plugin conflicts", detail: "SEO/cache plugins may already output favicon tags; avoid duplicates." },
        { title: "Purge cache", detail: "Clear WordPress, CDN, and browser cache after changing favicons." },
      ];
    case "pwa-complete":
      return [
        { title: "Upload the icons folder", detail: "Keep the generated icons folder structure unchanged so manifest paths continue to work.", copy: "public/icons/" },
        { title: "Link the manifest", detail: "Add the generated manifest.webmanifest link to your HTML head or framework layout.", copy: '<link rel="manifest" href="/manifest.webmanifest">' },
        { title: "Verify install prompt", detail: "Open DevTools Application > Manifest and confirm 192×192, 512×512, and maskable icons are detected." },
        { title: "Check safe area", detail: "Use the maskable preview and keep important artwork inside the dashed center safe zone." },
      ];
    case "legacy-full":
      return [
        { title: "Upload full fallback set", detail: "Upload favicon.ico, PNG fallbacks, Apple icons, browserconfig.xml, and Microsoft tile assets." },
        { title: "Paste full snippet", detail: "Use the HTML tab when your site needs broad browser and platform fallback coverage." },
        { title: "Optional Windows tile", detail: "Keep browserconfig.xml only when you intentionally support older Microsoft tile integrations." },
        { title: "Clear favicon cache", detail: "Browsers aggressively cache favicons, so test in a new profile or with a cache-busting deploy." },
      ];
    case "plain-html":
    default:
      return [
        { title: "Upload generated files", detail: "Copy favicon.ico, PNG icons, site.webmanifest, and snippets to your website/public asset folder.", copy: input.pathPrefix },
        { title: "Paste HTML snippet", detail: "Add the generated HTML head snippet to your document head, layout, or template." },
        { title: "Verify manifest paths", detail: "Open site.webmanifest in the browser and confirm every icon src returns a real PNG file." },
        { title: "Test real surfaces", detail: "Check browser tab, Google/search preview, iOS shortcut, Android/PWA install, and dark/light backgrounds." },
      ];
  }
}

function InstallChecklistPanel({ input, assets }: { input: FaviconInput; assets: GeneratedAsset[] }) {
  const selectedPack = EXPORT_PACKS.find((pack) => pack.id === input.exportPack);
  const selectedProject = PROJECT_PROFILES.find((profile) => profile.id === input.projectProfile);
  const imageCount = assets.filter((asset) => asset.kind === "image").length;
  const docsCount = assets.length - imageCount;
  const totalSize = assets.reduce((sum, asset) => sum + (asset.size ?? asset.blob.size), 0);
  const steps = installStepsForPack(input);

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-black text-[var(--color-text-primary)]">Install assistant</h3>
          <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">A handoff checklist for the selected project type so users know exactly where files should go.</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-3 py-2 text-right text-xs text-[var(--color-text-secondary)]">
          <div className="font-bold text-[var(--color-text-primary)]">{selectedProject?.title ?? selectedPack?.title ?? input.exportPack}</div>
          <div>{selectedPack?.title ?? input.exportPack} · {assets.length} files · {imageCount} images · {docsCount} docs · {formatBytes(totalSize)}</div>
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

type ValidatorMode = "files" | "html" | "manifest" | "url";

const VALIDATOR_MODE_OPTIONS: Array<{ value: ValidatorMode; label: string }> = [
  { value: "files", label: "Files / ZIP" },
  { value: "html", label: "HTML head" },
  { value: "manifest", label: "Manifest" },
  { value: "url", label: "Website URL" },
];

const CHECKER_GROUPS: Array<{ key: FileValidationIssue["level"]; title: string; description: string }> = [
  { key: "error", title: "Critical", description: "Fix these before shipping the package." },
  { key: "warning", title: "Recommended", description: "Important improvements for reliable cross-platform icons." },
  { key: "info", title: "Optional", description: "Helpful notes, polish, and implementation context." },
  { key: "success", title: "Passed", description: "Checks that already look good." },
];

function CheckerResults({ issues }: { issues: FileValidationIssue[] }) {
  if (!issues.length) return null;

  return (
    <div className="space-y-3">
      {CHECKER_GROUPS.map((group) => {
        const groupIssues = issues.filter((issue) => issue.level === group.key);
        if (!groupIssues.length) return null;
        const messages: WarningMessage[] = groupIssues.map((issue) => ({
          id: issue.id,
          severity: issue.level === "error" ? "danger" : issue.level,
          title: issue.title,
          message: issue.message,
        }));

        return (
          <div key={group.key} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-black text-[var(--color-text-primary)]">{group.title}</h4>
                <p className="text-[11px] leading-4 text-[var(--color-text-tertiary)]">{group.description}</p>
              </div>
              <span className="rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-[var(--color-text-tertiary)]">
                {groupIssues.length} item{groupIssues.length === 1 ? "" : "s"}
              </span>
            </div>
            <WarningPanel messages={messages} />
          </div>
        );
      })}
    </div>
  );
}

function ValidatorPanel() {
  const [mode, setMode] = useState<ValidatorMode>("files");
  const [issues, setIssues] = useState<FileValidationIssue[]>([]);
  const [checking, setChecking] = useState(false);
  const [htmlText, setHtmlText] = useState("");
  const [manifestText, setManifestText] = useState("");
  const [urlText, setUrlText] = useState("");

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setChecking(true);
    try {
      setIssues(await validateExistingFiles(files));
    } finally {
      setChecking(false);
    }
  }

  function runHtmlCheck() {
    setIssues(validateHtmlHeadText(htmlText));
  }

  function runManifestCheck() {
    setIssues(validateManifestText(manifestText));
  }

  async function runUrlCheck() {
    const localIssues = validateWebsiteUrlInput(urlText);
    if (localIssues.length) {
      setIssues(localIssues);
      return;
    }

    setChecking(true);
    try {
      const response = await fetch(`/api/tools/favicon-checker?url=${encodeURIComponent(urlText.trim())}`);
      const payload = (await response.json()) as { issues?: FileValidationIssue[]; error?: string };
      if (!response.ok && payload.issues?.length) {
        setIssues(payload.issues);
        return;
      }
      if (!response.ok) {
        setIssues([{ id: "url-api-error", level: "error", title: "URL scan failed", message: payload.error ?? `The checker responded with HTTP ${response.status}.` }]);
        return;
      }
      setIssues(payload.issues ?? [{ id: "url-api-empty", level: "info", title: "No checker results", message: "The backend scan completed but did not return any validation messages." }]);
    } catch (error) {
      setIssues([{ id: "url-network-error", level: "error", title: "URL scan failed", message: error instanceof Error ? error.message : "Unable to reach the backend favicon checker." }]);
    } finally {
      setChecking(false);
    }
  }

  const problemCount = issues.filter((issue) => issue.level === "error" || issue.level === "warning").length;
  const passCount = issues.filter((issue) => issue.level === "success").length;

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-black text-[var(--color-text-primary)]">Existing favicon package checker</h3>
          <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
            Inspect exported packages, pasted snippets, manifest JSON, or a live website URL before installing favicons in a real project.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(
            "rounded-[var(--radius-full)] border px-3 py-1.5 font-mono text-[10px] font-black uppercase",
            problemCount ? "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]" : "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
          )}>
            {issues.length ? `${problemCount} to review` : "Ready to check"}
          </span>
          {issues.length ? (
            <span className="rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-3 py-1.5 font-mono text-[10px] font-black uppercase text-[var(--color-text-tertiary)]">
              {passCount} passed
            </span>
          ) : null}
        </div>
      </div>

      <SegmentedControl options={VALIDATOR_MODE_OPTIONS} value={mode} onChange={(value) => setMode(value)} ariaLabel="Checker input mode" fullWidth />

      <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3">
        {mode === "files" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-black text-[var(--color-text-primary)]">Files / ZIP</h4>
              <p className="text-xs leading-5 text-[var(--color-text-secondary)]">
                Upload extracted favicon files or a ZIP. The checker reads filenames, parses readable manifest/head snippets, and reports missing platform coverage.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-2 text-xs font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] hover:bg-[var(--color-surface-subtle)]">
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
              Upload files / ZIP
              <input type="file" multiple accept=".ico,.png,.svg,.json,.webmanifest,.xml,.html,.htm,.txt,.md,.zip" className="sr-only" onChange={handleFiles} />
            </label>
          </div>
        ) : null}

        {mode === "html" ? (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-black text-[var(--color-text-primary)]">HTML head snippet</h4>
              <p className="text-xs leading-5 text-[var(--color-text-secondary)]">Paste the favicon-related &lt;link&gt; and &lt;meta&gt; tags from your site head to verify browser, Apple, manifest, and theme-color coverage.</p>
            </div>
            <Textarea value={htmlText} onChange={(event) => setHtmlText(event.target.value)} rows={7} placeholder={'<link rel="icon" href="/favicon.ico" />\n<link rel="apple-touch-icon" href="/apple-touch-icon.png" />\n<link rel="manifest" href="/site.webmanifest" />'} />
            <div className="flex justify-end">
              <Button size="sm" onClick={runHtmlCheck} leftIcon={<FileCheck2 className="h-4 w-4" />}>Analyze HTML</Button>
            </div>
          </div>
        ) : null}

        {mode === "manifest" ? (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-black text-[var(--color-text-primary)]">Manifest JSON</h4>
              <p className="text-xs leading-5 text-[var(--color-text-secondary)]">Paste site.webmanifest or manifest.json to validate names, required icon sizes, maskable purpose, colors, and install display mode.</p>
            </div>
            <Textarea value={manifestText} onChange={(event) => setManifestText(event.target.value)} rows={9} placeholder={'{\n  "name": "My App",\n  "short_name": "App",\n  "icons": []\n}'} />
            <div className="flex justify-end">
              <Button size="sm" onClick={runManifestCheck} leftIcon={<FileCheck2 className="h-4 w-4" />}>Analyze manifest</Button>
            </div>
          </div>
        ) : null}

        {mode === "url" ? (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-black text-[var(--color-text-primary)]">Website URL</h4>
              <p className="text-xs leading-5 text-[var(--color-text-secondary)]">Scan a live page through the backend checker. It fetches the HTML head, manifest, linked icons, Apple touch icons, and PWA assets without browser CORS limitations.</p>
            </div>
            <Input value={urlText} onChange={(event) => setUrlText(event.target.value)} placeholder="https://example.com" />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] leading-5 text-[var(--color-text-tertiary)]">The backend follows redirects and checks linked assets, but some sites may block automated requests.</p>
              <Button size="sm" variant="secondary" onClick={runUrlCheck} disabled={checking} leftIcon={checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}>
                {checking ? "Scanning…" : "Scan website"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        {issues.length ? (
          <CheckerResults issues={issues} />
        ) : (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] p-5 text-center text-sm text-[var(--color-text-tertiary)]">
            Choose a checker mode above. You can validate a Darma ZIP, files from another favicon tool, pasted HTML head code, manifest JSON, or a live website URL.
          </div>
        )}
      </div>
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

  const selectedProject = PROJECT_PROFILES.find((profile) => profile.id === input.projectProfile);
  const snippets = useMemo(() => [
    { id: "html", label: "HTML", language: "html", filename: "html-head-snippet.txt", code: createHtmlHeadSnippet(input) },
    { id: "manifest", label: "Manifest", language: "json", filename: input.exportPack === "pwa" || input.projectProfile === "pwa-complete" ? "manifest.webmanifest" : "site.webmanifest", code: createManifestSnippet(input) },
    { id: "project", label: selectedProject?.shortLabel ?? "Setup", language: "txt", filename: `${input.projectProfile}-install-snippet.txt`, code: createProjectInstallSnippet(input) },
    { id: "readme", label: "README", language: "md", filename: "README.md", code: createInstallReadme(input) },
  ], [input, selectedProject?.shortLabel]);

  async function downloadZip() {
    if (!assets.length) return;
    const zip = await createZipArchive(assets);
    downloadBlobFile({ blob: zip, filename: `darma-favicon-${input.exportPack}-pack.zip` });
  }

  function ActionContent() {
    return (
      <>
        <div className="flex min-w-0 items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
          <FileArchive className="h-4 w-4 shrink-0" />
          <span>{assets.length ? `${assets.length} files ready` : "No files generated yet"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} disabled={!assets.length || status === "generating"} onClick={downloadZip}>Download ZIP</Button>
          <Button variant="ghost" onClick={() => setInput(DEFAULT_FAVICON_INPUT)}>Reset</Button>
        </div>
      </>
    );
  }

  const controls = (
    <>
      <SourceControls input={input} setInput={setInput} uploadError={uploadError} setUploadError={setUploadError} />
      <ColorControls input={input} setInput={setInput} />
      <SourceFramingControls input={input} setInput={setInput} />
      <ShapeSpacingControls input={input} setInput={setInput} />
      <AppSettingsControls input={input} setInput={setInput} />
      <QuickStartPresets setInput={setInput} />
      <ExportControls input={input} setInput={setInput} />
    </>
  );

  return (
    <div className="space-y-5">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
        <h2 className="text-sm font-black text-[var(--color-text-primary)]">How this tool works</h2>
        <ol className="mt-3 grid gap-2 text-xs leading-5 text-[var(--color-text-secondary)]">
          {[
            ["1", "Choose a source", "Upload an image, paste SVG, type initials, or choose an emoji."],
            ["2", "Tune the design", "Adjust colors, padding, scale, border radius, shape, and maskable safe area."],
            ["3", "Export and install", "Copy the install code or download the complete favicon and app icon ZIP."],
          ].map(([number, title, detail]) => (
            <li key={number} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-3 py-2.5">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] font-mono text-[11px] font-black text-[var(--color-primary)]">{number}</span>
              <span><strong className="block text-[var(--color-text-primary)]">Step {number} — {title}</strong>{detail}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-sm)] lg:hidden">
        {controls}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <main className="min-w-0 space-y-5">
          <PreviewPanel input={input} assets={assets} status={status} error={generationError} />

          <ActionBar align="between" className="lg:hidden">
            <ActionContent />
          </ActionBar>

          <CodeOutputPanel
            title="Generated install code"
            description="Copy snippets for a standard HTML site, manifest, or Next.js App Router setup."
            tabs={snippets}
            defaultTab="html"
            className="favicon-code-panel [&_.darma-code-output-pre]:min-h-64"
            onDownload={(tab) => downloadBlobFile({ blob: new Blob([tab.code], { type: "text/plain;charset=utf-8" }), filename: tab.filename ?? `${tab.id}.txt` })}
          />
          <FileChecklist assets={assets} />
          <InstallChecklistPanel input={input} assets={assets} />
          <ReadinessPanel input={input} assets={assets} setInput={setInput} />
          <GeneratedSelfCheckPanel input={input} assets={assets} />
          <ValidatorPanel />
          <WarningPanel title="Readiness warnings" messages={warningMessages} />
        </main>

        <aside className="sticky top-24 hidden max-h-[calc(100vh-120px)] min-w-0 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-sm)] lg:block">
          <ActionBar align="between" className="sticky top-0 z-10 rounded-none border-x-0 border-t-0 bg-[var(--color-surface-overlay)]/95 backdrop-blur">
            <ActionContent />
          </ActionBar>
          <div className="space-y-4 p-4">
            {controls}
          </div>
        </aside>
      </div>
    </div>
  );
}
