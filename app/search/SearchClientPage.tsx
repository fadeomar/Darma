"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Card from "../../components/TestCard";
import { searchFunction } from "../../utils/search";
import { CodeElement, Category } from "@/types";
import "./style.css";

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
      <div className="max-w-4xl mx-auto mb-8">
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

      {/* Category Selectors */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.slice(-20).map((category) => (
            <div
              key={category.name}
              className="group relative bg-white p-4 rounded-xl shadow-sm border border-gray-200 transition-all hover:z-10"
            >
              <button
                onClick={() => handleSelectMainCat(category.name)}
                className={`w-full text-left p-2 rounded-lg ${
                  selectedMainCats.includes(category.name)
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-50"
                } transition-colors`}
              >
                <h3 className="font-semibold text-lg flex items-center justify-between">
                  {category.name}
                  <span className="text-sm transition-transform group-hover:rotate-180">
                    ▼
                  </span>
                </h3>
              </button>

              {/* Subcategories Dropdown */}
              <div className="absolute top-full left-0 right-0 invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pt-2">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                  {category.types.map((type: string) => (
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
                      } transition-colors text-sm flex items-center gap-2`}
                    >
                      <span
                        className={`w-4 h-4 border rounded-sm flex items-center justify-center ${
                          selectedSecCats.includes(type)
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedSecCats.includes(type) && "✓"}
                      </span>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="max-w-4xl mx-auto">
        {exactMatches.length > 0 && (
          <>
            <h3 className="text-xl font-semibold mb-4">Exact Matches</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {exactMatches.slice(-20).map((element: CodeElement) => (
                <Card key={element.id} element={element} />
              ))}
            </div>
          </>
        )}

        {relatedMatches.length > 0 && (
          <>
            <h3 className="text-xl font-semibold mb-4">Related Matches</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedMatches.slice(-20).map((element: CodeElement) => (
                <Card key={element.id} element={element} />
              ))}
            </div>
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
