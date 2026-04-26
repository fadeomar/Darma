"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Check, Copy, FileText, Trash2 } from "lucide-react";
import {
  computeBase64Stats,
  transformBase64,
  type Base64Mode,
} from "./base64";

const EXAMPLES = [
  "Hello world",
  '{"name":"Darma","tool":"Base64"}',
  "https://example.com/blog/my-post",
  "مرحبا بالعالم",
  "Café 😊",
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--textColor)]/40">
      {children}
    </p>
  );
}

function StatusBar({
  mode,
  status,
  errorMessage,
}: {
  mode: Base64Mode;
  status: "ready" | "valid" | "invalid" | "empty";
  errorMessage?: string;
}) {
  if (status === "empty") {
    return (
      <div className="rounded-xl border border-black/8 bg-white/60 px-4 py-2.5 text-xs text-[var(--textColor)]/50">
        Empty input. Paste text to {mode === "encode" ? "encode" : "decode"}.
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
        <strong>Invalid Base64.</strong> {errorMessage}
      </div>
    );
  }

  if (mode === "decode") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">
        Valid Base64. Ready to decode.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">
      Ready. Text encoded successfully.
    </div>
  );
}

export default function Base64Client() {
  const [mode, setMode] = useState<Base64Mode>("encode");
  const [input, setInput] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const [removePadding, setRemovePadding] = useState(false);
  const [copied, setCopied] = useState(false);
  const effectiveRemovePadding = mode === "encode" && removePadding;

  const result = useMemo(
    () => transformBase64(input, mode, { urlSafe, removePadding: effectiveRemovePadding }),
    [input, mode, urlSafe, effectiveRemovePadding],
  );

  const stats = useMemo(
    () => computeBase64Stats(input, result.output, mode),
    [input, result.output, mode],
  );

  const handleCopy = async () => {
    if (!result.output || !result.ok) return;
    try {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleUseOutputAsInput = () => {
    if (!result.output || !result.ok) return;
    setInput(result.output);
    setCopied(false);
    setMode((current) => (current === "encode" ? "decode" : "encode"));
  };

  const handleClear = () => {
    setInput("");
    setCopied(false);
  };

  const handleModeChange = (nextMode: Base64Mode) => {
    setMode(nextMode);
    setCopied(false);
  };

  const handleUrlSafeChange = (nextUrlSafe: boolean) => {
    setUrlSafe(nextUrlSafe);
    setCopied(false);
  };

  const handleRemovePaddingChange = (nextRemovePadding: boolean) => {
    setRemovePadding(nextRemovePadding);
    setCopied(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex w-fit gap-1 rounded-2xl border border-black/8 bg-black/3 p-1">
        {(["encode", "decode"] as Base64Mode[]).map((nextMode) => (
          <button
            key={nextMode}
            type="button"
            onClick={() => handleModeChange(nextMode)}
            className={[
              "rounded-xl px-4 py-1.5 text-sm font-semibold capitalize transition",
              mode === nextMode
                ? "bg-[var(--textColor)] text-[var(--baseColor)]"
                : "text-[var(--textColor)]/60 hover:text-[var(--textColor)]",
            ].join(" ")}
          >
            {nextMode}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Input</SectionLabel>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setInput(EXAMPLES[0])}
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
          <label htmlFor="base64-input" className="sr-only">
            Text or Base64 input
          </label>
          <textarea
            id="base64-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setCopied(false);
            }}
            placeholder={
              mode === "encode"
                ? "Paste text, JSON, URLs, Arabic text, or emojis…"
                : "Paste Base64 to decode…"
            }
            rows={10}
            spellCheck={false}
            className="w-full resize-y rounded-2xl border border-black/10 bg-slate-50 p-4 font-mono text-xs leading-6 text-[var(--textColor)] outline-none placeholder:font-sans placeholder:text-[var(--textColor)]/25 focus:border-[var(--textColor)]/30 transition"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Output</SectionLabel>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--textColor)]/30">
              {mode === "encode" ? "Base64 output" : "Decoded text"}
            </span>
          </div>
          <textarea
            value={result.output}
            readOnly
            spellCheck={false}
            rows={10}
            placeholder={
              input
                ? mode === "encode"
                  ? "Encoded Base64 appears here…"
                  : "Decoded text appears here…"
                : "Output appears here after typing."
            }
            className="w-full resize-y rounded-2xl border border-black/10 bg-white p-4 font-mono text-xs leading-6 text-[var(--textColor)] outline-none placeholder:font-sans placeholder:text-[var(--textColor)]/25 focus:border-[var(--textColor)]/30 transition"
          />
        </div>
      </div>

      <StatusBar
        mode={mode}
        status={result.status}
        errorMessage={result.error?.message}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!result.output || !result.ok}
          className={[
            "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-30",
            copied
              ? "bg-emerald-500 text-white"
              : "bg-[var(--textColor)] text-[var(--baseColor)] hover:opacity-80",
          ].join(" ")}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Copy output"}
        </button>

        <button
          type="button"
          onClick={handleUseOutputAsInput}
          disabled={!result.output || !result.ok}
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[var(--textColor)]/70 transition hover:bg-black/5 hover:text-[var(--textColor)] disabled:opacity-30"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Use output as input
        </button>

        <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-[var(--textColor)]/30">
          Mode: {mode}
        </span>
      </div>

      <div className="rounded-2xl border border-black/8 bg-black/2 p-4">
        <SectionLabel>Options</SectionLabel>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[var(--textColor)]/75">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => handleUrlSafeChange(e.target.checked)}
              className="accent-[var(--textColor)]"
            />
            URL-safe Base64 (- and _)
          </label>

          <label
            className={[
              "flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[var(--textColor)]/75",
              mode === "encode" ? "cursor-pointer" : "cursor-not-allowed opacity-50",
            ].join(" ")}
          >
            <input
              type="checkbox"
              checked={effectiveRemovePadding}
              disabled={mode === "decode"}
              onChange={(e) => handleRemovePaddingChange(e.target.checked)}
              className="accent-[var(--textColor)]"
            />
            Remove output padding (=)
          </label>
        </div>
      </div>

      <div>
        <SectionLabel>Quick examples</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setInput(example)}
              className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--textColor)]/70 transition hover:border-[var(--textColor)]/30 hover:text-[var(--textColor)]"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-black/8 bg-white/60 px-4 py-2.5">
        <span className="text-xs text-[var(--textColor)]/55">
          <span className="font-bold text-[var(--textColor)]/80">
            {stats.inputChars.toLocaleString()}
          </span>{" "}
          input chars
        </span>
        <span className="text-xs text-[var(--textColor)]/55">
          <span className="font-bold text-[var(--textColor)]/80">
            {stats.outputChars.toLocaleString()}
          </span>{" "}
          output chars
        </span>
        <span className="text-xs text-[var(--textColor)]/55">
          <span className="font-bold text-[var(--textColor)]/80">
            {stats.inputBytes.toLocaleString()}
          </span>{" "}
          input bytes
        </span>
        <span className="text-xs text-[var(--textColor)]/55">
          <span className="font-bold text-[var(--textColor)]/80">
            {stats.outputBytes.toLocaleString()}
          </span>{" "}
          output bytes
        </span>
        <span className="ml-auto text-xs font-semibold text-[var(--textColor)]/65">
          {stats.inputBytes > 0
            ? `${stats.sizeChangePercent > 0 ? "+" : ""}${stats.sizeChangePercent}% size change`
            : "No size change"}
        </span>
      </div>

      <p className="text-center text-xs text-[var(--textColor)]/35">
        Base64 is encoding, not encryption. Anyone can decode it. All processing runs in your browser.
      </p>
    </div>
  );
}
