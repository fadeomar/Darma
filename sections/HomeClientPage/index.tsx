// components/HomeClientPage.tsx (Client Component)
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import categories from "../../data/category.json";
import { CodeElement } from "@/types";
import CardsPagination from "@/components/CardsPagination";
import { getGradientColor } from "@/utils";

import "./style.css";

interface SearchParams {
  q?: string;
  mainCat?: string | string[];
  secCat?: string | string[];
  page?: string;
}

interface HomeClientPageProps {
  serverElements: CodeElement[];
  serverTotal: number;
  searchParams: SearchParams;
}

export default function HomeClientPage({
  serverElements,
  serverTotal,
  searchParams: initialSearchParams,
}: HomeClientPageProps) {
  const router = useRouter();
  const clientSearchParams = useSearchParams();

  // State initialization from server props
  const [elements, setElements] = useState(serverElements);
  const [totalItems, setTotalItems] = useState(serverTotal);
  const [isLoading, setIsLoading] = useState(false);

  // Get initial page from client params (URL) or server params
  const initialPage = useMemo(() => {
    const clientPage = clientSearchParams.get("page");
    const serverPage = Array.isArray(initialSearchParams.page)
      ? initialSearchParams.page[0]
      : initialSearchParams.page;
    return parseInt(clientPage || serverPage || "1", 10);
  }, [initialSearchParams.page, clientSearchParams]);

  const [currentPage, setCurrentPage] = useState(initialPage);

  // Memoized filter parameters from clientSearchParams
  const mainCats = useMemo(
    () => clientSearchParams.getAll("mainCat"),
    [clientSearchParams]
  );

  const secCats = useMemo(
    () => clientSearchParams.getAll("secCat"),
    [clientSearchParams]
  );

  const searchQuery = useMemo(
    () => clientSearchParams.get("q") || "",
    [clientSearchParams]
  );

  // Initialize localSearch with searchQuery
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const itemsPerPage = 6;

  // Fetch elements with explicit params
  const fetchElements = useCallback(
    async (
      page: number,
      query: string,
      mainCats: string[],
      secCats: string[]
    ) => {
      const controller = new AbortController();
      try {
        setIsLoading(true);
        const params = new URLSearchParams();

        if (query.trim()) params.set("q", query.trim());
        mainCats.forEach((c) => params.append("mainCat", c));
        secCats.forEach((c) => params.append("secCat", c));
        params.set("page", page.toString());
        params.set("pageSize", itemsPerPage.toString());

        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });

        const { elements: newElements, total } = await response.json();

        setElements(newElements);
        setTotalItems(total);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }

      return () => controller.abort();
    },
    []
  );

  // Handle page change and update URL
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      const params = new URLSearchParams(clientSearchParams.toString());
      params.set("page", page.toString());
      router.replace(`/?${params.toString()}`, { scroll: false });
      fetchElements(page, searchQuery, mainCats, secCats);
    },
    [clientSearchParams, router, fetchElements, searchQuery, mainCats, secCats]
  );

  // Sync localSearch with searchQuery on URL change
  useEffect(() => {
    console.log(
      "Syncing - searchQuery:",
      searchQuery,
      "localSearch:",
      localSearch
    ); // Debug
    if (searchQuery !== localSearch) {
      setLocalSearch(searchQuery);
    }
  }, [searchQuery, localSearch]);

  // Handle search input changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const params = new URLSearchParams(clientSearchParams.toString());
      const currentQuery = clientSearchParams.get("q") || "";

      if (localSearch.trim()) {
        params.set("q", localSearch.trim());
      } else {
        params.delete("q");
      }

      if (localSearch.trim() !== currentQuery.trim()) {
        setCurrentPage(1);
        params.set("page", "1");
        router.replace(`/?${params.toString()}`, { scroll: false });
        fetchElements(1, localSearch.trim(), mainCats, secCats);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [
    localSearch,
    router,
    clientSearchParams,
    fetchElements,
    mainCats,
    secCats,
  ]);

  // Initial fetch or sync on URL changes
  useEffect(() => {
    const urlPage = parseInt(clientSearchParams.get("page") || "1", 10);
    const urlQuery = clientSearchParams.get("q") || "";
    console.log(
      "Fetch check - urlQuery:",
      urlQuery,
      "searchQuery:",
      searchQuery
    ); // Debug
    if (
      elements.length === 0 || // Initial load
      currentPage !== urlPage || // Page changed
      searchQuery !== urlQuery || // Search changed
      JSON.stringify(mainCats) !==
        JSON.stringify(initialSearchParams.mainCat || []) || // Main cats changed
      JSON.stringify(secCats) !==
        JSON.stringify(initialSearchParams.secCat || []) // Sec cats changed
    ) {
      fetchElements(currentPage, searchQuery, mainCats, secCats);
    }
  }, [
    currentPage,
    fetchElements,
    clientSearchParams,
    elements.length,
    searchQuery,
    mainCats,
    secCats,
    initialSearchParams.mainCat,
    initialSearchParams.secCat,
  ]);

  const handleSelectMainCat = useCallback(
    (value: string) => {
      const params = new URLSearchParams(clientSearchParams.toString());
      const currentValues = params.getAll("mainCat");

      if (currentValues.includes(value)) {
        params.delete("mainCat", value);
      } else {
        params.append("mainCat", value);
      }

      setCurrentPage(1);
      params.set("page", "1");
      router.replace(`/?${params.toString()}`, { scroll: false });
      const newMainCats = params.getAll("mainCat");
      fetchElements(1, searchQuery, newMainCats, secCats);
    },
    [clientSearchParams, router, fetchElements, searchQuery, secCats]
  );

  const handleSelectSecCat = useCallback(
    (mainCat: string, type: string) => {
      const params = new URLSearchParams(clientSearchParams.toString());

      if (params.getAll("secCat").includes(type)) {
        params.delete("secCat", type);
      } else {
        params.append("secCat", type);
      }

      if (!params.getAll("mainCat").includes(mainCat)) {
        params.append("mainCat", mainCat);
      }

      setCurrentPage(1);
      params.set("page", "1");
      router.replace(`/?${params.toString()}`, { scroll: false });
      const newMainCats = params.getAll("mainCat");
      const newSecCats = params.getAll("secCat");
      fetchElements(1, searchQuery, newMainCats, newSecCats);
    },
    [clientSearchParams, router, fetchElements, searchQuery]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Search Header */}
      <div className="max-w-9xl mx-auto mb-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search elements..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
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
          {[...mainCats, ...secCats].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                if (mainCats.includes(filter)) {
                  handleSelectMainCat(filter);
                } else {
                  const mainCat = categories.categories.find((c) =>
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
        {categories.categories.map((category, index) => (
          <div
            key={category.name}
            className="category-group rounded-md relative min-w-[100px] px-1 py-0.5 shadow-lg border-2 border-white hover:border-gray-200 transition-all duration-300 hover:shadow-xl shrink"
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

            <div className="subcategories-container absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 space-y-1 mt-2">
              {category.types.map((type) => (
                <button
                  key={type}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSecCat(category.name, type);
                  }}
                  className={`w-full text-left p-2 rounded-md ${
                    secCats.includes(type)
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-50"
                  } transition-colors duration-200 text-sm flex items-center gap-2`}
                >
                  <span
                    className={`w-4 h-4 border rounded-sm flex items-center justify-center ${
                      secCats.includes(type)
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {secCats.includes(type) && (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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

      {/* Results Section */}
      <div className="max-w-7xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 uppercase">Items</h3>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(itemsPerPage)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-lg shadow-md p-6"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-40 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
          </div>
        ) : elements.length > 0 ? (
          <CardsPagination
            elements={elements}
            itemsByRow={2}
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / itemsPerPage)}
            onPageChange={handlePageChange}
          />
        ) : (
          <div className="text-center py-12 text-gray-500 uppercase">
            No elements found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}
