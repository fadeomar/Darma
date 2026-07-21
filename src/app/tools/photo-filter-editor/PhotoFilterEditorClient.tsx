"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FlipHorizontal2,
  FlipVertical2,
  ImageOff,
  RotateCcw,
  RotateCw,
  Upload,
} from "lucide-react";
import { Button, CopyButton, Select } from "@/components/ui";
import {
  buildFilterString,
  buildTransformString,
  clampFilterState,
  createDefaultFilterState,
  createDefaultOrientation,
  EXPORT_MIME,
  FILTER_CONTROLS,
  formatControlValue,
  generateFilterCss,
  validateFilters,
} from "./filters";
import { DEFAULT_PRESET_ID, FILTER_PRESETS, getFilterPreset } from "./presets";
import type { ExportFormat, FilterState, Orientation } from "./types";

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

const MESSAGE_STYLES = {
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
} as const;

export default function PhotoFilterEditorClient() {
  const [filters, setFilters] = useState<FilterState>(createDefaultFilterState);
  const [orientation, setOrientation] = useState<Orientation>(createDefaultOrientation);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("edited-image");
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [status, setStatus] = useState("Upload an image to begin.");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const filterString = useMemo(() => buildFilterString(filters), [filters]);
  const transformString = useMemo(() => buildTransformString(orientation), [orientation]);
  const messages = validateFilters(filters, Boolean(imageEl));
  const cssClassName = fileName.trim() ? fileName.trim().replace(/\.[^.]+$/, "") : "filtered-image";

  const revokeUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => revokeUrl, [revokeUrl]);

  const loadFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setStatus("Unsupported file. Please choose an image (PNG, JPG, WebP, GIF).");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setStatus("That image is larger than 25 MB. Please choose a smaller file.");
        return;
      }
      setIsBusy(true);
      revokeUrl();
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      const img = new Image();
      img.onload = () => {
        setImageSrc(url);
        setImageEl(img);
        setFileName(file.name.replace(/\.[^.]+$/, "") || "edited-image");
        setOrientation(createDefaultOrientation());
        setIsBusy(false);
        setStatus(`Loaded ${file.name} (${img.naturalWidth}×${img.naturalHeight}). Adjust the filters below.`);
      };
      img.onerror = () => {
        revokeUrl();
        setIsBusy(false);
        setStatus("Could not decode that image. Try a different file.");
      };
      img.src = url;
    },
    [revokeUrl],
  );

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) => entry.type.startsWith("image/"));
      if (item) loadFile(item.getAsFile());
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadFile]);

  const applyPreset = useCallback((id: string) => {
    const preset = getFilterPreset(id);
    if (!preset) return;
    setFilters(preset.filters);
    setPresetId(id);
    setStatus(`Applied the ${preset.name} preset.`);
  }, []);

  const updateFilter = useCallback((key: keyof FilterState, value: number) => {
    setFilters((prev) => clampFilterState({ ...prev, [key]: value }));
    setPresetId("custom");
  }, []);

  const resetAll = useCallback(() => {
    setFilters(createDefaultFilterState());
    setOrientation(createDefaultOrientation());
    setPresetId(DEFAULT_PRESET_ID);
    setStatus("Reset all adjustments.");
  }, []);

  const removeImage = useCallback(() => {
    revokeUrl();
    setImageSrc(null);
    setImageEl(null);
    setStatus("Removed the image.");
  }, [revokeUrl]);

  const rotate = useCallback((direction: 1 | -1) => {
    setOrientation((prev) => ({ ...prev, rotate: (((prev.rotate + direction * 90) % 360) + 360) % 360 as Orientation["rotate"] }));
  }, []);

  const exportImage = useCallback(() => {
    if (!imageEl) return;
    setIsBusy(true);
    try {
      const swap = orientation.rotate === 90 || orientation.rotate === 270;
      const w = imageEl.naturalWidth;
      const h = imageEl.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = swap ? h : w;
      canvas.height = swap ? w : h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setStatus("Canvas is not supported in this browser.");
        setIsBusy(false);
        return;
      }
      if (exportFormat === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.filter = filterString === "none" ? "none" : filterString;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((orientation.rotate * Math.PI) / 180);
      ctx.scale(orientation.flipH ? -1 : 1, orientation.flipV ? -1 : 1);
      ctx.drawImage(imageEl, -w / 2, -h / 2, w, h);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setStatus("Export failed. Try a smaller image or a different format.");
            setIsBusy(false);
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${cssClassName}.${exportFormat === "jpeg" ? "jpg" : exportFormat}`;
          link.click();
          URL.revokeObjectURL(url);
          setIsBusy(false);
          setStatus(`Exported ${link.download} (${canvas.width}×${canvas.height}).`);
        },
        EXPORT_MIME[exportFormat],
        exportFormat === "png" ? undefined : 0.92,
      );
    } catch {
      setStatus("Export failed unexpectedly.");
      setIsBusy(false);
    }
  }, [imageEl, orientation, filterString, exportFormat, cssClassName]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Preview / dropzone */}
      <div className="min-w-0">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragOver(false);
            loadFile(event.dataTransfer.files?.[0]);
          }}
          className={`relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border p-4 [background-image:repeating-conic-gradient(var(--color-border-subtle)_0%_25%,transparent_0%_50%)] [background-size:24px_24px] ${
            isDragOver ? "border-[var(--color-primary)]" : "border-[var(--color-border-subtle)]"
          }`}
        >
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt="Editing preview"
              className="max-h-[60vh] max-w-full object-contain"
              style={{ filter: filterString, transform: transformString }}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <Upload className="h-8 w-8 text-[var(--color-text-tertiary)]" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                Drag &amp; drop an image here, paste from clipboard, or
              </p>
              <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                Choose image
              </Button>
              <p className="text-xs text-[var(--color-text-tertiary)]">Processed locally — never uploaded.</p>
            </div>
          )}
          {isBusy && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-base)]/60 text-sm font-bold">
              Working…
            </div>
          )}
        </div>

        {imageSrc && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" leftIcon={<Upload className="h-4 w-4" />} onClick={() => fileInputRef.current?.click()}>
              Replace
            </Button>
            <Button size="sm" variant="ghost" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => rotate(-1)}>
              Rotate left
            </Button>
            <Button size="sm" variant="ghost" leftIcon={<RotateCw className="h-4 w-4" />} onClick={() => rotate(1)}>
              Rotate right
            </Button>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<FlipHorizontal2 className="h-4 w-4" />}
              onClick={() => setOrientation((prev) => ({ ...prev, flipH: !prev.flipH }))}
            >
              Flip H
            </Button>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<FlipVertical2 className="h-4 w-4" />}
              onClick={() => setOrientation((prev) => ({ ...prev, flipV: !prev.flipV }))}
            >
              Flip V
            </Button>
            <Button size="sm" variant="ghost" leftIcon={<ImageOff className="h-4 w-4" />} onClick={removeImage}>
              Remove
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            loadFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <label htmlFor="filter-preset" className="mb-1 block text-xs font-bold text-[var(--color-text-secondary)]">
            Preset
          </label>
          <Select id="filter-preset" value={presetId} onChange={(event) => applyPreset(event.target.value)}>
            {presetId === "custom" && <option value="custom">Custom</option>}
            {FILTER_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
          {FILTER_CONTROLS.map((control) => (
            <label key={control.key} className="block">
              <span className="flex items-center justify-between text-xs font-bold text-[var(--color-text-secondary)]">
                {control.label}
                <span className="tabular-nums text-[var(--color-text-tertiary)]">
                  {formatControlValue(control, filters[control.key])}
                </span>
              </span>
              <input
                type="range"
                className="mt-1 w-full accent-[var(--color-primary)]"
                min={control.min}
                max={control.max}
                step={control.step}
                value={filters[control.key]}
                onChange={(event) => updateFilter(control.key, Number(event.target.value))}
                disabled={!imageEl}
              />
            </label>
          ))}
          <Button size="sm" variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={resetAll}>
            Reset adjustments
          </Button>
        </div>

        {/* Export */}
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
          <div className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Export</div>
          <label className="block text-xs font-bold text-[var(--color-text-secondary)]">
            Format
            <Select className="mt-1" value={exportFormat} onChange={(event) => setExportFormat(event.target.value as ExportFormat)}>
              <option value="png">PNG (lossless, transparent)</option>
              <option value="jpeg">JPEG (smaller, white background)</option>
              <option value="webp">WebP (small, transparent)</option>
            </Select>
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={exportImage} disabled={!imageEl || isBusy}>
              Download image
            </Button>
            <CopyButton size="sm" variant="secondary" getText={() => generateFilterCss(filters, cssClassName)}>
              Copy CSS
            </CopyButton>
          </div>
          <pre className="mt-3 overflow-auto rounded-[var(--radius-sm)] bg-[var(--color-code-surface)] p-3 text-xs text-[var(--color-text-primary)]">
            <code>filter: {filterString};</code>
          </pre>
        </div>

        {messages.length > 0 && (
          <ul className="flex flex-col gap-2">
            {messages.map((message, index) => (
              <li key={index} className={`rounded-[var(--radius-sm)] border px-3 py-2 text-xs ${MESSAGE_STYLES[message.type]}`}>
                {message.message}
              </li>
            ))}
          </ul>
        )}

        <div role="status" aria-live="polite" className="sr-only">
          {status}
        </div>
      </div>
    </div>
  );
}
