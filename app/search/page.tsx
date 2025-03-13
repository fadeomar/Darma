// app/page.tsx (Server Component)
import { Metadata } from "next";
import elements from "../../data/elements.json";
import categories from "../../data/category.json";
import { CodeElement, Category } from "@/types";
import SearchClientPage from "./SearchClientPage";

export const metadata: Metadata = {
  title: "Code Elements Search",
  description: "Search through our collection of reusable code components",
  openGraph: {
    title: "Code Elements Library",
    description: "Find and reuse code components for your projects",
    url: "https://yourdomain.com",
    images: [{ url: "/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export async function generateStaticParams() {
  return categories.categories.map((category) => ({
    category: category.name.toLowerCase().replace(/\s+/g, "-"),
  }));
}

export default function Home() {
  return (
    <SearchClientPage
      elements={elements.elements as CodeElement[]}
      categories={categories.categories as Category[]}
    />
  );
}
