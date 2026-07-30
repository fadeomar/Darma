import type { Metadata } from "next";
import { UnifiedSearchClient, getUnifiedSearchEntities } from "@/features/search";
import "@/core/components/core-ui.css";
import "@/features/search/styles/unified-search.css";

export const metadata: Metadata = {
  title: "Search Darma | Tools, Games, Resources, and Tech Atlas",
  description: "Search across Darma tools, games, resources, learning paths, careers, workflows, glossary terms, guides, comparisons, and collections.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const initialQuery = Array.isArray(q) ? q[0] ?? "" : q ?? "";

  return <UnifiedSearchClient entities={getUnifiedSearchEntities()} initialQuery={initialQuery} />;
}
