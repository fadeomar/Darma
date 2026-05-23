import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolCollectionPage } from "@/features/tools/collections/CollectionPage";
import { buildCollectionMetadata, getCollectionTools } from "@/features/tools/collections";
import { getToolRegistry } from "@/features/tools/registry";

export function generateMetadata({ params }: { params: { audience: string } }): Metadata {
  const tools = getCollectionTools(getToolRegistry().list(), "audience", params.audience);
  if (!tools.length) return {};
  return buildCollectionMetadata("audience", params.audience, tools.length);
}

export default function AudienceToolsPage({ params }: { params: { audience: string } }) {
  const allTools = getToolRegistry().list().filter((tool) => tool.visibility === "public");
  const tools = getCollectionTools(allTools, "audience", params.audience);
  if (!tools.length) notFound();
  return <ToolCollectionPage kind="audience" slug={params.audience} tools={tools} allTools={allTools} />;
}
