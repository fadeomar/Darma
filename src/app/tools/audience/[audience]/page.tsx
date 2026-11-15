import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolCollectionPage } from "@/features/tools/collections/CollectionPage";
import { buildCollectionMetadata, getCollectionTools } from "@/features/tools/collections";
import { getToolRegistry } from "@/features/tools/registry";

export async function generateMetadata({ params }: { params: Promise<{ audience: string }> }): Promise<Metadata> {
  const { audience } = await params;
  const tools = getCollectionTools(getToolRegistry().list(), "audience", audience);
  if (!tools.length) return {};
  return buildCollectionMetadata("audience", audience, tools.length);
}

export default async function AudienceToolsPage({ params }: { params: Promise<{ audience: string }> }) {
  const { audience } = await params;
  const allTools = getToolRegistry().list().filter((tool) => tool.visibility === "public");
  const tools = getCollectionTools(allTools, "audience", audience);
  if (!tools.length) notFound();
  return <ToolCollectionPage kind="audience" slug={audience} tools={tools} allTools={allTools} />;
}
