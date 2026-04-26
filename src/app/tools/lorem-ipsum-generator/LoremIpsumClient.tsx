"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { Copy, RefreshCw, Trash2, Download, Check } from "lucide-react";
import { generate, computeStats, formatReadingTime } from "./generator";
import { DESIGN_PRESETS, LENGTH_PRESETS } from "./presets";
import type {
  LoremConfig,
  GenerationMode,
  TextStyle,
  OutputFormat,
  BlockLength,
  StructuredBlock,
  GeneratedOutput,
  LoremStats,
} from "./types";

// ─── Default config ───────────────────────────────────────────────────────────

const DEFAULT_CONFIG: LoremConfig = {
  mode: "paragraphs",
  style: "readable",
  amount: 3,
  blockLength: "medium",
  outputFormat: "plain",
  startWithLorem: false,
  includeHeadings: false,
  includeLists: false,
  structuredBlock: "hero",
};

// ─── Small UI primitives ──────────────────────────────────────────────────────

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl px-3 py-1.5 text-sm font-semibold transition",
        active
          ? "bg-[var(--textColor)] text-[var(--baseColor)]"
          : "text-[var(--textColor)]/70 hover:text-[var(--textColor)] hover:bg-black/5",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-[var(--textColor)]/50">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="my-4 border-t border-black/8" />;
}

function CopyButton({
  label,
  onCopy,
}: {
  label: string;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition",
        copied
          ? "bg-green-500 text-white"
          : "bg-[var(--textColor)] text-[var(--baseColor)] hover:opacity-80",
      ].join(" ")}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

// ─── Mode descriptions ────────────────────────────────────────────────────────

const MODE_LABELS: Record<GenerationMode, string> = {
  words: "Words",
  sentences: "Sentences",
  paragraphs: "Paragraphs",
  structured: "Structured",
};

const STYLE_LABELS: Record<TextStyle, string> = {
  classic: "Classic Latin",
  readable: "Readable",
  startup: "Startup",
  ecommerce: "Ecommerce",
  blog: "Blog",
  profile: "Profile",
};

const STRUCTURED_LABELS: Record<StructuredBlock, string> = {
  hero: "Hero section",
  card: "Feature cards",
  testimonial: "Testimonials",
  faq: "FAQ",
  product: "Product listing",
  about: "About / Bio",
  onboarding: "Onboarding steps",
  pricing: "Pricing table",
};

const AMOUNT_MAX: Record<GenerationMode, number> = {
  words: 200,
  sentences: 30,
  paragraphs: 12,
  structured: 6,
};

