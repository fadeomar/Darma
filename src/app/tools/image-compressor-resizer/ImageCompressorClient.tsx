"use client";

import {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Archive,
  CheckCircle2,
  Clipboard,
  Download,
  FilePlus2,
  Image as ImageIcon,
  RefreshCw,
  Shield,
  Upload,
} from "lucide-react";
import { Button, Card, Field, Input, Select, Slider } from "@/components/ui";
import {
  ControlGrid,
  ControlSection,
  SegmentedControl,
  ToolControlPanel,
  WarningPanel,
} from "@/features/tools/components";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { ToolLayoutSingleUtility } from "@/features/tools/layouts";
import { COMPRESSION_PRESETS, QUICK_PRESETS } from "./presets";
import type { QuickPresetSettings } from "./presets";
import {
  formatBytes,
  formatMimeLabel,
  resolveOutputMimeType,
} from "./formatUtils";
import {
  calculateOutputDimensions,
  loadImageFromFile,
  processImage,
  processImageWithTargetSize,
} from "./imageProcessing";
import type {
  BatchImageItem,
  BatchSummary,
  CompressionPreset,
  ImageInputState,
  ImageOutputState,
  OutputFormat,
} from "./types";
import { BatchQueue } from "./BatchQueue";
import { buildBatchFilename, type RenameMode } from "./filenameUtils";
import { downloadBatchAsZip } from "./zipUtils";

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BATCH = 20;

const TARGET_SIZE_SHORTCUTS = [
  { label: "100 KB", value: "100" },
  { label: "200 KB", value: "200" },
  { label: "500 KB", value: "500" },
  { label: "1 MB", value: "1024" },
];

const PREVIEW_OPTIONS = [
  { value: "side-by-side" as PreviewMode, label: "Side by side" },
  { value: "original" as PreviewMode, label: "Original" },
  { value: "optimized" as PreviewMode, label: "Optimized" },
];

// ─── Types ───────────────────────────────────────────────────────────────────

type PreviewMode = "side-by-side" | "original" | "optimized";

type Settings = {
  preset: CompressionPreset;
  quality: number;
  outputFormat: OutputFormat;
  targetWidth: string;
  targetHeight: string;
  keepAspectRatio: boolean;
  doNotEnlarge: boolean;
  targetFileSizeEnabled: boolean;
  targetFileSizeKB: string;
};

