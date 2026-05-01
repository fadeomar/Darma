"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Pipette, RefreshCw, Trash2 } from "lucide-react";
import { COLOR_EXAMPLES, parseColorInput } from "./color";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--textColor)]/40">
      {children}
    </p>
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

function ValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 rounded-2xl border border-black/10 bg-white p-3 md:grid-cols-[130px_minmax(0,1fr)_auto] md:items-center">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--textColor)]/40">
        {label}
      </span>
      <code className="break-all rounded-xl bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
        {value}
      </code>
      <CopyBtn text={value} />
    </div>
  );
}

export default function ColorConverterClient() {
  const [input, setInput] = useState("#3b82f6");
  const result = useMemo(() => parseColorInput(input), [input]);

  const handleClear = () => setInput("");

  const handleRandom = () => {
    const value = Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0");
    setInput(`#${value}`);
  };

  const cssVariables = result.ok
    ? `--color: ${result.hex};\n--color-rgb: ${result.rgb.r} ${result.rgb.g} ${result.rgb.b};\n--color-hsl: ${result.hsl.h} ${result.hsl.s}% ${result.hsl.l}%;`
    : "";

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionLabel>Color input</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={handleRandom}
                className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[var(--textColor)]/60 transition hover:bg-black/5"
              >
                <RefreshCw className="h-3 w-3" />
                Random
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

          <div className="rounded-2xl border border-black/10 bg-slate-50 p-4">
            <label htmlFor="color-input" className="sr-only">
              Enter a color value
            </label>
            <input
              id="color-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="#3b82f6, rgb(59, 130, 246), or hsl(217, 91%, 60%)"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-mono text-sm text-[var(--textColor)] outline-none transition placeholder:text-[var(--textColor)]/25 focus:border-[var(--textColor)]/30"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {COLOR_EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => setInput(example.value)}
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[var(--textColor)]/60 transition hover:border-[var(--textColor)]/25 hover:bg-black/5"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <SectionLabel>Live preview</SectionLabel>
          <div
            className="flex min-h-[190px] flex-col justify-between rounded-2xl border border-black/10 p-5 shadow-inner transition"
            style={{
              backgroundColor: result.ok ? result.hex : "#f8fafc",
              color: result.ok ? result.bestTextColor : "#334155",
            }}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <Pipette className="h-4 w-4" />
              {result.ok ? "Preview color" : "Waiting for a valid color"}
            </div>
            <div>
              <p className="font-mono text-2xl font-black">
                {result.ok ? result.hex : "No color"}
              </p>
              <p className="mt-1 text-sm opacity-80">
                {result.ok ? `Best text: ${result.bestTextColor}` : "Enter a valid HEX, RGB, or HSL value."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {result.ok ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3">
              <p className="text-xs font-bold text-[var(--textColor)]/40">Detected</p>
              <p className="mt-1 text-sm font-black uppercase text-[var(--textColor)]">
                {result.detectedFormat}
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3">
              <p className="text-xs font-bold text-[var(--textColor)]/40">Status</p>
              <p className="mt-1 text-sm font-black text-emerald-700">Valid color</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3">
              <p className="text-xs font-bold text-[var(--textColor)]/40">Contrast black</p>
              <p className="mt-1 text-sm font-black text-[var(--textColor)]">
                {result.contrastWithBlack}:1
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3">
              <p className="text-xs font-bold text-[var(--textColor)]/40">Contrast white</p>
              <p className="mt-1 text-sm font-black text-[var(--textColor)]">
                {result.contrastWithWhite}:1
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            <ValueRow label="HEX" value={result.hex} />
            <ValueRow label="RGB" value={result.cssRgb} />
            <ValueRow label="HSL" value={result.cssHsl} />
            <ValueRow label="CSS vars" value={cssVariables} />
          </div>

          <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <SectionLabel>Shades</SectionLabel>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--textColor)]/55">
                Click copy on any shade
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {result.shades.map((shade) => (
                <div key={shade.label} className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                  <div className="h-20" style={{ backgroundColor: shade.hex }} />
                  <div className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--textColor)]/50">
                        {shade.label}
                      </span>
                      <CopyBtn text={shade.hex} label="Copy" />
                    </div>
                    <code className="block break-all font-mono text-xs text-slate-700">
                      {shade.hex}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <strong>Color not converted yet.</strong> {"error" in result ? result.error : ""}
        </div>
      )}
    </div>
  );
}
