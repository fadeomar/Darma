"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CodeElement } from "@/types";
import CategoryStructuredData from "./CategoryStructuredData";
import categoriesData from "@/data/category.json";
import CardsPagination from "@/components/CardsPagination";

interface Props {
  elements: CodeElement[];
  searchQuery: string;
  selectedSecCats: string[];
  mainCategory: string;
  isLoading: boolean;
}

export default function CategoryClient({
  elements,
  searchQuery,
  selectedSecCats,
  mainCategory,
  isLoading,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchQuery);
  const [selectedSecondaryCats, setSelectedSecondaryCats] =
    useState<string[]>(selectedSecCats);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Get all unique secondary categories
  const allSecondaryCategories = useMemo(() => {
    return [...new Set(elements.flatMap((el) => el.secondaryCategory))];
  }, [elements]);

  // Filter elements client-side
  const filteredElements = useMemo(() => {
    return elements
      .filter((el) => {
        const lowerSearch = search.toLowerCase();
        return (
          el.title.toLowerCase().includes(lowerSearch) ||
          el.description.toLowerCase().includes(lowerSearch) ||
          (el.shortDescription &&
            el.shortDescription.toLowerCase().includes(lowerSearch)) ||
          el.tags.some((tag) => tag.toLowerCase().includes(lowerSearch))
        );
      })
      .filter((el) =>
        selectedSecondaryCats.length > 0
          ? selectedSecondaryCats.some((cat) =>
              el.secondaryCategory.includes(cat)
            )
          : true
      )
      .sort((a, b) => {
        const aMatches = a.secondaryCategory.filter((cat) =>
          selectedSecondaryCats.includes(cat)
        ).length;
        const bMatches = b.secondaryCategory.filter((cat) =>
          selectedSecondaryCats.includes(cat)
        ).length;
        return bMatches - aMatches;
      });
  }, [elements, search, selectedSecondaryCats]);

  // Function to update URL (called explicitly, not in useEffect)
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedSecondaryCats.length > 0)
      params.set("secCats", selectedSecondaryCats.join(","));
    router.push(`${pathname}?${params.toString()}`); // Use push instead of replace for explicit navigation
  };

  if (isLoading) {
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
  }

  const currentCategory = categoriesData.categories.find(
    (c) => c.name === mainCategory
  );
  const _description = currentCategory?.description;

  return (
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
            {mainCategory.replace("-", " ")}
          </h1>
        </div>

        {/* Search Input */}
        <div className="relative mb-6 flex gap-4">
          <input
            type="text"
            placeholder={`Search in ${mainCategory}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-6 py-4 rounded-xl shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <button
            onClick={applyFilters}
            className="px-6 py-4 bg-blue-500 text-white rounded-xl"
          >
            Apply Filters
          </button>
        </div>

        {/* Subcategory Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {allSecondaryCategories.map((category) => (
            <button
              key={category}
              className={`px-3 py-1 rounded border ${
                selectedSecondaryCats.includes(category)
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => {
                setSelectedSecondaryCats((prev) =>
                  prev.includes(category)
                    ? prev.filter((c) => c !== category)
                    : [...prev, category]
                );
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {_description && <p className="text-gray-600 mb-6">{_description}</p>}
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto">
        {filteredElements.length > 0 ? (
          <CardsPagination
            elements={filteredElements}
            currentPage={currentPage}
            totalPages={Math.ceil(filteredElements.length / itemsPerPage)}
            onPageChange={setCurrentPage}
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
