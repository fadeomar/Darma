import type { Metadata } from "next";
import type { ToolDefinition } from "@/features/tools/domain/tool";
import { absoluteUrl } from "./site";

export function getToolKeywords(tool: ToolDefinition) {
  return Array.from(
    new Set([
      ...(tool.keywords ?? []),
      ...tool.tags,
      ...tool.secondaryCategory,
      ...(tool.audiences ?? []),
      tool.title,
    ]),
  );
}

export function buildToolMetadata(tool: ToolDefinition): Metadata {
  const title = `${tool.title} | Darma Tools`;
  const url = absoluteUrl(tool.href);
  const keywords = getToolKeywords(tool);

  return {
    title,
    description: tool.description,
    keywords,
    alternates: {
      canonical: tool.href,
    },
    openGraph: {
      title,
      description: tool.description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description: tool.description,
    },
  };
}

export function buildToolJsonLd(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    description: tool.description,
    url: absoluteUrl(tool.href),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    keywords: getToolKeywords(tool).join(", "),
    audience: (tool.audiences ?? []).map((audience) => ({
      "@type": "Audience",
      audienceType: audience,
    })),
  };
}
