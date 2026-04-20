"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Copy, Download, RefreshCw, ArrowLeftRight,
  Check, Trash2, FileText,
} from "lucide-react";
import {
  CASE_TRANSFORMS,
  CLEAN_TRANSFORMS,
  computeStats,
  formatReadingTime,
  SAMPLE_TEXT,
  type TransformDef,
} from "./transforms";

// ─── Tiny primitives ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--textColor)]/40">
      {children}
    </p>
  );
}

function IconBtn({
  onClick,
  title,
  children,
  variant = "ghost",
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  variant?: "ghost" | "primary" | "success";
}) {
  const cls = {
    ghost:
      "border border-black/10 bg-white text-[var(--textColor)]/70 hover:bg-black/5 hover:text-[var(--textColor)]",
    primary:
      "bg-[var(--textColor)] text-[var(--baseColor)] hover:opacity-80",
    success:
      "bg-emerald-500 text-white",
  }[variant];

  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition",
        cls,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function CopyBtn({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    const t = getText();
    if (!t) return;
    navigator.clipboard.writeText(t).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handle}
      title="Copy output"
      className={[
        "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition",
        copied
          ? "bg-emerald-500 text-white"
          : "bg-[var(--textColor)] text-[var(--baseColor)] hover:opacity-80",
      ].join(" ")}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function TransformBtn({ def, onClick }: { def: TransformDef; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={def.title}
      className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-left transition hover:border-[var(--textColor)]/25 hover:bg-black/3 active:scale-95"
    >
      <span
        className={[
          "text-sm font-semibold text-[var(--textColor)]",
          def.mono ? "font-mono" : "",
        ].join(" ")}
      >
        {def.label}
      </span>
    </button>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ text }: { text: string }) {
  const s = useMemo(() => computeStats(text), [text]);

  const items = [
    { label: "chars", value: s.characters.toLocaleString() },
    { label: "no spaces", value: s.charactersNoSpaces.toLocaleString() },
    { label: "words", value: s.words.toLocaleString() },
    { label: "lines", value: s.lines.toLocaleString() },
    { label: "paragraphs", value: s.paragraphs.toLocaleString() },
    { label: "read", value: formatReadingTime(s.readingTimeSec) },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-black/8 bg-white/60 px-4 py-2.5">
      {items.map(({ label, value }) => (
        <span key={label} className="text-xs text-[var(--textColor)]/55">
          <span className="font-bold text-[var(--textColor)]/80">{value}</span>{" "}
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TextCleanerClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  // The text transforms act on: output if it exists, else input
  const workingText = output || input;

  const applyTransform = useCallback(
    (def: TransformDef) => {
      if (!workingText) return;
      setOutput(def.fn(workingText));
    },
    [workingText],
  );

  const handleSample = () => {
    setInput(SAMPLE_TEXT);
    setOutput("");
  };

  const handleClearInput = () => {
    setInput("");
    setOutput("");
  };

  const handleClearOutput = () => setOutput("");

  const handleSwap = () => {
    if (!output) return;
    setInput(output);
    setOutput("");
  };

  const handleReset = () => setOutput(input);

  const handleDownload = () => {
    const text = output || input;
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cleaned-text.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const statsText = workingText;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Textareas ───────────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Input</SectionLabel>
            <div className="flex gap-1.5">
              <button
                onClick={handleSample}
                title="Load sample text"
                className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5"
              >
                <FileText className="h-3 w-3" />
                Sample
              </button>
              <button
                onClick={handleClearInput}
                title="Clear all"
                className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Reset output when input changes so stats stay relevant
              if (output) setOutput("");
            }}
            placeholder="Paste or type your text here…"
            rows={10}
            className="w-full resize-y rounded-2xl border border-black/10 bg-slate-50 p-4 text-sm leading-7 text-[var(--textColor)] outline-none placeholder:text-[var(--textColor)]/25 focus:border-[var(--textColor)]/30 transition"
          />
        </div>

        {/* Output */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Output</SectionLabel>
            <div className="flex gap-1.5">
              <button
                onClick={handleSwap}
                title="Move output to input"
                disabled={!output}
                className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5 disabled:opacity-30"
              >
                <ArrowLeftRight className="h-3 w-3" />
                Use as input
              </button>
              <button
                onClick={handleClearOutput}
                title="Clear output"
                disabled={!output}
                className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5 disabled:opacity-30"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            placeholder={
              input
                ? "Click a transform below — result appears here."
                : "Paste text on the left first."
            }
            rows={10}
            className="w-full resize-y rounded-2xl border border-black/10 bg-white p-4 text-sm leading-7 text-[var(--textColor)] outline-none placeholder:text-[var(--textColor)]/25 focus:border-[var(--textColor)]/30 transition"
          />
        </div>
      </div>

      {/* ── Primary actions ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <CopyBtn getText={() => output || input} />
        <IconBtn onClick={handleDownload} title="Download as .txt">
          <Download className="h-3.5 w-3.5" />
          Download .txt
        </IconBtn>
        <IconBtn onClick={handleReset} title="Reset output to match current input" variant="ghost">
          <RefreshCw className="h-3.5 w-3.5" />
          Reset output
        </IconBtn>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-[var(--textColor)]/30">
          Transforms apply to output, then chain
        </span>
      </div>

      {/* ── Live stats ───────────────────────────────────────────────────────── */}
      <StatsBar text={statsText} />

      {/* ── Case transforms ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-black/8 bg-black/2 p-4">
        <SectionLabel>Case conversion</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {CASE_TRANSFORMS.map((def) => (
            <TransformBtn
              key={def.id}
              def={def}
              onClick={() => applyTransform(def)}
            />
          ))}
        </div>
      </div>

      {/* ── Clean transforms ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-black/8 bg-black/2 p-4">
        <SectionLabel>Cleaning tools</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {CLEAN_TRANSFORMS.map((def) => (
            <TransformBtn
              key={def.id}
              def={def}
              onClick={() => applyTransform(def)}
            />
          ))}
        </div>
      </div>

      {/* ── Privacy note ─────────────────────────────────────────────────────── */}
      <p className="text-center text-xs text-[var(--textColor)]/35">
        🔒 All text is processed locally in your browser — nothing is uploaded or stored.
      </p>
    </div>
  );
}
