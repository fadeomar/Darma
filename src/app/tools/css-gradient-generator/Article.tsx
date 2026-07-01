import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Informational content shown BELOW the Gradient Studio. This is a plain server
 * component (no client hooks) and is intentionally decoupled from the studio —
 * it renders as a sibling section and never wraps or constrains the editor.
 */

const CONTROLS: { term: string; desc: string }[] = [
  { term: "Gradient type", desc: "Switch between linear, radial, and conic gradients." },
  { term: "Color space", desc: "Controls how colors blend — sRGB, OKLab, OKLCH, and more." },
  { term: "Hue path", desc: "Changes the route between hues in cylindrical color spaces." },
  { term: "Stops", desc: "Define the colors and where they land along the gradient." },
  { term: "Hints", desc: "Move the visual midpoint between two neighboring stops." },
  { term: "Layers", desc: "Stack multiple gradients for richer, layered effects." },
  { term: "Import", desc: "Paste an existing CSS gradient and edit it visually." },
  { term: "Export", desc: "Copy modern CSS, classic CSS, or Tailwind-friendly output." },
];

const RELATED_TOOLS: { title: string; href: string; desc: string }[] = [
  { title: "Color Palette Generator", href: "/tools/color-palette-generator", desc: "Build and export cohesive color palettes." },
  { title: "Color Converter", href: "/tools/color-converter", desc: "Convert between HEX, RGB, HSL, OKLCH, and more." },
  { title: "Color Shades", href: "/tools/color-shades", desc: "Generate tints and shades from a base color." },
  { title: "Box Shadows Generator", href: "/tools/box-shadows-generator", desc: "Design layered CSS box shadows visually." },
  { title: "Glassmorphism Generator", href: "/tools/glassmorphism-generator", desc: "Create frosted-glass surface styles." },
  { title: "CSS Clamp Generator", href: "/tools/css-clamp-generator", desc: "Fluid, responsive sizing with clamp()." },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is an HDR gradient?",
    a: "It is a gradient built with wide-gamut, modern CSS color spaces (like OKLCH, OKLab, Display-P3, or Rec. 2020) instead of only sRGB hex colors. On capable screens these can look more vivid and blend more smoothly than a classic sRGB gradient.",
  },
  {
    q: "Why use OKLCH or OKLab?",
    a: "These perceptual color spaces interpolate colors more evenly, so gradients avoid muddy gray midpoints and unexpected hue shifts. The result is a smoother, more predictable transition between your stops.",
  },
  {
    q: "Can I use these gradients in normal CSS?",
    a: "Yes. Copy the output and paste it into any stylesheet as a background value. For maximum compatibility, use the classic (SDR) fallback, which clips colors into sRGB so older browsers still render a valid gradient.",
  },
  {
    q: "Why does the SDR fallback look slightly different?",
    a: "The fallback maps wide-gamut colors back into the smaller sRGB range. Very saturated or out-of-gamut colors get clipped, so the fallback can appear a little less vivid than the HDR preview on a wide-gamut display.",
  },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{title}</h2>
      {children}
    </section>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-5">
      <h3 className="text-sm font-black text-[var(--color-text-primary)]">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-secondary)]">{children}</p>
    </div>
  );
}

export default function CssGradientGeneratorArticle() {
  return (
    <div className="w-full bg-[var(--color-surface-base)]">
      <div className="mx-auto w-full max-w-[1120px] space-y-14 px-4 py-16 sm:px-6">
        {/* 1) How to use */}
        <Section title="How to use the CSS HDR Gradient Studio">
          <ol className="max-w-[70ch] list-decimal space-y-2 pl-5 text-sm leading-7 text-[var(--color-text-secondary)]">
            <li>Choose a gradient type: linear, radial, or conic.</li>
            <li>Pick a color space such as OKLab or OKLCH for smoother modern color mixing.</li>
            <li>Drag the preview handles or use the controls to adjust angle, position, and color stops.</li>
            <li>Click the gradient line to add new color stops.</li>
            <li>Use HD/SDR mode to compare modern CSS output with fallback output.</li>
            <li>Copy the CSS and use it in your project.</li>
          </ol>
        </Section>

        {/* 2) What this tool creates */}
        <Section title="What this tool creates">
          <p className="max-w-[70ch] text-sm leading-7 text-[var(--color-text-secondary)]">
            The studio generates production-ready CSS gradients you can drop straight into a
            project. It is handy for a wide range of interface and brand visuals:
          </p>
          <ul className="flex max-w-[70ch] flex-wrap gap-2">
            {[
              "Website backgrounds",
              "Hero sections",
              "Cards",
              "Buttons",
              "UI surfaces",
              "Decorative glows",
              "Brand visuals",
            ].map((item) => (
              <li
                key={item}
                className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* 3) Modern CSS and fallback CSS */}
        <Section title="Modern CSS and fallback CSS">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard title="Modern CSS">
              Modern output can use color spaces like OKLab, OKLCH, Display-P3, and Rec. 2020.
              On modern screens these produce smoother, more vivid gradients with cleaner
              midpoints and fewer unwanted hue shifts.
            </InfoCard>
            <InfoCard title="Classic fallback">
              The classic fallback clips colors into sRGB so your gradient still works in
              browsers or environments that need sRGB-compatible output. Ship both for the
              best balance of quality and compatibility.
            </InfoCard>
          </div>
        </Section>

        {/* 4) Controls explained */}
        <Section title="Controls explained">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONTROLS.map((control) => (
              <InfoCard key={control.term} title={control.term}>
                {control.desc}
              </InfoCard>
            ))}
          </div>
        </Section>

        {/* 5) Tips for better gradients */}
        <Section title="Tips for better gradients">
          <ul className="max-w-[70ch] list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--color-text-secondary)]">
            <li>Use OKLCH or OKLab for smoother color transitions.</li>
            <li>Use fewer stops for clean UI backgrounds.</li>
            <li>Add one bright accent stop for a modern hero section.</li>
            <li>Use radial layers for glow effects.</li>
            <li>Check the SDR fallback if the gradient uses wide-gamut colors.</li>
            <li>Keep text contrast readable on top of gradients.</li>
          </ul>
        </Section>

        {/* 6) Related tools */}
        <Section title="Related tools">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RELATED_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-5 transition hover:border-[var(--color-primary-border)] hover:bg-[var(--color-surface-base)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <h3 className="text-sm font-black text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]">
                  {tool.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-secondary)]">{tool.desc}</p>
              </Link>
            ))}
          </div>
        </Section>

        {/* 7) FAQ */}
        <Section title="Frequently asked questions">
          <div className="space-y-3">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] p-5"
              >
                <h3 className="text-base font-black text-[var(--color-text-primary)]">{item.q}</h3>
                <p className="mt-2 max-w-[70ch] text-sm leading-7 text-[var(--color-text-secondary)]">{item.a}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
