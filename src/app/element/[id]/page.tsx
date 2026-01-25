// src/app/element/[id]/page.tsx

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PreviewPage from "./PreviewPage";
import { getPublicElementByIdDTO } from "@/server/services/element.service";
import type { ElementDTO } from "@/features/projects/dto/element.dto";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const element = await getPublicElementByIdDTO(id);

  if (!element) {
    return {
      title: "Element not found",
      description: "The element you are looking for does not exist.",
    };
  }

  return {
    title: element.title,
    description: element.description ?? "",
    openGraph: {
      title: element.title,
      description: element.description ?? "",
      type: "website",
    },
  };
}

export default async function ElementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const element = await getPublicElementByIdDTO(id);

  if (!element) notFound();

  // Keep PreviewPage contract intact (it previously used CodeElement).
  // If PreviewPage expects Date objects, convert there instead.
  return (
    <PreviewPage
      initialElement={element as unknown as ElementDTO}
      error={null}
    />
  );
}
