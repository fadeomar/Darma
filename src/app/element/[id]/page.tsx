// src/app/element/[id]/page.tsx

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ElementPreviewShell from "@/components/element/ElementPreviewShell";
import { getPublicElementByIdDTO } from "@/server/services/element.service";
import {
  buildElementMetadata,
  buildNotFoundMetadata,
} from "@/app/_helpers/elementPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  return <ElementPreviewShell element={element} />;
}
