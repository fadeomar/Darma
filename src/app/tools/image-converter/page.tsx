import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { NextToolSuggestions } from "@/features/tools/components/NextToolSuggestions";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("image-converter");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const ImageConverterClient = dynamic(() => import("./ImageConverterClient"));
const Article = dynamic(() => import("./Article"));

export default function ImageConverterPage() {
  const tool = getToolRegistry().getById("image-converter");
  if (!tool) notFound();
  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      article={<Article />}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
          Convert, resize, and compress images locally in your browser. Useful
          for creator assets, website images, product photos, profile pictures,
          and lightweight files for sharing.
        </p>
      }
      related={<NextToolSuggestions toolIds={["qr-code", "color-palette-generator", "responsive-image-srcset-generator", "text-cleaner"]} />}
    >
      <ImageConverterClient />
    </ToolPage>
  );
}
