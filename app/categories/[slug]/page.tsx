import { Metadata } from "next";
import prisma from "@/lib/prisma";
import CategoryClient from "./CategoryClient";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ search?: string; secCats?: string }>;
}

// Metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: `Category: ${slug} | MyApp`,
    description: `Explore items under the ${slug} category.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  let isLoading = true;
  const pp = await params;
  const { slug } = pp;
  const ss = await searchParams;
  const searchQuery = ss.search || "";
  const selectedSecCats = ss.secCats ? ss.secCats?.split(",") : [];

  // Fetch all elements for the main category
  const elements = await prisma.element.findMany({
    where: {
      mainCategory: {
        has: slug, // Ensure the item belongs to this main category
      },
      deleted: false, // Ignore deleted items
    },
  });
  isLoading = false;
  return (
    <CategoryClient
      elements={elements}
      searchQuery={searchQuery}
      selectedSecCats={selectedSecCats}
      mainCategory={slug}
      isLoading={isLoading}
    />
  );
}
