import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolCollectionPage } from "@/features/tools/collections/CollectionPage";
import { buildCollectionMetadata, getCollectionTools } from "@/features/tools/collections";
import { getToolRegistry } from "@/features/tools/registry";

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const tools = getCollectionTools(getToolRegistry().list(), "category", params.category);
  if (!tools.length) return {};
  return buildCollectionMetadata("category", params.category, tools.length);
}

export default function CategoryToolsPage({ params }: { params: { category: string } }) {
  const allTools = getToolRegistry().list().filter((tool) => tool.visibility === "public");
  const tools = getCollectionTools(allTools, "category", params.category);
  if (!tools.length) notFound();
  return <ToolCollectionPage kind="category" slug={params.category} tools={tools} allTools={allTools} />;
}
