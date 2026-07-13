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
  loading: () => <div className="h-[780px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)]" />,
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
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
          Decode JWT headers and claims locally, inspect lifecycle and security risks, optionally verify signatures with a shared secret or public JWK, and export a key-free production report.
        </p>
      }
      article={
        <ToolContentCard title="JWT decoding, verification, and production safety">
          <Article />
        </ToolContentCard>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolContentCard title="JWT Decoder & Verification Studio" description="Inspect token structure and claims without uploading data. Decode is immediate; signature verification is explicit and optional.">
        <JwtDecoderClient />
      </ToolContentCard>
    </ToolPage>
  );
}
