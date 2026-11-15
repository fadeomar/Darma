import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolCollectionPage } from "@/features/tools/collections/CollectionPage";
import { buildCollectionMetadata, getCollectionTools } from "@/features/tools/collections";
import { getToolRegistry } from "@/features/tools/registry";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const tools = getCollectionTools(getToolRegistry().list(), "category", category);
  if (!tools.length) return {};
  return buildCollectionMetadata("category", category, tools.length);
}

export default async function CategoryToolsPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const allTools = getToolRegistry().list().filter((tool) => tool.visibility === "public");
  const tools = getCollectionTools(allTools, "category", category);
  if (!tools.length) notFound();
  return <ToolCollectionPage kind="category" slug={category} tools={tools} allTools={allTools} />;
}
