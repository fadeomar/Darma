"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Check, Copy, FileText, Trash2 } from "lucide-react";
import {
  URL_EXAMPLES,
  parseQueryParams,
  processUrlText,
  type QueryParamRow,
  type UrlEncodingType,
  type UrlMode,
} from "./url";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--textColor)]/40">
      {children}
    </p>
  );
}

function SegmentedButton<T extends string>({
  value,
  current,
  onClick,
  children,
}: {
  value: T;
  current: T;
  onClick: (value: T) => void;
  children: React.ReactNode;
}) {
  const active = value === current;

  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={[
        "rounded-xl px-3 py-2 text-sm font-bold transition",
        active
          ? "bg-[var(--textColor)] text-[var(--baseColor)] shadow-sm"
          : "text-[var(--textColor)]/60 hover:bg-white hover:text-[var(--textColor)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleCopy = () => {
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setFailed(false);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {
        setFailed(true);
        setTimeout(() => setFailed(false), 1800);
      });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      title={text ? label : "Nothing to copy yet"}
      className={[
        "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-30",
        copied
          ? "bg-emerald-500 text-white"
          : failed
            ? "bg-red-500 text-white"
            : "bg-[var(--textColor)] text-[var(--baseColor)] hover:opacity-80",
      ].join(" ")}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : failed ? "Copy failed" : label}
    </button>
  );
}

function QueryInspector({ rows }: { rows: QueryParamRow[] }) {
  if (!rows.length) return null;

  return (
    <div className="rounded-2xl border border-black/8 bg-black/2 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <SectionLabel>Query parameter inspector</SectionLabel>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--textColor)]/55">
          {rows.length} {rows.length === 1 ? "parameter" : "parameters"}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
        {rows.map((row, index) => (
          <div
            key={`${row.key}-${index}`}
            className="grid gap-2 border-b border-black/8 p-3 last:border-b-0 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] md:items-center"
          >
            <code className="break-all rounded-lg bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700">
              {row.key || "(empty key)"}
            </code>
            <code className="break-all rounded-lg bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700">
              {row.value || "(empty value)"}
            </code>
            <button
              type="button"
              onClick={() => {
                if (!row.value) return;
                navigator.clipboard.writeText(row.value).catch(() => undefined);
              }}
              disabled={!row.value}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-black/10 px-2 py-1 text-xs font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5 disabled:opacity-30"
            >
              <Copy className="h-3 w-3" />
              Copy value
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UrlEncoderDecoderClient() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<UrlMode>("encode");
  const [encodingType, setEncodingType] = useState<UrlEncodingType>("full");

  const result = useMemo(
    () => processUrlText(input, mode, encodingType),
    [input, mode, encodingType],
  );

  const output = result.ok ? result.output : "";
  const queryRows = useMemo(() => parseQueryParams(input), [input]);
  const status = !input ? "Empty input" : result.status;

  const handleExample = (example: string) => {
    setInput(example);
    if (example.includes("%")) setMode("decode");
  };

  const handleClear = () => setInput("");

  const handleUseOutput = () => {
    if (!output) return;
    setInput(output);
    setMode(mode === "encode" ? "decode" : "encode");
  };

  const stats = [
    { label: "input chars", value: input.length.toLocaleString() },
    { label: "output chars", value: output.length.toLocaleString() },
    { label: "mode", value: mode === "encode" ? "Encode" : "Decode" },
    { label: "type", value: encodingType === "full" ? "Full URL" : "Component" },
    { label: "query params", value: queryRows.length.toLocaleString() },
    { label: "status", value: status },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Input</SectionLabel>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleExample(URL_EXAMPLES[0])}
                className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5"
              >
                <FileText className="h-3 w-3" />
                Sample
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste a URL, query string, or text to encode. Example: https://example.com/search?q=hello world&lang=en"
            rows={11}
            className="w-full resize-y rounded-2xl border border-black/10 bg-slate-50 p-4 font-mono text-sm leading-7 text-[var(--textColor)] outline-none transition placeholder:font-sans placeholder:text-[var(--textColor)]/25 focus:border-[var(--textColor)]/30"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Output</SectionLabel>
            <button
              type="button"
              onClick={handleUseOutput}
              disabled={!output}
              className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5 disabled:opacity-30"
            >
              <ArrowLeftRight className="h-3 w-3" />
              Use output as input
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder={
              input
                ? result.ok
                  ? "Result appears here."
                  : "Fix the invalid percent-encoding to see output."
                : "Add input on the left to encode or decode."
            }
            rows={11}
            className="w-full resize-y rounded-2xl border border-black/10 bg-white p-4 font-mono text-sm leading-7 text-[var(--textColor)] outline-none transition placeholder:font-sans placeholder:text-[var(--textColor)]/25 focus:border-[var(--textColor)]/30"
          />
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-black/8 bg-black/2 p-4 lg:grid-cols-2">
        <div>
          <SectionLabel>Action</SectionLabel>
          <div className="inline-flex rounded-2xl border border-black/10 bg-slate-100 p-1">
            <SegmentedButton value="encode" current={mode} onClick={(value) => setMode(value)}>
              Encode
            </SegmentedButton>
            <SegmentedButton value="decode" current={mode} onClick={(value) => setMode(value)}>
              Decode
            </SegmentedButton>
          </div>
        </div>

        <div>
          <SectionLabel>Encoding type</SectionLabel>
          <div className="inline-flex flex-wrap rounded-2xl border border-black/10 bg-slate-100 p-1">
            <SegmentedButton value="full" current={encodingType} onClick={(value) => setEncodingType(value)}>
              Full URL
            </SegmentedButton>
            <SegmentedButton value="component" current={encodingType} onClick={(value) => setEncodingType(value)}>
              URL component / query value
            </SegmentedButton>
          </div>
        </div>
      </div>

      {result.ok || !input ? null : (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Invalid URL encoding.</strong> {"error" in result ? result.error : ""}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <CopyBtn text={output} label="Copy output" />
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[var(--textColor)]/70 transition hover:bg-black/5 hover:text-[var(--textColor)]"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear all
        </button>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-[var(--textColor)]/30">
          Runs fully in your browser
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-black/8 bg-white/60 px-4 py-2.5">
        {stats.map(({ label, value }) => (
          <span key={label} className="text-xs text-[var(--textColor)]/55">
            <span className="font-bold text-[var(--textColor)]/80">{value}</span> {label}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-black/8 bg-black/2 p-4">
        <SectionLabel>Quick examples</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {URL_EXAMPLES.map((example) => (
            <button
              type="button"
              key={example}
              onClick={() => handleExample(example)}
              className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-left font-mono text-xs text-[var(--textColor)]/70 transition hover:border-[var(--textColor)]/25 hover:bg-black/3"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <QueryInspector rows={queryRows} />

      <p className="text-center text-xs text-[var(--textColor)]/35">
        🔒 URL text is processed locally with browser APIs. Nothing is uploaded or stored.
      </p>
    </div>
  );
}
