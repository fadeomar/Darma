// src/app/element/[id]/page.tsx

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ElementPreviewShell from "@/components/element/ElementPreviewShell";
import { getDiscoveryRecommendations } from "@/features/discovery/server/getDiscoveryRecommendations";
import { toElementCoreEntity } from "@/features/elements/lib/elementCoreAdapter";
import { getPublicElementByIdDTO } from "@/server/services/element.service";
import {
  buildElementMetadata,
  buildNotFoundMetadata,
} from "@/app/_helpers/elementPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const element = await getPublicElementByIdDTO(id);
  if (!element) return buildNotFoundMetadata();

  // Canonical will prefer /elements/[slug] if element.slug exists.
  return buildElementMetadata(element);
}

export default async function ElementByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const element = await getPublicElementByIdDTO(id);
  if (!element) notFound();

  const recommendations = getDiscoveryRecommendations(toElementCoreEntity(element), {
    limit: 6,
    kinds: ["tool", "workflow", "project"],
  });

  return <ElementPreviewShell element={element} recommendations={recommendations} />;
}
