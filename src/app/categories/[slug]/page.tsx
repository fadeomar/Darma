import type { Metadata } from "next";
import { prisma } from "@/server/db/prisma";
import categoriesData from "@/data/category.json";
import type { SearchParams } from "@/types";
import type { ElementDTO } from "@/features/elements/dto/element.dto";
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
  const pageSize = 6;
  const skip = (currentPage - 1) * pageSize;

  const trimmedQuery = q.trim();

  const where = {
    mainCategory: { has: slug },
    deleted: false,
    reviewed: true,
    ...(selectedSecondaryCategories.length > 0
      ? { secondaryCategory: { hasSome: selectedSecondaryCategories } }
      : {}),
    ...(trimmedQuery
      ? {
          OR: [
            { title: { contains: trimmedQuery, mode: "insensitive" as const } },
            { description: { contains: trimmedQuery, mode: "insensitive" as const } },
            { shortDescription: { contains: trimmedQuery, mode: "insensitive" as const } },
            { tags: { hasSome: [trimmedQuery] } },
          ],
        }
      : {}),
  };

  const [elements, total, allSecondaryCategories] = await Promise.all([
    prisma.element.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.element.count({ where }),
    prisma.element
      .findMany({
        where: {
          mainCategory: { has: slug },
          deleted: false,
          reviewed: true,
        },
        select: { secondaryCategory: true },
      })
      .then((results) =>
        Array.from(new Set(results.flatMap((el) => el.secondaryCategory))).sort(),
      ),
  ]);

  const elementsDTO: ElementDTO[] = elements.map((e) => ({
    ...e,
    createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
    updatedAt: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : e.updatedAt,
  }));

  return {
    elementsDTO,
    total,
    allSecondaryCategories,
    selectedSecondaryCategories,
    currentPage,
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
