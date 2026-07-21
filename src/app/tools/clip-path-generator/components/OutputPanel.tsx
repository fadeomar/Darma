"use client";

import { useState } from "react";
import { Download, FileCode2, FileImage, Upload } from "lucide-react";
import { Button, CopyButton, Input, Tabs } from "@/components/ui";
import type { ClipOutputFormat } from "../types";

const FORMAT_ITEMS: { value: ClipOutputFormat; label: string }[] = [
  { value: "css", label: "CSS" },
  { value: "value", label: "Value" },
  { value: "tailwind", label: "Tailwind" },
  { value: "react", label: "React" },
];

export function OutputPanel({
  className,
  outputFormat,
  output,
  cssOutput,
  webkitFallback,
  validShape,
  hasImage,
  onClassNameChange,
  onOutputFormatChange,
  onWebkitFallbackChange,
  onDownloadCss,
  onExportJson,
  onImportJson,
  onExportSvg,
  onExportPng,
}: {
  className: string;
  outputFormat: ClipOutputFormat;
  output: string;
  cssOutput: string;
  webkitFallback: boolean;
  validShape: boolean;
  hasImage: boolean;
  onClassNameChange: (value: string) => void;
  onOutputFormatChange: (value: ClipOutputFormat) => void;
  onWebkitFallbackChange: (value: boolean) => void;
  onDownloadCss: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onExportSvg: (embedImage: boolean) => void;
  onExportPng: () => void;
}) {
  const [embedImage, setEmbedImage] = useState(false);
  return (
    <section aria-labelledby="output-panel-title" className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 id="output-panel-title" className="text-sm font-black text-[var(--color-text-primary)]">Output & export</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Generated from the current polygon.</p>
        </div>
      </div>
      <label className="mt-3 block text-xs font-bold text-[var(--color-text-secondary)]">
        Class name
        <Input className="mt-1" value={className} onChange={(event) => onClassNameChange(event.target.value)} spellCheck={false} />
      </label>
      <Tabs className="mt-3 min-w-0" fullWidth items={FORMAT_ITEMS} value={outputFormat} onChange={onOutputFormatChange} ariaLabel="Output format" />
      <pre className="mt-3 max-h-56 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-md)] bg-[var(--color-code-surface)] p-3 text-xs leading-relaxed text-[var(--color-code-text)]"><code>{validShape ? output : "Fix the blocking polygon validation errors to generate export-ready code."}</code></pre>
      <label className="mt-3 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <input type="checkbox" checked={webkitFallback} onChange={(event) => onWebkitFallbackChange(event.target.checked)} /> Include <code>-webkit-clip-path</code>
      </label>
      {!validShape ? <p className="mt-2 text-xs text-[var(--color-danger-text)]">Code and file exports are disabled until the polygon is valid.</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton size="sm" text={validShape ? output : ""} disabled={!validShape}>Copy current</CopyButton>
        <CopyButton size="sm" variant="secondary" text={validShape ? cssOutput : ""} disabled={!validShape}>Copy CSS</CopyButton>
        <Button size="sm" variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={onDownloadCss} disabled={!validShape}>CSS file</Button>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button size="sm" variant="ghost" leftIcon={<FileCode2 className="h-4 w-4" />} onClick={onExportJson} disabled={!validShape}>Export JSON</Button>
        <Button size="sm" variant="ghost" leftIcon={<Upload className="h-4 w-4" />} onClick={onImportJson}>Import JSON</Button>
        <Button size="sm" variant="secondary" leftIcon={<FileCode2 className="h-4 w-4" />} onClick={() => onExportSvg(embedImage)} disabled={!validShape}>Export SVG</Button>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<FileImage className="h-4 w-4" />}
          onClick={onExportPng}
          disabled={!validShape || !hasImage}
          title={!hasImage ? "Load an image to export PNG" : !validShape ? "Fix validation errors before exporting PNG" : "Export the current preview composition"}
        >
          Preview PNG
        </Button>
      </div>
      <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-[var(--color-text-secondary)]">
        <input type="checkbox" checked={embedImage} disabled={!hasImage} onChange={(event) => setEmbedImage(event.target.checked)} className="mt-1" /> Embed the current local image in SVG (up to 8 MB)
      </label>
      <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">
        PNG export matches the current canvas ratio, image fit, and image position without unnecessary upscaling. Preview backgrounds remain transparent.
      </p>
    </section>
  );
}
