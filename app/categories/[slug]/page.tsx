import { notFound } from "next/navigation";
import categoriesData from "@/data/category.json";
import { CodeElement } from "@/types";
import CategoryPageClient from "./CategoryPageClient";

async function fetchElementsByCategory(
  categoryName: string,
  page: number,
  pageSize: number,
  isMainCategory: boolean
) {
  try {
    const baseUrl = process.env.VERCEL_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/search?${
      isMainCategory ? "mainCat" : "secCat"
    }=${categoryName}&page=${page}&pageSize=${pageSize}`;
    const response = await fetch(url);
    const { data, total } = await response.json();
    return { elements: data as CodeElement[], total };
  } catch (error) {
    console.error("Failed to fetch elements:", error);
    return { elements: [], total: 0 };
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams.page;

  // Handle the case where pageParam could be string, string[], or undefined
  const pageValue = Array.isArray(pageParam)
    ? pageParam[0] // Take the first value if it's an array
    : pageParam; // Use it directly if it's a string or undefined

  const currentPage = pageValue ? parseInt(pageValue as string, 10) : 1;

  // Find the main or secondary category
  const mainCategory = categoriesData.categories.find((c) => c.name === slug);
  const secondaryCategory = categoriesData.categories.find((c) =>
    c.types.includes(slug)
  );

  if (!mainCategory && !secondaryCategory) return notFound();

  const isMainCategory = !!mainCategory; // Determine if it's a main category

  const currentCategory = secondaryCategory || mainCategory!;

  // Fetch elements for the category
  const { elements, total } = await fetchElementsByCategory(
    slug,
    currentPage,
    6,
    isMainCategory
  );

  return (
    <CategoryPageClient
      slug={slug}
      currentPage={currentPage}
      elements={elements}
      totalPages={Math.ceil(total / 6)}
      categoryDescription={currentCategory.description}
    />
  );
}
