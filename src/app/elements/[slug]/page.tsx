// src/app/elements/[slug]/page.tsx

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ElementPreviewShell from "@/components/element/ElementPreviewShell";
import ElementUnavailableState from "@/components/element/ElementUnavailableState";
import { getPublicElementBySlugDTO } from "@/server/services/element.service";
import {
  buildElementMetadata,
  buildElementUnavailableMetadata,
  buildNotFoundMetadata,
  isDatabaseUnavailableError,
} from "@/app/_helpers/elementPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const element = await getPublicElementBySlugDTO(slug);
    if (!element) return buildNotFoundMetadata();

    return buildElementMetadata(element);
  } catch (error) {
    console.error("Failed to build element metadata:", error);
    return buildElementUnavailableMetadata();
  }
}

export default async function ElementBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const element = await getPublicElementBySlugDTO(slug);
    if (!element) notFound();

    return <ElementPreviewShell element={element} />;
  } catch (error) {
    console.error("Failed to render element by slug:", error);

    if (isDatabaseUnavailableError(error)) {
      return <ElementUnavailableState />;
    }

    throw error;
  }
}
