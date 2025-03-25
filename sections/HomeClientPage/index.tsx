"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CodeElement } from "@/types";
import CardsPagination from "@/components/CardsPagination";
import SearchComponent from "./SearchComponent";

export default function HomeClientPage({
  serverElements,
  serverTotal,
}: // searchParams,
{
  serverElements: CodeElement[];
  serverTotal: number;
  // searchParams: Record<string, string>;
}) {
  const router = useRouter();
  const clientSearchParams = useSearchParams();

  const [elements, setElements] = useState(serverElements);
  const [totalItems, setTotalItems] = useState(serverTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState(
    clientSearchParams.get("q") || ""
  );
  const [exactMatch, setExactMatch] = useState(
    clientSearchParams.get("exactMatch") === "true"
  );
  const [mainCats, setMainCats] = useState<string[]>(
    clientSearchParams.getAll("mainCat")
  );
  const [secCats, setSecCats] = useState<string[]>(
    clientSearchParams.getAll("secCat")
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(clientSearchParams.get("page") || "1", 10)
  );

  const itemsPerPage = 6;

  const fetchElements = async (
    page: number,
    query: string,
    mainCats: string[],
    secCats: string[]
  ) => {
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

    try {
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      console.log("API Response:", data);
      const { elements, total } = data;
      console.log("Fetched elements:", elements);
      console.log("Total items:", total);
      setElements(elements);
      setTotalItems(total);
    } catch (error) {
      console.error("Fetch error:", error);
      setElements([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUrlParams = (
    page: number,
    query: string,
    mainCats: string[],
    secCats: string[]
  ) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    mainCats.forEach((c) => params.append("mainCat", c));
    secCats.forEach((c) => params.append("secCat", c));
    params.set("page", page.toString());
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const handleSearch = () => {
    const newPage = 1;
    setCurrentPage(newPage);
    updateUrlParams(newPage, localSearch, mainCats, secCats);
    fetchElements(newPage, localSearch, mainCats, secCats);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page); // Update the current page
    updateUrlParams(page, localSearch, mainCats, secCats); // Sync URL with current state
    fetchElements(page, localSearch, mainCats, secCats); // Fetch data for the new page
  };

  const handleCategoryChange = (
    newMainCats: string[],
    newSecCats: string[]
  ) => {
    setMainCats(newMainCats);
    setSecCats(newSecCats);
    setCurrentPage(1);
    updateUrlParams(1, localSearch, newMainCats, newSecCats);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <SearchComponent
        searchQuery={localSearch}
        setSearchQuery={setLocalSearch}
        exactMatch={exactMatch}
        setExactMatch={setExactMatch}
        mainCats={mainCats}
        secCats={secCats}
        onCategoryChange={handleCategoryChange}
        onSearch={handleSearch}
      />

      <div className="max-w-7xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 uppercase">Items</h3>
        {isLoading ? (
          <div>Loading...</div>
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
