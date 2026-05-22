"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Plus, RefreshCw, Shuffle, Trash2 } from "lucide-react";
import {
  DEFAULT_GRADIENT,
  GRADIENT_PRESETS,
  buildCssSnippet,
  buildGradientCss,
  buildTailwindArbitraryClass,
  clamp,
  createRandomGradient,
  createStop,
  normalizeHexColor,
  reverseStops,
  sortStops,
  validateGradient,
  type GradientState,
  type GradientStop,
} from "./gradient";

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

function SmallButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold text-[var(--textColor)]/60 transition hover:border-[var(--textColor)]/25 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function CodeBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--textColor)]/40">
          {label}
        </span>
        <CopyBtn text={value} />
      </div>
      <pre className="max-h-44 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function safeColorInputValue(value: string) {
  const normalized = normalizeHexColor(value);
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : "#ffffff";
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3">
      <p className="text-xs font-bold text-[var(--textColor)]/40">{label}</p>
      <p className="mt-1 text-sm font-black text-[var(--textColor)]">{value}</p>
    </div>
  );
}

export default function CssGradientGeneratorClient() {
  const [state, setState] = useState<GradientState>(DEFAULT_GRADIENT);

  const validation = useMemo(() => validateGradient(state), [state]);
  const gradientCss = useMemo(() => (validation.ok ? buildGradientCss(state) : ""), [state, validation.ok]);
  const cssSnippet = useMemo(() => (validation.ok ? buildCssSnippet(state) : ""), [state, validation.ok]);
  const tailwindClass = useMemo(
    () => (validation.ok ? buildTailwindArbitraryClass(state) : ""),
    [state, validation.ok],
  );
  const sortedStops = useMemo(() => sortStops(state.stops), [state.stops]);

  const updateStop = (id: string, patch: Partial<GradientStop>) => {
    setState((current) => ({
      ...current,
      stops: current.stops.map((stop) =>
        stop.id === id
          ? {
              ...stop,
              ...patch,
              position: patch.position === undefined ? stop.position : clamp(patch.position, 0, 100),
            }
          : stop,
      ),
    }));
  };

  const removeStop = (id: string) => {
    setState((current) => ({
      ...current,
      stops: current.stops.filter((stop) => stop.id !== id),
    }));
  };

  const addStop = () => {
    const nextPosition = state.stops.length > 0 ? 50 : 0;
    setState((current) => ({
      ...current,
      stops: [...current.stops, createStop("#ffffff", nextPosition)],
    }));
  };

  const reverseGradient = () => {
    setState((current) => ({
      ...current,
      stops: reverseStops(current.stops),
    }));
  };

  const resetGradient = () => setState(DEFAULT_GRADIENT);
  const randomGradient = () => setState(createRandomGradient());

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <SectionLabel>Live preview</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              <SmallButton onClick={randomGradient}>
                <Shuffle className="h-3.5 w-3.5" />
                Random
              </SmallButton>
              <SmallButton onClick={reverseGradient} disabled={state.stops.length < 2}>
                <RefreshCw className="h-3.5 w-3.5" />
                Reverse
              </SmallButton>
              <SmallButton onClick={resetGradient}>Reset</SmallButton>
            </div>
          </div>

          <div
            className="relative flex min-h-[320px] overflow-hidden rounded-3xl border border-black/10 p-6 shadow-inner"
            style={{ background: validation.ok ? gradientCss : "#f8fafc" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.32),transparent_38%)]" />
            <div className="relative mt-auto max-w-md rounded-2xl border border-white/40 bg-white/75 p-4 shadow-xl backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                {validation.ok ? "Ready to copy" : "Needs attention"}
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">CSS Gradient Generator</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                Tune the colors, angle, and stops, then copy clean CSS for your UI.
              </p>
            </div>
          </div>

          {!validation.ok ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <strong>Gradient not ready.</strong>
              <ul className="mt-2 list-disc pl-5">
                {validation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-black/10 bg-slate-50 p-4">
          <SectionLabel>Controls</SectionLabel>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setState((current) => ({ ...current, type: "linear" }))}
              className={[
                "rounded-xl border px-3 py-2 text-sm font-black transition",
                state.type === "linear"
                  ? "border-[var(--textColor)] bg-[var(--textColor)] text-[var(--baseColor)]"
                  : "border-black/10 bg-white text-[var(--textColor)]/60 hover:bg-black/5",
              ].join(" ")}
            >
              Linear
            </button>
            <button
              type="button"
              onClick={() => setState((current) => ({ ...current, type: "radial" }))}
              className={[
                "rounded-xl border px-3 py-2 text-sm font-black transition",
                state.type === "radial"
                  ? "border-[var(--textColor)] bg-[var(--textColor)] text-[var(--baseColor)]"
                  : "border-black/10 bg-white text-[var(--textColor)]/60 hover:bg-black/5",
              ].join(" ")}
            >
              Radial
            </button>
          </div>

          {state.type === "linear" ? (
            <div className="mt-4">
              <label htmlFor="gradient-angle" className="mb-2 block text-xs font-bold text-[var(--textColor)]/50">
                Angle: {state.angle}deg
              </label>
              <input
                id="gradient-angle"
                type="range"
                min="0"
                max="360"
                value={state.angle}
                onChange={(event) =>
                  setState((current) => ({ ...current, angle: Number(event.target.value) }))
                }
                className="w-full"
              />
              <input
                type="number"
                min="0"
                max="360"
                value={state.angle}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    angle: clamp(Number(event.target.value), 0, 360),
                  }))
                }
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[var(--textColor)] outline-none focus:border-[var(--textColor)]/30"
                aria-label="Gradient angle in degrees"
              />
            </div>
          ) : (
            <div className="mt-4">
              <label htmlFor="gradient-shape" className="mb-2 block text-xs font-bold text-[var(--textColor)]/50">
                Radial shape
              </label>
              <select
                id="gradient-shape"
                value={state.shape}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    shape: event.target.value === "ellipse" ? "ellipse" : "circle",
                  }))
                }
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[var(--textColor)] outline-none focus:border-[var(--textColor)]/30"
              >
                <option value="circle">Circle</option>
                <option value="ellipse">Ellipse</option>
              </select>
            </div>
          )}

          <div className="mt-4">
            <SectionLabel>Presets</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setState(preset.state)}
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[var(--textColor)]/60 transition hover:border-[var(--textColor)]/25 hover:bg-black/5"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <SectionLabel>Color stops</SectionLabel>
          <SmallButton onClick={addStop} disabled={state.stops.length >= 6}>
            <Plus className="h-3.5 w-3.5" />
            Add stop
          </SmallButton>
        </div>

        <div className="grid gap-3">
          {sortedStops.map((stop, index) => (
            <div
              key={stop.id}
              className="grid gap-3 rounded-2xl border border-black/10 bg-white p-3 md:grid-cols-[auto_minmax(0,1fr)_120px_auto] md:items-center"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-2xl border border-black/10"
                  style={{ backgroundColor: normalizeHexColor(stop.color) }}
                />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--textColor)]/40">
                    Stop {index + 1}
                  </p>
                  <p className="text-xs font-semibold text-[var(--textColor)]/50">{stop.position}%</p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                <input
                  type="color"
                  value={safeColorInputValue(stop.color)}
                  onChange={(event) => updateStop(stop.id, { color: event.target.value })}
                  className="h-10 w-16 cursor-pointer rounded-xl border border-black/10 bg-white p-1"
                  aria-label={`Color picker for stop ${index + 1}`}
                />
                <input
                  value={stop.color}
                  onChange={(event) => updateStop(stop.id, { color: event.target.value })}
                  onBlur={(event) => updateStop(stop.id, { color: normalizeHexColor(event.target.value) })}
                  className="w-full rounded-xl border border-black/10 bg-slate-50 px-3 py-2 font-mono text-sm text-[var(--textColor)] outline-none focus:border-[var(--textColor)]/30"
                  aria-label={`HEX color value for stop ${index + 1}`}
                />
              </div>

              <div>
                <label className="sr-only" htmlFor={`stop-position-${stop.id}`}>
                  Position for stop {index + 1}
                </label>
                <input
                  id={`stop-position-${stop.id}`}
                  type="number"
                  min="0"
                  max="100"
                  value={stop.position}
                  onChange={(event) => updateStop(stop.id, { position: Number(event.target.value) })}
                  className="w-full rounded-xl border border-black/10 bg-slate-50 px-3 py-2 text-sm font-semibold text-[var(--textColor)] outline-none focus:border-[var(--textColor)]/30"
                />
              </div>

              <button
                type="button"
                onClick={() => removeStop(stop.id)}
                disabled={state.stops.length <= 2}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={`Remove color stop ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Status" value={validation.ok ? "Ready" : "Invalid"} />
        <StatCard label="Type" value={state.type === "linear" ? "Linear" : "Radial"} />
        <StatCard label="Stops" value={String(state.stops.length)} />
        <StatCard label="Direction" value={state.type === "linear" ? `${state.angle}deg` : state.shape} />
      </div>

      {validation.ok ? (
        <div className="grid gap-3">
          <CodeBox label="CSS background" value={`background: ${gradientCss};`} />
          <CodeBox label="CSS class" value={cssSnippet} />
          <CodeBox label="Tailwind arbitrary class" value={tailwindClass} />
        </div>
      ) : null}
    </div>
  );
}
