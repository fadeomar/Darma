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
          Compress, resize, convert, and batch-export JPG, PNG, and WebP images with
          production presets, target file sizes, side-by-side previews, and ZIP download.
          Everything runs locally in your browser — no upload, no signup, no watermark.
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