const AMOUNT_LABEL: Record<GenerationMode, string> = {
  words: "words",
  sentences: "sentences",
  paragraphs: "paragraphs",
  structured: "blocks",
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function LoremIpsumClient() {
  const [config, setConfig] = useState<LoremConfig>(DEFAULT_CONFIG);
  const [output, setOutput] = useState<GeneratedOutput>({ plain: "", html: "" });
  const [stats, setStats] = useState<LoremStats>({ words: 0, characters: 0, sentences: 0, paragraphs: 0, readingTimeSeconds: 0 });
  const [showHtml, setShowHtml] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const run = useCallback((cfg: LoremConfig) => {
    const result = generate(cfg);
    setOutput(result);
    setStats(computeStats(result.plain));
  }, []);

  // Generate on mount
  useEffect(() => {
    run(DEFAULT_CONFIG);
  }, [run]);

  const update = (patch: Partial<LoremConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    return next;
  };

  const applyAndRun = (patch: Partial<LoremConfig>) => {
    const next = update(patch);
    run(next);
  };

  const applyPreset = (cfg: Partial<LoremConfig>) => {
    const next = { ...config, ...cfg };
    setConfig(next);
    run(next);
    if (cfg.outputFormat === "html") setShowHtml(true);
  };

  const copyPlain = () => navigator.clipboard.writeText(output.plain);
  const copyHtml = () => navigator.clipboard.writeText(output.html);

  const download = (format: OutputFormat) => {
    const text = format === "html" ? output.html : output.plain;
    const ext = format === "html" ? "html" : "txt";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lorem-ipsum.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayText = showHtml ? output.html : output.plain;
  const amountMax = AMOUNT_MAX[config.mode];
  const safePreviewHtml = useMemo(
    () =>
      config.outputFormat === "html"
        ? DOMPurify.sanitize(output.html, { USE_PROFILES: { html: true } })
        : "",
    [config.outputFormat, output.html],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      {/* ── Left: output area ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {/* Mode tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-black/8 bg-black/3 p-1">
          {(Object.keys(MODE_LABELS) as GenerationMode[]).map((m) => (
            <SegmentButton
              key={m}
              active={config.mode === m}
              onClick={() => {
                const maxAmount = AMOUNT_MAX[m];
                applyAndRun({
                  mode: m,
                  amount: Math.min(config.amount, maxAmount),
                });
              }}
            >
              {MODE_LABELS[m]}
            </SegmentButton>
          ))}
          {config.outputFormat === "html" && (
            <div className="ml-auto flex items-center gap-1 rounded-xl border border-black/8 bg-white p-1">
              <SegmentButton active={!showHtml} onClick={() => setShowHtml(false)}>
                Preview
              </SegmentButton>
              <SegmentButton active={showHtml} onClick={() => setShowHtml(true)}>
                HTML
              </SegmentButton>
            </div>
          )}
        </div>

        {/* Structured block selector (only when mode = structured) */}
        {config.mode === "structured" && (
          <div>
            <Label>Block type</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STRUCTURED_LABELS) as StructuredBlock[]).map((b) => (
                <button
                  key={b}
                  onClick={() => applyAndRun({ structuredBlock: b })}
                  className={[
                    "rounded-xl border px-3 py-1.5 text-sm font-semibold transition",
                    config.structuredBlock === b
                      ? "border-[var(--textColor)] bg-[var(--textColor)] text-[var(--baseColor)]"
                      : "border-black/10 bg-white text-[var(--textColor)]/70 hover:border-[var(--textColor)]/30 hover:text-[var(--textColor)]",
                  ].join(" ")}
                >
                  {STRUCTURED_LABELS[b]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Output text area */}
        <div
          ref={outputRef}
          className={[
            "min-h-[320px] max-h-[540px] overflow-y-auto rounded-2xl border border-black/8 bg-slate-50 p-5",
            showHtml ? "font-mono text-xs leading-6 text-slate-600" : "text-sm leading-7 text-[var(--textColor)]",
          ].join(" ")}
        >
          {displayText ? (
            showHtml ? (
              <pre className="whitespace-pre-wrap">{displayText}</pre>
            ) : (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={
                  config.outputFormat === "html"
                    ? { __html: safePreviewHtml }
                    : undefined
                }
              >
                {config.outputFormat !== "html" ? (
                  <div className="whitespace-pre-wrap">{displayText}</div>
                ) : null}
              </div>
            )
          ) : (
            <p className="text-[var(--textColor)]/30 italic">
              Click Generate to create placeholder content.
            </p>
          )}
        </div>

        {/* Stats bar */}
        {stats.words > 0 && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-black/8 bg-white/60 px-4 py-2.5 text-xs font-semibold text-[var(--textColor)]/60">
            <span>{stats.words.toLocaleString()} words</span>
            <span>{stats.characters.toLocaleString()} chars</span>
            {stats.paragraphs > 1 && <span>{stats.paragraphs} paragraphs</span>}
            {stats.sentences > 0 && <span>{stats.sentences} sentences</span>}
            <span className="ml-auto">{formatReadingTime(stats.readingTimeSeconds)}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <CopyButton label="Copy text" onCopy={copyPlain} />
          {config.outputFormat === "html" && (
            <CopyButton label="Copy HTML" onCopy={copyHtml} />
          )}
          <button
            onClick={() => run(config)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[var(--textColor)] transition hover:bg-black/5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </button>
          <button
            onClick={() => setOutput({ plain: "", html: "" })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
          <button
            onClick={() => download(config.outputFormat)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* ── Right: controls ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        {/* Text style */}
        <div>
          <Label>Text style</Label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(STYLE_LABELS) as TextStyle[]).map((s) => (
              <button
                key={s}
                onClick={() => applyAndRun({ style: s })}
                className={[
                  "rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
                  config.style === s
                    ? "border-[var(--textColor)] bg-[var(--textColor)] text-[var(--baseColor)]"
                    : "border-black/10 bg-white text-[var(--textColor)]/70 hover:border-[var(--textColor)]/30 hover:text-[var(--textColor)]",
                ].join(" ")}
              >
                {STYLE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <Label>
            Amount — {config.amount} {AMOUNT_LABEL[config.mode]}
          </Label>
          <input
            type="range"
            min={1}
            max={amountMax}
            value={config.amount}
            onChange={(e) => update({ amount: Number(e.target.value) })}
            onMouseUp={() => run(config)}
            onTouchEnd={() => run(config)}
            className="w-full accent-[var(--textColor)]"
          />
          <div className="mt-1 flex justify-between text-[10px] text-[var(--textColor)]/40">
            <span>1</span>
            <span>{amountMax}</span>
          </div>
        </div>

        {/* Block length (not for words or structured) */}
        {config.mode !== "words" && config.mode !== "structured" && (
          <div>
            <Label>Paragraph length</Label>
            <div className="flex gap-1.5">
              {(["short", "medium", "long"] as BlockLength[]).map((l) => (
                <button
                  key={l}
                  onClick={() => applyAndRun({ blockLength: l })}
                  className={[
                    "flex-1 rounded-xl border py-1.5 text-xs font-semibold capitalize transition",
                    config.blockLength === l
                      ? "border-[var(--textColor)] bg-[var(--textColor)] text-[var(--baseColor)]"
                      : "border-black/10 bg-white text-[var(--textColor)]/70 hover:border-[var(--textColor)]/30",
                  ].join(" ")}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Output format */}
        <div>
          <Label>Output format</Label>
          <div className="flex gap-1.5">
            {(["plain", "html"] as OutputFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setShowHtml(f === "html");
                  applyAndRun({ outputFormat: f });
                }}
                className={[
                  "flex-1 rounded-xl border py-1.5 text-xs font-semibold uppercase transition",
                  config.outputFormat === f
                    ? "border-[var(--textColor)] bg-[var(--textColor)] text-[var(--baseColor)]"
                    : "border-black/10 bg-white text-[var(--textColor)]/70 hover:border-[var(--textColor)]/30",
                ].join(" ")}
              >
                {f === "plain" ? "Plain text" : "HTML"}
              </button>
            ))}
          </div>
        </div>

        <Divider />

        {/* Advanced options */}
        <div>
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex w-full items-center justify-between text-xs font-black uppercase tracking-[0.15em] text-[var(--textColor)]/50 hover:text-[var(--textColor)]/70 transition"
          >
            Advanced options
            <span className="text-[10px]">{showAdvanced ? "▲" : "▼"}</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 flex flex-col gap-2.5">
              {[
                { key: "startWithLorem" as const, label: 'Start with "Lorem ipsum\u2026"', disabled: config.style !== "classic" },
                { key: "includeHeadings" as const, label: "Include section headings", disabled: config.mode !== "paragraphs" },
                { key: "includeLists" as const, label: "Include bullet lists", disabled: config.mode !== "paragraphs" },
              ].map(({ key, label, disabled }) => (
                <label
                  key={key}
                  className={[
                    "flex cursor-pointer items-center gap-2.5 text-sm",
                    disabled ? "opacity-40 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={config[key]}
                    onChange={(e) => applyAndRun({ [key]: e.target.checked })}
                    className="accent-[var(--textColor)]"
                  />
                  <span className="text-[var(--textColor)]/80">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* Quick presets */}
        <div>
          <Label>Design presets</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {DESIGN_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.config)}
                className="rounded-xl border border-black/8 bg-white px-2.5 py-2 text-left transition hover:border-[var(--textColor)]/20 hover:bg-black/3"
              >
                <span className="text-base">{p.icon}</span>
                <p className="mt-0.5 text-xs font-semibold leading-tight text-[var(--textColor)]/80">{p.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Length presets</Label>
          <div className="flex flex-wrap gap-1.5">
            {LENGTH_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.config)}
                className="rounded-xl border border-black/8 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--textColor)]/70 transition hover:border-[var(--textColor)]/20 hover:text-[var(--textColor)]"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <Divider />

        {/* Generate button */}
        <button
          onClick={() => run(config)}
          className="w-full rounded-2xl bg-[var(--textColor)] py-3 text-sm font-black uppercase tracking-[0.15em] text-[var(--baseColor)] transition hover:opacity-80"
        >
          Generate
        </button>
      </div>
    </div>
  );
}
