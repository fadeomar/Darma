import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getToolRegistry } from "@/features/tools";
import { buildToolMetadata } from "@/features/tools/seo";
import { ToolPage } from "@/features/tools/layouts";

export async function generateMetadata(): Promise<Metadata> {
  const tool = getToolRegistry().getById("timestamp-converter");
  if (!tool) return {};
  return buildToolMetadata(tool);
}

const TimestampConverterClient = dynamic(() => import("./TimestampConverterClient"));
const Article = dynamic(() => import("./Article"));

export default function TimestampConverterPage() {
  const tool = getToolRegistry().getById("timestamp-converter");
  if (!tool) notFound();
  return (
    <ToolPage tool={tool} article={<Article />}>
      <TimestampConverterClient />
    </ToolPage>
  );
}
