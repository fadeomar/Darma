import Link from "next/link";
import Card from "@/components/TestCard";
import categoriesData from "@/data/category.json";
import elementsData from "@/data/elements.json";
import { Category, CodeElement } from "@/types";

export default function CategoriesPage() {
  const categories = categoriesData.categories.map((category) => ({
    category: category as Category,
    elements: elementsData.elements
      .filter((el) => (el as CodeElement).mainCategory.includes(category.name))
      .slice(0, 3) as CodeElement[],
  }));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Categories</h1>
      {categories.map(({ category, elements }) => (
        <section key={category.name} className="mb-12">
          <h2 className="text-2xl font-semibold mb-2 capitalize">
            {category.name.replace("-", " ")}
          </h2>
          <p className="text-gray-600 mb-4">{category.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {elements.map((element) => (
              <Card key={element.id} element={element} />
            ))}
          </div>
          <Link
            href={`/categories/${category.name}`}
            className="mt-4 inline-block text-blue-600 hover:underline"
            scroll={false} // Prevent full page reload
          >
            See More →
          </Link>
        </section>
      ))}
    </div>
  );
}
