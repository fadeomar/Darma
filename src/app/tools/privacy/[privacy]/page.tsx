import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolCollectionPage } from "@/features/tools/collections/CollectionPage";
import { buildCollectionMetadata, getCollectionTools } from "@/features/tools/collections";
import { getToolRegistry } from "@/features/tools/registry";

export async function generateMetadata({ params }: { params: Promise<{ privacy: string }> }): Promise<Metadata> {
  const { privacy } = await params;
  const tools = getCollectionTools(getToolRegistry().list(), "privacy", privacy);
  if (!tools.length) return {};
  return buildCollectionMetadata("privacy", privacy, tools.length);
}

export default async function PrivacyToolsPage({ params }: { params: Promise<{ privacy: string }> }) {
  const { privacy } = await params;
  const allTools = getToolRegistry().list().filter((tool) => tool.visibility === "public");
  const tools = getCollectionTools(allTools, "privacy", privacy);
  if (!tools.length) notFound();
  return <ToolCollectionPage kind="privacy" slug={privacy} tools={tools} allTools={allTools} />;
}
