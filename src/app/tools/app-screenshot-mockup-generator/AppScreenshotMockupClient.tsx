"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { CheckCircle2, Copy, Download, FileArchive, ImageIcon, Loader2, MonitorSmartphone, Sparkles, UploadCloud } from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { CodeOutputPanel, ColorField, CompactField, ControlSection, SegmentedControl, SliderNumberField, WarningPanel, type WarningMessage } from "@/features/tools/components";
import { ToolLayoutVisualGenerator } from "@/features/tools/layouts";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { cn } from "@/lib/cn";
import { fileToDataUrl, loadImageFromDataUrl, renderMockupDataUrl } from "./canvas";
import { createReadme, generateMockupAssets, revokeMockupAssetUrls } from "./generator";
import { DEFAULT_MOCKUP_INPUT, DEVICE_OPTIONS, EXPORT_PACKS, MAX_UPLOAD_BYTES, QUICK_PRESETS } from "./presets";
import { createCssSnippet, createHtmlFigureSnippet, createNextImageSnippet } from "./snippets";
import type { GeneratedMockupAsset, MockupAlignment, MockupBackgroundMode, MockupDevice, MockupExportPackId, MockupFitMode, MockupInput, MockupOrientation, MockupShadowStyle, MockupWarning, PackageCheckResult } from "./types";
import { createReadinessChecks, scoreReadiness, validateExistingPackage, validateGeneratedAssets, validateMockupInput } from "./validation";
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

function mapWarnings(warnings: MockupWarning[]): WarningMessage[] {
  return warnings.map((warning) => ({
    id: warning.id,
    severity: warning.level === "error" ? "danger" : warning.level,
    title: warning.title,
    message: warning.message,
  }));
}

function CopyInlineButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copyValue() {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  }
  return (
    <Button size="sm" variant="ghost" leftIcon={<Copy className="h-3.5 w-3.5" />} onClick={copyValue}>
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function UploadBox({ label, hint, accept, onChange, previewUrl }: { label: string; hint: string; accept: string; onChange: (file: File) => void; previewUrl?: string }) {
  return (
    <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-3 text-center transition hover:border-[var(--color-primary)] hover:bg-[var(--color-control-hover)]">
      {previewUrl ? <img src={previewUrl} alt="Uploaded preview" className="h-16 w-24 rounded-[var(--radius-sm)] object-cover shadow-[var(--shadow-xs)]" /> : <UploadCloud className="h-7 w-7 text-[var(--color-primary)]" />}
      <span className="text-xs font-bold text-[var(--color-text-primary)]">{label}</span>
      <span className="text-[11px] leading-4 text-[var(--color-text-tertiary)]">{hint}</span>
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
  return (
    <ControlSection title="Quick mockup presets" description="Start from a real use case, then tune the frame, copy, and export pack.">
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

function SourceControls({ input, setInput, setStatusMessage }: { input: MockupInput; setInput: Dispatch<SetStateAction<MockupInput>>; setStatusMessage: (message: string) => void }) {
  async function handleScreenshot(file: File) {
    if (file.size > MAX_UPLOAD_BYTES) {
      setStatusMessage("Screenshot is too large. Try an image below 12 MB.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    const image = await loadImageFromDataUrl(dataUrl);
    updateInput(setInput, { screenshotDataUrl: dataUrl, screenshotName: file.name, screenshotWidth: image.width, screenshotHeight: image.height });
    setStatusMessage(`Loaded ${file.name} (${image.width}×${image.height}).`);
  }

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
    <ControlSection title="Source images" description="Upload an app screenshot and optionally a background image. Everything stays local in the browser.">
      <FieldGroup>
        <UploadBox label="Upload screenshot" hint="PNG, JPG, or WebP up to 12 MB" accept="image/png,image/jpeg,image/webp" onChange={handleScreenshot} previewUrl={input.screenshotDataUrl} />
        <UploadBox label="Optional background" hint="Use as full-canvas backdrop" accept="image/png,image/jpeg,image/webp" onChange={handleBackground} previewUrl={input.backgroundImageDataUrl} />
      </FieldGroup>
      {input.screenshotName ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
          <strong className="text-[var(--color-text-primary)]">{input.screenshotName}</strong> · {input.screenshotWidth}×{input.screenshotHeight}
        </div>
      ) : null}
    </ControlSection>
  );
}

function DeviceControls({ input, setInput }: { input: MockupInput; setInput: Dispatch<SetStateAction<MockupInput>> }) {
  return (
    <ControlSection title="Device frame" description="Choose the presentation frame and how the screenshot fits inside it.">
      <SegmentedControl<MockupDevice>
        ariaLabel="Device frame"
        fullWidth
        size="md"
        value={input.device}
        onChange={(device) => updateInput(setInput, { device })}
        options={DEVICE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
      />
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
      </FieldGroup>
      <FieldGroup>
        <SliderNumberField label="Device scale" min={35} max={115} value={input.deviceScale} unit="%" onChange={(deviceScale) => updateInput(setInput, { deviceScale })} />
        <SliderNumberField label="Rotation" min={-12} max={12} value={input.rotate} unit="°" onChange={(rotate) => updateInput(setInput, { rotate })} />
        <SliderNumberField label="Frame radius" min={0} max={72} value={input.frameRadius} unit="px" onChange={(frameRadius) => updateInput(setInput, { frameRadius })} />
        <SliderNumberField label="Canvas padding" min={32} max={180} value={input.padding} unit="px" onChange={(padding) => updateInput(setInput, { padding })} />
      </FieldGroup>
      <div className="grid gap-2 text-xs text-[var(--color-text-secondary)]">
        <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
          <input type="checkbox" checked={input.showDeviceChrome} onChange={(event) => updateInput(setInput, { showDeviceChrome: event.target.checked })} />
          Show device/browser chrome
        </label>
        <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
          <input type="checkbox" checked={input.showReflection} onChange={(event) => updateInput(setInput, { showReflection: event.target.checked })} />
          Add subtle glass reflection
        </label>
        <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
          <input type="checkbox" checked={input.showSafeArea} onChange={(event) => updateInput(setInput, { showSafeArea: event.target.checked })} />
          Show export safe-area guide
        </label>
      </div>
    </ControlSection>
  );
}

function DesignControls({ input, setInput }: { input: MockupInput; setInput: Dispatch<SetStateAction<MockupInput>> }) {
  return (
    <ControlSection title="Design and copy" description="Tune the background, colors, marketing copy, and export naming.">
      <SegmentedControl<MockupBackgroundMode>
        ariaLabel="Background mode"
        fullWidth
        size="md"
        value={input.backgroundMode}
        onChange={(backgroundMode) => updateInput(setInput, { backgroundMode })}
        options={BACKGROUND_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
      />
      <FieldGroup>
        <ColorField label="Background" value={input.backgroundColor} onChange={(backgroundColor) => updateInput(setInput, { backgroundColor })} />
        <ColorField label="Foreground" value={input.foregroundColor} onChange={(foregroundColor) => updateInput(setInput, { foregroundColor })} />
        <ColorField label="Muted text" value={input.mutedColor} onChange={(mutedColor) => updateInput(setInput, { mutedColor })} />
        <ColorField label="Accent" value={input.accentColor} onChange={(accentColor) => updateInput(setInput, { accentColor })} />
      </FieldGroup>
      {input.backgroundMode === "gradient" || input.backgroundMode === "mesh" ? (
        <FieldGroup>
          <ColorField label="Gradient from" value={input.gradientFrom} onChange={(gradientFrom) => updateInput(setInput, { gradientFrom })} />
          <ColorField label="Gradient to" value={input.gradientTo} onChange={(gradientTo) => updateInput(setInput, { gradientTo })} />
          <SliderNumberField label="Gradient angle" min={0} max={360} value={input.gradientAngle} unit="°" onChange={(gradientAngle) => updateInput(setInput, { gradientAngle })} />
        </FieldGroup>
      ) : null}
      <CompactField label="Title">
        <Input value={input.title} onChange={(event) => updateInput(setInput, { title: event.target.value })} />
      </CompactField>
      <CompactField label="Subtitle">
        <Textarea minRows={3} value={input.subtitle} onChange={(event) => updateInput(setInput, { subtitle: event.target.value })} />
      </CompactField>
      <FieldGroup>
        <CompactField label="Badge">
          <Input value={input.badge} onChange={(event) => updateInput(setInput, { badge: event.target.value })} />
        </CompactField>
        <CompactField label="Footer">
          <Input value={input.footer} onChange={(event) => updateInput(setInput, { footer: event.target.value })} />
        </CompactField>
        <CompactField label="Browser URL">
          <Input value={input.browserUrl} onChange={(event) => updateInput(setInput, { browserUrl: event.target.value })} />
        </CompactField>
        <CompactField label="File prefix">
          <Input value={input.filePrefix} onChange={(event) => updateInput(setInput, { filePrefix: event.target.value })} />
        </CompactField>
      </FieldGroup>
      <div className="grid gap-2 text-xs text-[var(--color-text-secondary)] sm:grid-cols-3">
        <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
          <input type="checkbox" checked={input.showText} onChange={(event) => updateInput(setInput, { showText: event.target.checked })} />
          Text overlay
        </label>
        <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
          <input type="checkbox" checked={input.showBadge} onChange={(event) => updateInput(setInput, { showBadge: event.target.checked })} />
          Badge
        </label>
        <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
          <input type="checkbox" checked={input.showFooter} onChange={(event) => updateInput(setInput, { showFooter: event.target.checked })} />
          Footer
        </label>
      </div>
    </ControlSection>
  );
}

function ExportControls({ input, setInput }: { input: MockupInput; setInput: Dispatch<SetStateAction<MockupInput>> }) {
  const pack = EXPORT_PACKS.find((item) => item.id === input.exportPackId) ?? EXPORT_PACKS[0];
  return (
    <ControlSection title="Export pack" description="Choose the output sizes for your mockup package.">
      <CompactField label="Pack">
        <Select value={input.exportPackId} onChange={(event) => updateInput(setInput, { exportPackId: event.target.value as MockupExportPackId })}>
          {EXPORT_PACKS.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}
        </Select>
      </CompactField>
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
        <p className="text-xs leading-5 text-[var(--color-text-secondary)]">{pack.description}</p>
        <div className="mt-3 grid gap-2">
          {pack.sizes.map((size) => (
            <div key={size.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs">
              <span className="font-bold text-[var(--color-text-primary)]">{size.label}</span>
              <span className="font-mono text-[var(--color-text-tertiary)]">{size.width}×{size.height}</span>
            </div>
          ))}
        </div>
      </div>
    </ControlSection>
  );
}

function PreviewPanel({ previewUrl, input, status }: { previewUrl: string; input: MockupInput; status: Status }) {
  const aspect = input.canvasWidth / input.canvasHeight;
  return (
    <div className="flex h-full min-h-[420px] flex-col gap-4 bg-[radial-gradient(circle_at_top,var(--color-primary-soft),transparent_34%),var(--color-surface-subtle)] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Live mockup preview</p>
          <h3 className="mt-1 text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{input.canvasWidth}×{input.canvasHeight} canvas</h3>
        </div>
        <div className="rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] px-3 py-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
          {status === "generating" ? "Rendering…" : "Client-only"}
        </div>
      </div>
      <div className="flex min-h-[340px] flex-1 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3 shadow-[var(--shadow-card)]">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Generated app screenshot mockup preview"
            className="max-h-[66vh] w-full max-w-full rounded-[var(--radius-md)] object-contain shadow-[var(--shadow-lg)]"
            style={{ aspectRatio: String(aspect) }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center text-sm text-[var(--color-text-secondary)]">
            <MonitorSmartphone className="h-10 w-10 text-[var(--color-primary)]" />
            <span>Upload a screenshot or use the placeholder preview.</span>
          </div>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <PreviewStat title="Frame" value={input.device} />
        <PreviewStat title="Pack" value={input.exportPackId} />
        <PreviewStat title="Fit" value={input.fitMode} />
      </div>
    </div>
  );
}

function PreviewStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-3">
      <MiniLabel>{title}</MiniLabel>
      <p className="mt-1 text-sm font-bold capitalize text-[var(--color-text-primary)]">{value.replace(/-/g, " ")}</p>
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
        <div className="h-16 w-16 rounded-full border-4 border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-center text-sm font-black leading-[3.5rem] text-[var(--color-primary)]">{score}</div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((check) => (
          <div key={check.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
              <CheckCircle2 className={cn("h-4 w-4", check.passed ? "text-[var(--color-success-text)]" : "text-[var(--color-warning-text)]")} />
              {check.label}
            </div>
            <p className="mt-1 text-[11px] leading-4 text-[var(--color-text-tertiary)]">{check.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeneratedFilesPanel({ assets, checks, onDownload }: { assets: GeneratedMockupAsset[]; checks: PackageCheckResult[]; onDownload: (asset: GeneratedMockupAsset) => void }) {
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
                <Button size="sm" variant="secondary" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={() => onDownload(asset)}>Download</Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-subtle)] p-4 text-sm text-[var(--color-text-secondary)]">Generate an export pack to see downloadable PNG files.</p>
        )}
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-xs)]">
        <MiniLabel>Package check</MiniLabel>
        <div className="mt-3 grid gap-2">
          {checks.map((check) => (
            <div key={check.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
              <p className={cn("text-xs font-bold", check.level === "error" ? "text-[var(--color-danger-text)]" : check.level === "warning" ? "text-[var(--color-warning-text)]" : "text-[var(--color-success-text)]")}>{check.title}</p>
              <p className="mt-1 text-[11px] leading-4 text-[var(--color-text-tertiary)]">{check.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PackageChecker({ onResult }: { onResult: (results: PackageCheckResult[]) => void }) {
  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;
    const results = await validateExistingPackage(files);
    onResult(results);
  }

  return (
    <ControlSection title="Local package checker" description="Drop existing mockup exports to check file types, file sizes, and URL-friendly names.">
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4 text-sm font-bold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]">
        <ImageIcon className="h-4 w-4 text-[var(--color-primary)]" />
        Check image files
        <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleFiles} />
      </label>
    </ControlSection>
  );
}

export default function AppScreenshotMockupClient() {
  const [input, setInput] = useState<MockupInput>(DEFAULT_MOCKUP_INPUT);
  const [previewUrl, setPreviewUrl] = useState("");
  const [assets, setAssets] = useState<GeneratedMockupAsset[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("Ready.");
  const [checkerResults, setCheckerResults] = useState<PackageCheckResult[]>([]);

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
  const nextSnippet = useMemo(() => createNextImageSnippet(input, assets[0]), [input, assets]);
  const cssSnippet = useMemo(() => createCssSnippet(), []);

  async function generateAssets() {
    setStatus("generating");
    setStatusMessage("Generating export pack…");
    try {
      const nextAssets = await generateMockupAssets(input);
      revokeMockupAssetUrls(assets);
      setAssets(nextAssets);
      setStatus("ready");
      setStatusMessage(`Generated ${nextAssets.length} PNG files.`);
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Could not generate assets.");
    }
  }

  async function downloadZip() {
    const currentAssets = assets.length ? assets : await generateMockupAssets(input);
    if (!assets.length) setAssets(currentAssets);
    const zip = await createZipArchive([
      ...currentAssets.map((asset) => ({ filename: asset.filename, data: asset.blob, mimeType: asset.mimeType })),
      { filename: "README.md", data: createReadme(input, currentAssets), mimeType: "text/markdown" },
      { filename: "html-figure-snippet.html", data: createHtmlFigureSnippet(input, currentAssets[0]), mimeType: "text/html" },
      { filename: "next-image-snippet.tsx", data: createNextImageSnippet(input, currentAssets[0]), mimeType: "text/plain" },
      { filename: "mockup-styles.css", data: createCssSnippet(), mimeType: "text/css" },
    ]);
    downloadBlobFile({ blob: zip, filename: `${input.filePrefix || "app-mockup"}-mockup-pack.zip` });
  }

  function downloadCodeFile(tab: { code: string; filename?: string }) {
    downloadBlobFile({ blob: new Blob([tab.code], { type: "text/plain;charset=utf-8" }), filename: tab.filename ?? "mockup-snippet.txt" });
  }

  const controls = (
    <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)]">
      <QuickPresets setInput={setInput} />
      <SourceControls input={input} setInput={setInput} setStatusMessage={setStatusMessage} />
      <DeviceControls input={input} setInput={setInput} />
      <DesignControls input={input} setInput={setInput} />
      <ExportControls input={input} setInput={setInput} />
      <PackageChecker onResult={setCheckerResults} />
    </div>
  );

  const actions = (
    <>
      <div className="flex min-w-0 flex-col gap-1 text-xs text-[var(--color-text-secondary)]">
        <span className="font-bold text-[var(--color-text-primary)]">{statusMessage}</span>
        <span>{assets.length ? `${assets.length} generated files · ${formatBytes(assets.reduce((sum, asset) => sum + asset.blob.size, 0))}` : "Generate a pack when the preview looks right."}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" leftIcon={status === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />} onClick={generateAssets} disabled={status === "generating"}>
          Generate pack
        </Button>
        <Button variant="primary" leftIcon={<FileArchive className="h-4 w-4" />} onClick={downloadZip} disabled={status === "generating"}>
          Download ZIP
        </Button>
      </div>
    </>
  );

  const codeTabs = [
    { id: "html", label: "HTML", code: htmlSnippet, language: "html", filename: "html-figure-snippet.html" },
    { id: "next", label: "Next.js", code: nextSnippet, language: "tsx", filename: "next-image-snippet.tsx" },
    { id: "css", label: "CSS", code: cssSnippet, language: "css", filename: "mockup-styles.css" },
  ];

  return (
    <ToolLayoutVisualGenerator
      previewSlot={<PreviewPanel previewUrl={previewUrl} input={input} status={status} />}
      controlsSlot={controls}
      actionsSlot={actions}
      codeSlot={
        <div className="space-y-5">
          {warnings.length ? <WarningPanel title="Mockup readiness warnings" messages={mapWarnings(warnings)} /> : null}
          <ReadinessPanel input={input} assets={assets} />
          <GeneratedFilesPanel assets={assets} checks={checkerResults.length ? checkerResults : generatedChecks} onDownload={(asset) => downloadBlobFile({ blob: asset.blob, filename: asset.filename })} />
          <CodeOutputPanel title="Install snippets" description="Copy the generated mockup into a landing page, documentation page, or Next.js component." tabs={codeTabs} onDownload={downloadCodeFile} actions={<CopyInlineButton value={assets.map((asset) => asset.filename).join("\n") || input.filePrefix} />} />
        </div>
      }
    />
  );
}
