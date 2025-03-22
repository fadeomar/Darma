"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CodeElement, Category } from "@/types";
import CardsPagination from "@/components/CardsPagination";
import CategoryStructuredData from "./CategoryStructuredData";

interface CategoryClientPageProps {
  categories: Category[];
  slug: string;
  preSelectedSecCat?: string | null;
}

export default function CategoryClientPage({
  categories,
  slug,
}: CategoryClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state for real-time input updates
  const [localSearch, setLocalSearch] = useState(searchParams.get("q") || "");
  const [elements, setElements] = useState<CodeElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;

  const currentCategory = categories.find((c) => c.name === slug);
  const selectedSecCats = useMemo(
    () => searchParams.getAll("secCat"),
    [searchParams]
  );

  // Debounce URL updates for search input
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (localSearch.trim()) {
        params.set("q", localSearch);
      } else {
        params.delete("q");
      }
      params.delete("page"); // Reset page when search changes
      router.replace(`${pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [localSearch, router, pathname, searchParams]);

  // Reset to first page when filters or search change
  const q = searchParams.get("q");
  useEffect(() => {
    setCurrentPage(1);
  }, [q, selectedSecCats]);

  // Fetch elements from the API
  const fetchElements = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      params.set("mainCat", slug);
      if (q) params.set("q", q);
      selectedSecCats.forEach((c) => params.append("secCat", c));
      params.set("page", currentPage.toString());
      params.set("pageSize", itemsPerPage.toString());

      const response = await fetch(`/api/search?${params.toString()}`);
      const { elements: newElements, total } = await response.json();

      // Update elements only if they changed
      setElements((prev) =>
        JSON.stringify(prev) === JSON.stringify(newElements)
          ? prev
          : newElements
      );
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (error) {
      console.error("Failed to fetch elements:", error);
    } finally {
      setIsLoading(false);
    }
  }, [slug, q, selectedSecCats, currentPage]);

  // Trigger fetch when dependencies change
  useEffect(() => {
    fetchElements();
  }, [fetchElements]);

  // Handle category filter selection
  const handleSelectSecCat = (type: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const currentSecCats = newParams.getAll("secCat");

    if (currentSecCats.includes(type)) {
      newParams.delete("secCat", type);
    } else {
      newParams.append("secCat", type);
    }

    router.replace(`${pathname}?${newParams.toString()}`);
  };

  // Loading state
  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded-xl"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
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

          {/* Search Input with local state */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder={`Search in ${currentCategory?.name}...`}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full px-6 py-4 rounded-xl shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>

          {/* Subcategory Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {currentCategory?.types.map((type) => (
              <button
                key={type}
                onClick={() => handleSelectSecCat(type)}
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

          {currentCategory?.description && (
            <p className="text-gray-600 mb-6">{currentCategory.description}</p>
          )}
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto">
          {elements.length > 0 ? (
            <CardsPagination
              elements={elements}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsByRow={3}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              No elements found in this category
            </div>
          )}
        </div>
        {currentCategory && (
          <CategoryStructuredData category={currentCategory} />
        )}
      </div>
    </>
  );
}
