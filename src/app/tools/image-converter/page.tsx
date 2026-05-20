import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import SurfaceCard from "@/components/ui/SurfaceCard";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";

const tool = getToolRegistry().getById("image-converter");

export const metadata: Metadata = tool
  ? buildToolMetadata(tool)
  : {
      title: "Image Converter | Darma Tools",
      description: "Convert images between PNG, JPEG, and WebP locally in your browser.",
    };

const ImageConverterClient = dynamic(() => import("./ImageConverterClient"), {
  loading: () => <div className="h-[620px] animate-pulse rounded-3xl bg-slate-100" />,
});

const Article = dynamic(() => import("./Article"));

export default function ImageConverterPage() {
  if (!tool) notFound();
  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPageShell
      tool={tool}
      intro={
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Convert PNG, JPEG, and WebP files locally in your browser. Resize before
          export, choose quality for compressed formats, preview the result, and
          download without sending your image to Darma servers.
        </p>
      }
      sidebar={
        <div className="flex flex-col gap-5">
          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Best uses</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <li>Convert PNG screenshots to WebP for smaller web assets.</li>
              <li>Resize large photos before adding them to a page.</li>
              <li>Create JPEG fallbacks for CMS uploads.</li>
            </ul>
          </SurfaceCard>
          <SurfaceCard>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Privacy</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              This is a local-only tool. The file is processed with browser APIs
              and exported from your device.
            </p>
          </SurfaceCard>
        </div>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolContentCard
        title="Image converter"
        description="Upload an image, choose the output format, adjust quality or size, then download the converted file."
      >
        <ImageConverterClient />
      </ToolContentCard>
      <ToolContentCard title="About this image converter">
        <Article />
      </ToolContentCard>
    </ToolPageShell>
  );
}
