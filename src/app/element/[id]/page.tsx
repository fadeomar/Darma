// src/app/element/[id]/page.tsx

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ElementPreviewShell from "@/components/element/ElementPreviewShell";
import ElementUnavailableState from "@/components/element/ElementUnavailableState";
import { getPublicElementByIdDTO } from "@/server/services/element.service";
import {
  buildElementMetadata,
  buildElementUnavailableMetadata,
  buildNotFoundMetadata,
  isDatabaseUnavailableError,
} from "@/app/_helpers/elementPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const element = await getPublicElementByIdDTO(id);
    if (!element) return buildNotFoundMetadata();

    // Canonical will prefer /elements/[slug] if element.slug exists.
    return buildElementMetadata(element);
  } catch (error) {
    console.error("Failed to build element metadata:", error);
    return buildElementUnavailableMetadata();
  }
}

export default async function ElementByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const element = await getPublicElementByIdDTO(id);
    if (!element) notFound();

    return <ElementPreviewShell element={element} />;
  } catch (error) {
    console.error("Failed to render element by ID:", error);

    if (isDatabaseUnavailableError(error)) {
      return <ElementUnavailableState />;
    }

    throw error;
  }
}
