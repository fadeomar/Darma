import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("color-converter");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const ColorConverterClient = dynamic(() => import("./ColorConverterClient"), { ssr: false });
const Article = dynamic(() => import("./Article"));

export default function ColorConverterPage() {
  const tool = getToolRegistry().getById("color-converter");
  if (!tool) notFound();
  return (
    <ToolPage tool={tool} article={<Article />}>
      <ColorConverterClient />
    </ToolPage>
  );
}
