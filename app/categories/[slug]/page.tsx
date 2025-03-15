import { notFound } from "next/navigation";
import Card from "@/components/TestCard";
import BackButton from "@/components/BackButton";
import categoriesData from "@/data/category.json";
import elementsData from "@/data/elements.json";
import { CodeElement } from "@/types";

export async function generateStaticParams() {
  return categoriesData.categories.flatMap((category) => [
    { slug: category.name },
    ...category.types.map((type) => ({ slug: type })),
  ]);
}

// Update the type to reflect that params is a Promise
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Await the params to get the slug
  const { slug } = await params;

  const mainCategory = categoriesData.categories.find((c) => c.name === slug);

  const secondaryCategory = categoriesData.categories.find((c) =>
    c.types.includes(slug)
  );

  if (!mainCategory && !secondaryCategory) return notFound();

  const currentCategory = mainCategory || secondaryCategory!;
  const elements = elementsData.elements.filter((el) =>
    mainCategory
      ? (el as CodeElement).mainCategory.includes(slug)
      : (el as CodeElement).secondaryCategory.includes(slug)
  ) as CodeElement[];

  return (
    <div className="container mx-auto p-4">
      <BackButton />
      <h1 className="text-3xl font-bold mb-4 capitalize">
        {slug.replace("-", " ")}
      </h1>
      <p className="text-gray-600 mb-8">{currentCategory.description}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {elements.map((element) => (
          <Card key={element.id} element={element} />
        ))}
      </div>
    </div>
  );
}
