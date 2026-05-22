"use client";

import { useMemo, useState } from "react";
import { Check, Copy, FileText, Trash2 } from "lucide-react";
import {
  DEFAULT_SLUG_OPTIONS,
  generateSlug,
  type SlugCaseMode,
  type SlugOptions,
  type SlugSeparator,
  type SlugWarning,
} from "./slug";

const EXAMPLES = [
  "How to Build a JSON Formatter",
  "React + Next.js Guide 2026!",
  "أفضل أدوات المطورين",
  "Product Launch: New Summer Collection",
  "10 Tips for Better SEO URLs",
  "Café Déjà Vu & Crème Brûlée",
];

const WARNING_LABELS: Record<SlugWarning, string> = {
  "empty-input": "Type or paste text to generate a slug.",
  "empty-output": "Only unsupported symbols were provided. Try adding letters or numbers.",
  "very-long": "Slug is very long. Consider enabling max length.",
  "trimmed": "Slug was trimmed to your max-length setting.",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--textColor)]/40">
      {children}
    </p>
  );
}

function OptionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-[var(--textColor)]/75">
      {children}
    </p>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-xl border border-black/8 bg-white px-3 py-2.5">
      <span>
        <span className="text-sm font-semibold text-[var(--textColor)]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-[var(--textColor)]/50">{description}</span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-[var(--textColor)]" : "bg-black/20",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </label>
  );
}

function WarningBar({ warnings }: { warnings: SlugWarning[] }) {
  if (warnings.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
        Slug is ready to use.
      </div>
    );
  }
  return (
    <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
      {warnings.map((warning) => (
        <p key={warning} className="text-xs text-amber-800">
          {WARNING_LABELS[warning]}
        </p>
      ))}
    </div>
  );
}

