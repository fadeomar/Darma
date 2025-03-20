import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import categoriesData from "@/data/category.json";
import elementsData from "@/data/elements.json";
import { CodeElement } from "@/types";

import CardsPagination from "@/components/CardsPagination";

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;

  // Find the main or secondary category
  const mainCategory = categoriesData.categories.find((c) => c.name === slug);
  const secondaryCategory = categoriesData.categories.find((c) =>
    c.types.includes(slug)
  );

  if (!mainCategory && !secondaryCategory) return notFound();

  const currentCategory = mainCategory || secondaryCategory!;

  const elements: CodeElement[] = elementsData.elements.filter((el) =>
    mainCategory
      ? el.mainCategory.includes(slug)
      : el.secondaryCategory.includes(slug)
  );

  return (
    <div className="container mx-auto p-4">
      <BackButton />
      <h1 className="text-3xl font-bold mb-4 capitalize">
        {slug.replace("-", " ")}
      </h1>
      <p className="text-gray-600 mb-8">{currentCategory.description}</p>

      <CardsPagination elements={elements} itemsPerPage={6} itemsByRow={3} />
    </div>
  );
}
