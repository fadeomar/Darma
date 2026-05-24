import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolCollectionPage } from "@/features/tools/collections/CollectionPage";
import { buildCollectionMetadata, getCollectionTools } from "@/features/tools/collections";
import { getToolRegistry } from "@/features/tools/registry";

export function generateMetadata({ params }: { params: { privacy: string } }): Metadata {
  const tools = getCollectionTools(getToolRegistry().list(), "privacy", params.privacy);
  if (!tools.length) return {};
  return buildCollectionMetadata("privacy", params.privacy, tools.length);
}

export default function PrivacyToolsPage({ params }: { params: { privacy: string } }) {
  const allTools = getToolRegistry().list().filter((tool) => tool.visibility === "public");
  const tools = getCollectionTools(allTools, "privacy", params.privacy);
  if (!tools.length) notFound();
  return <ToolCollectionPage kind="privacy" slug={params.privacy} tools={tools} allTools={allTools} />;
}