const DEFAULT_SETTINGS: Settings = {
  preset: "balanced",
  quality: 0.78,
  outputFormat: "original",
  targetWidth: "",
  targetHeight: "",
  keepAspectRatio: true,
  doNotEnlarge: true,
  targetFileSizeEnabled: false,
  targetFileSizeKB: "500",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function closestPreset(quality: number): CompressionPreset {
  return (
    [...COMPRESSION_PRESETS].sort(
      (a, b) => Math.abs(a.quality - quality) - Math.abs(b.quality - quality),
    )[0]?.id ?? "balanced"
  );
}

function toInputState(item: BatchImageItem): ImageInputState {
  return {
    file: item.file,
    objectUrl: item.objectUrl,
    name: item.name,
    size: item.size,
    width: item.width,
    height: item.height,
    type: item.type,
  };
}

function newId(): string {
  return (
    (crypto.randomUUID as (() => string) | undefined)?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

async function makeBatchItem(file: File): Promise<BatchImageItem> {
  const s = await loadImageFromFile(file);
  return {
    id: newId(),
    file: s.file,
    objectUrl: s.objectUrl,
    name: s.name,
    size: s.size,
    type: s.type,
    width: s.width,
    height: s.height,
    status: "ready",
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ImageCompressorClient() {
  // ── State ────────────────────────────────────────────────────────────────
  const [batchItems, setBatchItems] = useState<BatchImageItem[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isDragging, setIsDragging] = useState(false);

  // Single-mode processing
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("side-by-side");

  // Batch processing
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Errors / warnings
  const [error, setError] = useState("");
  const [targetSizeWarning, setTargetSizeWarning] = useState("");
  const [zipError, setZipError] = useState("");
  const [isZipping, setIsZipping] = useState(false);

  // Rename
  const [renameMode, setRenameMode] = useState<RenameMode>("suffix");
  const [customSuffix, setCustomSuffix] = useState("-optimized");

  // ── Refs ─────────────────────────────────────────────────────────────────
  const inputRef = useRef<HTMLInputElement | null>(null);
  const batchItemsRef = useRef<BatchImageItem[]>([]);
  const isReplaceRef = useRef(false);

  // Keep ref in sync for stable access inside effects/handlers
  useEffect(() => {
    batchItemsRef.current = batchItems;
  }, [batchItems]);

  // Cleanup all object URLs on unmount
  useEffect(() => {
    return () => {
      for (const item of batchItemsRef.current) {
        URL.revokeObjectURL(item.objectUrl);
        if (item.output) URL.revokeObjectURL(item.output.objectUrl);
      }
    };
  }, []);

  // Clipboard paste — adds one image (replaces in single/empty; adds in batch)
  useEffect(() => {
    async function onPaste(e: ClipboardEvent) {
      if (!e.clipboardData) return;
      const imageDataItem = Array.from(e.clipboardData.items).find((i) =>
        i.type.startsWith("image/"),
      );
      if (!imageDataItem) return;
      const file = imageDataItem.getAsFile();
      if (!file) return;

      if (batchItemsRef.current.length >= 2) {
        // Batch mode: add the pasted image
        await addFilesInternal([file], batchItemsRef.current.length);
      } else {
        // Single / empty: replace
        revokeAll(batchItemsRef.current);
        setError("");
        setTargetSizeWarning("");
        setZipError("");
        try {
          const newItem = await makeBatchItem(file);
          setBatchItems([newItem]);
          setPreviewMode("side-by-side");
        } catch {
          setError("We could not read this image. Try another file.");
        }
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  // ── Computed ──────────────────────────────────────────────────────────────
  const isSingleMode = batchItems.length === 1;
  const isBatchMode = batchItems.length >= 2;
  const hasItems = batchItems.length > 0;
  const singleItem = isSingleMode ? batchItems[0] : null;
  const singleOutput = singleItem?.output ?? null;

  const targetWidth = settings.targetWidth ? parseInt(settings.targetWidth, 10) : 0;
  const targetHeight = settings.targetHeight ? parseInt(settings.targetHeight, 10) : 0;
  const singleRatio = singleItem ? singleItem.width / (singleItem.height || 1) : 1;

  const estimatedDims = useMemo(() => {
    if (!singleItem) return null;
    return calculateOutputDimensions(singleItem.width, singleItem.height, {
      targetWidth,
      targetHeight,
      keepAspectRatio: settings.keepAspectRatio,
      doNotEnlarge: settings.doNotEnlarge,
    });
  }, [singleItem, targetWidth, targetHeight, settings.keepAspectRatio, settings.doNotEnlarge]);

  const resolvedMime = singleItem
    ? resolveOutputMimeType(settings.outputFormat, singleItem.type)
    : null;
  const showPngHint = resolvedMime === "image/png";
  const showTransparencyWarning =
    resolvedMime === "image/jpeg" &&
    singleItem !== null &&
    (singleItem.type === "image/png" || singleItem.type === "image/webp");
  const showTargetSizePngNote =
    settings.targetFileSizeEnabled && resolvedMime === "image/png";
  const enlargementBlocked =
    settings.doNotEnlarge &&
    singleItem !== null &&
    (targetWidth > singleItem.width || targetHeight > singleItem.height);

  const batchSummary = useMemo((): BatchSummary => {
    const done = batchItems.filter((i) => i.status === "done" && i.output);
    const failed = batchItems.filter((i) => i.status === "failed");
    const totalOriginalSize = done.reduce((s, i) => s + i.size, 0);
    const totalOutputSize = done.reduce((s, i) => s + (i.output?.size ?? 0), 0);
    return {
      totalCount: batchItems.length,
      successCount: done.length,
      failedCount: failed.length,
      totalOriginalSize,
      totalOutputSize,
      totalSavedBytes: totalOriginalSize - totalOutputSize,
      averageSavedPercent:
        done.length > 0
          ? Math.round(
              done.reduce((s, i) => s + (i.output?.savedPercent ?? 0), 0) / done.length,
            )
          : 0,
    };
  }, [batchItems]);

  const isAnyProcessing = processing || batchProcessing;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function patch(partial: Partial<Settings>) {
    setSettings((s) => ({ ...s, ...partial }));
  }

  function revokeAll(items: BatchImageItem[]) {
    for (const item of items) {
      URL.revokeObjectURL(item.objectUrl);
      if (item.output) URL.revokeObjectURL(item.output.objectUrl);
    }
  }

  function buildProcessingOptions(snap: Settings = settings) {
    return {
      quality: snap.quality,
      outputFormat: snap.outputFormat,
      targetWidth: snap.targetWidth ? parseInt(snap.targetWidth, 10) : 0,
      targetHeight: snap.targetHeight ? parseInt(snap.targetHeight, 10) : 0,
      keepAspectRatio: snap.keepAspectRatio,
      doNotEnlarge: snap.doNotEnlarge,
    };
  }

  function getOutputFilename(item: BatchImageItem): string {
    if (!item.output) return item.name;
    return buildBatchFilename(item.name, item.output.type, renameMode, customSuffix);
  }

  // ── File loading ──────────────────────────────────────────────────────────
  async function addFilesInternal(files: File[], currentCount: number) {
    const valid = files.filter((f) => ACCEPTED_TYPES.includes(f.type));
    const skipped = files.length - valid.length;
    const warnings: string[] = [];

    if (skipped > 0) {
      warnings.push(
        `${skipped} file${skipped !== 1 ? "s" : ""} skipped — only JPG, PNG, and WebP are supported.`,
      );
    }

    let accepted = valid;
    if (currentCount + valid.length > MAX_BATCH) {
      const available = Math.max(0, MAX_BATCH - currentCount);
      const overflow = valid.length - available;
      accepted = valid.slice(0, available);
      if (overflow > 0)
        warnings.push(`You can process up to ${MAX_BATCH} images at once in this version.`);
    }

    if (!accepted.length) {
      if (warnings.length) setError(warnings.join(" "));
      return;
    }

    const totalSize = accepted.reduce((s, f) => s + f.size, 0);
    if (totalSize > 50 * 1024 * 1024)
      warnings.push("Large batch detected. Processing may take longer on older devices.");
    else if (accepted.some((f) => f.size > 20 * 1024 * 1024))
      warnings.push("Large image detected. Processing may take a few seconds on older devices.");

    setError(warnings.join(" ") || "");
    setTargetSizeWarning("");
    setZipError("");

    try {
      const newItems = await Promise.all(accepted.map(makeBatchItem));
      setBatchItems((prev) => {
        const room = MAX_BATCH - prev.length;
        return [...prev, ...newItems.slice(0, Math.max(0, room))];
      });
    } catch {
      setError("Could not read one or more images. Try another file.");
    }
  }

  async function addFiles(files: File[]) {
    await addFilesInternal(files, batchItemsRef.current.length);
  }

  // ── File picker / drop ────────────────────────────────────────────────────
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length) addFiles(files);
  }

  async function handlePicker(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const isReplace = isReplaceRef.current;
    isReplaceRef.current = false;
    event.target.value = "";
    if (!files.length) return;

    if (isReplace) {
      revokeAll(batchItemsRef.current);
      setBatchItems([]);
      setError("");
      setTargetSizeWarning("");
      setZipError("");
      setPreviewMode("side-by-side");
      await addFilesInternal(files, 0);
    } else {
      await addFiles(files);
    }
  }

  function openReplacePicker() {
    isReplaceRef.current = true;
    inputRef.current?.click();
  }

  function openAddPicker() {
    isReplaceRef.current = false;
    inputRef.current?.click();
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/png,image/jpeg,image/webp"
      multiple
      className="sr-only"
      onChange={handlePicker}
    />
  );

  // ── Item management ───────────────────────────────────────────────────────
  function removeItem(id: string) {
    setBatchItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        URL.revokeObjectURL(item.objectUrl);
        if (item.output) URL.revokeObjectURL(item.output.objectUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }

  function clearAll() {
    revokeAll(batchItemsRef.current);
    setBatchItems([]);
    setError("");
    setTargetSizeWarning("");
    setZipError("");
    setSettings(DEFAULT_SETTINGS);
    setPreviewMode("side-by-side");
  }

  // ── Settings helpers ──────────────────────────────────────────────────────
  function applyCompressionPreset(preset: CompressionPreset) {
    const config = COMPRESSION_PRESETS.find((p) => p.id === preset);
    if (config) patch({ preset, quality: config.quality });
  }

  function applyQuickPreset(s: QuickPresetSettings) {
    setSettings((prev) => ({
      ...prev,
      ...(s.quality !== undefined && { quality: s.quality, preset: closestPreset(s.quality) }),
      ...(s.outputFormat !== undefined && { outputFormat: s.outputFormat }),
      ...(s.targetWidth !== undefined && { targetWidth: s.targetWidth }),
      ...(s.targetHeight !== undefined && { targetHeight: s.targetHeight }),
      ...(s.keepAspectRatio !== undefined && { keepAspectRatio: s.keepAspectRatio }),
      ...(s.doNotEnlarge !== undefined && { doNotEnlarge: s.doNotEnlarge }),
      ...(s.targetFileSizeEnabled !== undefined && {
        targetFileSizeEnabled: s.targetFileSizeEnabled,
      }),
      ...(s.targetFileSizeKB !== undefined && { targetFileSizeKB: s.targetFileSizeKB }),
    }));
  }

  function updateWidth(value: string) {
    if (!value || !settings.keepAspectRatio || !singleItem) {
      patch({ targetWidth: value });
      return;
    }
    const w = parseInt(value, 10);
    if (!Number.isFinite(w) || w <= 0) {
      patch({ targetWidth: value });
      return;
    }
    patch({ targetWidth: value, targetHeight: String(Math.round(w / singleRatio)) });
  }

  function updateHeight(value: string) {
    if (!value || !settings.keepAspectRatio || !singleItem) {
      patch({ targetHeight: value });
      return;
    }
    const h = parseInt(value, 10);
    if (!Number.isFinite(h) || h <= 0) {
      patch({ targetHeight: value });
      return;
    }
    patch({ targetHeight: value, targetWidth: String(Math.round(h * singleRatio)) });
  }

  // ── Single-image compress ─────────────────────────────────────────────────
  async function compressSingle() {
    if (!singleItem) return;
    setError("");
    setTargetSizeWarning("");

    // Revoke any existing output URL
    if (singleItem.output) URL.revokeObjectURL(singleItem.output.objectUrl);

    setBatchItems((prev) =>
      prev.map((p) =>
        p.id === singleItem.id ? { ...p, status: "processing" as const, output: undefined } : p,
      ),
    );

    setProcessing(true);
    setProcessingStep("Optimizing image…");

    const input = toInputState(singleItem);
    const opts = buildProcessingOptions();

    try {
      let result: ImageOutputState;

      if (settings.targetFileSizeEnabled) {
        const kbValue = parseInt(settings.targetFileSizeKB, 10);
        const targetBytes = Math.max(1, Number.isFinite(kbValue) ? kbValue : 500) * 1024;
        setProcessingStep("Compressing to target size…");
        const { result: r, targetReached } = await processImageWithTargetSize(input, {
          ...opts,
          targetFileSizeBytes: targetBytes,
        });
        result = r;
        if (!targetReached)
          setTargetSizeWarning(
            "We got as close as possible. Try smaller dimensions or WebP for a lower file size.",
          );
      } else {
        setProcessingStep("Resizing…");
        result = await processImage(input, opts);
      }

      setProcessingStep("Preparing preview…");
      setBatchItems((prev) =>
        prev.map((p) =>
          p.id === singleItem.id ? { ...p, status: "done" as const, output: result } : p,
        ),
      );
      setPreviewMode("side-by-side");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not prepare the optimized image.";
      setBatchItems((prev) =>
        prev.map((p) =>
          p.id === singleItem.id ? { ...p, status: "failed" as const, error: msg } : p,
        ),
      );
      setError(
        msg.toLowerCase().includes("format")
          ? "Your browser may not support this output format. Try JPEG or PNG."
          : msg,
      );
    } finally {
      setProcessing(false);
      setProcessingStep("");
    }
  }

  // ── Batch compress (sequential) ───────────────────────────────────────────
  async function processAll() {
    if (batchProcessing || processing) return;
    const snap = { ...settings };
    const opts = buildProcessingOptions(snap);

    const pending = [...batchItemsRef.current]; // process all
    if (!pending.length) return;

    setBatchProcessing(true);
    setBatchProgress({ current: 0, total: pending.length });
    setError("");
    setTargetSizeWarning("");
    setZipError("");

    let anyMissedTarget = false;

    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      setBatchProgress({ current: i + 1, total: pending.length });

      // Revoke existing output before reprocessing
      if (item.output) URL.revokeObjectURL(item.output.objectUrl);

      setBatchItems((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "processing" as const, output: undefined } : p,
        ),
      );

      const input = toInputState(item);

      try {
        let result: ImageOutputState;

        if (snap.targetFileSizeEnabled) {
          const kbValue = parseInt(snap.targetFileSizeKB, 10);
          const targetBytes = Math.max(1, Number.isFinite(kbValue) ? kbValue : 500) * 1024;
          const { result: r, targetReached } = await processImageWithTargetSize(input, {
            ...opts,
            targetFileSizeBytes: targetBytes,
          });
          result = r;
          if (!targetReached) anyMissedTarget = true;
        } else {
          result = await processImage(input, opts);
        }

        setBatchItems((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: "done" as const, output: result } : p,
          ),
        );
      } catch {
        setBatchItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, status: "failed" as const, error: "Processing failed." }
              : p,
          ),
        );
      }
    }

    if (anyMissedTarget)
      setTargetSizeWarning(
        "Some images could not reach the target size. Try smaller dimensions or WebP.",
      );

    setBatchProcessing(false);
    setBatchProgress({ current: 0, total: 0 });
  }

  // ── Download ──────────────────────────────────────────────────────────────
  function downloadSingle() {
    if (!singleItem || !singleOutput) return;
    const filename = getOutputFilename(singleItem);
    downloadBlobFile({ blob: singleOutput.blob, filename });
  }

  function downloadItem(item: BatchImageItem) {
    if (!item.output) return;
    downloadBlobFile({ blob: item.output.blob, filename: getOutputFilename(item) });
  }

  async function downloadZip() {
    if (isZipping) return;
    setIsZipping(true);
    setZipError("");
    try {
      await downloadBatchAsZip(batchItems, (item) => getOutputFilename(item));
    } catch {
      setZipError("Could not prepare ZIP file. Try downloading images individually.");
    } finally {
      setIsZipping(false);
    }
  }

  // ── Info messages ─────────────────────────────────────────────────────────
  const infoMessages = [
    ...(error
      ? [{ id: "error", severity: "warning" as const, title: "Note", message: error }]
      : []),
    ...(targetSizeWarning
      ? [
          {
            id: "target-size",
            severity: "warning" as const,
            title: "Target size",
            message: targetSizeWarning,
          },
        ]
      : []),
    ...(showTransparencyWarning
      ? [
          {
            id: "transparency",
            severity: "warning" as const,
            title: "Transparency",
            message:
              "JPEG does not support transparency. Transparent areas may become solid white.",
          },
        ]
      : []),
    ...(showPngHint
      ? [
          {
            id: "png-hint",
            severity: "info" as const,
            title: "PNG note",
            message:
              "PNG is best for transparency and sharp graphics, but files are larger than JPEG or WebP.",
          },
        ]
      : []),
    ...(showTargetSizePngNote
      ? [
          {
            id: "target-png",
            severity: "info" as const,
            title: "Target size + PNG",
            message:
              "Target size works best with JPEG or WebP. PNG compression is lossless and may be limited.",
          },
        ]
      : []),
    ...(enlargementBlocked
      ? [
          {
            id: "enlarge",
            severity: "info" as const,
            title: "Enlargement disabled",
            message: "This image is smaller than your target dimensions. Enlargement is disabled.",
          },
        ]
      : []),
    {
      id: "privacy",
      severity: "info" as const,
      title: "Browser-only",
      message:
        "Your images stay on your device. Processing happens in your browser — nothing is uploaded.",
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  // Empty state — full-width upload zone
  if (!hasItems) {
    return (
      <ToolLayoutSingleUtility
        resultSlot={
          <>
            {fileInput}
            <UploadDropzone
              isDragging={isDragging}
              onBrowse={openAddPicker}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsDragging(false);
                }
              }}
            />
          </>
        }
      />
    );
  }

  // ── Shared settings column (used in both single + batch layouts) ──────────
  const settingsColumn = (
    <div className="space-y-4">
      {/* Quick presets */}
      <ToolControlPanel
        title="Quick presets"
        description="Apply common settings in one click."
        sticky={false}
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyQuickPreset(preset.settings)}
              className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3 text-left transition hover:border-[var(--color-border-strong)] focus:outline-none focus:shadow-[var(--focus-ring)]"
            >
              <span className="block text-xs font-black text-[var(--color-text-primary)]">
                {preset.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-4 text-[var(--color-text-tertiary)]">
                {preset.description}
              </span>
              {preset.note && (
                <span className="mt-1 block text-[10px] leading-4 text-[var(--color-accent)] opacity-80">
                  {preset.note}
                </span>
              )}
            </button>
          ))}
        </div>
      </ToolControlPanel>

      {/* Compression */}
      <ToolControlPanel
        title="Compression"
        description="Choose a preset or adjust quality manually."
        sticky={false}
      >
        <ControlSection title="Presets">
          <div className="grid grid-cols-2 gap-2">
            {COMPRESSION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyCompressionPreset(preset.id)}
                className={`rounded-[var(--radius-md)] border p-3 text-left transition focus:outline-none focus:shadow-[var(--focus-ring)] ${
                  settings.preset === preset.id
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                    : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]"
                }`}
              >
                <span className="block text-xs font-black text-[var(--color-text-primary)]">
                  {preset.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-[var(--color-text-tertiary)]">
                  {preset.description}
                </span>
              </button>
            ))}
          </div>
        </ControlSection>

        <ControlSection title="Quality">
          <Field
            label={`Quality: ${Math.round(settings.quality * 100)}%`}
            description="Applies to JPEG and WebP. PNG is always lossless."
          >
            <Slider
              min={10}
              max={100}
              step={1}
              value={Math.round(settings.quality * 100)}
              disabled={settings.outputFormat === "image/png"}
              onChange={(e) => {
                const q = Number(e.target.value) / 100;
                patch({ quality: q, preset: closestPreset(q) });
              }}
            />
          </Field>
        </ControlSection>
      </ToolControlPanel>

      {/* Target file size */}
      <ToolControlPanel title="Target file size" sticky={false}>
        <ControlSection title="Size target">
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={settings.targetFileSizeEnabled}
              onChange={(e) => patch({ targetFileSizeEnabled: e.target.checked })}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Compress to target size
          </label>
          {settings.targetFileSizeEnabled && (
            <div className="mt-3 space-y-3">
              <Field
                label="Target (KB)"
                description="Quality is reduced automatically until the file is under this size."
              >
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={settings.targetFileSizeKB}
                    onChange={(e) => patch({ targetFileSizeKB: e.target.value })}
                  />
                  <span className="shrink-0 text-sm font-bold text-[var(--color-text-tertiary)]">KB</span>
                </div>
              </Field>
              <div className="flex flex-wrap gap-2">
                {TARGET_SIZE_SHORTCUTS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patch({ targetFileSizeKB: value })}
                    className={`rounded-[var(--radius-full)] border px-3 py-1 text-xs font-bold transition focus:outline-none focus:shadow-[var(--focus-ring)] ${
                      settings.targetFileSizeKB === value
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                        : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </ControlSection>
      </ToolControlPanel>

      {/* Resize */}
      <ToolControlPanel title="Resize" sticky={false}>
        <ControlSection title="Dimensions">
          <ControlGrid columns={2}>
            <Field label="Width (px)">
              <Input
                type="number"
                min={1}
                value={settings.targetWidth}
                onChange={(e) => updateWidth(e.target.value)}
                placeholder={singleItem ? String(singleItem.width) : "e.g. 1280"}
              />
            </Field>
            <Field label="Height (px)">
              <Input
                type="number"
                min={1}
                value={settings.targetHeight}
                onChange={(e) => updateHeight(e.target.value)}
                placeholder={singleItem ? String(singleItem.height) : "e.g. 720"}
              />
            </Field>
          </ControlGrid>
          {isBatchMode && (
            <p className="mt-2 text-[11px] leading-4 text-[var(--color-text-tertiary)]">
              Applies to all images. Each is resized independently.
            </p>
          )}
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={settings.keepAspectRatio}
              onChange={(e) => patch({ keepAspectRatio: e.target.checked })}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Keep aspect ratio
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={settings.doNotEnlarge}
              onChange={(e) => patch({ doNotEnlarge: e.target.checked })}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Do not enlarge smaller images
          </label>
          {estimatedDims && (
            <p className="mt-2 text-xs font-semibold text-[var(--color-text-tertiary)]">
              Output: {estimatedDims.width} × {estimatedDims.height} px
            </p>
          )}
        </ControlSection>
      </ToolControlPanel>

      {/* Output format */}
      <ToolControlPanel title="Output format" sticky={false}>
        <ControlSection title="Format">
          <Field
            label="Format"
            description="Keep original uses the same format as the uploaded file."
          >
            <Select
              value={settings.outputFormat}
              onChange={(e) => patch({ outputFormat: e.target.value as OutputFormat })}
            >
              <option value="original">Original (keep format)</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG (lossless)</option>
              <option value="image/webp">WebP</option>
            </Select>
          </Field>
        </ControlSection>
      </ToolControlPanel>

      {/* Output filename */}
      <ToolControlPanel title="Output filename" sticky={false}>
        <ControlSection title="Rename">
          <div className="space-y-2">
            {(
              [
                { value: "keep" as RenameMode, label: "Keep original name" },
                { value: "suffix" as RenameMode, label: 'Add "-optimized" suffix' },
                { value: "custom" as RenameMode, label: "Custom suffix" },
              ] as const
            ).map(({ value, label }) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--color-text-secondary)]"
              >
                <input
                  type="radio"
                  name="renameMode"
                  value={value}
                  checked={renameMode === value}
                  onChange={() => setRenameMode(value)}
                  className="h-3.5 w-3.5 accent-[var(--color-primary)]"
                />
                {label}
              </label>
            ))}
          </div>
          {renameMode === "custom" && (
            <div className="mt-3">
              <Field label="Custom suffix" description='e.g. "-small" → photo-small.webp'>
                <Input
                  value={customSuffix}
                  onChange={(e) => setCustomSuffix(e.target.value)}
                  placeholder="-optimized"
                />
              </Field>
            </div>
          )}
        </ControlSection>
      </ToolControlPanel>

      <WarningPanel messages={infoMessages} />
    </div>
  );

  // ── Single-image mode ─────────────────────────────────────────────────────
  if (isSingleMode) {
    return (
      <ToolLayoutSingleUtility
        resultSlot={
          <>
            {fileInput}
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            {/* LEFT: Preview */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={openReplacePicker}
                  disabled={isAnyProcessing}
                  leftIcon={<ImageIcon className="h-4 w-4" aria-hidden />}
                >
                  Replace image
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  disabled={isAnyProcessing}
                  leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}
                >
                  Reset
                </Button>
                {singleOutput && (
                  <div className="ml-auto">
                    <SegmentedControl
                      ariaLabel="Preview mode"
                      options={PREVIEW_OPTIONS}
                      value={previewMode}
                      onChange={(v) => setPreviewMode(v)}
                      size="sm"
                    />
                  </div>
                )}
              </div>

              {/* Image preview — full width, no inner padding */}
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)]">
                <PreviewArea
                  input={toInputState(singleItem!)}
                  output={singleOutput}
                  previewMode={previewMode}
                />
              </div>

              {/* Download row */}
              {singleOutput && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-4 py-3">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    <span className="font-semibold">{formatBytes(singleItem!.size)}</span>
                    <span className="mx-2 opacity-50">→</span>
                    <span className="font-bold text-[var(--color-success-text)]">
                      {formatBytes(singleOutput.size)}
                    </span>
                    <span className="ml-2 font-bold text-[var(--color-success-text)]">
                      −{singleOutput.savedPercent}%
                    </span>
                  </p>
                  <Button
                    onClick={downloadSingle}
                    leftIcon={<Download className="h-4 w-4" aria-hidden />}
                  >
                    Download optimized image
                  </Button>
                </div>
              )}

              {/* Result guidance */}
              {singleOutput && singleItem && (
                <ResultGuidance
                  savedPercent={singleOutput.savedPercent}
                  outputSize={singleOutput.size}
                  inputWidth={singleItem.width}
                  inputHeight={singleItem.height}
                  outputWidth={singleOutput.width}
                  outputHeight={singleOutput.height}
                />
              )}
            </div>

            {/* RIGHT: Compress button + settings (sticky) */}
            <div className="space-y-4 lg:sticky lg:top-24">
              <Button
                onClick={compressSingle}
                loading={processing}
                disabled={batchProcessing}
                leftIcon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
                className="w-full"
              >
                {processing ? processingStep || "Optimizing…" : "Compress image"}
              </Button>
              {settingsColumn}
            </div>
            </div>
          </>
        }
      />
    );
  }

  // ── Batch mode ────────────────────────────────────────────────────────────
  return (
    <ToolLayoutSingleUtility
      resultSlot={
        <>
          {fileInput}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          {/* LEFT: Queue */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-[var(--color-text-primary)]">
                {batchItems.length} {batchItems.length === 1 ? "image" : "images"}
              </span>
              <div className="flex-1" />
              <Button
                variant="secondary"
                size="sm"
                onClick={openAddPicker}
                disabled={isAnyProcessing || batchItems.length >= MAX_BATCH}
                leftIcon={<FilePlus2 className="h-4 w-4" aria-hidden />}
              >
                Add more
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={isAnyProcessing}
                leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}
              >
                Clear all
              </Button>
            </div>

            <div aria-live="polite" aria-atomic="true" className="contents">
              {batchProcessing && (
                <BatchProgressBar
                  current={batchProgress.current}
                  total={batchProgress.total}
                />
              )}
            </div>

            <BatchQueue
              items={batchItems}
              onDownload={downloadItem}
              onRemove={removeItem}
              disabled={isAnyProcessing}
            />

            {batchSummary.successCount > 0 && (
              <BatchSummaryCard
                summary={batchSummary}
                onDownloadZip={downloadZip}
                zipDisabled={isZipping || batchProcessing}
                isZipping={isZipping}
                zipError={zipError}
              />
            )}
          </div>

          {/* RIGHT: Primary actions + settings (sticky) */}
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="space-y-2">
              <Button
                onClick={processAll}
                loading={batchProcessing}
                disabled={processing}
                leftIcon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
                className="w-full"
              >
                {batchProcessing
                  ? `Processing ${batchProgress.current} of ${batchProgress.total}…`
                  : "Optimize all images"}
              </Button>
              <Button
                variant="secondary"
                onClick={downloadZip}
                loading={isZipping}
                disabled={batchSummary.successCount === 0 || batchProcessing}
                leftIcon={<Archive className="h-4 w-4" aria-hidden />}
                className="w-full"
                title={
                  batchSummary.successCount === 0
                    ? "Process images first to enable ZIP download"
                    : undefined
                }
              >
                Download all as ZIP
              </Button>
            </div>
            {settingsColumn}
          </div>
          </div>
        </>
      }
    />
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UploadDropzone({
  isDragging,
  onDrop,
  onDragOver,
  onDragLeave,
  onBrowse,
}: {
  isDragging: boolean;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onBrowse: () => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onBrowse();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onBrowse}
      onKeyDown={handleKeyDown}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      aria-label="Image upload area — drag and drop or click to choose images"
      className={`flex min-h-[280px] flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed p-8 text-center transition ${
        isDragging
          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
          : "border-[var(--color-border-default)] bg-[var(--color-surface-subtle)]"
      }`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)] shadow-[var(--shadow-sm)]">
        <Upload className="h-7 w-7" aria-hidden />
      </div>

      <p className="mt-5 text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
        Drop images here or click to browse
      </p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-secondary)]">
        JPG, PNG, and WebP. One image or up to {MAX_BATCH} at once. Your files stay on your device.
      </p>

      <Button
        className="mt-5"
        onClick={(event) => {
          event.stopPropagation();
          onBrowse();
        }}
        leftIcon={<ImageIcon className="h-4 w-4" aria-hidden />}
      >
        Choose images
      </Button>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
        <Clipboard className="h-3.5 w-3.5 shrink-0" aria-hidden />
        You can also paste an image from your clipboard (Ctrl+V / ⌘V).
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {["Browser-only", "No upload to server", "No watermark", "No signup"].map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 rounded-[var(--radius-full)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--color-accent)]"
          >
            <Shield className="h-3 w-3" aria-hidden />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PreviewArea({
  input,
  output,
  previewMode,
}: {
  input: ImageInputState;
  output: ImageOutputState | null;
  previewMode: PreviewMode;
}) {
  const showOriginal = !output || previewMode === "original" || previewMode === "side-by-side";
  const showOptimized = output !== null && (previewMode === "optimized" || previewMode === "side-by-side");
  const sideBySide = output !== null && previewMode === "side-by-side";

  return (
    <div className={`grid gap-4 ${sideBySide ? "sm:grid-cols-2" : ""}`}>
      {showOriginal && (
        <ImageCard
          label="Original"
          src={input.objectUrl}
          alt="Original image preview"
          stats={[
            { key: "File", value: input.name },
            { key: "Size", value: formatBytes(input.size) },
            { key: "Dimensions", value: `${input.width} × ${input.height}` },
            { key: "Format", value: formatMimeLabel(input.type) },
          ]}
          tallImage={!sideBySide}
        />
      )}

      {showOptimized && output ? (
        <ImageCard
          label="Optimized"
          src={output.objectUrl}
          alt="Optimized image preview"
          accent
          stats={[
            { key: "Size", value: formatBytes(output.size), highlight: true },
            {
              key: "Saved",
              value: `${output.savedPercent}%`,
              highlight: output.savedPercent > 0,
            },
            { key: "Dimensions", value: `${output.width} × ${output.height}` },
            { key: "Format", value: formatMimeLabel(output.type) },
          ]}
          tallImage={!sideBySide}
        />
      ) : !output ? (
        <div className="flex min-h-[160px] items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] px-4 text-center text-sm leading-6 text-[var(--color-text-tertiary)]">
          Optimized preview appears after compression.
        </div>
      ) : null}
    </div>
  );
}

function ImageCard({
  label,
  src,
  alt,
  stats,
  accent = false,
  tallImage = false,
}: {
  label: string;
  src: string;
  alt: string;
  stats: Array<{ key: string; value: string; highlight?: boolean }>;
  accent?: boolean;
  tallImage?: boolean;
}) {
  return (
    <Card
      padding="md"
      className={`min-w-0 ${
        accent
          ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)]/30"
          : ""
      }`}
    >
      <h3
        className={`text-xs font-bold uppercase tracking-[0.06em] ${
          accent ? "text-[var(--color-success-text)]" : "text-[var(--color-text-tertiary)]"
        }`}
      >
        {label}
      </h3>
      {/* Plain img — src is a local object URL, never a remote URL */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`mt-3 w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] object-contain ${
          tallImage ? "max-h-96" : "h-48"
        }`}
      />
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs leading-5">
        {stats.map(({ key, value, highlight }) => (
          <div key={key}>
            <dt className="font-bold text-[var(--color-text-tertiary)]">{key}</dt>
            <dd
              className={`truncate ${
                highlight
                  ? "font-bold text-[var(--color-success-text)]"
                  : "text-[var(--color-text-secondary)]"
              }`}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function ResultGuidance({
  savedPercent,
  outputSize,
  inputWidth,
  inputHeight,
  outputWidth,
  outputHeight,
}: {
  savedPercent: number;
  outputSize: number;
  inputWidth: number;
  inputHeight: number;
  outputWidth: number;
  outputHeight: number;
}) {
  const messages: string[] = [];

  if (savedPercent >= 70) {
    messages.push("Excellent compression. This image is much lighter now.");
  } else if (savedPercent >= 30) {
    messages.push("Good optimization. Try WebP or lower quality for a smaller file.");
  } else {
    messages.push(
      "Small savings. This image may already be optimized, or PNG compression is limited.",
    );
  }

  if (outputSize > 1024 * 1024) {
    messages.push("Still over 1 MB. Try smaller dimensions or target file size mode.");
  }

  if (inputWidth !== outputWidth || inputHeight !== outputHeight) {
    messages.push(
      `Resized from ${inputWidth} × ${inputHeight} to ${outputWidth} × ${outputHeight}.`,
    );
  }

  const isGood = savedPercent >= 30;

  return (
    <div
      className={`rounded-[var(--radius-md)] border p-3.5 ${
        isGood
          ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
          : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)]"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.06em] opacity-70">Result</p>
      <ul className="mt-1.5 space-y-1">
        {messages.map((msg) => (
          <li key={msg} className="text-xs leading-5">
            {msg}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BatchProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3">
      <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
        <span className="font-bold">
          Processing {current} of {total}…
        </span>
        <span className="font-bold">{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BatchSummaryCard({
  summary,
  onDownloadZip,
  zipDisabled,
  isZipping,
  zipError,
}: {
  summary: BatchSummary;
  onDownloadZip: () => void;
  zipDisabled: boolean;
  isZipping: boolean;
  zipError: string;
}) {
  const { successCount, failedCount, totalOriginalSize, totalOutputSize, averageSavedPercent } =
    summary;

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.06em] text-[var(--color-success-text)] opacity-70">
        Batch result
      </p>
      <p className="mt-1 text-sm font-black text-[var(--color-success-text)]">
        {successCount} image{successCount !== 1 ? "s" : ""} optimized
      </p>
      <p className="mt-0.5 text-sm text-[var(--color-success-text)]">
        {formatBytes(totalOriginalSize)} → {formatBytes(totalOutputSize)} · saved{" "}
        {averageSavedPercent}% on average
      </p>
      {failedCount > 0 && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          {failedCount} image{failedCount !== 1 ? "s" : ""} failed — try a different format or
          settings.
        </p>
      )}
      <Button
        className="mt-3"
        size="sm"
        onClick={onDownloadZip}
        loading={isZipping}
        disabled={zipDisabled}
        leftIcon={<Archive className="h-4 w-4" aria-hidden />}
      >
        Download all as ZIP
      </Button>
      {zipError && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{zipError}</p>
      )}
    </div>
  );
}
