"use client";

import { useCallback, useState } from "react";
import {
  Check, Copy, Download, FileText, Trash2,
  CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import {
  validateJSON,
  formatJSON,
  minifyJSON,
  getTopLevelCount,
  SAMPLE_JSON,
  type IndentOption,
  type ValidationResult,
} from "./utils";

// ─── Tiny primitives ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--textColor)]/40">
      {children}
    </p>
  );
}

function ActionBtn({
  onClick,
  disabled,
  variant = "primary",
  children,
  title,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "outline";
  children: React.ReactNode;
  title?: string;
}) {
  const cls = {
    primary:
      "bg-[var(--textColor)] text-[var(--baseColor)] hover:opacity-80 disabled:opacity-30",
    ghost:
      "border border-black/10 bg-white text-[var(--textColor)]/70 hover:bg-black/5 hover:text-[var(--textColor)] disabled:opacity-30",
    outline:
      "border border-[var(--textColor)]/20 text-[var(--textColor)]/70 hover:border-[var(--textColor)]/40 hover:text-[var(--textColor)] disabled:opacity-30",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
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
    }).catch(() => {/* silently ignore */});
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
      {copied
        ? <><Check className="h-3.5 w-3.5" /> Copied!</>
        : <><Copy className="h-3.5 w-3.5" /> Copy</>
      }
    </button>
  );
}

// ─── Status bar ───────────────────────────────────────────────────────────────

type UIStatus = "idle" | "valid" | "invalid";

