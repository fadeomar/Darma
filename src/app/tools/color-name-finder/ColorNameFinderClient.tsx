"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CopyButton, Input } from "@/components/ui";
import {
  buildAlphaComposites,
  buildHarmony,
  buildProductionChecks,
  buildScale,
  buildShadeAccessibility,
  buildVisionSimulations,
  COLOR_NAME_EXAMPLES,
  findClosestColors,
  findFrameworkMatches,
  findSourceMatches,
  getColorProfile,
  getSemanticRoles,
  getUsageRecommendations,
  parseColor,
  type ColorMatch,
} from "./colorName";

type PanelId = "overview" | "palette" | "accessibility" | "exports";

const PANELS: Array<{ id: PanelId; label: string; description: string }> = [
  {
    id: "overview",
    label: "Design preview",
    description: "See the named color in a real interface",
  },
  {
    id: "palette",
    label: "Related colors",
    description: "Harmony and shade relationships",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    description: "Contrast and vision checks",
  },
  { id: "exports", label: "Developer exports", description: "Tokens and framework handoff" },
];

function MiniCard({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        {label}
      </p>
      <p
        title={title ?? value}
        className="mt-1 overflow-x-auto whitespace-nowrap font-mono text-[13px] font-bold leading-5 text-[var(--color-text-primary)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
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

function SourcePill({ match }: { match: ColorMatch }) {
  return (
    <div
      title={`Use ${match.name} ${match.hex}`}
      className="grid min-w-0 grid-cols-[32px_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-2 text-left transition group-hover:border-[var(--color-border)] group-hover:bg-[var(--color-surface-subtle)]"
    >
      <span
        className="h-8 w-8 rounded-xl border border-black/10 shadow-sm"
        style={{ background: match.hex }}
      />
      <span className="min-w-0">
        <span className="block truncate text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          {match.source}
        </span>
        <span className="block truncate text-sm font-black text-[var(--color-text-primary)]">
          {match.name}
        </span>
        <span className="block truncate font-mono text-xs text-[var(--color-text-tertiary)]">
          {match.hex} · {match.confidence}%
        </span>
      </span>
    </div>
  );
}

function ExportBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-black text-[var(--color-text-primary)]">
          {title}
        </h4>
        <CopyButton text={text} size="sm" variant="secondary">
          Copy
        </CopyButton>
      </div>
      <pre className="mt-3 max-h-28 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-[var(--color-surface)] p-3 font-mono text-xs leading-5 text-[var(--color-text-secondary)]">
        {text}
      </pre>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-black text-[var(--color-text-primary)]">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function statusClass(
  status: "Good" | "Review" | "Risk" | "Strong" | "Use care",
) {
  if (status === "Good" || status === "Strong")
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200";
  if (status === "Risk")
    return "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200";
  return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200";
}

function compactCssColor(hex: string, alpha?: number) {
  return alpha && alpha < 1
    ? `${hex}${Math.round(alpha * 255)
        .toString(16)
        .padStart(2, "0")}`
    : hex;
}

const uniqueMatches = (matches: ColorMatch[], top?: ColorMatch) => {
  const seen = new Set<string>(
    top ? [top.hex.toLowerCase(), top.name.toLowerCase()] : [],
  );
  return matches.filter((match) => {
    const keys = [match.hex.toLowerCase(), match.name.toLowerCase()];
    if (keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
};

const tokenName = (name: string) =>
  name
    .toLowerCase()
    .replace(/^xkcd\s+/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "color";

export default function ColorNameFinderClient() {
  const [input, setInput] = useState("#800020");
  const [activePanel, setActivePanel] = useState<PanelId>("overview");
  const parsed = useMemo(() => parseColor(input), [input]);
  const matches = useMemo(
    () => (parsed.ok ? findClosestColors(parsed.rgb, 14) : []),
    [parsed],
  );
  const top = matches[0];
  const alternativeMatches = useMemo(
    () => uniqueMatches(matches, top).slice(0, 6),
    [matches, top],
  );
  const sourceMatches = useMemo(
    () => (parsed.ok ? findSourceMatches(parsed.rgb) : []),
    [parsed],
  );
  const profile = parsed.ok ? getColorProfile(parsed.hsl) : null;
  const harmony = parsed.ok ? buildHarmony(parsed.hex) : [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scale = parsed.ok ? buildScale(parsed.hsl) : [];
  const frameworkMatches = useMemo(
    () => (parsed.ok ? findFrameworkMatches(parsed.rgb) : []),
    [parsed],
  );
  const shadeAccessibility = useMemo(
    () => (parsed.ok ? buildShadeAccessibility(scale) : []),
    [parsed, scale],
  );
  const usage = parsed.ok ? getUsageRecommendations(parsed.hsl) : null;
  const productionChecks = useMemo(
    () => (parsed.ok ? buildProductionChecks(parsed, frameworkMatches) : []),
    [parsed, frameworkMatches],
  );
  const visionSimulations = useMemo(
    () => (parsed.ok ? buildVisionSimulations(parsed.rgb) : []),
    [parsed],
  );
  const alphaComposites = useMemo(
    () =>
      parsed.ok && parsed.hasAlpha
        ? buildAlphaComposites(parsed.rgb, parsed.alpha)
        : [],
    [parsed],
  );
  const semanticRoles = useMemo(
    () =>
      parsed.ok
        ? getSemanticRoles(
            parsed.hsl,
            parsed.contrastBlack,
            parsed.contrastWhite,
          )
        : [],
    [parsed],
  );

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
                type="button"
                onClick={() => setInput(x)}
                className="rounded-full bg-[var(--color-surface-subtle)] px-3 py-1.5 font-mono text-xs font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-border-subtle)]"
              >
                {x}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          <h3 className="text-lg font-black">Invalid color</h3>
          <p className="mt-2 text-sm">{(parsed as { error: string }).error}</p>
        </div>
      </div>
    );
  }

  const accessibility =
    parsed.contrastBlack >= parsed.contrastWhite
      ? { label: "Black text is better", ratio: parsed.contrastBlack }
      : { label: "White text is better", ratio: parsed.contrastWhite };

  const slug = tokenName(top.name);
  const cssVariables = `:root {\n  --color-${slug}: ${parsed.hex};\n  --color-${slug}-rgb: ${parsed.rgb.r} ${parsed.rgb.g} ${parsed.rgb.b};\n  --color-${slug}-oklch: ${parsed.oklch};\n  --color-${slug}-text: ${parsed.bestTextColor};\n}`;
  const jsonToken = JSON.stringify(
    {
      name: top.name,
      hex: parsed.hex,
      rgb: parsed.rgb,
      hsl: parsed.hsl,
      oklch: parsed.oklch,
      source: top.source,
      confidence: top.confidence,
      family: profile?.family,
      usage: usage?.summary,
      accessibility: {
        black: parsed.contrastBlack,
        white: parsed.contrastWhite,
        recommendedText: parsed.bestTextColor,
      },
    },
    null,
    2,
  );
  const scaleToken = scale
    .map((item) => `"${slug}-${item.label}": "${item.hex}"`)
    .join(",\n");
  const accessibilityToken = shadeAccessibility
    .map(
      (item) =>
        `${slug}-${item.label}: ${item.hex} → ${item.recommendedText} (${item.contrast}:1 ${item.status})`,
    )
    .join("\n");
  const tailwindConfig = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        ${slug}: {\n${scale.map((item) => `          ${item.label}: "${item.hex}"`).join(",\n")}\n        }\n      }\n    }\n  }\n}`;
  const scssMap = `$${slug}: ${compactCssColor(parsed.hex, parsed.hasAlpha ? parsed.alpha : undefined)};\n$${slug}-rgb: ${parsed.rgb.r}, ${parsed.rgb.g}, ${parsed.rgb.b};\n$${slug}-text: ${parsed.bestTextColor};\n$${slug}-scale: (\n${scale.map((item) => `  ${item.label}: ${item.hex}`).join(",\n")}\n);`;
  const oklchCompact = parsed.oklch.replace(/^oklch\(/, "").replace(/\)$/, "");
  const cmykCompact = parsed.cmyk.replace(/^cmyk\(/, "").replace(/\)$/, "");
  const conversionCards = [
    {
      label: "RGB",
      value: `${parsed.rgb.r}, ${parsed.rgb.g}, ${parsed.rgb.b}`,
      title: parsed.cssRgb,
    },
    {
      label: "HSL",
      value: `${parsed.hsl.h}, ${parsed.hsl.s}%, ${parsed.hsl.l}%`,
      title: parsed.cssHsl,
    },
    { label: "OKLCH", value: oklchCompact, title: parsed.oklch },
    { label: "CMYK", value: cmykCompact, title: parsed.cmyk },
    {
      label: "LAB",
      value: `${Math.round(parsed.lab.l)}, ${Math.round(parsed.lab.a)}, ${Math.round(parsed.lab.b)}`,
      title: `lab(${Math.round(parsed.lab.l)} ${Math.round(parsed.lab.a)} ${Math.round(parsed.lab.b)})`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,.72fr)]">
        <section className="overflow-hidden rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div
            className="min-h-[260px] p-5 sm:p-7"
            style={{ background: parsed.hex, color: parsed.bestTextColor }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.12em] opacity-75">
                  Closest color name
                </p>
                <h2 className="mt-2 break-words text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                  {top.name}
                </h2>
                <p className="mt-2 font-mono text-sm opacity-85">{parsed.hex}</p>
              </div>
              <div className="rounded-2xl bg-white/20 px-4 py-3 text-right backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.08em] opacity-75">
                  Match confidence
                </p>
                <p className="mt-1 text-3xl font-black tabular-nums">{top.confidence}%</p>
              </div>
            </div>
            <p className="mt-8 max-w-xl text-sm leading-6 opacity-90">
              A {profile?.depth.toLowerCase()} {profile?.vibrance.toLowerCase()} {profile?.family.toLowerCase()} tone. Use the closest human-readable name, then compare nearby alternatives before you copy it into design or handoff notes.
            </p>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-black text-[var(--color-text-secondary)]">
                Find a color name
              </label>
              <span className="rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                {parsed.detectedFormat}
              </span>
            </div>
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

            {parsed.alphaNotice ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                {parsed.alphaNotice} Alpha: {Math.round(parsed.alpha * 100)}%.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <CopyButton text={top.name} size="sm">Copy name</CopyButton>
              <CopyButton text={parsed.hex} size="sm" variant="secondary">Copy HEX</CopyButton>
              <CopyButton text={`${top.name} ${parsed.hex}`} size="sm" variant="secondary">Copy both</CopyButton>
            </div>

            <details className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-[var(--color-text-primary)] [&::-webkit-details-marker]:hidden">
                Try example colors
              </summary>
              <div className="flex flex-wrap gap-2 border-t border-[var(--color-border-subtle)] p-3">
                {COLOR_NAME_EXAMPLES.map((x) => (
                  <button
                    key={x}
                    type="button"
                    onClick={() => setInput(x)}
                    className="rounded-full bg-[var(--color-surface)] px-3 py-1.5 font-mono text-xs font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-border-subtle)]"
                  >
                    {x}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </section>

        <aside className="grid content-start gap-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <SectionHeader
              title="Nearby names"
              description="Similar named colors you may prefer for clearer communication."
            />
            <div className="mt-3 space-y-2">
              {alternativeMatches.slice(0, 6).map((m) => (
                <button
                  key={`${m.name}-${m.hex}`}
                  type="button"
                  onClick={() => setInput(m.hex)}
                  className="grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] p-2.5 text-left transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface-subtle)]"
                >
                  <span
                    className="h-11 w-11 rounded-xl border border-black/10 shadow-sm"
                    style={{ background: m.hex }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-[var(--color-text-primary)]">{m.name}</span>
                    <span className="block truncate font-mono text-xs text-[var(--color-text-tertiary)]">{m.hex} · {m.source}</span>
                  </span>
                  <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-1 text-xs font-black tabular-nums text-[var(--color-text-secondary)]">{m.confidence}%</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <SectionHeader
              title="Color formats"
              description="Useful values for design and handoff."
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {conversionCards.map((card) => (
                <MiniCard key={card.label} label={card.label} value={card.value} title={card.title} />
              ))}
            </div>
          </section>

          <details className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <summary className="cursor-pointer list-none px-4 py-4 text-sm font-black text-[var(--color-text-primary)] [&::-webkit-details-marker]:hidden">
              Naming & framework details
            </summary>
            <div className="space-y-4 border-t border-[var(--color-border-subtle)] p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Name sources</p>
                <div className="mt-2 grid gap-2">
                  {sourceMatches.map((item) =>
                    item.match ? (
                      <button key={item.source} type="button" onClick={() => setInput(item.match!.hex)} className="group text-left">
                        <SourcePill match={item.match} />
                      </button>
                    ) : null,
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Framework matches</p>
                <div className="mt-2 space-y-2">
                  {frameworkMatches.map((item) => (
                    <button
                      key={`${item.system}-${item.name}`}
                      type="button"
                      onClick={() => setInput(item.hex)}
                      className="grid w-full min-w-0 grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-2 text-left transition hover:bg-[var(--color-surface-subtle)]"
                    >
                      <span className="h-9 w-9 rounded-xl border border-black/10" style={{ background: item.hex }} />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{item.system}</span>
                        <span className="block truncate text-sm font-black text-[var(--color-text-primary)]">{item.name}</span>
                      </span>
                      <span className="text-xs font-black tabular-nums text-[var(--color-text-secondary)]">{item.confidence}%</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </aside>
      </div>

      <section className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-4">
          {PANELS.map((panel) => {
            const active = activePanel === panel.id;
            return (
              <button
                key={panel.id}
                type="button"
                onClick={() => setActivePanel(panel.id)}
                aria-pressed={active}
                className={`rounded-2xl border p-3 text-left transition ${active ? "border-[var(--color-border)] bg-[var(--color-surface-subtle)] shadow-sm" : "border-transparent hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)]"}`}
              >
                <span className="block text-sm font-black text-[var(--color-text-primary)]">
                  {panel.label}
                </span>
                <span className="mt-1 block text-xs leading-4 text-[var(--color-text-tertiary)]">
                  {panel.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {activePanel === "overview" ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
              <section className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                <SectionHeader
                  title="Production preview"
                  description="Quickly see how the color behaves in realistic UI blocks."
                />
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div
                    className="overflow-hidden rounded-3xl border border-black/10"
                    style={{
                      background: parsed.hex,
                      color: parsed.bestTextColor,
                    }}
                  >
                    <div className="p-5">
                      <p className="text-xs font-black uppercase tracking-[0.12em] opacity-75">
                        Brand surface
                      </p>
                      <h4 className="mt-2 text-2xl font-black tracking-[-0.03em]">
                        {top.name}
                      </h4>
                      <p className="mt-2 max-w-xs text-sm leading-6 opacity-85">
                        A compact preview for hero blocks, campaign headers, and
                        brand cards.
                      </p>
                      <button
                        type="button"
                        className="mt-4 rounded-full px-4 py-2 text-xs font-black"
                        style={{
                          background: parsed.bestTextColor,
                          color: parsed.hex,
                        }}
                      >
                        Primary action
                      </button>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                      Interface sample
                    </p>
                    <div className="mt-3 rounded-2xl bg-[var(--color-surface-subtle)] p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-10 w-10 rounded-2xl"
                          style={{ background: parsed.hex }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-[var(--color-text-primary)]">
                            Selected color token
                          </p>
                          <p className="font-mono text-xs text-[var(--color-text-tertiary)]">
                            {parsed.hex} · {top.confidence}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-border-subtle)]">
                        <span
                          className="block h-full w-2/3 rounded-full"
                          style={{ background: parsed.hex }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid gap-4">
                <section className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                  <SectionHeader
                    title="Production checks"
                    description="Fast checks before using this color in a real UI."
                  />
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {productionChecks.map((check) => (
                      <div
                        key={check.title}
                        className={`rounded-2xl border p-3 ${statusClass(check.status)}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-black">{check.title}</p>
                          <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-black uppercase text-current dark:bg-black/20">
                            {check.status}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 opacity-90">
                          {check.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                  <SectionHeader
                    title="Semantic role fit"
                    description="Where this color belongs inside a design system."
                  />
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {semanticRoles.map((role) => (
                      <div
                        key={role.role}
                        className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-black text-[var(--color-text-primary)]">
                            {role.role}
                          </p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-black uppercase ${statusClass(role.fit)}`}
                          >
                            {role.fit}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">
                          {role.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          {activePanel === "palette" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                <SectionHeader
                  title="Color relationships"
                  description="Click any related color to re-run the tool with that value."
                />
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {harmony.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setInput(item.hex)}
                      className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-left transition hover:border-[var(--color-border)]"
                    >
                      <span
                        className="block h-16"
                        style={{ background: item.hex }}
                      />
                      <span className="block p-2">
                        <span className="block truncate text-xs font-bold text-[var(--color-text-primary)]">
                          {item.name}
                        </span>
                        <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
                          {item.hex}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                <SectionHeader
                  title="UI shade scale"
                  description="Clickable Tailwind-style stops generated from this color."
                  action={
                    <CopyButton
                      text={`{\n${scaleToken}\n}`}
                      size="sm"
                      variant="secondary"
                    >
                      Copy scale
                    </CopyButton>
                  }
                />
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 xl:grid-cols-11">
                  {scale.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setInput(item.hex)}
                      title={item.hex}
                      className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-left transition hover:border-[var(--color-border)]"
                    >
                      <span
                        className="block h-14"
                        style={{ background: item.hex }}
                      />
                      <span className="block p-1 text-xs font-black text-[var(--color-text-secondary)]">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {activePanel === "accessibility" ? (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
                <section className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                  <SectionHeader
                    title="Contrast summary"
                    description="Recommended text color and basic WCAG status."
                  />
                  <div className="mt-3 rounded-2xl bg-[var(--color-surface)] p-4">
                    <p className="text-sm font-black text-[var(--color-text-primary)]">
                      {accessibility.label}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
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
                </section>

                <section className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                  <SectionHeader
                    title="Color vision preview"
                    description="Approximate previews for common color-vision differences."
                    action={
                      <CopyButton
                        text={visionSimulations
                          .map((item) => `${item.label}: ${item.hex}`)
                          .join("\n")}
                        size="sm"
                        variant="secondary"
                      >
                        Copy
                      </CopyButton>
                    }
                  />
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {visionSimulations.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setInput(item.hex)}
                        className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-left transition hover:border-[var(--color-border)]"
                      >
                        <span
                          className="grid h-16 place-items-center text-xs font-black"
                          style={{
                            background: item.hex,
                            color: item.recommendedText,
                          }}
                        >
                          {item.hex}
                        </span>
                        <span className="block p-2">
                          <span className="block truncate text-xs font-black text-[var(--color-text-primary)]">
                            {item.label}
                          </span>
                          <span className="block truncate text-xs text-[var(--color-text-tertiary)]">
                            {item.note}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {alphaComposites.length ? (
                <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">Alpha composites</h3>
                      <p className="mt-1 text-xs opacity-80">
                        The entered alpha color is previewed on common surfaces.
                        Use these composite HEX values when exporting solid
                        assets.
                      </p>
                    </div>
                    <Badge>{Math.round(parsed.alpha * 100)}% alpha</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {alphaComposites.map((item) => (
                      <button
                        key={item.surface}
                        type="button"
                        onClick={() => setInput(item.hex)}
                        className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-amber-200/70 bg-white/50 p-2 text-left dark:border-amber-900/40 dark:bg-black/10"
                      >
                        <span
                          className="h-11 w-11 rounded-xl border border-black/10"
                          style={{ background: item.hex }}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black">
                            {item.surface}
                          </span>
                          <span className="block truncate font-mono text-xs opacity-75">
                            {item.hex} over {item.backgroundHex}
                          </span>
                        </span>
                        <span className="text-xs font-black">
                          {item.contrast}:1
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                <SectionHeader
                  title="Accessible shade scale"
                  description="Every shade shows recommended text color and contrast status."
                  action={
                    <CopyButton
                      text={accessibilityToken}
                      size="sm"
                      variant="secondary"
                    >
                      Copy a11y
                    </CopyButton>
                  }
                />
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 xl:grid-cols-11">
                  {shadeAccessibility.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setInput(item.hex)}
                      title={`${item.hex} · ${item.contrast}:1 ${item.status}`}
                      className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-left transition hover:border-[var(--color-border)]"
                    >
                      <span
                        className="grid h-14 place-items-center text-xs font-black"
                        style={{
                          background: item.hex,
                          color: item.recommendedText,
                        }}
                      >
                        {item.status}
                      </span>
                      <span className="block p-1 text-xs font-black text-[var(--color-text-secondary)]">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {activePanel === "exports" ? (
            <section className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
              <SectionHeader
                title="Developer export"
                description="Copy ready tokens without opening another tool."
                action={<Badge>{slug}</Badge>}
              />
              <div className="mt-3 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                <ExportBlock title="CSS variables" text={cssVariables} />
                <ExportBlock title="JSON token" text={jsonToken} />
                <ExportBlock
                  title="Shade token map"
                  text={`{\n${scaleToken}\n}`}
                />
                <ExportBlock
                  title="Accessibility map"
                  text={accessibilityToken}
                />
                <ExportBlock title="Tailwind config" text={tailwindConfig} />
                <ExportBlock title="SCSS map" text={scssMap} />
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
