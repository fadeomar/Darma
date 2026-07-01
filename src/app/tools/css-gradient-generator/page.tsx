import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Free CSS HDR Gradient Studio - OKLCH, OKLab, Layers and Fallback CSS",
  description:
    "Create modern CSS linear, radial, and conic gradients with OKLCH/OKLab color mixing, transition hints, editable layers, import, and classic fallback CSS.",
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
    title: "Free CSS HDR Gradient Studio — OKLCH, OKLab and Layers",
    description: "Design modern CSS gradients visually, stack layers, tune color stops and hints, then copy modern and fallback CSS.",
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
