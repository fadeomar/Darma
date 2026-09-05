"use client";

import Image from "next/image";
import { useMemo, useRef, useState, type ReactNode } from "react";
import JSZip from "jszip";
import {
  AlertTriangle,
  Binary,
  Braces,
  CheckCircle2,
  Code2,
  Download,
  FileText,
  FileUp,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Button, CopyButton, Input, Select, Textarea } from "@/components/ui";
import { SegmentedControl } from "@/features/tools/components";
import { downloadText } from "../_shared/clientUtils";
import {
  BASE64_HEX_PREVIEW_BYTES,
  BASE64_MAX_FILE_BYTES,
  buildBase64Checks,
  buildBase64CodeSnippet,
  buildBase64Report,
  buildHexPreview,
  bytesToBase64,
  computeBase64Stats,
  decodeBase64,
  encodeBase64,
  encodeBytes,
  extractBase64Payload,
  formatBytes,
} from "./base64";
import { BASE64_PRESETS, DEFAULT_ENCODE_OPTIONS, MIME_TYPE_OPTIONS } from "./presets";
import type {
  Base64Alphabet,
  Base64CheckLevel,
  Base64DecodeAlphabet,
  Base64DecodeOptions,
  Base64EncodeOptions,
  Base64LineWrap,
  Base64Mode,
  Base64OutputKind,
  Base64SourceKind,
} from "./types";

type OutputTab = "result" | "hex" | "code";

interface LocalFileState {
  name: string;
  type: string;
  size: number;
  bytes: Uint8Array;
}

