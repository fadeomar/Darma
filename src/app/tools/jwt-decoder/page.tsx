import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("jwt-decoder");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const JwtDecoderClient = dynamic(() => import("./JwtDecoderClient"), {
  loading: () => <div className="h-[680px] animate-pulse rounded-3xl bg-slate-100" />,
});
const Article = dynamic(() => import("./Article"));

export default function JwtDecoderPage() {
  const tool = getToolRegistry().getById("jwt-decoder");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="wide"
      intro={
        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
          Decode JWT headers and payloads locally, inspect registered claims, and copy formatted JSON with clear verification warnings.
        </p>
      }
      article={
        <ToolContentCard title="About JWT decoding and verification">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="JWT Decoder" description="Decode JSON Web Tokens in your browser without sending token data to a server.">
        <JwtDecoderClient />
      </ToolContentCard>
    </ToolPage>
  );
}
