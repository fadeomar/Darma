"use client"; // Mark this as a Client Component

import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import CardsPagination from "@/components/CardsPagination";
import { CodeElement } from "@/types";

interface CategoryPageClientProps {
  slug: string;
  currentPage: number;
  elements: CodeElement[];
  totalPages: number;
  categoryDescription: string;
}

export default function CategoryPageClient({
  slug,
  currentPage,
  elements,
  totalPages,
  categoryDescription,
}: CategoryPageClientProps) {
  const router = useRouter();

  // Handle page change
  const handlePageChange = (page: number) => {
    // Update the URL with the new page number
    const url = new URL(window.location.href);
    url.searchParams.set("page", page.toString());
    router.push(url.toString());
  };

  return (
    <div className="container mx-auto p-4">
      <BackButton />
      <h1 className="text-3xl font-bold mb-4 capitalize">
        {slug.replace("-", " ")}
      </h1>
      <p className="text-gray-600 mb-8">{categoryDescription}</p>

      <CardsPagination
        elements={elements}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsByRow={3}
      />
    </div>
  );
}
