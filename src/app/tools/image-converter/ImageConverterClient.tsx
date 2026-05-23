"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Download, Image as ImageIcon, RefreshCw, Upload } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import type { ConvertedImage, ImageOutputFormat } from "./types";
import { formatBytes, getExtension, OUTPUT_FORMATS, replaceExtension } from "./utils";

type SourceImage = {
  file: File;
  url: string;
  width: number;
  height: number;
};

const MAX_IMAGE_FILE_SIZE_BYTES = 12 * 1024 * 1024;

function clampDimension(value: number, fallback: number) {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(1, Math.min(Math.round(value), 12000));
}

async function loadImage(file: File): Promise<SourceImage> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return { file, url, width: image.naturalWidth, height: image.naturalHeight };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

async function convertImage({
  source,
  format,
  quality,
  width,
  height,
}: {
  source: SourceImage;
  format: ImageOutputFormat;
  quality: number;
  width: number;
  height: number;
}): Promise<ConvertedImage> {
  const image = new Image();
  image.decoding = "async";
  image.src = source.url;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported in this browser.");

  if (format === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Unable to export image."));
      },
      format,
      quality,
    );
  });

  const extension = getExtension(format);
  return {
    name: replaceExtension(source.file.name, extension),
    size: blob.size,
    width,
    height,
    url: URL.createObjectURL(blob),
    blob,
    mimeType: format,
  };
}

export default function ImageConverterClient() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [format, setFormat] = useState<ImageOutputFormat>("image/webp");
  const [quality, setQuality] = useState(0.86);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [converted, setConverted] = useState<ConvertedImage | null>(null);
  const [error, setError] = useState("");
  const [converting, setConverting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const ratio = useMemo(() => {
    if (!source?.width || !source?.height) return 1;
    return source.width / source.height;
  }, [source]);

  useEffect(() => {
    return () => {
      if (source?.url) URL.revokeObjectURL(source.url);
    };
  }, [source?.url]);

  useEffect(() => {
    return () => {
      if (converted?.url) URL.revokeObjectURL(converted.url);
    };
  }, [converted?.url]);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setConverted((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      setError(`Please choose an image smaller than ${formatBytes(MAX_IMAGE_FILE_SIZE_BYTES)}.`);
      return;
    }

    try {
      if (source?.url) URL.revokeObjectURL(source.url);
      const loaded = await loadImage(file);
      setSource(loaded);
      setWidth(loaded.width);
      setHeight(loaded.height);
    } catch {
      setError("Could not read this image. Try a PNG, JPEG, or WebP file.");
    }
  };

  const updateWidth = (value: string) => {
    const nextWidth = clampDimension(Number(value), source?.width ?? 1);
    setWidth(nextWidth);
    if (lockRatio) setHeight(clampDimension(nextWidth / ratio, source?.height ?? 1));
  };

  const updateHeight = (value: string) => {
    const nextHeight = clampDimension(Number(value), source?.height ?? 1);
    setHeight(nextHeight);
    if (lockRatio) setWidth(clampDimension(nextHeight * ratio, source?.width ?? 1));
  };

  const resetSize = () => {
    if (!source) return;
    setWidth(source.width);
    setHeight(source.height);
  };

  const handleConvert = async () => {
    if (!source) {
      setError("Upload an image first.");
      return;
    }

    setError("");
    setConverting(true);
    try {
      if (converted?.url) URL.revokeObjectURL(converted.url);
      const output = await convertImage({
        source,
        format,
        quality,
        width: clampDimension(width, source.width),
        height: clampDimension(height, source.height),
      });
      setConverted(output);
    } catch {
      setError("Conversion failed. Your browser may not support this output format.");
    } finally {
      setConverting(false);
    }
  };

  const download = () => {
    if (!converted) return;
    const link = document.createElement("a");
    link.href = converted.url;
    link.download = converted.name;
    link.click();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5">
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6 text-center">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/*"
            className="sr-only"
            onChange={handleFile}
          />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            <Upload className="h-7 w-7" aria-hidden />
          </div>
          <h2 className="mt-4 text-xl font-black text-[var(--color-text)]">Upload an image</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
            Pick a PNG, JPEG, WebP, or other browser-readable image up to {formatBytes(MAX_IMAGE_FILE_SIZE_BYTES)}. Conversion
            happens in your browser using canvas.
          </p>
          <Button className="mt-4" onClick={() => inputRef.current?.click()} leftIcon={<ImageIcon className="h-4 w-4" />}>
            Choose image
          </Button>
          {error ? <p className="mt-3 text-sm font-semibold text-[var(--color-danger)]">{error}</p> : null}
        </div>

        {source ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="text-sm font-black text-[var(--color-text)]">Original</h3>
              <img src={source.url} alt="Original upload preview" className="mt-3 max-h-80 w-full rounded-[var(--radius-md)] object-contain" />
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)]">
                <div><dt className="font-bold">Size</dt><dd>{formatBytes(source.file.size)}</dd></div>
                <div><dt className="font-bold">Dimensions</dt><dd>{source.width} × {source.height}</dd></div>
              </dl>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="text-sm font-black text-[var(--color-text)]">Converted</h3>
              {converted ? (
                <>
                  <img src={converted.url} alt="Converted output preview" className="mt-3 max-h-80 w-full rounded-[var(--radius-md)] object-contain" />
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)]">
                    <div><dt className="font-bold">Size</dt><dd>{formatBytes(converted.size)}</dd></div>
                    <div><dt className="font-bold">Dimensions</dt><dd>{converted.width} × {converted.height}</dd></div>
                  </dl>
                </>
              ) : (
                <div className="mt-3 flex min-h-80 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
                  Converted preview appears here.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <aside className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-black text-[var(--color-text)]">Export settings</h2>

        <Field label="Output format">
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value as ImageOutputFormat)}
            className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          >
            {OUTPUT_FORMATS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Quality" description="Used for JPEG and WebP. PNG is lossless.">
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            value={quality}
            disabled={format === "image/png"}
            onChange={(event) => setQuality(Number(event.target.value))}
            className="w-full accent-[var(--color-primary)] disabled:opacity-40"
          />
          <p className="text-xs font-semibold text-[var(--color-text-muted)]">{Math.round(quality * 100)}%</p>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Width">
            <Input type="number" min={1} value={width || ""} onChange={(event) => updateWidth(event.target.value)} />
          </Field>
          <Field label="Height">
            <Input type="number" min={1} value={height || ""} onChange={(event) => updateHeight(event.target.value)} />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]">
          <input type="checkbox" checked={lockRatio} onChange={(event) => setLockRatio(event.target.checked)} />
          Lock aspect ratio
        </label>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleConvert} loading={converting} disabled={!source} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Convert
          </Button>
          <Button variant="secondary" onClick={resetSize} disabled={!source}>
            Reset size
          </Button>
          <Button variant="soft" onClick={download} disabled={!converted} leftIcon={<Download className="h-4 w-4" />}>
            Download
          </Button>
        </div>
      </aside>
    </div>
  );
}
