import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { NextToolSuggestions } from "@/features/tools/components/NextToolSuggestions";
import { getToolRegistry } from "@/features/tools";
import { ToolPage } from "@/features/tools/layouts";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("qr-code");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const QRCodeClient = dynamic(() => import("./QRCodeClient"), {
  loading: () => (
    <div className="min-h-[720px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]" />
  ),
});
const Article = dynamic(() => import("./Article"));

export default function QRCodePage() {
  const tool = getToolRegistry().getById("qr-code");
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      eyebrow="Scan-ready QR production studio"
      headerSize="compact"
      intro={
        <div className="space-y-3">
          <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
            Build QR codes for links, WiFi, messages, contacts, locations, and events.
            Review contrast and payload density, import editable projects, and export
            production artwork plus implementation files without uploading your data.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="soft">Client-side</Badge>
            <Badge variant="soft">JSON project import</Badge>
            <Badge variant="soft">Contrast audit</Badge>
            <Badge variant="soft">PNG · SVG · React · ZIP</Badge>
          </div>
        </div>
      }
      article={
        <ToolContentCard title="QR code reliability, exports, and production workflow">
          <Article />
        </ToolContentCard>
      }
      related={
        <NextToolSuggestions toolIds={["favicon-app-icon-generator", "og-image-generator", "meta-tag-generator", "image-converter"]} />
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <QRCodeClient />
    </ToolPage>
  );
}