function StatusBar({
  status,
  validation,
  outputLength,
  topLevelCount,
}: {
  status: UIStatus;
  validation: ValidationResult | null;
  outputLength: number;
  topLevelCount: number;
}) {
  if (status === "idle") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-black/8 bg-white/60 px-4 py-2.5">
        <AlertCircle className="h-4 w-4 shrink-0 text-[var(--textColor)]/30" />
        <span className="text-xs text-[var(--textColor)]/50">
          Paste JSON and click <strong>Format</strong>, <strong>Minify</strong>, or <strong>Validate</strong>.
        </span>
      </div>
    );
  }

  if (status === "valid") {
    const topLabel = topLevelCount > 0
      ? ` · ${topLevelCount} top-level ${topLevelCount === 1 ? "entry" : "entries"}`
      : "";
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span className="text-xs font-semibold text-emerald-800">
          Valid JSON
        </span>
        <span className="text-xs text-emerald-600">
          — {outputLength.toLocaleString()} chars{topLabel}
        </span>
      </div>
    );
  }

  // invalid
  const v = validation as Extract<ValidationResult, { ok: false }>;
  const location =
    v && !v.ok && v.line != null
      ? ` at line ${v.line}${v.col != null ? `, column ${v.col}` : ""}`
      : "";

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <div className="flex items-start gap-2">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-red-700">Invalid JSON{location}</p>
          {v && !v.ok && (
            <p className="font-mono text-xs text-red-600">{v.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Indent selector ──────────────────────────────────────────────────────────

const INDENT_OPTIONS: { value: IndentOption; label: string }[] = [
  { value: 2, label: "2 sp" },
  { value: 4, label: "4 sp" },
  { value: "tab", label: "Tab" },
];

function IndentSelector({
  value,
  onChange,
}: {
  value: IndentOption;
  onChange: (v: IndentOption) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-[var(--textColor)]/35">
        Indent
      </span>
      {INDENT_OPTIONS.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className={[
            "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
            value === opt.value
              ? "bg-[var(--textColor)]/10 text-[var(--textColor)]"
              : "text-[var(--textColor)]/45 hover:text-[var(--textColor)]/70",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function JsonFormatterClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<UIStatus>("idle");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [indent, setIndent] = useState<IndentOption>(2);

  const handleFormat = useCallback(() => {
    const result = formatJSON(input, indent);
    if (result.ok && result.output != null) {
      setOutput(result.output);
      setStatus("valid");
    } else {
      setOutput("");
      setStatus("invalid");
    }
    setValidation(result.validation);
  }, [input, indent]);

  const handleMinify = useCallback(() => {
    const result = minifyJSON(input);
    if (result.ok && result.output != null) {
      setOutput(result.output);
      setStatus("valid");
    } else {
      setOutput("");
      setStatus("invalid");
    }
    setValidation(result.validation);
  }, [input]);

  const handleValidate = useCallback(() => {
    const result = validateJSON(input);
    setValidation(result);
    setStatus(result.ok ? "valid" : "invalid");
    setOutput(result.ok ? input.trim() : "");
  }, [input]);

  const handleSample = () => {
    setInput(SAMPLE_JSON);
    setOutput("");
    setStatus("idle");
    setValidation(null);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setStatus("idle");
    setValidation(null);
  };

  const handleDownload = (mode: "formatted" | "minified") => {
    const text = output;
    if (!text) return;
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "minified" ? "minified.json" : "formatted.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasOutput = output.length > 0;
  const topCount = hasOutput ? getTopLevelCount(output) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Panels ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Input</SectionLabel>
            <div className="flex gap-1.5">
              <button
                onClick={handleSample}
                title="Load sample JSON"
                className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5"
              >
                <FileText className="h-3 w-3" />
                Sample
              </button>
              <button
                onClick={handleClear}
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
              // reset result when input changes
              if (status !== "idle") {
                setStatus("idle");
                setValidation(null);
                setOutput("");
              }
            }}
            placeholder={"Paste your JSON here\u2026"}
            rows={16}
            spellCheck={false}
            className="w-full resize-y rounded-2xl border border-black/10 bg-slate-50 p-4 font-mono text-xs leading-6 text-[var(--textColor)] outline-none placeholder:font-sans placeholder:text-[var(--textColor)]/25 focus:border-[var(--textColor)]/30 transition"
          />
        </div>

        {/* Output */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Output</SectionLabel>
            <div className="flex gap-1.5">
              <button
                onClick={() => handleDownload("formatted")}
                disabled={!hasOutput}
                title="Download as .json"
                className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5 disabled:opacity-30"
              >
                <Download className="h-3 w-3" />
                Download
              </button>
            </div>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder={
              input
                ? "Click Format, Minify, or Validate\u2026"
                : "Output appears here after processing."
            }
            rows={16}
            spellCheck={false}
            className="w-full resize-y rounded-2xl border border-black/10 bg-white p-4 font-mono text-xs leading-6 text-[var(--textColor)] outline-none placeholder:font-sans placeholder:text-[var(--textColor)]/25 focus:border-[var(--textColor)]/30 transition"
          />
        </div>
      </div>

      {/* ── Status bar ──────────────────────────────────────────────────────── */}
      <StatusBar
        status={status}
        validation={validation}
        outputLength={output.length}
        topLevelCount={topCount}
      />

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Primary transforms */}
        <ActionBtn onClick={handleFormat} disabled={!input.trim()}>
          Format
        </ActionBtn>
        <ActionBtn onClick={handleMinify} disabled={!input.trim()} variant="ghost">
          Minify
        </ActionBtn>
        <ActionBtn onClick={handleValidate} disabled={!input.trim()} variant="ghost">
          Validate
        </ActionBtn>

        {/* Indent selector */}
        <span className="mx-1 h-5 w-px bg-black/10" aria-hidden="true" />
        <IndentSelector value={indent} onChange={setIndent} />

        {/* Output controls pushed right */}
        <span className="flex-1" />
        <CopyBtn getText={() => output} />
      </div>

      {/* ── Privacy note ─────────────────────────────────────────────────────── */}
      <p className="text-center text-xs text-[var(--textColor)]/35">
        🔒 All JSON is processed locally in your browser — nothing is uploaded or stored.
      </p>
    </div>
  );
}
