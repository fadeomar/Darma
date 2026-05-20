import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("code-preview-tool");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const CodePreviewTool = dynamic(() => import("@/sections/CodePreviewTool"), { ssr: false });
const Article = dynamic(() => import("./Article"));

export default function CodePreviewToolPage() {
  const tool = getToolRegistry().getById("code-preview-tool");
  if (!tool) notFound();

  return (
    <ToolPage tool={tool} maxWidth="wide" headerVariant="compact" article={<Article />}>
      <CodePreviewTool />
    </ToolPage>
  );
}
