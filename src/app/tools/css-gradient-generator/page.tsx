import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Free CSS Gradient Generator - OKLCH, Layers, Fallback CSS and Design Tokens",
  description:
    "Create production-ready CSS linear, radial, and conic gradients with OKLCH/OKLab color mixing, editable layers, fallback CSS, CSS variables, React style, and token exports.",
  keywords: [
    "css gradient generator",
    "oklch gradient generator",
    "oklab gradient generator",
    "css hdr gradient",
    "linear gradient generator",
    "radial gradient generator",
    "conic gradient generator",
    "css color 4",
    "css color 5",
    "gradient layers",
    "color stops",
  ],
  openGraph: {
    title: "Free CSS Gradient Generator — OKLCH, Layers and Production Exports",
    description: "Design modern CSS gradients visually, stack layers, tune color stops and hints, then copy fallback CSS, CSS variables, React style, and design tokens.",
  },
};

const CssGradientGeneratorClient = dynamic(() => import("./CssGradientGeneratorClient"), {
  loading: () => <div className="min-h-[calc(100dvh-74px)] animate-pulse bg-[var(--color-surface-subtle)]" />,
});

const Article = dynamic(() => import("./Article"));

export default function CssGradientGeneratorPage() {
  return (
    <>
      <CssGradientGeneratorClient />
      <Article />
    </>
  );
}
