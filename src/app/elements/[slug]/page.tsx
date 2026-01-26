// src/app/elements/[slug]/page.tsx

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ElementPreviewShell from "@/components/element/ElementPreviewShell";
import { getPublicElementBySlugDTO } from "@/server/services/element.service";
import {
  buildElementMetadata,
  buildNotFoundMetadata,
} from "@/app/_helpers/elementPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const element = await getPublicElementBySlugDTO(slug);
  if (!element) return buildNotFoundMetadata();

  return buildElementMetadata(element);
}

export default async function ElementBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const element = await getPublicElementBySlugDTO(slug);
  if (!element) notFound();

  return <ElementPreviewShell element={element} />;
}
