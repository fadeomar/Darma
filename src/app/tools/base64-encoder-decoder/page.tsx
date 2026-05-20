import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("base64-encoder-decoder");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const Base64Client = dynamic(() => import("./Base64Client"));
const Article = dynamic(() => import("./Article"));

export default function Base64EncoderDecoderPage() {
  const tool = getToolRegistry().getById("base64-encoder-decoder");
  if (!tool) notFound();
  return (
    <ToolPage tool={tool} article={<Article />}>
      <Base64Client />
    </ToolPage>
  );
}
