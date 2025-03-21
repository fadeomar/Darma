"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CodeElement, Category } from "@/types";
import CardsPagination from "@/components/CardsPagination";
import CategoryStructuredData from "./CategoryStructuredData";

interface CategoryClientPageProps {
  categories: Category[];
  slug: string;
}

export default function CategoryClientPage({
  categories,
  slug,
}: CategoryClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedSecCats, setSelectedSecCats] = useState<string[]>(
    searchParams.getAll("secCat") || []
  );
  const [elements, setElements] = useState<CodeElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;

  const currentCategory = categories.find((c) => c.name === slug);

  // Fetch elements from the API
  const fetchElements = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("mainCat", slug);
      if (search) params.set("q", search);
      selectedSecCats.forEach((c) => params.append("secCat", c));
      params.set("page", currentPage.toString());
      params.set("pageSize", itemsPerPage.toString());

      const response = await fetch(`/api/search?${params.toString()}`);
      const { data, total } = await response.json();
      console.log("xxxxxxxxxxxxxx", data);
      setElements(data);
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (error) {
      console.error("Failed to fetch elements:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedSecCats, currentPage, itemsPerPage, slug]);

  // Update URL with search and filter parameters
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    selectedSecCats.forEach((c) => params.append("secCat", c));

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [search, selectedSecCats, router, pathname]);

  useEffect(() => {
    const timeout = setTimeout(updateURL, 300);
    return () => clearTimeout(timeout);
  }, [updateURL]);

  useEffect(() => {
    fetchElements();
  }, [fetchElements]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Back Button and Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold capitalize">
            {slug.replace("-", " ")}
          </h1>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder={`Search in ${currentCategory?.name}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-6 py-4 rounded-xl shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>

        {/* Subcategory Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {currentCategory?.types.map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedSecCats((prev) =>
                  prev.includes(type)
                    ? prev.filter((t) => t !== type)
                    : [...prev, type]
                );
              }}
              className={`px-4 py-2 rounded-full ${
                selectedSecCats.includes(type)
                  ? "bg-blue-500 text-white"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"
              } transition-colors`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Category Description */}
        {currentCategory?.description && (
          <p className="text-gray-600 mb-6">{currentCategory.description}</p>
        )}
      </div>

      {/* Results Grid */}
      <div className="max-w-7xl mx-auto">
        {elements.length > 0 ? (
          <CardsPagination
            elements={elements}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsByRow={3}
          />
        ) : (
          <div className="text-center py-12 text-gray-500">
            No elements found in this category
          </div>
        )}
      </div>
      {currentCategory && <CategoryStructuredData category={currentCategory} />}
    </div>
  );
}
