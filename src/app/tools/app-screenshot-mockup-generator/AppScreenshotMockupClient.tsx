"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type Dispatch, type DragEvent, type ReactNode, type SetStateAction } from "react";
import { CheckCircle2, ChevronDown, Copy, Download, FileArchive, ImageIcon, Loader2, MonitorSmartphone, Sparkles, UploadCloud } from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { CodeOutputPanel, ColorField, CompactField, ControlSection, SegmentedControl, SliderNumberField, WarningPanel, type WarningMessage } from "@/features/tools/components";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { cn } from "@/lib/cn";
import { fileToDataUrl, loadImageFromDataUrl, renderMockupDataUrl } from "./canvas";
import { createReadme, generateMockupAssets, revokeMockupAssetUrls } from "./generator";
import MockupProductionPanel from "./components/MockupProductionPanel";
import { DEFAULT_MOCKUP_INPUT, DEVICE_OPTIONS, EXPORT_PACKS, MAX_UPLOAD_BYTES, QUICK_PRESETS } from "./presets";
import { createCssSnippet, createCssVariablesSnippet, createDesignTokenSnippet, createHtmlFigureSnippet, createNextImageSnippet, createResponsivePictureSnippet } from "./snippets";
import type { GeneratedMockupAsset, MockupAlignment, MockupBackgroundMode, MockupDevice, MockupFitMode, MockupInput, MockupOrientation, MockupShadowStyle, MockupWarning, PackageCheckResult } from "./types";
import { createReadinessChecks, scoreReadiness, validateExistingPackage, validateGeneratedAssets, validateMockupInput } from "./validation";
import { MAX_MOCKUP_PROJECT_BYTES, createMockupFingerprint, createMockupMarkdownReport, createMockupMetricsCsv, createMockupProjectJson, parseMockupProjectJson, summarizeMockupProduction } from "./studio";
import { createZipArchive } from "./zip";

type Status = "idle" | "generating" | "ready" | "error";

type Option<T extends string> = { value: T; label: string };

const BACKGROUND_OPTIONS: Option<MockupBackgroundMode>[] = [
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
  { value: "mesh", label: "Mesh" },
  { value: "image", label: "Image" },
];

const ORIENTATION_OPTIONS: Option<MockupOrientation>[] = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
];

const FIT_OPTIONS: Option<MockupFitMode>[] = [
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
];

const SHADOW_OPTIONS: Option<MockupShadowStyle>[] = [
  { value: "none", label: "None" },
  { value: "soft", label: "Soft" },
  { value: "deep", label: "Deep" },
  { value: "float", label: "Float" },
];

