import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import Article from "./Article";

const tool = getToolRegistry().getById("image-converter");

export const metadata = tool ? buildToolMetadata(tool) : {};

const ImageConverterClient = dynamic(() => import("./ImageConverterClient"), {
  loading: () => <div className="h-72 animate-pulse rounded-[var(--radius-xl)] bg-[var(--color-surface-muted)]" />,
});

export default function ImageConverterPage() {
  if (!tool) notFound();

  return (
    <ToolPage tool={tool} article={<Article />}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildToolJsonLd(tool)) }}
      />
      <ImageConverterClient />
    </ToolPage>
  );
}
