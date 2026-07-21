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
    label: "Overview",
    description: "Production preview and role guidance",
  },
  {
    id: "palette",
    label: "Palette",
    description: "Relationships and shade scale",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    description: "Contrast, vision, and alpha checks",
  },
  { id: "exports", label: "Exports", description: "Tokens for developers" },
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
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
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
        <span className="block truncate text-[11px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          {match.source}
        </span>
        <span className="block truncate text-sm font-black text-[var(--color-text-primary)]">
          {match.name}
        </span>
        <span className="block truncate font-mono text-[11px] text-[var(--color-text-tertiary)]">
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
      <pre className="mt-3 max-h-28 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-[var(--color-surface)] p-3 font-mono text-[11px] leading-5 text-[var(--color-text-secondary)]">
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
      <div className="grid gap-4 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div
            className="min-h-[190px] p-5"
            style={{ background: parsed.hex, color: parsed.bestTextColor }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-75">
                  Closest match
                </p>
                <h2 className="mt-2 truncate text-4xl font-black tracking-[-0.04em]">
                  {top.name}
                </h2>
                <p className="mt-1 font-mono text-sm opacity-85">
                  {parsed.hex}
                </p>
              </div>
              <div className="shrink-0 rounded-2xl bg-white/20 px-3 py-2 text-right backdrop-blur">
                <p className="text-[10px] font-bold uppercase opacity-75">
                  Confidence
                </p>
                <p className="text-2xl font-black">{top.confidence}%</p>
              </div>
            </div>
            <p className="mt-7 max-w-sm text-sm leading-6 opacity-90">
              A {profile?.depth.toLowerCase()} {profile?.vibrance.toLowerCase()}{" "}
              {profile?.family.toLowerCase()} tone. Start with the name, then
              use the tabs below for production checks, palettes, accessibility,
              and exports.
            </p>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold text-[var(--color-text-secondary)]">
                Color input
              </label>
              <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
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
            {parsed.matchedInputName ? (
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Matched input name:{" "}
                <strong className="text-[var(--color-text-secondary)]">
                  {parsed.matchedInputName}
                </strong>
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {conversionCards.map((card) => (
              <MiniCard
                key={card.label}
                label={card.label}
                value={card.value}
                title={card.title}
              />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,.72fr)]">
            <div className="grid gap-4">
              <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <SectionHeader
                  title="Name sources"
                  description="Closest result by dataset when CSS, human, and design names disagree."
                  action={
                    <span className="rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                      4 datasets
                    </span>
                  }
                />
                <div className="mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
                  {sourceMatches.map((item) =>
                    item.match ? (
                      <button
                        key={item.source}
                        type="button"
                        onClick={() => setInput(item.match!.hex)}
                        className="group text-left"
                      >
                        <SourcePill match={item.match} />
                      </button>
                    ) : null,
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <SectionHeader
                  title="Framework matches"
                  description="Nearest available Tailwind, Bootstrap, and Material tokens. Low scores mean no exact token exists."
                  action={
                    <span className="rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                      UI systems
                    </span>
                  }
                />
                <div className="mt-3 space-y-2">
                  {frameworkMatches.map((item) => (
                    <button
                      key={`${item.system}-${item.name}`}
                      type="button"
                      onClick={() => setInput(item.hex)}
                      className="grid w-full min-w-0 grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-2.5 text-left transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface-subtle)]"
                    >
                      <span
                        className="h-10 w-10 rounded-xl border border-black/10 shadow-sm"
                        style={{ background: item.hex }}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[11px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                          {item.system}
                        </span>
                        <span className="block truncate text-sm font-black leading-5 text-[var(--color-text-primary)]">
                          {item.name}
                        </span>
                        <span className="block truncate font-mono text-[11px] leading-4 text-[var(--color-text-tertiary)]">
                          {item.hex} · ΔE {item.distance}
                        </span>
                      </span>
                      <span className="rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-xs font-black tabular-nums text-[var(--color-text-secondary)]">
                        {item.confidence}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <SectionHeader
                  title="Alternative names"
                  description="Nearest readable names after the main match."
                  action={
                    <span className="rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                      LAB
                    </span>
                  }
                />
                <div className="mt-3 space-y-2">
                  {alternativeMatches.slice(0, 4).map((m) => (
                    <button
                      key={`${m.name}-${m.hex}`}
                      type="button"
                      onClick={() => setInput(m.hex)}
                      title={`Use ${m.name} ${m.hex}`}
                      className="grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] p-2 text-left transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface-subtle)]"
                    >
                      <span
                        className="h-10 w-10 rounded-xl border border-black/10 shadow-sm"
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
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {usage?.summary}
                </p>
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
              </div>
            </div>
          </div>
        </section>
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
                <span className="mt-1 block text-[11px] leading-4 text-[var(--color-text-tertiary)]">
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
                          <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-black uppercase text-current dark:bg-black/20">
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
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${statusClass(role.fit)}`}
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
                        <span className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
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
                      <span className="block p-1 text-[10px] font-black text-[var(--color-text-secondary)]">
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
                          className="grid h-16 place-items-center text-[10px] font-black"
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
                          <span className="block truncate text-[10px] text-[var(--color-text-tertiary)]">
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
                          <span className="block truncate font-mono text-[11px] opacity-75">
                            {item.hex} over {item.backgroundHex}
                          </span>
                        </span>
                        <span className="text-[10px] font-black">
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
                        className="grid h-14 place-items-center text-[10px] font-black"
                        style={{
                          background: item.hex,
                          color: item.recommendedText,
                        }}
                      >
                        {item.status}
                      </span>
                      <span className="block p-1 text-[10px] font-black text-[var(--color-text-secondary)]">
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
