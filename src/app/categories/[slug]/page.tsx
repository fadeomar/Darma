import type { Metadata } from "next";
import categoriesData from "@/data/category.json";
import type { SearchParams } from "@/types";
import {
  getPublicSecondaryCategories,
  searchElementsDTO,
} from "@/server/services/search.service";
import CategoryClient from "./CategoryClient";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}

function normalizeFilter(param: string | string[] | undefined): string[] {
  if (!param) return [];
  if (Array.isArray(param)) {
    return param.flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  }
  return param.split(",").map((value) => value.trim()).filter(Boolean);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const currentCategory = categoriesData.categories.find((c) => c.name === slug);
  const categoryTitle = slug.replace(/-/g, " ");

  return {
    title: `${categoryTitle} | Darma Categories`,
    description:
      currentCategory?.description ?? `Browse Darma projects in the ${categoryTitle} category.`,
  };
}

async function fetchCategoryData(slug: string, searchParams: SearchParams) {
  const { q = "", page = "1" } = searchParams;
  const selectedSecondaryCategories = normalizeFilter(searchParams.secCat);
  const currentPage = Math.max(1, Number(page || 1));
  const trimmedQuery = q.trim();
  const [searchResult, allSecondaryCategories] = await Promise.all([
    searchElementsDTO({
      q: trimmedQuery,
      mainCategory: [slug],
      secondaryCategory: selectedSecondaryCategories,
      page: currentPage,
      pageSize: 6,
      sort: "newest",
      visibility: "public",
      includeShortDescription: true,
    }),
    getPublicSecondaryCategories(slug),
  ]);

  return {
    elementsDTO: searchResult.items,
    total: searchResult.total,
    allSecondaryCategories,
    selectedSecondaryCategories,
    currentPage: searchResult.page,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolvedParams = await searchParams;
  const currentCategory = categoriesData.categories.find((c) => c.name === slug);
  const { elementsDTO, total, allSecondaryCategories, selectedSecondaryCategories, currentPage } =
    await fetchCategoryData(slug, resolvedParams);

  return (
    <CategoryClient
      serverElements={elementsDTO}
      serverTotal={total}
      mainCategory={slug}
      allSecondaryCategories={allSecondaryCategories}
      selectedSecondaryCategories={selectedSecondaryCategories}
      currentPage={currentPage}
      description={currentCategory?.description}
      searchQuery={resolvedParams.q || ""}
    />
  );
}
