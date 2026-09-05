"use client";

import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { Download, Image as ImageIcon, Images, RefreshCw, Upload } from "lucide-react";
import { Badge, Button, Card, Field, Input, Select, Slider } from "@/components/ui";
import {
  ControlGrid,
  ControlSection,
  ResultPanel,
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
  const [showAllPresets, setShowAllPresets] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sourcesRef = useRef<SourceImage[]>([]);
  const convertedRef = useRef<ConvertedImage[]>([]);

  const selectedSource = sources.find((source) => source.id === selectedId) ?? sources[0] ?? null;
  const selectedConverted = selectedSource ? converted.find((item) => item.id === selectedSource.id) ?? null : null;
  const totalOriginalSize = sources.reduce((sum, source) => sum + source.file.size, 0);
  const totalOutputSize = converted.reduce((sum, item) => sum + item.size, 0);

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

  return (
    <ToolLayoutSingleUtility
      resultSlot={
        <ResultPanel
          title="Image converter"
          description="Convert, resize, and compare images locally before you download them."
          value={
            sources.length ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3 sm:p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-black text-[var(--color-text-primary)]">
                        {selectedSource?.file.name ?? "Selected image"}
                      </p>
                      <Badge variant="outline">{sources.length} image{sources.length === 1 ? "" : "s"}</Badge>
                      <Badge variant="success">Browser-only</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                      Choose the destination format, preview the result, then fine-tune quality or dimensions only if needed.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => inputRef.current?.click()}
                    leftIcon={<Images className="h-4 w-4" aria-hidden />}
                  >
                    Add images
                  </Button>
                </div>

                <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Convert to</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {exportFormatOptions.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => patchSettings({ format: item.value })}
                          className={`rounded-full border px-3 py-1.5 text-xs font-black transition focus:outline-none focus:shadow-[var(--focus-ring)] ${
                            settings.format === item.value
                              ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                              : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={convertAll}
                    loading={converting}
                    leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}
                    className="sm:self-end"
                  >
                    Convert {sources.length > 1 ? `${sources.length} images` : "image"}
                  </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <PreviewCard title="Original" source={selectedSource} />
                  <OutputPreviewCard source={selectedSource} converted={selectedConverted} />
                </div>

                {converted.length ? (
                  <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3 sm:p-4">
                    <div className="grid gap-2 sm:grid-cols-4">
                      <Stat label="Original" value={formatBytes(totalOriginalSize)} />
                      <Stat label="Converted" value={formatBytes(totalOutputSize)} />
                      <Stat label="Savings" value={`${savingsPercent(totalOriginalSize, totalOutputSize)}%`} />
                      <Stat label="Ready" value={`${converted.length}/${sources.length}`} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedConverted ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => downloadOne(selectedConverted)}
                          leftIcon={<Download className="h-4 w-4" aria-hidden />}
                        >
                          Download selected
                        </Button>
                      ) : null}
                      <Button size="sm" onClick={downloadAll} leftIcon={<Download className="h-4 w-4" aria-hidden />}>
                        Download all
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex min-h-[380px] cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed p-6 text-center transition sm:min-h-[440px] ${
                  isDragging
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                    : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]"
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
                <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)] shadow-[var(--shadow-sm)]">
                  <Upload className="h-7 w-7" aria-hidden />
                </div>
                <h2 className="mt-5 text-2xl font-black text-[var(--color-text-primary)]">Drop images here</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
                  PNG, JPEG, WebP, GIF, BMP, or another browser-readable image. Add one image or a whole batch.
                </p>
                <Button
                  className="mt-5"
                  onClick={(event) => {
                    event.stopPropagation();
                    inputRef.current?.click();
                  }}
                  leftIcon={<ImageIcon className="h-4 w-4" aria-hidden />}
                >
                  Choose images
                </Button>
                <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-bold text-[var(--color-text-tertiary)]">
                  <span className="rounded-full border border-[var(--color-border-subtle)] px-2.5 py-1">Up to {formatBytes(MAX_IMAGE_FILE_SIZE_BYTES)} each</span>
                  <span className="rounded-full border border-[var(--color-border-subtle)] px-2.5 py-1">Batch supported</span>
                  <span className="rounded-full border border-[var(--color-border-subtle)] px-2.5 py-1">Processed locally</span>
                </div>
              </div>
            )
          }
        />
      }
      controlsSlot={
        sources.length ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start">
            <ToolControlPanel title="Fine tune" description="Defaults are ready to use. Open only the settings you need." sticky={false}>
              <ControlSection title="Compression">
                <Field
                  label={`Quality: ${Math.round(settings.quality * 100)}%`}
                  description="Used for JPEG and WebP. PNG ignores quality because it is lossless."
                >
                  <Slider
                    min={35}
                    max={100}
                    step={1}
                    value={Math.round(settings.quality * 100)}
                    disabled={settings.format === "image/png"}
                    onChange={(event) => patchSettings({ quality: Number(event.target.value) / 100 })}
                  />
                </Field>
              </ControlSection>

              <details className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3">
                <summary className="cursor-pointer list-none text-sm font-black text-[var(--color-text-primary)] focus:outline-none focus:shadow-[var(--focus-ring)]">
                  Resize & fit
                  {estimatedDimensions ? (
                    <span className="ml-2 text-xs font-semibold text-[var(--color-text-tertiary)]">
                      {estimatedDimensions.width} x {estimatedDimensions.height}
                    </span>
                  ) : null}
                </summary>
                <div className="mt-4 space-y-4">
                  <ControlGrid columns={2}>
                    <Field label="Width">
                      <Input
                        type="number"
                        min={0}
                        value={settings.width || ""}
                        onChange={(event) => updateWidth(event.target.value)}
                        placeholder={selectedSource ? String(selectedSource.width) : "Auto"}
                      />
                    </Field>
                    <Field label="Height">
                      <Input
                        type="number"
                        min={0}
                        value={settings.height || ""}
                        onChange={(event) => updateHeight(event.target.value)}
                        placeholder={selectedSource ? String(selectedSource.height) : "Auto"}
                      />
                    </Field>
                  </ControlGrid>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
                    <input
                      type="checkbox"
                      checked={settings.keepAspectRatio}
                      onChange={(event) => patchSettings({ keepAspectRatio: event.target.checked })}
                      className="h-4 w-4 accent-[var(--color-primary)]"
                    />
                    Keep aspect ratio
                  </label>
                  <Field label={`Scale: ${settings.scalePercent}%`} description="Used when width and height are left empty.">
                    <Slider
                      min={10}
                      max={200}
                      step={5}
                      value={settings.scalePercent}
                      onChange={(event) => patchSettings({ scalePercent: Number(event.target.value), width: 0, height: 0 })}
                    />
                  </Field>
                  <Field label="Fit mode" description="Contain keeps everything, cover crops, stretch fills exactly.">
                    <Select value={settings.fitMode} onChange={(event) => patchSettings({ fitMode: event.target.value as ImageFitMode })}>
                      <option value="contain">Contain</option>
                      <option value="cover">Cover</option>
                      <option value="stretch">Stretch</option>
                    </Select>
                  </Field>
                </div>
              </details>

              <details className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3">
                <summary className="cursor-pointer list-none text-sm font-black text-[var(--color-text-primary)] focus:outline-none focus:shadow-[var(--focus-ring)]">
                  Quick presets
                </summary>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {(showAllPresets ? IMAGE_CONVERTER_PRESETS : IMAGE_CONVERTER_PRESETS.slice(0, 6)).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-3 text-left transition hover:border-[var(--color-border-strong)] focus:outline-none focus:shadow-[var(--focus-ring)]"
                    >
                      <span className="block text-sm font-black text-[var(--color-text-primary)]">{preset.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">{preset.description}</span>
                    </button>
                  ))}
                </div>
                {IMAGE_CONVERTER_PRESETS.length > 6 ? (
                  <Button className="mt-3 w-full" size="sm" variant="ghost" onClick={() => setShowAllPresets((value) => !value)}>
                    {showAllPresets ? "Show fewer presets" : `Show all ${IMAGE_CONVERTER_PRESETS.length} presets`}
                  </Button>
                ) : null}
              </details>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={convertAll}
                  loading={converting}
                  leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}
                >
                  Convert images
                </Button>
                <Button variant="secondary" onClick={() => inputRef.current?.click()} leftIcon={<Images className="h-4 w-4" aria-hidden />}>
                  Add more
                </Button>
                <Button variant="ghost" onClick={reset}>Reset</Button>
              </div>
            </ToolControlPanel>

            <ToolControlPanel title="Images" description="Select an image to compare its original and converted versions." sticky>
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
                        {output ? <Badge variant="success">Ready</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                        {source.width} x {source.height} · {formatBytes(source.file.size)}
                      </p>
                    </button>
                  );
                })}
              </div>

              {converted.length ? (
                <details className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3">
                  <summary className="cursor-pointer list-none text-sm font-black text-[var(--color-text-primary)]">Batch result</summary>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Stat label="Original" value={formatBytes(totalOriginalSize)} />
                    <Stat label="Converted" value={formatBytes(totalOutputSize)} />
                    <Stat label="Savings" value={`${savingsPercent(totalOriginalSize, totalOutputSize)}%`} />
                    <Stat label="Files" value={`${converted.length}/${sources.length}`} />
                  </div>
                </details>
              ) : null}
            </ToolControlPanel>
          </div>
        ) : null
      }
      infoSlot={
        error ? (
          <WarningPanel
            messages={[{ id: "error", severity: "warning" as const, title: "Image note", message: error }]}
          />
        ) : null
      }
    />
  );
}

function PreviewCard({ title, source }: { title: string; source: SourceImage | null }) {
  return (
    <Card padding="md" className="min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-[var(--color-text-primary)]">{title}</h3>
        {source ? <Badge variant="outline">{source.width} x {source.height}</Badge> : null}
      </div>
      {source ? (
        <>
          {/* Plain img is appropriate here because object URLs are local browser blobs. */}
          <img
            src={source.url}
            alt="Original upload preview"
            className="mt-3 h-72 w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] object-contain sm:h-80 lg:h-[360px]"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs leading-5 text-[var(--color-text-secondary)]">
            <span className="min-w-0 truncate font-semibold">{source.file.name}</span>
            <span>{formatBytes(source.file.size)} · {source.file.type || "Image"}</span>
          </div>
        </>
      ) : (
        <div className="mt-3 flex h-72 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] text-sm text-[var(--color-text-tertiary)] sm:h-80 lg:h-[360px]">
          No image selected.
        </div>
      )}
    </Card>
  );
}

function OutputPreviewCard({ source, converted }: { source: SourceImage | null; converted: ConvertedImage | null }) {
  return (
    <Card padding="md" className="min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-[var(--color-text-primary)]">Converted</h3>
        {converted ? (
          <Badge variant={source && savingsPercent(source.file.size, converted.size) >= 0 ? "success" : "outline"}>
            {source ? `${savingsPercent(source.file.size, converted.size)}% smaller` : "Ready"}
          </Badge>
        ) : null}
      </div>
      {converted ? (
        <>
          <img
            src={converted.url}
            alt="Converted output preview"
            className="mt-3 h-72 w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] object-contain sm:h-80 lg:h-[360px]"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs leading-5 text-[var(--color-text-secondary)]">
            <span className="min-w-0 truncate font-semibold">{converted.name}</span>
            <span>{formatBytes(converted.size)} · {converted.width} x {converted.height}</span>
          </div>
        </>
      ) : (
        <div className="mt-3 flex h-72 flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] px-4 text-center sm:h-80 lg:h-[360px]">
          <RefreshCw className="h-6 w-6 text-[var(--color-text-tertiary)]" aria-hidden />
          <p className="mt-3 text-sm font-black text-[var(--color-text-primary)]">Ready to convert</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-[var(--color-text-tertiary)]">
            Choose a format above and convert to compare the result side by side.
          </p>
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
