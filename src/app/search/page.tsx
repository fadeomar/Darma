import type { Metadata } from "next";
import { UnifiedSearchClient, getUnifiedSearchEntities } from "@/features/search";
import "@/core/components/core-ui.css";
import "@/features/search/styles/unified-search.css";

export const metadata: Metadata = {
  title: "Search Darma | Tools, Games, and Collections",
  description: "Search across Darma tools, games, and collections from one unified Core-powered discovery page.",
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const initialQuery = Array.isArray(q) ? q[0] ?? "" : q ?? "";

  return <UnifiedSearchClient entities={getUnifiedSearchEntities()} initialQuery={initialQuery} />;
}
