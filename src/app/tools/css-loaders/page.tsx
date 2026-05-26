import { notFound } from "next/navigation";
import { ToolPage } from "@/features/tools/layouts";
import { getToolRegistry } from "@/features/tools/registry";
import { buildToolJsonLd, buildToolMetadata } from "@/features/tools/seo";
import CssLoadersClient from "./CssLoadersClient";
import Article from "./Article";
import "./styles.css";

const tool = getToolRegistry().getById("css-loaders");

export const metadata = tool ? buildToolMetadata(tool) : {};

export default function CssLoadersPage() {
  if (!tool) notFound();

  const jsonLd = buildToolJsonLd(tool);

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      eyebrow="CSS gallery"
      headerSize="compact"
      article={<Article />}
      intro={
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      }
    >
      <CssLoadersClient />
    </ToolPage>
  );
}
