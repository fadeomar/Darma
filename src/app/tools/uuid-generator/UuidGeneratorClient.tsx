"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge, Button, CopyButton, Field, Input, Select, Textarea } from "@/components/ui";
import { FORMAT_OPTIONS, OUTPUT_STYLE_OPTIONS, QUANTITY_PRESETS } from "./presets";
import { generateUuidBatch, hasSecureUuidSupport, normalizeUuidCount, serializeUuids, UUID_MAX_BATCH_SIZE } from "./uuid";
import type { UuidFormat, UuidOutputStyle } from "./types";

const DEFAULT_ERROR =
  "Secure UUID generation is not available in this browser. Please use a modern browser with crypto.randomUUID support.";

export default function UuidGeneratorClient() {
  const [quantity, setQuantity] = useState(1);
  const [customQuantity, setCustomQuantity] = useState("1");
  const [format, setFormat] = useState<UuidFormat>("standard");
  const [outputStyle, setOutputStyle] = useState<UuidOutputStyle>("lines");
  const [values, setValues] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const safeQuantity = useMemo(() => normalizeUuidCount(quantity), [quantity]);
  const output = useMemo(() => serializeUuids(values, outputStyle), [values, outputStyle]);
  const primaryUuid = values[0] ?? "";

  const generate = useCallback((nextQuantity: number, nextFormat: UuidFormat) => {
    try {
      if (!hasSecureUuidSupport()) {
        setError(DEFAULT_ERROR);
        setValues([]);
        return;
      }

      const safeCount = normalizeUuidCount(nextQuantity);
      setValues(generateUuidBatch(safeCount, nextFormat));
      setError(null);
    } catch (caught) {
      setValues([]);
      setError(caught instanceof Error ? caught.message : DEFAULT_ERROR);
    }
  }, []);

  useEffect(() => {
    generate(1, "standard");
  }, [generate]);

  function handlePresetQuantity(nextQuantity: number) {
    setQuantity(nextQuantity);
    setCustomQuantity(String(nextQuantity));
    generate(nextQuantity, format);
  }

  function handleCustomQuantity(rawValue: string) {
    const cleaned = rawValue.replace(/[^0-9]/g, "").slice(0, 3);
    const parsed = normalizeUuidCount(Number(cleaned || 1));
    setCustomQuantity(cleaned);
    setQuantity(parsed);
    generate(parsed, format);
  }

  function handleFormatChange(nextFormat: UuidFormat) {
    setFormat(nextFormat);
    generate(safeQuantity, nextFormat);
  }

  function handleDownload() {
    if (!output) return;

    const extension = outputStyle === "json" ? "json" : outputStyle === "csv" ? "csv" : "txt";
    const mimeType = outputStyle === "json" ? "application/json" : outputStyle === "csv" ? "text/csv" : "text/plain";
    const blob = new Blob([output], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `darma-uuids.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[var(--color-text)]">UUID Generator</h2>
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="h-3 w-3" aria-hidden /> Browser-only
            </Badge>
          </div>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
            Generate secure v4 UUIDs instantly for fixtures, database rows, mock APIs, and test data.
          </p>
        </div>
        <Button onClick={() => generate(safeQuantity, format)} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Regenerate
        </Button>
      </div>

      {error ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          <strong>Secure generation unavailable.</strong> {error} This tool fails closed and never falls back to Math.random().
        </div>
      ) : null}

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4 shadow-[var(--shadow-soft)] sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-text-soft)]">Current UUID</p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <code className="min-h-14 flex-1 break-all rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 font-mono text-lg font-bold leading-7 text-[var(--color-text)] sm:text-xl">
            {primaryUuid || "Generate a UUID to see it here"}
          </code>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={primaryUuid} disabled={!primaryUuid} variant="secondary">
              Copy UUID
            </CopyButton>
            <Button variant="secondary" onClick={() => generate(1, format)} leftIcon={<RefreshCw className="h-4 w-4" />}>
              One new UUID
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Field label="Quantity" description={`Generate 1 to ${UUID_MAX_BATCH_SIZE} UUIDs at once.`}>
          <div className="flex flex-wrap gap-2">
            {QUANTITY_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                variant={safeQuantity === preset.value ? "primary" : "secondary"}
                size="sm"
                onClick={() => handlePresetQuantity(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
            <Input
              aria-label="Custom quantity"
              inputMode="numeric"
              min={1}
              max={UUID_MAX_BATCH_SIZE}
              value={customQuantity}
              onChange={(event) => handleCustomQuantity(event.target.value)}
              className="w-24"
              placeholder="Custom"
            />
          </div>
        </Field>

        <Field label="Format" description="Choose how each UUID should be displayed.">
          <Select value={format} onChange={(event) => handleFormatChange(event.target.value as UuidFormat)}>
            {FORMAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <p className="font-mono text-xs text-[var(--color-text-soft)]">
            {FORMAT_OPTIONS.find((option) => option.value === format)?.description}
          </p>
        </Field>

        <Field label="Output style" description="Pick the export format for the batch output.">
          <Select value={outputStyle} onChange={(event) => setOutputStyle(event.target.value as UuidOutputStyle)}>
            {OUTPUT_STYLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Bulk output" description="Copy everything or download the batch as a small local file.">
        <Textarea
          readOnly
          value={output}
          placeholder="Generated UUIDs will appear here."
          className="min-h-72 font-mono text-xs leading-5"
        />
        <div className="flex flex-wrap gap-2">
          <CopyButton text={output} disabled={!output}>
            Copy all
          </CopyButton>
          <Button variant="secondary" onClick={handleDownload} disabled={!output} leftIcon={<Download className="h-4 w-4" />}>
            Download .{outputStyle === "json" ? "json" : outputStyle === "csv" ? "csv" : "txt"}
          </Button>
        </div>
      </Field>
    </div>
  );
}
