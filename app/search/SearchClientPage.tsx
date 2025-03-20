"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { searchFunction } from "../../utils/search";
import { CodeElement, Category } from "@/types";
import "../homepage_style.css";
import CardsPagination from "@/components/CardsPagination";
import { getGradientColor } from "@/utils";

interface SearchClientPageProps {
  elements: CodeElement[];
  categories: Category[];
  initialSearch?: string;
}

export default function SearchClientPage({
  elements,
  categories,
  initialSearch,
}: SearchClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // State management
  const [search, setSearch] = useState(
    searchParams.get("q") || initialSearch || ""
  );
  const [selectedMainCats, setSelectedMainCats] = useState<string[]>(
    searchParams.getAll("mainCat") || []
  );
  const [selectedSecCats, setSelectedSecCats] = useState<string[]>(
    searchParams.getAll("secCat") || []
  );

  // Debounce and update URL
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (search && search !== initialSearch) params.set("q", search);
    selectedMainCats.forEach((c) => params.append("mainCat", c));
    selectedSecCats.forEach((c) => params.append("secCat", c));

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    search,
    initialSearch,
    selectedMainCats,
    selectedSecCats,
    router,
    pathname,
  ]);
  // In your SearchClientPage
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/search/")
    ) {
      // Replace history to clean URL
      history.replaceState(null, "", `/search?${searchParams.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(updateURL, 300);
    return () => clearTimeout(timeout);
  }, [updateURL]);

  const mainCategories = categories;

  // Search results
  const { exactMatches, relatedMatches } = searchFunction({
    elements,
    searchText: search,
    selectedMainCats,
    selectedSecCats,
  });

  // Category handlers
  const handleSelectMainCat = (value: string) => {
    setSelectedMainCats((prev) =>
      prev.includes(value) ? prev.filter((n) => n !== value) : [...prev, value]
    );
  };

  const handleSelectSecCat = (mainCat: string, type: string) => {
    setSelectedSecCats((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );

    if (!selectedMainCats.includes(mainCat)) {
      setSelectedMainCats((prev) => [...prev, mainCat]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Search Header */}
      <div className="max-w-9xl mx-auto mb-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search elements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-6 py-4 rounded-xl shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <svg
            className="absolute right-4 top-4 h-6 w-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Selected Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[...selectedMainCats, ...selectedSecCats].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                if (selectedMainCats.includes(filter)) {
                  handleSelectMainCat(filter);
                } else {
                  const mainCat = categories.find((c) =>
                    c.types.includes(filter)
                  )?.name;
                  if (mainCat) handleSelectSecCat(mainCat, filter);
                }
              }}
              className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm flex items-center hover:bg-blue-200 transition-colors"
            >
              {filter}
              <span className="ml-2 text-lg">×</span>
            </button>
          ))}
        </div>
      </div>
      {/* Categories Section */}
      <div className="flex justify-center flex-wrap gap-x-2 gap-y-1 mb-[64px]">
        {mainCategories.map((category, index) => (
          <div
            key={category.name}
            className="category-group rounded-md relative min-w-[100px]  px-1 py-0.5  shadow-lg border-2 border-white hover:border-gray-200 transition-all duration-300 hover:shadow-xl shrink"
            style={{
              background: `linear-gradient(135deg, ${
                getGradientColor(index).from
              }, ${getGradientColor(index).to})`,
            }}
          >
            <button
              onClick={() => handleSelectMainCat(category.name)}
              className="w-full text-left p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
            >
              <h6 className="text-[13px] font-semibold text-lg text-white flex items-center justify-between uppercase">
                {category.name}
                <span className="ml-2 text-sm transition-transform duration-300 group-hover:rotate-180">
                  ▼
                </span>
              </h6>
            </button>

            {/* Subcategories Dropdown */}
            <div className="subcategories-container absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 space-y-1 mt-2">
              {category.types.map((type) => (
                <button
                  key={type}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSecCat(category.name, type);
                  }}
                  className={`w-full text-left p-2 rounded-md ${
                    selectedSecCats.includes(type)
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-50"
                  } transition-colors duration-200 text-sm flex items-center gap-2`}
                >
                  <span
                    className={`w-4 h-4 border rounded-sm flex items-center justify-center ${
                      selectedSecCats.includes(type)
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedSecCats.includes(type) && (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </span>
                  {type}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Results Grid */}
      <div className="max-w-7xl mx-auto">
        {exactMatches.length > 0 && (
          <>
            <h3 className="text-xl font-semibold mb-4">
              {relatedMatches.length ? "Exact Matches" : "Items"}
            </h3>
            <CardsPagination
              elements={exactMatches}
              itemsPerPage={6}
              itemsByRow={3}
            />
          </>
        )}

        {relatedMatches.length > 0 && (
          <>
            <h3 className="text-xl font-semibold mb-4">Related Matches</h3>
            <CardsPagination
              elements={relatedMatches}
              itemsPerPage={6}
              itemsByRow={3}
            />
          </>
        )}

        {exactMatches.length === 0 && relatedMatches.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No elements found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}
