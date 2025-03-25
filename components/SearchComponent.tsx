"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CodeElement } from "@/types";

export default function SearchComponent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [exactMatch, setExactMatch] = useState(false);
  const [elements, setElements] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const isCategoryPage = pathname.startsWith("/categories/");
  const slugMainCat = isCategoryPage ? pathname.split("/")[2] : null;

  const fetchElements = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", currentPage.toString());
    params.set("pageSize", itemsPerPage.toString());
    params.set("exactMatch", exactMatch.toString());

    const mainCatFromQuery = searchParams.get("mainCat");
    if (!mainCatFromQuery && slugMainCat) {
      params.set("mainCat", slugMainCat);
    }

    const response = await fetch(`/api/search?${params.toString()}`);
    const { elements: newElements, total } = await response.json();
    setElements(newElements);
    setTotalItems(total);
    setIsLoading(false);
  }, [searchParams, currentPage, exactMatch, slugMainCat]); // Dependencies included

  useEffect(() => {
    fetchElements();
  }, [fetchElements]); // fetchElements is now a dependency

  const handleToggle = () => {
    setExactMatch((prev) => !prev);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("exactMatch", (!exactMatch).toString());
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      <button onClick={handleToggle}>
        {exactMatch ? "Switch to Broad Match" : "Switch to Exact Match"}
      </button>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {elements.map((element: CodeElement) => (
            <li key={element.id}>
              {element.title} (Main: {element.mainCategory.join(", ")}, Sec:{" "}
              {element.secondaryCategory.join(", ")})
            </li>
          ))}
        </ul>
      )}

      <div>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {Math.ceil(totalItems / itemsPerPage)}
        </span>
        <button
          disabled={currentPage * itemsPerPage >= totalItems}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>

      {isCategoryPage && (
        <p>Category Page: Filtering by mainCat &quot;{slugMainCat}&quot;</p>
      )}
    </div>
  );
}
