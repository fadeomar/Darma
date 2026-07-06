"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CopyButton, Input } from "@/components/ui";
import {
  buildHarmony,
  buildScale,
  COLOR_NAME_EXAMPLES,
  findClosestColors,
  getColorProfile,
  parseColor,
} from "./colorName";

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        {label}
      </p>
      <p className="mt-1 break-all font-mono text-sm font-bold text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)]">
      {children}
    </span>
  );
}

export default function ColorNameFinderClient() {
  const [input, setInput] = useState("#800020");
  const parsed = useMemo(() => parseColor(input), [input]);
  const matches = useMemo(
    () => (parsed.ok ? findClosestColors(parsed.rgb, 7) : []),
    [parsed],
  );
  const top = matches[0];
  const alternativeMatches = matches.slice(1, 7);
  const profile = parsed.ok ? getColorProfile(parsed.hsl) : null;
  const harmony = parsed.ok ? buildHarmony(parsed.hex) : [];
  const scale = parsed.ok ? buildScale(parsed.hsl) : [];

  if (!parsed.ok) {
    return (
      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <label className="text-xs font-bold text-[var(--color-text-secondary)]">
            Color input
          </label>
          <Input
            className="mt-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="#800020"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {COLOR_NAME_EXAMPLES.map((x) => (
              <button
                key={x}
                onClick={() => setInput(x)}
                className="rounded-full bg-[var(--color-surface-subtle)] px-3 py-1.5 font-mono text-xs font-bold"
              >
                {x}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          <h3 className="text-lg font-black">Invalid color</h3>
          <p className="mt-2 text-sm">{parsed.error}</p>
        </div>
      </div>
    );
  }

  const accessibility =
    parsed.contrastBlack >= parsed.contrastWhite
      ? { label: "Black text is better", ratio: parsed.contrastBlack }
      : { label: "White text is better", ratio: parsed.contrastWhite };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div
            className="min-h-[210px] p-5"
            style={{ background: parsed.hex, color: parsed.bestTextColor }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-75">
                  Closest match
                </p>
                <h2 className="mt-2 text-4xl font-black tracking-[-0.04em]">
                  {top.name}
                </h2>
                <p className="mt-1 font-mono text-sm opacity-85">
                  {parsed.hex}
                </p>
              </div>
              <div className="rounded-2xl bg-white/20 px-3 py-2 text-right backdrop-blur">
                <p className="text-[10px] font-bold uppercase opacity-75">
                  Confidence
                </p>
                <p className="text-2xl font-black">{top.confidence}%</p>
              </div>
            </div>
            <p className="mt-8 max-w-sm text-sm leading-6 opacity-90">
              A {profile?.depth.toLowerCase()} {profile?.vibrance.toLowerCase()}{" "}
              {profile?.family.toLowerCase()} tone. Best starting point for
              naming, UI checks, palette generation, and brand usage.
            </p>
          </div>
          <div className="space-y-3 p-4">
            <label className="text-xs font-bold text-[var(--color-text-secondary)]">
              Color input
            </label>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="#800020"
              />
              <input
                aria-label="Pick color"
                type="color"
                value={parsed.hex}
                onChange={(e) => setInput(e.target.value)}
                className="h-11 w-14 cursor-pointer rounded-xl border border-[var(--color-border)] bg-transparent p-1"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_NAME_EXAMPLES.map((x) => (
                <button
                  key={x}
                  onClick={() => setInput(x)}
                  className="rounded-full bg-[var(--color-surface-subtle)] px-3 py-1.5 font-mono text-xs font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-border-subtle)]"
                >
                  {x}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <CopyButton text={parsed.hex} size="sm">
                Copy HEX
              </CopyButton>
              <CopyButton text={top.name} size="sm" variant="secondary">
                Copy name
              </CopyButton>
            </div>
          </div>
        </section>

        <section className="grid content-start gap-4">
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            <MiniCard label="RGB" value={parsed.cssRgb} />
            <MiniCard label="HSL" value={parsed.cssHsl} />
            <MiniCard label="CMYK" value={parsed.cmyk} />
            <MiniCard
              label="LAB"
              value={`${Math.round(parsed.lab.l)}, ${Math.round(parsed.lab.a)}, ${Math.round(parsed.lab.b)}`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)]">
            <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-[var(--color-text-primary)]">
                    Alternative names
                  </h3>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Nearest readable names after the main match.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  LAB
                </span>
              </div>
              <div className="space-y-2">
                {alternativeMatches.map((m) => (
                  <button
                    key={`${m.name}-${m.hex}`}
                    type="button"
                    onClick={() => setInput(m.hex)}
                    title={`Use ${m.name} ${m.hex}`}
                    className="grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] p-2 text-left transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface-subtle)]"
                  >
                    <span
                      className="h-11 w-11 rounded-xl border border-black/10 shadow-sm"
                      style={{ background: m.hex }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black leading-5 text-[var(--color-text-primary)]">
                        {m.name}
                      </span>
                      <span className="block truncate font-mono text-[11px] leading-4 text-[var(--color-text-tertiary)]">
                        {m.hex} · {m.source}
                      </span>
                    </span>
                    <span className="rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-xs font-black tabular-nums text-[var(--color-text-secondary)]">
                      {m.confidence}%
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="font-black text-[var(--color-text-primary)]">
                Design profile
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{profile?.family}</Badge>
                <Badge>{profile?.temperature}</Badge>
                <Badge>{profile?.vibrance}</Badge>
                <Badge>{profile?.depth}</Badge>
              </div>
              <div className="mt-4 rounded-2xl bg-[var(--color-surface-subtle)] p-3">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  Accessibility
                </p>
                <p className="mt-1 text-sm font-black text-[var(--color-text-primary)]">
                  {accessibility.label}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Contrast ratio: {accessibility.ratio}:1 ·{" "}
                  {accessibility.ratio >= 7
                    ? "AAA"
                    : accessibility.ratio >= 4.5
                      ? "AA"
                      : "Needs care"}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs font-bold">
                <div className="rounded-xl bg-black p-3 text-white">
                  Black {parsed.contrastBlack}:1
                </div>
                <div className="rounded-xl bg-white p-3 text-black ring-1 ring-black/10">
                  White {parsed.contrastWhite}:1
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="font-black text-[var(--color-text-primary)]">
            Color relationships
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {harmony.map((item) => (
              <div
                key={item.name}
                className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)]"
              >
                <div className="h-16" style={{ background: item.hex }} />
                <div className="p-2">
                  <p className="text-xs font-bold text-[var(--color-text-primary)]">
                    {item.name}
                  </p>
                  <p className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
                    {item.hex}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="font-black text-[var(--color-text-primary)]">
            UI shade scale
          </h3>
          <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-11">
            {scale.map((item) => (
              <button
                key={item.label}
                onClick={() => setInput(item.hex)}
                title={item.hex}
                className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)] text-left"
              >
                <span className="block h-12" style={{ background: item.hex }} />
                <span className="block p-1 text-[10px] font-black text-[var(--color-text-secondary)]">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
