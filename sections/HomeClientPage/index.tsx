"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CodeElement, SearchParams } from "@/types";
import SearchComponent from "./SearchComponent";
import CardsPagination from "@/components/CardsPagination";
import SkeletonGrid from "@/components/SkeletonGrid";

export default function HomeClientPage({
  initialElements,
  initialTotal,
  initialError,
  initialParams,
}: {
  initialElements: CodeElement[];
  initialTotal: number;
  initialError?: string;
  initialParams: SearchParams;
}) {
  const router = useRouter();

  // Local state for UI controls
  const [localSearch, setLocalSearch] = useState(initialParams.q || "");
  const [exactMatch, setExactMatch] = useState(
    initialParams.exactMatch === "true"
  );
  const [mainCats, setMainCats] = useState<string[]>(
    Array.isArray(initialParams.mainCat)
      ? initialParams.mainCat
      : initialParams.mainCat
      ? [initialParams.mainCat]
      : []
  );
  const [secCats, setSecCats] = useState<string[]>(
    Array.isArray(initialParams.secCat)
      ? initialParams.secCat
      : initialParams.secCat
      ? [initialParams.secCat]
      : []
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(initialParams.page || "1", 10)
  );
  const [isDirty, setIsDirty] = useState(false); // Tracks if params have changed

  // Data and UI states
  const [elements, setElements] = useState<CodeElement[]>(initialElements);
  const [total, setTotal] = useState(initialTotal);
  const [error, setError] = useState<string | undefined>(initialError);
  const [isLoading, setIsLoading] = useState(false);

  // Build URL parameters from current state
  const updateUrlParams = (
    page: number,
    query: string,
    mainCats: string[],
    secCats: string[],
    exactMatch: boolean
  ) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    mainCats.forEach((c) => params.append("mainCat", c));
    secCats.forEach((c) => params.append("secCat", c));
    params.set("page", page.toString());
    params.set("exactMatch", exactMatch.toString());
    router.push(`/?${params.toString()}`); // Trigger server re-render
  };

  // Handle search button click
  const handleSearch = () => {
    setIsLoading(true);
    const newPage = 1; // Reset to page 1 on new search
    setCurrentPage(newPage);
    updateUrlParams(newPage, localSearch, mainCats, secCats, exactMatch);
    setIsDirty(false); // Reset after applying changes
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setIsLoading(true);
    setCurrentPage(page);
    updateUrlParams(page, localSearch, mainCats, secCats, exactMatch);
    setIsDirty(false);
  };

  // Handle category changes (local state only)
  const handleCategoryChange = (
    newMainCats: string[],
    newSecCats: string[]
  ) => {
    setMainCats(newMainCats);
    setSecCats(newSecCats);
    setIsDirty(true); // Mark as dirty when categories change
  };

  // Sync state with server props when they change
  useEffect(() => {
    setElements(initialElements);
    setTotal(initialTotal);
    setError(initialError);
    setIsLoading(false);
    setIsDirty(false); // Reset dirty state after server update
  }, [initialElements, initialTotal, initialError]);

  // Mark as dirty when search query or exact match changes
  useEffect(() => {
    setIsDirty(true);
  }, [localSearch, exactMatch]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-500 p-2 sm:p-4 md:p-8 rounded-md">
      <SearchComponent
        searchQuery={localSearch}
        setSearchQuery={setLocalSearch}
        exactMatch={exactMatch}
        setExactMatch={setExactMatch}
        mainCats={mainCats}
        secCats={secCats}
        onCategoryChange={handleCategoryChange}
        onSearch={handleSearch}
        isLoading={isLoading}
        isDirty={isDirty}
      />

      <div className="max-w-7xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 uppercase">Items</h3>
        {isLoading ? (
          <SkeletonGrid count={9} />
        ) : error ? (
          <div className="text-center py-12 text-red-500 uppercase">
            Error: {error}
          </div>
        ) : elements.length > 0 ? (
          <CardsPagination
            elements={elements}
            itemsByRow={2}
            currentPage={currentPage}
            totalPages={Math.ceil(total / 6)}
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
