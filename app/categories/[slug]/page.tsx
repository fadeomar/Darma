import { notFound } from "next/navigation";
import categoriesData from "@/data/category.json";
import { Metadata } from "next";
import CategoryClientPage from "./CategoryPageClient";

// Generate static paths for all categories
export async function generateStaticParams() {
  return categoriesData.categories.map((category) => ({
    slug: category.name,
  }));
}

// Generate dynamic metadata for each category
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params; // Await the params Promise
  const slug = resolvedParams.slug;
  const category = categoriesData.categories.find((c) => c.name === slug);

  if (!category) {
    return {
      title: "Category Not Found",
      description: "The requested category does not exist.",
    };
  }

  return {
    title: `${category.name} Code Snippets | YourSite`,
    description: `Browse ${category.name} code components and snippets. ${category.description}`,
    alternates: {
      canonical: `https://yoursite.com/categories/${slug}`,
    },
    openGraph: {
      title: `${category.name} Code Components | YourSite`,
      description: `Collection of ${category.name} code snippets and reusable components`,
      images: [{ url: `/og-images/${slug}.jpg` }],
    },
    keywords: [
      `${category.name} code`,
      `${category.name} components`,
      `${category.name} snippets`,
      ...category.types,
    ],
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params; // Await the params Promise

  const slug = resolvedParams.slug;
  const category = categoriesData.categories.find((c) => c.name === slug);

  if (!category) return notFound();

  return (
    <CategoryClientPage categories={categoriesData.categories} slug={slug} />
  );
}
