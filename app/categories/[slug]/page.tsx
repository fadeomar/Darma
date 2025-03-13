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

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const mainCategory = categoriesData.categories.find(
    (c) => c.name === params.slug
  );

  const secondaryCategory = categoriesData.categories.find((c) =>
    c.types.includes(params.slug)
  );

  if (!mainCategory && !secondaryCategory) return notFound();

  const currentCategory = mainCategory || secondaryCategory!;
  const elements = elementsData.elements.filter((el) =>
    mainCategory
      ? (el as CodeElement).mainCategory.includes(params.slug)
      : (el as CodeElement).secondaryCategory.includes(params.slug)
  ) as CodeElement[];

  return (
    <div className="container mx-auto p-4">
      <BackButton />
      <h1 className="text-3xl font-bold mb-4 capitalize">
        {params.slug.replace("-", " ")}
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
