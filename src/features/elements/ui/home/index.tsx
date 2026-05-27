
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchParams } from "@/types";
import SearchComponent from "./SearchComponent";
import CardsPagination from "@/components/CardsPagination";
import SkeletonGrid from "@/components/SkeletonGrid";
import { ElementCard } from "@/features/elements/ui";
import { formatDate, truncateText } from "@/utils";
import type { ElementDTO } from "@/features/elements/dto/element.dto";
import { trackEvent } from "@/lib/analytics/gtag";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

export default function HomeClientPage({
  initialElements,
  initialTotal,
  initialError,
  initialParams,
  basePath = "/",
}: {
  initialElements: ElementDTO[];
  initialTotal: number;
  initialError?: string;
  initialParams: SearchParams;
  basePath?: string;
}) {
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState(initialParams.q || "");
  const [exactMatch, setExactMatch] = useState(initialParams.exactMatch === "true");
  const [mainCats, setMainCats] = useState<string[]>(
    Array.isArray(initialParams.mainCat)
      ? initialParams.mainCat
      : initialParams.mainCat
        ? [initialParams.mainCat]
        : [],
  );
  const [secCats, setSecCats] = useState<string[]>(
    Array.isArray(initialParams.secCat)
      ? initialParams.secCat
      : initialParams.secCat
        ? [initialParams.secCat]
        : [],
  );
  const [currentPage, setCurrentPage] = useState(parseInt(initialParams.page || "1", 10));
  const [isDirty, setIsDirty] = useState(false);
  const [elements, setElements] = useState<ElementDTO[]>(initialElements);
  const [total, setTotal] = useState(initialTotal);
  const [error, setError] = useState<string | undefined>(initialError);
  const [isLoading, setIsLoading] = useState(false);

  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const updateUrlParams = (
    page: number,
    query: string,
    nextMainCats: string[],
    nextSecCats: string[],
    nextExactMatch: boolean,
  ) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    nextMainCats.forEach((c) => params.append("mainCat", c));
    nextSecCats.forEach((c) => params.append("secCat", c));
    params.set("page", page.toString());
    params.set("exactMatch", nextExactMatch.toString());
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleSearch = () => {
    setIsLoading(true);
    const newPage = 1;
    setCurrentPage(newPage);

    trackEvent(ANALYTICS_EVENTS.SEARCH_USED, {
      query: localSearch.trim() || "(empty)",
      exact_match: exactMatch,
      main_categories: mainCats.join(",") || "(none)",
      secondary_categories: secCats.join(",") || "(none)",
      page: newPage,
    });

    updateUrlParams(newPage, localSearch, mainCats, secCats, exactMatch);
    setIsDirty(false);
  };

  const handlePageChange = (page: number) => {
    setIsLoading(true);
    setCurrentPage(page);

    trackEvent(ANALYTICS_EVENTS.PAGINATION_CLICKED, {
      page,
      query: localSearch.trim() || "(empty)",
      exact_match: exactMatch,
    });

    updateUrlParams(page, localSearch, mainCats, secCats, exactMatch);
    setIsDirty(false);
  };

  const handleCategoryChange = (newMainCats: string[], newSecCats: string[]) => {
    setMainCats(newMainCats);
    setSecCats(newSecCats);
    setIsDirty(true);
  };

  useEffect(() => {
    setElements(initialElements);
    setTotal(initialTotal);
    setError(initialError);
    setIsLoading(false);
    setIsDirty(false);
  }, [initialElements, initialTotal, initialError]);

  useEffect(() => {
    setIsDirty(true);
  }, [localSearch, exactMatch]);

  useEffect(() => {
    if (currentPage > totalPages) {
      handlePageChange(totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  return (
    <div className="mx-auto max-w-[var(--container-wide)]">
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

      <section className="mt-6 rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">Results</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Published items</h2>
          </div>
          <p className="rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-1 text-sm font-semibold text-[var(--color-text-secondary)]">
            {total} result{total === 1 ? "" : "s"}
          </p>
        </div>

        {isLoading ? (
          <SkeletonGrid count={9} />
        ) : (
          <>
            {error ? (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-6 text-center text-sm font-semibold text-[var(--color-danger-text)]">
                Error: {error}
              </div>
            ) : null}

            {elements.length > 0 ? (
              <CardsPagination
                items={elements}
                itemsByRow={2}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                renderItem={(element) => (
                  <ElementCard
                    key={element.id}
                    element={element}
                    status="preview"
                    formatDate={formatDate}
                    truncateText={truncateText}
                  />
                )}
              />
            ) : (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-8 text-center">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">No elements found</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Try a broader keyword or remove one of the selected filters.</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
