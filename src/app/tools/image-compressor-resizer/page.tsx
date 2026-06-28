import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import { NextToolSuggestions } from "@/features/tools/components/NextToolSuggestions";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("image-compressor-resizer");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const ImageCompressorClient = dynamic(
  () => import("./ImageCompressorClient"),
  {
    loading: () => (
      <div className="h-[480px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />
    ),
  },
);

const Article = dynamic(() => import("./Article"));

export default function ImageCompressorPage() {
  const tool = getToolRegistry().getById("image-compressor-resizer");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Compress, resize, and convert JPG, PNG, and WebP images in your browser — one at a
          time or up to 20 in batch. Download individually or as a ZIP. No upload, no signup,
          no watermark.
        </p>
      }
      article={<Article />}
      related={
        <NextToolSuggestions
          toolIds={[
            "image-converter",
            "favicon-app-icon-generator",
            "aspect-ratio-calculator",
            "responsive-image-srcset-generator",
            "og-image-generator",
          ]}
        />
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ImageCompressorClient />
    </ToolPage>
  );
}
