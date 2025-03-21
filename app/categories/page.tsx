import Link from "next/link";
import categoriesData from "@/data/category.json";
import { Metadata } from "next";

// Generate metadata for the categories page
export const metadata: Metadata = {
  title: "All Code Categories | YourSite",
  description: "Browse our collection of code categories and components.",
  alternates: {
    canonical: "https://yoursite.com/categories",
  },
  openGraph: {
    title: "Code Categories | YourSite",
    description: "Explore our library of code components by category.",
    images: [{ url: "/og-images/categories.jpg" }],
  },
};

export default function CategoriesPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">All Categories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoriesData.categories.map((category) => (
          <Link
            key={category.name}
            href={`/categories/${category.name}`}
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2 capitalize">
              {category.name.replace("-", " ")}
            </h2>
            <p className="text-gray-600 mb-4">{category.description}</p>
            <div className="flex flex-wrap gap-2">
              {category.types.map((type) => (
                <span
                  key={type}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {type}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
