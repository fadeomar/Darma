"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import categories from "../../data/category.json";
import { CodeElement } from "@/types";
import CardsPagination from "@/components/CardsPagination";
import { getGradientColor } from "@/utils";
import "./style.css";

// import SelectPanelSection from "./SelectPanelSection";
// import SearchComponent from "./SearchComponent";
interface SearchParams {
  q?: string;
  mainCat?: string | string[];
  secCat?: string | string[];
  page?: string;
  exactMatch?: string;
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

  const [elements, setElements] = useState(serverElements);
  const [totalItems, setTotalItems] = useState(serverTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [exactMatch, setExactMatch] = useState(
    clientSearchParams.get("exactMatch") === "true"
  );
  const [isSearchOptionsOpen, setIsSearchOptionsOpen] = useState(false);

  const initialPage = useMemo(() => {
    const clientPage = clientSearchParams.get("page");
    const serverPage = Array.isArray(initialSearchParams.page)
      ? initialSearchParams.page[0]
      : initialSearchParams.page;
    return parseInt(clientPage || serverPage || "1", 10);
  }, [initialSearchParams.page, clientSearchParams]);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [localSearch, setLocalSearch] = useState(
    clientSearchParams.get("q") || ""
  );

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

  const itemsPerPage = 6;

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
        params.set("exactMatch", exactMatch.toString());
        params.set("sort", "createdAt");
        params.set("order", "desc");

        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Fetch failed");
        const { elements, total } = await response.json();

        setElements(elements);
        setTotalItems(total);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }

      return () => controller.abort();
    },
    [exactMatch]
  );

  useEffect(() => {
    if (serverElements.length > 0) {
      setElements(serverElements);
      setTotalItems(serverTotal);
    }
  }, [serverElements, serverTotal]);

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

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams(clientSearchParams.toString());
    if (localSearch.trim()) {
      params.set("q", localSearch.trim());
    } else {
      params.delete("q");
    }
    setCurrentPage(1);
    params.set("page", "1");
    router.replace(`/?${params.toString()}`, { scroll: false });
    fetchElements(1, localSearch.trim(), mainCats, secCats);
  }, [
    clientSearchParams,
    router,
    fetchElements,
    localSearch,
    mainCats,
    secCats,
  ]);

  useEffect(() => {
    const urlPage = parseInt(clientSearchParams.get("page") || "1", 10);
    const urlQuery = clientSearchParams.get("q") || "";
    const urlExactMatch = clientSearchParams.get("exactMatch") === "true";

    if (
      elements.length === 0 ||
      currentPage !== urlPage ||
      searchQuery !== urlQuery ||
      exactMatch !== urlExactMatch ||
      JSON.stringify(mainCats) !==
        JSON.stringify(initialSearchParams.mainCat || []) ||
      JSON.stringify(secCats) !==
        JSON.stringify(initialSearchParams.secCat || []) ||
      JSON.stringify(mainCats) !==
        JSON.stringify(initialSearchParams.mainCat || []) ||
      JSON.stringify(secCats) !==
        JSON.stringify(initialSearchParams.secCat || [])
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
    exactMatch,
    initialSearchParams.mainCat,
    initialSearchParams.secCat,
  ]);

  const handleSelectMainCat = useCallback(
    (value: string) => {
      const params = new URLSearchParams(clientSearchParams.toString());
      const currentValues = params.getAll("mainCat");

      if (currentValues.includes(value)) {
        const filteredValues = currentValues.filter((v) => v !== value);
        params.delete("mainCat");
        filteredValues.forEach((v) => params.append("mainCat", v));
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

  const handleToggleExactMatch = () => {
    setExactMatch((prev) => !prev);
    setCurrentPage(1);
    const params = new URLSearchParams(clientSearchParams.toString());
    params.set("exactMatch", (!exactMatch).toString());
    params.set("page", "1");
    router.replace(`/?${params.toString()}`, { scroll: false });
    fetchElements(1, searchQuery, mainCats, secCats);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* <SearchComponent
        onCategoryChange={() => {}}
        selectedCategories={() => {}}
      /> */}
      {/* Search Header */}
      <div className="max-w-9xl mx-auto mb-2">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            placeholder="Search elements..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="flex-grow px-6 py-4 rounded-xl shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Search
          </button>
          <svg
            className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400"
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

        {/* Search Options Accordion */}
        <div className="mt-4">
          <button
            onClick={() => setIsSearchOptionsOpen((prev) => !prev)}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-t-xl flex justify-between items-center hover:bg-gray-300 transition-colors"
          >
            <span>Search Options</span>
            <span
              className={`transition-transform duration-300 ${
                isSearchOptionsOpen ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isSearchOptionsOpen ? "max-h-40" : "max-h-0"
            }`}
          >
            <div className="p-4 bg-white border border-t-0 border-gray-200 rounded-b-xl flex flex-col gap-2">
              <button
                onClick={handleToggleExactMatch}
                className="px-3 py-1 rounded-full bg-gray-200 text-gray-800 text-sm hover:bg-gray-300 transition-colors w-full text-left"
              >
                {exactMatch ? "Switch to Broad Match" : "Switch to Exact Match"}
              </button>
            </div>
          </div>
        </div>

        {/* Selected Filters */}
        {[...mainCats, ...secCats].length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 items-center">
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
        )}
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

      {/* ...rest */}
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
