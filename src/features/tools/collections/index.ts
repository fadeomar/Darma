import type { Metadata } from "next";
import type { ToolAudience, ToolDefinition, ToolPrivacy } from "@/features/tools/domain/tool";

export type ToolCollectionKind = "category" | "audience" | "privacy";

export function slugifyCollectionValue(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function normalizePrivacySlug(slug: string): ToolPrivacy | null {
  const map: Record<string, ToolPrivacy> = {
    local: "local-storage",
    "local-storage": "local-storage",
    browser: "client-only",
    "browser-only": "client-only",
    "client-only": "client-only",
    server: "server-assisted",
    "server-assisted": "server-assisted",
    external: "external-api",
    "external-api": "external-api",
  };
  return map[slug] ?? null;
}

export function getCollectionTools(tools: ToolDefinition[], kind: ToolCollectionKind, slug: string) {
  return tools.filter((tool) => {
    if (tool.visibility !== "public") return false;
    if (kind === "category") {
      return [...(tool.mainCategory ?? []), ...(tool.secondaryCategory ?? []), ...(tool.tags ?? [])].some((value) => slugifyCollectionValue(value) === slug);
    }
    if (kind === "audience") {
      return (tool.audiences ?? []).some((value) => slugifyCollectionValue(value) === slug);
    }
    const privacy = normalizePrivacySlug(slug);
    return Boolean(privacy && tool.privacy === privacy);
  });
}

export function collectionTitle(kind: ToolCollectionKind, slug: string) {
  const readable = slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  if (kind === "category") return `${readable} Tools`;
  if (kind === "audience") return `Tools for ${readable}`;
  return `${readable} Privacy Tools`;
}

export function collectionDescription(kind: ToolCollectionKind, slug: string, count: number) {
  const readable = slug.replace(/-/g, " ");
  if (kind === "category") return `Explore ${count} Darma tools connected to ${readable}, generated from the tools registry.`;
  if (kind === "audience") return `A focused collection of ${count} Darma tools useful for ${readable}.`;
  return `Browse ${count} Darma tools grouped by their ${readable} processing and privacy model.`;
}

export function buildCollectionMetadata(kind: ToolCollectionKind, slug: string, count: number): Metadata {
  const title = `${collectionTitle(kind, slug)} | Darma Tools`;
  const description = collectionDescription(kind, slug, count);
  return {
    title,
    description,
    alternates: { canonical: `/tools/${kind}/${slug}` },
    openGraph: { title, description, type: "website", url: `/tools/${kind}/${slug}` },
    twitter: { card: "summary", title, description },
  };
}

export function buildCollectionJsonLd(kind: ToolCollectionKind, slug: string, tools: ToolDefinition[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collectionTitle(kind, slug),
    description: collectionDescription(kind, slug, tools.length),
    hasPart: tools.map((tool) => ({ "@type": "WebApplication", name: tool.title, url: tool.href })),
  };
}

export const audienceSlugs: ToolAudience[] = ["developer", "designer", "student", "creator", "general"];
