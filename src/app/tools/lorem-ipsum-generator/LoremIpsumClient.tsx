"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  disabled = false,
}: {
  label: string;
  onCopy: () => void;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={[
        "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        copied
          ? "bg-green-500 text-white"
          : "bg-[var(--textColor)] text-[var(--baseColor)] hover:opacity-80",
      ].join(" ")}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
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

const getRandomGenerationDelay = () => {
  return Math.floor(Math.random() * (2500 - 500 + 1)) + 100;
};

export default function LoremIpsumClient() {
  const [config, setConfig] = useState<LoremConfig>(DEFAULT_CONFIG);
  const [output, setOutput] = useState<GeneratedOutput>({
    plain: "",
    html: "",
  });
  const [stats, setStats] = useState<LoremStats>({
    words: 0,
    characters: 0,
    sentences: 0,
    paragraphs: 0,
    readingTimeSeconds: 0,
  });
  const [showHtml, setShowHtml] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const generationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((cfg: LoremConfig) => {
    const result = generate(cfg);
    setOutput(result);
    setStats(computeStats(result.plain));
  }, []);

  // Generate on mount
  useEffect(() => {
    run(DEFAULT_CONFIG);
  }, [run]);

  useEffect(() => {
    return () => {
      if (generationTimerRef.current) {
        clearTimeout(generationTimerRef.current);
      }
    };
  }, []);

  const runWithLoading = (cfg: LoremConfig) => {
    if (generationTimerRef.current) {
      clearTimeout(generationTimerRef.current);
    }

    setIsGenerating(true);
    generationTimerRef.current = setTimeout(() => {
      run(cfg);
      setIsGenerating(false);
      generationTimerRef.current = null;
    }, getRandomGenerationDelay());
  };

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

  return (
    <div className="space-y-6">
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
            <SegmentButton
              active={!showHtml}
              onClick={() => setShowHtml(false)}
            >
              Preview
            </SegmentButton>
            <SegmentButton active={showHtml} onClick={() => setShowHtml(true)}>
              HTML
            </SegmentButton>
          </div>
        )}
      </div>

      {/* Full-width controls panel */}
      <div className="rounded-3xl border border-black/8 bg-white/50 p-4 shadow-sm sm:p-5">
        <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr_0.9fr_0.9fr]">
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
              onChange={(e) => {
                const nextAmount = Number(e.target.value);
                setConfig((current) => ({ ...current, amount: nextAmount }));
              }}
              onMouseUp={() => run(config)}
              onTouchEnd={() => run(config)}
              className="w-full accent-[var(--textColor)]"
            />
            <div className="mt-1 flex justify-between text-[10px] text-[var(--textColor)]/40">
              <span>1</span>
              <span>{amountMax}</span>
            </div>
          </div>

          {/* Block length */}
          <div>
            {config.mode !== "words" && config.mode !== "structured" ? (
              <>
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
              </>
            ) : null}
          </div>

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
        </div>

        {/* Structured block selector */}
        {config.mode === "structured" && (
          <>
            <Divider />
            <div>
              <Label>Block type</Label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {(Object.keys(STRUCTURED_LABELS) as StructuredBlock[]).map(
                  (b) => (
                    <button
                      key={b}
                      onClick={() => applyAndRun({ structuredBlock: b })}
                      className={[
                        "rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                        config.structuredBlock === b
                          ? "border-[var(--textColor)] bg-[var(--textColor)] text-[var(--baseColor)]"
                          : "border-black/10 bg-white text-[var(--textColor)]/70 hover:border-[var(--textColor)]/30 hover:text-[var(--textColor)]",
                      ].join(" ")}
                    >
                      {STRUCTURED_LABELS[b]}
                    </button>
                  ),
                )}
              </div>
            </div>
          </>
        )}

        <Divider />

        <div className="grid gap-5 xl:grid-cols-[1fr_1.6fr_1fr]">
          {/* Advanced options */}
          <div>
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex w-full items-center justify-between text-xs font-black uppercase tracking-[0.15em] text-[var(--textColor)]/50 transition hover:text-[var(--textColor)]/70"
            >
              Advanced options
              <span className="text-[10px]">{showAdvanced ? "▲" : "▼"}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 flex flex-col gap-2.5">
                {[
                  {
                    key: "startWithLorem" as const,
                    label: 'Start with "Lorem ipsum…"',
                    disabled: config.style !== "classic",
                  },
                  {
                    key: "includeHeadings" as const,
                    label: "Include section headings",
                    disabled: config.mode !== "paragraphs",
                  },
                  {
                    key: "includeLists" as const,
                    label: "Include bullet lists",
                    disabled: config.mode !== "paragraphs",
                  },
                ].map(({ key, label, disabled }) => (
                  <label
                    key={key}
                    className={[
                      "flex cursor-pointer items-center gap-2.5 text-sm",
                      disabled ? "cursor-not-allowed opacity-40" : "",
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

          {/* Quick presets */}
          <div>
            <Label>Design presets</Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {DESIGN_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.config)}
                  className="rounded-xl border border-black/8 bg-white px-3 py-2 text-left transition hover:border-[var(--textColor)]/20 hover:bg-black/3"
                >
                  <span className="text-base">{p.icon}</span>
                  <p className="mt-1 text-xs font-semibold leading-tight text-[var(--textColor)]/80">
                    {p.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
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

            <button
              onClick={() => runWithLoading(config)}
              disabled={isGenerating}
              className="mt-auto w-full rounded-2xl bg-[var(--textColor)] py-3 text-sm font-black uppercase tracking-[0.15em] text-[var(--baseColor)] transition hover:opacity-80 disabled:cursor-wait disabled:opacity-70"
            >
              {isGenerating ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>
      </div>

      {/* Output text area */}
      <div
        className={[
          "li-preview-frame",
          isGenerating ? "li-preview-frame--active" : "",
        ].join(" ")}
      >
        <div
          ref={outputRef}
          aria-busy={isGenerating}
          className={[
            "relative min-h-[320px] max-h-[540px] overflow-y-auto rounded-[1.15rem] bg-slate-50 p-5 transition duration-500",
            isGenerating
              ? "scale-[0.995] blur-[2px] opacity-45"
              : "blur-0 opacity-100",
            showHtml
              ? "font-mono text-xs leading-6 text-slate-600"
              : "text-sm leading-7 text-[var(--textColor)]",
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
                    ? { __html: displayText }
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

        {isGenerating && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[1.35rem] bg-white/15 backdrop-blur-[1px]">
            <div className="rounded-3xl border border-white/70 bg-white/85 px-7 py-5 text-center shadow-2xl shadow-sky-900/10">
              <div className="mx-auto mb-3 flex h-14 w-24 items-center justify-center gap-2">
                <span className="li-loader-dot" />
                <span className="li-loader-dot li-loader-dot--delay-1" />
                <span className="li-loader-dot li-loader-dot--delay-2" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--textColor)]">
                Generating
              </p>
              <p className="mt-1 text-xs text-[var(--textColor)]/50">
                Preparing a focused preview…
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats and action buttons */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {stats.words > 0 && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-black/8 bg-white/60 px-4 py-2.5 text-xs font-semibold text-[var(--textColor)]/60">
            <span>{stats.words.toLocaleString()} words</span>
            <span>{stats.characters.toLocaleString()} chars</span>
            {stats.paragraphs > 1 && <span>{stats.paragraphs} paragraphs</span>}
            {stats.sentences > 0 && <span>{stats.sentences} sentences</span>}
            <span>{formatReadingTime(stats.readingTimeSeconds)}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <CopyButton
            label="Copy text"
            onCopy={copyPlain}
            disabled={isGenerating}
          />
          {config.outputFormat === "html" && (
            <CopyButton
              label="Copy HTML"
              onCopy={copyHtml}
              disabled={isGenerating}
            />
          )}
          <button
            onClick={() => runWithLoading(config)}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[var(--textColor)] transition hover:bg-black/5 disabled:cursor-wait disabled:opacity-50"
          >
            <RefreshCw
              className={[
                "h-3.5 w-3.5",
                isGenerating ? "animate-spin" : "",
              ].join(" ")}
            />
            {isGenerating ? "Generating…" : "Regenerate"}
          </button>
          <button
            onClick={() => setOutput({ plain: "", html: "" })}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
          <button
            onClick={() => download(config.outputFormat)}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>

      <style>{`
        .li-preview-frame {
          position: relative;
          isolation: isolate;
          border-radius: 1.35rem;
          padding: 2px;
          background:
            linear-gradient(#f8fafc, #f8fafc) padding-box,
            repeating-linear-gradient(
              90deg,
              rgba(2, 34, 64, 0.9) 0 14px,
              transparent 14px 24px,
              rgba(56, 189, 248, 0.9) 24px 38px,
              transparent 38px 50px,
              rgba(129, 140, 248, 0.9) 50px 64px,
              transparent 64px 76px
            ) border-box;
          border: 2px dashed transparent;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
          transition: box-shadow 0.35s ease, transform 0.35s ease;
        }

        .li-preview-frame::before {
          content: "";
          position: absolute;
          inset: -3px;
          z-index: -1;
          border-radius: inherit;
          background: linear-gradient(
            120deg,
            rgba(56, 189, 248, 0.2),
            rgba(129, 140, 248, 0.22),
            rgba(14, 165, 233, 0.16)
          );
          opacity: 0.35;
          filter: blur(12px);
          transition: opacity 0.35s ease;
        }

        .li-preview-frame--active {
          background-size: 260px 100%, auto;
          animation: li-border-walk 1.1s linear infinite;
          box-shadow: 0 24px 70px rgba(14, 165, 233, 0.2);
          transform: translateY(-1px);
        }

        .li-preview-frame--active::before {
          opacity: 0.75;
        }

        .li-loader-dot {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border-radius: 9999px;
          background: linear-gradient(135deg, #082f49, #38bdf8, #818cf8);
          box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.4);
          animation: li-dot-pulse 0.9s ease-in-out infinite;
        }

        .li-loader-dot--delay-1 {
          animation-delay: 0.15s;
        }

        .li-loader-dot--delay-2 {
          animation-delay: 0.3s;
        }

        @keyframes li-border-walk {
          from {
            background-position: 0 0, 0 0;
          }
          to {
            background-position: 152px 0, 0 0;
          }
        }

        @keyframes li-dot-pulse {
          0%, 100% {
            transform: translateY(0) scale(0.85);
            opacity: 0.45;
            box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.24);
          }
          50% {
            transform: translateY(-8px) scale(1.12);
            opacity: 1;
            box-shadow: 0 0 0 10px rgba(56, 189, 248, 0);
          }
        }
      `}</style>
    </div>
  );
}
