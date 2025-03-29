// app/categories/[slug]/page.tsx
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import CategoryClient from "./CategoryClient";
import { SearchParams } from "@/types";
import { Prisma } from "@prisma/client";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Category: ${slug} | MyApp`,
    description: `Explore items under the ${slug} category.`,
  };
}

const fetchCategoryData = async (slug: string, searchParams: SearchParams) => {
  const { q = "", page = "1" } = searchParams; // Removed secCat since we’re sorting client-side
  const pageSize = 6;
  const skip = (parseInt(page) - 1) * pageSize;

  const where: Prisma.ElementWhereInput = {
    mainCategory: { has: slug },
    deleted: false,
    ...(q.trim() && {
      OR: [
        { title: { contains: q.trim(), mode: "insensitive" as const } },
        { description: { contains: q.trim(), mode: "insensitive" as const } },
        {
          shortDescription: {
            contains: q.trim(),
            mode: "insensitive" as const,
          },
        },
        { tags: { hasSome: [q.trim()] } },
      ],
    }),
  };

  const [elements, total, allSecondaryCategories] = await Promise.all([
    prisma.element.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" }, // Simple sort by createdAt
    }),
    prisma.element.count({ where }),
    prisma.element
      .findMany({
        where: {
          mainCategory: { has: slug },
          deleted: false,
        },
        select: { secondaryCategory: true },
      })
      .then((results) =>
        Array.from(
          new Set(results.flatMap((el) => el.secondaryCategory))
        ).sort()
      ),
  ]);

  return { elements, total, allSecondaryCategories };
};

export default async function CategoryPage({ params, searchParams }: Props) {
  let isLoading = true;
  const { slug } = await params;
  const resolvedParams = await searchParams;
  const { elements, total, allSecondaryCategories } = await fetchCategoryData(
    slug,
    resolvedParams
  );
  isLoading = false;

  return (
    <CategoryClient
      serverElements={elements}
      serverTotal={total}
      mainCategory={slug}
      allSecondaryCategories={allSecondaryCategories}
      isLoading={isLoading}
    />
  );
}
