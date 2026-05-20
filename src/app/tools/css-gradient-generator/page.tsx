import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("css-gradient-generator");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const CssGradientGeneratorClient = dynamic(() => import("./CssGradientGeneratorClient"), { ssr: false });
const Article = dynamic(() => import("./Article"));

export default function CssGradientGeneratorPage() {
  const tool = getToolRegistry().getById("css-gradient-generator");
  if (!tool) notFound();
  return (
    <ToolPage tool={tool} maxWidth="wide" article={<Article />}>
      <CssGradientGeneratorClient />
    </ToolPage>
  );
}
