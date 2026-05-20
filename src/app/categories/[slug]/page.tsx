import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  const values = Array.isArray(param) ? param : [param];
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw || 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function findCategory(slug: string) {
  return categoriesData.categories.find((category) => category.name === slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const currentCategory = findCategory(slug);
  const categoryTitle = slug.replace(/-/g, " ");

  if (!currentCategory) {
    return {
      title: "Category not found | Darma",
      description: "The Darma category you are looking for does not exist.",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${categoryTitle} | Darma Categories`,
    description: currentCategory.description,
    alternates: { canonical: `/categories/${slug}` },
    openGraph: {
      title: `${categoryTitle} | Darma Categories`,
      description: currentCategory.description,
      type: "website",
      url: `/categories/${slug}`,
    },
  };
}

async function fetchCategoryData(slug: string, searchParams: SearchParams) {
  const q = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q ?? "";
  const selectedSecondaryCategories = normalizeFilter(searchParams.secCat);
  const currentPage = normalizePage(searchParams.page);
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
    searchQuery: q,
    error: undefined as string | undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolvedParams = await searchParams;
  const currentCategory = findCategory(slug);
  if (!currentCategory) notFound();

  let data: Awaited<ReturnType<typeof fetchCategoryData>>;

  try {
    data = await fetchCategoryData(slug, resolvedParams);
  } catch (error) {
    console.error(`Category page failed for ${slug}:`, error);
    data = {
      elementsDTO: [],
      total: 0,
      allSecondaryCategories: currentCategory.types,
      selectedSecondaryCategories: normalizeFilter(resolvedParams.secCat),
      currentPage: normalizePage(resolvedParams.page),
      searchQuery: Array.isArray(resolvedParams.q) ? resolvedParams.q[0] ?? "" : resolvedParams.q ?? "",
      error: "We could not load this category right now. Please check the database connection and migrations.",
    };
  }

  return (
    <CategoryClient
      serverElements={data.elementsDTO}
      serverTotal={data.total}
      mainCategory={slug}
      allSecondaryCategories={data.allSecondaryCategories}
      selectedSecondaryCategories={data.selectedSecondaryCategories}
      currentPage={data.currentPage}
      description={currentCategory.description}
      searchQuery={data.searchQuery}
      error={data.error}
    />
  );
}