const CHECK_STYLES: Record<Base64CheckLevel, string> = {
  success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  danger: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
};

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
    <div className="truncate font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
    <div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]" title={value}>{value}</div>
    <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{hint}</div>
  </div>;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-sm)] ${className}`}>{children}</section>;
}

export default function Base64Client() {
  const firstPreset = BASE64_PRESETS[0]!;
  const [mode, setMode] = useState<Base64Mode>(firstPreset.mode);
  const [sourceKind, setSourceKind] = useState<Base64SourceKind>("text");
  const [input, setInput] = useState(firstPreset.value);
  const [fileState, setFileState] = useState<LocalFileState | null>(null);
  const [fileError, setFileError] = useState("");
  const [encodeOptions, setEncodeOptions] = useState<Base64EncodeOptions>({
    ...DEFAULT_ENCODE_OPTIONS,
    mimeType: firstPreset.mimeType ?? DEFAULT_ENCODE_OPTIONS.mimeType,
  });
  const [decodeOptions, setDecodeOptions] = useState<Base64DecodeOptions>({ alphabet: "auto", strict: false });
  const [outputTab, setOutputTab] = useState<OutputTab>("result");
  const [showAllPresets, setShowAllPresets] = useState(false);
  const rawFileInputRef = useRef<HTMLInputElement>(null);
  const textFileInputRef = useRef<HTMLInputElement>(null);

  const activeEncodeOptions = useMemo<Base64EncodeOptions>(() => ({
    ...encodeOptions,
    mimeType: sourceKind === "file" && fileState?.type ? fileState.type : encodeOptions.mimeType,
  }), [encodeOptions, sourceKind, fileState]);

  const encodeResult = useMemo(() => {
    if (mode !== "encode") return undefined;
    return sourceKind === "file"
      ? encodeBytes(fileState?.bytes ?? new Uint8Array(), activeEncodeOptions)
      : encodeBase64(input, activeEncodeOptions);
  }, [mode, sourceKind, fileState, activeEncodeOptions, input]);

  const decodeResult = useMemo(
    () => mode === "decode" ? decodeBase64(input, decodeOptions) : undefined,
    [mode, input, decodeOptions],
  );

  const encodedPayload = useMemo(() => {
    if (mode === "encode") return encodeResult?.payload ?? "";
    return extractBase64Payload(input).payload;
  }, [mode, encodeResult, input]);

  const output = mode === "encode"
    ? encodeResult?.output ?? ""
    : decodeResult?.text ?? "";
  const sourceBytes = mode === "encode"
    ? encodeResult?.sourceBytes.length ?? 0
    : new TextEncoder().encode(input).length;
  const decodedBytes = mode === "decode"
    ? decodeResult?.bytes.length ?? 0
    : encodeResult?.sourceBytes.length ?? 0;
  const stats = useMemo(() => computeBase64Stats({
    sourceBytes,
    encodedPayload,
    decodedBytes,
    output,
  }), [sourceBytes, encodedPayload, decodedBytes, output]);

  const checks = useMemo(() => buildBase64Checks({
    mode,
    sourceKind,
    input: sourceKind === "file" ? "" : input,
    fileSize: fileState?.size,
    encodeOptions: activeEncodeOptions,
    encodeResult,
    decodeOptions,
    decodeResult,
  }), [mode, sourceKind, input, fileState, activeEncodeOptions, encodeResult, decodeOptions, decodeResult]);

  const codeSnippet = useMemo(
    () => buildBase64CodeSnippet(mode, sourceKind, activeEncodeOptions),
    [mode, sourceKind, activeEncodeOptions],
  );
  const report = useMemo(() => buildBase64Report({
    mode,
    sourceKind,
    file: sourceKind === "file" && fileState ? { name: fileState.name, type: fileState.type, size: fileState.size } : undefined,
    encodeOptions: activeEncodeOptions,
    decodeOptions,
    encodeResult,
    decodeResult,
    stats,
    checks,
  }), [mode, sourceKind, fileState, activeEncodeOptions, decodeOptions, encodeResult, decodeResult, stats, checks]);
  const reportJson = useMemo(() => `${JSON.stringify(report, null, 2)}\n`, [report]);
  const inspectionBytes = mode === "encode" ? encodeResult?.sourceBytes : decodeResult?.bytes;
  const hexPreview = useMemo(
    () => inspectionBytes?.length ? buildHexPreview(inspectionBytes) : "",
    [inspectionBytes],
  );
  const reviewCount = checks.filter((check) => check.level === "warning" || check.level === "danger").length;
  const isBinaryDecode = mode === "decode" && Boolean(decodeResult?.ok && decodeResult.text === null);
  const canSwap = mode === "encode" ? Boolean(encodeResult?.output) : Boolean(decodeResult?.ok && decodeResult.text !== null);

  const imagePreviewSource = useMemo(() => {
    if (mode === "encode" && encodeResult && activeEncodeOptions.mimeType.startsWith("image/") && encodeResult.sourceBytes.length <= 1024 * 1024) {
      return `data:${activeEncodeOptions.mimeType};base64,${bytesToBase64(encodeResult.sourceBytes)}`;
    }
    if (mode === "decode" && decodeResult?.ok && decodeResult.mimeType.startsWith("image/") && decodeResult.bytes.length <= 1024 * 1024) {
      return `data:${decodeResult.mimeType};base64,${bytesToBase64(decodeResult.bytes)}`;
    }
    return "";
  }, [mode, encodeResult, activeEncodeOptions.mimeType, decodeResult]);

  function changeMode(nextMode: Base64Mode) {
    setMode(nextMode);
    if (nextMode === "decode") setSourceKind("text");
    setOutputTab("result");
    setFileError("");
  }

  function updateEncodeOption<K extends keyof Base64EncodeOptions>(key: K, value: Base64EncodeOptions[K]) {
    setEncodeOptions((current) => ({ ...current, [key]: value }));
  }

  function applyPreset(id: string) {
    const preset = BASE64_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setMode(preset.mode);
    setSourceKind("text");
    setInput(preset.value);
    setFileState(null);
    setFileError("");
    setOutputTab("result");
    if (preset.alphabet) setDecodeOptions((current) => ({ ...current, alphabet: preset.alphabet!, strict: preset.strict ?? false }));
    if (preset.outputKind || preset.mimeType) {
      setEncodeOptions((current) => ({
        ...current,
        outputKind: preset.outputKind ?? current.outputKind,
        mimeType: preset.mimeType ?? current.mimeType,
      }));
    }
  }

  function swapDirection() {
    if (!canSwap) return;
    if (mode === "encode" && encodeResult) {
      setInput(encodeResult.output);
      setMode("decode");
      setSourceKind("text");
      setDecodeOptions((current) => ({ ...current, alphabet: activeEncodeOptions.alphabet }));
    } else if (decodeResult?.text !== null && decodeResult?.text !== undefined) {
      setInput(decodeResult.text);
      setMode("encode");
      setSourceKind("text");
      setEncodeOptions((current) => ({ ...current, mimeType: decodeResult.mimeType }));
    }
    setFileState(null);
    setOutputTab("result");
  }

  async function importRawFile(file: File | undefined) {
    if (!file) return;
    if (file.size > BASE64_MAX_FILE_BYTES) {
      setFileError(`File is ${formatBytes(file.size)}. The local limit is ${formatBytes(BASE64_MAX_FILE_BYTES)}.`);
      setFileState(null);
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    setFileState({ name: file.name, type: file.type || "application/octet-stream", size: file.size, bytes });
    setFileError("");
    setEncodeOptions((current) => ({ ...current, mimeType: file.type || current.mimeType }));
  }

  async function importBase64Text(file: File | undefined) {
    if (!file) return;
    if (file.size > BASE64_MAX_FILE_BYTES) {
      setFileError(`Text file is ${formatBytes(file.size)}. The local limit is ${formatBytes(BASE64_MAX_FILE_BYTES)}.`);
      return;
    }
    setInput(await file.text());
    setFileError("");
    setMode("decode");
    setSourceKind("text");
  }

  function downloadDecodedFile() {
    if (!decodeResult?.ok || !decodeResult.bytes.length) return;
    const blob = new Blob([decodeResult.bytes.slice().buffer], { type: decodeResult.mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = decodeResult.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function downloadProductionPack() {
    const hasResult = mode === "encode" ? Boolean(encodeResult?.output) : Boolean(decodeResult?.ok);
    if (!hasResult) return;
    const zip = new JSZip();
    zip.file("base64-report.json", reportJson);
    zip.file("browser-example.js", codeSnippet);
    if (mode === "encode" && encodeResult) {
      zip.file(activeEncodeOptions.outputKind === "data-url" ? "encoded-data-url.txt" : "encoded-base64.txt", encodeResult.output);
    }
    if (mode === "decode" && decodeResult?.ok) {
      zip.file("normalized-base64.txt", decodeResult.normalizedPayload);
      zip.file(decodeResult.fileName, decodeResult.bytes);
      if (decodeResult.text !== null) zip.file("decoded-text.txt", decodeResult.text);
    }
    zip.file("README.md", "# Darma Base64 production pack\n\nThis pack was generated locally in the browser. It contains the transformed output, a metadata-only validation report, and a browser implementation example.\n\nBase64 is encoding, not encryption. Never treat an encoded secret as protected data.\n");
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "base64-production-pack.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const outputTabs: Array<{ id: OutputTab; label: string }> = [
    { id: "result", label: isBinaryDecode ? "Binary preview" : "Result" },
    { id: "hex", label: `Hex${inspectionBytes?.length ? ` (${Math.min(inspectionBytes.length, BASE64_HEX_PREVIEW_BYTES)} B)` : ""}` },
    { id: "code", label: "Code" },
  ];

  const profileValue = mode === "encode"
    ? activeEncodeOptions.outputKind === "data-url" ? "Data URL" : activeEncodeOptions.alphabet === "url-safe" ? "Base64URL" : "Base64"
    : decodeResult?.ok ? decodeResult.mimeType.split(";")[0] : decodeOptions.alphabet === "auto" ? "Auto detect" : decodeOptions.alphabet;

  return <div className="space-y-4">
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
      <main className="min-w-0 space-y-4">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Transform setup</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <SegmentedControl<Base64Mode>
                  ariaLabel="Base64 operation"
                  value={mode}
                  onChange={changeMode}
                  options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]}
                />
                {mode === "encode" ? <SegmentedControl<Base64SourceKind>
                  ariaLabel="Encode source"
                  value={sourceKind}
                  onChange={(value) => { setSourceKind(value); setFileError(""); }}
                  options={[{ value: "text", label: "Text" }, { value: "file", label: "File" }]}
                /> : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-2.5 py-1 text-xs font-bold text-[var(--color-info-text)]"><ShieldCheck className="h-3.5 w-3.5" />Local only</span>
              <Button size="sm" variant="secondary" disabled={!canSwap} onClick={swapDirection}><RefreshCw className="h-4 w-4" />Swap direction</Button>
              <Button size="sm" variant="ghost" onClick={() => { setInput(""); setFileState(null); setFileError(""); }}>Clear</Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-[var(--color-text-primary)]">{mode === "encode" ? "Source data" : "Base64 input"}</h2>
              <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{mode === "encode" ? "Encode UTF-8 text or raw file bytes without uploading them." : "Paste standard Base64, Base64URL, wrapped MIME content, or a Data URL."}</p>
            </div>
            {mode === "decode" ? <Button size="sm" variant="secondary" onClick={() => textFileInputRef.current?.click()}><FileUp className="h-4 w-4" />Import .txt</Button> : <span className="rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-xs font-bold text-[var(--color-text-tertiary)]">{sourceKind === "file" ? "Raw file bytes" : "UTF-8 text"}</span>}
          </div>

          {mode === "encode" && sourceKind === "file" ? <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)] p-5 text-center">
            <input ref={rawFileInputRef} type="file" className="hidden" onChange={(event) => void importRawFile(event.target.files?.[0])} />
            {fileState ? <div className="mx-auto max-w-lg">
              <FileText className="mx-auto h-8 w-8 text-[var(--color-accent-text)]" />
              <div className="mt-2 break-all font-bold text-[var(--color-text-primary)]">{fileState.name}</div>
              <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">{formatBytes(fileState.size)} · {fileState.type}</div>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => rawFileInputRef.current?.click()}>Replace file</Button>
                <Button size="sm" variant="ghost" onClick={() => setFileState(null)}><X className="h-4 w-4" />Remove</Button>
              </div>
            </div> : <div>
              <FileUp className="mx-auto h-8 w-8 text-[var(--color-text-tertiary)]" />
              <div className="mt-2 font-bold text-[var(--color-text-primary)]">Select a local file</div>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Raw bytes are supported up to {formatBytes(BASE64_MAX_FILE_BYTES)}.</p>
              <Button className="mt-3" size="sm" onClick={() => rawFileInputRef.current?.click()}>Choose file</Button>
            </div>}
          </div> : <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={14}
            variant="editor"
            spellCheck={false}
            aria-invalid={Boolean(mode === "decode" && decodeResult && !decodeResult.ok)}
            placeholder={mode === "encode" ? "Type or paste UTF-8 text..." : "Paste Base64, Base64URL, MIME-wrapped content, or a data: URL..."}
          />}
          <input ref={textFileInputRef} type="file" accept=".txt,.b64,.base64,text/plain" className="hidden" onChange={(event) => void importBase64Text(event.target.files?.[0])} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-tertiary)]">
            <span>{mode === "encode" && sourceKind === "file" ? (fileState ? `${fileState.size.toLocaleString()} raw bytes` : "No file selected") : `${input.length.toLocaleString()} characters · ${formatBytes(new TextEncoder().encode(input).length)}`}</span>
            {mode === "decode" && decodeResult?.error ? <span className="font-semibold text-[var(--color-danger-text)]">{decodeResult.error.message}</span> : null}
          </div>
          {fileError ? <div className="mt-2 rounded-[var(--radius-sm)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-2 text-xs text-[var(--color-danger-text)]">{fileError}</div> : null}
        </Card>

        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-[var(--color-text-primary)]">Output inspector</h2>
              <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Review the transformed result, raw bytes, or implementation snippet.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {mode === "encode" ? <CopyButton text={encodeResult?.output ?? ""} size="sm" variant="secondary">Copy output</CopyButton> : decodeResult?.text !== null && decodeResult?.text !== undefined ? <CopyButton text={decodeResult.text} size="sm" variant="secondary">Copy text</CopyButton> : null}
              {mode === "encode" ? <Button size="sm" variant="secondary" disabled={!encodeResult?.output} onClick={() => downloadText(activeEncodeOptions.outputKind === "data-url" ? "encoded-data-url.txt" : "encoded-base64.txt", encodeResult?.output ?? "")}><Download className="h-4 w-4" />Download</Button> : <Button size="sm" variant="secondary" disabled={!decodeResult?.ok || !decodeResult.bytes.length} onClick={downloadDecodedFile}><Download className="h-4 w-4" />Download file</Button>}
            </div>
          </div>

          <div className="mb-3 flex gap-1 overflow-x-auto rounded-[var(--radius-sm)] bg-[var(--color-surface-subtle)] p-1">
            {outputTabs.map((tab) => <button key={tab.id} type="button" onClick={() => setOutputTab(tab.id)} className={`whitespace-nowrap rounded-[var(--radius-xs)] px-3 py-1.5 text-xs font-bold transition ${outputTab === tab.id ? "bg-[var(--color-surface-base)] text-[var(--color-text-primary)] shadow-[var(--shadow-xs)]" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"}`}>{tab.label}</button>)}
          </div>

          {outputTab === "result" ? <div className="space-y-3">
            {imagePreviewSource ? <div className="flex min-h-28 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[linear-gradient(45deg,var(--color-surface-subtle)_25%,transparent_25%,transparent_75%,var(--color-surface-subtle)_75%),linear-gradient(45deg,var(--color-surface-subtle)_25%,transparent_25%,transparent_75%,var(--color-surface-subtle)_75%)] bg-[length:18px_18px] bg-[position:0_0,9px_9px] p-3"><Image src={imagePreviewSource} alt="Decoded or encoded local preview" width={640} height={320} unoptimized className="h-auto max-h-52 w-auto max-w-full object-contain" /></div> : null}
            {isBinaryDecode ? <div className="rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-4 text-[var(--color-warning-text)]">
              <div className="flex items-center gap-2 font-bold"><Binary className="h-5 w-5" />Binary payload</div>
              <p className="mt-1 text-xs leading-5">These {formatBytes(decodedBytes)} are not valid UTF-8 text. Use the hex view for inspection or download the detected <code className="font-mono">{decodeResult?.fileName}</code> file.</p>
            </div> : <Textarea value={mode === "encode" ? encodeResult?.output ?? "" : decodeResult?.text ?? ""} readOnly rows={14} variant="output" placeholder="Transformed output will appear here." />}
            <div className="flex flex-wrap justify-between gap-2 text-xs text-[var(--color-text-tertiary)]">
              <span>{mode === "encode" ? `${stats.encodedCharacters.toLocaleString()} payload characters · ${stats.lineCount.toLocaleString()} line(s)` : `${formatBytes(decodedBytes)} · ${decodeResult?.mimeType ?? "unknown type"}`}</span>
              <span>{stats.paddingCharacters} padding character(s) · {stats.overheadPercent}% overhead</span>
            </div>
          </div> : null}

          {outputTab === "hex" ? <div>
            {inspectionBytes?.length ? <Textarea value={hexPreview} readOnly rows={14} variant="output" aria-label="Byte hex preview" /> : <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-6 text-center text-sm text-[var(--color-text-tertiary)]">{mode === "encode" ? "Add source data" : "Decode a valid payload"} to inspect its first {BASE64_HEX_PREVIEW_BYTES} bytes.</div>}
          </div> : null}

          {outputTab === "code" ? <div>
            <div className="mb-2 flex justify-end"><CopyButton text={codeSnippet} size="sm" variant="secondary">Copy JavaScript</CopyButton></div>
            <pre className="max-h-[420px] overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-code-surface)] p-4 text-xs leading-6 text-[var(--color-code-text)]"><code>{codeSnippet}</code></pre>
          </div> : null}
        </Card>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Source" value={formatBytes(mode === "encode" ? sourceBytes : new TextEncoder().encode(input).length)} hint={sourceKind === "file" && fileState ? fileState.name : `${input.length.toLocaleString()} characters`} />
          <SummaryCard label={mode === "encode" ? "Encoded output" : "Decoded bytes"} value={mode === "encode" ? `${stats.encodedCharacters.toLocaleString()} chars` : formatBytes(decodedBytes)} hint={mode === "encode" ? `${stats.overheadPercent}% Base64 overhead` : decodeResult?.text === null ? "Binary payload" : "UTF-8 text payload"} />
          <SummaryCard label="Profile" value={profileValue} hint={mode === "encode" ? `${activeEncodeOptions.outputKind === "data-url" ? "No" : activeEncodeOptions.lineWrap || "No"} line wrap${activeEncodeOptions.removePadding ? " · no padding" : ""}` : `${decodeResult?.detectedAlphabet ?? "neutral"} alphabet`} />
          <SummaryCard label="Production review" value={reviewCount ? `${reviewCount} flag${reviewCount === 1 ? "" : "s"}` : "Ready"} hint={`${checks.length} checks · local only`} />
        </div>
      </main>

      <aside className="min-w-0 space-y-4">
        <Card>
          <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Sparkles className="h-4 w-4" />Practical presets</div>
          <div className="space-y-2">{(showAllPresets ? BASE64_PRESETS : BASE64_PRESETS.slice(0, 6)).map((preset) => <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] p-2.5 text-left transition hover:border-[var(--color-accent)]">
            <div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-[var(--color-text-primary)]">{preset.label}</span><span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-0.5 font-mono text-xs uppercase text-[var(--color-text-tertiary)]">{preset.mode}</span></div>
            <div className="mt-0.5 text-xs leading-4 text-[var(--color-text-tertiary)]">{preset.description}</div>
          </button>)}</div>
          {BASE64_PRESETS.length > 6 ? (
            <Button className="mt-3 w-full" size="sm" variant="ghost" onClick={() => setShowAllPresets((value) => !value)}>
              {showAllPresets ? "Show fewer presets" : `Show all ${BASE64_PRESETS.length} presets`}
            </Button>
          ) : null}
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><Braces className="h-4 w-4" />{mode === "encode" ? "Encoding options" : "Decode validation"}</div>
          {mode === "encode" ? <div className="space-y-3">
            <label className="block text-xs font-semibold text-[var(--color-text-muted)]">Alphabet<Select size="sm" className="mt-1" value={activeEncodeOptions.alphabet} onChange={(event) => updateEncodeOption("alphabet", event.target.value as Base64Alphabet)}><option value="standard">Standard (+ /)</option><option value="url-safe">URL-safe (- _)</option></Select></label>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)]">Output format<Select size="sm" className="mt-1" value={activeEncodeOptions.outputKind} onChange={(event) => updateEncodeOption("outputKind", event.target.value as Base64OutputKind)}><option value="base64">Base64 payload</option><option value="data-url">Complete Data URL</option></Select></label>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)]">Line wrapping<Select size="sm" className="mt-1" disabled={activeEncodeOptions.outputKind === "data-url"} value={String(activeEncodeOptions.lineWrap)} onChange={(event) => updateEncodeOption("lineWrap", Number(event.target.value) as Base64LineWrap)}><option value="0">No wrapping</option><option value="64">64 characters</option><option value="76">76 characters (MIME)</option></Select></label>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)]">MIME type<Input size="sm" className="mt-1" list="base64-mime-types" value={activeEncodeOptions.mimeType} disabled={sourceKind === "file" && Boolean(fileState?.type)} onChange={(event) => updateEncodeOption("mimeType", event.target.value)} /></label>
            <datalist id="base64-mime-types">{MIME_TYPE_OPTIONS.map((value) => <option key={value} value={value} />)}</datalist>
            <Button className="w-full" size="sm" variant={activeEncodeOptions.removePadding ? "primary" : "secondary"} onClick={() => updateEncodeOption("removePadding", !activeEncodeOptions.removePadding)}>{activeEncodeOptions.removePadding ? "Padding removed" : "Keep = padding"}</Button>
          </div> : <div className="space-y-3">
            <label className="block text-xs font-semibold text-[var(--color-text-muted)]">Expected alphabet<Select size="sm" className="mt-1" value={decodeOptions.alphabet} onChange={(event) => setDecodeOptions((current) => ({ ...current, alphabet: event.target.value as Base64DecodeAlphabet }))}><option value="auto">Auto detect</option><option value="standard">Standard (+ /)</option><option value="url-safe">URL-safe (- _)</option></Select></label>
            <Button className="w-full" size="sm" variant={decodeOptions.strict ? "primary" : "secondary"} onClick={() => setDecodeOptions((current) => ({ ...current, strict: !current.strict }))}>{decodeOptions.strict ? "Strict validation on" : "Normalize whitespace and padding"}</Button>
            <p className="text-xs leading-4 text-[var(--color-text-tertiary)]">Strict mode rejects wrapped input, omitted padding, and an alphabet that does not match the selected profile.</p>
          </div>}
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><ShieldCheck className="h-4 w-4" />Production checks</div>
          <div className="space-y-2">{checks.map((check) => <div key={check.id} className={`rounded-[var(--radius-sm)] border p-2.5 text-xs ${CHECK_STYLES[check.level]}`}>
            <div className="flex items-center gap-2 font-bold">{check.level === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}{check.title}</div>
            <p className="mt-1 leading-4 opacity-90">{check.message}</p>
          </div>)}</div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><PackageCheck className="h-4 w-4" />Production exports</div>
          <div className="space-y-2">
            <Button className="w-full" variant="secondary" disabled={mode === "encode" ? !encodeResult?.output : !decodeResult?.ok} onClick={() => downloadText("base64-report.json", reportJson, "application/json;charset=utf-8")}><FileText className="h-4 w-4" />JSON audit report</Button>
            <Button className="w-full" variant="secondary" onClick={() => downloadText("base64-browser-example.js", codeSnippet, "text/javascript;charset=utf-8")}><Code2 className="h-4 w-4" />JavaScript example</Button>
            {mode === "decode" ? <Button className="w-full" variant="secondary" disabled={!decodeResult?.ok || !decodeResult.normalizedPayload} onClick={() => downloadText("normalized-base64.txt", decodeResult?.normalizedPayload ?? "")}><Binary className="h-4 w-4" />Normalized Base64</Button> : null}
            <Button className="w-full" disabled={mode === "encode" ? !encodeResult?.output : !decodeResult?.ok} onClick={() => void downloadProductionPack()}><Download className="h-4 w-4" />Download production pack</Button>
          </div>
        </Card>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-xs leading-5 text-[var(--color-info-text)]">
          <div className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />Private byte processing</div>
          <p className="mt-1">Text conversion, file reading, MIME inspection, downloads, and ZIP creation happen locally. Darma never receives the payload.</p>
        </section>
      </aside>
    </div>
  </div>;
}
