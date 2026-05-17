"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import { convertImage, formatBytes, IMAGE_OUTPUT_OPTIONS, outputFilename } from "./utils";
import type { ConvertedImage, ImageOutputFormat } from "./types";

export default function ImageConverterClient() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ImageOutputFormat>("image/webp");
  const [quality, setQuality] = useState(0.92);
  const [converted, setConverted] = useState<ConvertedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const originalPreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
    };
  }, [originalPreview]);

  useEffect(() => {
    return () => {
      if (converted?.url) URL.revokeObjectURL(converted.url);
    };
  }, [converted?.url]);

  async function handleConvert() {
    if (!file) {
      setError("Choose an image first.");
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      if (converted?.url) URL.revokeObjectURL(converted.url);
      const blob = await convertImage(file, format, quality);
      const url = URL.createObjectURL(blob);
      setConverted({
        name: outputFilename(file.name, format),
        url,
        format,
        size: blob.size,
      });
    } catch (conversionError) {
      setConverted(null);
      setError(conversionError instanceof Error ? conversionError.message : "Could not convert the image.");
    } finally {
      setIsConverting(false);
    }
  }

  function handleReset() {
    if (converted?.url) URL.revokeObjectURL(converted.url);
    setFile(null);
    setConverted(null);
    setError(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <Card padding="lg">
        <div className="space-y-5">
          <div>
            <label className="text-sm font-bold text-[var(--color-text)]" htmlFor="image-file">
              Image file
            </label>
            <input
              id="image-file"
              type="file"
              accept="image/*"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setConverted(null);
                setError(null);
              }}
              className="mt-2 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3 text-sm text-[var(--color-text)]"
            />
            {file ? (
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                {file.name} · {formatBytes(file.size)}
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-bold text-[var(--color-text)]" htmlFor="output-format">
              Output format
            </label>
            <select
              id="output-format"
              value={format}
              onChange={(event) => setFormat(event.target.value as ImageOutputFormat)}
              className="mt-2 min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 text-sm text-[var(--color-text)]"
            >
              {IMAGE_OUTPUT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-[var(--color-text)]" htmlFor="quality">
              Quality: {Math.round(quality * 100)}%
            </label>
            <input
              id="quality"
              type="range"
              min="0.5"
              max="1"
              step="0.01"
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
              className="mt-2 w-full"
              disabled={format === "image/png"}
            />
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Quality affects JPEG and WebP. PNG keeps lossless output.
            </p>
          </div>

          {error ? (
            <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleConvert} loading={isConverting}>Convert image</Button>
            <Button variant="secondary" onClick={handleReset}>Reset</Button>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <PreviewPanel title="Original" src={originalPreview} empty="Upload an image to preview it here." />
          <PreviewPanel title="Converted" src={converted?.url ?? null} empty="Convert an image to see the result." />
        </div>

        {converted ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4">
            <div>
              <p className="text-sm font-bold text-[var(--color-text)]">{converted.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{formatBytes(converted.size)}</p>
            </div>
            <a
              href={converted.url}
              download={converted.name}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-text)] transition hover:bg-[var(--color-primary-hover)]"
            >
              Download
            </a>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function PreviewPanel({ title, src, empty }: { title: string; src: string | null; empty: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-[var(--color-text)]">{title}</h3>
      <div className="mt-2 flex min-h-64 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`${title} preview`} className="max-h-80 max-w-full rounded-[var(--radius-sm)] object-contain" />
        ) : (
          <p className="max-w-xs text-center text-sm text-[var(--color-text-muted)]">{empty}</p>
        )}
      </div>
    </div>
  );
}
