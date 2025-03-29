"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CodeElement } from "@/types";
import CategoryStructuredData from "./CategoryStructuredData";
import categoriesData from "@/data/category.json";
import CardsPagination from "@/components/CardsPagination";
import normalizeParam from "@/utils/normalizeParam";
import SkeletonGrid from "@/components/SkeletonGrid";
import { CheckCircle, Search } from "lucide-react";
import { iconMap } from "@/components/iconMap";
interface Props {
  serverElements: CodeElement[];
  serverTotal: number;
  mainCategory: string;
  allSecondaryCategories: string[];
  isLoading: boolean;
}

export default function CategoryClient({
  serverElements,
  serverTotal,
  mainCategory,
  allSecondaryCategories,
  isLoading,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state from URL search params
  const initialSearch = searchParams.get("q") || "";
  const initialSecCats = normalizeParam(
    searchParams.get("secCat") || undefined
  );
  const initialPage = parseInt(searchParams.get("page") || "1");

  const [search, setSearch] = useState(initialSearch);
  const [selectedSecondaryCats, setSelectedSecondaryCats] =
    useState<string[]>(initialSecCats);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const itemsPerPage = 6;
  const totalPages = Math.ceil(serverTotal / itemsPerPage);

  // Function to apply filters and update URL
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (selectedSecondaryCats.length > 0)
      params.set("secCat", selectedSecondaryCats.join(","));
    if (currentPage > 1) params.set("page", currentPage.toString());

    const newUrl = `${pathname}?${params.toString()}`;
    router.push(newUrl, { scroll: false });
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  // Handle secondary category toggle
  const handleCategoryToggle = (category: string) => {
    setSelectedSecondaryCats((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    applyFilters(); // Apply immediately for pagination
  };

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
        {/* Search Bar and Button */}
        <div className="search-rainbow-border shadow-md flex items-center mb-6 rounded-md">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search in ${mainCategory}...`}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && applyFilters()}
              className="w-full p-3 pl-10 bg-transparent border-none focus:outline-none focus:ring-0 rounded transition text-base lg:text-lg"
              aria-label="Search input"
            />
          </div>
          <button
            onClick={applyFilters}
            className="p-3 text-white font-bold tracking-wide bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition rounded-r-md text-base lg:text-lg"
            aria-label="Search button"
          >
            Search
          </button>
        </div>

        {/* Subcategory Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {allSecondaryCategories.map((type, index) => (
            <button
              key={type + index}
              onClick={() => handleCategoryToggle(type)}
              className={`group relative p-1 rounded-lg transition duration-300 bg-white hover:bg-gray-100 ${
                selectedSecondaryCats.includes(type)
                  ? "rainbow-border-active text-black"
                  : "rainbow-border text-gray-800"
              }`}
            >
              {iconMap[type]?.icon || type}
              {selectedSecondaryCats.includes(type) && (
                <CheckCircle
                  fill="black"
                  className="absolute -top-1 -left-1 w-4 h-4 text-yellow-500 bg-white rounded-full"
                />
              )}
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition z-50">
                {iconMap[type]?.label || type}
              </span>
            </button>
          ))}
        </div>

        {_description && <p className="text-gray-600 mb-6">{_description}</p>}
      </div>
      {/* Results */}
      {isLoading ? (
        <SkeletonGrid count={6} />
      ) : (
        <div className="max-w-7xl mx-auto">
          {serverElements.length > 0 ? (
            <CardsPagination
              elements={serverElements}
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
      )}
      {currentCategory && <CategoryStructuredData category={currentCategory} />}
    </div>
  );
}
