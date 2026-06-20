"use client";

import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { Download, Image as ImageIcon, Images, RefreshCw, Upload } from "lucide-react";
import { Badge, Button, Card, Field, Input, Select, Slider } from "@/components/ui";
import {
  ControlGrid,
  ControlSection,
  ResultPanel,
  ToolActionBar,
  ToolControlPanel,
  WarningPanel,
} from "@/features/tools/components";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { ToolLayoutSingleUtility } from "@/features/tools/layouts";
import type { ConvertedImage, ImageExportFormat, ImageFitMode, ImageWorkbenchPreset } from "./types";
import {
  IMAGE_CONVERTER_PRESETS,
  OUTPUT_FORMATS,
  buildOutputFilename,
  calculateDrawRect,
  calculateResizeDimensions,
  formatBytes,
  resolveOutputFormat,
  savingsPercent,
} from "./utils";

type SourceImage = {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
};

type WorkbenchSettings = {
  format: ImageExportFormat;
  quality: number;
  width: number;
  height: number;
  keepAspectRatio: boolean;
  scalePercent: number;
  fitMode: ImageFitMode;
};

const MAX_IMAGE_FILE_SIZE_BYTES = 16 * 1024 * 1024;

const DEFAULT_SETTINGS: WorkbenchSettings = {
  format: "image/webp",
  quality: 0.84,
  width: 0,
  height: 0,
  keepAspectRatio: true,
  scalePercent: 100,
  fitMode: "contain",
};

const exportFormatOptions: Array<{ label: string; value: ImageExportFormat }> = [
  { label: "Keep original", value: "original" },
  ...OUTPUT_FORMATS.map((format) => ({ label: format.label, value: format.value })),
];

function sourceId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

function sourceDimensions(source: SourceImage, settings: WorkbenchSettings) {
  return calculateResizeDimensions({
    originalWidth: source.width,
    originalHeight: source.height,
    width: settings.width,
    height: settings.height,
    keepAspectRatio: settings.keepAspectRatio,
    scalePercent: settings.scalePercent,
  });
}

async function loadImage(file: File): Promise<SourceImage> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return { id: sourceId(file), file, url, width: image.naturalWidth, height: image.naturalHeight };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

async function convertImage(source: SourceImage, settings: WorkbenchSettings): Promise<ConvertedImage> {
  const image = new Image();
  image.decoding = "async";
  image.src = source.url;
  await image.decode();

  const format = resolveOutputFormat(settings.format, source.file.type);
  const { width, height } = sourceDimensions(source, settings);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported in this browser.");

  if (format === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }

  const rect = calculateDrawRect({
    sourceWidth: source.width,
    sourceHeight: source.height,
    targetWidth: width,
    targetHeight: height,
    fitMode: settings.fitMode,
  });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, rect.dx, rect.dy, rect.dw, rect.dh);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Unable to export image."));
      },
      format,
      format === "image/png" ? undefined : settings.quality,
    );
  });

  return {
    id: source.id,
    name: buildOutputFilename(source.file.name, settings.format, source.file.type),
    size: blob.size,
    width,
    height,
    url: URL.createObjectURL(blob),
    blob,
    mimeType: format,
  };
}

