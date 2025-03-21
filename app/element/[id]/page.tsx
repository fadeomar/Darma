// app/element/[id]/page.tsx
import PreviewPage from "./PreviewPage";
import { CodeElement } from "@/types";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  // Use absolute URL based on environment
  let baseUrl = "";
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  } else if (process.env.VERCEL_URL) {
    baseUrl = process.env.VERCEL_URL;
  } else {
    baseUrl = "http://localhost:3000";
  }

  const apiUrl = `${baseUrl}/api/elements/${id}`;
  const response = await fetch(apiUrl, { cache: "no-store" });
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

export default async function ElementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  let baseUrl = "";
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  } else if (process.env.VERCEL_URL) {
    baseUrl = process.env.VERCEL_URL;
  } else {
    baseUrl = "http://localhost:3000";
  }

  console.log("NEXT_PUBLIC_BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL);
  console.log("VERCEL_URL:", process.env.VERCEL_URL);
  // console.log("Resolved baseUrl:", baseUrl);

  const apiUrl = `${baseUrl}/api/elements/${id}`;
  const response = await fetch(apiUrl, { cache: "no-store" });
  let element: CodeElement | null = null;
  let error: string | null = null;

  if (response.ok) {
    element = await response.json();
  } else {
    error = "Failed to fetch element";
    console.error("Fetch failed:", response.status, response.statusText);
  }

  return <PreviewPage initialElement={element} error={error} />;
}
