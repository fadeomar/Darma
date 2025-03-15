import { redirect } from "next/navigation";
import { generateSlug, slugToName } from "@/utils/slug";
import categoriesArr from "../../../data/category.json";
import elementsArr from "../../../data/elements.json";
import { notFound } from "next/navigation";

// Non-exported function to get unique tags from elementsArr
async function getTags() {
  const tagsSet = new Set<string>();
  elementsArr.elements.forEach((element) => {
    element.tags.forEach((tag: string) => tagsSet.add(tag));
  });
  return Array.from(tagsSet);
}

// Function to find a main category by slug
function findCategoryBySlug(slug: string) {
  return (
    categoriesArr.categories.find(
      (category) => generateSlug(category.name) === slug
    ) || null
  );
}

// Function to find a secondary category by slug
function findSubcategoryBySlug(slug: string) {
  for (const category of categoriesArr.categories) {
    for (const subcategory of category.types) {
      if (generateSlug(subcategory) === slug) {
        return { name: subcategory, parent: category.name };
      }
    }
  }
  return null;
}

// Function to find a tag by slug
function findTagBySlug(slug: string) {
  for (const element of elementsArr.elements) {
    for (const tag of element.tags) {
      if (generateSlug(tag) === slug) {
        return { name: tag };
      }
    }
  }
  return null;
}

const isValidSlug = (slug: string) => true || slug;

export async function generateStaticParams() {
  const categories = categoriesArr.categories; // data fetching here
  const tags = await getTags();

  return [
    ...categories.map((c) => ({ slug: generateSlug(c.name) })),
    ...tags.map((t) => ({ slug: generateSlug(t) })),
  ];
}

// Fix params type and make async
export default async function SearchSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isValidSlug(slug)) {
    notFound();
  }

  // This will happen on the server side
  const searchParams = new URLSearchParams();

  // Check category matches first
  const categoryMatch = findCategoryBySlug(slug);
  if (categoryMatch) {
    searchParams.set("mainCat", categoryMatch.name);
    redirect(`/search?${searchParams.toString()}`);
  }

  // Check subcategory matches
  const subcategoryMatch = findSubcategoryBySlug(slug);
  if (subcategoryMatch) {
    searchParams.set("secCat", subcategoryMatch.name);
    redirect(`/search?${searchParams.toString()}`);
  }

  // Check tag matches
  const tagMatch = findTagBySlug(slug);
  if (tagMatch) {
    searchParams.set("q", tagMatch.name);
    redirect(`/search?${searchParams.toString()}`);
  }

  // Fallback to text search
  searchParams.set("q", slugToName(slug));
  redirect(`/search?${searchParams.toString()}`);
}