export default function SlugGeneratorClient() {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<SlugOptions>(DEFAULT_SLUG_OPTIONS);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => generateSlug(input, options), [input, options]);

  const patchOptions = (patch: Partial<SlugOptions>) => {
    setOptions((prev) => ({ ...prev, ...patch }));
  };

  const handleCopy = async () => {
    if (!result.slug) return;
    try {
      await navigator.clipboard.writeText(result.slug);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleClear = () => {
    setInput("");
    setCopied(false);
  };

  const charCountClass = result.slug.length > 96
    ? "text-amber-700"
    : "text-[var(--textColor)]/55";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Input text</SectionLabel>
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
          <label className="sr-only" htmlFor="slug-source-input">
            Title or text to convert into a URL slug
          </label>
          <textarea
            id="slug-source-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your title, heading, product name, or page name here…"
            rows={8}
            className="w-full resize-y rounded-2xl border border-black/10 bg-slate-50 p-4 text-sm leading-7 text-[var(--textColor)] outline-none placeholder:text-[var(--textColor)]/25 focus:border-[var(--textColor)]/30 transition"
          />
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

        <div className="rounded-2xl border border-black/8 bg-slate-50 p-4">
          <SectionLabel>Generated slug</SectionLabel>
          {result.slug ? (
            <p className="font-mono text-sm leading-7 text-[var(--textColor)]">
              {result.slug}
            </p>
          ) : (
            <p className="text-sm italic text-[var(--textColor)]/35">
              Your slug will appear here as you type.
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!result.slug}
              className={[
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-30",
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-[var(--textColor)] text-[var(--baseColor)] hover:opacity-80",
              ].join(" ")}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy slug"}
            </button>
            <span className={["text-xs font-semibold", charCountClass].join(" ")}>
              {result.stats.slugChars} chars
            </span>
          </div>
        </div>

        <WarningBar warnings={result.warnings} />

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-black/8 bg-white/60 px-4 py-2.5">
          <span className="text-xs text-[var(--textColor)]/55">
            <strong className="text-[var(--textColor)]/80">
              {result.stats.originalChars.toLocaleString()}
            </strong>{" "}
            original chars
          </span>
          <span className="text-xs text-[var(--textColor)]/55">
            <strong className="text-[var(--textColor)]/80">
              {result.stats.slugChars.toLocaleString()}
            </strong>{" "}
            slug chars
          </span>
          <span className="text-xs text-[var(--textColor)]/55">
            <strong className="text-[var(--textColor)]/80">
              {result.stats.wordCount.toLocaleString()}
            </strong>{" "}
            words
          </span>
          <span className="ml-auto text-xs font-semibold text-[var(--textColor)]/65">
            {result.stats.isUrlFriendly ? "URL-friendly" : "Needs content"}
          </span>
        </div>

        <p className="text-center text-xs text-[var(--textColor)]/35">
          All text is processed locally in your browser. Nothing is uploaded or stored.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <SectionLabel>Separator</SectionLabel>
          <div className="flex gap-1.5">
            {(["-", "_"] as SlugSeparator[]).map((separator) => (
              <button
                key={separator}
                type="button"
                onClick={() => patchOptions({ separator })}
                className={[
                  "flex-1 rounded-xl border py-2 text-xs font-semibold transition",
                  options.separator === separator
                    ? "border-[var(--textColor)] bg-[var(--textColor)] text-[var(--baseColor)]"
                    : "border-black/10 bg-white text-[var(--textColor)]/70 hover:border-[var(--textColor)]/30",
                ].join(" ")}
              >
                {separator === "-" ? "Hyphen (-)" : "Underscore (_)"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Letter case</SectionLabel>
          <div className="flex gap-1.5">
            {(
              [
                { id: "lower", label: "Lowercase" },
                { id: "keep", label: "Keep case" },
                { id: "upper", label: "UPPER" },
              ] as { id: SlugCaseMode; label: string }[]
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => patchOptions({ caseMode: mode.id })}
                className={[
                  "flex-1 rounded-xl border py-2 text-xs font-semibold transition",
                  options.caseMode === mode.id
                    ? "border-[var(--textColor)] bg-[var(--textColor)] text-[var(--baseColor)]"
                    : "border-black/10 bg-white text-[var(--textColor)]/70 hover:border-[var(--textColor)]/30",
                ].join(" ")}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <SectionLabel>Options</SectionLabel>
          <Toggle
            checked={options.keepNumbers}
            onChange={(keepNumbers) => patchOptions({ keepNumbers })}
            label="Keep numbers"
            description="Preserve 2026, v2, and other numeric tokens."
          />
          <Toggle
            checked={options.removeStopWords}
            onChange={(removeStopWords) => patchOptions({ removeStopWords })}
            label="Remove common English stop words"
            description="a, an, the, and, or, but, of, in, on, to, for, with..."
          />
          <Toggle
            checked={options.maxLengthEnabled}
            onChange={(maxLengthEnabled) => patchOptions({ maxLengthEnabled })}
            label="Enable max length"
            description="Trim slug without leaving a trailing separator."
          />
          <Toggle
            checked={options.preserveSlashes}
            onChange={(preserveSlashes) => patchOptions({ preserveSlashes })}
            label="Preserve slash paths"
            description="Convert path-like text into clean nested slugs."
          />
        </div>

        <div>
          <SectionLabel>Max length</SectionLabel>
          <OptionLabel>
            {options.maxLength} characters
          </OptionLabel>
          <input
            type="range"
            min={20}
            max={160}
            step={1}
            value={options.maxLength}
            disabled={!options.maxLengthEnabled}
            onChange={(e) => patchOptions({ maxLength: Number(e.target.value) })}
            className="mt-2 w-full accent-[var(--textColor)] disabled:opacity-40"
            aria-label="Maximum slug length"
          />
          <div className="mt-1 flex justify-between text-[10px] text-[var(--textColor)]/40">
            <span>20</span>
            <span>160</span>
          </div>
        </div>
      </div>
    </div>
  );
}
