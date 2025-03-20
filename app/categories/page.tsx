import Link from "next/link";
import Card from "@/components/TestCard";
import categoriesData from "@/data/category.json";
import { Category, CodeElement } from "@/types";

async function fetchElementsByCategory(categoryName: string, limit: number) {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/search?mainCat=${categoryName}&page=1&pageSize=${limit}`
    );
    const { data } = await response.json();
    return data as CodeElement[];
  } catch (error) {
    console.error("Failed to fetch elements:", error);
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await Promise.all(
    categoriesData.categories.map(async (category) => ({
      category: category as Category,
      elements: await fetchElementsByCategory(category.name, 3),
    }))
  );

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
              <Card key={element.id} element={element} status="preview" />
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
