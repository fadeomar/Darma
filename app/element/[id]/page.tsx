// app/element/[id]/page.tsx
import PreviewPage from "./PreviewPage";
import { CodeElement } from "@/types";
import { Metadata } from "next";

// Server-side metadata generation for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params; // Await the params Promise
  const id = resolvedParams.id;
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/elements/${id}`); // Adjust URL as needed
  if (!response.ok) {
    return {
      title: "Element not found",
      description: "The element you are looking for does not exist.",
    };
  }
  const element: CodeElement = await response.json();
  return {
    title: element.title,
    description: element.description,
    openGraph: {
      title: element.title,
      description: element.description,
      type: "website",
    },
  };
}

// Server-side page component
export default async function ElementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params; // Await the params Promise

  const id = resolvedParams.id;
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/elements/${id}`); // Adjust URL as needed
  let element: CodeElement | null = null;
  let error: string | null = null;

  if (response.ok) {
    element = await response.json();
  } else {
    error = "Failed to fetch element";
  }

  return <PreviewPage initialElement={element} error={error} />;
}