const ALIGN_OPTIONS: Option<MockupAlignment>[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

function updateInput(setInput: Dispatch<SetStateAction<MockupInput>>, patch: Partial<MockupInput>) {
  setInput((current) => ({ ...current, ...patch }));
}

async function loadScreenshotFile(
  file: File,
  setInput: Dispatch<SetStateAction<MockupInput>>,
  setStatusMessage: (message: string) => void,
) {
  if (file.size > MAX_UPLOAD_BYTES) {
    setStatusMessage("Screenshot is too large. Try an image below 12 MB.");
    return;
  }
  const dataUrl = await fileToDataUrl(file);
  const image = await loadImageFromDataUrl(dataUrl);
  updateInput(setInput, {
    screenshotDataUrl: dataUrl,
    screenshotName: file.name,
    screenshotWidth: image.width,
    screenshotHeight: image.height,
  });
  setStatusMessage(`Loaded ${file.name} (${image.width}×${image.height}).`);
}

function formatBytes(bytes?: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function greatestCommonDivisor(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function formatRatio(width: number, height: number) {
  if (!width || !height) return "—";
  const divisor = greatestCommonDivisor(width, height);
  return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
}

function getCropSummary(input: MockupInput) {
  if (!input.screenshotWidth || !input.screenshotHeight) return input.fitMode === "cover" ? "Placeholder crop" : "Placeholder fit";
  if (input.fitMode === "contain") return "No crop";
  const sourceRatio = input.screenshotWidth / input.screenshotHeight;
  const canvasRatio = input.canvasWidth / input.canvasHeight;
  const difference = Math.abs(sourceRatio - canvasRatio) / Math.max(sourceRatio, canvasRatio);
  if (difference < 0.06) return "Low crop";
  if (difference < 0.18) return "Medium crop";
  return "High crop";
}

function FieldGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-3 sm:grid-cols-2", className)}>{children}</div>;
}

function MiniLabel({ children }: { children: ReactNode }) {
  return <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{children}</span>;
}

function Disclosure({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <details className="group border-t border-[var(--color-border-subtle)] pt-3">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-[var(--radius-sm)] py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)] [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{title}</span>
          {description ? <span className="mt-1 block text-xs leading-4 text-[var(--color-text-tertiary)]">{description}</span> : null}
        </span>
        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition group-open:rotate-180" />
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

function effectiveFrameRadius(device: MockupDevice, showChrome: boolean) {
  if (!showChrome || device === "card") return 0;
  if (device === "phone") return 44;
  if (device === "tablet") return 30;
  return 22;
}

function mapWarnings(warnings: MockupWarning[]): WarningMessage[] {
  return warnings.map((warning) => ({
    id: warning.id,
    severity: warning.level === "error" ? "danger" : warning.level,
    title: warning.title,
    message: warning.message,
  }));
}

function CopyInlineButton({ value }: { value: string }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  async function copyValue() {
    const copied = await copyTextToClipboard(value);
    setCopyStatus(copied ? "copied" : "failed");
    window.setTimeout(() => setCopyStatus("idle"), copied ? 1300 : 2200);
  }
  return (
    <Button size="sm" variant="ghost" leftIcon={<Copy className="h-3.5 w-3.5" />} onClick={copyValue}>
      {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : "Copy"}
    </Button>
  );
}

function UploadBox({ label, hint, accept, onChange, previewUrl }: { label: string; hint: string; accept: string; onChange: (file: File) => void; previewUrl?: string }) {
  return (
    <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-3 text-center transition hover:border-[var(--color-primary)] hover:bg-[var(--color-control-hover)]">
      {previewUrl ? <img src={previewUrl} alt="Uploaded preview" className="h-16 w-24 rounded-[var(--radius-sm)] object-cover shadow-[var(--shadow-xs)]" /> : <UploadCloud className="h-7 w-7 text-[var(--color-primary-text-strong)]" />}
      <span className="text-xs font-bold text-[var(--color-text-primary)]">{label}</span>
      <span className="text-xs leading-4 text-[var(--color-text-tertiary)]">{hint}</span>
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onChange(file);
        }}
      />
    </label>
  );
}

function QuickPresets({ setInput }: { setInput: Dispatch<SetStateAction<MockupInput>> }) {
  const [showAll, setShowAll] = useState(false);
  const visiblePresets = showAll ? QUICK_PRESETS : QUICK_PRESETS.slice(0, 6);

  return (
    <ControlSection title="Looks" description="Choose the communication goal first, then fine-tune the frame and brand styling.">
      <div className="grid grid-cols-2 gap-2">
        {visiblePresets.map((preset) => {
          const from = preset.patch.gradientFrom ?? "#0f172a";
          const to = preset.patch.gradientTo ?? preset.patch.backgroundColor ?? "#475569";
          const device = preset.patch.device ?? "card";
          return (
            <button
              key={preset.id}
              type="button"
              title={preset.description}
              onClick={() => setInput((current) => ({ ...current, ...preset.patch }))}
              className="group overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-left transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-sm)]"
            >
              <div
                className="flex h-20 items-center justify-center overflow-hidden border-b border-[var(--color-border-subtle)]"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              >
                <div className={cn(
                  "bg-white/95 shadow-lg ring-1 ring-black/10",
                  device === "phone" && "h-14 w-7 rounded-[7px]",
                  device === "tablet" && "h-12 w-9 rounded-[6px]",
                  (device === "laptop" || device === "desktop" || device === "browser") && "h-9 w-14 rounded-[5px]",
                  device === "card" && "h-9 w-14 rounded-[5px]",
                )} />
              </div>
              <div className="p-2.5">
                <span className="flex items-start gap-1.5 text-xs font-bold leading-4 text-[var(--color-text-primary)]">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary-text-strong)]" />
                  {preset.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      {QUICK_PRESETS.length > 6 ? (
        <Button size="sm" variant="ghost" className="w-full" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Show fewer mockup scenarios" : `Show all ${QUICK_PRESETS.length} scenarios`}
        </Button>
      ) : null}
    </ControlSection>
  );
}

function SourceControls({ input, setInput, setStatusMessage }: { input: MockupInput; setInput: Dispatch<SetStateAction<MockupInput>>; setStatusMessage: (message: string) => void }) {
  async function handleScreenshot(file: File) {
    await loadScreenshotFile(file, setInput, setStatusMessage);
  }

  return (
    <ControlSection title="Upload screenshot" description="PNG, JPG, or WebP up to 12 MB. The image stays in your browser.">
      <UploadBox label={input.screenshotDataUrl ? "Replace screenshot" : "Choose screenshot"} hint="Click to choose a local image" accept="image/png,image/jpeg,image/webp" onChange={handleScreenshot} previewUrl={input.screenshotDataUrl} />
      {input.screenshotName ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
          <strong className="text-[var(--color-text-primary)]">{input.screenshotName}</strong> · {input.screenshotWidth}×{input.screenshotHeight}
        </div>
      ) : null}
    </ControlSection>
  );
}

function DeviceControls({ input, setInput }: { input: MockupInput; setInput: Dispatch<SetStateAction<MockupInput>> }) {
  const radiusMin = effectiveFrameRadius(input.device, input.showDeviceChrome);

  return (
    <ControlSection title="Device" description="Pick the frame visually, then choose how the screenshot should sit inside it.">
      <div className="grid grid-cols-3 gap-2">
        {DEVICE_OPTIONS.map((option) => {
          const selected = input.device === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              title={option.description}
              onClick={() => updateInput(setInput, {
                device: option.value,
                frameRadius: Math.max(input.frameRadius, effectiveFrameRadius(option.value, input.showDeviceChrome)),
              })}
              className={cn(
                "group rounded-[var(--radius-md)] border p-2.5 text-center transition",
                selected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-[var(--shadow-xs)]"
                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-default)] hover:bg-[var(--color-control-hover)]",
              )}
            >
              <div className="flex h-10 items-center justify-center">
                <div className={cn(
                  "border-2 transition",
                  selected ? "border-[var(--color-primary)] bg-[var(--color-surface-raised)]" : "border-[var(--color-text-tertiary)] bg-[var(--color-surface-subtle)]",
                  option.value === "phone" && "h-9 w-5 rounded-[5px]",
                  option.value === "tablet" && "h-8 w-6 rounded-[5px]",
                  option.value === "laptop" && "h-5 w-9 rounded-[3px] border-b-4",
                  option.value === "desktop" && "h-6 w-9 rounded-[3px] after:mx-auto after:mt-1 after:block after:h-1.5 after:w-3 after:border-x-2 after:border-current",
                  option.value === "browser" && "h-7 w-10 rounded-[4px] before:block before:h-2 before:border-b before:border-current before:content-['']",
                  option.value === "card" && "h-7 w-10 rounded-[5px]",
                )} />
              </div>
              <span className="mt-1 block text-xs font-bold text-[var(--color-text-primary)]">{option.value === "card" ? "Card" : option.label}</span>
            </button>
          );
        })}
      </div>

      <FieldGroup>
        <CompactField label="Orientation">
          <Select value={input.orientation} onChange={(event) => updateInput(setInput, { orientation: event.target.value as MockupOrientation })}>
            {ORIENTATION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </CompactField>
        <CompactField label="Screenshot fit">
          <Select value={input.fitMode} onChange={(event) => updateInput(setInput, { fitMode: event.target.value as MockupFitMode })}>
            {FIT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </CompactField>
      </FieldGroup>

      <Disclosure title="Advanced frame" description="Shadow, alignment, scale, rotation, radius, padding, and rendering details.">
        <FieldGroup>
          <CompactField label="Shadow">
            <Select value={input.shadow} onChange={(event) => updateInput(setInput, { shadow: event.target.value as MockupShadowStyle })}>
              {SHADOW_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </CompactField>
          <CompactField label="Alignment">
            <Select value={input.alignment} onChange={(event) => updateInput(setInput, { alignment: event.target.value as MockupAlignment })}>
              {ALIGN_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </CompactField>
          <SliderNumberField label="Device scale" min={35} max={115} value={input.deviceScale} unit="%" onChange={(deviceScale) => updateInput(setInput, { deviceScale })} />
          <SliderNumberField label="Rotation" min={-12} max={12} value={input.rotate} unit="°" onChange={(rotate) => updateInput(setInput, { rotate })} />
          <SliderNumberField label="Frame radius" min={radiusMin} max={72} value={Math.max(input.frameRadius, radiusMin)} unit="px" onChange={(frameRadius) => updateInput(setInput, { frameRadius })} />
          <SliderNumberField label="Canvas padding" min={32} max={180} value={input.padding} unit="px" onChange={(padding) => updateInput(setInput, { padding })} />
        </FieldGroup>
        <div className="grid gap-2 text-xs text-[var(--color-text-secondary)]">
          {input.device !== "card" ? (
            <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
              <input type="checkbox" checked={input.showDeviceChrome} onChange={(event) => updateInput(setInput, { showDeviceChrome: event.target.checked, frameRadius: Math.max(input.frameRadius, effectiveFrameRadius(input.device, event.target.checked)) })} />
              Show device/browser chrome
            </label>
          ) : <p className="rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-3">Card mode intentionally has no device chrome.</p>}
          <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
            <input type="checkbox" checked={input.showReflection} onChange={(event) => updateInput(setInput, { showReflection: event.target.checked })} />
            Add subtle glass reflection
          </label>
          <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
            <input type="checkbox" checked={input.showSafeArea} onChange={(event) => updateInput(setInput, { showSafeArea: event.target.checked })} />
            Show export safe-area guide
          </label>
        </div>
      </Disclosure>
    </ControlSection>
  );
}

function DesignControls({ input, setInput, setStatusMessage }: { input: MockupInput; setInput: Dispatch<SetStateAction<MockupInput>>; setStatusMessage: (message: string) => void }) {
  async function handleBackground(file: File) {
    if (file.size > MAX_UPLOAD_BYTES) {
      setStatusMessage("Background image is too large. Try an image below 12 MB.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    updateInput(setInput, { backgroundImageDataUrl: dataUrl, backgroundMode: "image" });
    setStatusMessage(`Loaded background image: ${file.name}.`);
  }

  return (
    <ControlSection title="Style" description="Choose the canvas background first. Copy and production details stay out of the way until you need them.">
      <SegmentedControl<MockupBackgroundMode>
        ariaLabel="Background mode"
        fullWidth
        size="md"
        value={input.backgroundMode}
        onChange={(backgroundMode) => updateInput(setInput, { backgroundMode })}
        options={BACKGROUND_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
      />

      {input.backgroundMode === "solid" ? (
        <CompactField><ColorField label="Background color" value={input.backgroundColor} onChange={(backgroundColor) => updateInput(setInput, { backgroundColor })} /></CompactField>
      ) : null}
      {input.backgroundMode === "image" ? (
        <UploadBox label={input.backgroundImageDataUrl ? "Replace background image" : "Upload background image"} hint="Local PNG, JPG, or WebP. Nothing is uploaded." accept="image/png,image/jpeg,image/webp" onChange={handleBackground} previewUrl={input.backgroundImageDataUrl} />
      ) : null}
      {input.backgroundMode === "gradient" || input.backgroundMode === "mesh" ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
          <div className="mb-3 h-12 rounded-[var(--radius-sm)] border border-black/5" style={{ background: `linear-gradient(${input.gradientAngle}deg, ${input.gradientFrom}, ${input.gradientTo})` }} />
          <FieldGroup>
            <ColorField label="From" value={input.gradientFrom} onChange={(gradientFrom) => updateInput(setInput, { gradientFrom })} />
            <ColorField label="To" value={input.gradientTo} onChange={(gradientTo) => updateInput(setInput, { gradientTo })} />
          </FieldGroup>
        </div>
      ) : null}

      <Disclosure title="Content" description="Optional title, subtitle, badge, and footer text.">
        <div className="grid gap-2 text-xs text-[var(--color-text-secondary)] sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
            <input type="checkbox" checked={input.showText} onChange={(event) => updateInput(setInput, { showText: event.target.checked })} />
            Text overlay
          </label>
          {input.showText ? <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
            <input type="checkbox" checked={input.showBadge} onChange={(event) => updateInput(setInput, { showBadge: event.target.checked })} />
            Badge
          </label> : null}
          <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
            <input type="checkbox" checked={input.showFooter} onChange={(event) => updateInput(setInput, { showFooter: event.target.checked })} />
            Footer
          </label>
        </div>
        {input.showText ? (
          <>
            <CompactField label="Title"><Input value={input.title} onChange={(event) => updateInput(setInput, { title: event.target.value })} /></CompactField>
            <CompactField label="Subtitle"><Textarea minRows={3} value={input.subtitle} onChange={(event) => updateInput(setInput, { subtitle: event.target.value })} /></CompactField>
          </>
        ) : null}
        <FieldGroup>
          {input.showText && input.showBadge ? <CompactField label="Badge"><Input value={input.badge} onChange={(event) => updateInput(setInput, { badge: event.target.value })} /></CompactField> : null}
          {input.showFooter ? <CompactField label="Footer"><Input value={input.footer} onChange={(event) => updateInput(setInput, { footer: event.target.value })} /></CompactField> : null}
        </FieldGroup>
      </Disclosure>

      <Disclosure title="Advanced appearance" description="Fine-tune colors, angle, browser chrome text, and filenames.">
        {input.backgroundMode === "gradient" || input.backgroundMode === "mesh" ? (
          <SliderNumberField label="Gradient angle" min={0} max={360} value={input.gradientAngle} unit="°" onChange={(gradientAngle) => updateInput(setInput, { gradientAngle })} />
        ) : null}
        <CompactField><ColorField label="Accent color" value={input.accentColor} onChange={(accentColor) => updateInput(setInput, { accentColor })} /></CompactField>
        {input.showText || input.showFooter || input.backgroundMode === "mesh" ? (
          <FieldGroup>
            <CompactField><ColorField label="Foreground" value={input.foregroundColor} onChange={(foregroundColor) => updateInput(setInput, { foregroundColor })} /></CompactField>
            {input.showText ? <CompactField><ColorField label="Muted text" value={input.mutedColor} onChange={(mutedColor) => updateInput(setInput, { mutedColor })} /></CompactField> : null}
          </FieldGroup>
        ) : null}
        {input.device === "browser" && input.showDeviceChrome ? <CompactField label="Browser URL"><Input value={input.browserUrl} onChange={(event) => updateInput(setInput, { browserUrl: event.target.value })} /></CompactField> : null}
        <CompactField label="File prefix"><Input value={input.filePrefix} onChange={(event) => updateInput(setInput, { filePrefix: event.target.value })} /></CompactField>
      </Disclosure>
    </ControlSection>
  );
}

function ExportControls({ input, setInput }: { input: MockupInput; setInput: Dispatch<SetStateAction<MockupInput>> }) {
  const pack = EXPORT_PACKS.find((item) => item.id === input.exportPackId) ?? EXPORT_PACKS[0];
  const firstSize = pack.sizes[0];
  const previewMatchesFirstSize = firstSize ? input.canvasWidth === firstSize.width && input.canvasHeight === firstSize.height : false;

  return (
    <ControlSection title="Export" description="Choose the destination pack. The primary export buttons stay directly below the preview.">
      <div className="grid grid-cols-2 gap-2">
        {EXPORT_PACKS.filter((option) => option.id !== "complete").map((option) => {
          const selected = option.id === input.exportPackId;
          const ratio = option.sizes[0] ? option.sizes[0].width / option.sizes[0].height : 1;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => updateInput(setInput, { exportPackId: option.id })}
              className={cn(
                "rounded-[var(--radius-md)] border p-2.5 text-left transition",
                selected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-default)]",
              )}
            >
              <div className="mb-2 flex h-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface-subtle)]">
                <div className="max-h-7 max-w-12 rounded-[3px] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)]" style={{ width: ratio >= 1 ? 42 : 22, height: ratio >= 1 ? Math.max(18, 42 / ratio) : 30 }} />
              </div>
              <span className="block text-xs font-bold leading-4 text-[var(--color-text-primary)]">{option.title.replace(" Pack", "")}</span>
              <span className="mt-0.5 block text-xs text-[var(--color-text-tertiary)]">{option.sizes.length} sizes</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => updateInput(setInput, { exportPackId: "complete" })}
        className={cn(
          "flex w-full items-center justify-between rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition",
          input.exportPackId === "complete"
            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
            : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-default)]",
        )}
      >
        <span className="text-xs font-bold text-[var(--color-text-primary)]">Complete mockup kit</span>
        <span className="font-mono text-xs font-bold text-[var(--color-text-tertiary)]">{EXPORT_PACKS.find((option) => option.id === "complete")?.sizes.length ?? 0} sizes</span>
      </button>

      <Disclosure title="Pack sizes & preview canvas" description={`${pack.title} · ${pack.sizes.length} output sizes`}>
        <div className="grid gap-2">
          {pack.sizes.slice(0, 4).map((size) => (
            <div key={size.id} className="flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-base)] px-3 py-2 text-xs">
              <span className="min-w-0 truncate font-bold text-[var(--color-text-primary)]">{size.label}</span>
              <span className="shrink-0 font-mono text-[var(--color-text-tertiary)]">{size.width}×{size.height}</span>
            </div>
          ))}
        </div>
        <FieldGroup>
          <SliderNumberField label="Preview width" min={640} max={3000} step={10} value={input.canvasWidth} unit="px" onChange={(canvasWidth) => updateInput(setInput, { canvasWidth })} />
          <SliderNumberField label="Preview height" min={480} max={3000} step={10} value={input.canvasHeight} unit="px" onChange={(canvasHeight) => updateInput(setInput, { canvasHeight })} />
        </FieldGroup>
        {firstSize ? (
          <Button size="sm" variant={previewMatchesFirstSize ? "secondary" : "ghost"} onClick={() => updateInput(setInput, { canvasWidth: firstSize.width, canvasHeight: firstSize.height })}>
            {previewMatchesFirstSize ? "Preview matches first size" : `Match ${firstSize.label}`}
          </Button>
        ) : null}
      </Disclosure>
    </ControlSection>
  );
}


function PreviewPanel({ previewUrl, input, status, onScreenshot }: { previewUrl: string; input: MockupInput; status: Status; onScreenshot: (file: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const aspect = input.canvasWidth / input.canvasHeight;
  const statusLabel = status === "generating" ? "Rendering…" : status === "error" ? "Preview error" : "Private · local";
  const pack = EXPORT_PACKS.find((item) => item.id === input.exportPackId);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onScreenshot(file);
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col bg-[radial-gradient(circle_at_top,var(--color-primary-soft),transparent_34%),var(--color-surface-subtle)] p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] px-3 py-2 shadow-[var(--shadow-xs)]">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-secondary)]">
          <span className="font-black text-[var(--color-text-primary)]">Preview</span>
          <span className="text-[var(--color-text-tertiary)]">{formatRatio(input.canvasWidth, input.canvasHeight)}</span>
          <span className="capitalize text-[var(--color-text-tertiary)]">{input.device}</span>
          <span className="capitalize text-[var(--color-text-tertiary)]">{input.fitMode}</span>
          <span className="hidden text-[var(--color-text-tertiary)] sm:inline">{pack?.title ?? input.exportPackId}</span>
        </div>
        <span className="rounded-[var(--radius-full)] bg-[var(--color-surface-subtle)] px-2.5 py-1 text-xs font-bold text-[var(--color-text-secondary)]">{statusLabel}</span>
      </div>

      <div
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={handleDrop}
        className={cn(
          "relative flex min-h-[330px] flex-1 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-surface-raised)] p-3 transition sm:p-4",
          dragging ? "border-[var(--color-primary)] ring-4 ring-[var(--color-primary-soft)]" : "border-[var(--color-border-subtle)]",
        )}
      >
        {input.screenshotDataUrl && previewUrl ? (
          <img
            src={previewUrl}
            alt="Generated app screenshot mockup preview"
            className="max-h-[66vh] w-full max-w-full rounded-[var(--radius-md)] object-contain shadow-[var(--shadow-lg)]"
            style={{ aspectRatio: String(aspect) }}
          />
        ) : (
          <label className="flex w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-6 py-12 text-center transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]">
              <MonitorSmartphone className="h-8 w-8" />
            </div>
            <span className="text-base font-black text-[var(--color-text-primary)]">Drop your screenshot here</span>
            <span className="mt-1 text-sm text-[var(--color-text-secondary)]">or click to choose an image</span>
            <span className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">PNG · JPG · WebP · processed locally</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onScreenshot(file);
                event.target.value = "";
              }}
            />
          </label>
        )}

        {dragging ? (
          <div className="pointer-events-none absolute inset-3 flex items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)]/95 backdrop-blur-sm">
            <div className="text-center">
              <UploadCloud className="mx-auto h-9 w-9 text-[var(--color-primary-text-strong)]" />
              <p className="mt-2 text-sm font-black text-[var(--color-text-primary)]">Drop to replace screenshot</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}


function ReadinessPanel({ input, assets }: { input: MockupInput; assets: GeneratedMockupAsset[] }) {
  const checks = createReadinessChecks(input, assets);
  const score = scoreReadiness(checks);
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <MiniLabel>Readiness score</MiniLabel>
          <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">{score}/100</p>
        </div>
        <div className="h-16 w-16 rounded-full border-4 border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-center text-sm font-black leading-[3.5rem] text-[var(--color-primary-text-strong)]">{score}</div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((check) => (
          <div key={check.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
              <CheckCircle2 className={cn("h-4 w-4", check.passed ? "text-[var(--color-success-text)]" : "text-[var(--color-warning-text)]")} />
              {check.label}
            </div>
            <p className="mt-1 text-xs leading-4 text-[var(--color-text-tertiary)]">{check.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeneratedFilesPanel({ assets, checks, downloadsEnabled, onDownload }: { assets: GeneratedMockupAsset[]; checks: PackageCheckResult[]; downloadsEnabled: boolean; onDownload: (asset: GeneratedMockupAsset) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-xs)]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <MiniLabel>Generated files</MiniLabel>
          <span className="text-xs text-[var(--color-text-tertiary)]">{assets.length} files</span>
        </div>
        {assets.length ? (
          <div className="grid gap-2">
            {assets.map((asset) => (
              <div key={asset.filename} className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{asset.filename}</p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">{asset.width}×{asset.height} · {formatBytes(asset.blob.size)}</p>
                </div>
                <Button size="sm" variant="secondary" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={() => onDownload(asset)} disabled={!downloadsEnabled}>Download</Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-subtle)] p-4 text-sm text-[var(--color-text-secondary)]">Generate an export pack to see downloadable PNG files.</p>
        )}
        {assets.length && !downloadsEnabled ? <p className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-xs font-semibold text-[var(--color-warning-text)]">These PNGs were generated from older settings. Regenerate the pack before downloading.</p> : null}
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-xs)]">
        <MiniLabel>Package check</MiniLabel>
        <div className="mt-3 grid gap-2">
          {checks.map((check) => (
            <div key={check.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
              <p className={cn("text-xs font-bold", check.level === "error" ? "text-[var(--color-danger-text)]" : check.level === "warning" ? "text-[var(--color-warning-text)]" : "text-[var(--color-success-text)]")}>{check.title}</p>
              <p className="mt-1 text-xs leading-4 text-[var(--color-text-tertiary)]">{check.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductionHandoffPanel({ input, assets, warnings }: { input: MockupInput; assets: GeneratedMockupAsset[]; warnings: MockupWarning[] }) {
  const hasRealScreenshot = Boolean(input.screenshotDataUrl);
  const generatedTotal = assets.reduce((sum, asset) => sum + asset.blob.size, 0);
  const checks = [
    { id: "source", label: hasRealScreenshot ? "Real screenshot loaded" : "Placeholder mode", detail: hasRealScreenshot ? `${input.screenshotWidth}×${input.screenshotHeight} source ready.` : "Upload a final screenshot before campaign export.", tone: hasRealScreenshot ? "good" : "warn" },
    { id: "crop", label: getCropSummary(input), detail: input.fitMode === "cover" ? "Cover fills the frame and may crop source edges." : "Contain preserves the whole screenshot inside the frame.", tone: getCropSummary(input) === "High crop" ? "warn" : "good" },
    { id: "pack", label: `${EXPORT_PACKS.find((pack) => pack.id === input.exportPackId)?.sizes.length ?? 0} output sizes`, detail: `${input.exportPackId.replace(/-/g, " ")} pack selected for current handoff.`, tone: "good" },
    { id: "warnings", label: warnings.length ? `${warnings.length} readiness note${warnings.length === 1 ? "" : "s"}` : "No blocking warnings", detail: warnings[0]?.message ?? "Frame, text, and export setup look usable.", tone: warnings.some((warning) => warning.level === "error") ? "bad" : warnings.length ? "warn" : "good" },
    { id: "assets", label: assets.length ? `${assets.length} files generated` : "No generated pack yet", detail: assets.length ? `${formatBytes(generatedTotal)} total generated locally.` : "Generate a pack to download PNGs and snippets.", tone: assets.length ? "good" : "warn" },
  ];

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-xs)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <MiniLabel>Production handoff</MiniLabel>
          <p className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">Campaign checks before final export</p>
        </div>
        <span className="rounded-[var(--radius-full)] bg-[var(--color-surface-subtle)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--color-text-secondary)]">local-only</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {checks.map((check) => (
          <div key={check.id} className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
            <p className={cn("truncate text-xs font-bold", check.tone === "bad" ? "text-[var(--color-danger-text)]" : check.tone === "warn" ? "text-[var(--color-warning-text)]" : "text-[var(--color-success-text)]")} title={check.label}>{check.label}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-4 text-[var(--color-text-tertiary)]">{check.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PackageChecker({ onResult }: { onResult: (results: PackageCheckResult[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const [checkedCount, setCheckedCount] = useState(0);
  const [localResults, setLocalResults] = useState<PackageCheckResult[]>([]);
  const warningCount = localResults.filter((result) => result.level === "warning").length;
  const errorCount = localResults.filter((result) => result.level === "error").length;
  const issueCount = warningCount + errorCount;

  async function checkFiles(files: FileList | File[]) {
    const results = await validateExistingPackage(files);
    setCheckedCount(files.length);
    setLocalResults(results);
    onResult(results);
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;
    await checkFiles(files);
    event.target.value = "";
  }

  async function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) await checkFiles(event.dataTransfer.files);
  }

  return (
    <Disclosure title="Local package checker" description="Inspect existing image exports without uploading them.">
      <label
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn("flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed bg-[var(--color-surface-base)] p-4 text-center text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]", dragging ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-border-default)]")}
      >
        <ImageIcon className="h-4 w-4 text-[var(--color-primary-text-strong)]" />
        Drop images here or choose files
        <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleFiles} />
      </label>
      {checkedCount ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--color-text-primary)]">{checkedCount} {checkedCount === 1 ? "file" : "files"} checked</span>
            <span className={cn("text-xs font-bold", localResults.some((result) => result.level === "error") ? "text-[var(--color-danger-text)]" : localResults.some((result) => result.level === "warning") ? "text-[var(--color-warning-text)]" : "text-[var(--color-success-text)]")}>
              {errorCount ? `${errorCount} ${errorCount === 1 ? "error" : "errors"}, ${warningCount} ${warningCount === 1 ? "warning" : "warnings"}` : warningCount ? `${warningCount} ${warningCount === 1 ? "warning" : "warnings"} found` : "Package looks ready"}
            </span>
          </div>
          {issueCount ? (
            <ul className="mt-2 space-y-1 text-xs leading-4 text-[var(--color-text-tertiary)]">
              {localResults.filter((result) => result.level !== "pass").slice(0, 2).map((result) => <li key={result.id}>{result.title}: {result.message}</li>)}
            </ul>
          ) : <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Image types, sizes, and filenames passed the local checks.</p>}
        </div>
      ) : <p className="text-xs leading-4 text-[var(--color-text-tertiary)]">No package checked yet. Choose or drop one or more PNG, JPG, or WebP files.</p>}
    </Disclosure>
  );
}

export default function AppScreenshotMockupClient() {
  const [input, setInput] = useState<MockupInput>(DEFAULT_MOCKUP_INPUT);
  const [previewUrl, setPreviewUrl] = useState("");
  const [assets, setAssets] = useState<GeneratedMockupAsset[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("Ready.");
  const [checkerResults, setCheckerResults] = useState<PackageCheckResult[]>([]);
  const [generatedFingerprint, setGeneratedFingerprint] = useState("");
  const [projectMessage, setProjectMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("generating");
    renderMockupDataUrl(input)
      .then((url) => {
        if (cancelled) return;
        setPreviewUrl(url);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setStatusMessage(error instanceof Error ? error.message : "Could not render preview.");
      });
    return () => {
      cancelled = true;
    };
  }, [input]);

  useEffect(() => () => revokeMockupAssetUrls(assets), [assets]);

  const warnings = useMemo(() => validateMockupInput(input), [input]);
  const generatedChecks = useMemo(() => validateGeneratedAssets(assets), [assets]);
  const htmlSnippet = useMemo(() => createHtmlFigureSnippet(input, assets[0]), [input, assets]);
  const pictureSnippet = useMemo(() => createResponsivePictureSnippet(input, assets), [input, assets]);
  const nextSnippet = useMemo(() => createNextImageSnippet(input, assets[0]), [input, assets]);
  const cssSnippet = useMemo(() => createCssSnippet(), []);
  const cssVariablesSnippet = useMemo(() => createCssVariablesSnippet(input), [input]);
  const tokenSnippet = useMemo(() => createDesignTokenSnippet(input, assets), [input, assets]);
  const currentFingerprint = useMemo(() => createMockupFingerprint(input), [input]);
  const productionSummary = useMemo(() => summarizeMockupProduction(input, assets, generatedFingerprint), [input, assets, generatedFingerprint]);
  const packageIsFresh = assets.length > 0 && generatedFingerprint === currentFingerprint && productionSummary.isFresh;

  async function generateAssets() {
    setStatus("generating");
    setStatusMessage("Generating export pack…");
    try {
      const nextAssets = await generateMockupAssets(input);
      revokeMockupAssetUrls(assets);
      setAssets(nextAssets);
      setGeneratedFingerprint(createMockupFingerprint(input));
      setStatus("ready");
      setStatusMessage(`Generated ${nextAssets.length} PNG files.`);
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Could not generate assets.");
    }
  }

  async function downloadZip() {
    if (!packageIsFresh) {
      setStatusMessage("Regenerate the export pack before downloading the ZIP.");
      return;
    }
    const zip = await createZipArchive([
      ...assets.map((asset) => ({ filename: asset.filename, data: asset.blob, mimeType: asset.mimeType })),
      { filename: "README.md", data: createReadme(input, assets), mimeType: "text/markdown" },
      { filename: "html-figure-snippet.html", data: createHtmlFigureSnippet(input, assets[0]), mimeType: "text/html" },
      { filename: "next-image-snippet.tsx", data: createNextImageSnippet(input, assets[0]), mimeType: "text/plain" },
      { filename: "responsive-picture-snippet.html", data: createResponsivePictureSnippet(input, assets), mimeType: "text/html" },
      { filename: "mockup-styles.css", data: createCssSnippet(), mimeType: "text/css" },
      { filename: "mockup-variables.css", data: createCssVariablesSnippet(input), mimeType: "text/css" },
      { filename: "mockup.tokens.json", data: createDesignTokenSnippet(input, assets), mimeType: "application/json" },
      { filename: "mockup-project.json", data: createMockupProjectJson(input), mimeType: "application/json" },
      { filename: "production-report.md", data: createMockupMarkdownReport(input, assets, generatedFingerprint), mimeType: "text/markdown" },
      { filename: "production-metrics.csv", data: createMockupMetricsCsv(input, assets, generatedFingerprint), mimeType: "text/csv" },
    ]);
    downloadBlobFile({ blob: zip, filename: `${input.filePrefix || "app-mockup"}-mockup-pack.zip` });
  }

  function downloadTextFile(filename: string, content: string, type: string) {
    downloadBlobFile({ blob: new Blob([content], { type }), filename });
  }

  function exportProject() {
    downloadTextFile(`${input.filePrefix || "app-mockup"}-project.json`, createMockupProjectJson(input), "application/json;charset=utf-8");
    setProjectMessage("Project JSON downloaded without uploaded image bytes.");
  }

  function exportReport() {
    downloadTextFile(`${input.filePrefix || "app-mockup"}-production-report.md`, createMockupMarkdownReport(input, assets, generatedFingerprint), "text/markdown;charset=utf-8");
    setProjectMessage("Production report downloaded.");
  }

  function exportCsv() {
    downloadTextFile(`${input.filePrefix || "app-mockup"}-production-metrics.csv`, createMockupMetricsCsv(input, assets, generatedFingerprint), "text/csv;charset=utf-8");
    setProjectMessage("Production metrics downloaded.");
  }

  async function importProject(file: File) {
    if (!file.size) {
      setProjectMessage("The selected project file is empty.");
      return;
    }
    if (file.size > MAX_MOCKUP_PROJECT_BYTES) {
      setProjectMessage("Project files must be 1 MB or smaller.");
      return;
    }
    try {
      const project = parseMockupProjectJson(await file.text());
      revokeMockupAssetUrls(assets);
      setAssets([]);
      setGeneratedFingerprint("");
      setCheckerResults([]);
      setInput(project.input);
      setStatusMessage("Project settings imported. Reattach the screenshot and optional background image.");
      setProjectMessage(project.sourceReferences.screenshotName ? `Imported settings from ${project.sourceReferences.screenshotName}; local image bytes were not embedded.` : "Project settings imported. Reattach local images before final export.");
    } catch (error) {
      setProjectMessage(error instanceof Error ? error.message : "Could not import that project file.");
    }
  }

  function resetProject() {
    revokeMockupAssetUrls(assets);
    setAssets([]);
    setGeneratedFingerprint("");
    setCheckerResults([]);
    setInput(DEFAULT_MOCKUP_INPUT);
    setStatusMessage("Settings reset.");
    setProjectMessage("Project reset to the default preset.");
  }

  function downloadCodeFile(tab: { code: string; filename?: string }) {
    downloadBlobFile({ blob: new Blob([tab.code], { type: "text/plain;charset=utf-8" }), filename: tab.filename ?? "mockup-snippet.txt" });
  }

  const controls = (
    <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)]">
      <SourceControls input={input} setInput={setInput} setStatusMessage={setStatusMessage} />
      <DeviceControls input={input} setInput={setInput} />
      <QuickPresets setInput={setInput} />
      <DesignControls input={input} setInput={setInput} setStatusMessage={setStatusMessage} />
      <ExportControls input={input} setInput={setInput} />
    </div>
  );

  const actions = (
    <>
      <div className="flex min-w-0 flex-col gap-1 text-xs text-[var(--color-text-secondary)]">
        <span className="font-bold text-[var(--color-text-primary)]">{statusMessage}</span>
        <span>{assets.length ? `${assets.length} PNG files · ${formatBytes(assets.reduce((sum, asset) => sum + asset.blob.size, 0))}${packageIsFresh ? " · ready to download" : " · update required"}` : "Your screenshot stays local. Prepare the export when the preview looks right."}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" leftIcon={status === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />} onClick={generateAssets} disabled={status === "generating"}>
          {packageIsFresh ? "Refresh export" : "Prepare export"}
        </Button>
        <Button variant="secondary" leftIcon={<FileArchive className="h-4 w-4" />} onClick={downloadZip} disabled={status === "generating" || !packageIsFresh}>
          Download ZIP
        </Button>
      </div>
    </>
  );

  const codeTabs = [
    { id: "html", label: "HTML", code: htmlSnippet, language: "html", filename: "html-figure-snippet.html" },
    { id: "picture", label: "Picture", code: pictureSnippet, language: "html", filename: "responsive-picture-snippet.html" },
    { id: "next", label: "Next.js", code: nextSnippet, language: "tsx", filename: "next-image-snippet.tsx" },
    { id: "css", label: "CSS", code: cssSnippet, language: "css", filename: "mockup-styles.css" },
    { id: "variables", label: "Variables", code: cssVariablesSnippet, language: "css", filename: "mockup-variables.css" },
    { id: "tokens", label: "Tokens", code: tokenSnippet, language: "json", filename: "mockup.tokens.json" },
  ];

  return (
    <ToolLayoutVisualGenerator
      controlsPosition="right"
      actionsPlacement="under-preview"
      mobileCodeAfterControls
      actionsClassName="sticky bottom-2 z-20 backdrop-blur xl:static"
      previewSlot={
        <PreviewPanel
          previewUrl={previewUrl}
          input={input}
          status={status}
          onScreenshot={(file) => void loadScreenshotFile(file, setInput, setStatusMessage)}
        />
      }
      controlsSlot={controls}
      actionsSlot={actions}
      codeSlot={
        <div className="space-y-5">
          {assets.length ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-4 shadow-[var(--shadow-xs)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[var(--color-text-primary)]">{packageIsFresh ? "Export ready" : "Export needs refresh"}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{assets.length} PNG files · {formatBytes(assets.reduce((sum, asset) => sum + asset.blob.size, 0))}</p>
                </div>
                <Button variant="primary" size="sm" leftIcon={<FileArchive className="h-4 w-4" />} onClick={downloadZip} disabled={!packageIsFresh}>Download ZIP</Button>
              </div>
            </div>
          ) : null}

          <details className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-xs)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 [&::-webkit-details-marker]:hidden">
              <div>
                <p className="text-sm font-black text-[var(--color-text-primary)]">Developer handoff & QA</p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Readiness checks, generated files, package validation, project import/export, and install snippets.</p>
              </div>
              <ChevronDown className="h-5 w-5 shrink-0 text-[var(--color-text-tertiary)] transition group-open:rotate-180" />
            </summary>
            <div className="space-y-5 border-t border-[var(--color-border-subtle)] p-4">
              {warnings.length ? <WarningPanel title="Mockup readiness warnings" messages={mapWarnings(warnings)} /> : null}
              <MockupProductionPanel
                input={input}
                assets={assets}
                generatedFingerprint={generatedFingerprint}
                message={projectMessage}
                onExportProject={exportProject}
                onImportProject={importProject}
                onExportReport={exportReport}
                onExportCsv={exportCsv}
                onReset={resetProject}
              />
              <ProductionHandoffPanel input={input} assets={assets} warnings={warnings} />
              <ReadinessPanel input={input} assets={packageIsFresh ? assets : []} />
              <PackageChecker onResult={setCheckerResults} />
              <GeneratedFilesPanel assets={assets} checks={checkerResults.length ? checkerResults : generatedChecks} downloadsEnabled={packageIsFresh} onDownload={(asset) => downloadBlobFile({ blob: asset.blob, filename: asset.filename })} />
              <CodeOutputPanel title="Install snippets" description="Copy the generated mockup into a landing page, documentation page, or Next.js component." tabs={codeTabs} onDownload={downloadCodeFile} actions={<CopyInlineButton value={assets.map((asset) => asset.filename).join("\n") || input.filePrefix} />} />
            </div>
          </details>
        </div>
      }
    />
  );
}
