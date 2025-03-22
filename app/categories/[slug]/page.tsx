// app/categories/[slug]/page.tsx
import { notFound } from "next/navigation";
import categoriesData from "@/data/category.json";
import { Metadata } from "next";
import { Suspense } from "react"; // Import Suspense
import CategoryClientPage from "./CategoryPageClient";

export async function generateStaticParams() {
  const params = categoriesData.categories.flatMap((category) => [
    { slug: category.name }, // Main category
    ...category.types.map((type) => ({ slug: type })), // Secondary categories
  ]);
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const category = categoriesData.categories.find(
    (c) => c.name === slug || c.types.includes(slug)
  );

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
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  // Check if slug is a main category
  let category = categoriesData.categories.find((c) => c.name === slug);
  let preSelectedSecCat: string | null = null;

  // If not a main category, check if it's a secondary category
  if (!category) {
    for (const cat of categoriesData.categories) {
      if (cat.types.includes(slug)) {
        category = cat; // Found the parent main category
        preSelectedSecCat = slug; // Pre-select this secondary category
        break;
      }
    }
  }
  if (!category) return notFound();

  return (
    <Suspense fallback={<div>Loading category content...</div>}>
      <CategoryClientPage
        categories={categoriesData.categories}
        slug={slug}
        preSelectedSecCat={preSelectedSecCat}
      />
    </Suspense>
  );
}