export default function ImageConverterClient() {
  const [sources, setSources] = useState<SourceImage[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [converted, setConverted] = useState<ConvertedImage[]>([]);
  const [settings, setSettings] = useState<WorkbenchSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState("");
  const [converting, setConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sourcesRef = useRef<SourceImage[]>([]);
  const convertedRef = useRef<ConvertedImage[]>([]);

  const selectedSource = sources.find((source) => source.id === selectedId) ?? sources[0] ?? null;
  const selectedConverted = selectedSource ? converted.find((item) => item.id === selectedSource.id) ?? null : null;
  const totalOriginalSize = sources.reduce((sum, source) => sum + source.file.size, 0);
  const totalOutputSize = converted.reduce((sum, item) => sum + item.size, 0);
  const convertedSummary = converted.length
    ? `${converted.length} converted image${converted.length === 1 ? "" : "s"} / ${formatBytes(totalOutputSize)}`
    : "";

  const estimatedDimensions = useMemo(() => {
    if (!selectedSource) return null;
    return sourceDimensions(selectedSource, settings);
  }, [selectedSource, settings]);

  useEffect(() => {
    sourcesRef.current = sources;
  }, [sources]);

  useEffect(() => {
    convertedRef.current = converted;
  }, [converted]);

  useEffect(() => {
    return () => {
      sourcesRef.current.forEach((source) => URL.revokeObjectURL(source.url));
      convertedRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

  function patchSettings(patch: Partial<WorkbenchSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;

    setError("");
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const rejected = files.length - imageFiles.length;
    const allowed = imageFiles.filter((file) => file.size <= MAX_IMAGE_FILE_SIZE_BYTES);
    const tooLarge = imageFiles.length - allowed.length;

    if (!allowed.length) {
      setError("Choose PNG, JPEG, WebP, or another browser-readable image under 16 MB.");
      return;
    }

    try {
      const loaded = await Promise.all(allowed.map(loadImage));
      setSources((current) => {
        const next = [...current, ...loaded];
        if (!selectedId) setSelectedId(next[0]?.id ?? "");
        return next;
      });
      setConverted((current) => {
        current.forEach((item) => URL.revokeObjectURL(item.url));
        return [];
      });
      if (rejected || tooLarge) {
        setError(`${rejected + tooLarge} file${rejected + tooLarge === 1 ? "" : "s"} skipped. Use browser-readable images under ${formatBytes(MAX_IMAGE_FILE_SIZE_BYTES)}.`);
      }
    } catch {
      setError("Could not read one of these images. Try PNG, JPEG, or WebP.");
    }
  }

  function handlePicker(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function updateWidth(value: string) {
    const width = Number(value);
    if (!selectedSource || !settings.keepAspectRatio || !Number.isFinite(width) || width <= 0) {
      patchSettings({ width: Number(value) || 0 });
      return;
    }
    const ratio = selectedSource.width / selectedSource.height;
    patchSettings({ width: Math.round(width), height: Math.round(width / ratio), scalePercent: 100 });
  }

  function updateHeight(value: string) {
    const height = Number(value);
    if (!selectedSource || !settings.keepAspectRatio || !Number.isFinite(height) || height <= 0) {
      patchSettings({ height: Number(value) || 0 });
      return;
    }
    const ratio = selectedSource.width / selectedSource.height;
    patchSettings({ height: Math.round(height), width: Math.round(height * ratio), scalePercent: 100 });
  }

  function applyPreset(preset: ImageWorkbenchPreset) {
    setSettings((current) => ({
      ...current,
      format: preset.format ?? current.format,
      quality: preset.quality ?? current.quality,
      width: preset.width ?? 0,
      height: preset.height ?? 0,
      scalePercent: preset.scalePercent ?? 100,
      fitMode: preset.fitMode ?? current.fitMode,
      keepAspectRatio: !(preset.width && preset.height),
    }));
  }

  async function convertAll() {
    if (!sources.length) {
      setError("Upload one or more images first.");
      return;
    }

    setError("");
    setConverting(true);
    try {
      converted.forEach((item) => URL.revokeObjectURL(item.url));
      const next = await Promise.all(sources.map((source) => convertImage(source, settings)));
      setConverted(next);
    } catch {
      setError("Conversion failed. Your browser may not support this format or image.");
    } finally {
      setConverting(false);
    }
  }

  function downloadOne(item: ConvertedImage) {
    downloadBlobFile({ blob: item.blob, filename: item.name });
  }

  function downloadAll() {
    converted.forEach(downloadOne);
  }

  function reset() {
    sources.forEach((source) => URL.revokeObjectURL(source.url));
    converted.forEach((item) => URL.revokeObjectURL(item.url));
    setSources([]);
    setSelectedId("");
    setConverted([]);
    setSettings(DEFAULT_SETTINGS);
    setError("");
  }

  function samplePreset() {
    applyPreset(IMAGE_CONVERTER_PRESETS.find((preset) => preset.id === "website-hero") ?? IMAGE_CONVERTER_PRESETS[0]);
  }

  return (
    <ToolLayoutSingleUtility
      resultSlot={
        <ResultPanel
          title="Image workbench"
          description="Upload images, choose conversion and resize settings, then export optimized files locally."
          value={
            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(280px,1.05fr)]">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex min-h-[260px] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed p-6 text-center transition ${
                  isDragging
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                    : "border-[var(--color-border-default)] bg-[var(--color-surface-base)]"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/*"
                  className="sr-only"
                  multiple
                  onChange={handlePicker}
                />
                <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)]">
                  <Upload className="h-6 w-6" aria-hidden />
                </div>
                <h2 className="mt-4 text-xl font-black text-[var(--color-text-primary)]">Drop images here</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-secondary)]">
                  Pick PNG, JPEG, WebP, GIF, BMP, or other browser-readable images. Conversion stays in your browser.
                </p>
                <Button className="mt-4" onClick={() => inputRef.current?.click()} leftIcon={<ImageIcon className="h-4 w-4" aria-hidden />}>
                  Choose images
                </Button>
                <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  Up to {formatBytes(MAX_IMAGE_FILE_SIZE_BYTES)} each
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <PreviewCard title="Original" source={selectedSource} />
                <OutputPreviewCard source={selectedSource} converted={selectedConverted} />
              </div>
            </div>
          }
          actions={
            <Button size="sm" variant="secondary" disabled={!converted.length} onClick={downloadAll} leftIcon={<Download className="h-4 w-4" aria-hidden />}>
              Download all
            </Button>
          }
        />
      }
      actionsSlot={
        <ToolActionBar
          copyText={convertedSummary}
          onDownload={downloadAll}
          onReset={reset}
          onSample={samplePreset}
        />
      }
      controlsSlot={
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
          <ToolControlPanel title="Conversion options" description="Choose output format, size, crop behavior, and compression." sticky={false}>
            <ControlSection title="Files">
              {sources.length ? (
                <div className="grid gap-2">
                  {sources.map((source) => {
                    const output = converted.find((item) => item.id === source.id);
                    return (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => setSelectedId(source.id)}
                        className={`rounded-[var(--radius-md)] border p-3 text-left transition focus:outline-none focus:shadow-[var(--focus-ring)] ${
                          selectedSource?.id === source.id
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                            : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate text-sm font-black text-[var(--color-text-primary)]">{source.file.name}</span>
                          {output ? <Badge variant="success">Converted</Badge> : null}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                          {source.width} x {source.height} / {formatBytes(source.file.size)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Card padding="sm" className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  Upload images to see file details and conversion previews.
                </Card>
              )}
            </ControlSection>

            <ControlSection title="Format">
              <Field label="Output format" description="Keep original uses PNG, JPEG, or WebP when the source is supported.">
                <Select value={settings.format} onChange={(event) => patchSettings({ format: event.target.value as ImageExportFormat })}>
                  {exportFormatOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </Select>
              </Field>
            </ControlSection>

            <ControlSection title="Resize">
              <ControlGrid columns={2}>
                <Field label="Width">
                  <Input type="number" min={0} value={settings.width || ""} onChange={(event) => updateWidth(event.target.value)} placeholder={selectedSource ? String(selectedSource.width) : "Auto"} />
                </Field>
                <Field label="Height">
                  <Input type="number" min={0} value={settings.height || ""} onChange={(event) => updateHeight(event.target.value)} placeholder={selectedSource ? String(selectedSource.height) : "Auto"} />
                </Field>
              </ControlGrid>
              <label className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
                <input type="checkbox" checked={settings.keepAspectRatio} onChange={(event) => patchSettings({ keepAspectRatio: event.target.checked })} className="h-4 w-4 accent-[var(--color-primary)]" />
                Keep aspect ratio
              </label>
              <Field label={`Scale: ${settings.scalePercent}%`} description="Used when width and height are left empty.">
                <Slider min={10} max={200} step={5} value={settings.scalePercent} onChange={(event) => patchSettings({ scalePercent: Number(event.target.value), width: 0, height: 0 })} />
              </Field>
              <Field label="Fit mode" description="Contain keeps the whole image, cover crops, stretch fills exactly.">
                <Select value={settings.fitMode} onChange={(event) => patchSettings({ fitMode: event.target.value as ImageFitMode })}>
                  <option value="contain">Contain</option>
                  <option value="cover">Cover</option>
                  <option value="stretch">Stretch</option>
                </Select>
              </Field>
              {estimatedDimensions ? (
                <p className="text-xs font-semibold text-[var(--color-text-tertiary)]">
                  Estimated output: {estimatedDimensions.width} x {estimatedDimensions.height}
                </p>
              ) : null}
            </ControlSection>

            <ControlSection title="Compression">
              <Field label={`Quality: ${Math.round(settings.quality * 100)}%`} description="Applies to JPEG and WebP. Canvas export naturally strips most metadata.">
                <Slider min={35} max={100} step={1} value={Math.round(settings.quality * 100)} disabled={settings.format === "image/png"} onChange={(event) => patchSettings({ quality: Number(event.target.value) / 100 })} />
              </Field>
            </ControlSection>

            <div className="flex flex-wrap gap-2">
              <Button onClick={convertAll} loading={converting} disabled={!sources.length} leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}>
                Convert images
              </Button>
              <Button variant="secondary" onClick={() => inputRef.current?.click()} leftIcon={<Images className="h-4 w-4" aria-hidden />}>
                Add more
              </Button>
            </div>
          </ToolControlPanel>

          <div className="space-y-5">
            <ToolControlPanel title="Presets" description="Start from common creator, web, and sharing sizes." sticky={false}>
              <div className="grid gap-2">
                {IMAGE_CONVERTER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3 text-left transition hover:border-[var(--color-border-strong)] focus:outline-none focus:shadow-[var(--focus-ring)]"
                  >
                    <span className="block text-sm font-black text-[var(--color-text-primary)]">{preset.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">{preset.description}</span>
                  </button>
                ))}
              </div>
            </ToolControlPanel>

            <ToolControlPanel title="File size comparison" description="After conversion, compare original and output sizes." sticky={false}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Original" value={formatBytes(totalOriginalSize)} />
                <Stat label="Converted" value={converted.length ? formatBytes(totalOutputSize) : "-"} />
                <Stat label="Savings" value={converted.length ? `${savingsPercent(totalOriginalSize, totalOutputSize)}%` : "-"} />
                <Stat label="Files" value={`${converted.length}/${sources.length}`} />
              </div>
              {selectedSource && selectedConverted ? (
                <Button className="mt-4" size="sm" variant="secondary" onClick={() => downloadOne(selectedConverted)} leftIcon={<Download className="h-4 w-4" aria-hidden />}>
                  Download selected
                </Button>
              ) : null}
            </ToolControlPanel>
          </div>
        </div>
      }
      infoSlot={
        <WarningPanel
          messages={[
            ...(error ? [{ id: "error", severity: "warning" as const, title: "Image note", message: error }] : []),
            { id: "privacy", severity: "info" as const, title: "Browser-only", message: "Images are decoded, resized, and exported locally with canvas. Files are not uploaded to a server." },
          ]}
        />
      }
    />
  );
}

function PreviewCard({ title, source }: { title: string; source: SourceImage | null }) {
  return (
    <Card padding="md" className="min-w-0">
      <h3 className="text-sm font-black text-[var(--color-text-primary)]">{title}</h3>
      {source ? (
        <>
          {/* Plain img is appropriate here because object URLs are local browser blobs. */}
          <img src={source.url} alt="Original upload preview" className="mt-3 h-64 w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] object-contain" />
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs leading-5 text-[var(--color-text-secondary)]">
            <div><dt className="font-bold">File</dt><dd className="truncate">{source.file.name}</dd></div>
            <div><dt className="font-bold">Size</dt><dd>{formatBytes(source.file.size)}</dd></div>
            <div><dt className="font-bold">Dimensions</dt><dd>{source.width} x {source.height}</dd></div>
            <div><dt className="font-bold">Type</dt><dd>{source.file.type || "Image"}</dd></div>
          </dl>
        </>
      ) : (
        <div className="mt-3 flex h-64 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] text-sm text-[var(--color-text-tertiary)]">
          No image selected.
        </div>
      )}
    </Card>
  );
}

function OutputPreviewCard({ source, converted }: { source: SourceImage | null; converted: ConvertedImage | null }) {
  return (
    <Card padding="md" className="min-w-0">
      <h3 className="text-sm font-black text-[var(--color-text-primary)]">Output preview</h3>
      {converted ? (
        <>
          <img src={converted.url} alt="Converted output preview" className="mt-3 h-64 w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] object-contain" />
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs leading-5 text-[var(--color-text-secondary)]">
            <div><dt className="font-bold">File</dt><dd className="truncate">{converted.name}</dd></div>
            <div><dt className="font-bold">Size</dt><dd>{formatBytes(converted.size)}</dd></div>
            <div><dt className="font-bold">Dimensions</dt><dd>{converted.width} x {converted.height}</dd></div>
            <div><dt className="font-bold">Savings</dt><dd>{source ? `${savingsPercent(source.file.size, converted.size)}%` : "-"}</dd></div>
          </dl>
        </>
      ) : (
        <div className="mt-3 flex h-64 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] px-4 text-center text-sm leading-6 text-[var(--color-text-tertiary)]">
          Converted preview appears after export.
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <p className="text-lg font-black text-[var(--color-text-primary)]">{value}</p>
      <p className="text-xs text-[var(--color-text-tertiary)]">{label}</p>
    </div>
  );
}
